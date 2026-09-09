import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { MUNICIPAL_WARDS, INFRASTRUCTURE_ASSETS, MACRO_REGIONS, RISK_COLORS } from '../../data/geoData';

export const SitRepModal: React.FC = () => {
  const {
    isSitRepModalOpen,
    setSitRepModalOpen,
    activeHour,
    selectedRegionId
  } = useCommandCenterStore();

  if (!isSitRepModalOpen) return null;

  const currentRegion = MACRO_REGIONS.find((r) => r.id === selectedRegionId) || MACRO_REGIONS[0];

  const dayNum = Math.floor(activeHour / 24) + 1;
  const hourNum = activeHour % 24;

  const severeWards = MUNICIPAL_WARDS.filter((w) => w.forecast[activeHour]?.riskTier === 'severe');
  const highWards = MUNICIPAL_WARDS.filter((w) => w.forecast[activeHour]?.riskTier === 'high');
  const totalPopulationAtRisk = [...severeWards, ...highWards].reduce((acc, w) => acc + w.population, 0);

  const coolingShelters = INFRASTRUCTURE_ASSETS.filter((a) => a.type === 'cooling_shelter');
  const totalCoolingCapacity = coolingShelters.reduce((acc, a) => acc + a.capacity, 0);
  const currentCoolingUsage = coolingShelters.reduce((acc, a) => acc + a.currentUsage, 0);

  const hospitals = INFRASTRUCTURE_ASSETS.filter((a) => a.type === 'hospital' || a.type === 'health_center');
  const totalHospitalBeds = hospitals.reduce((acc, a) => acc + a.capacity, 0);
  const occupiedHospitalBeds = hospitals.reduce((acc, a) => acc + a.currentUsage, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none overflow-y-auto text-xs">
      <div className="w-full max-w-3xl rounded bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4 my-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NATIONAL METEOROLOGICAL SERVICE • {currentRegion.name.toUpperCase()} COMMAND</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">
              SYNOPTIC HEAT STRESS SITUATION REPORT (SIT-REP)
            </h2>
            <p className="text-[11px] font-mono-data text-slate-400 mt-0.5">
              BULLETIN: HAP-SITREP-{new Date().getFullYear()}-0{dayNum} • RUN: DAY {dayNum}, {String(hourNum).padStart(2, '0')}:00 UTC (+{activeHour}H)
            </p>
          </div>
          <button
            onClick={() => setSitRepModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-0.5">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">AT-RISK POPULATION</div>
            <div className="text-lg font-bold text-orange-400 font-mono-data">
              {(totalPopulationAtRisk / 1000000).toFixed(2)}M
            </div>
            <div className="text-[10px] text-slate-500 font-mono-data">TIER 3 & 4 SECTORS</div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-0.5">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">CRITICAL SECTORS</div>
            <div className="text-lg font-bold text-red-400 font-mono-data">
              {severeWards.length} / {MUNICIPAL_WARDS.length}
            </div>
            <div className="text-[10px] text-red-400 font-mono-data">EMERGENCY PROTOCOL ACTIVE</div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-0.5">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">COOLING ASSET LOAD</div>
            <div className="text-lg font-bold text-sky-400 font-mono-data">
              {Math.round((currentCoolingUsage / totalCoolingCapacity) * 100)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono-data">{currentCoolingUsage} / {totalCoolingCapacity} SLOTS</div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-0.5">
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">CRYO-BED OCCUPANCY</div>
            <div className="text-lg font-bold text-amber-400 font-mono-data">
              {Math.round((occupiedHospitalBeds / totalHospitalBeds) * 100)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono-data">{occupiedHospitalBeds} / {totalHospitalBeds} BEDS</div>
          </div>
        </div>

        {/* Sector Telemetry Table */}
        <div className="space-y-1.5">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
            SECTOR TELEMETRY & BIOMETEOROLOGICAL MATRIX
          </div>
          <div className="border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold font-mono-data text-[10px] tracking-wider uppercase">
                <tr>
                  <th className="p-2">SECTOR</th>
                  <th className="p-2">UTCI (°C)</th>
                  <th className="p-2">WBGT (°C)</th>
                  <th className="p-2">RISK TIER</th>
                  <th className="p-2">ER SURGE</th>
                  <th className="p-2">OUTDOOR LABOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {MUNICIPAL_WARDS.map((ward) => {
                  const f = ward.forecast[activeHour];
                  const riskColor = RISK_COLORS[f?.riskTier || 'low'];
                  return (
                    <tr key={ward.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 font-medium text-slate-200">{ward.name}</td>
                      <td className={`p-2 font-semibold font-mono-data ${riskColor.text}`}>{f?.utci.toFixed(1)}°C</td>
                      <td className="p-2 text-amber-400 font-mono-data">{f?.wbgt.toFixed(1)}°C</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono-data font-semibold uppercase border ${riskColor.badge}`}>
                          {f?.riskTier}
                        </span>
                      </td>
                      <td className="p-2 text-red-400 font-semibold font-mono-data">+{f?.projectedHospitalizationSpike}%</td>
                      <td className="p-2 text-slate-400 font-mono-data">{ward.vulnerability.informalWorkersPercentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Directives Summary */}
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1.5">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-emerald-400">MUNICIPAL DIRECTIVES ACTIVE:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
            <div>✔ Continuous municipal cooling center auxiliary power engaged.</div>
            <div>✔ Heavy tanker mobile water units active in high-density informal zones.</div>
            <div>✔ Mandatory outdoor labor pause enforced during 12:00-16:00 peak hours.</div>
            <div>✔ Primary health centers supplied with rapid cold-immersion cryo-units.</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
          <span className="text-[10px] font-mono-data text-slate-500 uppercase tracking-wider">
            RESTRICTED DISASTER MANAGEMENT BRIEFING
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / PDF</span>
            </button>
            <button
              onClick={() => setSitRepModalOpen(false)}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
