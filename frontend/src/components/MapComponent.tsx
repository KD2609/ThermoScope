import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ThermalAnomaly, IndustrialAsset } from '../types';
import { Layers, Eye, Flame, Building2 } from 'lucide-react';

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

  const [satelliteView, setSatelliteView] = useState(false);
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

    // Dark Tile Layer
    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    baseTileLayerRef.current = darkTiles;
    anomalyLayerRef.current = L.layerGroup().addTo(map);
    assetLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Layer Switch (Dark vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(baseTileLayerRef.current);

    const newLayer = satelliteView
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 })
      : L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' });

    newLayer.addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newLayer;
  }, [satelliteView]);

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
              color: '#38bdf8',
              weight: 2,
              opacity: 0.8,
              fillColor: '#0284c7',
              fillOpacity: 0.15,
              dashArray: '4, 4'
            }
          }).bindTooltip(`<b>${asset.name}</b><br><span style="font-size:11px; color:#94a3b8">${asset.category} &bull; ${asset.criticality_level}</span>`, {
            direction: 'top',
            className: 'bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded shadow'
          }).addTo(assetLayerRef.current!);
        } catch (e) {
          // ignore parsing error
        }
      }

      // 2. Asset Icon Marker
      const assetIcon = L.divIcon({
        className: 'asset-marker',
        html: `
          <div style="
            background: #0369a1;
            border: 2px solid #7dd3fc;
            width: 22px;
            height: 22px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            </svg>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([asset.latitude, asset.longitude], { icon: assetIcon })
        .bindPopup(`
          <div style="min-width: 200px; padding: 4px;">
            <div style="font-weight: 800; font-size: 13px; color: #38bdf8;">${asset.name}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${asset.category} &bull; ${asset.criticality_level}</div>
            <div style="font-size: 11px; border-top: 1px solid #334155; padding-top: 6px;">
              <div>Baseline Median: <b>${asset.baseline_frp_median} MW</b></div>
              <div>Normal Envelope: <b>${asset.baseline_frp_min} - ${asset.baseline_frp_max} MW</b></div>
              <div>Active Hotspots: <b>${asset.active_anomalies_count}</b></div>
            </div>
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

    anomalies.forEach(anom => {
      if (activeFilter === 'CRITICAL' && anom.risk_level !== 'CRITICAL') return;
      if (activeFilter === 'INDUSTRIAL' && !['Potential Industrial Fire', 'Routine / Persistent Industrial Thermal Source', 'Gas Flare / Combustion Source'].includes(anom.classification_class)) return;
      if (activeFilter === 'AGRICULTURAL' && anom.classification_class !== 'Agricultural / Biomass Burn') return;

      const isSelected = selectedAnomalyId === anom.id;
      
      // Color based on classification & risk
      let color = '#f97316'; // default high orange
      let ringColor = 'rgba(249, 115, 22, 0.4)';

      if (anom.risk_level === 'CRITICAL') {
        color = '#ef4444';
        ringColor = 'rgba(239, 68, 68, 0.6)';
      } else if (anom.classification_class === 'Agricultural / Biomass Burn') {
        color = '#10b981';
        ringColor = 'rgba(16, 185, 129, 0.4)';
      } else if (anom.classification_class === 'Routine / Persistent Industrial Thermal Source') {
        color = '#06b6d4';
        ringColor = 'rgba(6, 182, 212, 0.4)';
      } else if (anom.classification_class === 'Gas Flare / Combustion Source') {
        color = '#a855f7';
        ringColor = 'rgba(168, 85, 247, 0.4)';
      } else if (anom.risk_level === 'LOW') {
        color = '#eab308';
        ringColor = 'rgba(234, 179, 8, 0.4)';
      }

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: ${isSelected ? '32px' : '22px'};
            height: ${isSelected ? '32px' : '22px'};
            border-radius: 50%;
            background: ${ringColor};
            animation: thermalPulse 2s infinite;
          "></div>
          <div style="
            position: relative;
            background: ${color};
            border: 2px solid #ffffff;
            width: ${isSelected ? '18px' : '14px'};
            height: ${isSelected ? '18px' : '14px'};
            border-radius: 50%;
            box-shadow: 0 0 12px ${color};
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
          <div style="min-width: 220px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 800; font-size: 13px; color: ${color};">${anom.classification_class}</span>
              <span style="background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">${anom.risk_level}</span>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #f8fafc; margin-bottom: 2px;">Event: ${anom.event_id}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Associated: ${anom.facility_name}</div>
            <div style="background: #1e293b; padding: 6px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">
              <div>Radiative Power: <b style="color: #fb923c;">${anom.frp.toFixed(1)} MW</b></div>
              <div>AI Confidence: <b>${(anom.classification_confidence * 100).toFixed(0)}%</b></div>
              <div>Sensor: <b>${anom.satellite}</b></div>
            </div>
            <button
              id="btn-intel-${anom.id}"
              style="width: 100%; background: #ea580c; color: #ffffff; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;"
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
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 bg-[#0f172a]/95 backdrop-blur border border-slate-700/80 p-2 rounded-lg shadow-xl text-xs">
        <div className="font-bold text-slate-300 px-1 flex items-center gap-1.5 border-b border-slate-800 pb-1">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          Map Layers
        </div>

        <label className="flex items-center gap-2 px-1 text-slate-300 hover:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={satelliteView}
            onChange={(e) => setSatelliteView(e.target.checked)}
            className="rounded border-slate-700 text-orange-500 focus:ring-0"
          />
          <span>Satellite Context</span>
        </label>

        <label className="flex items-center gap-2 px-1 text-slate-300 hover:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showAssets}
            onChange={(e) => setShowAssets(e.target.checked)}
            className="rounded border-slate-700 text-cyan-500 focus:ring-0"
          />
          <span>Industrial Assets</span>
        </label>

        <label className="flex items-center gap-2 px-1 text-slate-300 hover:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showAnomalies}
            onChange={(e) => setShowAnomalies(e.target.checked)}
            className="rounded border-slate-700 text-orange-500 focus:ring-0"
          />
          <span>Thermal Anomalies</span>
        </label>

        <div className="border-t border-slate-800 pt-1.5 mt-0.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1">Filter View</div>
          <div className="grid grid-cols-2 gap-1">
            {['ALL', 'CRITICAL', 'INDUSTRIAL', 'AGRICULTURAL'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  activeFilter === f
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-[#0f172a]/95 backdrop-blur border border-slate-800 p-2.5 rounded-lg shadow-xl text-[11px] flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-slate-300">Industrial Fire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="text-slate-300">Gas Flare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-slate-300">Persistent / Mining</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Agricultural</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-sky-600 border border-sky-400" />
          <span className="text-slate-300">Industrial Asset</span>
        </div>
      </div>
    </div>
  );
};
