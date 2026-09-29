import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import { FireDetection } from '../types';
import { api } from '../services/api';
import { SeverityBadge, ClassBadge } from '../components/ui/Badge';

export const FireExplorerPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(50);
  const [debouncedMinConfidence, setDebouncedMinConfidence] = useState<number>(50);
  const [sensorFilter, setSensorFilter] = useState<string>('');

  const initialCached = api.getCached<{ total: number; page: number; page_size: number; items: FireDetection[] }>(
    api.getFiresKey({ page: 1, page_size: 15 })
  );

  const [fires, setFires] = useState<FireDetection[]>(() => initialCached?.items || []);
  const [total, setTotal] = useState<number>(() => initialCached?.total || 0);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce minConfidence slider changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinConfidence(minConfidence);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [minConfidence]);

  const loadFires = async (forceFresh: boolean = false) => {
    const params = {
      page,
      page_size: pageSize,
      search: debouncedSearchTerm.trim() || undefined,
      severity: severityFilter || undefined,
      predicted_class: classFilter || undefined,
      min_confidence: debouncedMinConfidence > 50 ? debouncedMinConfidence : undefined,
      sensor: sensorFilter || undefined
    };

    const cacheKey = api.getFiresKey(params);
    const cached = api.getCached<{ total: number; page: number; page_size: number; items: FireDetection[] }>(cacheKey);

    if (cached && !forceFresh) {
      setFires(cached.items || []);
      setTotal(cached.total || 0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getFires(params, undefined, forceFresh);
      setFires(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load fires:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    loadFires();
    return () => {
      isCurrent = false;
    };
  }, [page, severityFilter, classFilter, debouncedMinConfidence, sensorFilter, debouncedSearchTerm]);

  const filteredFires = fires;

  const exportCsv = () => {
    const headers = [
      'id', 'detection_time', 'latitude', 'longitude', 'brightness_temperature',
      'frp', 'confidence', 'day_night', 'predicted_class', 'severity', 'risk_score'
    ];
    const rows = filteredFires.map((f) => [
      f.id,
      f.detection_time,
      f.latitude,
      f.longitude,
      f.brightness_temperature,
      f.frp,
      f.confidence,
      f.day_night,
      f.prediction?.predicted_class || '',
      f.prediction?.severity || '',
      f.prediction?.risk_score || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thermoscope_incidents_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
            Fire & Incident Explorer
          </h1>
          <p className="text-sm text-geo-500 mt-1">
            Searchable registry of all satellite thermal observations with AI classification and spatial context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-geo-300 bg-white text-geo-700 hover:bg-geo-50 font-semibold text-xs shadow-subtle transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => loadFires(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-geo-900 hover:bg-geo-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-geo-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-900 placeholder:text-geo-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="">All Classifications</option>
              <option value="Industrial Fire">Industrial Fire</option>
              <option value="Gas Flare">Gas Flare / Persistent Source</option>
              <option value="Wildfire">Wildfire / Natural Fire</option>
              <option value="Agricultural">Agricultural Burn</option>
              <option value="Mining">Mining / Industrial Thermal Activity</option>
            </select>
          </div>

          {/* Sensor Filter */}
          <div>
            <select
              value={sensorFilter}
              onChange={(e) => { setSensorFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              <option value="">All Sensors</option>
              <option value="VIIRS">VIIRS (SNPP / NOAA)</option>
              <option value="MODIS">MODIS (Terra / Aqua)</option>
            </select>
          </div>

          {/* Min Confidence Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-geo-200 bg-geo-50">
            <span className="text-[11px] text-geo-500 whitespace-nowrap">Min Conf: {minConfidence}%</span>
            <input
              type="range"
              min="50"
              max="99"
              value={minConfidence}
              onChange={(e) => { setMinConfidence(Number(e.target.value)); setPage(1); }}
              className="w-full accent-brand-600"
            />
          </div>

        </div>
      </div>

      {/* Incident Table */}
      <div className="rounded-2xl border border-geo-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-geo-700">
            <thead className="bg-geo-50 border-b border-geo-200 text-[11px] font-bold text-geo-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Incident ID</th>
                <th className="py-3.5 px-4">Acquisition Time</th>
                <th className="py-3.5 px-4">Coordinates</th>
                <th className="py-3.5 px-4">Thermal Power / Temp</th>
                <th className="py-3.5 px-4">AI Classification</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Nearby Asset</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geo-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-geo-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Loading fire incidents...</span>
                  </td>
                </tr>
              ) : filteredFires.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-geo-500">
                    No thermal anomaly detections match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFires.map((fire) => (
                  <tr key={fire.id} className="hover:bg-geo-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-geo-900">{fire.id}</span>
                        {fire.day_night === 'N' ? (
                          <span title="Nighttime Detection"><Moon className="w-3 h-3 text-indigo-500" /></span>
                        ) : (
                          <span title="Daytime Detection"><Sun className="w-3 h-3 text-amber-500" /></span>
                        )}
                      </div>
                      <span className="text-[10px] text-geo-400 font-mono">{fire.sensor}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{new Date(fire.detection_time).toLocaleDateString()}</div>
                      <div className="text-[11px] text-geo-400 font-mono">{new Date(fire.detection_time).toLocaleTimeString()} UTC</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-geo-600">
                      {fire.latitude.toFixed(3)}&deg;N, {fire.longitude.toFixed(3)}&deg;E
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-geo-900">{fire.frp ? fire.frp.toFixed(1) : 0} MW</div>
                      <div className="text-[11px] text-geo-500 font-mono">{fire.brightness_temperature.toFixed(1)} K</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <ClassBadge predictedClass={fire.prediction?.predicted_class || 'Processing'} />
                      <div className="text-[10px] text-brand-600 font-bold mt-0.5">
                        {Math.round((fire.prediction?.confidence || 0.7) * 100)}% confidence
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={fire.prediction?.severity || 'LOW'} />
                    </td>

                    <td className="py-3.5 px-4">
                      {fire.prediction?.nearby_industrial_name ? (
                        <div>
                          <span className="font-semibold text-geo-800 truncate block max-w-[150px]">
                            {fire.prediction.nearby_industrial_name}
                          </span>
                          <span className="text-[10px] text-brand-600 font-bold">
                            {fire.prediction.distance_to_industrial_km?.toFixed(1)} km
                          </span>
                        </div>
                      ) : (
                        <span className="text-geo-400 text-xs">Isolated</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/fires/${encodeURIComponent(fire.id)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-geo-100 hover:bg-brand-50 text-geo-800 hover:text-brand-700 font-semibold text-xs transition-colors"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-4 bg-geo-50 border-t border-geo-200 flex items-center justify-between text-xs text-geo-600">
          <div>
            {loading ? (
              <span className="text-geo-400 font-medium">Loading observations...</span>
            ) : (
              <>
                Showing <strong className="text-geo-900">{filteredFires.length}</strong> of{' '}
                <strong className="text-geo-900">{total}</strong> total observations
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
              className="p-1.5 rounded-lg border border-geo-200 bg-white disabled:opacity-40 hover:bg-geo-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              {loading ? 'Page ...' : `Page ${page} of ${totalPages || 1}`}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={loading || page >= totalPages}
              className="p-1.5 rounded-lg border border-geo-200 bg-white disabled:opacity-40 hover:bg-geo-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
