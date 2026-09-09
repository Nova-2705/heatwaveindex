"""
West Bengal Ward Data and GeoJSON Definitions
Contains geographical boundaries, base meteorology, vulnerability profiles,
and emergency infrastructure assets for Kolkata, Howrah, and Asansol.
"""
from typing import Dict, Any, List

WEST_BENGAL_WARDS: Dict[str, Dict[str, Any]] = {
    "WB-KOL-01": {
        "id": "WB-KOL-01",
        "slugs": ["kolkata", "wb-kol-01", "wb_kol_01", "kolkata-central"],
        "name": "Kolkata Municipal Corporation (Central/South)",
        "district": "Kolkata",
        "state": "West Bengal",
        "center": [22.56, 88.36],
        "polygon": [
            [88.30, 22.50],
            [88.42, 22.50],
            [88.42, 22.62],
            [88.30, 22.62],
            [88.30, 22.50]
        ],
        "area_km2": 185.0,
        "population": 4496694,
        "microclimate": {
            "base_temp": 37.0,
            "uhi_factor": 2.4,       # Urban Heat Island intensity (dense concrete/asphalt)
            "humidity_offset": 12.0,  # High coastal river delta humidity
            "wind_factor": 0.85      # Obstructed wind in high-density corridors
        },
        "vulnerability": {
            "elderly_percentage": 15.8,
            "informal_workers_percentage": 41.2,
            "tree_canopy_coverage": 7.3,
            "impervious_surface": 84.5,
            "baseline_vulnerability_score": 78
        },
        "default_advice": {
            "day1": "High humidity compounding stress. Drink oral rehydration salts.",
            "day2": "Urban heat island effect peak. AC metro stations open as cooling shelters.",
            "day3": "Red Alert. Avoid outdoor movement between 11 AM - 4 PM.",
            "day4": "Conditions remain hazardous. Stay hydrated.",
            "day5": "Temperature subsiding slightly with sea breeze."
        }
    },
    "WB-HWH-02": {
        "id": "WB-HWH-02",
        "slugs": ["howrah", "wb-hwh-02", "wb_hwh_02", "howrah-industrial"],
        "name": "Howrah Industrial Precinct",
        "district": "Howrah",
        "state": "West Bengal",
        "center": [22.59, 88.26],
        "polygon": [
            [88.20, 22.55],
            [88.30, 22.55],
            [88.30, 22.65],
            [88.20, 22.65],
            [88.20, 22.55]
        ],
        "area_km2": 146.0,
        "population": 1077070,
        "microclimate": {
            "base_temp": 36.5,
            "uhi_factor": 2.1,       # Heavy thermal mass from manufacturing & railway tracks
            "humidity_offset": 10.0,
            "wind_factor": 0.90
        },
        "vulnerability": {
            "elderly_percentage": 12.4,
            "informal_workers_percentage": 56.7,
            "tree_canopy_coverage": 5.8,
            "impervious_surface": 88.2,
            "baseline_vulnerability_score": 82
        },
        "default_advice": {
            "day1": "Standard heat precautions for industrial workers.",
            "day2": "Mandatory rest breaks for outdoor laborers.",
            "day3": "Industrial shift hours adjusted. Emergency hydration tents deployed.",
            "day4": "Exercise caution during midday hours.",
            "day5": "Normal operations resuming."
        }
    },
    "WB-ASN-03": {
        "id": "WB-ASN-03",
        "slugs": ["asansol", "wb-asn-03", "wb_asn_03", "asansol-mining"],
        "name": "Asansol Mining & Dry Zone",
        "district": "Paschim Bardhaman",
        "state": "West Bengal",
        "center": [23.68, 87.31],
        "polygon": [
            [87.25, 23.65],
            [87.38, 23.65],
            [87.38, 23.75],
            [87.25, 23.75],
            [87.25, 23.65]
        ],
        "area_km2": 326.0,
        "population": 1243414,
        "microclimate": {
            "base_temp": 40.0,       # Inland continental plateau dry heat
            "uhi_factor": 1.6,       # Open pit mining & dry rock radiation
            "humidity_offset": -15.0, # Much drier than coastal Kolkata
            "wind_factor": 1.15      # Westerly dry hot lOO winds
        },
        "vulnerability": {
            "elderly_percentage": 11.2,
            "informal_workers_percentage": 62.0,
            "tree_canopy_coverage": 12.1,
            "impervious_surface": 65.4,
            "baseline_vulnerability_score": 75
        },
        "default_advice": {
            "day1": "Dry westerly winds increasing heat intensity.",
            "day2": "Extreme dry heat. Surface mining work restricted.",
            "day3": "Peak heatwave intensity. Cooling stations fully operational.",
            "day4": "High hazard levels persist.",
            "day5": "Slight temperature drop expected."
        }
    }
}

WEST_BENGAL_ASSETS: List[Dict[str, Any]] = [
    # Kolkata Assets
    {
        "id": "wb_cs_01",
        "name": "Esplanade & Park St. AC Metro Concourse",
        "type": "cooling_shelter",
        "ward_id": "WB-KOL-01",
        "location": [22.562, 88.351],
        "status": "active",
        "capacity": 1200,
        "current_usage": 840,
        "features": ["HVAC Chilled Underground Concourse", "Free Hydration Booths", "Paramedic Desk"],
        "contact": "Kolkata Metro Safety"
    },
    {
        "id": "wb_ws_01",
        "name": "Maidan & Red Road Cold Water Dispenser",
        "type": "hydration_station",
        "ward_id": "WB-KOL-01",
        "location": [22.551, 88.344],
        "status": "active",
        "capacity": 20000,
        "current_usage": 14500,
        "features": ["Chilled Filtered Water", "Electrolyte Refill"],
        "contact": "KMC Water Works"
    },
    {
        "id": "wb_hc_01",
        "name": "SSKM Medical College & Hospital Heat Trauma Unit",
        "type": "hospital",
        "ward_id": "WB-KOL-01",
        "location": [22.539, 88.344],
        "status": "active",
        "capacity": 180,
        "current_usage": 110,
        "features": ["Cryo-Cooling Baths", "Specialized Heatstroke Ward", "ICU"],
        "contact": "Emergency Helpline: 102"
    },
    # Howrah Assets
    {
        "id": "wb_cs_02",
        "name": "Howrah Junction Air-Cooled Waiting Lounge",
        "type": "cooling_shelter",
        "ward_id": "WB-HWH-02",
        "location": [22.585, 88.342],
        "status": "active",
        "capacity": 900,
        "current_usage": 720,
        "features": ["High-Capacity Industrial Air Conditioning", "ORS Sachet Counters"],
        "contact": "Station Master Reception"
    },
    {
        "id": "wb_ws_02",
        "name": "Grand Trunk Road Industrial Hydration Post",
        "type": "hydration_station",
        "ward_id": "WB-HWH-02",
        "location": [22.602, 88.275],
        "status": "active",
        "capacity": 15000,
        "current_usage": 12100,
        "features": ["High-Flow Dispenser Taps for Workers", "Mobile Water Tankers"],
        "contact": "Howrah Municipal Corporation"
    },
    # Asansol Assets
    {
        "id": "wb_cs_03",
        "name": "Asansol Mining Civic Relief & Cooling Center",
        "type": "cooling_shelter",
        "ward_id": "WB-ASN-03",
        "location": [23.685, 87.318],
        "status": "active",
        "capacity": 800,
        "current_usage": 610,
        "features": ["Generator Backup Air Cooling", "Resting Cots", "Medical Attendant"],
        "contact": "Asansol Municipal Office"
    },
    {
        "id": "wb_ws_03",
        "name": "Mining Belt Cold Misting & Electrolyte Depot",
        "type": "hydration_station",
        "ward_id": "WB-ASN-03",
        "location": [23.712, 87.295],
        "status": "active",
        "capacity": 25000,
        "current_usage": 22000,
        "features": ["Misting Canopy", "Free Electrolyte Solution", "Ice Storage"],
        "contact": "District Disaster Management"
    },
    {
        "id": "wb_hc_03",
        "name": "Asansol Super Speciality Hospital (Heat ICU)",
        "type": "hospital",
        "ward_id": "WB-ASN-03",
        "location": [23.698, 87.345],
        "status": "active",
        "capacity": 120,
        "current_usage": 85,
        "features": ["Cold Water Immersion Units", "Intensive Care Support"],
        "contact": "Disaster Cell: 108"
    }
]


def resolve_ward_id(ward_key: str) -> str:
    """Normalize input key to canonical Ward ID (e.g. 'kolkata' -> 'WB-KOL-01')."""
    clean_key = ward_key.strip().lower().replace("_", "-")
    for ward_id, ward in WEST_BENGAL_WARDS.items():
        if clean_key == ward_id.lower().replace("_", "-"):
            return ward_id
        if any(clean_key == s.lower().replace("_", "-") for s in ward.get("slugs", [])):
            return ward_id
    return ward_key.upper()
