import React, { useState } from 'react';
import { IndustrialAsset } from '../types';
import { Building2, Shield, Activity, Clock, Flame, ChevronRight, Search } from 'lucide-react';

interface AssetRegistryProps {
  assets: IndustrialAsset[];
  selectedAssetId: number | null;
  onSelectAsset: (id: number) => void;
  onSelectAnomaly: (id: number) => void;
}

export const AssetRegistry: React.FC<AssetRegistryProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onSelectAnomaly
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredAssets = assets.filter(a => {
    if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.asset_id.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const categories = ['ALL', 'Refinery', 'Petrochemical', 'Power Plant', 'Steel / Metal', 'Mining Site', 'LNG / Gas'];

  return (
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Industrial Asset Registry &amp; Facility Baseline Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            OpenStreetMap-derived industrial perimeters, critical infrastructure baselines, and thermal history
          </p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset List & Filter */}
        <div className="space-y-3">
          <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search facility name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 pl-8 pr-3 py-1.5 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    categoryFilter === cat
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto">
            {filteredAssets.map(asset => {
              const isSelected = selectedAsset && selectedAsset.id === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#13223f] border-cyan-500 shadow-md shadow-cyan-950/40'
                      : 'bg-[#0f172a] hover:bg-slate-800/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-slate-200">{asset.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
                      asset.criticality_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {asset.criticality_level}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{asset.category}</span>
                    <span className="font-mono text-cyan-400 font-bold">{asset.active_anomalies_count} active hotspots</span>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Baseline: {asset.baseline_frp_median} MW</span>
                    <span>Source: {asset.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Asset Intelligence Profile */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAsset ? (
            <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-5">
              {/* Asset Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{selectedAsset.name}</h2>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                      {selectedAsset.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                    <span>ID: {selectedAsset.asset_id}</span>
                    <span>&bull;</span>
                    <span>{selectedAsset.latitude.toFixed(4)}&deg;N, {selectedAsset.longitude.toFixed(4)}&deg;E</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400">{selectedAsset.operational_status}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Data Provenance</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedAsset.source}</div>
                  <div className="text-[10px] text-slate-500">Confidence: {selectedAsset.source_confidence}</div>
                </div>
              </div>

              {/* Baseline Radiative Heat Envelope */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  Historical Baseline Operating Envelope (30-Day Sat passes)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Baseline Median FRP</div>
                    <div className="text-lg font-mono font-bold text-orange-400 mt-0.5">{selectedAsset.baseline_frp_median} MW</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Normal Range</div>
                    <div className="text-sm font-mono font-bold text-slate-300 mt-1">{selectedAsset.baseline_frp_min} - {selectedAsset.baseline_frp_max} MW</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Baseline Passes</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 mt-1">{selectedAsset.baseline_count} observations</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Risk Assessment</div>
                    <div className="text-sm font-bold text-red-400 mt-1">{selectedAsset.current_risk_level} RISK</div>
                  </div>
                </div>
              </div>

              {/* Facility Boundary & Proximity Info */}
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Geospatial Perimeter Definition
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Geofenced boundary encompasses operational distillation units, storage tanks, and perimeter buffer zone (~{selectedAsset.radius_meters} m context radius). Ingested FIRMS thermal detections inside this boundary receive spatial proximity weighting in the AI evidence engine.
                </p>
              </div>

              {/* Active Hotspots Associated */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" />
                  Currently Associated Active Thermal Hotspots
                </div>

                {selectedAsset.active_anomalies_count === 0 ? (
                  <div className="p-4 rounded bg-slate-900/40 border border-slate-800 text-xs text-slate-500 text-center">
                    No active thermal anomalies currently recorded within facility perimeter.
                  </div>
                ) : (
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{selectedAsset.active_anomalies_count} Thermal Hotspot(s) detected</span>
                      <div className="text-[11px] text-slate-400">Radiative heat detected within facility radius.</div>
                    </div>
                    <span className="text-xs text-orange-400 font-bold">Inspect on Map &rarr;</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
