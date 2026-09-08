import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ThermalAnomaly, IndustrialAsset } from '../types';
import { Layers, Eye, Building2, Flame, MapPin, Globe } from 'lucide-react';

interface MapComponentProps {
  anomalies: ThermalAnomaly[];
  assets: IndustrialAsset[];
  selectedAnomalyId?: number | null;
  onSelectAnomaly: (id: number) => void;
  className?: string;
  focusCoords?: [number, number] | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  anomalies,
  assets,
  selectedAnomalyId,
  onSelectAnomaly,
  className = "h-full w-full",
  focusCoords
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const anomalyLayerRef = useRef<L.LayerGroup | null>(null);
  const assetLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileMode, setTileMode] = useState<'POSITRON' | 'SATELLITE' | 'DARK'>('POSITRON');
  const [showAssets, setShowAssets] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on India
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 78.5],
      zoom: 5,
      zoomControl: true,
      attributionControl: false
    });

    // Default Carto Positron Light Tiles
    const lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    baseTileLayerRef.current = lightTiles;
    assetLayerRef.current = L.layerGroup().addTo(map);
    anomalyLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size once container mounts and on resize
    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 400);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);

    let newUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    let maxZoom = 19;

    if (tileMode === 'SATELLITE') {
      newUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    } else if (tileMode === 'DARK') {
      newUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(newUrl, { maxZoom, subdomains: 'abcd' });
    newLayer.addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newLayer;
  }, [tileMode]);

  // Render Industrial Assets
  useEffect(() => {
    if (!assetLayerRef.current || !mapInstanceRef.current) return;
    assetLayerRef.current.clearLayers();

    if (!showAssets) return;

    assets.forEach(asset => {
      // 1. Boundary Polygon if available
      if (asset.boundary_geojson) {
        try {
          const geom = JSON.parse(asset.boundary_geojson);
          L.geoJSON(geom, {
            style: {
              color: '#0284C7',
              weight: 2,
              opacity: 0.85,
              fillColor: '#38BDF8',
              fillOpacity: 0.12,
              dashArray: '4, 4'
            }
          }).bindTooltip(`
            <div style="font-family: 'DM Sans', sans-serif; padding: 2px;">
              <strong style="color: #102A43; font-size: 12px;">${asset.name}</strong><br/>
              <span style="color: #52677D; font-size: 11px;">${asset.category} &bull; ${asset.criticality_level}</span>
            </div>
          `, {
            direction: 'top',
            className: 'leaflet-custom-tooltip'
          }).addTo(assetLayerRef.current!);
        } catch (e) {
          // ignore
        }
      }

      // 2. Asset Marker Icon
      const assetIcon = L.divIcon({
        className: 'asset-marker',
        html: `
          <div style="
            background: #0284C7;
            border: 2px solid #FFFFFF;
            width: 20px;
            height: 20px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
          ">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            </svg>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([asset.latitude, asset.longitude], { icon: assetIcon })
        .bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 210px; padding: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #102A43; margin-bottom: 2px;">${asset.name}</div>
            <div style="font-size: 11px; color: #52677D; margin-bottom: 6px;">${asset.category} &bull; <span style="font-weight: 600; color: #0284C7;">${asset.criticality_level}</span></div>
            <div style="background: #F4F7FA; border: 1px solid #D9E2EA; border-radius: 6px; padding: 6px 8px; font-size: 11px; margin-bottom: 6px; color: #102A43;">
              <div>Baseline Median: <b>${asset.baseline_frp_median} MW</b></div>
              <div>Normal Envelope: <b>${asset.baseline_frp_min} - ${asset.baseline_frp_max} MW</b></div>
              <div>Active Hotspots: <b>${asset.active_anomalies_count}</b></div>
            </div>
            <div style="font-size: 10px; color: #6B7C8F;">Source: ${asset.source} (${asset.source_confidence})</div>
          </div>
        `)
        .addTo(assetLayerRef.current!);
    });
  }, [assets, showAssets]);

  // Render Thermal Anomalies
  useEffect(() => {
    if (!anomalyLayerRef.current || !mapInstanceRef.current) return;
    anomalyLayerRef.current.clearLayers();

    if (!showAnomalies) return;

    (anomalies || []).forEach(anom => {
      if (activeFilter === 'CRITICAL' && anom.risk_level !== 'CRITICAL') return;
      if (activeFilter === 'INDUSTRIAL' && !['Potential Industrial Fire', 'Routine / Persistent Industrial Thermal Source', 'Gas Flare / Combustion Source'].includes(anom.classification_class)) return;
      if (activeFilter === 'AGRICULTURAL' && anom.classification_class !== 'Agricultural / Biomass Burn') return;

      const isSelected = selectedAnomalyId === anom.id;

      let color = '#C53030'; // Soft red
      let ringColor = 'rgba(197, 48, 48, 0.25)';

      if (anom.risk_level === 'CRITICAL') {
        color = '#B91C1C';
        ringColor = 'rgba(185, 28, 28, 0.35)';
      } else if (anom.classification_class === 'Agricultural / Biomass Burn') {
        color = '#059669';
        ringColor = 'rgba(5, 150, 105, 0.25)';
      } else if (anom.classification_class === 'Routine / Persistent Industrial Thermal Source') {
        color = '#0891B2';
        ringColor = 'rgba(8, 145, 178, 0.25)';
      } else if (anom.classification_class === 'Gas Flare / Combustion Source') {
        color = '#7C3AED';
        ringColor = 'rgba(124, 58, 237, 0.25)';
      } else if (anom.risk_level === 'LOW') {
        color = '#D97706';
        ringColor = 'rgba(217, 119, 6, 0.25)';
      }

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            position: absolute;
            width: ${isSelected ? '32px' : '22px'};
            height: ${isSelected ? '32px' : '22px'};
            border-radius: 50%;
            background: ${ringColor};
            animation: thermalPulse 2.2s infinite;
          "></div>
          <div style="
            position: relative;
            background: ${color};
            border: 2px solid #FFFFFF;
            width: ${isSelected ? '18px' : '14px'};
            height: ${isSelected ? '18px' : '14px'};
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(16, 42, 67, 0.25);
          "></div>
        </div>
      `;

      const anomalyIcon = L.divIcon({
        className: 'anomaly-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([anom.latitude, anom.longitude], { icon: anomalyIcon })
        .bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 230px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 12px; color: ${color}; line-height: 1.2;">
                ${anom.classification_class}
              </span>
              <span style="background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: 700; text-transform: uppercase;">
                ${anom.risk_level}
              </span>
            </div>

            <div style="font-size: 11px; font-weight: 600; color: #102A43; margin-bottom: 2px;">
              Event ID: <span style="font-family: monospace;">${anom.event_id}</span>
            </div>
            <div style="font-size: 11px; color: #52677D; margin-bottom: 8px;">
              Facility Context: <b>${anom.facility_name}</b>
            </div>

            <div style="background: #F4F7FA; border: 1px solid #D9E2EA; border-radius: 6px; padding: 6px 8px; font-size: 11px; margin-bottom: 8px; color: #102A43;">
              <div>Radiance FRP: <b style="color: ${color}; font-family: monospace;">${anom.frp.toFixed(1)} MW</b></div>
              <div>Brightness Temp: <b style="font-family: monospace;">${anom.brightness ? (anom.brightness - 273.15).toFixed(1) + ' °C' : 'Nominal'}</b></div>
              <div>Assessment Confidence: <b>${Math.round(anom.classification_confidence * 100)}%</b></div>
              <div>Satellite Sensor: <b>${anom.satellite || 'VIIRS'}</b></div>
            </div>

            <button
              id="btn-intel-${anom.id}"
              style="width: 100%; background: #2F6FED; color: #ffffff; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
            >
              Open Incident Intelligence &rarr;
            </button>
          </div>
        `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-intel-${anom.id}`);
        if (btn) {
          btn.onclick = () => onSelectAnomaly(anom.id);
        }
      });

      marker.addTo(anomalyLayerRef.current!);
    });
  }, [anomalies, selectedAnomalyId, showAnomalies, activeFilter, onSelectAnomaly]);

  // Focus effect
  useEffect(() => {
    if (focusCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusCoords, 12, { duration: 1.5 });
    }
  }, [focusCoords]);

  return (
    <div 
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: '500px', height: '100%', width: '100%' }}
    >
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ minHeight: '500px', height: '100%', width: '100%' }}
      />

      {/* Floating Layer Controls (Editorial Frosted Glass) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 bg-white/85 backdrop-blur-md border border-white/90 p-3 rounded-xl shadow-[0_4px_20px_-2px_rgba(16,42,67,0.08)] text-xs text-[#102A43] max-w-[200px]">
        <div className="font-bold text-[#102A43] pb-1.5 border-b border-[#D9E2EA] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2F6FED]" />
            GIS Layers
          </span>
        </div>

        {/* Tile Basemap Switcher */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] uppercase font-bold text-[#6B7C8F]">Basemap</div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setTileMode('POSITRON')}
              className={`px-1.5 py-1 rounded text-[10px] font-medium transition ${
                tileMode === 'POSITRON'
                  ? 'bg-[#2F6FED] text-white'
                  : 'bg-[#EEF3F7] text-[#52677D] hover:bg-[#E2E8F0]'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTileMode('SATELLITE')}
              className={`px-1.5 py-1 rounded text-[10px] font-medium transition ${
                tileMode === 'SATELLITE'
                  ? 'bg-[#2F6FED] text-white'
                  : 'bg-[#EEF3F7] text-[#52677D] hover:bg-[#E2E8F0]'
              }`}
            >
              Sat
            </button>
            <button
              onClick={() => setTileMode('DARK')}
              className={`px-1.5 py-1 rounded text-[10px] font-medium transition ${
                tileMode === 'DARK'
                  ? 'bg-[#2F6FED] text-white'
                  : 'bg-[#EEF3F7] text-[#52677D] hover:bg-[#E2E8F0]'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="space-y-1.5 pt-1.5 border-t border-[#D9E2EA]">
          <label className="flex items-center gap-2 text-[#52677D] hover:text-[#102A43] cursor-pointer">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="rounded border-[#D9E2EA] text-[#2F6FED] focus:ring-0"
            />
            <span className="font-medium">Thermal Hotspots</span>
          </label>

          <label className="flex items-center gap-2 text-[#52677D] hover:text-[#102A43] cursor-pointer">
            <input
              type="checkbox"
              checked={showAssets}
              onChange={(e) => setShowAssets(e.target.checked)}
              className="rounded border-[#D9E2EA] text-[#0284C7] focus:ring-0"
            />
            <span className="font-medium">Industrial Assets</span>
          </label>
        </div>

        {/* Quick Filter */}
        <div className="pt-1.5 border-t border-[#D9E2EA]">
          <div className="text-[10px] uppercase font-bold text-[#6B7C8F] mb-1">Filter View</div>
          <div className="grid grid-cols-2 gap-1">
            {['ALL', 'CRITICAL', 'INDUSTRIAL', 'AGRICULTURAL'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  activeFilter === f
                    ? 'bg-[#2F6FED] text-white'
                    : 'bg-[#EEF3F7] text-[#52677D] hover:bg-[#E2E8F0]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend (Bottom-Left Frosted Pill) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/85 backdrop-blur-md border border-white/90 px-3 py-2 rounded-xl shadow-[0_4px_16px_rgba(16,42,67,0.06)] text-[11px] text-[#102A43] flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
          <span className="text-[#52677D] font-medium">Potential Fire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
          <span className="text-[#52677D] font-medium">Gas Flare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2]" />
          <span className="text-[#52677D] font-medium">Persistent Source</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
          <span className="text-[#52677D] font-medium">Agricultural</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#0284C7] border border-white" />
          <span className="text-[#52677D] font-medium">Industrial Facility</span>
        </div>
      </div>
    </div>
  );
};
