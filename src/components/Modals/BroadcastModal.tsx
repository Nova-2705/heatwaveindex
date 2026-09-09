import React, { useState } from 'react';
import { Radio, X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { MUNICIPAL_WARDS } from '../../data/geoData';

export const BroadcastModal: React.FC = () => {
  const {
    isBroadcastModalOpen,
    setBroadcastModalOpen,
    dispatchEmergencyBroadcast,
    selectedWardId
  } = useCommandCenterStore();

  const activeWard = MUNICIPAL_WARDS.find((w) => w.id === selectedWardId) || MUNICIPAL_WARDS[0];

  const [title, setTitle] = useState(`TIER 4 EXTREME HEAT DIRECTIVE: SECTOR ${activeWard.code} (${activeWard.name.toUpperCase()})`);
  const [message, setMessage] = useState(
    'Meteorological biometeorology sensors record UTCI >38°C. Imminent danger of severe hyperthermia and cardiovascular crisis. Mandatory pause on outdoor labor. Municipal cooling shelters are fully operational with emergency IV hydration.'
  );
  const [actionTaken, setActionTaken] = useState(
    'Civil Defense telecom SMS gateway broadcast queued. Auxiliary emergency generators engaged across sectors.'
  );
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isBroadcastModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchEmergencyBroadcast(title, message, actionTaken);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setBroadcastModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none text-xs">
      <div className="w-full max-w-lg rounded bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-red-400">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="font-bold text-sm tracking-wider uppercase text-slate-100 font-mono-data">
              CIVIL DEFENSE EARLY WARNING DIRECTIVE
            </span>
          </div>
          <button
            onClick={() => setBroadcastModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-white font-semibold text-sm font-mono-data">
              DIRECTIVE LOGGED & TRANSMITTED
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
              Alert registered in municipal incident database and dispatched through carrier SMS broadcast gateways.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400 mb-1">
                DIRECTIVE IDENTIFIER & SUBJECT
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-mono-data text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400 mb-1">
                CIVILIAN WARNING DISPATCH (SMS & PUBLIC SIGNAGE)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-wider uppercase font-semibold text-slate-400 mb-1">
                MUNICIPAL ENFORCEMENT PROTOCOLS
              </label>
              <textarea
                rows={2}
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                required
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[11px]">
                Authorized dispatch triggers official telemetry event logs across connected municipal agencies.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer font-semibold text-xs transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ISSUE DIRECTIVE</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
