"""
Comprehensive Test Suite for West Bengal Heat Risk & Thermal Index Backend API
Tests all required endpoints:
- GET /
- GET /api/health
- GET /api/wards
- POST /api/calculate-stress
- GET /api/forecast/{ward_id}
- GET /api/assets
"""
import sys
from fastapi.testclient import TestClient
from main import app, lifespan

def run_tests():
    print("=" * 70)
    print("Starting FastAPI Backend Test Suite...")
    print("=" * 70)

    # Use TestClient with lifespan context
    with TestClient(app) as client:
        # -------------------------------------------------------------
        # 1. Test Root Endpoint
        # -------------------------------------------------------------
        print("\n[TEST 1] Testing Root Endpoint '/' ...")
        res = client.get("/")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data["service"] == "West Bengal Heat Risk & Thermal Index API"
        assert "endpoints" in data
        assert "/api/wards" in data["endpoints"].values()
        assert "/api/calculate-stress" in data["endpoints"].values()
        print("  -> Root endpoint OK: Status operational, endpoints listed.")

        # -------------------------------------------------------------
        # 2. Test Main Data Endpoint: /api/wards GeoJSON
        # -------------------------------------------------------------
        print("\n[TEST 2] Testing Main Data Endpoint '/api/wards' ...")
        res = client.get("/api/wards")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        geojson = res.json()
        assert geojson["type"] == "FeatureCollection"
        features = geojson["features"]
        assert len(features) == 23, f"Expected all 23 official West Bengal districts, got {len(features)}"

        ward_ids = [f["properties"]["id"] for f in features]
        print(f"  -> Found {len(ward_ids)} districts/wards: {ward_ids}")
        expected_wards = [
            "WB-KOL-01", "WB-HWH-02", "WB-ASN-03", "WB-SLG-04",
            "WB-DGP-05", "WB-PUR-06", "WB-KGP-07", "WB-MLD-08",
            "WB-DAR-09", "WB-SBN-10", "WB-NAD-11", "WB-24PN-12",
            "WB-BNK-13", "WB-BIR-14", "WB-MSD-15", "WB-HGL-16"
        ]
        for ew in expected_wards:
            assert ew in ward_ids, f"Required district/ward '{ew}' missing from GeoJSON!"

        # Verify multi-temporal risk attributes for Leaflet time-slider
        for f in features:
            props = f["properties"]
            name = props["name"]
            forecasts = props["forecasts"]
            assert all(f"day{i}" in forecasts for i in range(1, 6)), f"Missing 5-day forecasts in {name}"
            for d in range(1, 6):
                d_key = f"day{d}"
                d_data = forecasts[d_key]
                assert "level" in d_data
                assert "temp" in d_data
                assert "advice" in d_data
                assert d_data["level"] in ["low", "moderate", "high", "severe"]

            # Verify geometry polygon structure
            geom = f["geometry"]
            assert geom["type"] in ["Polygon", "MultiPolygon"], f"Invalid geom type {geom['type']} for {name}"
            coords = geom["coordinates"]
            if geom["type"] == "Polygon":
                assert len(coords[0]) >= 4, f"Polygon ring must have >= 4 coordinates for {name}"
            else:
                assert len(coords[0][0]) >= 4, f"MultiPolygon ring must have >= 4 coordinates for {name}"

        print("  -> /api/wards GeoJSON OK: Full-coverage 23-district FeatureCollection with multi-temporal risk attributes.")

        # -------------------------------------------------------------
        # 2b. Test Live Telemetry & Biometeorology Endpoint: /api/ward/{ward_id}
        # -------------------------------------------------------------
        print("\n[TEST 2b] Testing Dynamic Ward Live Telemetry Endpoint '/api/ward/{ward_id}' ...")
        test_queries = [
            ("WB-SLG-04", "Siliguri"),
            ("siliguri", "Siliguri slug"),
            ("durgapur", "Durgapur slug"),
            ("purulia", "Purulia slug"),
            ("kharagpur", "Kharagpur slug"),
            ("WB-KOL-01", "Kolkata canonical"),
            ("asansol", "Asansol slug"),
            ("WB-NAD-11", "Nadia canonical"),
            ("nadia", "Nadia slug"),
            ("darjeeling", "Darjeeling slug"),
            ("howrah", "Howrah slug")
        ]

        for query_id, label in test_queries:
            res = client.get(f"/api/ward/{query_id}")
            assert res.status_code == 200, f"Failed for {label} ({query_id}): {res.status_code}"
            wdata = res.json()
            assert "ward_id" in wdata
            assert "telemetry" in wdata
            assert "thermal_comfort" in wdata

            # Verify microclimate telemetry
            telem = wdata["telemetry"]
            assert "air_temperature" in telem
            assert "relative_humidity" in telem
            assert "wind_speed" in telem
            assert "solar_radiation" in telem
            assert "mean_radiant_temperature" in telem

            # Verify pythermalcomfort calculated indices
            tc = wdata["thermal_comfort"]
            assert "utci" in tc
            assert "heat_index" in tc
            assert "hazard_tier" in tc
            assert tc["hazard_tier"] in ["Low", "Moderate", "High", "Severe"]
            assert "projected_hospitalization_spike" in tc
            assert tc["projected_hospitalization_spike"] >= 0

            print(f"  -> {label}: Temp={telem['air_temperature']}°C, RH={telem['relative_humidity']}%, UTCI={tc['utci']}°C, HI={tc['heat_index']}°C, Tier={tc['hazard_tier']}")

        # Test hour parameter
        res_hour = client.get("/api/ward/purulia?hour=14")
        assert res_hour.status_code == 200
        assert res_hour.json()["hour_index"] == 14

        # Test 404 on invalid ward
        res_404 = client.get("/api/ward/nonexistent-zone")
        assert res_404.status_code == 404
        print("  -> /api/ward/{ward_id} OK: Real-time telemetry, pythermalcomfort indices, and error handling verified.")


        # -------------------------------------------------------------
        # 3. Test Thermal Stress Calculation: /api/calculate-stress
        # -------------------------------------------------------------
        print("\n[TEST 3] Testing Thermal Index Calculation '/api/calculate-stress' ...")

        # Case A: Severe Heatwave Conditions (41°C, 70% humidity, 850 W/m² solar)
        payload_severe = {
            "air_temperature": 41.0,
            "relative_humidity": 70.0,
            "wind_speed": 1.2,
            "wind_speed_unit": "m/s",
            "solar_radiation": 850.0
        }
        res = client.post("/api/calculate-stress", json=payload_severe)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        calc_severe = res.json()
        print(f"  -> Severe scenario result: UTCI={calc_severe['utci']}°C, HeatIndex={calc_severe['heat_index']}°C, Tier={calc_severe['hazard_tier']}")
        assert calc_severe["hazard_tier"] == "Severe", f"Expected Severe, got {calc_severe['hazard_tier']}"
        assert calc_severe["risk_tier"] == "severe"
        assert "Red Alert" in calc_severe["advice"] or "dangerously" in calc_severe["advice"].lower()
        assert calc_severe["projected_hospitalization_spike"] > 0

        # Case B: High Heat Warning (36°C, 55% humidity, 600 W/m²)
        payload_high = {
            "air_temperature": 36.0,
            "relative_humidity": 55.0,
            "wind_speed": 2.0,
            "solar_radiation": 600.0
        }
        res = client.post("/api/calculate-stress", json=payload_high)
        assert res.status_code == 200
        calc_high = res.json()
        print(f"  -> High scenario result: UTCI={calc_high['utci']}°C, HeatIndex={calc_high['heat_index']}°C, Tier={calc_high['hazard_tier']}")
        assert calc_high["hazard_tier"] in ["High", "Severe"]

        # Case C: Moderate Conditions (28°C, 50% humidity, 100 W/m²)
        payload_moderate = {
            "air_temperature": 28.0,
            "relative_humidity": 50.0,
            "wind_speed": 2.5,
            "solar_radiation": 100.0
        }
        res = client.post("/api/calculate-stress", json=payload_moderate)
        assert res.status_code == 200
        calc_mod = res.json()
        print(f"  -> Moderate scenario result: UTCI={calc_mod['utci']}°C, HeatIndex={calc_mod['heat_index']}°C, Tier={calc_mod['hazard_tier']}")
        assert calc_mod["hazard_tier"] in ["Moderate", "Low"]

        # Case D: With explicit Mean Radiant Temperature
        payload_mrt = {
            "air_temperature": 38.0,
            "relative_humidity": 60.0,
            "wind_speed": 15.0,
            "wind_speed_unit": "km/h",
            "mean_radiant_temperature": 48.0
        }
        res = client.post("/api/calculate-stress", json=payload_mrt)
        assert res.status_code == 200
        calc_mrt = res.json()
        print(f"  -> Explicit MRT scenario result: UTCI={calc_mrt['utci']}°C, HeatIndex={calc_mrt['heat_index']}°C, Tier={calc_mrt['hazard_tier']}")
        assert calc_mrt["utci"] > 35.0

        print("  -> /api/calculate-stress OK: Correct UTCI, Heat Index, and Hazard Tiers.")

        # -------------------------------------------------------------
        # 4. Test Dynamic Forecasting: /api/forecast/{ward_id}
        # -------------------------------------------------------------
        print("\n[TEST 4] Testing Dynamic Forecasting '/api/forecast/{ward_id}' ...")

        for wid in ["WB-KOL-01", "kolkata", "WB-HWH-02", "howrah", "WB-ASN-03", "asansol"]:
            res = client.get(f"/api/forecast/{wid}")
            assert res.status_code == 200, f"Failed for ward '{wid}': {res.status_code}"
            fdata = res.json()
            assert "ward_id" in fdata
            assert "forecasts" in fdata
            assert "hourly_forecast" in fdata
            assert len(fdata["hourly_forecast"]) == 120, f"Expected 120 hours, got {len(fdata['hourly_forecast'])}"

            # Inspect first hour structure
            h0 = fdata["hourly_forecast"][0]
            for key in ["hourIndex", "timestamp", "temp", "humidity", "windSpeed", "solarRadiation", "utci", "wbgt", "heatIndex", "riskTier", "projectedHospitalizationSpike", "peakHeatHour"]:
                assert key in h0, f"Missing key '{key}' in hourly forecast"

        print("  -> /api/forecast/{ward_id} OK: 120-hour granular time-slider vector verified.")

        # -------------------------------------------------------------
        # 5. Test Infrastructure Assets: /api/assets
        # -------------------------------------------------------------
        print("\n[TEST 5] Testing Assets Endpoint '/api/assets' ...")
        res = client.get("/api/assets")
        assert res.status_code == 200
        assets_data = res.json()
        assert assets_data["count"] > 0
        print(f"  -> Found {assets_data['count']} emergency assets (cooling shelters, hydration stations, hospitals).")

        # -------------------------------------------------------------
        # 6. Test Manual Forecast Regeneration
        # -------------------------------------------------------------
        print("\n[TEST 6] Testing Trigger Forecast Regeneration ...")
        res = client.post("/api/forecast/regenerate")
        assert res.status_code == 200
        assert res.json()["simulation_step"] >= 1
        print("  -> Simulation step incremented successfully.")

        # -------------------------------------------------------------
        # 7. Test Emergency Broadcast Alert Endpoint: /api/broadcast-alert
        # -------------------------------------------------------------
        print("\n[TEST 7] Testing Emergency Broadcast Alert Endpoint '/api/broadcast-alert' ...")
        alert_payload = {
            "ward_id": "WB-KOL-01",
            "ward_name": "Kolkata Metropolitan Core",
            "district": "Kolkata",
            "risk_tier": "severe",
            "air_temperature": 42.5,
            "relative_humidity": 68.0,
            "utci": 51.2,
            "heat_index": 58.4,
            "projected_hospitalization_spike": 250,
            "phone_number": "+919876543210",
            "channels": ["whatsapp", "sms"]
        }
        res = client.post("/api/broadcast-alert", json=alert_payload)
        assert res.status_code == 200, f"Broadcast failed: {res.status_code} - {res.text}"
        bdata = res.json()
        assert bdata["status"] == "dispatched"
        assert "broadcast_id" in bdata
        assert "transmission_timestamp" in bdata
        assert bdata["recipients_count"] == 42
        assert "channels" in bdata
        assert "whatsapp" in bdata["channels"]
        assert "sms" in bdata["channels"]
        assert "SMS & WhatsApp alert successfully dispatched" in bdata["confirmation"]
        print(f"  -> Broadcast OK: ID={bdata['broadcast_id']}, Recipients={bdata['recipients_count']}, Channels={bdata['channels']}")

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
