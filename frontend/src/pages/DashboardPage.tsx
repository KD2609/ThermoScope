import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Factory,
  AlertTriangle,
  Bell,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  Radio,
  Zap,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FireDetection, IndustrialSite, DashboardStats, IntelligenceBrief } from '../types';
import { api, API_BASE } from '../services/api';
import { FireMap } from '../components/map/FireMap';
import { SeverityBadge, ClassBadge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const cachedStats = api.getCached<DashboardStats>('dashboard_stats');
  const cachedFires = api.getCached<FireDetection[]>('active_fires_48');
  const cachedSites = api.getCached<IndustrialSite[]>('industrial_sites');

  const [stats, setStats] = useState<DashboardStats | null>(() => cachedStats || null);
  const [fires, setFires] = useState<FireDetection[]>(() => cachedFires || []);
  const [industrialSites, setIndustrialSites] = useState<IndustrialSite[]>(() => cachedSites || []);
  const [selectedFire, setSelectedFire] = useState<FireDetection | null>(() => (cachedFires && cachedFires.length > 0 ? cachedFires[0] : null));
  const [loading, setLoading] = useState<boolean>(() => !cachedStats && (!cachedFires || cachedFires.length === 0));
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Feature Expansion State
  const [intelligenceBrief, setIntelligenceBrief] = useState<IntelligenceBrief | null>(null);
  const [showBrief, setShowBrief] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  const handleSelectFire = React.useCallback((fire: FireDetection) => {
    setSelectedFire(fire);
  }, []);

  const loadData = async (forceFresh: boolean = false) => {
    try {
      if (!api.getCached('dashboard_stats') && !api.getCached('active_fires_48')) {
        setLoading(true);
      }
      setRefreshing(true);
      const [statsRes, firesRes, sitesRes] = await Promise.allSettled([
        api.getDashboardStats(forceFresh),
        api.getActiveFires(48, undefined, forceFresh),
        api.getIndustrialSites(forceFresh)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (firesRes.status === 'fulfilled' && Array.isArray(firesRes.value)) {
        if (firesRes.value.length > 0) {
          setFires(firesRes.value);
          setSelectedFire((prev) => prev || firesRes.value[0]);
        }
      } else if (firesRes.status === 'rejected') {
        console.error('Failed to load active fires:', firesRes.reason);
      }

      if (sitesRes.status === 'fulfilled' && Array.isArray(sitesRes.value)) {
        if (sitesRes.value.length > 0) {
          setIndustrialSites(sitesRes.value);
        }
      } else if (sitesRes.status === 'rejected') {
        console.error('Failed to load industrial sites:', sitesRes.reason);
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(val, 6);
        setSearchResults(res.results);
      } catch (e) {
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults(null);
    }
  };

  useEffect(() => {
    loadData();
    api.getIntelligenceBrief().then(setIntelligenceBrief).catch(() => null);

    const interval = setInterval(loadData, 60000); // 60s live poll

    // Real-Time SSE Listener
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/events/stream`);
      es.onopen = () => setSseConnected(true);
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.event !== 'ping') {
            setLiveNotification(`Real-time update: ${payload.event.replace('_', ' ').toUpperCase()}`);
            setTimeout(() => setLiveNotification(null), 5000);
            loadData();
            api.getIntelligenceBrief().then(setIntelligenceBrief).catch(() => null);
          }
        } catch (err) { }
      };
      es.onerror = () => setSseConnected(false);
    } catch (e) {
      console.warn('SSE stream unavailable', e);
    }

    return () => {
      clearInterval(interval);
      if (es) es.close();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Live SSE Notification Toast */}
      {liveNotification && (
        <div className="p-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse text-indigo-200" />
            <span>{liveNotification}</span>
          </div>
          <button onClick={() => setLiveNotification(null)} className="text-indigo-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
              GIS Live Monitoring Console
            </h1>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sseConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-geo-100 text-geo-700'
              }`}>
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-geo-400'}`} />
              {sseConnected ? 'Live SSE Stream' : 'Live Polling Feed'}
            </span>
          </div>
          <p className="text-sm text-geo-500 mt-1">
            Real-time orbital thermal anomaly telemetry from NASA FIRMS with OpenStreetMap spatial context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              api.getIntelligenceBrief().then(setIntelligenceBrief).catch(() => null);
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-geo-300 bg-white text-geo-700 hover:bg-geo-50 font-semibold text-xs shadow-subtle transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/fires"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <span>Fire Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-geo-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Global Search: search by detection ID, incident ID, facility name (e.g. Refinery, Smelter), or state..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-geo-200 rounded-2xl text-xs font-medium text-geo-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3.5 text-geo-400 hover:text-geo-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-geo-200 rounded-2xl shadow-xl max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="flex justify-between items-center text-geo-500 pb-2 border-b border-geo-100">
              <span className="font-bold">Search Results for "{searchQuery}"</span>
              <button onClick={() => setSearchResults(null)} className="hover:text-geo-700 text-geo-400">Close</button>
            </div>

            {/* Fires Matches */}
            {(searchResults.fires || []).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-geo-400 uppercase tracking-wider block">Fires & Hotspots</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.fires.map((f: any) => (
                    <Link
                      key={f.id}
                      to={`/fires/${f.id}`}
                      className="p-2.5 rounded-xl border border-geo-200 hover:bg-geo-50 flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-brand-600">{f.id}</div>
                        <div className="text-[11px] text-geo-500">{f.predicted_class}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-geo-900">{f.frp?.toFixed(1)} MW</div>
                        <SeverityBadge severity={f.severity || 'LOW'} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents Matches */}
            {(searchResults.incidents || []).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-geo-400 uppercase tracking-wider block">Clustered Incidents</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.incidents.map((inc: any) => (
                    <div
                      key={inc.id}
                      className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-indigo-700">{inc.incident_id}</div>
                        <div className="text-[11px] text-geo-500">{inc.detection_count} detections &bull; {inc.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-geo-900">Risk {inc.current_risk}/100</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities Matches */}
            {(searchResults.facilities || []).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-geo-400 uppercase tracking-wider block">Industrial Facilities</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.facilities.map((fac: any) => (
                    <div
                      key={fac.id}
                      className="p-2.5 rounded-xl border border-geo-200 hover:bg-geo-50 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-geo-900">{fac.name}</div>
                        <div className="text-[11px] text-geo-500 capitalize">{fac.type?.replace('_', ' ')}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700">
                        {fac.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.total_matches === 0 && (
              <div className="text-center py-4 text-geo-400">
                No detections, incidents, or facilities matched "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>


      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Active Detections */}
        <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-geo-500 uppercase tracking-wider">Active Detections</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-geo-900 font-mono">
              {stats?.active_fires_count ?? fires.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{stats?.trend_percentage_24h ?? 0}% 24h
            </span>
          </div>
          <p className="text-[11px] text-geo-500 mt-1">Confirmed hotspots within 48 hours</p>
        </div>

        {/* Card 2: Industrial Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-geo-500 uppercase tracking-wider">Industrial Sources</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-600 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-geo-900 font-mono">
              {stats?.industrial_fires_count ?? 0}
            </span>
            <span className="text-xs font-medium text-geo-500">Refineries & Smelters</span>
          </div>
          <p className="text-[11px] text-geo-500 mt-1">Fires and persistent flares identified</p>
        </div>

        {/* Card 3: High-Risk Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-geo-500 uppercase tracking-wider">High Risk Anomaly</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600 font-mono">
              {stats?.high_risk_count ?? 0}
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase">
              Urgent
            </span>
          </div>
          <p className="text-[11px] text-geo-500 mt-1">Require immediate authority inspection</p>
        </div>

        {/* Card 4: Operational Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-geo-500 uppercase tracking-wider">Operational Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-geo-900 font-mono">
              {stats?.active_alerts_count ?? stats?.critical_alerts_count ?? 0}
            </span>
            <Link to="/alerts" className="text-xs font-bold text-brand-600 hover:underline">
              View Alerts &rarr;
            </Link>
          </div>
          <p className="text-[11px] text-geo-500 mt-1">Pending responder acknowledgment</p>
        </div>

      </div>

      {/* Main Interactive Map & Side Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left GIS Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <FireMap
            fires={fires}
            industrialSites={industrialSites}
            selectedFireId={selectedFire?.id}
            onSelectFire={handleSelectFire}
            height="620px"
          />
        </div>

        {/* Right Incident Inspector & Recent Hotspots (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Quick Inspector Card */}
          {selectedFire ? (
            <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-geo-100">
                <div>
                  <span className="text-xs font-mono font-bold text-geo-900">{selectedFire.id}</span>
                  <p className="text-[11px] text-geo-500">
                    {new Date(selectedFire.detection_time).toLocaleString()} UTC
                  </p>
                </div>
                <SeverityBadge severity={selectedFire.prediction?.severity || 'LOW'} />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-geo-500 block mb-1">AI Classification:</span>
                  <ClassBadge predictedClass={selectedFire.prediction?.predicted_class || 'Other / Uncertain'} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-geo-100">
                  <div className="p-2.5 rounded-lg bg-geo-50">
                    <span className="text-geo-500 text-[10px] uppercase font-bold">Confidence</span>
                    <p className="font-bold text-sm text-brand-600 font-mono">
                      {Math.round((selectedFire.prediction?.confidence || 0.7) * 100)}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-geo-50">
                    <span className="text-geo-500 text-[10px] uppercase font-bold">Risk Score</span>
                    <p className="font-bold text-sm text-geo-900 font-mono">
                      {selectedFire.prediction?.risk_score ?? 50.0} / 100
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between">
                    <span className="text-geo-500">Sensor / Satellite:</span>
                    <span className="font-mono text-geo-800">{selectedFire.sensor} ({selectedFire.satellite})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-geo-500">Brightness Temp:</span>
                    <span className="font-mono font-semibold text-geo-800">{selectedFire.brightness_temperature.toFixed(1)} K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-geo-500">Thermal Radiative Power:</span>
                    <span className="font-mono font-semibold text-geo-800">{selectedFire.frp ? selectedFire.frp.toFixed(1) : '0.0'} MW</span>
                  </div>
                  {selectedFire.prediction?.nearby_industrial_name && (
                    <div className="flex justify-between text-brand-700 font-medium">
                      <span>Proximity:</span>
                      <span>{selectedFire.prediction.distance_to_industrial_km?.toFixed(1)} km to {selectedFire.prediction.nearby_industrial_name}</span>
                    </div>
                  )}
                </div>

                {selectedFire.prediction?.recommended_response && (
                  <div className="p-3 rounded-xl bg-geo-50 border border-geo-200 text-[11px] text-geo-700 leading-relaxed mt-2">
                    <span className="font-bold text-geo-900 block mb-0.5">Recommended Response:</span>
                    {selectedFire.prediction.recommended_response}
                  </div>
                )}
              </div>

              <Link
                to={`/fires/${encodeURIComponent(selectedFire.id)}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-colors"
              >
                <span>Open Complete Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}

          {/* Recent Hotspots Feed */}
          <div className="p-4 rounded-2xl bg-white border border-geo-200 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-geo-100">
              <span className="text-xs font-bold text-geo-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-600" />
                <span>Recent Observations</span>
              </span>
              <span className="text-[11px] font-mono text-geo-500">{fires.length} active</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {fires.slice(0, 8).map((fire) => {
                const isSelected = selectedFire?.id === fire.id;
                return (
                  <button
                    key={fire.id}
                    onClick={() => setSelectedFire(fire)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${isSelected
                        ? 'bg-brand-50/70 border-brand-300 ring-1 ring-brand-500/20'
                        : 'bg-geo-50/50 border-geo-200 hover:bg-geo-100/70'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-geo-900">{fire.id}</span>
                      <SeverityBadge severity={fire.prediction?.severity || 'LOW'} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-geo-600">
                      <span className="truncate max-w-[140px]">
                        {fire.prediction?.predicted_class || 'Observation'}
                      </span>
                      <span className="font-mono font-semibold">{fire.frp ? fire.frp.toFixed(1) : 0} MW</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
