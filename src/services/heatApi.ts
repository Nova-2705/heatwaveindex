/**
 * HeatWave API Client for React Frontend
 * Connects to the local FastAPI backend (http://127.0.0.1:8000)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000');

export interface StressCalculationPayload {
  air_temperature: number;
  relative_humidity: number;
  wind_speed?: number;
  wind_speed_unit?: 'm/s' | 'km/h';
  mean_radiant_temperature?: number;
  solar_radiation?: number;
}

export interface StressCalculationResult {
  utci: number;
  heat_index: number;
  hazard_tier: 'Low' | 'Moderate' | 'High' | 'Severe';
  risk_tier: 'low' | 'moderate' | 'high' | 'severe';
  label: string;
  advice: string;
  projected_hospitalization_spike: number;
  color_hex: string;
  stress_category: string;
}

/**
 * Fetch dynamic West Bengal GeoJSON features with 5-day multi-temporal risk attributes
 */
export async function fetchWardsGeoJSON() {
  const response = await fetch(`${API_BASE_URL}/api/wards`);
  if (!response.ok) {
    throw new Error(`Failed to fetch wards GeoJSON: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Calculate biometeorological thermal indices (UTCI & Heat Index) using pythermalcomfort
 */
export async function calculateThermalStress(payload: StressCalculationPayload): Promise<StressCalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate-stress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to calculate thermal stress: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch 5-day rolling forecast vector (120 hours) for a specific ward
 */
export async function fetchWardForecast(wardId: string) {
  const response = await fetch(`${API_BASE_URL}/api/forecast/${encodeURIComponent(wardId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast for ${wardId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch cooling shelters, hydration stations, and heat trauma centers
 */
export async function fetchEmergencyAssets(wardId?: string, assetType?: string) {
  const params = new URLSearchParams();
  if (wardId) params.append('ward_id', wardId);
  if (assetType) params.append('asset_type', assetType);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/assets${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }
  return response.json();
}
