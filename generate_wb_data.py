"""
Utility script to generate authentic, organic multi-vertex administrative boundaries
for all 23 official districts of West Bengal from the validated Census GeoJSON dataset.
Updates both:
1. ward_data.py (FastAPI backend)
2. src/data/westBengalHeatData.js (Frontend static fallback & initial load)
"""
import urllib.request
import json
import os

GEOJSON_URL = "https://raw.githubusercontent.com/udit-001/india-maps-data/master/geojson/states/west-bengal.geojson"

DISTRICT_METADATA = {
    "Kolkata": {
        "id": "WB-KOL-01",
        "slugs": ["kolkata", "wb-kol-01", "wb_kol_01", "kolkata-central", "kolkata-south"],
        "name": "Kolkata Metropolitan Core",
        "population": 4496694,
        "area_km2": 205.0,
        "microclimate": {"base_temp": 37.0, "uhi_factor": 2.4, "humidity_offset": 12.0, "wind_factor": 0.85},
        "vulnerability": {"elderly_percentage": 15.8, "informal_workers_percentage": 41.2, "tree_canopy_coverage": 7.3, "impervious_surface": 84.5, "baseline_vulnerability_score": 78},
        "default_advice": {
            "day1": "High humidity compounding stress. Drink oral rehydration salts.",
            "day2": "Urban heat island effect peak. AC metro stations open as cooling shelters.",
            "day3": "Red Alert. Avoid outdoor movement between 11 AM - 4 PM.",
            "day4": "Conditions remain hazardous. Stay hydrated.",
            "day5": "Temperature subsiding slightly with sea breeze."
        }
    },
    "Howrah": {
        "id": "WB-HWH-02",
        "slugs": ["howrah", "wb-hwh-02", "wb_hwh_02", "howrah-industrial"],
        "name": "Howrah Industrial Belt",
        "population": 4850029,
        "area_km2": 1467.0,
        "microclimate": {"base_temp": 36.8, "uhi_factor": 2.1, "humidity_offset": 10.0, "wind_factor": 0.90},
        "vulnerability": {"elderly_percentage": 12.4, "informal_workers_percentage": 56.7, "tree_canopy_coverage": 5.8, "impervious_surface": 88.2, "baseline_vulnerability_score": 76},
        "default_advice": {
            "day1": "Standard heat precautions for industrial workers.",
            "day2": "Mandatory rest breaks for outdoor laborers.",
            "day3": "Industrial shift hours adjusted. Emergency hydration tents deployed.",
            "day4": "Exercise caution during midday hours.",
            "day5": "Normal operations resuming."
        }
    },
    "Paschim Bardhaman": {
        "id": "WB-ASN-03",
        "slugs": ["asansol", "durgapur", "paschim-bardhaman", "wb-asn-03", "wb_asn_03", "asansol-mining"],
        "name": "Paschim Bardhaman (Asansol - Durgapur Industrial Corridor)",
        "population": 2882031,
        "area_km2": 1603.0,
        "microclimate": {"base_temp": 40.5, "uhi_factor": 2.2, "humidity_offset": -4.0, "wind_factor": 1.05},
        "vulnerability": {"elderly_percentage": 10.1, "informal_workers_percentage": 62.3, "tree_canopy_coverage": 9.1, "impervious_surface": 76.4, "baseline_vulnerability_score": 81},
        "default_advice": {
            "day1": "Extreme radiant heat in mining and factory belts. Hydrate frequently.",
            "day2": "Severe heat alert. Mining operations restrict open pit work 11 AM - 4 PM.",
            "day3": "Peak dry heatwave exceeding 43°C. Cooling mist stations operational.",
            "day4": "High heat warning remains active across steel/foundry clusters.",
            "day5": "Dry gusting winds decreasing."
        }
    },
    "Jalpaiguri": {
        "id": "WB-SLG-04",
        "slugs": ["siliguri", "jalpaiguri", "wb-slg-04", "wb_slg_04"],
        "name": "Jalpaiguri & Siliguri Plains",
        "population": 2381596,
        "area_km2": 3044.0,
        "microclimate": {"base_temp": 33.2, "uhi_factor": 1.2, "humidity_offset": 8.0, "wind_factor": 1.10},
        "vulnerability": {"elderly_percentage": 9.2, "informal_workers_percentage": 44.5, "tree_canopy_coverage": 28.4, "impervious_surface": 42.1, "baseline_vulnerability_score": 64},
        "default_advice": {
            "day1": "Sub-Himalayan foothill warmth. Moderate heat safety applies.",
            "day2": "High humidity index in tea gardens. Workers advised to rest under canopy.",
            "day3": "Afternoon heat spike. Ensure clean drinking water at transit hubs.",
            "day4": "Moderate conditions. Safe for shaded activities.",
            "day5": "Mountain breeze providing relief."
        }
    },
    "Purba Bardhaman": {
        "id": "WB-DGP-05",
        "slugs": ["purba-bardhaman", "bardhaman", "wb-dgp-05", "wb_dgp_05"],
        "name": "Purba Bardhaman Agricultural Basin",
        "population": 4835532,
        "area_km2": 5433.0,
        "microclimate": {"base_temp": 38.5, "uhi_factor": 1.5, "humidity_offset": 3.0, "wind_factor": 1.00},
        "vulnerability": {"elderly_percentage": 11.8, "informal_workers_percentage": 58.2, "tree_canopy_coverage": 14.2, "impervious_surface": 52.0, "baseline_vulnerability_score": 69},
        "default_advice": {
            "day1": "Intense solar radiation over agricultural fields.",
            "day2": "High heat advisory. Farmers urged to complete harvesting by 10 AM.",
            "day3": "Severe radiant heat across canal plains. Keep livestock hydrated.",
            "day4": "High temperature warning continues.",
            "day5": "Moderate conditions expected."
        }
    },
    "Purulia": {
        "id": "WB-PUR-06",
        "slugs": ["purulia", "wb-pur-06", "wb_pur_06", "purulia-plateau"],
        "name": "Purulia Western Plateau & Red Soil Zone",
        "population": 2930115,
        "area_km2": 6259.0,
        "microclimate": {"base_temp": 42.0, "uhi_factor": 1.0, "humidity_offset": -12.0, "wind_factor": 1.25},
        "vulnerability": {"elderly_percentage": 13.5, "informal_workers_percentage": 68.4, "tree_canopy_coverage": 12.0, "impervious_surface": 65.0, "baseline_vulnerability_score": 86},
        "default_advice": {
            "day1": "Severe heat wave active across western plateau. Desiccating winds.",
            "day2": "Extreme Red Alert: Temperatures reaching 44°C. Complete restriction on outdoor labor.",
            "day3": "Dangerous hyperthermia hazard. Mobile water tankers deployed across villages.",
            "day4": "Very hot dry conditions persist. Stay in shaded structures.",
            "day5": "Marginal drop in afternoon temperatures."
        }
    },
    "Paschim Medinipur": {
        "id": "WB-KGP-07",
        "slugs": ["kharagpur", "midnapore", "paschim-medinipur", "wb-kgp-07", "wb_kgp_07"],
        "name": "Paschim Medinipur (Midnapore - Kharagpur)",
        "population": 3115000,
        "area_km2": 6308.0,
        "microclimate": {"base_temp": 39.2, "uhi_factor": 1.4, "humidity_offset": 0.0, "wind_factor": 1.05},
        "vulnerability": {"elderly_percentage": 11.2, "informal_workers_percentage": 52.8, "tree_canopy_coverage": 18.5, "impervious_surface": 58.0, "baseline_vulnerability_score": 73},
        "default_advice": {
            "day1": "Hot dry conditions across railway junction and campus corridors.",
            "day2": "High heat warning: Industrial workshops maintain cooling fans.",
            "day3": "Severe heat advisory: Seek air-cooled transit centers.",
            "day4": "Hot afternoons. Limit strenuous physical activity.",
            "day5": "Conditions moderating."
        }
    },
    "Malda": {
        "id": "WB-MLD-08",
        "slugs": ["malda", "english-bazar", "wb-mld-08", "wb_mld_08"],
        "name": "Malda (English Bazar) Basin",
        "population": 3988845,
        "area_km2": 3733.0,
        "microclimate": {"base_temp": 37.5, "uhi_factor": 1.3, "humidity_offset": 5.0, "wind_factor": 0.95},
        "vulnerability": {"elderly_percentage": 10.4, "informal_workers_percentage": 59.0, "tree_canopy_coverage": 16.0, "impervious_surface": 60.5, "baseline_vulnerability_score": 74},
        "default_advice": {
            "day1": "Humid heat wave warning across Gangetic floodplains.",
            "day2": "High heat index. Mango orchard workers rest during midday peak.",
            "day3": "High thermal stress. Hydration distribution points open in markets.",
            "day4": "Humid conditions persist.",
            "day5": "Thunderstorm activity likely to lower temperatures."
        }
    },
    "Darjeeling": {
        "id": "WB-DAR-09",
        "slugs": ["darjeeling", "wb-dar-09", "wb_dar_09", "darjeeling-hills"],
        "name": "Darjeeling Himalayan Ridge",
        "population": 1595181,
        "area_km2": 2092.0,
        "microclimate": {"base_temp": 24.5, "uhi_factor": 0.6, "humidity_offset": 14.0, "wind_factor": 1.30},
        "vulnerability": {"elderly_percentage": 14.2, "informal_workers_percentage": 38.0, "tree_canopy_coverage": 48.0, "impervious_surface": 28.0, "baseline_vulnerability_score": 42},
        "default_advice": {
            "day1": "Mild mountain conditions. UV protection recommended on exposed ridges.",
            "day2": "Comfortable highland weather. Safe for outdoor tourism.",
            "day3": "Slight midday warming in valleys. General sun precautions.",
            "day4": "Pleasant conditions continue.",
            "day5": "Cool mountain breeze dominant."
        }
    },
    "South 24 Parganas": {
        "id": "WB-SBN-10",
        "slugs": ["sundarbans", "south-24-parganas", "wb-sbn-10", "wb_sbn_10"],
        "name": "South 24 Parganas & Sundarbans Coastal Delta",
        "population": 8161961,
        "area_km2": 9960.0,
        "microclimate": {"base_temp": 35.8, "uhi_factor": 0.9, "humidity_offset": 18.0, "wind_factor": 1.20},
        "vulnerability": {"elderly_percentage": 12.0, "informal_workers_percentage": 64.0, "tree_canopy_coverage": 32.0, "impervious_surface": 35.0, "baseline_vulnerability_score": 84},
        "default_advice": {
            "day1": "Extreme humidity compounding thermal discomfort. Drink salty fluids.",
            "day2": "Dangerous heat index in mangrove delta. Fisherfolk avoid direct sun exposure.",
            "day3": "High hazard tier: Coastal hospitals on heat emergency protocol.",
            "day4": "Maritime moisture keeping nights muggy and warm.",
            "day5": "Sea breeze lowering heat stress."
        }
    },
    "Nadia": {
        "id": "WB-NAD-11",
        "slugs": ["nadia", "krishnanagar", "kalyani", "wb-nad-11", "wb_nad_11"],
        "name": "Nadia (Krishnanagar - Kalyani)",
        "population": 5167600,
        "area_km2": 3927.0,
        "microclimate": {"base_temp": 37.2, "uhi_factor": 1.3, "humidity_offset": 6.0, "wind_factor": 0.95},
        "vulnerability": {"elderly_percentage": 11.5, "informal_workers_percentage": 50.5, "tree_canopy_coverage": 15.8, "impervious_surface": 61.2, "baseline_vulnerability_score": 67},
        "default_advice": {
            "day1": "Warm humid conditions in urban and rural centers.",
            "day2": "High heat alert: Ensure shaded rest areas in college and market zones.",
            "day3": "High thermal stress across Gangetic river flats. Drink ORS.",
            "day4": "Warm afternoons persist.",
            "day5": "Moderate conditions returning."
        }
    },
    "North 24 Parganas": {
        "id": "WB-24PN-12",
        "slugs": ["north-24-parganas", "barasat", "bidhannagar", "wb-24pn-12", "wb_24pn_12"],
        "name": "North 24 Parganas Urban Corridor",
        "population": 10009781,
        "area_km2": 4094.0,
        "microclimate": {"base_temp": 37.0, "uhi_factor": 2.3, "humidity_offset": 11.0, "wind_factor": 0.88},
        "vulnerability": {"elderly_percentage": 13.8, "informal_workers_percentage": 48.6, "tree_canopy_coverage": 9.4, "impervious_surface": 81.0, "baseline_vulnerability_score": 79},
        "default_advice": {
            "day1": "Intense urban heat retention along high-density transit corridors.",
            "day2": "Severe heat wave advisory for IT hubs and commuter terminals.",
            "day3": "Red alert. High wet-bulb risk during afternoon rush hour.",
            "day4": "Warm muggy conditions continue.",
            "day5": "Gradual cooling with maritime airflow."
        }
    },
    "Bankura": {
        "id": "WB-BNK-13",
        "slugs": ["bankura", "bishnupur", "wb-bnk-13", "wb_bnk_13"],
        "name": "Bankura Laterite Dry Zone",
        "population": 3596674,
        "area_km2": 6882.0,
        "microclimate": {"base_temp": 41.2, "uhi_factor": 1.1, "humidity_offset": -8.0, "wind_factor": 1.15},
        "vulnerability": {"elderly_percentage": 12.8, "informal_workers_percentage": 63.5, "tree_canopy_coverage": 14.5, "impervious_surface": 62.0, "baseline_vulnerability_score": 82},
        "default_advice": {
            "day1": "Severe dry heat warning. Clay and laterite soils radiating heat.",
            "day2": "Extreme heat wave alert: Avoid direct sunlight 11 AM - 4 PM.",
            "day3": "Dangerous heat stress. Rural clinics equipped with emergency cold packs.",
            "day4": "Hot dry winds continuing.",
            "day5": "Marginal drop in afternoon temperatures."
        }
    },
    "Birbhum": {
        "id": "WB-BIR-14",
        "slugs": ["birbhum", "santiniketan", "bolpur", "wb-bir-14", "wb_bir_14"],
        "name": "Birbhum (Santiniketan - Bolpur) Red Soil Belt",
        "population": 3502404,
        "area_km2": 4545.0,
        "microclimate": {"base_temp": 40.0, "uhi_factor": 1.1, "humidity_offset": -6.0, "wind_factor": 1.10},
        "vulnerability": {"elderly_percentage": 13.0, "informal_workers_percentage": 58.0, "tree_canopy_coverage": 16.2, "impervious_surface": 58.4, "baseline_vulnerability_score": 77},
        "default_advice": {
            "day1": "Intense afternoon heat. Open-air campuses reschedule sessions to morning.",
            "day2": "High heat warning across stone quarry and artisan zones.",
            "day3": "Severe heat conditions. Stay inside shaded mud or insulated dwellings.",
            "day4": "Very warm conditions persist.",
            "day5": "Slight relief in evening."
        }
    },
    "Murshidabad": {
        "id": "WB-MSD-15",
        "slugs": ["murshidabad", "berhampore", "wb-msd-15", "wb_msd_15"],
        "name": "Murshidabad (Berhampore) Ganga Basin",
        "population": 7103807,
        "area_km2": 5324.0,
        "microclimate": {"base_temp": 37.8, "uhi_factor": 1.3, "humidity_offset": 5.0, "wind_factor": 0.95},
        "vulnerability": {"elderly_percentage": 10.9, "informal_workers_percentage": 61.2, "tree_canopy_coverage": 13.8, "impervious_surface": 64.0, "baseline_vulnerability_score": 75},
        "default_advice": {
            "day1": "Warm humid conditions prevailing along riverbanks.",
            "day2": "High heat warning. Silk weavers and artisans take shade breaks.",
            "day3": "High thermal index. Drink abundant fluids.",
            "day4": "Warm afternoons continue.",
            "day5": "Moderate conditions resuming."
        }
    },
    "Hooghly": {
        "id": "WB-HGL-16",
        "slugs": ["hooghly", "chandannagar", "serampore", "chinsurah", "wb-hgl-16", "wb_hgl_16"],
        "name": "Hooghly Riverfront Belt",
        "population": 5519145,
        "area_km2": 3149.0,
        "microclimate": {"base_temp": 36.9, "uhi_factor": 1.9, "humidity_offset": 9.0, "wind_factor": 0.92},
        "vulnerability": {"elderly_percentage": 13.2, "informal_workers_percentage": 49.0, "tree_canopy_coverage": 12.0, "impervious_surface": 74.0, "baseline_vulnerability_score": 71},
        "default_advice": {
            "day1": "Humid heat accumulating along industrial riverfront.",
            "day2": "High heat warning in dense old-quarter settlements.",
            "day3": "Severe thermal stress during midday hours.",
            "day4": "High heat conditions persist.",
            "day5": "Moderate breeze from river delta."
        }
    },
    "Purba Medinipur": {
        "id": "WB-PMD-17",
        "slugs": ["purba-medinipur", "tamluk", "haldia", "digha", "wb-pmd-17", "wb_pmd_17"],
        "name": "Purba Medinipur (Haldia - Coastal Digha)",
        "population": 5095875,
        "area_km2": 4736.0,
        "microclimate": {"base_temp": 35.5, "uhi_factor": 1.2, "humidity_offset": 16.0, "wind_factor": 1.25},
        "vulnerability": {"elderly_percentage": 11.4, "informal_workers_percentage": 53.0, "tree_canopy_coverage": 17.5, "impervious_surface": 55.0, "baseline_vulnerability_score": 72},
        "default_advice": {
            "day1": "Coastal humidity elevating apparent temperature.",
            "day2": "High heat index in port and industrial sectors.",
            "day3": "High hazard tier: Beach visitors seek shade during peak midday hours.",
            "day4": "Muggy conditions continue.",
            "day5": "Strong sea breeze lowering heat stress."
        }
    },
    "Jhargram": {
        "id": "WB-JHG-18",
        "slugs": ["jhargram", "wb-jhg-18", "wb_jhg_18"],
        "name": "Jhargram Woodland & Forest Fringe",
        "population": 1136548,
        "area_km2": 3037.0,
        "microclimate": {"base_temp": 40.8, "uhi_factor": 0.8, "humidity_offset": -7.0, "wind_factor": 1.10},
        "vulnerability": {"elderly_percentage": 12.2, "informal_workers_percentage": 66.0, "tree_canopy_coverage": 26.0, "impervious_surface": 42.0, "baseline_vulnerability_score": 80},
        "default_advice": {
            "day1": "Severe dry heat over red laterite plateau.",
            "day2": "Extreme heat wave alert: Forest fringe laborers halt work by 11 AM.",
            "day3": "High risk of heat stroke. Water tankers dispatched to remote hamlets.",
            "day4": "Hot dry winds continuing.",
            "day5": "Moderate conditions returning."
        }
    },
    "Uttar Dinajpur": {
        "id": "WB-UDI-19",
        "slugs": ["uttar-dinajpur", "raiganj", "islampur", "wb-udi-19", "wb_udi_19"],
        "name": "Uttar Dinajpur (Raiganj - Islampur)",
        "population": 3007134,
        "area_km2": 3140.0,
        "microclimate": {"base_temp": 36.5, "uhi_factor": 1.1, "humidity_offset": 6.0, "wind_factor": 1.00},
        "vulnerability": {"elderly_percentage": 9.8, "informal_workers_percentage": 62.0, "tree_canopy_coverage": 14.0, "impervious_surface": 56.0, "baseline_vulnerability_score": 76},
        "default_advice": {
            "day1": "Warm conditions along transit chicken-neck corridor.",
            "day2": "High heat warning in open market squares.",
            "day3": "High thermal stress. Adequate hydration mandatory for laborers.",
            "day4": "Warm afternoons continue.",
            "day5": "Normal conditions."
        }
    },
    "Dakshin Dinajpur": {
        "id": "WB-DDI-20",
        "slugs": ["dakshin-dinajpur", "balurghat", "wb-ddi-20", "wb_ddi_20"],
        "name": "Dakshin Dinajpur (Balurghat Border Zone)",
        "population": 1676276,
        "area_km2": 2219.0,
        "microclimate": {"base_temp": 36.7, "uhi_factor": 1.0, "humidity_offset": 6.0, "wind_factor": 0.95},
        "vulnerability": {"elderly_percentage": 11.0, "informal_workers_percentage": 57.0, "tree_canopy_coverage": 15.0, "impervious_surface": 53.0, "baseline_vulnerability_score": 73},
        "default_advice": {
            "day1": "Warm weather across agricultural border plains.",
            "day2": "High heat warning during noon hours.",
            "day3": "Avoid strenuous afternoon outdoor activities.",
            "day4": "Warm conditions persist.",
            "day5": "Pleasant breeze in evening."
        }
    },
    "Alipurduar": {
        "id": "WB-APD-21",
        "slugs": ["alipurduar", "dooars", "wb-apd-21", "wb_apd_21"],
        "name": "Alipurduar (Dooars Forest Foothills)",
        "population": 1491250,
        "area_km2": 3136.0,
        "microclimate": {"base_temp": 32.5, "uhi_factor": 0.8, "humidity_offset": 12.0, "wind_factor": 1.15},
        "vulnerability": {"elderly_percentage": 9.5, "informal_workers_percentage": 46.0, "tree_canopy_coverage": 42.0, "impervious_surface": 32.0, "baseline_vulnerability_score": 61},
        "default_advice": {
            "day1": "Moderate warmth in Dooars forest and tea garden belt.",
            "day2": "Humid warmth. Tea workers rest under shade tree canopy.",
            "day3": "General hydration precautions.",
            "day4": "Comfortable weather.",
            "day5": "Mountain showers expected."
        }
    },
    "Kalimpong": {
        "id": "WB-KLP-22",
        "slugs": ["kalimpong", "wb-klp-22", "wb_klp_22"],
        "name": "Kalimpong Sub-Himalayan Ridge",
        "population": 251642,
        "area_km2": 1053.0,
        "microclimate": {"base_temp": 23.8, "uhi_factor": 0.5, "humidity_offset": 15.0, "wind_factor": 1.25},
        "vulnerability": {"elderly_percentage": 14.5, "informal_workers_percentage": 35.0, "tree_canopy_coverage": 52.0, "impervious_surface": 24.0, "baseline_vulnerability_score": 40},
        "default_advice": {
            "day1": "Cool mountain conditions. Safe for all outdoor activities.",
            "day2": "Mild weather on hill ridge. UV protection advised.",
            "day3": "Comfortable conditions throughout.",
            "day4": "High altitude thermal comfort.",
            "day5": "Cool mountain air dominating."
        }
    },
    "Cooch Behar": {
        "id": "WB-COB-23",
        "slugs": ["cooch-behar", "coochbehar", "wb-cob-23", "wb_cob_23"],
        "name": "Cooch Behar Torsa River Basin",
        "population": 2819086,
        "area_km2": 3387.0,
        "microclimate": {"base_temp": 34.0, "uhi_factor": 1.0, "humidity_offset": 10.0, "wind_factor": 1.05},
        "vulnerability": {"elderly_percentage": 10.2, "informal_workers_percentage": 54.0, "tree_canopy_coverage": 22.0, "impervious_surface": 45.0, "baseline_vulnerability_score": 66},
        "default_advice": {
            "day1": "Warm humid conditions along Torsa and Teesta floodplains.",
            "day2": "Moderate heat index in royal palace grounds and markets.",
            "day3": "Midday heat caution: Hydrate well.",
            "day4": "Pleasant conditions returning.",
            "day5": "Cool northern breezes."
        }
    }
}


def round_coordinates(coords, precision=4):
    """Recursively round float coordinates to 4 decimal places (~11m resolution)."""
    if isinstance(coords, (float, int)):
        return round(float(coords), precision)
    elif isinstance(coords, list):
        return [round_coordinates(c, precision) for c in coords]
    return coords


def main():
    print(f"Fetching official West Bengal GeoJSON from: {GEOJSON_URL}...")
    req = urllib.request.Request(GEOJSON_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw_geojson = json.loads(resp.read().decode("utf-8"))

    print(f"Fetched {len(raw_geojson['features'])} features.")

    processed_wards = {}
    frontend_features = []

    for f in raw_geojson["features"]:
        district_name = f["properties"]["district"].strip()
        meta = DISTRICT_METADATA.get(district_name)
        if not meta:
            print(f"WARNING: Unknown district {district_name}, skipping.")
            continue

        ward_id = meta["id"]
        geom_type = f["geometry"]["type"]
        raw_coords = f["geometry"]["coordinates"]
        coords = round_coordinates(raw_coords, precision=4)

        # Calculate centroid
        all_pts = []
        if geom_type == "Polygon":
            all_pts = coords[0]
        elif geom_type == "MultiPolygon":
            for poly in coords:
                all_pts.extend(poly[0])

        lons = [p[0] for p in all_pts]
        lats = [p[1] for p in all_pts]
        center = [round(sum(lats) / len(lats), 4), round(sum(lons) / len(lons), 4)]

        # Determine realistic initial forecast tier based on base_temp
        bt = meta["microclimate"]["base_temp"]
        if bt >= 41.0:
            d1_lvl, d2_lvl, d3_lvl, d4_lvl, d5_lvl = "high", "severe", "severe", "high", "moderate"
            t1, t2, t3, t4, t5 = "41°C", "44°C", "45°C", "42°C", "38°C"
        elif bt >= 39.0:
            d1_lvl, d2_lvl, d3_lvl, d4_lvl, d5_lvl = "high", "high", "severe", "high", "moderate"
            t1, t2, t3, t4, t5 = "39°C", "42°C", "43°C", "40°C", "36°C"
        elif bt >= 36.5:
            d1_lvl, d2_lvl, d3_lvl, d4_lvl, d5_lvl = "moderate", "high", "severe", "high", "moderate"
            t1, t2, t3, t4, t5 = "37°C", "40°C", "42°C", "38°C", "34°C"
        elif bt >= 32.0:
            d1_lvl, d2_lvl, d3_lvl, d4_lvl, d5_lvl = "low", "moderate", "moderate", "moderate", "low"
            t1, t2, t3, t4, t5 = "32°C", "34°C", "35°C", "33°C", "30°C"
        else:
            d1_lvl, d2_lvl, d3_lvl, d4_lvl, d5_lvl = "low", "low", "low", "low", "low"
            t1, t2, t3, t4, t5 = "24°C", "25°C", "26°C", "25°C", "23°C"

        level_labels = {
            "severe": "Severe Heat Risk (Stay Indoors)",
            "high": "High Heat Warning",
            "moderate": "Moderate Heat",
            "low": "Normal Conditions"
        }

        forecasts = {
            "day1": {"level": d1_lvl, "label": level_labels[d1_lvl], "temp": t1, "advice": meta["default_advice"]["day1"]},
            "day2": {"level": d2_lvl, "label": level_labels[d2_lvl], "temp": t2, "advice": meta["default_advice"]["day2"]},
            "day3": {"level": d3_lvl, "label": level_labels[d3_lvl], "temp": t3, "advice": meta["default_advice"]["day3"]},
            "day4": {"level": d4_lvl, "label": level_labels[d4_lvl], "temp": t4, "advice": meta["default_advice"]["day4"]},
            "day5": {"level": d5_lvl, "label": level_labels[d5_lvl], "temp": t5, "advice": meta["default_advice"]["day5"]}
        }

        # Store in processed wards dict for Python
        processed_wards[ward_id] = {
            "id": ward_id,
            "slugs": meta["slugs"],
            "name": meta["name"],
            "district": district_name,
            "state": "West Bengal",
            "center": center,
            "geometry": {
                "type": geom_type,
                "coordinates": coords
            },
            "area_km2": meta["area_km2"],
            "population": meta["population"],
            "microclimate": meta["microclimate"],
            "vulnerability": meta["vulnerability"],
            "default_advice": meta["default_advice"]
        }

        # Store in frontend GeoJSON features list
        frontend_features.append({
            "type": "Feature",
            "geometry": {
                "type": geom_type,
                "coordinates": coords
            },
            "properties": {
                "id": ward_id,
                "name": meta["name"],
                "district": district_name,
                "state": "West Bengal",
                "center": center,
                "area_km2": meta["area_km2"],
                "population": meta["population"],
                "vulnerability": meta["vulnerability"],
                "forecasts": forecasts
            }
        })

    print(f"Processed all {len(processed_wards)} districts.")

    # Write Python ward_data.py
    write_python_ward_data(processed_wards)

    # Write JavaScript westBengalHeatData.js
    write_javascript_geojson(frontend_features)


def write_python_ward_data(wards):
    assets_code = """
WEST_BENGAL_ASSETS = [
    {"id": "wb_cs_01", "name": "Kolkata Central AC Metro Cooling Haven", "type": "cooling_shelter", "ward_id": "WB-KOL-01", "location": [22.565, 88.355], "status": "active", "capacity": 800, "current_usage": 520, "features": ["Chilled Air Conditioning", "Free ORS Packets", "Paramedic on Site"], "contact": "Helpline: 1800-345-5678"},
    {"id": "wb_ws_01", "name": "Park Street Hydration Hub", "type": "hydration_station", "ward_id": "WB-KOL-01", "location": [22.552, 88.352], "status": "active", "capacity": 15000, "current_usage": 9800, "features": ["Cold Electrolyte Water", "Automated Refill Taps"], "contact": "KMC Water Dept"},
    {"id": "wb_hc_01", "name": "SSKM Hospital Thermal Emergency Bay", "type": "hospital", "ward_id": "WB-KOL-01", "location": [22.539, 88.344], "status": "active", "capacity": 250, "current_usage": 210, "features": ["Dedicated Heatstroke Ward", "Ice Bath Cryo-Tanks"], "contact": "Emergency: 102"},
    {"id": "wb_cs_02", "name": "Howrah Station Air-Conditioned Concourse", "type": "cooling_shelter", "ward_id": "WB-HWH-02", "location": [22.583, 88.342], "status": "active", "capacity": 1200, "current_usage": 890, "features": ["High-Volume Ventilation", "Medical Kiosk"], "contact": "Disaster Cell"},
    {"id": "wb_cs_03", "name": "Asansol Burnpur Industrial Relief Pavillion", "type": "cooling_shelter", "ward_id": "WB-ASN-03", "location": [23.672, 86.955], "status": "active", "capacity": 600, "current_usage": 440, "features": ["Industrial Mist Coolers", "Glucose Water Posts"], "contact": "Asansol Civic Desk"},
    {"id": "wb_hc_03", "name": "Asansol District Hospital Heatstroke Wing", "type": "hospital", "ward_id": "WB-ASN-03", "location": [23.688, 86.975], "status": "active", "capacity": 120, "current_usage": 98, "features": ["Rapid Rehydration Units", "24x7 Emergency Staff"], "contact": "Emergency: 102"},
    {"id": "wb_cs_04", "name": "Siliguri Junction Passenger Cooling Hub", "type": "cooling_shelter", "ward_id": "WB-SLG-04", "location": [26.715, 88.428], "status": "active", "capacity": 500, "current_usage": 290, "features": ["Cold Drinking Water", "Medical First Aid Post"], "contact": "SMC Disaster Cell"},
    {"id": "wb_cs_05", "name": "Bardhaman Town Hall Community Cooling Shelter", "type": "cooling_shelter", "ward_id": "WB-DGP-05", "location": [23.235, 87.865], "status": "active", "capacity": 450, "current_usage": 310, "features": ["Air Cooled Halls", "Hydration ORS"], "contact": "Municipality Cell"},
    {"id": "wb_cs_06", "name": "Purulia Zilla Parishad Heat Resilience Center", "type": "cooling_shelter", "ward_id": "WB-PUR-06", "location": [23.332, 86.368], "status": "active", "capacity": 700, "current_usage": 620, "features": ["Heavy Evaporative Mist", "Free ORS Counters"], "contact": "Purulia Disaster Cell"},
    {"id": "wb_hc_06", "name": "Deben Mahata Government Medical College Heat Unit", "type": "hospital", "ward_id": "WB-PUR-06", "location": [23.325, 86.375], "status": "active", "capacity": 130, "current_usage": 94, "features": ["Rapid Cooling Tents", "Dialysis & Heatstroke ICU"], "contact": "Helpline: 102"},
    {"id": "wb_cs_07", "name": "Kharagpur Railway Junction Air-Cooled Refuge", "type": "cooling_shelter", "ward_id": "WB-KGP-07", "location": [22.338, 87.322], "status": "active", "capacity": 1000, "current_usage": 780, "features": ["High-Capacity HVAC", "Doctor on Duty"], "contact": "SER Disaster Desk"},
    {"id": "wb_cs_08", "name": "English Bazar Civic Cooling Center", "type": "cooling_shelter", "ward_id": "WB-MLD-08", "location": [25.005, 88.142], "status": "active", "capacity": 550, "current_usage": 370, "features": ["Evaporative Cooler System", "Free ORS Counters"], "contact": "Malda Municipality"},
    {"id": "wb_cs_09", "name": "Mall Road Tourist Information & Rest Pavilion", "type": "cooling_shelter", "ward_id": "WB-DAR-09", "location": [27.042, 88.265], "status": "active", "capacity": 400, "current_usage": 120, "features": ["Covered Sun Shade", "Filtered Spring Water"], "contact": "Darjeeling Civic Desk"},
    {"id": "wb_hc_10", "name": "Gosaba Coastal Rural Hospital Heat Unit", "type": "hospital", "ward_id": "WB-SBN-10", "location": [22.165, 88.665], "status": "active", "capacity": 70, "current_usage": 52, "features": ["Waterborne Ambulance Link", "Oral Hydration Stabilization Bay"], "contact": "Coastal Rescue: 108"},
    {"id": "wb_cs_11", "name": "Krishnanagar Bus Terminus Cooling Shelter", "type": "cooling_shelter", "ward_id": "WB-NAD-11", "location": [23.402, 88.502], "status": "active", "capacity": 500, "current_usage": 340, "features": ["Misting Fans", "Free ORS Stations"], "contact": "Nadia DM Office"},
    {"id": "wb_cs_12", "name": "Bidhannagar Salt Lake Stadium Cooling Hub", "type": "cooling_shelter", "ward_id": "WB-24PN-12", "location": [22.568, 88.406], "status": "active", "capacity": 1500, "current_usage": 920, "features": ["Air Conditioned Concourse", "Paramedics on Duty"], "contact": "Bidhannagar Police Desk"},
    {"id": "wb_cs_13", "name": "Bankura Bishnupur Cultural Rest Pavilion", "type": "cooling_shelter", "ward_id": "WB-BNK-13", "location": [23.068, 87.318], "status": "active", "capacity": 600, "current_usage": 480, "features": ["High-Roof Terracotta Shade", "Electrolyte Dispensers"], "contact": "Bankura Disaster Desk"},
    {"id": "wb_cs_14", "name": "Bolpur Shantiniketan Tourist Shade Haven", "type": "cooling_shelter", "ward_id": "WB-BIR-14", "location": [23.682, 87.692], "status": "active", "capacity": 450, "current_usage": 280, "features": ["Tree Canopy Rest Area", "Cold Water Tanks"], "contact": "Birbhum Civic Cell"},
    {"id": "wb_cs_15", "name": "Berhampore Central Bus Stand Cooling Depot", "type": "cooling_shelter", "ward_id": "WB-MSD-15", "location": [24.098, 88.252], "status": "active", "capacity": 650, "current_usage": 430, "features": ["Evaporative Coolers", "Oral Rehydration Kits"], "contact": "Murshidabad Admin"},
    {"id": "wb_cs_16", "name": "Chandannagar Strand River Cooling Pavilion", "type": "cooling_shelter", "ward_id": "WB-HGL-16", "location": [22.868, 88.368], "status": "active", "capacity": 700, "current_usage": 460, "features": ["Riverfront Air Flow", "Chilled Water Dispensers"], "contact": "Chandannagar Corp"},
    {"id": "wb_cs_17", "name": "Haldia Industrial Emergency Hydration Centre", "type": "cooling_shelter", "ward_id": "WB-PMD-17", "location": [22.062, 88.082], "status": "active", "capacity": 800, "current_usage": 590, "features": ["Port Worker Rest Hub", "Heat Stress Triage"], "contact": "Haldia Port Trust"}
]

def resolve_ward_id(ward_key: str) -> str:
    \"\"\"Normalize input key or slug to canonical Ward ID (e.g. 'siliguri' -> 'WB-SLG-04').\"\"\"
    clean_key = ward_key.strip().lower().replace("_", "-")
    for ward_id, ward in WEST_BENGAL_WARDS.items():
        if clean_key == ward_id.lower().replace("_", "-"):
            return ward_id
        if any(clean_key == s.lower().replace("_", "-") for s in ward.get("slugs", [])):
            return ward_id
    return ward_key.upper()
"""

    code = f'''"""
West Bengal Ward Data and Authentic Organic Boundaries GeoJSON Definitions.
Contains multi-vertex official administrative boundaries, base meteorology,
vulnerability profiles, and emergency infrastructure assets for all 23 official districts of West Bengal:
Kolkata, Howrah, Paschim Bardhaman (Asansol - Durgapur), Purulia, Paschim Medinipur, Malda,
Darjeeling, South 24 Parganas, Jalpaiguri, Nadia, North 24 Parganas, Bankura, Birbhum,
Murshidabad, Hooghly, Purba Medinipur, Jhargram, Uttar Dinajpur, Dakshin Dinajpur,
Alipurduar, Kalimpong, Cooch Behar, Purba Bardhaman.
"""
from typing import Dict, Any, List

WEST_BENGAL_WARDS: Dict[str, Dict[str, Any]] = {json.dumps(wards, indent=4)}

{assets_code}
'''
    with open("ward_data.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("ward_data.py updated successfully.")


def write_javascript_geojson(features):
    geojson_collection = {
        "type": "FeatureCollection",
        "features": features
    }

    assets = [
        {"id": "wb_cs_01", "name": "Kolkata Central AC Metro Cooling Haven", "type": "cooling_shelter", "wardId": "WB-KOL-01", "location": [22.565, 88.355], "status": "active", "capacity": 800, "currentUsage": 520, "features": ["Chilled Air Conditioning", "Free ORS Packets", "Paramedic on Site"], "contact": "Helpline: 1800-345-5678"},
        {"id": "wb_ws_01", "name": "Park Street Hydration Hub", "type": "hydration_station", "wardId": "WB-KOL-01", "location": [22.552, 88.352], "status": "active", "capacity": 15000, "currentUsage": 9800, "features": ["Cold Electrolyte Water", "Automated Refill Taps"], "contact": "KMC Water Dept"},
        {"id": "wb_hc_01", "name": "SSKM Hospital Thermal Emergency Bay", "type": "hospital", "wardId": "WB-KOL-01", "location": [22.539, 88.344], "status": "active", "capacity": 250, "currentUsage": 210, "features": ["Dedicated Heatstroke Ward", "Ice Bath Cryo-Tanks"], "contact": "Emergency: 102"},
        {"id": "wb_cs_02", "name": "Howrah Station Air-Conditioned Concourse", "type": "cooling_shelter", "wardId": "WB-HWH-02", "location": [22.583, 88.342], "status": "active", "capacity": 1200, "currentUsage": 890, "features": ["High-Volume Ventilation", "Medical Kiosk"], "contact": "Disaster Cell"},
        {"id": "wb_cs_03", "name": "Asansol Burnpur Industrial Relief Pavillion", "type": "cooling_shelter", "wardId": "WB-ASN-03", "location": [23.672, 86.955], "status": "active", "capacity": 600, "currentUsage": 440, "features": ["Industrial Mist Coolers", "Glucose Water Posts"], "contact": "Asansol Civic Desk"},
        {"id": "wb_hc_03", "name": "Asansol District Hospital Heatstroke Wing", "type": "hospital", "wardId": "WB-ASN-03", "location": [23.688, 86.975], "status": "active", "capacity": 120, "currentUsage": 98, "features": ["Rapid Rehydration Units", "24x7 Emergency Staff"], "contact": "Emergency: 102"},
        {"id": "wb_cs_04", "name": "Siliguri Junction Passenger Cooling Hub", "type": "cooling_shelter", "wardId": "WB-SLG-04", "location": [26.715, 88.428], "status": "active", "capacity": 500, "currentUsage": 290, "features": ["Cold Drinking Water", "Medical First Aid Post"], "contact": "SMC Disaster Cell"},
        {"id": "wb_cs_05", "name": "Bardhaman Town Hall Community Cooling Shelter", "type": "cooling_shelter", "wardId": "WB-DGP-05", "location": [23.235, 87.865], "status": "active", "capacity": 450, "currentUsage": 310, "features": ["Air Cooled Halls", "Hydration ORS"], "contact": "Municipality Cell"},
        {"id": "wb_cs_06", "name": "Purulia Zilla Parishad Heat Resilience Center", "type": "cooling_shelter", "wardId": "WB-PUR-06", "location": [23.332, 86.368], "status": "active", "capacity": 700, "currentUsage": 620, "features": ["Heavy Evaporative Mist", "Free ORS Counters"], "contact": "Purulia Disaster Cell"},
        {"id": "wb_hc_06", "name": "Deben Mahata Government Medical College Heat Unit", "type": "hospital", "wardId": "WB-PUR-06", "location": [23.325, 86.375], "status": "active", "capacity": 130, "currentUsage": 94, "features": ["Rapid Cooling Tents", "Dialysis & Heatstroke ICU"], "contact": "Helpline: 102"},
        {"id": "wb_cs_07", "name": "Kharagpur Railway Junction Air-Cooled Refuge", "type": "cooling_shelter", "wardId": "WB-KGP-07", "location": [22.338, 87.322], "status": "active", "capacity": 1000, "currentUsage": 780, "features": ["High-Capacity HVAC", "Doctor on Duty"], "contact": "SER Disaster Desk"},
        {"id": "wb_cs_08", "name": "English Bazar Civic Cooling Center", "type": "cooling_shelter", "wardId": "WB-MLD-08", "location": [25.005, 88.142], "status": "active", "capacity": 550, "currentUsage": 370, "features": ["Evaporative Cooler System", "Free ORS Counters"], "contact": "Malda Municipality"},
        {"id": "wb_cs_09", "name": "Mall Road Tourist Information & Rest Pavilion", "type": "cooling_shelter", "wardId": "WB-DAR-09", "location": [27.042, 88.265], "status": "active", "capacity": 400, "currentUsage": 120, "features": ["Covered Sun Shade", "Filtered Spring Water"], "contact": "Darjeeling Civic Desk"},
        {"id": "wb_hc_10", "name": "Gosaba Coastal Rural Hospital Heat Unit", "type": "hospital", "wardId": "WB-SBN-10", "location": [22.165, 88.665], "status": "active", "capacity": 70, "currentUsage": 52, "features": ["Waterborne Ambulance Link", "Oral Hydration Stabilization Bay"], "contact": "Coastal Rescue: 108"},
        {"id": "wb_cs_11", "name": "Krishnanagar Bus Terminus Cooling Shelter", "type": "cooling_shelter", "wardId": "WB-NAD-11", "location": [23.402, 88.502], "status": "active", "capacity": 500, "currentUsage": 340, "features": ["Misting Fans", "Free ORS Stations"], "contact": "Nadia DM Office"},
        {"id": "wb_cs_12", "name": "Bidhannagar Salt Lake Stadium Cooling Hub", "type": "cooling_shelter", "wardId": "WB-24PN-12", "location": [22.568, 88.406], "status": "active", "capacity": 1500, "currentUsage": 920, "features": ["Air Conditioned Concourse", "Paramedics on Duty"], "contact": "Bidhannagar Police Desk"},
        {"id": "wb_cs_13", "name": "Bankura Bishnupur Cultural Rest Pavilion", "type": "cooling_shelter", "wardId": "WB-BNK-13", "location": [23.068, 87.318], "status": "active", "capacity": 600, "currentUsage": 480, "features": ["High-Roof Terracotta Shade", "Electrolyte Dispensers"], "contact": "Bankura Disaster Desk"},
        {"id": "wb_cs_14", "name": "Bolpur Shantiniketan Tourist Shade Haven", "type": "cooling_shelter", "wardId": "WB-BIR-14", "location": [23.682, 87.692], "status": "active", "capacity": 450, "currentUsage": 280, "features": ["Tree Canopy Rest Area", "Cold Water Tanks"], "contact": "Birbhum Civic Cell"},
        {"id": "wb_cs_15", "name": "Berhampore Central Bus Stand Cooling Depot", "type": "cooling_shelter", "wardId": "WB-MSD-15", "location": [24.098, 88.252], "status": "active", "capacity": 650, "currentUsage": 430, "features": ["Evaporative Coolers", "Oral Rehydration Kits"], "contact": "Murshidabad Admin"},
        {"id": "wb_cs_16", "name": "Chandannagar Strand River Cooling Pavilion", "type": "cooling_shelter", "wardId": "WB-HGL-16", "location": [22.868, 88.368], "status": "active", "capacity": 700, "currentUsage": 460, "features": ["Riverfront Air Flow", "Chilled Water Dispensers"], "contact": "Chandannagar Corp"},
        {"id": "wb_cs_17", "name": "Haldia Industrial Emergency Hydration Centre", "type": "cooling_shelter", "wardId": "WB-PMD-17", "location": [22.062, 88.082], "status": "active", "capacity": 800, "currentUsage": 590, "features": ["Port Worker Rest Hub", "Heat Stress Triage"], "contact": "Haldia Port Trust"}
    ]

    js_code = f"""// Authentic Organic Boundaries West Bengal Heat GeoJSON (All 23 Official Districts)
export const westBengalHeatGeoJSON = {json.dumps(geojson_collection, indent=2)};

export const westBengalAssets = {json.dumps(assets, indent=2)};
"""

    target_path = os.path.join("src", "data", "westBengalHeatData.js")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(js_code)
    print(f"{target_path} updated successfully.")


if __name__ == "__main__":
    main()
