"""
West Bengal Heat Risk & Thermal Index Backend API Service
Built with FastAPI, CORS Middleware, pythermalcomfort, and dynamic 5-day forecasting.
"""
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware

from thermal_service import (
    StressCalculationRequest,
    StressCalculationResponse,
    calculate_thermal_stress
)
from forecast_service import forecast_store
from ward_data import WEST_BENGAL_WARDS, WEST_BENGAL_ASSETS, resolve_ward_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan handler:
    Initializes forecast store and launches continuous background simulation scheduler.
    """
    # 1. Initialize data store
    forecast_store.initialize()

    # 2. Launch background task for rolling forecast updates
    scheduler_task = asyncio.create_task(forecast_store.start_scheduler(interval_seconds=60))
    forecast_store._task = scheduler_task
    print("[HeatWaveAPI] Background forecast simulation scheduler started.")

    yield

    # Clean shutdown
    forecast_store.stop_scheduler()
    print("[HeatWaveAPI] Background scheduler terminated.")


# ---------------------------------------------------------------------------
# FastAPI Application Initialization with CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="West Bengal Heat Stress & Ward Risk API",
    description=(
        "Dynamic Heat Risk & Biometeorological Microclimate Service. "
        "Provides multi-temporal ward-level GeoJSON features (Kolkata, Howrah, Asansol), "
        "thermal index computation (UTCI & Heat Index via pythermalcomfort), "
        "and 120-hour granular rolling forecasts for command center map scrubbers."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS middleware for seamless local React communication (Vite, CRA, Next.js, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# 1. Root & Status Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["General"])
async def get_root() -> Dict[str, Any]:
    """
    Root endpoint providing service metadata, health status, and directory of available endpoints.
    """
    return {
        "service": "West Bengal Heat Risk & Thermal Index API",
        "status": "operational",
        "version": "1.0.0",
        "description": "Biometeorological heat risk intelligence for West Bengal municipal wards",
        "endpoints": {
            "root": "/",
            "documentation": "/docs",
            "wards_geojson": "/api/wards",
            "calculate_thermal_stress": "/api/calculate-stress",
            "ward_forecast": "/api/forecast/{ward_id}",
            "infrastructure_assets": "/api/assets",
            "health": "/api/health"
        },
        "monitored_wards": list(WEST_BENGAL_WARDS.keys()),
        "last_simulation_update": forecast_store.last_updated.isoformat()
    }


@app.get("/api/health", tags=["General"])
async def health_check() -> Dict[str, Any]:
    """System liveness and readiness probe."""
    return {
        "status": "healthy",
        "scheduler_running": forecast_store.is_running,
        "simulation_step": forecast_store.simulation_step,
        "wards_loaded": len(forecast_store.ward_forecasts)
    }


# ---------------------------------------------------------------------------
# 2. Main Data Endpoint: West Bengal GeoJSON Wards
# ---------------------------------------------------------------------------
@app.get("/api/wards", tags=["Geospatial & Wards"])
async def get_wards_geojson() -> Dict[str, Any]:
    """
    Returns West Bengal GeoJSON FeatureCollection (Kolkata, Howrah, Asansol)
    with multi-temporal risk attributes and 5-day daily heat forecasts.
    Directly compatible with Leaflet L.geoJSON in the React GISMapCanvas component.
    """
    geojson_data = forecast_store.get_geojson_collection()
    return geojson_data


# ---------------------------------------------------------------------------
# 3. Thermal Index Calculation Endpoint (pythermalcomfort)
# ---------------------------------------------------------------------------
@app.post(
    "/api/calculate-stress",
    response_model=StressCalculationResponse,
    tags=["Thermal Comfort"]
)
async def calculate_stress(payload: StressCalculationRequest) -> StressCalculationResponse:
    """
    Calculates physiological thermal stress indices using pythermalcomfort:
    - Universal Thermal Climate Index (UTCI)
    - Heat Index (Rothfusz equation)
    
    Accepts raw environmental inputs:
    - air_temperature (°C)
    - relative_humidity (%)
    - wind_speed (m/s or km/h)
    - mean_radiant_temperature (°C) or solar_radiation (W/m²)
    
    Returns calculated values and corresponding hazard tier:
    - Low: Normal / comfortable conditions
    - Moderate: Warm conditions, increased hydration recommended
    - High: High Heat Warning, shade breaks and shelter access mandatory
    - Severe: Red Alert, dangerous heat, stay indoors
    """
    result = calculate_thermal_stress(
        air_temperature=payload.air_temperature,
        relative_humidity=payload.relative_humidity,
        wind_speed=payload.wind_speed,
        wind_speed_unit=payload.wind_speed_unit or "m/s",
        mean_radiant_temperature=payload.mean_radiant_temperature,
        solar_radiation=payload.solar_radiation
    )
    return StressCalculationResponse(**result)


# ---------------------------------------------------------------------------
# 4. Dynamic Forecasting Mock Service
# ---------------------------------------------------------------------------
@app.get("/api/forecast/{ward_id}", tags=["Forecasting"])
async def get_ward_forecast(
    ward_id: str = Path(
        ...,
        description="Ward ID (e.g. 'WB-KOL-01', 'WB-HWH-02', 'WB-ASN-03') or slug ('kolkata', 'howrah', 'asansol')"
    )
) -> Dict[str, Any]:
    """
    Simulates and returns a 5-day rolling forecast vector (120 hours) for a specific ward.
    Matches the data structure expected by the frontend map component and time-slider scrubber:
    - `forecasts`: Multi-temporal day1..day5 dictionary for choropleth rendering
    - `hourly_forecast`: 120-item array of HourlyForecast objects with UTCI, WBGT, Heat Index, and Hospitalization Spike
    """
    canonical_id = resolve_ward_id(ward_id)
    forecast_data = forecast_store.get_ward_forecast(canonical_id)

    if not forecast_data:
        valid_ids = list(WEST_BENGAL_WARDS.keys()) + ["kolkata", "howrah", "asansol"]
        raise HTTPException(
            status_code=404,
            detail=f"Ward '{ward_id}' not found. Available ward identifiers: {valid_ids}"
        )

    return forecast_data


@app.post("/api/forecast/regenerate", tags=["Forecasting"])
async def trigger_forecast_regeneration() -> Dict[str, Any]:
    """
    Manually triggers an immediate simulation update and stochastic regeneration across all wards.
    """
    forecast_store.simulation_step += 1
    for wid in WEST_BENGAL_WARDS:
        forecast_store.regenerate_ward_forecast(wid, drift_seed=0.5)
    return {
        "message": "All ward forecasts successfully regenerated",
        "simulation_step": forecast_store.simulation_step,
        "timestamp": forecast_store.last_updated.isoformat()
    }


# ---------------------------------------------------------------------------
# 5. Infrastructure Assets Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/assets", tags=["Infrastructure"])
async def get_assets(
    ward_id: Optional[str] = Query(None, description="Optional ward filter (e.g. 'WB-KOL-01')"),
    asset_type: Optional[str] = Query(None, description="Optional type: 'cooling_shelter', 'hydration_station', 'hospital'")
) -> Dict[str, Any]:
    """
    Returns cooling shelters, hydration stations, and heat emergency clinics.
    """
    assets = WEST_BENGAL_ASSETS
    if ward_id:
        target_id = resolve_ward_id(ward_id)
        assets = [a for a in assets if a["ward_id"] == target_id]
    if asset_type:
        assets = [a for a in assets if a["type"] == asset_type]

    return {
        "count": len(assets),
        "assets": assets
    }


# ---------------------------------------------------------------------------
# Local Execution Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
