export const westBengalHeatGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [88.30, 22.50],
            [88.42, 22.50],
            [88.42, 22.62],
            [88.30, 22.62],
            [88.30, 22.50]
          ]
        ]
      },
      "properties": {
        "id": "WB-KOL-01",
        "name": "Kolkata Municipal Corporation (Central/South)",
        "forecasts": {
          "day1": { "level": "high", "label": "High Heat Warning", "temp": "37°C", "advice": "High humidity compounding stress. Drink oral rehydration salts." },
          "day2": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "41°C", "advice": "Urban heat island effect peak. AC metro stations open as cooling shelters." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "43°C", "advice": "Red Alert. Avoid outdoor movement between 11 AM - 4 PM." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "38°C", "advice": "Conditions remain hazardous. Stay hydrated." },
          "day5": { "level": "moderate", "label": "Moderate Heat", "temp": "34°C", "advice": "Temperature subsiding slightly with sea breeze." }
        }
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [88.20, 22.55],
            [88.30, 22.55],
            [88.30, 22.65],
            [88.20, 22.65],
            [88.20, 22.55]
          ]
        ]
      },
      "properties": {
        "id": "WB-HWH-02",
        "name": "Howrah Industrial Precinct",
        "forecasts": {
          "day1": { "level": "moderate", "label": "Moderate Heat", "temp": "35°C", "advice": "Standard heat precautions for industrial workers." },
          "day2": { "level": "high", "label": "High Heat Warning", "temp": "39°C", "advice": "Mandatory rest breaks for outdoor laborers." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "42°C", "advice": "Industrial shift hours adjusted. Emergency hydration tents deployed." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "38°C", "advice": "Exercise caution during midday hours." },
          "day5": { "level": "moderate", "label": "Moderate Heat", "temp": "33°C", "advice": "Normal operations resuming." }
        }
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [87.25, 23.65],
            [87.38, 23.65],
            [87.38, 23.75],
            [87.25, 23.75],
            [87.25, 23.65]
          ]
        ]
      },
      "properties": {
        "id": "WB-ASN-03",
        "name": "Asansol Mining & Dry Zone",
        "forecasts": {
          "day1": { "level": "high", "label": "High Heat Warning", "temp": "39°C", "advice": "Dry westerly winds increasing heat intensity." },
          "day2": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "44°C", "advice": "Extreme dry heat. Surface mining work restricted." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "45°C", "advice": "Peak heatwave intensity. Cooling stations fully operational." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "40°C", "advice": "High hazard levels persist." },
          "day5": { "level": "moderate", "label": "Moderate Heat", "temp": "36°C", "advice": "Slight temperature drop expected." }
        }
      }
    }
  ]
};

export const westBengalAssets = [
  // Kolkata Assets
  {
    id: 'wb_cs_01',
    name: 'Esplanade & Park St. AC Metro Concourse',
    type: 'cooling_shelter',
    wardId: 'WB-KOL-01',
    location: [22.562, 88.351],
    status: 'active',
    capacity: 1200,
    currentUsage: 840,
    features: ['HVAC Chilled Underground Concourse', 'Free Hydration Booths', 'Paramedic Desk'],
    contact: 'Kolkata Metro Safety'
  },
  {
    id: 'wb_ws_01',
    name: 'Maidan & Red Road Cold Water Dispenser',
    type: 'hydration_station',
    wardId: 'WB-KOL-01',
    location: [22.551, 88.344],
    status: 'active',
    capacity: 20000,
    currentUsage: 14500,
    features: ['Chilled Filtered Water', 'Electrolyte Refill'],
    contact: 'KMC Water Works'
  },
  {
    id: 'wb_hc_01',
    name: 'SSKM Medical College & Hospital Heat Trauma Unit',
    type: 'hospital',
    wardId: 'WB-KOL-01',
    location: [22.539, 88.344],
    status: 'active',
    capacity: 180,
    currentUsage: 110,
    features: ['Cryo-Cooling Baths', 'Specialized Heatstroke Ward', 'ICU'],
    contact: 'Emergency Helpline: 102'
  },

  // Howrah Assets
  {
    id: 'wb_cs_02',
    name: 'Howrah Junction Air-Cooled Waiting Lounge',
    type: 'cooling_shelter',
    wardId: 'WB-HWH-02',
    location: [22.585, 88.342],
    status: 'active',
    capacity: 900,
    currentUsage: 720,
    features: ['High-Capacity Industrial Air Conditioning', 'ORS Sachet Counters'],
    contact: 'Station Master Reception'
  },
  {
    id: 'wb_ws_02',
    name: 'Grand Trunk Road Industrial Hydration Post',
    type: 'hydration_station',
    wardId: 'WB-HWH-02',
    location: [22.602, 88.275],
    status: 'active',
    capacity: 15000,
    currentUsage: 12100,
    features: ['High-Flow Dispenser Taps for Workers', 'Mobile Water Tankers'],
    contact: 'Howrah Municipal Corporation'
  },

  // Asansol Assets
  {
    id: 'wb_cs_03',
    name: 'Asansol Mining Civic Relief & Cooling Center',
    type: 'cooling_shelter',
    wardId: 'WB-ASN-03',
    location: [23.685, 87.318],
    status: 'active',
    capacity: 800,
    currentUsage: 610,
    features: ['Generator Backup Air Cooling', 'Resting Cots', 'Medical Attendant'],
    contact: 'Asansol Municipal Office'
  },
  {
    id: 'wb_ws_03',
    name: 'Mining Belt Cold Misting & Electrolyte Depot',
    type: 'hydration_station',
    wardId: 'WB-ASN-03',
    location: [23.712, 87.295],
    status: 'active',
    capacity: 25000,
    currentUsage: 22000,
    features: ['Misting Canopy', 'Free Electrolyte Solution', 'Ice Storage'],
    contact: 'District Disaster Management'
  },
  {
    id: 'wb_hc_03',
    name: 'Asansol Super Speciality Hospital (Heat ICU)',
    type: 'hospital',
    wardId: 'WB-ASN-03',
    location: [23.698, 87.345],
    status: 'active',
    capacity: 120,
    currentUsage: 85,
    features: ['Cold Water Immersion Units', 'Intensive Care Support'],
    contact: 'Disaster Cell: 108'
  }
];
