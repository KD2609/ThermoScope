import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useNavigate } from 'react-router-dom';
import { FireDetection, IndustrialSite, ResidentialArea } from '../../types';
import { Factory, Home, Flame, Layers, AlertTriangle } from 'lucide-react';

interface FireMapProps {
  fires: FireDetection[];
  industrialSites: IndustrialSite[];
  residentialAreas?: ResidentialArea[];
  selectedFireId?: string | null;
  onSelectFire?: (fire: FireDetection) => void;
  height?: string;
}

export const FireMap: React.FC<FireMapProps> = ({
  fires,
  industrialSites,
  residentialAreas = [],
  selectedFireId,
  onSelectFire,
  height = '650px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const indLayerRef = useRef<L.LayerGroup | null>(null);
  const resLayerRef = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();

  // Layer filter state
  const [showIndustrial, setShowIndustrial] = useState<boolean>(true);
  const [showResidential, setShowResidential] = useState<boolean>(true);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over India's industrial belt by default
    const map = L.map(mapContainerRef.current, {
      center: [21.5, 78.5],
      zoom: 5,
      zoomControl: false,
    });

    // Clean, high-contrast CartoDB Positron base tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, NASA FIRMS, OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Zoom control on bottom right for clean layout
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize layer groups
    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="w-8 h-8 rounded-full bg-brand-600/90 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(32, 32)
        });
      }
    });

    indLayerRef.current = L.layerGroup().addTo(map);
    resLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Fire Markers & Clusters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: showClusters ? 40 : 1,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-elevated border-2 border-white">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(36, 36)
        });
      }
    });

    const filteredFires = fires.filter((f) => {
      if (severityFilter === 'ALL') return true;
      return f.prediction?.severity === severityFilter;
    });

    const bounds: [number, number][] = [];

    filteredFires.forEach((fire) => {
      const lat = fire.latitude;
      const lon = fire.longitude;
      bounds.push([lat, lon]);

      const sev = fire.prediction?.severity || 'LOW';
      let markerColor = '#10b981'; // green
      let pulseClass = '';

      if (sev === 'CRITICAL') {
        markerColor = '#ef4444';
        pulseClass = 'marker-pulse-critical';
      } else if (sev === 'HIGH') {
        markerColor = '#f97316';
      } else if (sev === 'MEDIUM') {
        markerColor = '#f59e0b';
      }

      // Sizing based on FRP
      const radius = Math.max(8, Math.min(22, Math.round(8 + (fire.frp || 20) / 30)));

      const iconHtml = `
        <div class="relative flex items-center justify-center w-${radius * 2}px h-${radius * 2}px cursor-pointer group">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-card border-2 border-white transition-transform group-hover:scale-125 ${pulseClass}" style="background-color: ${markerColor};">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: iconHtml,
        className: 'fire-marker-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([lat, lon], { icon: markerIcon });

      const popupContent = `
        <div class="p-2 min-w-[240px]">
          <div class="flex items-center justify-between pb-1.5 border-b border-geo-100 mb-2">
            <span class="text-xs font-mono font-bold text-geo-900">${fire.id}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style="background: ${markerColor}20; color: ${markerColor}; border: 1px solid ${markerColor}40;">
              ${sev}
            </span>
          </div>
          <div class="space-y-1 text-xs text-geo-700">
            <div class="flex justify-between">
              <span class="text-geo-500">AI Classification:</span>
              <span class="font-semibold text-geo-900">${fire.prediction?.predicted_class || 'Processing'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-geo-500">Confidence:</span>
              <span class="font-bold text-brand-600">${Math.round((fire.prediction?.confidence || 0.7) * 100)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-geo-500">Thermal Power:</span>
              <span class="font-mono text-geo-800">${fire.frp ? fire.frp.toFixed(1) : 'N/A'} MW</span>
            </div>
            <div class="flex justify-between">
              <span class="text-geo-500">Brightness Temp:</span>
              <span class="font-mono text-geo-800">${fire.brightness_temperature.toFixed(1)} K</span>
            </div>
            ${fire.prediction?.nearby_industrial_name ? `
              <div class="mt-1.5 pt-1.5 border-t border-geo-100 text-[11px]">
                <span class="text-geo-500">Near:</span> <strong class="text-geo-900">${fire.prediction.nearby_industrial_name}</strong>
                <span class="text-brand-600 font-bold ml-1">(${fire.prediction.distance_to_industrial_km?.toFixed(1)} km)</span>
              </div>
            ` : ''}
          </div>
          <button id="btn-inspect-${fire.id}" class="mt-3 w-full py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors text-center block">
            View Complete Dossier
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${fire.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/fires/${encodeURIComponent(fire.id)}`);
          };
        }
        if (onSelectFire) {
          onSelectFire(fire);
        }
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Center map if fire points exist and not yet centered
    if (bounds.length > 0 && !selectedFireId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [fires, severityFilter, showClusters, navigate, onSelectFire]);

  // Update Industrial Sites Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !indLayerRef.current) return;

    indLayerRef.current.clearLayers();
    if (!showIndustrial) return;

    industrialSites.forEach((site) => {
      const iconHtml = `
        <div class="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center shadow-md border border-white hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
        </div>
      `;
      const icon = L.divIcon({
        html: iconHtml,
        className: 'ind-site-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([site.latitude, site.longitude], { icon });
      marker.bindPopup(`
        <div class="p-2 text-xs">
          <div class="font-bold text-geo-900">${site.name}</div>
          <div class="text-geo-500 uppercase font-semibold text-[10px] mt-0.5">${site.type.replace('_', ' ')} &bull; ${site.risk_category}</div>
          <p class="text-geo-600 mt-1 text-[11px]">${site.description || 'Monitored critical infrastructure asset.'}</p>
        </div>
      `);
      indLayerRef.current?.addLayer(marker);
    });
  }, [industrialSites, showIndustrial]);

  // Update Residential Areas Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !resLayerRef.current) return;

    resLayerRef.current.clearLayers();
    if (!showResidential) return;

    residentialAreas.forEach((area) => {
      // Buffer danger circle
      const circle = L.circle([area.latitude, area.longitude], {
        radius: (area.danger_radius_km || 2.5) * 1000,
        color: '#818cf8',
        weight: 1,
        fillColor: '#6366f1',
        fillOpacity: 0.08
      });

      const iconHtml = `
        <div class="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-400 text-indigo-700 flex items-center justify-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        </div>
      `;
      const icon = L.divIcon({
        html: iconHtml,
        className: 'res-area-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([area.latitude, area.longitude], { icon });
      marker.bindPopup(`
        <div class="p-2 text-xs">
          <div class="font-bold text-geo-900">${area.name}</div>
          <div class="text-geo-500 text-[11px]">Est. Population: <strong>${area.population_estimate?.toLocaleString()}</strong></div>
          <div class="text-indigo-600 font-semibold text-[11px]">Buffer Radius: ${area.danger_radius_km} km</div>
        </div>
      `);

      resLayerRef.current?.addLayer(circle);
      resLayerRef.current?.addLayer(marker);
    });
  }, [residentialAreas, showResidential]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-geo-200 shadow-card bg-white">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-card border border-geo-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-geo-800 pr-2 border-r border-geo-200">
          <Layers className="w-4 h-4 text-brand-600" />
          <span>Layers</span>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-geo-700 hover:text-geo-900 font-medium">
          <input
            type="checkbox"
            checked={showIndustrial}
            onChange={(e) => setShowIndustrial(e.target.checked)}
            className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
          />
          <Factory className="w-3.5 h-3.5 text-slate-700" />
          <span>Industrial Assets</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-geo-700 hover:text-geo-900 font-medium">
          <input
            type="checkbox"
            checked={showResidential}
            onChange={(e) => setShowResidential(e.target.checked)}
            className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
          />
          <Home className="w-3.5 h-3.5 text-indigo-600" />
          <span>Residential Buffers</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-geo-700 hover:text-geo-900 font-medium">
          <input
            type="checkbox"
            checked={showClusters}
            onChange={(e) => setShowClusters(e.target.checked)}
            className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Marker Clusters</span>
        </label>

        <div className="flex items-center gap-1 pl-2 border-l border-geo-200">
          <span className="text-geo-500">Risk:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-geo-50 border border-geo-200 text-geo-800 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All ({fires.length})</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-card border border-geo-200 text-[11px] text-geo-700 space-y-1">
        <div className="font-bold text-geo-900 text-xs mb-1">Thermal Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-severity-critical" />
          <span>Critical Industrial Fire</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-severity-high" />
          <span>High Severity Anomaly</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-severity-medium" />
          <span>Gas Flare / Persistent Source</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-severity-low" />
          <span>Natural Fire / Agricultural Burn</span>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full" />
    </div>
  );
};
