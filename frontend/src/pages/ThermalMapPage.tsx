import React, { useState, useMemo } from 'react';
import { ThermalAnomaly, IndustrialAsset } from '../types';
import { MapComponent } from '../components/MapComponent';
import { GlassCard } from '../components/ui/GlassCard';
import { IconBox, MaterialIcon } from '../components/ui/IconBox';
import { RiskBadge } from '../components/ui/RiskBadge';

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
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Layer switches in floating right panel
  const [layerAnomalies, setLayerAnomalies] = useState<boolean>(true);
  const [layerAssets, setLayerAssets] = useState<boolean>(true);
  const [layerHighRiskOnly, setLayerHighRiskOnly] = useState<boolean>(false);
  const [layerPersistentOnly, setLayerPersistentOnly] = useState<boolean>(false);
  const [layerSettlementContext, setLayerSettlementContext] = useState<boolean>(true);

  // Map modes
  const [mapMode, setMapMode] = useState<'HOTSPOTS' | 'HEATMAP' | 'CLUSTERS'>('HOTSPOTS');

  // Selected anomaly for local preview card (without navigating immediately)
  const [previewAnomalyId, setPreviewAnomalyId] = useState<number | null>(null);

  const categories = [
    'ALL',
    'Potential Industrial Fire',
    'Routine / Persistent Industrial Thermal Source',
    'Gas Flare / Combustion Source',
    'Agricultural / Biomass Burn',
    'Vegetation / Wildfire',
    'Mining-Related Thermal Activity'
  ];

  const assetCategories = [
    'ALL',
    'Refinery',
    'Petrochemical',
    'Power Plant',
    'Steel / Metal',
    'Mining Site',
    'LNG / Gas'
  ];

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anom => {
      if (selectedClass !== 'ALL' && anom.classification_class !== selectedClass) return false;
      if (selectedSeverity !== 'ALL' && anom.risk_level !== selectedSeverity) return false;
      if (anom.classification_confidence * 100 < minConfidence) return false;
      if (layerHighRiskOnly && anom.risk_level !== 'CRITICAL' && anom.risk_level !== 'HIGH') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchId = anom.event_id.toLowerCase().includes(q);
        const matchFac = anom.facility_name.toLowerCase().includes(q);
        const matchCls = anom.classification_class.toLowerCase().includes(q);
        if (!matchId && !matchFac && !matchCls) return false;
      }

      if (selectedRegion !== 'ALL') {
        if (selectedRegion === 'WEST' && (anom.longitude > 75 || anom.latitude > 25)) return false;
        if (selectedRegion === 'NORTH' && anom.latitude < 26) return false;
        if (selectedRegion === 'EAST' && (anom.longitude < 80 || anom.latitude < 20)) return false;
        if (selectedRegion === 'SOUTH' && anom.latitude > 18) return false;
      }

      return true;
    });
  }, [anomalies, selectedClass, selectedSeverity, minConfidence, layerHighRiskOnly, searchTerm, selectedRegion]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (selectedAssetType !== 'ALL' && a.category !== selectedAssetType) return false;
      if (layerPersistentOnly && !a.persistence_detected) return false;
      return true;
    });
  }, [assets, selectedAssetType, layerPersistentOnly]);

  const previewAnomaly = useMemo(() => {
    return anomalies.find(a => a.id === previewAnomalyId) || null;
  }, [anomalies, previewAnomalyId]);

  const handleMapAnomalyClick = (id: number) => {
    setPreviewAnomalyId(id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] overflow-hidden font-sans">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & FILTER BAR                                   */}
      {/* ============================================================ */}
      <div className="bg-[#ECF3F9]/85 backdrop-blur-[14px] border-b border-[#CDDCE8]/70 px-4 sm:px-6 py-2.5 z-20 shadow-[0_4px_20px_rgba(20,45,70,0.05)] flex flex-col gap-2">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconBox icon="local_fire_department" color="blue" size="heading" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#17324D] font-display flex items-center gap-2">
                <span>Thermal GIS Investigation Workspace</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#EAF3FB] text-[#3B82F6] font-semibold border border-[#BFDBFE]">
                  Active Telemetry
                </span>
              </h1>
              <div className="text-[11.5px] text-[#61758A]">
                Multi-spectral thermal observations cross-referenced with Indian industrial registries
              </div>
            </div>
          </div>

          {/* Search Box & Telemetry status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7B8D9D] flex items-center pointer-events-none">
                <MaterialIcon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Search event ID, facility, class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#F1F6FB]/90 border border-[#CDDCE8]/70 pl-8 pr-7 py-1.5 rounded-[10px] text-xs text-[#17324D] placeholder-[#7B8D9D] focus:outline-none focus:border-[#3B82F6] focus:bg-white w-48 sm:w-64 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B8D9D] hover:text-[#17324D]"
                >
                  <MaterialIcon name="close" size={14} />
                </button>
              )}
            </div>

            <div className="text-[11.5px] text-[#61758A] font-medium hidden md:block">
              Showing <b className="text-[#17324D] font-mono">{filteredAnomalies.length}</b> of {anomalies.length} hotspots
            </div>
          </div>
        </div>

        {/* Filter controls strip */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-[#CDDCE8]/45 text-xs">
          {/* Classification */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#61758A] font-medium text-[11.5px]">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[#F1F6FB]/90 border border-[#CDDCE8]/70 px-2 py-1 rounded-[8px] text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#61758A] font-medium text-[11.5px]">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#F1F6FB]/90 border border-[#CDDCE8]/70 px-2 py-1 rounded-[8px] text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="flex items-center gap-2 hidden sm:flex">
            <span className="text-[#61758A] font-medium text-[11.5px]">Min Conf:</span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-16 accent-[#3B82F6] cursor-pointer"
            >
            </input>
            <span className="font-mono text-[11.5px] font-semibold text-[#17324D]">{minConfidence}%</span>
          </div>

          {/* Asset Type */}
          <div className="flex items-center gap-1.5 hidden md:flex">
            <span className="text-[#61758A] font-medium text-[11.5px]">Asset Type:</span>
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value)}
              className="bg-[#F1F6FB]/90 border border-[#CDDCE8]/70 px-2 py-1 rounded-[8px] text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
            >
              {assetCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="flex items-center gap-1.5 hidden lg:flex">
            <span className="text-[#61758A] font-medium text-[11.5px]">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-[#F1F6FB]/90 border border-[#CDDCE8]/70 px-2 py-1 rounded-[8px] text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
            >
              <option value="ALL">All India</option>
              <option value="WEST">Western Industrial Hub</option>
              <option value="EAST">Eastern Belt</option>
              <option value="NORTH">Northern Region</option>
              <option value="SOUTH">Southern Hub</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedClass !== 'ALL' || selectedSeverity !== 'ALL' || minConfidence > 0 || searchTerm || selectedAssetType !== 'ALL' || selectedRegion !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedClass('ALL');
                setSelectedSeverity('ALL');
                setMinConfidence(0);
                setSearchTerm('');
                setSelectedAssetType('ALL');
                setSelectedRegion('ALL');
              }}
              className="text-[11.5px] text-[#3B82F6] hover:underline font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN MAP VIEWPORT WITH FLOATING CONTROLS & INTELLIGENCE   */}
      {/* ============================================================ */}
      <div className="flex-1 relative">
        <MapComponent
          anomalies={filteredAnomalies}
          assets={filteredAssets}
          selectedAnomalyId={previewAnomalyId}
          onSelectAnomaly={handleMapAnomalyClick}
        />

        {/* Right-Side Floating Layers & Investigation Panel */}
        <div className="absolute top-4 right-4 z-[400] w-68 max-h-[calc(100%-32px)] flex flex-col gap-3 pointer-events-none">
          {/* Layer Control Card */}
          <GlassCard variant="secondary" padding="sm" className="pointer-events-auto border border-[#CDDCE8]/70 text-xs space-y-2.5 shadow-[0_8px_24px_rgba(20,45,70,0.08)] backdrop-blur-[16px]">
            <div className="font-bold text-[#17324D] pb-1.5 border-b border-[#CDDCE8]/45 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-[13px]">
                <IconBox icon="layers" color="blue" size="small" />
                Investigation Layers
              </span>
              <span className="text-[10px] text-[#7B8D9D] font-mono">GIS_OPS</span>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <label className="flex items-center gap-2 text-[#61758A] hover:text-[#17324D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerAnomalies}
                  onChange={(e) => setLayerAnomalies(e.target.checked)}
                  className="rounded border-[#CDDCE8] text-[#3B82F6] focus:ring-0"
                />
                <span className="font-medium">Thermal Anomalies</span>
              </label>

              <label className="flex items-center gap-2 text-[#61758A] hover:text-[#17324D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerAssets}
                  onChange={(e) => setLayerAssets(e.target.checked)}
                  className="rounded border-[#CDDCE8] text-[#3B82F6] focus:ring-0"
                />
                <span className="font-medium">Industrial Assets (OSM)</span>
              </label>

              <label className="flex items-center gap-2 text-[#61758A] hover:text-[#17324D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerHighRiskOnly}
                  onChange={(e) => setLayerHighRiskOnly(e.target.checked)}
                  className="rounded border-[#CDDCE8] text-[#D95C59] focus:ring-0"
                />
                <span className="font-medium text-[#D95C59]">High-Risk Events Only</span>
              </label>

              <label className="flex items-center gap-2 text-[#61758A] hover:text-[#17324D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerPersistentOnly}
                  onChange={(e) => setLayerPersistentOnly(e.target.checked)}
                  className="rounded border-[#CDDCE8] text-[#2D9B7A] focus:ring-0"
                />
                <span className="font-medium">Persistent Sources</span>
              </label>

              <label className="flex items-center gap-2 text-[#61758A] hover:text-[#17324D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerSettlementContext}
                  onChange={(e) => setLayerSettlementContext(e.target.checked)}
                  className="rounded border-[#CDDCE8] text-[#3B82F6] focus:ring-0"
                />
                <span className="font-medium">Settlement Buffer (1 km)</span>
              </label>
            </div>

            {/* View Mode */}
            <div className="pt-2 border-t border-[#CDDCE8]/45 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[#7B8D9D] tracking-wider">Rendering Mode</div>
              <div className="grid grid-cols-3 gap-1">
                {(['HOTSPOTS', 'HEATMAP', 'CLUSTERS'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMapMode(m)}
                    className={`px-1.5 py-1 rounded-[8px] text-[10.5px] font-medium transition cursor-pointer ${
                      mapMode === m
                        ? 'bg-[#3B82F6] text-white shadow-xs'
                        : 'bg-[#E2EEF8]/60 text-[#61758A] hover:bg-[#D5E5F4]'
                    }`}
                  >
                    {m === 'HOTSPOTS' ? 'Hotspots' : (m === 'HEATMAP' ? 'Density' : 'Clusters')}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Floating Anomaly Intelligence Summary Card (when selected) */}
          {previewAnomaly && (
            <GlassCard variant="primary" padding="sm" className="pointer-events-auto border border-[#3B82F6]/35 text-xs space-y-3 shadow-[0_12px_32px_rgba(20,45,70,0.14)] backdrop-blur-[16px] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-2 border-b border-[#CDDCE8]/45 pb-2">
                <div>
                  <span className="text-[10px] font-mono text-[#7B8D9D] font-bold">
                    EVENT {previewAnomaly.event_id}
                  </span>
                  <div className="text-[13px] font-bold text-[#17324D] leading-snug font-display">
                    {previewAnomaly.classification_class}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewAnomalyId(null)}
                  className="text-[#7B8D9D] hover:text-[#17324D] p-0.5 rounded cursor-pointer"
                >
                  <MaterialIcon name="close" size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <RiskBadge level={previewAnomaly.risk_level} score={previewAnomaly.risk_score} size="sm" />
                <span className="text-[11.5px] font-semibold text-[#3B82F6] font-mono">
                  Conf: {Math.round(previewAnomaly.classification_confidence * 100)}%
                </span>
              </div>

              <div className="space-y-1.5 text-[11.5px] bg-[#ECF3F9]/65 p-2.5 rounded-[12px] border border-[#CDDCE8]/50">
                <div className="flex justify-between">
                  <span className="text-[#61758A]">Nearest Asset:</span>
                  <span className="font-semibold text-[#17324D] truncate max-w-[130px]">{previewAnomaly.facility_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#61758A]">Radiative Power:</span>
                  <span className="font-mono font-bold text-[#D95C59]">{previewAnomaly.frp.toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#61758A]">Sensor:</span>
                  <span className="text-[#17324D] font-mono">{previewAnomaly.satellite}</span>
                </div>
              </div>

              <div className="text-[10.5px] text-[#7B8D9D] italic">
                Radiometric observation. Further ground investigation recommended.
              </div>

              <button
                onClick={() => onSelectAnomaly(previewAnomaly.id)}
                className="btn-card-primary w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold"
              >
                <span>Open Full Incident Dossier</span>
                <MaterialIcon name="arrow_forward" size={14} />
              </button>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
