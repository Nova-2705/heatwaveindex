import { create } from 'zustand';
import type { LayerVisibility, RiskTier, AutomatedAlert } from '../types';
import { SEED_ALERTS } from '../data/geoData';
import { fetchWardsGeoJSON, fetchWardLiveTelemetry, broadcastEmergencyAlert, type WardLiveTelemetryResponse } from '../services/heatApi';

export interface BroadcastToastState {
  id: string;
  type: 'success' | 'loading' | 'error';
  title: string;
  message: string;
  details?: {
    ward_id?: string;
    ward_name?: string;
    recipients_count?: number;
    channels?: string[];
    timestamp?: string;
  };
}

interface CommandCenterState {
  // Timeline State
  activeHour: number; // 0 - 119
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 5x, 10x

  // Geospatial Navigation
  viewLevel: 'macro' | 'ward';
  selectedRegionId: string | null;
  selectedWardId: string | null;

  // Layer Toggles
  layers: LayerVisibility;

  // Filtering
  filterRiskTier: 'all' | RiskTier;
  searchQuery: string;

  // UI State
  isSidebarOpen: boolean;
  activeSidebarTab: 'drilldown' | 'alerts' | 'assets' | 'protocols';
  isBroadcastModalOpen: boolean;
  isSitRepModalOpen: boolean;

  // Emergency Broadcast Toast & Dispatch State
  broadcastToast: BroadcastToastState | null;
  isBroadcasting: boolean;
  setBroadcastToast: (toast: BroadcastToastState | null) => void;
  triggerEmergencyBroadcast: (targetWardId?: string) => Promise<void>;

  // Alert Log
  alerts: AutomatedAlert[];

  // Live FastAPI Backend Integration
  liveWardsGeoJSON: any | null;
  backendConnected: boolean;
  isStressModalOpen: boolean;
  lastBackendSync: string | null;

  // Live Ward Telemetry Click & Fetch State
  isFetchingWardTelemetry: boolean;
  fetchingWardName: string | null;
  wardTelemetryError: string | null;
  activeWardTelemetry: WardLiveTelemetryResponse | null;
  calculatorPrefill: {
    air_temp: number;
    humidity: number;
    wind_speed: number;
    solar_radiation: number;
    ward_name?: string;
  } | null;

  // Actions
  setActiveHour: (hour: number) => void;
  stepHour: (delta: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  selectRegion: (regionId: string | null) => void;
  selectWard: (wardId: string | null) => void;
  fetchAndInspectWard: (wardId: string, openMode?: 'sidebar' | 'modal' | 'both') => Promise<void>;
  setCalculatorPrefill: (prefill: { air_temp: number; humidity: number; wind_speed: number; solar_radiation: number; ward_name?: string } | null) => void;
  closeWardInspector: () => void;
  resetToMacroView: () => void;

  toggleLayer: (layerKey: keyof LayerVisibility) => void;
  setFilterRiskTier: (tier: 'all' | RiskTier) => void;
  setSearchQuery: (query: string) => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: 'drilldown' | 'alerts' | 'assets' | 'protocols') => void;
  setBroadcastModalOpen: (open: boolean) => void;
  setSitRepModalOpen: (open: boolean) => void;
  setStressModalOpen: (open: boolean) => void;
  setLiveWardsGeoJSON: (data: any) => void;
  setBackendConnected: (connected: boolean) => void;
  refreshWardsFromBackend: () => Promise<void>;

  dispatchEmergencyBroadcast: (title: string, message: string, actionTaken: string) => void;
  acknowledgeAlert: (alertId: string) => void;
}

export const useCommandCenterStore = create<CommandCenterState>((set, get) => ({
  activeHour: 38, // Day 2, 14:00 (peak afternoon heatwave)
  isPlaying: false,
  playbackSpeed: 1,

  viewLevel: 'ward',
  selectedRegionId: 'west_bengal',
  selectedWardId: null, // Hidden by default

  layers: {
    riskChoropleth: true,
    coolingShelters: true,
    hydrationStations: true,
    healthCenters: true,
    hospitals: true,
    vulnerabilityHeatmap: false,
    urbanHeatIslandHotspots: false,
  },

  filterRiskTier: 'all',
  searchQuery: '',

  isSidebarOpen: false, // Drawer hidden by default
  activeSidebarTab: 'drilldown',
  isBroadcastModalOpen: false,
  isSitRepModalOpen: false,
  isStressModalOpen: false,
  broadcastToast: null,
  isBroadcasting: false,

  liveWardsGeoJSON: null,
  backendConnected: false,
  lastBackendSync: null,
  alerts: SEED_ALERTS,

  isFetchingWardTelemetry: false,
  fetchingWardName: null,
  wardTelemetryError: null,
  activeWardTelemetry: null,
  calculatorPrefill: null,

  setActiveHour: (hour) => {
    const clamped = Math.max(0, Math.min(119, hour));
    set({ activeHour: clamped });
  },

  stepHour: (delta) => {
    const { activeHour } = get();
    const next = Math.max(0, Math.min(119, activeHour + delta));
    set({ activeHour: next });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  selectRegion: (regionId) => {
    set({
      selectedRegionId: regionId,
      viewLevel: regionId ? 'ward' : 'macro',
      selectedWardId: null,
      isSidebarOpen: false
    });
  },

  selectWard: (wardId) => {
    set({
      selectedWardId: wardId,
      isSidebarOpen: Boolean(wardId)
    });
    if (wardId) {
      get().fetchAndInspectWard(wardId, 'sidebar');
    }
  },

  setCalculatorPrefill: (prefill) => {
    set({ calculatorPrefill: prefill });
  },

  fetchAndInspectWard: async (wardId: string, openMode: 'sidebar' | 'modal' | 'both' = 'sidebar') => {
    const { activeHour, liveWardsGeoJSON } = get();
    
    // Find initial friendly name from loaded GeoJSON features
    let friendlyName = wardId;
    if (liveWardsGeoJSON?.features) {
      const match = liveWardsGeoJSON.features.find((f: any) => f.properties?.id === wardId);
      if (match?.properties?.name) {
        friendlyName = match.properties.name;
      }
    }

    set({
      selectedWardId: wardId,
      isFetchingWardTelemetry: true,
      fetchingWardName: friendlyName,
      wardTelemetryError: null,
      isSidebarOpen: openMode === 'sidebar' || openMode === 'both',
      isStressModalOpen: openMode === 'modal' ? true : get().isStressModalOpen
    });

    try {
      const telemetry = await fetchWardLiveTelemetry(wardId, activeHour);
      set({
        activeWardTelemetry: telemetry,
        backendConnected: true,
        lastBackendSync: new Date().toLocaleTimeString(),
        calculatorPrefill: {
          air_temp: telemetry.telemetry.air_temperature,
          humidity: telemetry.telemetry.relative_humidity,
          wind_speed: telemetry.telemetry.wind_speed,
          solar_radiation: telemetry.telemetry.solar_radiation,
          ward_name: telemetry.name
        },
        isStressModalOpen: openMode === 'modal' || openMode === 'both' ? true : get().isStressModalOpen
      });
    } catch (err: any) {
      console.warn(`[HeatWaveGIS] Error fetching live telemetry for ${wardId}:`, err);
      set({
        wardTelemetryError: err?.message || 'Microclimate sensor sync timeout - serving cached profile',
      });
    } finally {
      set({ isFetchingWardTelemetry: false });
    }
  },

  closeWardInspector: () => {
    set({
      selectedWardId: null,
      isSidebarOpen: false
    });
  },

  resetToMacroView: () => {
    set({
      viewLevel: 'macro',
      selectedRegionId: null,
      selectedWardId: null,
      isSidebarOpen: false
    });
  },

  toggleLayer: (layerKey) => {
    set((state) => ({
      layers: {
        ...state.layers,
        [layerKey]: !state.layers[layerKey]
      }
    }));
  },

  setFilterRiskTier: (tier) => set({ filterRiskTier: tier }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setBroadcastModalOpen: (open) => set({ isBroadcastModalOpen: open }),
  setSitRepModalOpen: (open) => set({ isSitRepModalOpen: open }),
  setStressModalOpen: (open) => set({ isStressModalOpen: open }),
  setLiveWardsGeoJSON: (data) => set({ liveWardsGeoJSON: data }),
  setBackendConnected: (connected) => set({ backendConnected: connected }),

  refreshWardsFromBackend: async () => {
    try {
      const data = await fetchWardsGeoJSON();
      if (data && data.features && data.features.length > 0) {
        set({
          liveWardsGeoJSON: data,
          backendConnected: true,
          lastBackendSync: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.warn('Backend sync failed, falling back to local dataset', err);
      set({ backendConnected: false });
    }
  },

  setBroadcastToast: (toast) => set({ broadcastToast: toast }),

  triggerEmergencyBroadcast: async (targetWardId?: string) => {
    const { selectedWardId, liveWardsGeoJSON, activeWardTelemetry } = get();
    const wardId = targetWardId || selectedWardId || 'WB-KOL-01';
    
    // Find friendly name
    let wardName = 'West Bengal Sector';
    if (activeWardTelemetry?.name && activeWardTelemetry.ward_id === wardId) {
      wardName = activeWardTelemetry.name;
    } else if (liveWardsGeoJSON?.features) {
      const match = liveWardsGeoJSON.features.find((f: any) => f.properties?.id === wardId);
      if (match?.properties?.name) {
        wardName = match.properties.name;
      }
    }

    set({
      isBroadcasting: true,
      broadcastToast: {
        id: `toast_loading_${Date.now()}`,
        type: 'loading',
        title: 'TRANSMITTING EMERGENCY DIRECTIVE...',
        message: `Connecting to Twilio & WhatsApp Gateway for ${wardName}...`
      }
    });

    try {
      const payload = {
        ward_id: wardId,
        ward_name: wardName,
        risk_tier: activeWardTelemetry?.thermal_comfort?.risk_tier || 'severe',
        air_temperature: activeWardTelemetry?.telemetry?.air_temperature || 42.0,
        relative_humidity: activeWardTelemetry?.telemetry?.relative_humidity || 65,
        utci: activeWardTelemetry?.thermal_comfort?.utci || 50.5,
        heat_index: activeWardTelemetry?.thermal_comfort?.heat_index || 56.0,
        projected_hospitalization_spike: activeWardTelemetry?.thermal_comfort?.projected_hospitalization_spike || 250,
        phone_number: '+919836262900',
        channels: ['whatsapp', 'sms']
      };

      const result = await broadcastEmergencyAlert(payload);

      // Add to alert log
      get().dispatchEmergencyBroadcast(
        `🚨 EMERGENCY BROADCAST: ${result.ward_name.toUpperCase()}`,
        result.message,
        `Dispatched via ${result.gateway} to ${result.recipients_count} field officers.`
      );

      set({
        isBroadcasting: false,
        broadcastToast: {
          id: result.broadcast_id,
          type: 'success',
          title: '🚨 EMERGENCY DIRECTIVE DISPATCHED',
          message: result.confirmation || `SMS & WhatsApp alert successfully dispatched to ${result.recipients_count} ward field officers via Twilio/WhatsApp Gateway`,
          details: {
            ward_id: result.ward_id,
            ward_name: result.ward_name,
            recipients_count: result.recipients_count,
            channels: result.channels,
            timestamp: result.transmission_timestamp
          }
        }
      });
    } catch (err: any) {
      console.error('Failed to dispatch broadcast alert:', err);
      set({
        isBroadcasting: false,
        broadcastToast: {
          id: `toast_err_${Date.now()}`,
          type: 'error',
          title: 'BROADCAST TRANSMISSION FAILED',
          message: err?.message || 'Network error communicating with emergency dispatch gateway.'
        }
      });
    }
  },

  dispatchEmergencyBroadcast: (title, message, actionTaken) => {
    const { activeHour, alerts, selectedWardId, selectedRegionId } = get();
    const day = Math.floor(activeHour / 24) + 1;
    const hour = activeHour % 24;
    const timestamp = `Day ${day} • ${String(hour).padStart(2, '0')}:00 (LIVE)`;

    const newAlert: AutomatedAlert = {
      id: `live_${Date.now()}`,
      timestamp,
      hourIndex: activeHour,
      tier: 'severe',
      regionOrWard: selectedWardId ? `Ward: ${selectedWardId}` : (selectedRegionId || 'Metropolitan Core'),
      title,
      message,
      actionTaken
    };

    set({
      alerts: [newAlert, ...alerts],
      activeSidebarTab: 'alerts'
    });
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    }));
  }
}));
