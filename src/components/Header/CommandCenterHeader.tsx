import React, { useEffect, useState } from 'react';
import { 
  Sun,
  MapPin, 
  ChevronDown,
  Activity,
  Radio,
  Server,
  Menu,
  X
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 z-30 select-none flex flex-col transition-all duration-200">
      {/* Row 1 on mobile / Single Row on desktop */}
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between w-full">
        {/* 1. App Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex-shrink-0">
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

        {/* Desktop Controls (Row 2 equivalent on Desktop): Area Selector & Calculator Trigger */}
        <div className="hidden md:flex items-center gap-2.5">
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

        {/* Desktop Right Status Badges: Backend Connection + Warning Counter */}
        <div className="hidden md:flex items-center gap-2">
          {backendConnected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium" title="FastAPI server operational">
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

        {/* Mobile Action Controls: Compact Status Dot + Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {backendConnected ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/70 border border-slate-700 text-amber-300 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Syncing</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition cursor-pointer ${
              isMobileMenuOpen 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:text-white'
            }`}
            aria-label="Toggle navigation controls"
            title="Navigation Controls"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Row 2 on Mobile: Expandable Slide-down Drawer with Area Selector & Thermal Tool */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 px-3 py-2.5 flex flex-col gap-2 animate-fadeIn">
          {/* Mobile Area Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
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
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer flex-1 text-xs truncate"
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
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Thermal Stress Tool Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setStressModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Open Thermal Stress Tool</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono">
              pythermalcomfort
            </span>
          </button>
        </div>
      )}

      {/* Row 3 on Mobile: Slim, Full-Width Alert Banner directly beneath header */}
      <div className="md:hidden w-full border-t border-slate-800/80">
        {warningCount > 0 ? (
          <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-red-950/80 border-b border-red-500/30 text-red-200 text-[11px] font-medium tracking-tight text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span>
              <strong className="text-white font-bold">{warningCount} Zones</strong> Under Heat Warning
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-[11px] font-medium text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span>Normal Conditions Across State</span>
          </div>
        )}
      </div>
    </header>
  );
};

