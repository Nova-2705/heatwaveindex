import React, { useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SunMedium,
  Clock
} from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { formatConversationalTime } from '../../data/geoData';

export const ForecastSlider: React.FC = () => {
  const {
    activeHour,
    isPlaying,
    setActiveHour,
    togglePlay
  } = useCommandCenterStore();

  const animIntervalRef = useRef<number | null>(null);

  // Playback timer engine (~350ms per simulated hour)
  useEffect(() => {
    if (isPlaying) {
      animIntervalRef.current = window.setInterval(() => {
        const { activeHour: currentHour } = useCommandCenterStore.getState();
        if (currentHour >= 119) {
          setActiveHour(0);
        } else {
          setActiveHour(currentHour + 1);
        }
      }, 350);
    } else if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }

    return () => {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current);
      }
    };
  }, [isPlaying, setActiveHour]);

  const dayNumber = Math.floor(activeHour / 24) + 1;
  const hourOfDay = activeHour % 24;

  // Jump to the nearest upcoming afternoon peak heat spike (14:00)
  const jumpToNextPeak = () => {
    const daysAhead = hourOfDay >= 14 ? 1 : 0;
    const nextTarget = (dayNumber - 1 + daysAhead) * 24 + 14;
    setActiveHour(Math.min(119, nextTarget));
  };

  return (
    <div className="h-10 sm:h-11 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-2.5 sm:px-4 flex items-center gap-2 sm:gap-4 text-xs select-none z-20">
      {/* 1. Play / Pause & Single Clean Responsive Timestamp */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        <button
          onClick={togglePlay}
          className={`flex items-center justify-center w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full text-xs border transition cursor-pointer flex-shrink-0 ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
              : 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700/80'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
          ) : (
            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-slate-200 font-semibold tracking-tight whitespace-nowrap">
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate max-w-[125px] xs:max-w-[170px] sm:max-w-none">
            {formatConversationalTime(activeHour)}
          </span>
        </div>
      </div>

      {/* 2. Single Thin Gradient Bar & Scrubber */}
      <div className="relative flex-1 min-w-[70px] sm:min-w-[140px] flex items-center">
        <div className="relative h-2 w-full bg-slate-950 border border-slate-800/80 rounded-full overflow-hidden">
          {/* Heat Gradient Progress Fill */}
          <div 
            className="h-full bg-gradient-to-r from-[#38a169] via-[#d69e2e] via-[#dd6b20] to-[#e53e3e] transition-all duration-100 pointer-events-none rounded-full"
            style={{ width: `${(activeHour / 119) * 100}%` }}
          />
        </div>

        {/* Range Scrubber Input */}
        <input
          type="range"
          min={0}
          max={119}
          step={1}
          value={activeHour}
          onChange={(e) => setActiveHour(parseInt(e.target.value, 10))}
          className="w-full h-5 opacity-0 absolute inset-0 cursor-pointer z-10"
          aria-label="5-Day Forecast Timeline"
        />
      </div>

      {/* 3. Responsive Action: Jump to Hottest Hour */}
      <button
        onClick={jumpToNextPeak}
        className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] sm:text-xs font-medium transition cursor-pointer flex-shrink-0 whitespace-nowrap"
        title="Jump to hottest afternoon hour (14:00 peak)"
      >
        <SunMedium className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
        <span className="hidden md:inline">Jump to Hottest Hour</span>
        <span className="hidden sm:inline md:hidden">Hottest Hour</span>
        <span className="sm:hidden">Peak</span>
      </button>
    </div>
  );
};

