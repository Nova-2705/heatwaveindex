# West Bengal Heat Risk & Thermal Index Backend Service

A lightweight, high-performance FastAPI microservice engineered to calculate biometeorological thermal stress indices and deliver real-time, dynamic ward-level heat risk intelligence for West Bengal municipal zones (Kolkata, Howrah, and Asansol).

---

## 🚀 Key Features

1. **FastAPI Server with CORS Middleware**:
   - Pre-configured CORS allows immediate communication with React / Vite frontends running locally on `http://localhost:5173`, `http://localhost:3000`, etc.
   - Interactive Swagger API Documentation available at [`/docs`](http://127.0.0.1:8000/docs).

2. **Universal Thermal Climate Index (UTCI) & Heat Index Engine**:
   - Integrated with [`pythermalcomfort`](https://pythermalcomfort.readthedocs.io/).
   - Calculates **UTCI** and **Heat Index (Rothfusz equation)** from dry-bulb temperature, relative humidity, wind speed, and solar radiation / mean radiant temperature (MRT).
   - Standardized 4-tier hazard classification: **Low**, **Moderate**, **High**, and **Severe**.
   - Automated plain-English clinical recommendations, hospitalization surge projections, and choropleth color styling.

3. **Dynamic Multi-Temporal & Hourly Forecasting**:
   - GeoJSON endpoint `/api/wards` delivers West Bengal polygons with multi-temporal 5-day daily heat forecasts (`day1` to `day5`).
   - Ward forecast endpoint `/api/forecast/{ward_id}` delivers a 120-hour rolling forecast vector (0–119 hours) formatted for the Leaflet time-slider scrubber.
   - Built-in background simulation scheduler continuously updates microclimates and synoptic heat wave peaks.

---

## 📁 Architecture Overview

```
├── main.py                 # FastAPI application entrypoint, CORS configuration, & route handlers
├── thermal_service.py      # Thermal index calculation & hazard tier classification using pythermalcomfort
├── forecast_service.py     # 120-hour simulation generator & background scheduler
├── ward_data.py            # West Bengal GeoJSON boundaries, vulnerability profiles, & infrastructure assets
├── test_backend.py         # Automated test suite (100% endpoint pass rate)
├── requirements.txt        # Python backend dependencies
└── src/services/heatApi.ts # React TypeScript client for easy frontend integration
```

---

## 🛠️ API Reference

### 1. Root & Health Check
- **`GET /`**: Service metadata, operational status, and route directory.
- **`GET /api/health`**: Liveness and readiness status with scheduler metrics.

### 2. Ward GeoJSON Features
- **`GET /api/wards`**
  - **Returns**: GeoJSON `FeatureCollection` with Kolkata (`WB-KOL-01`), Howrah (`WB-HWH-02`), and Asansol (`WB-ASN-03`).
  - **Attributes**: Multi-temporal daily forecasts (`day1` through `day5`), vulnerability index, area, population, and 120-hour granular time vector.

### 3. Thermal Stress Calculation
- **`POST /api/calculate-stress`**
  - **Payload**:
    ```json
    {
      "air_temperature": 39.5,
      "relative_humidity": 65.0,
      "wind_speed": 1.8,
      "wind_speed_unit": "m/s",
      "solar_radiation": 850.0
    }
    ```
  - **Response**:
    ```json
    {
      "utci": 51.6,
      "heat_index": 65.2,
      "hazard_tier": "Severe",
      "risk_tier": "severe",
      "label": "Severe Heat Risk (Stay Indoors)",
      "advice": "Red Alert. Dangerously high heat stress. Stay indoors in air-conditioned rooms. Suspend non-emergency outdoor physical labor. Hydrate with ORS.",
      "projected_hospitalization_spike": 182,
      "color_hex": "#ef4444",
      "stress_category": "extreme heat stress",
      "inputs_used": { ... }
    }
    ```

### 4. Dynamic Ward Forecast
- **`GET /api/forecast/{ward_id}`**
  - **Supported IDs**: `WB-KOL-01`, `WB-HWH-02`, `WB-ASN-03`, or friendly slugs `kolkata`, `howrah`, `asansol`.
  - **Returns**:
    - `forecasts`: 5-day multi-temporal summaries (`day1`..`day5`)
    - `hourly_forecast`: 120 hourly items matching the `HourlyForecast` TypeScript interface (`hourIndex` 0..119, `temp`, `humidity`, `windSpeed`, `solarRadiation`, `utci`, `wbgt`, `heatIndex`, `riskTier`, `projectedHospitalizationSpike`, `peakHeatHour`).

### 5. Infrastructure Assets
- **`GET /api/assets`**
  - Optional filters: `?ward_id=WB-KOL-01&asset_type=cooling_shelter`
  - Returns cooling shelters, hydration stations, and heat ICU clinics.

---

## 🏃 Running the Service Locally

### Install Dependencies:
```bash
pip install -r requirements.txt
```

### Start the Server:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
or run directly:
```bash
python main.py
```

### Run Automated Verification Tests:
```bash
python test_backend.py
```
