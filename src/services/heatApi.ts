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

export interface WardLiveTelemetryResponse {
  ward_id: string;
  name: string;
  district: string;
  state: string;
  center: [number, number];
  area_km2: number;
  population: number;
  vulnerability: {
    elderly_percentage: number;
    informal_workers_percentage: number;
    tree_canopy_coverage: number;
    impervious_surface: number;
    baseline_vulnerability_score: number;
  };
  hour_index: number;
  timestamp: string;
  telemetry: {
    air_temperature: number;
    relative_humidity: number;
    wind_speed: number;
    wind_speed_kmh: number;
    wind_speed_unit: string;
    solar_radiation: number;
    mean_radiant_temperature: number;
  };
  thermal_comfort: {
    utci: number;
    heat_index: number;
    wbgt: number;
    hazard_tier: 'Low' | 'Moderate' | 'High' | 'Severe';
    risk_tier: 'low' | 'moderate' | 'high' | 'severe';
    label: string;
    advice: string;
    projected_hospitalization_spike: number;
    stress_category: string;
    color_hex: string;
  };
  forecasts: Record<string, {
    level: string;
    label: string;
    temp: string;
    advice: string;
    peak_utci: string;
    peak_heat_index: string;
  }>;
  hourly_forecast: any[];
  assets: any[];
  last_simulated_at: string;
}

/**
 * Fetch dynamic live microclimate telemetry and pythermalcomfort metrics for a specific ward
 */
export async function fetchWardLiveTelemetry(wardId: string, hour?: number): Promise<WardLiveTelemetryResponse> {
  const query = typeof hour === 'number' ? `?hour=${hour}` : '';
  const response = await fetch(`${API_BASE_URL}/api/ward/${encodeURIComponent(wardId)}${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch live telemetry for ${wardId}: ${response.statusText}`);
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

export interface BroadcastAlertPayload {
  ward_id: string;
  ward_name?: string;
  district?: string;
  risk_tier?: string;
  air_temperature?: number;
  relative_humidity?: number;
  utci?: number;
  heat_index?: number;
  projected_hospitalization_spike?: number;
  phone_number?: string;
  channels?: string[];
  custom_message?: string;
}

export interface BroadcastAlertResponse {
  status: string;
  broadcast_id: string;
  ward_id: string;
  ward_name: string;
  district: string;
  risk_tier: string;
  transmission_timestamp: string;
  recipients_count: number;
  channels: string[];
  gateway: string;
  delivery_report?: any;
  recipient_target: string;
  message: string;
  confirmation: string;
}

/**
 * Axios-compatible client utility matching axios.post requirements
 */
export const axios = {
  post: async <T = any>(url: string, data?: any, config?: any): Promise<{ data: T; status: number; statusText: string }> => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Broadcast request failed with status: ${res.status} ${res.statusText}`);
    }
    const resData = await res.json();
    return {
      data: resData,
      status: res.status,
      statusText: res.statusText
    };
  }
};

/**
 * Dispatch automated emergency WhatsApp & SMS broadcast via FastAPI backend
 */
export async function broadcastEmergencyAlert(payload: BroadcastAlertPayload): Promise<BroadcastAlertResponse> {
  const res = await axios.post<BroadcastAlertResponse>('/api/broadcast-alert', payload);
  return res.data;
}

