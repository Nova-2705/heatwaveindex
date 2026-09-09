import type { RegionFeature, WardFeature, InfrastructureAsset, AutomatedAlert, RiskTier, HourlyForecast } from '../types';

// Risk calculation helper based on physiological metrics
export const calculateRiskTier = (utci: number, wbgt: number): RiskTier => {
  if (utci >= 38 || wbgt >= 31) return 'severe';
  if (utci >= 32 || wbgt >= 29) return 'high';
  if (utci >= 28 || wbgt >= 26) return 'moderate';
  return 'low';
};

export const RISK_COLORS: Record<RiskTier, { fill: string; stroke: string; glow: string; label: string; advice: string; badge: string; text: string }> = {
  low: {
    fill: '#38a169',
    stroke: '#276749',
    glow: 'none',
    label: 'Normal Conditions',
    advice: 'Comfortable weather. Safe for outdoor activities.',
    badge: 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30',
    text: 'text-emerald-400'
  },
  moderate: {
    fill: '#d69e2e',
    stroke: '#975a16',
    glow: 'none',
    label: 'Moderate Heat',
    advice: 'Warm weather. Drink extra water if exercising outdoors.',
    badge: 'bg-amber-950/50 text-amber-300 border border-amber-500/30',
    text: 'text-amber-400'
  },
  high: {
    fill: '#dd6b20',
    stroke: '#9c4221',
    glow: 'none',
    label: 'High Heat Warning',
    advice: 'Uncomfortably hot. Take frequent shade breaks and stay hydrated.',
    badge: 'bg-orange-950/50 text-orange-300 border border-orange-500/30',
    text: 'text-orange-400'
  },
  severe: {
    fill: '#e53e3e',
    stroke: '#9b2c2c',
    glow: 'none',
    label: 'Severe Heat Risk (Stay Indoors)',
    advice: 'Dangerously high heat. Stay indoors in air-conditioned rooms.',
    badge: 'bg-red-950/60 text-red-300 border border-red-500/40',
    text: 'text-red-400'
  }
};

// Plain-English conversational timestamp formatter
export const formatConversationalTime = (activeHour: number): string => {
  const dayNumber = Math.floor(activeHour / 24);
  const hour24 = activeHour % 24;
  const isPeak = hour24 >= 12 && hour24 <= 16;

  let dayWord = 'Today';
  if (dayNumber === 1) dayWord = 'Tomorrow';
  else if (dayNumber === 2) dayWord = 'In 2 Days';
  else if (dayNumber === 3) dayWord = 'In 3 Days';
  else if (dayNumber === 4) dayWord = 'In 4 Days';

  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const timeStr = `${hour12}:00 ${period}`;

  if (isPeak) {
    return `${dayWord} at ${timeStr} (Afternoon Peak)`;
  }
  return `${dayWord} at ${timeStr}`;
};

// Generate 120-hour forecast (5 days) with realistic diurnal cycles and heatwave progression
function generateForecast120h(baseTemp: number, microclimateOffset: number, uhiFactor: number): HourlyForecast[] {
  const list: HourlyForecast[] = [];

  for (let h = 0; h < 120; h++) {
    const dayNumber = Math.floor(h / 24) + 1;
    const hourOfDay = h % 24;

    // Diurnal variation: cool at 5am, peak at 14:00-15:00
    const diurnalRad = ((hourOfDay - 5) / 24) * 2 * Math.PI;
    const diurnalCurve = -Math.cos(diurnalRad); // -1 at 5am, +1 at 17:00 approx
    
    // Synoptic heatwave wave: Day 2 to 4 peak
    const synopticBoost = Math.sin((h / 120) * Math.PI) * 4.5;

    // Solar radiation: 0 at night, peak ~1000 W/m2 at 13:00
    let solarRadiation = 0;
    if (hourOfDay >= 6 && hourOfDay <= 19) {
      solarRadiation = Math.sin(((hourOfDay - 6) / 13) * Math.PI) * 980;
    }

    const temp = Math.round(
      (baseTemp + diurnalCurve * 6.5 + synopticBoost + microclimateOffset + uhiFactor * 2.2) * 10
    ) / 10;

    // Humidity inversely correlates with peak afternoon heat
    const humidity = Math.round(
      Math.max(18, Math.min(85, 58 - diurnalCurve * 25 - (synopticBoost * 1.5)))
    );

    const windSpeed = Math.round((7 + Math.sin(h * 0.4) * 5) * 10) / 10;

    // Physiological indices:
    // WBGT approximation: 0.7 * WetBulb + 0.2 * Globe + 0.1 * DryBulb
    // Simplified standard empirical formula
    const wbgt = Math.round(
      (temp * 0.567 + 0.393 * (humidity / 100 * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp))) + 3.94 + (solarRadiation > 400 ? 1.8 : 0)) * 10
    ) / 10;

    // UTCI calculation approximation taking radiation, wind, humidity, and temp into account
    const utci = Math.round(
      (temp + (solarRadiation / 120) - (windSpeed * 0.25) + (humidity > 45 ? (humidity - 45) * 0.15 : -1.0) + (uhiFactor * 1.5)) * 10
    ) / 10;

    const heatIndex = Math.round((temp + (humidity / 100) * 8.5) * 10) / 10;
    const riskTier = calculateRiskTier(utci, wbgt);

    // Hospitalization spike: exponentially rises above UTCI 36°C
    let spike = 0;
    if (utci > 32) {
      spike = Math.round(Math.pow(utci - 32, 1.6) * 7.5 + (uhiFactor * 12));
    }

    const peakHeatHour = hourOfDay >= 12 && hourOfDay <= 16;
    const formattedTime = `Day ${dayNumber} • ${String(hourOfDay).padStart(2, '0')}:00`;

    list.push({
      hourIndex: h,
      timestamp: formattedTime,
      temp,
      humidity,
      windSpeed,
      solarRadiation: Math.round(solarRadiation),
      utci,
      wbgt,
      heatIndex,
      riskTier,
      projectedHospitalizationSpike: Math.min(240, spike),
      peakHeatHour
    });
  }

  return list;
}

// ----------------------------------------------------
// Macro Regions (National / State Level Hierarchy)
// ----------------------------------------------------
export const MACRO_REGIONS: RegionFeature[] = [
  {
    id: 'reg_metro_central',
    name: 'Capital Metropolitan Core',
    code: 'CMC-01',
    center: [28.625, 77.215],
    zoomLevel: 12,
    population: 8640000,
    areaKm2: 412,
    coordinates: [[
      [28.740, 77.080],
      [28.750, 77.340],
      [28.510, 77.350],
      [28.490, 77.100],
      [28.740, 77.080]
    ]],
    forecast: generateForecast120h(38.5, 1.8, 1.8),
    wardIds: ['ward_01', 'ward_02', 'ward_03', 'ward_04', 'ward_05', 'ward_06', 'ward_07', 'ward_08']
  },
  {
    id: 'reg_north_plains',
    name: 'Northern Agricultural Belt',
    code: 'NAB-02',
    center: [28.920, 77.150],
    zoomLevel: 11,
    population: 3210000,
    areaKm2: 890,
    coordinates: [[
      [28.740, 77.080],
      [28.990, 77.040],
      [29.010, 77.380],
      [28.750, 77.340],
      [28.740, 77.080]
    ]],
    forecast: generateForecast120h(36.8, -0.8, -0.5),
    wardIds: []
  },
  {
    id: 'reg_west_industrial',
    name: 'Western Manufacturing Corridor',
    code: 'WMC-03',
    center: [28.610, 76.920],
    zoomLevel: 11,
    population: 4150000,
    areaKm2: 670,
    coordinates: [[
      [28.740, 77.080],
      [28.490, 77.100],
      [28.450, 76.800],
      [28.760, 76.790],
      [28.740, 77.080]
    ]],
    forecast: generateForecast120h(39.2, 1.2, 1.6),
    wardIds: []
  },
  {
    id: 'reg_south_tech',
    name: 'South Cyber & Financial District',
    code: 'SFD-04',
    center: [28.440, 77.190],
    zoomLevel: 11,
    population: 3820000,
    areaKm2: 520,
    coordinates: [[
      [28.490, 77.100],
      [28.510, 77.350],
      [28.320, 77.320],
      [28.310, 77.060],
      [28.490, 77.100]
    ]],
    forecast: generateForecast120h(37.5, 0.4, 0.7),
    wardIds: []
  },
  {
    id: 'reg_east_basin',
    name: 'Eastern River Floodplain & Wetlands',
    code: 'ERF-05',
    center: [28.630, 77.420],
    zoomLevel: 11,
    population: 2940000,
    areaKm2: 610,
    coordinates: [[
      [28.750, 77.340],
      [28.760, 77.580],
      [28.480, 77.590],
      [28.510, 77.350],
      [28.750, 77.340]
    ]],
    forecast: generateForecast120h(36.2, -1.2, -0.8),
    wardIds: []
  }
];

// ----------------------------------------------------
// Granular Hyper-Local Municipal Wards (Drill-Down)
// ----------------------------------------------------
export const MUNICIPAL_WARDS: WardFeature[] = [
  {
    id: 'ward_01',
    name: 'Ward 01 - Old Historic Walled Quarter',
    code: 'W-01-OHQ',
    regionId: 'reg_metro_central',
    areaKm2: 18.5,
    population: 580000,
    vulnerability: {
      elderlyPercentage: 21.4,
      informalWorkersPercentage: 42.6,
      treeCanopyCoverage: 4.8,
      imperviousSurface: 92.5,
      baselineVulnerabilityScore: 89
    },
    center: [28.655, 77.230],
    coordinates: [[
      [28.675, 77.210],
      [28.678, 77.255],
      [28.640, 77.252],
      [28.638, 77.208],
      [28.675, 77.210]
    ]],
    forecast: generateForecast120h(39.8, 2.2, 2.5) // extreme urban heat island
  },
  {
    id: 'ward_02',
    name: 'Ward 02 - Central Administrative & Diplomatic Enclave',
    code: 'W-02-CADE',
    regionId: 'reg_metro_central',
    areaKm2: 32.4,
    population: 240000,
    vulnerability: {
      elderlyPercentage: 14.1,
      informalWorkersPercentage: 12.3,
      treeCanopyCoverage: 44.5,
      imperviousSurface: 41.0,
      baselineVulnerabilityScore: 28
    },
    center: [28.615, 77.205],
    coordinates: [[
      [28.638, 77.180],
      [28.640, 77.240],
      [28.590, 77.238],
      [28.588, 77.178],
      [28.638, 77.180]
    ]],
    forecast: generateForecast120h(37.0, -1.8, -1.2) // high canopy buffer
  },
  {
    id: 'ward_03',
    name: 'Ward 03 - West Industrial Hub & Foundry Belt',
    code: 'W-03-WIHF',
    regionId: 'reg_metro_central',
    areaKm2: 42.0,
    population: 710000,
    vulnerability: {
      elderlyPercentage: 12.8,
      informalWorkersPercentage: 64.2, // high outdoor factory & metal work
      treeCanopyCoverage: 6.2,
      imperviousSurface: 88.4,
      baselineVulnerabilityScore: 94
    },
    center: [28.650, 77.135],
    coordinates: [[
      [28.680, 77.095],
      [28.675, 77.180],
      [28.620, 77.175],
      [28.618, 77.090],
      [28.680, 77.095]
    ]],
    forecast: generateForecast120h(40.4, 2.8, 2.6) // furnace & asphalt heat
  },
  {
    id: 'ward_04',
    name: 'Ward 04 - Yamuna Riverfront & Transit Terminal',
    code: 'W-04-YRTT',
    regionId: 'reg_metro_central',
    areaKm2: 28.6,
    population: 495000,
    vulnerability: {
      elderlyPercentage: 15.6,
      informalWorkersPercentage: 48.0,
      treeCanopyCoverage: 18.2,
      imperviousSurface: 74.0,
      baselineVulnerabilityScore: 68
    },
    center: [28.650, 77.275],
    coordinates: [[
      [28.680, 77.255],
      [28.675, 77.310],
      [28.615, 77.305],
      [28.620, 77.250],
      [28.680, 77.255]
    ]],
    forecast: generateForecast120h(38.2, 0.4, 0.5) // river breeze offset by crowds
  },
  {
    id: 'ward_05',
    name: 'Ward 05 - North University & Medical Ridge',
    code: 'W-05-NUMR',
    regionId: 'reg_metro_central',
    areaKm2: 36.8,
    population: 410000,
    vulnerability: {
      elderlyPercentage: 19.8,
      informalWorkersPercentage: 22.0,
      treeCanopyCoverage: 34.0,
      imperviousSurface: 56.0,
      baselineVulnerabilityScore: 42
    },
    center: [28.705, 77.210],
    coordinates: [[
      [28.740, 77.165],
      [28.745, 77.260],
      [28.678, 77.255],
      [28.675, 77.160],
      [28.740, 77.165]
    ]],
    forecast: generateForecast120h(37.5, -0.6, -0.3)
  },
  {
    id: 'ward_06',
    name: 'Ward 06 - South High-Density Informal Settlement',
    code: 'W-06-SHIS',
    regionId: 'reg_metro_central',
    areaKm2: 24.5,
    population: 890000, // packed tin-roof slums
    vulnerability: {
      elderlyPercentage: 17.5,
      informalWorkersPercentage: 71.5,
      treeCanopyCoverage: 3.1,
      imperviousSurface: 95.2,
      baselineVulnerabilityScore: 98
    },
    center: [28.555, 77.260],
    coordinates: [[
      [28.590, 77.225],
      [28.588, 77.305],
      [28.520, 77.300],
      [28.525, 77.220],
      [28.590, 77.225]
    ]],
    forecast: generateForecast120h(41.1, 3.4, 3.1) // severe heat retention
  },
  {
    id: 'ward_07',
    name: 'Ward 07 - Southwest Logistics & Rail Corridor',
    code: 'W-07-SLRC',
    regionId: 'reg_metro_central',
    areaKm2: 48.0,
    population: 520000,
    vulnerability: {
      elderlyPercentage: 13.9,
      informalWorkersPercentage: 54.8,
      treeCanopyCoverage: 9.5,
      imperviousSurface: 84.1,
      baselineVulnerabilityScore: 82
    },
    center: [28.550, 77.140],
    coordinates: [[
      [28.588, 77.090],
      [28.590, 77.190],
      [28.515, 77.185],
      [28.510, 77.085],
      [28.588, 77.090]
    ]],
    forecast: generateForecast120h(39.6, 1.9, 1.8)
  },
  {
    id: 'ward_08',
    name: 'Ward 08 - Heritage Ridge Forest Reserve',
    code: 'W-08-HRFR',
    regionId: 'reg_metro_central',
    areaKm2: 38.5,
    population: 145000,
    vulnerability: {
      elderlyPercentage: 16.0,
      informalWorkersPercentage: 15.0,
      treeCanopyCoverage: 62.0,
      imperviousSurface: 24.0,
      baselineVulnerabilityScore: 22
    },
    center: [28.550, 77.195],
    coordinates: [[
      [28.590, 77.178],
      [28.590, 77.225],
      [28.520, 77.220],
      [28.515, 77.180],
      [28.590, 77.178]
    ]],
    forecast: generateForecast120h(35.8, -2.5, -2.1) // natural cool sink
  }
];

// ----------------------------------------------------
// Infrastructure Assets (Cooling shelters, water, health)
// ----------------------------------------------------
export const INFRASTRUCTURE_ASSETS: InfrastructureAsset[] = [
  // Cooling Shelters
  {
    id: 'cs_01',
    name: 'City Hall Air-Conditioned Public Refuge',
    type: 'cooling_shelter',
    wardId: 'ward_01',
    location: [28.656, 77.232],
    status: 'active',
    capacity: 450,
    currentUsage: 310,
    features: ['Aux Power Generator', 'High-Output Misting Fans', 'Free Electrolyte Packs', 'Medical Cot Bay'],
    contact: 'Dispatcher #04 (Toll-Free: 1800-11-0021)'
  },
  {
    id: 'cs_02',
    name: 'Central Railway Concourse Cooling Zone',
    type: 'cooling_shelter',
    wardId: 'ward_01',
    location: [28.642, 77.221],
    status: 'alert',
    capacity: 800,
    currentUsage: 760,
    features: ['High-Velocity Chilled Air', 'Paramedic Desk', 'Hydration Taps'],
    contact: 'Station Health Desk (+91-11-2334001)'
  },
  {
    id: 'cs_03',
    name: 'Industrial Workers Community Shelter',
    type: 'cooling_shelter',
    wardId: 'ward_03',
    location: [28.652, 77.140],
    status: 'full_capacity',
    capacity: 600,
    currentUsage: 615,
    features: ['Industrial Shading', 'Cold Towel Stations', 'Continuous Rehydration'],
    contact: 'Labor Welfare Bureau (+91-11-2512998)'
  },
  {
    id: 'cs_04',
    name: 'South Sector Community Center Refuge',
    type: 'cooling_shelter',
    wardId: 'ward_06',
    location: [28.558, 77.265],
    status: 'active',
    capacity: 500,
    currentUsage: 440,
    features: ['Solar AC Hybrid', 'Pediatric Resting Pods', 'ORS Distribution'],
    contact: 'Municipal Ward Officer (+91-11-2644200)'
  },
  {
    id: 'cs_05',
    name: 'University Sports Complex Cooling Hub',
    type: 'cooling_shelter',
    wardId: 'ward_05',
    location: [28.708, 77.215],
    status: 'standby',
    capacity: 1200,
    currentUsage: 180,
    features: ['Olympic Hall AC', 'Bulk Seating', 'Ambulance Staging Ground'],
    contact: 'Campus Emergency Unit'
  },

  // Drinking Water & Hydration Tankers
  {
    id: 'ws_01',
    name: 'High-Volume Water Tanker Point #07',
    type: 'hydration_station',
    wardId: 'ward_01',
    location: [28.660, 77.228],
    status: 'active',
    capacity: 15000, // liters/day
    currentUsage: 11200,
    features: ['Chilled Mineral Dispenser', 'Continuous Water Purification', 'ORS Powder'],
    contact: 'Water Board Rapid Unit'
  },
  {
    id: 'ws_02',
    name: 'Labor Hub Hydration Depot',
    type: 'hydration_station',
    wardId: 'ward_03',
    location: [28.648, 77.125],
    status: 'active',
    capacity: 25000,
    currentUsage: 21800,
    features: ['4 High-Speed Dispenser Taps', 'Cold Water Tanks', 'Electrolyte Dispenser'],
    contact: 'Water Board Rapid Unit'
  },
  {
    id: 'ws_03',
    name: 'Informal Settlement Tanker Cluster #12',
    type: 'hydration_station',
    wardId: 'ward_06',
    location: [28.551, 77.255],
    status: 'alert',
    capacity: 30000,
    currentUsage: 28900,
    features: ['Mobile Fleet Refill (Every 2h)', 'Emergency Chlorine Treatment'],
    contact: 'Emergency Tanker Dispatch'
  },
  {
    id: 'ws_04',
    name: 'Logistics Rail Yard Drinking Fountain',
    type: 'hydration_station',
    wardId: 'ward_07',
    location: [28.545, 77.135],
    status: 'active',
    capacity: 10000,
    currentUsage: 6400,
    features: ['Public Fountain Grid', 'Filter Monitored'],
    contact: 'Rail Infrastructure Unit'
  },

  // Primary Health Centers (PHC)
  {
    id: 'hc_01',
    name: 'Civil Hospital Heat-Stroke Clinic',
    type: 'health_center',
    wardId: 'ward_01',
    location: [28.665, 77.222],
    status: 'alert',
    capacity: 40, // beds
    currentUsage: 36,
    features: ['Cold Water Immersion Tubs', 'IV Saline Infusion Bay', 'ICU Stabilization'],
    contact: 'Emergency ER Hotline: 102'
  },
  {
    id: 'hc_02',
    name: 'Industrial Area Primary Care Center',
    type: 'health_center',
    wardId: 'ward_03',
    location: [28.645, 77.148],
    status: 'full_capacity',
    capacity: 30,
    currentUsage: 30,
    features: ['Core Temp Monitoring', 'Evaporative Cooling Mats', 'Dedicated Ambulance'],
    contact: 'ER Trauma Team'
  },
  {
    id: 'hc_03',
    name: 'South Municipal Health Center',
    type: 'health_center',
    wardId: 'ward_06',
    location: [28.562, 77.270],
    status: 'active',
    capacity: 50,
    currentUsage: 42,
    features: ['Rapid Electrolyte Testing', '24/7 Paramedic Response', 'Oxygen Concentrators'],
    contact: 'Health Post #06'
  },

  // Major Emergency Hospitals
  {
    id: 'hosp_01',
    name: 'Apex Institute of Medical Sciences & Trauma',
    type: 'hospital',
    wardId: 'ward_02',
    location: [28.605, 77.215],
    status: 'active',
    capacity: 350, // heat emergency beds
    currentUsage: 220,
    features: ['Level 1 Critical Care', 'Cryo-Cooling Tents', 'Mass Casualty Triage Bay'],
    contact: 'Central Disaster Helpline: 108'
  },
  {
    id: 'hosp_02',
    name: 'Northern Metropolitan General Hospital',
    type: 'hospital',
    wardId: 'ward_05',
    location: [28.712, 77.220],
    status: 'active',
    capacity: 220,
    currentUsage: 140,
    features: ['Specialized Hyperthermia Ward', 'Neurological ICU', 'Helipad'],
    contact: 'Main Switchboard'
  },
  {
    id: 'hosp_03',
    name: 'South Regional Trauma Center',
    type: 'hospital',
    wardId: 'ward_07',
    location: [28.535, 77.150],
    status: 'active',
    capacity: 280,
    currentUsage: 210,
    features: ['Rapid Thermal Reduction Bay', 'Hemodialysis Unit', 'Burn/Heat Wound Unit'],
    contact: 'Trauma Reception'
  }
];

// ----------------------------------------------------
// Automated Alert History & Live Action Log Feed
// ----------------------------------------------------
export const SEED_ALERTS: AutomatedAlert[] = [
  {
    id: 'alt_01',
    timestamp: 'Day 2 • 14:15',
    hourIndex: 38,
    tier: 'severe',
    regionOrWard: 'Ward 06 - South High-Density Informal Settlement',
    title: 'CRITICAL UTCI THRESHOLD EXCEEDED (44.2°C)',
    message: 'Physiological stress reached Tier 4 (Severe/Fatal). Immediate hyperthermia risk for outdoor laborers & uninsulated dwellings.',
    actionTaken: 'Automated SMS broadcast to 142,000 SIM cards. 4 mobile misting tankers deployed. Cooling centers CS-04 & CS-05 ordered to 24/7 surge capacity.'
  },
  {
    id: 'alt_02',
    timestamp: 'Day 2 • 13:30',
    hourIndex: 37,
    tier: 'severe',
    regionOrWard: 'Ward 03 - West Industrial Hub',
    title: 'OUTDOOR WORK CEASE-OPERATION TRIGGERED',
    message: 'WBGT reached 32.4°C. Exceeds National Occupational Safety limit for heavy physical exertion.',
    actionTaken: 'Enforcement directive pushed to 85 registered construction and foundry sites. Labor commissioner alert dispatched.'
  },
  {
    id: 'alt_03',
    timestamp: 'Day 2 • 11:45',
    hourIndex: 35,
    tier: 'high',
    regionOrWard: 'Ward 01 - Old Historic Walled Quarter',
    title: 'HOSPITALIZATION SURGE PROJECTION +68%',
    message: 'Elderly population cohort (21.4%) experiencing sustained indoor thermal buildup above 37°C.',
    actionTaken: 'Primary Health Center HC-01 opened secondary cold-immersion bay. 2000 ORS packets delivered to municipal outreach teams.'
  },
  {
    id: 'alt_04',
    timestamp: 'Day 1 • 15:00',
    hourIndex: 15,
    tier: 'high',
    regionOrWard: 'Capital Metropolitan Core',
    title: 'PEAK AFTERNOON DIURNAL SPIKE',
    message: 'Regional average UTCI climbed to 36.8°C. Concrete canyon microclimate intensifying.',
    actionTaken: 'Hydration tankers WS-01, WS-02, WS-03 switched to continuous free dispensing mode.'
  },
  {
    id: 'alt_05',
    timestamp: 'Day 1 • 09:00',
    hourIndex: 9,
    tier: 'moderate',
    regionOrWard: 'All Zones',
    title: 'HEATWAVE WARNING ADVISORY ISSUED',
    message: 'Synoptic forecast models predict multi-day heat dome over Northern plains.',
    actionTaken: 'Municipal command center shifted to Level 2 operational readiness.'
  }
];
