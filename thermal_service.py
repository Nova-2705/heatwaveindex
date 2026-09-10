"""
Thermal Stress Calculation Service using pythermalcomfort.
Computes Universal Thermal Climate Index (UTCI) and Heat Index (HI),
and maps them to standardized multi-tier heat hazard categories.
"""
from typing import Optional, Dict, Any
import math
from pydantic import BaseModel, Field, ConfigDict
try:
    from pythermalcomfort.models.utci import utci
    from pythermalcomfort.models.heat_index_rothfusz import heat_index_rothfusz
    HAS_PYTHERMALCOMFORT = True
except ImportError:
    HAS_PYTHERMALCOMFORT = False
    utci = None
    heat_index_rothfusz = None


class StressCalculationRequest(BaseModel):
    """Input payload for thermal stress calculation."""
    air_temperature: float = Field(
        ...,
        alias="air_temperature",
        description="Dry-bulb air temperature in Celsius (°C)",
        ge=-20.0,
        le=65.0,
        examples=[38.5]
    )
    relative_humidity: float = Field(
        ...,
        alias="relative_humidity",
        description="Relative humidity percentage (0-100%)",
        ge=0.0,
        le=100.0,
        examples=[65.0]
    )
    wind_speed: float = Field(
        default=1.5,
        alias="wind_speed",
        description="Wind speed (default in m/s, or in km/h if wind_speed_unit='km/h')",
        ge=0.0,
        le=60.0,
        examples=[2.0]
    )
    wind_speed_unit: Optional[str] = Field(
        default="m/s",
        description="Unit for wind speed: 'm/s' or 'km/h'",
        examples=["m/s"]
    )
    mean_radiant_temperature: Optional[float] = Field(
        default=None,
        description="Mean Radiant Temperature (MRT) in Celsius (°C). If omitted, estimated from solar_radiation or ambient.",
        examples=[46.0]
    )
    solar_radiation: Optional[float] = Field(
        default=None,
        description="Global solar radiation in W/m² (0-1400). Used to derive MRT if MRT is not provided.",
        ge=0.0,
        le=1500.0,
        examples=[750.0]
    )

    model_config = ConfigDict(populate_by_name=True)


class StressCalculationResponse(BaseModel):
    """Output payload with calculated indices and emergency hazard tier."""
    utci: float = Field(..., description="Universal Thermal Climate Index (°C)")
    heat_index: float = Field(..., description="Heat Index (°C)")
    hazard_tier: str = Field(..., description="Hazard Tier: 'Low', 'Moderate', 'High', 'Severe'")
    risk_tier: str = Field(..., description="Normalized Risk Tier: 'low', 'moderate', 'high', 'severe'")
    label: str = Field(..., description="Public safety advisory label")
    advice: str = Field(..., description="Plain-English actionable clinical and public health advice")
    projected_hospitalization_spike: int = Field(..., description="Projected % spike in heat-related emergency admissions")
    color_hex: str = Field(..., description="Choropleth fill hex code")
    stress_category: str = Field(..., description="Standard physiological stress category")
    inputs_used: Dict[str, Any] = Field(..., description="Processed inputs used for calculations")


def classify_hazard_tier(utci_val: float, heat_index_val: float) -> Dict[str, Any]:
    """
    Classify calculated thermal indices into Low, Moderate, High, Severe tiers
    aligned with WHO, IMD (India Meteorological Department), and frontend GIS specifications.
    """
    # Severe: UTCI >= 38.0°C or Heat Index >= 41.0°C
    if utci_val >= 38.0 or heat_index_val >= 41.0:
        spike = min(250, int(max(40, math.pow(max(0, utci_val - 34.0), 1.7) * 9 + 30)))
        return {
            "hazard_tier": "Severe",
            "risk_tier": "severe",
            "label": "Severe Heat Risk (Stay Indoors)",
            "advice": "Red Alert. Dangerously high heat stress. Stay indoors in air-conditioned rooms. Suspend non-emergency outdoor physical labor. Hydrate with ORS.",
            "projected_hospitalization_spike": spike,
            "color_hex": "#ef4444"
        }
    # High: UTCI >= 32.0°C or Heat Index >= 35.0°C
    elif utci_val >= 32.0 or heat_index_val >= 35.0:
        spike = min(120, int(max(15, math.pow(max(0, utci_val - 30.0), 1.5) * 6 + 10)))
        return {
            "hazard_tier": "High",
            "risk_tier": "high",
            "label": "High Heat Warning",
            "advice": "Uncomfortably hot. Take frequent breaks in shade or cooling shelters, maintain hydration, and monitor vulnerable populations.",
            "projected_hospitalization_spike": spike,
            "color_hex": "#f97316"
        }
    # Moderate: UTCI >= 26.0°C or Heat Index >= 29.0°C
    elif utci_val >= 26.0 or heat_index_val >= 29.0:
        return {
            "hazard_tier": "Moderate",
            "risk_tier": "moderate",
            "label": "Moderate Heat",
            "advice": "Warm conditions. Drink extra water if exercising or working outdoors.",
            "projected_hospitalization_spike": 5,
            "color_hex": "#eab308"
        }
    # Low: Comfortable / Normal conditions
    else:
        return {
            "hazard_tier": "Low",
            "risk_tier": "low",
            "label": "Normal Conditions",
            "advice": "Comfortable weather. Safe for normal outdoor activities.",
            "projected_hospitalization_spike": 0,
            "color_hex": "#22c55e"
        }


def calculate_thermal_stress(
    air_temperature: float,
    relative_humidity: float,
    wind_speed: float = 1.5,
    wind_speed_unit: str = "m/s",
    mean_radiant_temperature: Optional[float] = None,
    solar_radiation: Optional[float] = None
) -> Dict[str, Any]:
    """
    Helper utility function that takes raw environmental inputs (air temperature,
    relative humidity, wind speed, and mean radiant temperature/solar radiation)
    and computes the UTCI and Heat Index using pythermalcomfort.
    """
    # 1. Normalize wind speed to m/s
    v_ms = float(wind_speed)
    if wind_speed_unit and wind_speed_unit.lower() == "km/h":
        v_ms = v_ms / 3.6

    # UTCI standard requires wind speed at 10m height, minimum 0.5 m/s
    v_clamped = max(0.5, v_ms)

    # 2. Determine Mean Radiant Temperature (tr)
    # If tr not provided, approximate using solar radiation: tr = tdb + (0.015 * solar_radiation)
    tdb = float(air_temperature)
    rh = float(relative_humidity)

    if mean_radiant_temperature is not None:
        tr = float(mean_radiant_temperature)
    elif solar_radiation is not None:
        # Standard empirical solar gain relation for human bioclimatology
        tr = round(tdb + (0.015 * float(solar_radiation)), 2)
    else:
        tr = tdb

    # 3. Calculate UTCI via pythermalcomfort
    try:
        utci_result = utci(tdb=tdb, tr=tr, v=v_clamped, rh=rh, limit_inputs=False)
        utci_val = round(float(utci_result.utci), 1)
        stress_cat = str(utci_result.stress_category)
    except Exception:
        # Fallback empirical UTCI approximation if underlying library encounters out-of-domain numbers
        rad_factor = (tr - tdb) * 0.4
        wind_cooling = (v_clamped - 1.0) * 1.2
        hum_factor = (rh - 50.0) * 0.12 if rh > 50 else -0.5
        utci_val = round(tdb + rad_factor - wind_cooling + hum_factor, 1)
        stress_cat = "heat stress"

    # 4. Calculate Heat Index via pythermalcomfort (Rothfusz equation)
    # NOAA standard: Heat Index is only applicable for temperatures >= 26.7°C (80°F).
    # Below this threshold, ambient air temperature represents the heat index.
    if tdb < 26.7:
        hi_val = round(tdb, 1)
    else:
        try:
            hi_result = heat_index_rothfusz(tdb=tdb, rh=rh)
            val = float(hi_result.hi)
            hi_val = round(val, 1) if not math.isnan(val) else round(tdb, 1)
        except Exception:
            # Standard NOAA Heat Index approximation fallback
            c1 = -8.78469475556
            c2 = 1.61139411
            c3 = 2.33854883889
            c4 = -0.14611605
            c5 = -0.012308094
            c6 = -0.0164248277778
            c7 = 0.002211732
            c8 = 0.00072546
            c9 = -0.000003582
            t = tdb
            r = rh
            hi_calc = (c1 + (c2 * t) + (c3 * r) + (c4 * t * r) + (c5 * (t**2)) +
                       (c6 * (r**2)) + (c7 * (t**2) * r) + (c8 * t * (r**2)) + (c9 * (t**2) * (r**2)))
            hi_val = round(hi_calc, 1)


    # 5. Classify into hazard tier
    classification = classify_hazard_tier(utci_val, hi_val)

    return {
        "utci": utci_val,
        "heat_index": hi_val,
        "hazard_tier": classification["hazard_tier"],
        "risk_tier": classification["risk_tier"],
        "label": classification["label"],
        "advice": classification["advice"],
        "projected_hospitalization_spike": classification["projected_hospitalization_spike"],
        "color_hex": classification["color_hex"],
        "stress_category": stress_cat,
        "inputs_used": {
            "air_temperature": tdb,
            "relative_humidity": rh,
            "wind_speed_ms": round(v_ms, 2),
            "mean_radiant_temperature": tr,
            "solar_radiation": solar_radiation
        }
    }
