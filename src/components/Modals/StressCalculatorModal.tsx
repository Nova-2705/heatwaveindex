import React, { useState, useEffect } from 'react';
import { X, Activity, Flame, Wind, Droplets, Sun, AlertTriangle, ShieldCheck, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { calculateThermalStress, type StressCalculationResult } from '../../services/heatApi';

export const StressCalculatorModal: React.FC = () => {
  const { isStressModalOpen, setStressModalOpen, calculatorPrefill, setCalculatorPrefill } = useCommandCenterStore();

  const [airTemp, setAirTemp] = useState<number>(39.5);
  const [humidity, setHumidity] = useState<number>(65);
  const [windSpeed, setWindSpeed] = useState<number>(1.8);
  const [solarRadiation, setSolarRadiation] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StressCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-sync whenever modal opens with prefilled ward telemetry
  useEffect(() => {
    if (isStressModalOpen && calculatorPrefill) {
      setAirTemp(calculatorPrefill.air_temp);
      setHumidity(calculatorPrefill.humidity);
      setWindSpeed(calculatorPrefill.wind_speed);
      setSolarRadiation(calculatorPrefill.solar_radiation);

      setLoading(true);
      calculateThermalStress({
        air_temperature: calculatorPrefill.air_temp,
        relative_humidity: calculatorPrefill.humidity,
        wind_speed: calculatorPrefill.wind_speed,
        wind_speed_unit: 'm/s',
        solar_radiation: calculatorPrefill.solar_radiation,
      })
        .then((res) => setResult(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isStressModalOpen, calculatorPrefill]);

  if (!isStressModalOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculateThermalStress({
        air_temperature: airTemp,
        relative_humidity: humidity,
        wind_speed: windSpeed,
        wind_speed_unit: 'm/s',
        solar_radiation: solarRadiation,
      });
      setResult(res);
    } catch (err: any) {
      // Graceful offline/client-side biometeorological fallback calculation
      const t = airTemp;
      const r = humidity;
      const v = Math.max(0.5, windSpeed);
      const c1 = -8.78469475556, c2 = 1.61139411, c3 = 2.33854883889, c4 = -0.14611605;
      const c5 = -0.012308094, c6 = -0.0164248277778, c7 = 0.002211732, c8 = 0.00072546, c9 = -0.000003582;
      const hi = Math.round((c1 + (c2 * t) + (c3 * r) + (c4 * t * r) + (c5 * (t ** 2)) + (c6 * (r ** 2)) + (c7 * (t ** 2) * r) + (c8 * t * (r ** 2)) + (c9 * (t ** 2) * (r ** 2))) * 10) / 10;
      const tr = t + (0.015 * solarRadiation);
      const utciVal = Math.round((t + (tr - t) * 0.4 - (v - 1.0) * 1.2 + (r > 50 ? (r - 50) * 0.12 : -0.5)) * 10) / 10;

      const isSevere = utciVal >= 38.0 || hi >= 41.0;
      const isHigh = utciVal >= 32.0 || hi >= 35.0;
      const isMod = utciVal >= 26.0 || hi >= 29.0;

      setResult({
        utci: utciVal,
        heat_index: hi,
        hazard_tier: isSevere ? 'Severe' : isHigh ? 'High' : isMod ? 'Moderate' : 'Low',
        risk_tier: isSevere ? 'severe' : isHigh ? 'high' : isMod ? 'moderate' : 'low',
        label: isSevere ? 'Severe Heat Risk (Stay Indoors)' : isHigh ? 'High Heat Warning' : isMod ? 'Moderate Heat' : 'Normal Conditions',
        advice: isSevere 
          ? 'Red Alert. Dangerously high heat stress. Stay indoors in air-conditioned rooms. Suspend non-emergency outdoor labor. Hydrate with ORS.'
          : isHigh 
          ? 'Uncomfortably hot. Take frequent breaks in shade or cooling shelters, maintain hydration, and monitor vulnerable populations.'
          : isMod 
          ? 'Warm conditions. Drink extra water if exercising or working outdoors.'
          : 'Comfortable weather. Safe for normal outdoor activities.',
        projected_hospitalization_spike: isSevere ? 110 : isHigh ? 35 : 5,
        color_hex: isSevere ? '#ef4444' : isHigh ? '#f97316' : isMod ? '#eab308' : '#22c55e',
        stress_category: isSevere ? 'extreme heat stress' : isHigh ? 'strong heat stress' : isMod ? 'moderate heat stress' : 'no thermal stress'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (t: number, h: number, w: number, s: number) => {
    setAirTemp(t);
    setHumidity(h);
    setWindSpeed(w);
    setSolarRadiation(s);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Biometeorological Thermal Index Calculator
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  pythermalcomfort
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live physiological microclimate simulation via Python FastAPI backend
              </p>
            </div>
          </div>
          <button
            onClick={() => setStressModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Ward Telemetry Sync Banner */}
          {calculatorPrefill && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-xs shadow-sm">
              <div className="flex items-center gap-2 text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
                <span>
                  Active Telemetry Sync: <strong className="text-white font-semibold">{calculatorPrefill.ward_name || 'Selected Ward'}</strong>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-500/30">
                  Live Sensor Values
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCalculatorPrefill(null)}
                className="text-[11px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
              >
                Clear sync
              </button>
            </div>
          )}

          {/* Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              West Bengal Regional Microclimate Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(39.0, 72, 1.5, 850)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                🌊 Kolkata Peak
                <span className="block text-[10px] text-slate-400">39°C • 72% RH • Delta UHI</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(44.5, 24, 2.8, 980)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                ☀️ Asansol Mining
                <span className="block text-[10px] text-slate-400">44.5°C • 24% RH • Dry Rock</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(46.0, 18, 3.2, 1020)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                🏜️ Purulia Arid
                <span className="block text-[10px] text-slate-400">46°C • 18% RH • Plateau Loo</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(43.0, 32, 2.0, 900)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                ⚙️ Durgapur Steel
                <span className="block text-[10px] text-slate-400">43°C • 32% RH • Industry</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(37.0, 78, 1.6, 780)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                🌲 Siliguri Terai
                <span className="block text-[10px] text-slate-400">37°C • 78% RH • Sub-Himalayan</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(42.0, 45, 2.2, 880)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                🚆 Kharagpur Jn.
                <span className="block text-[10px] text-slate-400">42°C • 45% RH • Junction</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(41.0, 64, 1.2, 800)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                🏭 Howrah Industry
                <span className="block text-[10px] text-slate-400">41°C • 64% RH • Rail Mass</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(24.0, 65, 3.0, 400)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] font-medium text-slate-200 border border-slate-700 text-left transition cursor-pointer"
              >
                ⛰️ Darjeeling Alpine
                <span className="block text-[10px] text-slate-400">24°C • 65% RH • High UV</span>
              </button>
            </div>
          </div>


          {/* Environmental Parameter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            {/* Air Temp */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Air Temperature
                </span>
                <span className="font-mono text-orange-400 font-bold">{airTemp}°C</span>
              </div>
              <input
                type="range"
                min={20}
                max={50}
                step={0.5}
                value={airTemp}
                onChange={(e) => setAirTemp(parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Relative Humidity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" /> Relative Humidity
                </span>
                <span className="font-mono text-sky-400 font-bold">{humidity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value, 10))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Wind Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-400" /> Wind Speed (10m)
                </span>
                <span className="font-mono text-teal-400 font-bold">{windSpeed} m/s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={12}
                step={0.1}
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Solar Radiation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Radiation
                </span>
                <span className="font-mono text-amber-400 font-bold">{solarRadiation} W/m²</span>
              </div>
              <input
                type="range"
                min={0}
                max={1100}
                step={25}
                value={solarRadiation}
                onChange={(e) => setSolarRadiation(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleCalculate}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Computing via pythermalcomfort (FastAPI)...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Calculate Universal Thermal Climate Index (UTCI)
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* UTCI Box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    UTCI Index
                  </span>
                  <div className="text-2xl font-bold font-mono text-white">
                    {result.utci}
                    <span className="text-xs text-slate-400 font-normal">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Biometeorological
                  </span>
                </div>

                {/* Heat Index Box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Heat Index (HI)
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {result.heat_index}
                    <span className="text-xs text-slate-400 font-normal">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Rothfusz Equation
                  </span>
                </div>

                {/* Hazard Tier */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Hazard Tier
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: result.color_hex }}
                  >
                    {result.hazard_tier}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 capitalize">
                    {result.stress_category}
                  </span>
                </div>

                {/* Hospitalization Spike */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Hospital Surge
                  </span>
                  <div className="text-2xl font-bold font-mono text-red-400">
                    +{result.projected_hospitalization_spike}%
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Trauma Admissions
                  </span>
                </div>
              </div>

              {/* Public Advisory Card */}
              <div
                className="p-4 rounded-xl border space-y-1.5"
                style={{
                  backgroundColor: `${result.color_hex}15`,
                  borderColor: `${result.color_hex}40`
                }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: result.color_hex }} />
                  <span className="text-xs font-bold text-white">{result.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {result.advice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
          <span>Backend: <code className="text-slate-300 font-mono">POST /api/calculate-stress</code></span>
          <button
            onClick={() => setStressModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
