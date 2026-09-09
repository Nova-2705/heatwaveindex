"""
Dynamic Forecasting Mock Service with Background Scheduler.
Simulates realistic 5-day rolling meteorological and physiological vectors
(120 hours) for West Bengal wards (Kolkata, Howrah, Asansol).
"""
import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from ward_data import WEST_BENGAL_WARDS, WEST_BENGAL_ASSETS, resolve_ward_id
from thermal_service import calculate_thermal_stress, classify_hazard_tier


class ForecastStore:
    """In-memory reactive forecast cache with simulated continuous meteorological drift."""
    def __init__(self):
        self.ward_forecasts: Dict[str, Dict[str, Any]] = {}
        self.last_updated: datetime = datetime.now(timezone.utc)
        self.simulation_step: int = 0
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None

    def initialize(self):
        """Populate initial 5-day rolling forecasts for all wards."""
        for ward_id in WEST_BENGAL_WARDS:
            self.regenerate_ward_forecast(ward_id, drift_seed=0.0)
        self.last_updated = datetime.now(timezone.utc)

    def regenerate_ward_forecast(self, ward_id: str, drift_seed: float = 0.0) -> Dict[str, Any]:
        """Generate 5-day (120 hour) multi-temporal and hourly forecast vector."""
        ward_meta = WEST_BENGAL_WARDS[ward_id]
        mclimate = ward_meta["microclimate"]
        base_temp = mclimate["base_temp"] + drift_seed
        uhi = mclimate["uhi_factor"]
        hum_offset = mclimate["humidity_offset"]
        wind_factor = mclimate["wind_factor"]

        hourly_list: List[Dict[str, Any]] = []
        daily_summaries: Dict[str, Dict[str, Any]] = {}

        # Pre-accumulators for day-level multi-temporal aggregation
        day_buckets: Dict[int, List[Dict[str, Any]]] = {1: [], 2: [], 3: [], 4: [], 5: []}

        for h in range(120):
            day_num = (h // 24) + 1
            hour_of_day = h % 24

            # 1. Diurnal temperature oscillation (coldest at 05:00, hottest at 14:00-15:00)
            diurnal_rad = ((hour_of_day - 5) / 24.0) * 2 * math.pi
            diurnal_curve = -math.cos(diurnal_rad)

            # 2. Synoptic Heatwave envelope: waves peak intensely between Day 2 and Day 4
            synoptic_boost = math.sin((h / 120.0) * math.pi) * 4.8

            # 3. Solar Radiation (0 at night, peak ~980 W/m² at 13:00)
            solar_rad = 0.0
            if 6 <= hour_of_day <= 18:
                solar_rad = math.sin(((hour_of_day - 6) / 12.0) * math.pi) * 960.0
                solar_rad += random.uniform(-25.0, 25.0)
                solar_rad = max(0.0, solar_rad)

            # 4. Air Temperature calculation
            rand_jitter = random.uniform(-0.4, 0.4)
            temp = round(
                base_temp + (diurnal_curve * 6.2) + synoptic_boost + (uhi * 1.6) + rand_jitter,
                1
            )

            # 5. Humidity (inversely tracks temperature with regional base offset)
            hum_val = round(
                max(20.0, min(88.0, 58.0 + hum_offset - (diurnal_curve * 22.0) - (synoptic_boost * 1.4) + random.uniform(-2.0, 2.0))),
                1
            )

            # 6. Wind speed
            wind_speed = round(max(0.6, (2.2 * wind_factor) + (math.sin(h * 0.35) * 1.2) + random.uniform(-0.3, 0.3)), 1)
            wind_speed_kmh = round(wind_speed * 3.6, 1)

            # 7. Thermal Stress & Indices calculation via pythermalcomfort helper
            thermal_eval = calculate_thermal_stress(
                air_temperature=temp,
                relative_humidity=hum_val,
                wind_speed=wind_speed,
                wind_speed_unit="m/s",
                solar_radiation=solar_rad
            )

            utci_val = thermal_eval["utci"]
            hi_val = thermal_eval["heat_index"]
            risk_tier = thermal_eval["risk_tier"]  # 'low' | 'moderate' | 'high' | 'severe'

            # WBGT standard approximation for time-slider inspection
            wbgt_val = round(
                (temp * 0.567 + 0.393 * (hum_val / 100.0 * 6.105 * math.exp((17.27 * temp) / (237.7 + temp))) + 3.94 + (1.8 if solar_rad > 400 else 0.0)),
                1
            )

            peak_heat_hour = (12 <= hour_of_day <= 16)
            timestamp_str = f"Day {day_num} • {hour_of_day:02d}:00"

            hour_record = {
                "hourIndex": h,
                "timestamp": timestamp_str,
                "temp": temp,
                "humidity": int(hum_val),
                "windSpeed": wind_speed_kmh,  # Frontend types expect km/h
                "solarRadiation": int(solar_rad),
                "utci": utci_val,
                "wbgt": wbgt_val,
                "heatIndex": hi_val,
                "heat_index": hi_val,
                "riskTier": risk_tier,
                "projectedHospitalizationSpike": thermal_eval["projected_hospitalization_spike"],
                "peakHeatHour": peak_heat_hour
            }

            hourly_list.append(hour_record)
            if day_num in day_buckets:
                day_buckets[day_num].append(hour_record)

        # Build multi-temporal 5-day daily summaries matching frontend geojson properties.forecasts
        tier_severity = {"severe": 4, "high": 3, "moderate": 2, "low": 1}
        tier_names = {4: "severe", 3: "high", 2: "moderate", 1: "low"}

        for day_num in range(1, 6):
            day_key = f"day{day_num}"
            day_hours = day_buckets[day_num]
            max_temp = max(hr["temp"] for hr in day_hours)
            peak_utci = max(hr["utci"] for hr in day_hours)
            peak_hi = max(hr["heatIndex"] for hr in day_hours)

            # Determine dominant peak tier for the day
            worst_score = max(tier_severity.get(hr["riskTier"], 1) for hr in day_hours)
            dom_level = tier_names[worst_score]
            classification = classify_hazard_tier(peak_utci, peak_hi)

            # Localized contextual advice
            custom_advice = ward_meta["default_advice"].get(day_key, classification["advice"])

            daily_summaries[day_key] = {
                "level": dom_level,
                "label": classification["label"],
                "temp": f"{int(round(max_temp))}°C",
                "advice": custom_advice,
                "peak_utci": f"{peak_utci}°C",
                "peak_heat_index": f"{peak_hi}°C"
            }

        ward_assets = [a for a in WEST_BENGAL_ASSETS if a["ward_id"] == ward_id]

        record = {
            "ward_id": ward_id,
            "name": ward_meta["name"],
            "district": ward_meta["district"],
            "state": ward_meta["state"],
            "area_km2": ward_meta["area_km2"],
            "population": ward_meta["population"],
            "vulnerability": ward_meta["vulnerability"],
            "center": ward_meta["center"],
            "forecasts": daily_summaries,
            "hourly_forecast": hourly_list,
            "assets": ward_assets,
            "last_simulated_at": datetime.now(timezone.utc).isoformat()
        }

        self.ward_forecasts[ward_id] = record
        return record

    async def start_scheduler(self, interval_seconds: int = 45):
        """Background coroutine task to periodically update rolling forecasts."""
        self.is_running = True
        self.initialize()
        while self.is_running:
            try:
                await asyncio.sleep(interval_seconds)
                self.simulation_step += 1
                # Slight microclimate perturbation to demonstrate dynamic real-time updates
                drift = math.sin(self.simulation_step * 0.4) * 0.6
                for ward_id in WEST_BENGAL_WARDS:
                    self.regenerate_ward_forecast(ward_id, drift_seed=drift)
                self.last_updated = datetime.now(timezone.utc)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(5)

    def stop_scheduler(self):
        """Stop background scheduler."""
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()

    def get_ward_forecast(self, ward_query: str) -> Optional[Dict[str, Any]]:
        """Retrieve forecast for given ward key or slug."""
        ward_id = resolve_ward_id(ward_query)
        if ward_id not in self.ward_forecasts:
            if ward_id in WEST_BENGAL_WARDS:
                return self.regenerate_ward_forecast(ward_id)
            return None
        return self.ward_forecasts[ward_id]

    def get_geojson_collection(self) -> Dict[str, Any]:
        """
        Generate West Bengal FeatureCollection with multi-temporal risk attributes
        compatible with Leaflet GISMapCanvas and React frontend.
        """
        features = []
        for ward_id, meta in WEST_BENGAL_WARDS.items():
            f_data = self.get_ward_forecast(ward_id)
            if not f_data:
                f_data = self.regenerate_ward_forecast(ward_id)

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [meta["polygon"]]
                },
                "properties": {
                    "id": ward_id,
                    "name": meta["name"],
                    "district": meta["district"],
                    "state": meta["state"],
                    "area_km2": meta["area_km2"],
                    "population": meta["population"],
                    "vulnerability": meta["vulnerability"],
                    "forecasts": f_data["forecasts"],
                    "hourly_forecast": f_data["hourly_forecast"],
                    "assets_count": len(f_data.get("assets", []))
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "metadata": {
                "region": "West Bengal, India",
                "generated_at": self.last_updated.isoformat(),
                "simulation_step": self.simulation_step,
                "total_wards": len(features)
            },
            "features": features
        }


# Global forecast store instance
forecast_store = ForecastStore()
