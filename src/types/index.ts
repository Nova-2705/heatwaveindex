export type RiskTier = 'low' | 'moderate' | 'high' | 'severe';

export interface HourlyForecast {
  hourIndex: number; // 0 to 119 (120 hours)
  timestamp: string; // ISO or formatted date "Day 1, 14:00"
  temp: number; // Celsius
  humidity: number; // %
  windSpeed: number; // km/h
  solarRadiation: number; // W/m2
  utci: number; // Universal Thermal Climate Index (°C)
  wbgt: number; // Wet Bulb Globe Temperature (°C)
  heatIndex: number; // °C
  riskTier: RiskTier;
  projectedHospitalizationSpike: number; // % increase (e.g. +45%)
  peakHeatHour: boolean; // 12:00 - 16:00
}

export interface WardFeature {
  id: string;
  name: string;
  code: string;
  regionId: string;
  areaKm2: number;
  population: number;
  vulnerability: {
    elderlyPercentage: number; // e.g. 16.5%
    informalWorkersPercentage: number; // e.g. 38.2%
    treeCanopyCoverage: number; // e.g. 8.4%
    imperviousSurface: number; // e.g. 82.0%
    baselineVulnerabilityScore: number; // 0 - 100
  };
  coordinates: [number, number][][]; // GeoJSON polygon rings [lat, lng]
  center: [number, number]; // [lat, lng]
  forecast: HourlyForecast[];
}

export interface RegionFeature {
  id: string;
  name: string;
  code: string;
  center: [number, number];
  zoomLevel: number;
  population: number;
  areaKm2: number;
  coordinates: [number, number][][];
  forecast: HourlyForecast[];
  wardIds: string[];
}

export type AssetType = 'cooling_shelter' | 'hydration_station' | 'health_center' | 'hospital';

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: AssetType;
  wardId: string;
  location: [number, number]; // [lat, lng]
  status: 'active' | 'full_capacity' | 'standby' | 'alert';
  capacity: number; // max people or liters/day
  currentUsage: number; // current people or %
  features: string[]; // e.g. ["AC Backup", "IV Fluids", "Cold Immersion Tub", "Misting Fans"]
  contact: string;
}

export interface AutomatedAlert {
  id: string;
  timestamp: string;
  hourIndex: number;
  tier: RiskTier;
  regionOrWard: string;
  title: string;
  message: string;
  actionTaken: string;
  acknowledged?: boolean;
}

export interface LayerVisibility {
  riskChoropleth: boolean;
  coolingShelters: boolean;
  hydrationStations: boolean;
  healthCenters: boolean;
  hospitals: boolean;
  vulnerabilityHeatmap: boolean;
  urbanHeatIslandHotspots: boolean;
}
