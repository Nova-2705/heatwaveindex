import React from 'react';
import { Activity, Flame } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';

interface PredictiveSurgeChartProps {
  wardName: string;
  forecasts?: Record<string, any>;
  hourlyForecast?: any[];
}

export const PredictiveSurgeChart: React.FC<PredictiveSurgeChartProps> = ({
  wardName,
  forecasts,
  hourlyForecast
}) => {
  const { setActiveHour, activeHour } = useCommandCenterStore();

  // Extract or compute 5-day daily hospital surges
  const dailySurgeData = [1, 2, 3, 4, 5].map((dayNum) => {
    const dayKey = `day${dayNum}`;
    const f = forecasts?.[dayKey];

    // Compute peak surge from hourly data if available
    let spike = 0;
    if (hourlyForecast && hourlyForecast.length >= 120) {
      const daySlice = hourlyForecast.slice((dayNum - 1) * 24, dayNum * 24);
      const spikes = daySlice.map((h: any) => h.projectedHospitalizationSpike || 0);
      spike = Math.max(...spikes, 0);
    }

    // Default calibrated projection curve if spike is 0 or missing
    if (spike <= 0) {
      const defaultCurve: Record<number, number> = {
        1: 20,
        2: 95,
        3: 250, // Day 3 Apex Peak
        4: 180,
        5: 40
      };
      spike = defaultCurve[dayNum] || 25;
    }

    const tempStr = f?.temp || (dayNum === 3 ? '43°C' : dayNum === 2 ? '41°C' : '37°C');
    const level = f?.level || (dayNum === 3 ? 'severe' : dayNum === 2 || dayNum === 4 ? 'high' : 'moderate');

    return {
      day: dayNum,
      dayKey,
      label: `Day ${dayNum}`,
      isPeak: dayNum === 3,
      spike,
      temp: tempStr,
      level,
      peakHourIndex: (dayNum - 1) * 24 + 14 // 14:00 peak heat hour
    };
  });

  // Calculate SVG curve coordinates (viewBox 0 0 340 90)
  const maxSpike = Math.max(...dailySurgeData.map((d) => d.spike), 250);
  const paddingX = 25;
  const chartWidth = 340;
  const chartHeight = 85;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - 20;

  const points = dailySurgeData.map((d, index) => {
    const x = paddingX + (index / (dailySurgeData.length - 1)) * usableWidth;
    const y = chartHeight - 12 - (d.spike / maxSpike) * usableHeight;
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier SVG path
  const pathData = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  // Fill area under curve
  const areaData = `${pathData} L ${points[points.length - 1].x},${chartHeight - 6} L ${points[0].x},${chartHeight - 6} Z`;

  const activeDayNum = Math.min(5, Math.floor(activeHour / 24) + 1);

  return (
    <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Predictive 5-Day Trauma Admissions</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-semibold animate-pulse">
          <Flame className="w-3 h-3 text-rose-400" />
          <span>Day 3 Peak: +250%</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-tight">
        Simulated clinical inpatient surge across regional hospitals from multi-day thermal accumulation in <strong className="text-slate-200">{wardName}</strong>.
      </p>

      {/* Interactive SVG Sparkline Chart */}
      <div className="relative w-full overflow-hidden rounded-lg bg-slate-900/90 border border-slate-800/80 pt-2 pb-1">
        <svg viewBox="0 0 340 90" className="w-full h-24 overflow-visible">
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="surgeAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
            </linearGradient>

            {/* Stroke Line Gradient */}
            <linearGradient id="surgeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="55%" stopColor="#ef4444" />
              <stop offset="80%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* Grid Baseline */}
          <line x1="20" y1="78" x2="320" y2="78" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          <text x="24" y="74" fill="#64748b" fontSize="8" fontFamily="monospace">Baseline 0%</text>
          <text x="270" y="20" fill="#f87171" fontSize="8" fontFamily="monospace" fontWeight="bold">+250% Apex</text>

          {/* Sparkline Area */}
          <path d={areaData} fill="url(#surgeAreaGrad)" />

          {/* Sparkline Line */}
          <path d={pathData} fill="none" stroke="url(#surgeLineGrad)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt) => {
            const isSelectedDay = activeDayNum === pt.day;
            return (
              <g key={pt.day} className="cursor-pointer" onClick={() => setActiveHour(pt.peakHourIndex)}>
                {pt.isPeak && (
                  <circle cx={pt.x} cy={pt.y} r="8" fill="#ef4444" opacity="0.3" className="animate-ping" />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelectedDay ? '5.5' : pt.isPeak ? '5' : '3.5'}
                  fill={pt.isPeak ? '#ef4444' : isSelectedDay ? '#ffffff' : '#f97316'}
                  stroke={isSelectedDay ? '#ef4444' : '#0f172a'}
                  strokeWidth="2"
                />
                {/* Value Label above point */}
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  fill={pt.isPeak ? '#fca5a5' : isSelectedDay ? '#ffffff' : '#cbd5e1'}
                  fontSize={pt.isPeak ? '9.5' : '8.5'}
                  fontFamily="monospace"
                  fontWeight={pt.isPeak || isSelectedDay ? 'bold' : 'normal'}
                >
                  +{pt.spike}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 5-Day Breakdown Cards */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {dailySurgeData.map((item) => {
          const isActive = activeDayNum === item.day;
          return (
            <button
              key={item.day}
              type="button"
              onClick={() => setActiveHour(item.peakHourIndex)}
              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-950/70 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                  : item.isPeak
                  ? 'bg-slate-900/90 border-red-500/50 hover:border-red-400'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className={`text-[10px] font-bold ${item.isPeak ? 'text-rose-400' : 'text-slate-300'}`}>
                {item.label}
              </div>
              <div className={`font-mono text-[11px] font-extrabold ${item.isPeak ? 'text-red-300 font-black' : 'text-slate-200'}`}>
                +{item.spike}%
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                {item.temp}
              </div>
              {item.isPeak && (
                <div className="text-[8px] uppercase tracking-tighter font-extrabold text-red-400 bg-red-950/80 rounded px-1 py-0.2 mt-0.5">
                  PEAK
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
