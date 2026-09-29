import {
  DashboardStats,
  FireDetection,
  IndustrialSite,
  AlertItem,
  NotificationSubscription,
  SystemHealth,
  SatelliteContext,
  Incident,
  WeatherContext,
  IncidentTrajectory,
  Hotspot,
  RiskExplanation,
  ImpactAnalysis,
  FacilityRiskProfile,
  AnalystReview,
  WhatIfSimulationResult,
  IntelligenceBrief,
  DataQualityReport,
  ModelMonitoring
} from '../types';
import { cachedFetch, getCachedData, invalidateCache } from './cache';

const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Detect local development in browser
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname.endsWith('.local'))
  ) {
    return 'http://127.0.0.1:8000/api';
  }

  // If in Vite dev mode without window (SSR or test)
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000/api';
  }

  // Production fallback: points directly to Render backend
  return 'https://thermoscope-backend-3.onrender.com/api';
};

export const API_BASE = getApiBase();


export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${res.status}: ${errText || res.statusText}`);
  }
  return res.json();
}

export function invalidateAlertsCountCache() {
  invalidateCache('alerts');
}

export function invalidateSubscriptionsCache() {
  invalidateCache('subscriptions');
}

if (typeof window !== 'undefined') {
  window.addEventListener('thermoscope:alerts_updated', () => {
    invalidateCache('alerts');
    invalidateCache('dashboard');
  });
}

export const api = {
  // Direct Cache Access Helpers
  getCached: <T>(key: string, maxAgeMs?: number): T | undefined => {
    return getCachedData<T>(key, maxAgeMs);
  },
  invalidate: (pattern?: string | RegExp) => {
    invalidateCache(pattern);
  },

  // Dashboard
  getDashboardStats: async (forceFresh: boolean = false): Promise<DashboardStats> => {
    return await cachedFetch<DashboardStats>(
      'dashboard_stats',
      async () => {
        try {
          return await fetchJson<DashboardStats>('/dashboard/stats');
        } catch (e) {
          console.warn('Backend unavailable, returning zero baseline stats', e);
          return {
            active_fires_count: 0,
            industrial_fires_count: 0,
            high_risk_count: 0,
            critical_alerts_count: 0,
            active_alerts_count: 0,
            total_detections: 0,
            trend_percentage_24h: 0.0,
            class_distribution: {},
            severity_distribution: {},
            is_live_firms_connected: false
          };
        }
      },
      30000,
      forceFresh
    );
  },

  // Fires
  getActiveFires: async (hours: number = 48, options?: RequestInit, forceFresh: boolean = false): Promise<FireDetection[]> => {
    return await cachedFetch<FireDetection[]>(
      `active_fires_${hours}`,
      async () => {
        try {
          return await fetchJson<FireDetection[]>(`/fires/active?hours=${hours}`, options);
        } catch (e) {
          console.warn('First attempt to fetch active fires failed, retrying once...', e);
          return await fetchJson<FireDetection[]>(`/fires/active?hours=${hours}`, options);
        }
      },
      25000,
      forceFresh
    );
  },

  getFiresKey: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    severity?: string;
    predicted_class?: string;
    min_confidence?: number;
    sensor?: string;
    is_industrial_only?: boolean;
  }) => {
    return `fires_${params.page || 1}_${params.page_size || 15}_${params.search || ''}_${params.severity || ''}_${params.predicted_class || ''}_${params.min_confidence || ''}_${params.sensor || ''}_${params.is_industrial_only ? '1' : '0'}`;
  },

  getFires: async (
    params: {
      page?: number;
      page_size?: number;
      search?: string;
      severity?: string;
      predicted_class?: string;
      min_confidence?: number;
      sensor?: string;
      is_industrial_only?: boolean;
    },
    options?: RequestInit,
    forceFresh: boolean = false
  ): Promise<{ total: number; page: number; page_size: number; items: FireDetection[] }> => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    if (params.search) q.append('search', params.search);
    if (params.severity) q.append('severity', params.severity);
    if (params.predicted_class) q.append('predicted_class', params.predicted_class);
    if (params.min_confidence) q.append('min_confidence', params.min_confidence.toString());
    if (params.sensor) q.append('sensor', params.sensor);
    if (params.is_industrial_only) q.append('is_industrial_only', 'true');

    const cacheKey = api.getFiresKey(params);
    return await cachedFetch(
      cacheKey,
      () => fetchJson<{ total: number; page: number; page_size: number; items: FireDetection[] }>(`/fires?${q.toString()}`, options),
      30000,
      forceFresh
    );
  },

  getFireById: async (id: string, forceFresh: boolean = false): Promise<FireDetection> => {
    return await cachedFetch<FireDetection>(
      `fire_${id}`,
      () => fetchJson<FireDetection>(`/fires/${encodeURIComponent(id)}`),
      60000,
      forceFresh
    );
  },

  getFireSatelliteContext: async (id: string, forceFresh: boolean = false): Promise<SatelliteContext> => {
    return await cachedFetch<SatelliteContext>(
      `fire_sat_${id}`,
      () => fetchJson<SatelliteContext>(`/fires/${encodeURIComponent(id)}/satellite`),
      120000,
      forceFresh
    );
  },

  // Alerts
  getAlertsKey: (params?: { status?: string; severity?: string; limit?: number; page?: number }) => {
    return `alerts_${params?.status || 'ALL'}_${params?.severity || 'ALL'}_${params?.page || 1}_${params?.limit || 50}`;
  },

  getAlerts: async (
    params?: { status?: string; severity?: string; limit?: number; page?: number },
    options?: RequestInit,
    forceFresh: boolean = false
  ): Promise<AlertItem[]> => {
    const cacheKey = api.getAlertsKey(params);
    return await cachedFetch<AlertItem[]>(
      cacheKey,
      async () => {
        const q = new URLSearchParams();
        if (params?.status) q.append('status', params.status);
        if (params?.severity) q.append('severity', params.severity);
        if (params?.limit) q.append('limit', params.limit.toString());
        if (params?.page) q.append('page', params.page.toString());
        return await fetchJson<AlertItem[]>(`/alerts?${q.toString()}`, options);
      },
      20000,
      forceFresh
    );
  },

  getActiveAlertsCount: async (forceFresh: boolean = false): Promise<number> => {
    return await cachedFetch<number>(
      'alerts_count_new',
      async () => {
        try {
          const res = await fetchJson<{ count: number; status?: string }>('/alerts/count?status=NEW');
          return typeof res.count === 'number' ? res.count : 0;
        } catch {
          try {
            const items = await fetchJson<AlertItem[]>('/alerts?status=NEW&limit=200');
            return Array.isArray(items) ? items.length : 0;
          } catch {
            return 0;
          }
        }
      },
      15000,
      forceFresh
    );
  },

  acknowledgeAlert: async (id: string, userName: string = 'Authorized Analyst'): Promise<AlertItem> => {
    invalidateCache('alerts');
    invalidateCache('dashboard');
    return await fetchJson<AlertItem>(`/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ user_name: userName })
    });
  },

  resolveAlert: async (id: string, userName: string = 'Incident Commander', notes: string = 'Resolved'): Promise<AlertItem> => {
    invalidateCache('alerts');
    invalidateCache('dashboard');
    return await fetchJson<AlertItem>(`/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ user_name: userName, notes })
    });
  },

  // Industrial Sites (cached for 5 minutes)
  getIndustrialSites: async (forceFresh: boolean = false): Promise<IndustrialSite[]> => {
    return await cachedFetch<IndustrialSite[]>(
      'industrial_sites',
      () => fetchJson<IndustrialSite[]>('/industrial-sites'),
      300000,
      forceFresh
    );
  },

  // Incidents
  getIncidents: async (params?: { status?: string; limit?: number }, forceFresh: boolean = false): Promise<{ total: number; items: Incident[] }> => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    const cacheKey = `incidents_${params?.status || 'ALL'}_${params?.limit || 50}`;
    return await cachedFetch(
      cacheKey,
      () => fetchJson<{ total: number; items: Incident[] }>(`/incidents?${q.toString()}`),
      30000,
      forceFresh
    );
  },

  getIncidentById: async (id: string, forceFresh: boolean = false): Promise<Incident> => {
    return await cachedFetch(
      `incident_${id}`,
      () => fetchJson<Incident>(`/incidents/${encodeURIComponent(id)}`),
      60000,
      forceFresh
    );
  },

  getIncidentTimeline: async (id: string): Promise<any[]> => {
    return await cachedFetch(
      `incident_timeline_${id}`,
      () => fetchJson<any[]>(`/incidents/${encodeURIComponent(id)}/timeline`),
      60000
    );
  },

  getIncidentMovement: async (id: string): Promise<IncidentTrajectory> => {
    return await cachedFetch(
      `incident_movement_${id}`,
      () => fetchJson<IncidentTrajectory>(`/incidents/${encodeURIComponent(id)}/movement`),
      60000
    );
  },

  getIncidentImpact: async (id: string): Promise<ImpactAnalysis> => {
    return await cachedFetch(
      `incident_impact_${id}`,
      () => fetchJson<ImpactAnalysis>(`/incidents/${encodeURIComponent(id)}/impact`),
      60000
    );
  },

  getIncidentReplay: async (id: string): Promise<{ incident_id: string; total_steps: number; steps: any[] }> => {
    return await cachedFetch(
      `incident_replay_${id}`,
      () => fetchJson<{ incident_id: string; total_steps: number; steps: any[] }>(`/incidents/${encodeURIComponent(id)}/replay`),
      60000
    );
  },

  updateIncidentStatus: async (id: string, status: string, notes?: string): Promise<Incident> => {
    invalidateCache('incidents');
    return await fetchJson<Incident>(`/incidents/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  },

  assignIncident: async (id: string, assignedTo: string): Promise<Incident> => {
    invalidateCache('incidents');
    return await fetchJson<Incident>(`/incidents/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to: assignedTo })
    });
  },

  // Hotspots
  getHotspots: async (windowDays: number = 30, limit: number = 50, forceFresh: boolean = false): Promise<{ count: number; window_days: number; items: Hotspot[] }> => {
    return await cachedFetch(
      `hotspots_list_${windowDays}_${limit}`,
      async () => {
        const res = await fetchJson<any>(`/hotspots?window_days=${windowDays}&limit=${limit}`);
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        return {
          count: res?.count ?? items.length,
          window_days: res?.window_days ?? windowDays,
          items
        };
      },
      60000,
      forceFresh
    );
  },

  getHotspotRankings: async (windowDays: number = 30, forceFresh: boolean = false): Promise<{ count: number; window_days: number; rankings: Hotspot[]; data: Hotspot[] }> => {
    return await cachedFetch(
      `hotspots_rankings_${windowDays}`,
      async () => {
        const res = await fetchJson<any>(`/hotspots/rankings?window_days=${windowDays}`);
        const rankings = Array.isArray(res) ? res : (res?.rankings || res?.data || []);
        return {
          count: res?.count ?? rankings.length,
          window_days: res?.window_days ?? windowDays,
          rankings,
          data: rankings
        };
      },
      60000,
      forceFresh
    );
  },

  // Analytics Trends, Regions, Anomalies, Heatmap
  getHistoricalTrends: async (horizon: '24h' | '7d' | '30d' | '90d' = '30d', forceFresh: boolean = false): Promise<{ horizon: string; data: any[]; time_series: any[] }> => {
    return await cachedFetch(
      `trends_${horizon}`,
      async () => {
        const res = await fetchJson<any>(`/analytics/trends?horizon=${horizon}`);
        const data = res?.data || res?.time_series || (Array.isArray(res) ? res : []);
        return {
          horizon: res?.horizon || horizon,
          data,
          time_series: data
        };
      },
      60000,
      forceFresh
    );
  },

  getRegionalAnalytics: async (days: number = 30, forceFresh: boolean = false): Promise<{ regions: any[]; total_monitored_regions: number }> => {
    return await cachedFetch(
      `regional_analytics_${days}`,
      async () => {
        const res = await fetchJson<any>(`/analytics/regions?days=${days}`);
        const regions = Array.isArray(res) ? res : (res?.regions || []);
        return {
          regions,
          total_monitored_regions: res?.total_monitored_regions ?? regions.length
        };
      },
      60000,
      forceFresh
    );
  },

  getAnomalies: async (days: number = 7, forceFresh: boolean = false): Promise<{ count: number; anomalies: any[] }> => {
    return await cachedFetch(
      `anomalies_${days}`,
      async () => {
        const res = await fetchJson<any>(`/analytics/anomalies?days=${days}`);
        const anomalies = Array.isArray(res) ? res : (res?.anomalies || []);
        return {
          count: res?.count ?? anomalies.length,
          anomalies
        };
      },
      60000,
      forceFresh
    );
  },

  getRiskHeatmapPoints: async (days: number = 7, minRisk: number = 30, forceFresh: boolean = false): Promise<{ count: number; points: { latitude: number; longitude: number; intensity: number; risk_score: number; fire_id: string }[] }> => {
    return await cachedFetch(
      `risk_heatmap_${days}_${minRisk}`,
      () => fetchJson<{ count: number; points: { latitude: number; longitude: number; intensity: number; risk_score: number; fire_id: string }[] }>(`/analytics/risk-heatmap?days=${days}&min_risk=${minRisk}`),
      60000,
      forceFresh
    );
  },

  // Fire Deep-Dive Extensions
  getFireWeather: async (id: string): Promise<WeatherContext> => {
    return await cachedFetch(`fire_weather_${id}`, () => fetchJson<WeatherContext>(`/fires/${encodeURIComponent(id)}/weather`), 120000);
  },

  getFireExplanation: async (id: string): Promise<RiskExplanation> => {
    return await cachedFetch(`fire_expl_${id}`, () => fetchJson<RiskExplanation>(`/fires/${encodeURIComponent(id)}/explanation`), 120000);
  },

  getFireEvidence: async (id: string): Promise<any> => {
    return await cachedFetch(`fire_ev_${id}`, () => fetchJson<any>(`/fires/${encodeURIComponent(id)}/evidence`), 120000);
  },

  getFireImpact: async (id: string): Promise<ImpactAnalysis> => {
    return await cachedFetch(`fire_impact_${id}`, () => fetchJson<ImpactAnalysis>(`/fires/${encodeURIComponent(id)}/impact`), 120000);
  },

  getFireMovement: async (id: string): Promise<IncidentTrajectory> => {
    return await cachedFetch(`fire_move_${id}`, () => fetchJson<IncidentTrajectory>(`/fires/${encodeURIComponent(id)}/movement`), 120000);
  },

  getSimilarFires: async (id: string, limit: number = 5): Promise<{ fire_id: string; count: number; similar_fires: any[] }> => {
    return await cachedFetch(`fire_sim_${id}_${limit}`, () => fetchJson<{ fire_id: string; count: number; similar_fires: any[] }>(`/fires/${encodeURIComponent(id)}/similar?limit=${limit}`), 120000);
  },

  submitAnalystReview: async (id: string, review: { decision: string; corrected_class?: string; analyst_id: string; analyst_name: string; notes?: string }): Promise<AnalystReview> => {
    invalidateCache('model_monitoring');
    invalidateCache(`fire_reviews_${id}`);
    return await fetchJson<AnalystReview>(`/fires/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify(review)
    });
  },

  getFireReviews: async (id: string): Promise<AnalystReview[]> => {
    return await cachedFetch(`fire_reviews_${id}`, () => fetchJson<AnalystReview[]>(`/fires/${encodeURIComponent(id)}/reviews`), 30000);
  },

  simulateRisk: async (id: string, params: { frp_multiplier?: number; additional_detections_count?: number; persistence_multiplier?: number; wind_speed_kmh?: number; distance_to_industrial_km?: number }): Promise<WhatIfSimulationResult> => {
    return await fetchJson<WhatIfSimulationResult>(`/fires/${encodeURIComponent(id)}/simulate-risk`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Facility Profiles
  getIndustrialSiteById: async (id: string): Promise<IndustrialSite> => {
    return await cachedFetch(`ind_site_${id}`, () => fetchJson<IndustrialSite>(`/industrial-sites/${encodeURIComponent(id)}`), 300000);
  },

  getFacilityRiskProfile: async (id: string): Promise<FacilityRiskProfile> => {
    return await cachedFetch(`fac_profile_${id}`, () => fetchJson<FacilityRiskProfile>(`/industrial-sites/${encodeURIComponent(id)}/profile`), 60000);
  },

  // Watchlist
  getWatchlist: async (userId: string = 'analyst-1'): Promise<any[]> => {
    return await cachedFetch(`watchlist_${userId}`, () => fetchJson<any[]>(`/watchlist?user_id=${encodeURIComponent(userId)}`), 30000);
  },

  addToWatchlist: async (facilityId: string, facilityName: string, userId: string = 'analyst-1', reason: string = 'Monitored Critical Asset'): Promise<any> => {
    invalidateCache('watchlist');
    return await fetchJson<any>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ facility_id: facilityId, facility_name: facilityName, user_id: userId, reason })
    });
  },

  removeFromWatchlist: async (facilityId: string, userId: string = 'analyst-1'): Promise<any> => {
    invalidateCache('watchlist');
    return await fetchJson<any>(`/watchlist/${encodeURIComponent(facilityId)}?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  },

  // Global Search
  globalSearch: async (query: string, limit: number = 8): Promise<{ query: string; total_matches: number; results: any }> => {
    return await cachedFetch(`search_${query}_${limit}`, () => fetchJson<{ query: string; total_matches: number; results: any }>(`/search?q=${encodeURIComponent(query)}&limit=${limit}`), 20000);
  },

  // Dashboard Intelligence Brief
  getIntelligenceBrief: async (forceFresh: boolean = false): Promise<IntelligenceBrief> => {
    return await cachedFetch<IntelligenceBrief>(
      'intel_brief',
      () => fetchJson<IntelligenceBrief>('/dashboard/intelligence-brief'),
      30000,
      forceFresh
    );
  },

  // System Quality & Monitoring
  getDataQualityReport: async (forceFresh: boolean = false): Promise<DataQualityReport> => {
    return await cachedFetch<DataQualityReport>(
      'data_quality_report',
      () => fetchJson<DataQualityReport>('/system/data-quality'),
      30000,
      forceFresh
    );
  },

  getModelMonitoring: async (forceFresh: boolean = false): Promise<ModelMonitoring> => {
    return await cachedFetch<ModelMonitoring>(
      'model_monitoring',
      () => fetchJson<ModelMonitoring>('/admin/model-monitoring'),
      30000,
      forceFresh
    );
  },

  exportFeedbackDataset: async (format: 'json' | 'csv' = 'json'): Promise<any> => {
    if (format === 'csv') {
      const res = await fetch(`${API_BASE}/admin/feedback-dataset?format=csv`);
      return await res.text();
    }
    return await fetchJson<any>('/admin/feedback-dataset?format=json');
  },

  // Subscriptions
  getSubscriptions: async (userEmail?: string, forceFresh: boolean = false): Promise<NotificationSubscription[]> => {
    const email = userEmail || 'resident@thermoscope.local';
    return await cachedFetch<NotificationSubscription[]>(
      `subscriptions_${email}`,
      () => fetchJson<NotificationSubscription[]>(`/subscriptions${userEmail ? `?user_email=${encodeURIComponent(userEmail)}` : ''}`),
      30000,
      forceFresh
    );
  },

  createSubscription: async (sub: {
    user_email: string;
    area_name: string;
    latitude: number;
    longitude: number;
    radius_km: number;
    email_enabled: boolean;
    browser_enabled: boolean;
    sms_enabled: boolean;
  }): Promise<NotificationSubscription> => {
    invalidateCache('subscriptions');
    return await fetchJson<NotificationSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(sub)
    });
  },

  deleteSubscription: async (id: number): Promise<{ message: string }> => {
    invalidateCache('subscriptions');
    return await fetchJson<{ message: string }>(`/subscriptions/${id}`, {
      method: 'DELETE'
    });
  },

  // System & Health
  getSystemHealth: async (forceFresh: boolean = false): Promise<SystemHealth> => {
    return await cachedFetch<SystemHealth>(
      'system_health',
      () => fetchJson<SystemHealth>('/system/health'),
      20000,
      forceFresh
    );
  },

  getFirmsStatus: async (forceFresh: boolean = false): Promise<any> => {
    return await cachedFetch(
      'firms_status',
      () => fetchJson<any>('/system/firms-status'),
      20000,
      forceFresh
    );
  },

  getSyncLogs: async (limit: number = 15, forceFresh: boolean = false): Promise<any[]> => {
    return await cachedFetch(
      `sync_logs_${limit}`,
      () => fetchJson<any[]>(`/system/sync-logs?limit=${limit}`),
      15000,
      forceFresh
    );
  },

  triggerManualSync: async (): Promise<any> => {
    invalidateCache();
    return await fetchJson<any>('/admin/sync', {
      method: 'POST'
    });
  }
};
