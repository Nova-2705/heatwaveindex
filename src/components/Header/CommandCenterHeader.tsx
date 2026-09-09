import React, { useEffect } from 'react';
import { 
  Sun,
  MapPin, 
  ChevronDown,
  Activity,
  Radio,
  Server
} from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { westBengalHeatGeoJSON } from '../../data/westBengalHeatData.js';

export const CommandCenterHeader: React.FC = () => {
  const {
    activeHour,
    selectedRegionId,
    selectRegion,
    selectWard,
    liveWardsGeoJSON,
    backendConnected,
    refreshWardsFromBackend,
    setStressModalOpen
  } = useCommandCenterStore();

  useEffect(() => {
    // Initial fetch from FastAPI backend
    refreshWardsFromBackend();

    // Periodic poll every 30s for live rolling forecast updates
    const interval = setInterval(() => {
      refreshWardsFromBackend();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshWardsFromBackend]);

  const activeGeoJSON = liveWardsGeoJSON || westBengalHeatGeoJSON;

  const dayIndex = Math.min(5, Math.floor(activeHour / 24) + 1);
  const dayKey = `day${dayIndex}` as 'day1' | 'day2' | 'day3' | 'day4' | 'day5';

  const warningCount = activeGeoJSON.features.filter((f: any) => {
    const level = f.properties.forecasts?.[dayKey]?.level;
    return level === 'severe' || level === 'high';
  }).length;

  const currentSelectionValue = selectedRegionId || 'west_bengal';

  return (
    <header className="h-12 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* 1. App Brand / Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <Sun className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-slate-100 text-sm tracking-tight block leading-tight">
            HeatWatch WB
          </span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
            Biometeorology GIS
          </span>
        </div>
      </div>

      {/* 2. Middle Controls: Area Selector & Calculator Trigger */}
      <div className="flex items-center gap-2.5">
        {/* Area Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800/90 text-xs hover:border-slate-700 transition">
          <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="text-slate-400 font-normal">Area:</span>
          <select
            value={currentSelectionValue}
            onChange={(e) => {
              const val = e.target.value;
              selectRegion(val);
              if (val.startsWith('WB-')) {
                selectWard(val);
              }
            }}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1 text-xs"
          >
            <option value="west_bengal" className="bg-slate-900 text-slate-200">
              West Bengal - All Wards
            </option>
            {activeGeoJSON.features.map((feature: any) => (
              <option key={feature.properties.id} value={feature.properties.id} className="bg-slate-900 text-slate-200">
                {feature.properties.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Thermal Calculator Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setStressModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          title="Open pythermalcomfort UTCI and Heat Index calculator"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Thermal Stress Tool</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono">
            pythermalcomfort
          </span>
        </button>
      </div>

      {/* 3. Right Status Badges: Backend Connection + Warning Counter */}
      <div className="flex items-center gap-2">
        {/* Backend Connectivity Status */}
        {backendConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium" title="FastAPI server operational on port 8000">
            <Server className="w-3 h-3 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>FastAPI Live</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px] font-medium" title="Syncing with backend...">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Syncing API...</span>
          </div>
        )}

        {/* Heat Warning Status Pill */}
        {warningCount > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>
              <strong className="text-white font-semibold">{warningCount} Zones</strong> Under Heat Warning
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Normal Conditions Across State</span>
          </div>
        )}
      </div>
    </header>
  );
};
