import { create } from 'zustand';
import type { LayerVisibility, RiskTier, AutomatedAlert } from '../types';
import { SEED_ALERTS } from '../data/geoData';
import { fetchWardsGeoJSON } from '../services/heatApi';

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

  // Alert Log
  alerts: AutomatedAlert[];

  // Live FastAPI Backend Integration
  liveWardsGeoJSON: any | null;
  backendConnected: boolean;
  isStressModalOpen: boolean;
  lastBackendSync: string | null;

  // Actions
  setActiveHour: (hour: number) => void;
  stepHour: (delta: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  selectRegion: (regionId: string | null) => void;
  selectWard: (wardId: string | null) => void;
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

  liveWardsGeoJSON: null,
  backendConnected: false,
  lastBackendSync: null,
  alerts: SEED_ALERTS,



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
