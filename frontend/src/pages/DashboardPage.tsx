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
  Filter
} from 'lucide-react';
import { FireDetection, IndustrialSite, DashboardStats } from '../types';
import { api } from '../services/api';
import { FireMap } from '../components/map/FireMap';
import { SeverityBadge, ClassBadge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fires, setFires] = useState<FireDetection[]>([]);
  const [industrialSites, setIndustrialSites] = useState<IndustrialSite[]>([]);
  const [selectedFire, setSelectedFire] = useState<FireDetection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsData, firesData, sitesData] = await Promise.all([
        api.getDashboardStats(),
        api.getActiveFires(48),
        api.getIndustrialSites()
      ]);
      setStats(statsData);
      setFires(firesData);
      setIndustrialSites(sitesData);
      if (firesData.length > 0 && !selectedFire) {
        setSelectedFire(firesData[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 60s live poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
              GIS Live Monitoring Console
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-sm text-geo-500 mt-1">
            Real-time orbital thermal anomaly telemetry from NASA FIRMS with OpenStreetMap spatial context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
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
              +{stats?.trend_percentage_24h ?? 12}% 24h
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

        {/* Card 4: Critical Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-geo-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-geo-500 uppercase tracking-wider">Operational Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-geo-900 font-mono">
              {stats?.critical_alerts_count ?? 0}
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
            onSelectFire={(f) => setSelectedFire(f)}
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
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
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
