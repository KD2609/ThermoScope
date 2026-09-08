import React, { useState, useMemo } from 'react';
import { IndustrialAsset } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { 
  Building2, 
  Shield, 
  Activity, 
  Clock, 
  Flame, 
  Search, 
  ExternalLink, 
  MapPin, 
  Database,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (riskFilter !== 'ALL' && a.criticality_level !== riskFilter) return false;
      if (sourceFilter !== 'ALL' && !a.source.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.asset_id.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assets, categoryFilter, riskFilter, sourceFilter, searchTerm]);

  const selectedAsset = useMemo(() => {
    if (selectedAssetId) {
      const found = assets.find(a => a.id === selectedAssetId);
      if (found) return found;
    }
    return filteredAssets[0] || assets[0] || null;
  }, [assets, selectedAssetId, filteredAssets]);

  const categories = ['ALL', 'Refinery', 'Petrochemical', 'Power Plant', 'Steel / Metal', 'Mining Site', 'LNG / Gas'];

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)]">
      {/* Header */}
      <SectionHeader
        title="Industrial Asset Intelligence"
        subtitle="Explore mapped industrial assets, geofenced operational perimeters, and historical thermal operating baselines."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2F6FED] border border-[#BFDBFE]">
            {filteredAssets.length} Mapped Facilities
          </span>
        }
      />

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 5 COLUMNS: Asset Search, Filters & List */}
        <div className="lg:col-span-5 space-y-3">
          <GlassCard variant="secondary" padding="sm" className="space-y-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7B8D9D]">search</span>
              <input
                type="text"
                placeholder="Search facility name, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 pl-8 pr-3 py-1.5 rounded-lg text-xs text-[#17324D] placeholder-[#7B8D9D] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-[#EAF3FB]/60 text-[#61758A] hover:bg-white/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Risk & Source Selectors */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#CDDCE8]/45 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7B8D9D] text-[11px]">Risk:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2 py-0.5 rounded text-xs text-[#17324D] focus:outline-none w-full cursor-pointer"
                >
                  <option value="ALL">All Levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#7B8D9D] text-[11px]">Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2 py-0.5 rounded text-xs text-[#17324D] focus:outline-none w-full cursor-pointer"
                >
                  <option value="ALL">All Sources</option>
                  <option value="OSM">OSM-derived</option>
                  <option value="Demo">Demo Dataset</option>
                  <option value="Registry">Prototype Registry</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Scrollable Asset List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredAssets.length === 0 ? (
              <GlassCard variant="secondary" padding="md" className="text-center text-xs text-[#7B8D9D]">
                No industrial facilities match the criteria.
              </GlassCard>
            ) : (
              filteredAssets.map(asset => {
                const isSelected = selectedAsset && selectedAsset.id === asset.id;

                return (
                  <GlassCard
                    key={asset.id}
                    variant={isSelected ? "dense" : "primary"}
                    padding="sm"
                    hoverEffect
                    onClick={() => onSelectAsset(asset.id)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? '!border-[#3B82F6] !bg-[#ECF3F9]/85 ring-1 ring-[#3B82F6]/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-[#17324D] group-hover:text-[#3B82F6] transition">
                        {asset.name}
                      </span>
                      <RiskBadge level={asset.criticality_level} size="sm" />
                    </div>

                    <div className="text-[11px] text-[#61758A] flex items-center justify-between">
                      <span>{asset.category}</span>
                      <span className={`font-mono font-bold ${asset.active_anomalies_count > 0 ? 'text-[#D95C59]' : 'text-[#2D9B7A]'}`}>
                        {asset.active_anomalies_count} active anomaly
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#CDDCE8]/45 flex items-center justify-between text-[10px] text-[#7B8D9D]">
                      <span>Baseline: <b className="text-[#17324D]">{asset.baseline_frp_median} MW</b></span>
                      <span className="truncate max-w-[130px]">Src: {asset.source}</span>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT 7 COLUMNS: Selected Asset Deep Intelligence Profile */}
        <div className="lg:col-span-7 space-y-5">
          {selectedAsset ? (
            <GlassCard variant="primary" padding="lg" className="space-y-6">
              {/* Asset Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#CDDCE8]/65 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[#17324D] font-display">{selectedAsset.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FB] text-[#3B82F6] border border-[#3B82F6]/25 text-xs font-semibold">
                      {selectedAsset.category}
                    </span>
                    <RiskBadge level={selectedAsset.criticality_level} size="sm" />
                  </div>
                  <div className="text-xs text-[#61758A] flex flex-wrap items-center gap-3 pt-0.5">
                    <span>ID: <b className="font-mono text-[#17324D]">{selectedAsset.asset_id}</b></span>
                    <span className="text-[#CDDCE8]">&bull;</span>
                    <span className="font-mono text-[11px]">{selectedAsset.latitude.toFixed(4)}&deg;N, {selectedAsset.longitude.toFixed(4)}&deg;E</span>
                    <span className="text-[#CDDCE8]">&bull;</span>
                    <span className="text-[#2D9B7A] font-semibold">{selectedAsset.operational_status}</span>
                  </div>
                </div>

                {/* Provenance Tag */}
                <div className="text-right text-xs bg-[#EAF3FB]/60 p-2.5 rounded-xl border border-[#CDDCE8]/65">
                  <div className="text-[#7B8D9D] text-[10px] uppercase font-bold">Data Provenance</div>
                  <div className="font-bold text-[#17324D] mt-0.5">{selectedAsset.source}</div>
                  <div className="text-[10px] text-[#61758A]">Confidence: {selectedAsset.source_confidence}</div>
                </div>
              </div>

              {/* Historical Baseline Operating Envelope */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#3B82F6]">monitoring</span>
                  Historical Baseline Operating Envelope (30-Day Satellite Passes)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EAF3FB]/50 p-4 rounded-xl border border-[#CDDCE8]/65">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#61758A]">Baseline Median</div>
                    <div className="text-xl font-bold font-mono text-[#3B82F6] mt-1">{selectedAsset.baseline_frp_median} MW</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#61758A]">Normal Range</div>
                    <div className="text-sm font-bold font-mono text-[#17324D] mt-1.5">
                      {selectedAsset.baseline_frp_min} - {selectedAsset.baseline_frp_max} MW
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#61758A]">Historical Passes</div>
                    <div className="text-sm font-bold text-[#17324D] mt-1.5">{selectedAsset.baseline_count} passes</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#61758A]">Current Risk</div>
                    <div className="text-sm font-bold text-[#D95C59] mt-1.5">{selectedAsset.current_risk_level}</div>
                  </div>
                </div>
              </div>

              {/* Facility Boundary & Proximity Info */}
              <div className="p-4 bg-[#EAF3FB]/50 rounded-xl border border-[#CDDCE8]/65 text-xs space-y-2">
                <div className="font-bold text-[#17324D] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#3B82F6]">security</span>
                  Geospatial Perimeter Definition &amp; Geofencing
                </div>
                <p className="text-[#61758A] text-xs leading-relaxed">
                  Perimeter encompasses operational refining units, storage tanks, and perimeter safety buffer (~{selectedAsset.radius_meters} m radius). Detected satellite thermal radiance inside this geofenced boundary is classified using facility-specific thermal thresholds rather than generic vegetation models.
                </p>
              </div>

              {/* Active Hotspots Associated */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#D95C59]">local_fire_department</span>
                  Currently Associated Active Thermal Hotspots
                </div>

                {selectedAsset.active_anomalies_count === 0 ? (
                  <div className="p-4 rounded-xl bg-[#EAF3FB]/40 border border-[#CDDCE8]/65 text-xs text-[#7B8D9D] text-center">
                    No active thermal hotspots currently recorded within this facility's perimeter.
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F9ECEB]/70 border border-[#D95C59]/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#D95C59]">
                        {selectedAsset.active_anomalies_count} Active Thermal Hotspot(s) detected
                      </div>
                      <div className="text-[11px] text-[#61758A] mt-0.5">
                        Radiance detected inside boundary during recent orbital pass.
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectAnomaly(selectedAsset.id)}
                      className="btn-card-primary !text-[11px] !py-1.5 !px-3 shrink-0"
                    >
                      <span>Investigate in Explorer</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard variant="secondary" padding="lg" className="text-center text-xs text-[#7B8D9D]">
              Select an industrial asset from the list to view its geospatial intelligence profile.
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
