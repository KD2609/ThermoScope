import React, { useState } from 'react';
import { ThermalAnomaly, IndustrialAsset } from '../types';
import { MapComponent } from '../components/MapComponent';
import { Filter, SlidersHorizontal, Flame, Building2, Search } from 'lucide-react';

interface ThermalMapPageProps {
  anomalies: ThermalAnomaly[];
  assets: IndustrialAsset[];
  onSelectAnomaly: (id: number) => void;
}

export const ThermalMapPage: React.FC<ThermalMapPageProps> = ({
  anomalies,
  assets,
  onSelectAnomaly
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [minFrp, setMinFrp] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAnomalies = anomalies.filter(anom => {
    if (selectedClass !== 'ALL' && anom.classification_class !== selectedClass) return false;
    if (selectedSeverity !== 'ALL' && anom.risk_level !== selectedSeverity) return false;
    if (anom.frp < minFrp) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = anom.event_id.toLowerCase().includes(q);
      const matchFac = anom.facility_name.toLowerCase().includes(q);
      const matchCls = anom.classification_class.toLowerCase().includes(q);
      if (!matchId && !matchFac && !matchCls) return false;
    }
    return true;
  });

  const categories = [
    'ALL',
    'Potential Industrial Fire',
    'Routine / Persistent Industrial Thermal Source',
    'Gas Flare / Combustion Source',
    'Agricultural / Biomass Burn',
    'Vegetation / Wildfire',
    'Mining-Related Thermal Activity',
    'Unknown Thermal Anomaly'
  ];

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col bg-[#080d1a] relative overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search event, facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 pl-8 pr-3 py-1 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-44"
            />
          </div>

          {/* Classification Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Min FRP Slider */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Min FRP:</span>
            <input
              type="range"
              min="0"
              max="150"
              step="10"
              value={minFrp}
              onChange={(e) => setMinFrp(Number(e.target.value))}
              className="w-24 accent-orange-500 cursor-pointer"
            />
            <span className="font-mono text-orange-400 font-bold">{minFrp} MW</span>
          </div>
        </div>

        {/* Count Pill */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-900 rounded border border-slate-800 text-slate-300 font-semibold">
            Showing <b className="text-orange-400">{filteredAnomalies.length}</b> of {anomalies.length} hotspots
          </span>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative">
        <MapComponent
          anomalies={filteredAnomalies}
          assets={assets}
          onSelectAnomaly={onSelectAnomaly}
        />
      </div>
    </div>
  );
};
