import React from 'react';
import { 
  X, 
  Droplets, 
  CheckCircle2, 
  Home,
  HeartPulse,
  Phone,
  ShieldAlert,
  Activity,
  Cpu,
  Wind,
  Sun,
  RefreshCw,
  Radio,
  Loader2,
  Flame
} from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { MUNICIPAL_WARDS, RISK_COLORS, INFRASTRUCTURE_ASSETS } from '../../data/geoData';
import { westBengalHeatGeoJSON, westBengalAssets } from '../../data/westBengalHeatData.js';
import type { RiskTier } from '../../types';
import { PredictiveSurgeChart } from './PredictiveSurgeChart';

export const CommandCenterSidebar: React.FC = () => {
  const {
    isSidebarOpen,
    closeWardInspector,
    selectedWardId,
    activeHour,
    liveWardsGeoJSON,
    activeWardTelemetry,
    isFetchingWardTelemetry,
    isBroadcasting,
    triggerEmergencyBroadcast,
    setStressModalOpen
  } = useCommandCenterStore();

  if (!isSidebarOpen || !selectedWardId) {
    return null;
  }

  const activeGeoJSON = liveWardsGeoJSON || westBengalHeatGeoJSON;
  const wbFeature = activeGeoJSON.features.find((f: any) => f.properties.id === selectedWardId);
  const normalizedId = selectedWardId.replace('-', '_');
  const activeWard = MUNICIPAL_WARDS.find((w) => w.id === selectedWardId || w.id === normalizedId);

  if (!wbFeature && !activeWard && !activeWardTelemetry) return null;

  const dayIndex = Math.min(5, Math.floor(activeHour / 24) + 1);
  const dayKey = `day${dayIndex}` as 'day1' | 'day2' | 'day3' | 'day4' | 'day5';

  const isWB = !!wbFeature || (activeWardTelemetry?.ward_id === selectedWardId);
  const name = activeWardTelemetry?.name || (wbFeature ? wbFeature.properties.name : activeWard!.name);
  const subTitle = activeWardTelemetry 
    ? `${activeWardTelemetry.ward_id} • ${activeWardTelemetry.district}, West Bengal`
    : (wbFeature ? `${wbFeature.properties.id} • West Bengal Urban Heat Zone` : `Sector ${activeWard!.code} • ~${activeWard!.population.toLocaleString()} residents`);

  const wbDayForecast = wbFeature?.properties.forecasts?.[dayKey];
  const genericForecast = activeWard?.forecast[activeHour] || activeWard?.forecast[0];

  const hasLiveTelemetry = Boolean(
    activeWardTelemetry && (activeWardTelemetry.ward_id === selectedWardId || wbFeature?.properties.id === activeWardTelemetry.ward_id)
  );

  const riskTier: RiskTier = (
    hasLiveTelemetry
      ? activeWardTelemetry!.thermal_comfort.risk_tier
      : (isWB ? (wbDayForecast?.level || 'moderate') : genericForecast!.riskTier)
  ) as RiskTier;

  const riskColor = RISK_COLORS[riskTier] || RISK_COLORS.moderate;

  const displayTemp = hasLiveTelemetry
    ? `${activeWardTelemetry!.telemetry.air_temperature}°C`
    : (isWB ? wbDayForecast?.temp : `${Math.round(genericForecast!.temp)}°C`);

  const feelsLikeTemp = hasLiveTelemetry
    ? `${activeWardTelemetry!.thermal_comfort.utci}°C`
    : (isWB ? `${parseInt(wbDayForecast?.temp || '35', 10) + 3}°C` : `${Math.round(genericForecast!.utci)}°C`);

  const adviceText = hasLiveTelemetry
    ? activeWardTelemetry!.thermal_comfort.advice
    : (isWB ? wbDayForecast?.advice : riskColor.advice);

  const humidityVal = hasLiveTelemetry
    ? `${activeWardTelemetry!.telemetry.relative_humidity}%`
    : (isWB ? (riskTier === 'severe' ? '68%' : '58%') : `${genericForecast!.humidity}%`);

  const windVal = hasLiveTelemetry
    ? `${activeWardTelemetry!.telemetry.wind_speed} m/s`
    : '2.1 m/s';

  const solarVal = hasLiveTelemetry
    ? `${activeWardTelemetry!.telemetry.solar_radiation} W/m²`
    : '750 W/m²';

  const heatIndexVal = hasLiveTelemetry
    ? `${activeWardTelemetry!.thermal_comfort.heat_index}°C`
    : (wbDayForecast?.peak_heat_index || displayTemp);

  const surgeSpike = hasLiveTelemetry
    ? activeWardTelemetry!.thermal_comfort.projected_hospitalization_spike
    : (riskTier === 'severe' ? 75 : riskTier === 'high' ? 30 : 5);

  // Find nearby assets in this ward
  const coolingShelters = isWB 
    ? westBengalAssets.filter((a) => (a.wardId === selectedWardId || a.wardId === wbFeature?.properties?.id) && a.type === 'cooling_shelter')
    : INFRASTRUCTURE_ASSETS.filter((a) => a.wardId === activeWard!.id && a.type === 'cooling_shelter');

  const waterStations = isWB
    ? westBengalAssets.filter((a) => (a.wardId === selectedWardId || a.wardId === wbFeature?.properties?.id) && a.type === 'hydration_station')
    : INFRASTRUCTURE_ASSETS.filter((a) => a.wardId === activeWard!.id && a.type === 'hydration_station');

  const healthClinics = isWB
    ? westBengalAssets.filter((a) => (a.wardId === selectedWardId || a.wardId === wbFeature?.properties?.id) && (a.type === 'health_center' || a.type === 'hospital'))
    : INFRASTRUCTURE_ASSETS.filter((a) => a.wardId === activeWard!.id && (a.type === 'health_center' || a.type === 'hospital'));


  return (
    <aside className="w-full sm:w-88 md:w-96 max-w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 select-none shadow-2xl backdrop-blur-md absolute sm:relative right-0 top-0">
      {/* Header: Area Name and Close Button */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/70">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-slate-400">
            Regional Overview
          </div>
          <h2 className="font-bold text-lg text-white tracking-tight leading-snug">
            {name}
          </h2>
          <div className="text-xs text-slate-400">
            {subTitle}
          </div>
        </div>

        <button
          onClick={closeWardInspector}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 1. Primary Status Banner */}
        <div className={`p-4 rounded-xl border ${riskColor.badge} space-y-3`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div className="font-bold text-sm tracking-wide">
              {riskColor.label}
            </div>
          </div>
          
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {adviceText}
          </p>

          {/* Temperature & Conditions Card */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
            <div className="bg-black/30 rounded-lg p-2.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Feels Like</div>
              <div className={`text-2xl font-black mt-0.5 ${riskColor.text}`}>
                {feelsLikeTemp}
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-2.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Air Temp</div>
              <div className="text-2xl font-bold text-white mt-0.5">
                {displayTemp}
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-2.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Humidity</div>
              <div className="text-2xl font-bold text-sky-300 mt-0.5">
                {humidityVal}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Live Microclimate Telemetry & pythermalcomfort Diagnostics */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Live Microclimate Telemetry
              </span>
            </div>
            {hasLiveTelemetry ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live API
              </span>
            ) : isFetchingWardTelemetry ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Fetching
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Baseline
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Wind className="w-3 h-3 text-sky-400" />
                <span>Wind Speed</span>
              </div>
              <div className="font-mono text-sm font-semibold text-slate-100">
                {windVal}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Solar Radiation</span>
              </div>
              <div className="font-mono text-sm font-semibold text-slate-100">
                {solarVal}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Heat Index</span>
              </div>
              <div className="font-mono text-sm font-semibold text-orange-300">
                {heatIndexVal}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/70">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                <HeartPulse className="w-3 h-3 text-red-400" />
                <span>Hospital Spike</span>
              </div>
              <div className="font-mono text-sm font-semibold text-rose-300">
                +{surgeSpike}% surge
              </div>
            </div>
          </div>

          {/* Action to open in Biometeorological Calculator modal */}
          <button
            type="button"
            onClick={() => setStressModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition active:scale-98 cursor-pointer"
            title="Open live telemetry in pythermalcomfort stress calculator"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch in Biometeorological Calculator</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono">
              pythermalcomfort
            </span>
          </button>

          {/* Prominent Emergency Broadcast Action Button */}
          <button
            type="button"
            disabled={isBroadcasting}
            onClick={() => triggerEmergencyBroadcast(selectedWardId || undefined)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 active:scale-98 text-white text-xs font-black tracking-wide uppercase shadow-lg shadow-red-950/60 border border-red-400/50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
            title="Dispatch emergency SMS & WhatsApp alert to 42 ward field officers via Twilio & WhatsApp Gateway"
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white flex-shrink-0" />
                <span>Transmitting Broadcast...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-white animate-pulse flex-shrink-0" />
                <span>🚨 Broadcast Emergency Alert</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Predictive 5-Day Trend View (Trauma & Inpatient Surge) */}
        <PredictiveSurgeChart
          wardName={name}
          forecasts={activeWardTelemetry?.forecasts || wbFeature?.properties?.forecasts}
          hourlyForecast={activeWardTelemetry?.hourly_forecast}
        />

        {/* 3. Plain-English Safety Checklist */}
        <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            What You Should Do Now
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            {riskTier === 'severe' ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🏠</span>
                  <div>
                    <span className="font-semibold text-white">Stay indoors in air-conditioned spaces</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Keep windows covered with curtains to block direct sunlight.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">💧</span>
                  <div>
                    <span className="font-semibold text-white">Drink cold water every 20 minutes</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Do not wait until you are thirsty. Avoid sugary or caffeinated drinks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">☀️</span>
                  <div>
                    <span className="font-semibold text-white">Avoid outdoor work & exercise (12 PM – 4 PM)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Direct afternoon heat creates severe risk of heat stroke.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">👵</span>
                  <div>
                    <span className="font-semibold text-white">Check on seniors, kids & pets</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Make sure vulnerable family and neighbors have cool air and drinking water.</p>
                  </div>
                </div>
              </>
            ) : riskTier === 'high' ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">💧</span>
                  <div>
                    <span className="font-semibold text-white">Carry a water bottle everywhere</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sip water frequently throughout the day to avoid dehydration.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🧢</span>
                  <div>
                    <span className="font-semibold text-white">Wear loose, light clothing and a hat</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Protect your skin with sunblock and take shade breaks often.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">🌳</span>
                  <div>
                    <span className="font-semibold text-white">Rest in shade or air-conditioned spots</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Visit a public cooling center if your home gets too hot.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">✅</span>
                  <div>
                    <span className="font-semibold text-white">Safe conditions for normal activities</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Outdoor walks, sports, and transit are comfortable.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none">💧</span>
                  <div>
                    <span className="font-semibold text-white">Stay normally hydrated</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Keep standard water intake during the afternoon.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Nearby Help Points in this Neighborhood */}
        <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-sky-400" />
              Help Available in This Area
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {coolingShelters.length > 0 ? (
              coolingShelters.map((shelter) => (
                <div key={shelter.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                  <span className="p-1 rounded bg-sky-500/10 text-sky-400 flex-shrink-0">
                    <Home className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{shelter.name}</div>
                    <div className="text-[11px] text-sky-300 mt-0.5 flex items-center gap-1">
                      <span>❄️ Free Public AC Cooling Center</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>Nearby civic center open for emergency cooling</span>
              </div>
            )}

            {waterStations.length > 0 ? (
              waterStations.map((station) => (
                <div key={station.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                  <span className="p-1 rounded bg-sky-500/10 text-sky-400 flex-shrink-0">
                    <Droplets className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{station.name}</div>
                    <div className="text-[11px] text-sky-300 mt-0.5">
                      💧 Free Drinking Water Refill Tap
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-slate-500" />
                <span>Municipal cold water refill points active along main roads</span>
              </div>
            )}

            {healthClinics.length > 0 && healthClinics.map((clinic) => (
              <div key={clinic.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                  <HeartPulse className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{clinic.name}</div>
                  <div className="text-[11px] text-emerald-300 mt-0.5">
                    🏥 Walk-in Health Center & Emergency Care
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Call Help */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-red-400" />
              Feeling dizzy or sick?
            </span>
            <span className="font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">
              Call 108 / 112 Free
            </span>
          </div>
        </div>

      </div>
    </aside>
  );
};

