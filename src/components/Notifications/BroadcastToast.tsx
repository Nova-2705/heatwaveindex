import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2, MessageSquare, PhoneCall } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';

export const BroadcastToast: React.FC = () => {
  const { broadcastToast, setBroadcastToast } = useCommandCenterStore();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!broadcastToast) return;

    if (broadcastToast.type === 'loading') {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 6000;
    const intervalMs = 60;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          setBroadcastToast(null);
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [broadcastToast, setBroadcastToast]);

  if (!broadcastToast) return null;

  const isSuccess = broadcastToast.type === 'success';
  const isLoading = broadcastToast.type === 'loading';

  return (
    <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 max-w-md w-[calc(100vw-1.5rem)] select-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`rounded-xl border shadow-2xl p-4 backdrop-blur-xl transition-all duration-200 relative overflow-hidden ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/50 text-slate-100 shadow-emerald-950/40'
            : isLoading
            ? 'bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-950/40'
            : 'bg-slate-900/95 border-red-500/50 text-slate-100 shadow-red-950/40'
        }`}
      >
        {/* Progress Bar for Auto-dismiss */}
        {!isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                isSuccess ? 'bg-emerald-400' : 'bg-red-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div
            className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
              isSuccess
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                : isLoading
                ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30 animate-pulse'
                : 'bg-red-950/80 text-red-400 border border-red-500/30'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          {/* Toast Body */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30 font-bold">
                Civil Defense Gateway
              </span>
              {broadcastToast.details?.timestamp && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(broadcastToast.details.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-white tracking-wide">
              {broadcastToast.title}
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {broadcastToast.message}
            </p>

            {/* Channels & Recipient Badges */}
            {broadcastToast.details && (
              <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                {broadcastToast.details.ward_name && (
                  <span className="text-slate-400">
                    Zone: <strong className="text-white">{broadcastToast.details.ward_name}</strong>
                  </span>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium font-mono">
                    <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
                    WhatsApp
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium font-mono">
                    <PhoneCall className="w-2.5 h-2.5 text-cyan-400" />
                    SMS Carrier
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setBroadcastToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition cursor-pointer flex-shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
