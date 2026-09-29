import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Layers,
  Factory,
  CheckCircle2,
  Calendar,
  Flame,
  AlertTriangle,
  Globe,
  Sliders,
  ChevronRight,
  RefreshCw,
  History
} from 'lucide-react';
import { DashboardStats, Hotspot } from '../types';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  // Synchronous cache-first initialization to eliminate loading flash on page re-visits
  const [stats, setStats] = useState<DashboardStats | null>(() => api.getCached<DashboardStats>('dashboard_stats') || null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Feature Expansion States: Trends
  const [horizon, setHorizon] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [trendData, setTrendData] = useState<any[]>(() => api.getCached<any>('trends_30d')?.data || []);
  const [trendLoading, setTrendLoading] = useState<boolean>(() => !api.getCached('trends_30d'));
  const [trendError, setTrendError] = useState<boolean>(false);

  // Persistent Hotspots
  const [hotspotWindow, setHotspotWindow] = useState<number>(30);
  const [hotspotRankings, setHotspotRankings] = useState<Hotspot[]>(() => api.getCached<any>('hotspots_rankings_30')?.rankings || []);
  const [hotspotsLoading, setHotspotsLoading] = useState<boolean>(() => !api.getCached('hotspots_rankings_30'));
  const [hotspotsError, setHotspotsError] = useState<boolean>(false);

  // Regional Analytics
  const [regionalData, setRegionalData] = useState<any[]>(() => api.getCached<any>('regional_analytics_30')?.regions || []);
  const [regionalLoading, setRegionalLoading] = useState<boolean>(() => !api.getCached('regional_analytics_30'));
  const [regionalError, setRegionalError] = useState<boolean>(false);

  // Facility Anomalies
  const [anomalies, setAnomalies] = useState<any[]>(() => api.getCached<any>('anomalies_7')?.anomalies || []);
  const [anomaliesLoading, setAnomaliesLoading] = useState<boolean>(() => !api.getCached('anomalies_7'));
  const [anomaliesError, setAnomaliesError] = useState<boolean>(false);

  // 1. Initial baseline fetch (Stats, Regions, Anomalies) on mount
  useEffect(() => {
    let isMounted = true;

    if (!stats) {
      api.getDashboardStats().then((data) => {
        if (isMounted) setStats(data);
      }).catch(() => null);
    }

    if (regionalData.length === 0) {
      setRegionalLoading(true);
      api.getRegionalAnalytics(30)
        .then((res) => {
          if (isMounted) {
            setRegionalData(res.regions || []);
            setRegionalError(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load regional analytics:', err);
          if (isMounted) setRegionalError(true);
        })
        .finally(() => {
          if (isMounted) setRegionalLoading(false);
        });
    }

    if (anomalies.length === 0) {
      setAnomaliesLoading(true);
      api.getAnomalies(7)
        .then((res) => {
          if (isMounted) {
            setAnomalies(res.anomalies || []);
            setAnomaliesError(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load facility anomalies:', err);
          if (isMounted) setAnomaliesError(true);
        })
        .finally(() => {
          if (isMounted) setAnomaliesLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dedicated Trend Fetch: Only fires when horizon changes
  useEffect(() => {
    let isMounted = true;
    const cached = api.getCached<any>(`trends_${horizon}`);
    if (cached?.data) {
      setTrendData(cached.data);
      setTrendLoading(false);
      setTrendError(false);
      return;
    }

    setTrendLoading(true);
    setTrendError(false);
    api.getHistoricalTrends(horizon)
      .then((res) => {
        if (isMounted) {
          setTrendData(res.data || []);
          setTrendError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load trends:', err);
        if (isMounted) setTrendError(true);
      })
      .finally(() => {
        if (isMounted) setTrendLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [horizon]);

  // 3. Dedicated Hotspot Fetch: Only fires when hotspotWindow changes
  useEffect(() => {
    let isMounted = true;
    const cached = api.getCached<any>(`hotspots_rankings_${hotspotWindow}`);
    if (cached?.rankings) {
      setHotspotRankings(cached.rankings);
      setHotspotsLoading(false);
      setHotspotsError(false);
      return;
    }

    setHotspotsLoading(true);
    setHotspotsError(false);
    api.getHotspotRankings(hotspotWindow)
      .then((res) => {
        if (isMounted) {
          setHotspotRankings(res.rankings || []);
          setHotspotsError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load hotspot rankings:', err);
        if (isMounted) setHotspotsError(true);
      })
      .finally(() => {
        if (isMounted) setHotspotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hotspotWindow]);

  // Explicit full refresh action
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const [statsRes, trendsRes, hotspotsRes, regionalRes, anomaliesRes] = await Promise.allSettled([
        api.getDashboardStats(true),
        api.getHistoricalTrends(horizon, true),
        api.getHotspotRankings(hotspotWindow, true),
        api.getRegionalAnalytics(30, true),
        api.getAnomalies(7, true)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value);
      if (trendsRes.status === 'fulfilled' && trendsRes.value) {
        setTrendData(trendsRes.value.data || []);
        setTrendError(false);
      }
      if (hotspotsRes.status === 'fulfilled' && hotspotsRes.value) {
        setHotspotRankings(hotspotsRes.value.rankings || []);
        setHotspotsError(false);
      }
      if (regionalRes.status === 'fulfilled' && regionalRes.value) {
        setRegionalData(regionalRes.value.regions || []);
        setRegionalError(false);
      }
      if (anomaliesRes.status === 'fulfilled' && anomaliesRes.value) {
        setAnomalies(anomaliesRes.value.anomalies || []);
        setAnomaliesError(false);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const classDist = stats?.class_distribution || {};

  const severityDist = stats?.severity_distribution || {};

  const totalEvents = stats?.total_detections ?? Object.values(classDist).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header with Horizon Control and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
            Thermal Intelligence & Historical Analytics
          </h1>
          <p className="text-sm text-geo-500 mt-1">
            Aggregated patterns, classification distributions, and longitudinal industrial thermal recurrence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Horizon Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-geo-200 rounded-2xl shadow-subtle text-xs font-bold text-geo-600">
            {(['24h', '7d', '30d', '90d'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  horizon === h ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-50 text-geo-700'
                }`}
              >
                {h.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-geo-300 bg-white text-geo-700 hover:bg-geo-50 font-semibold text-xs shadow-subtle transition-colors"
            title="Refresh Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Original Visual Distribution Cards at Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: AI Classification Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-geo-900">Thermal Source Classification</h3>
                <p className="text-xs text-geo-500">Breakdown of AI identified categories</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-geo-700">{totalEvents} Total Events</span>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'Industrial Fire', color: 'bg-red-600', count: classDist['Industrial Fire'] || 0 },
              { name: 'Gas Flare / Persistent Thermal Source', color: 'bg-amber-500', count: (classDist['Gas Flare / Persistent Thermal Source'] || classDist['Gas Flare'] || 0) },
              { name: 'Mining / Industrial Thermal Activity', color: 'bg-purple-600', count: (classDist['Mining / Industrial Thermal Activity'] || classDist['Mining'] || 0) },
              { name: 'Wildfire / Natural Fire', color: 'bg-emerald-600', count: (classDist['Wildfire / Natural Fire'] || classDist['Wildfire'] || 0) },
              { name: 'Agricultural Burn', color: 'bg-lime-500', count: (classDist['Agricultural Burn'] || classDist['Agricultural'] || 0) },
              { name: 'Other / Uncertain', color: 'bg-blue-600', count: (classDist['Other / Uncertain'] || classDist['Other'] || classDist['Uncertain'] || 0) },
            ].map((cat) => {
              const pct = totalEvents > 0 ? Math.round((cat.count / totalEvents) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-geo-900">{cat.name}</span>
                    <span className="font-mono text-geo-600">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-geo-100 overflow-hidden">
                    {pct > 0 && (
                      <div className={`h-full ${cat.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Severity Risk Tiering */}
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-geo-900">Severity Risk Tiering</h3>
                <p className="text-xs text-geo-500">Distribution across operational response levels</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-red-600">Urgent: {severityDist['CRITICAL'] || 0}</span>
          </div>

          <div className="space-y-4 text-xs">
            {[
              { tier: 'CRITICAL', label: 'Immediate Industrial Emergency (<1 km buffer)', color: 'bg-red-500', count: severityDist['CRITICAL'] || 0 },
              { tier: 'HIGH', label: 'Elevated Anomaly Near Infrastructure (<2 km buffer)', color: 'bg-orange-500', count: severityDist['HIGH'] || 0 },
              { tier: 'MEDIUM', label: 'Routine Industrial Flaring / Secondary Heat Source', color: 'bg-amber-500', count: severityDist['MEDIUM'] || 0 },
              { tier: 'LOW', label: 'Background Thermal Radiance / Agricultural Burn', color: 'bg-emerald-500', count: severityDist['LOW'] || 0 },
            ].map((item) => {
              const pct = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100) : 0;
              return (
                <div key={item.tier} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-geo-900">{item.tier}</span>
                    <span className="font-mono text-geo-600">{item.count} detections</span>
                  </div>
                  <p className="text-[11px] text-geo-500">{item.label}</p>
                  <div className="w-full h-1.5 rounded-full bg-geo-100 overflow-hidden">
                    {pct > 0 && (
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Longitudinal Trends Bar Chart */}
      <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-geo-900">Longitudinal Activity Trend ({horizon.toUpperCase()})</h3>
              <p className="text-xs text-geo-500">Historical detection volume and average radiative power over time</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-geo-700">
            {trendLoading ? 'Loading activity...' : `${trendData.length} Temporal Buckets`}
          </span>
        </div>

        {trendLoading ? (
          <div className="p-8 text-center text-xs text-geo-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
            <span>Loading historical activity...</span>
          </div>
        ) : trendError ? (
          <div className="p-8 text-center text-xs text-red-500">
            Unable to load historical trends.
          </div>
        ) : trendData.length > 0 ? (
          <div className="space-y-2">
            {(() => {
              const maxCount = Math.max(...trendData.map(b => (b.count || b.fire_count || 1)), 1);
              const midCount = Math.round(maxCount / 2);
              return (
                <div className="relative pt-6 pb-2">
                  {/* Background Grid Lines & Scale */}
                  <div className="absolute inset-x-0 top-6 h-36 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-geo-400 z-0">
                    <div className="border-b border-dashed border-geo-200 flex justify-between pr-2">
                      <span>{maxCount}</span>
                      <span className="text-[9px]">Peak Volume</span>
                    </div>
                    <div className="border-b border-dashed border-geo-200/60 flex justify-between pr-2">
                      <span>{midCount}</span>
                    </div>
                    <div className="border-b border-geo-200 flex justify-between pr-2">
                      <span>0</span>
                      <span className="text-[9px]">Baseline</span>
                    </div>
                  </div>

                  {/* Columns */}
                  <div className="h-36 flex items-end justify-around gap-2 px-6 relative z-10">
                    {trendData.map((bucket, idx) => {
                      const countVal = bucket.count ?? bucket.fire_count ?? 0;
                      const heightPct = Math.max(8, Math.round((countVal / maxCount) * 100));
                      const bucketDate = bucket.bucket || bucket.date || `T-${idx}`;
                      const formattedDate = bucketDate.includes('T') ? bucketDate.split('T')[0] : bucketDate;
                      return (
                        <div key={idx} className="flex-1 max-w-[72px] h-full flex flex-col justify-end items-center group relative">
                          {/* Visible Bar with minimum height */}
                          <div
                            className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 transition-all duration-200 shadow-sm group-hover:shadow-md cursor-pointer"
                            style={{ height: `${heightPct}%`, minHeight: '12px' }}
                          />

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-2.5 bg-geo-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none z-30 whitespace-nowrap space-y-0.5">
                            <span className="font-bold text-amber-300">{formattedDate}</span>
                            <span className="font-mono">Detections: <strong>{countVal}</strong></span>
                            <span className="font-mono text-geo-300">Avg FRP: {(bucket.avg_frp ?? 0).toFixed(1)} MW</span>
                            {bucket.max_frp && <span className="font-mono text-geo-300">Max FRP: {bucket.max_frp.toFixed(1)} MW</span>}
                            {bucket.critical_count > 0 && <span className="text-red-400 font-bold">Critical: {bucket.critical_count}</span>}
                          </div>

                          {/* Date Label */}
                          <span className="text-[10px] font-mono text-geo-600 mt-2 truncate max-w-full text-center font-medium">
                            {formattedDate.length > 5 ? formattedDate.slice(5) : formattedDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-geo-400">
            No historical data available for this period.
          </div>
        )}
      </div>

      {/* Persistent Hotspots Ranking Table */}
      <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-geo-900">Persistent Hotspot Engine & Ranking</h3>
              <p className="text-xs text-geo-500">Dynamically calculated spatial clustering of recurring high-heat sources</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-geo-500 font-medium">Window:</span>
            <button
              onClick={() => setHotspotWindow(30)}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                hotspotWindow === 30 ? 'bg-amber-500 text-white' : 'bg-geo-100 text-geo-700 hover:bg-geo-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setHotspotWindow(90)}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                hotspotWindow === 90 ? 'bg-amber-500 text-white' : 'bg-geo-100 text-geo-700 hover:bg-geo-200'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-geo-200">
          <table className="w-full text-left text-xs divide-y divide-geo-200">
            <thead className="bg-geo-50 font-bold text-geo-700">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Hotspot ID / Centroid</th>
                <th className="p-3">Detections</th>
                <th className="p-3">Active Days</th>
                <th className="p-3">Avg FRP</th>
                <th className="p-3">Max FRP</th>
                <th className="p-3">Persistence</th>
                <th className="p-3">Dominant Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geo-100 bg-white">
              {hotspotsLoading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-geo-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Analyzing persistent hotspots...</span>
                  </td>
                </tr>
              ) : hotspotsError ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-red-500">
                    Unable to load persistent hotspot data.
                  </td>
                </tr>
              ) : hotspotRankings.length > 0 ? (
                hotspotRankings.map((hs, idx) => (
                  <tr key={hs.hotspot_id || idx} className="hover:bg-geo-50/50">
                    <td className="p-3 font-mono font-bold text-amber-600">#{hs.rank || idx + 1}</td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-geo-900">{hs.hotspot_id}</div>
                      <div className="text-[10px] text-geo-500">
                        {hs.center_latitude.toFixed(3)}&deg;N, {hs.center_longitude.toFixed(3)}&deg;E
                        {hs.nearby_facility && ` &bull; Near ${hs.nearby_facility}`}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-geo-900">{hs.detection_count}</td>
                    <td className="p-3 font-mono text-geo-700">{hs.active_days}d / {hs.window_days}d</td>
                    <td className="p-3 font-mono text-geo-700">{(hs.average_frp ?? 0).toFixed(1)} MW</td>
                    <td className="p-3 font-mono font-bold text-red-600">{(hs.max_frp ?? 0).toFixed(1)} MW</td>
                    <td className="p-3 font-mono font-bold text-amber-600">
                      {((hs.persistence_score ?? 0) * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-[11px] text-geo-700 font-medium">{hs.dominant_class}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-geo-400">
                    No persistent hotspots found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Analytics Breakdown */}
      <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-geo-900">Regional Analytics (Major Industrial Belts)</h3>
            <p className="text-xs text-geo-500">Geographic aggregation of thermal detections across industrial economic corridors</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-geo-200">
          <table className="w-full text-left text-xs divide-y divide-geo-200">
            <thead className="bg-geo-50 font-bold text-geo-700">
              <tr>
                <th className="p-3">Corridor / State</th>
                <th className="p-3">Active Incidents</th>
                <th className="p-3">Detections (30d)</th>
                <th className="p-3">Avg FRP</th>
                <th className="p-3">Critical Events</th>
                <th className="p-3">Anomalies</th>
                <th className="p-3">Exposure Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geo-100 bg-white">
              {regionalLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-geo-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Analyzing regional fire activity...</span>
                  </td>
                </tr>
              ) : regionalError ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-red-500">
                    Unable to load regional analytics.
                  </td>
                </tr>
              ) : regionalData.length > 0 ? (
                regionalData.map((reg, idx) => (
                  <tr key={idx} className="hover:bg-geo-50/50">
                    <td className="p-3 font-bold text-geo-900">{reg.region_name || reg.region}</td>
                    <td className="p-3 font-mono font-bold text-geo-800">{reg.active_incidents ?? 0}</td>
                    <td className="p-3 font-mono text-geo-700">{reg.detection_count ?? reg.total_detections ?? 0}</td>
                    <td className="p-3 font-mono text-geo-700">{(reg.avg_frp ?? reg.average_frp ?? 0).toFixed(1)} MW</td>
                    <td className="p-3 font-mono font-bold text-red-600">{reg.critical_incidents ?? reg.critical_events ?? 0}</td>
                    <td className="p-3 font-mono text-amber-600">{reg.anomaly_count ?? 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        reg.exposure_tier === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        reg.exposure_tier === 'ELEVATED' ? 'bg-amber-100 text-amber-800' :
                        'bg-geo-100 text-geo-700'
                      }`}>
                        {reg.exposure_tier || 'STANDARD'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-geo-400">
                    No regional data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Facility Anomalies Feed */}
      <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-geo-900">Active Facility-Level Anomalies</h3>
            <p className="text-xs text-geo-500">Fires exceeding historical baseline behavior for monitored facilities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {anomaliesLoading ? (
            <div className="col-span-2 p-6 text-center text-geo-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-500" />
              <span>Checking recent facility activity...</span>
            </div>
          ) : anomaliesError ? (
            <div className="col-span-2 p-6 text-center text-red-500 text-xs">
              Unable to load facility anomalies at this time.
            </div>
          ) : anomalies.length > 0 ? (
            anomalies.map((anom, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-geo-900">{anom.facility_name || anom.anomaly_type}</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                    {anom.anomaly_magnitude ? `${anom.anomaly_magnitude.toFixed(1)}x Baseline` : 'ANOMALY'}
                  </span>
                </div>
                <p className="text-geo-600 text-[11px] leading-relaxed">{anom.description}</p>
                <div className="flex justify-between items-center text-[10px] text-geo-500 pt-1 border-t border-geo-200/60">
                  <span>Category: {anom.anomaly_type?.replace('_', ' ')}</span>
                  <span>{anom.detected_at ? new Date(anom.detected_at).toLocaleString() : 'Recent'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-6 text-center text-geo-400">
              No acute facility baseline anomalies detected in the rolling 7-day window.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
