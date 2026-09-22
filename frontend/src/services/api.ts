import {
  DashboardStats,
  FireDetection,
  IndustrialSite,
  AlertItem,
  NotificationSubscription,
  SystemHealth,
  SatelliteContext
} from '../types';

const API_BASE = '/api';

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

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      return await fetchJson<DashboardStats>('/dashboard/stats');
    } catch (e) {
      console.warn('Backend unavailable, using fallback stats', e);
      return {
        active_fires_count: 5,
        industrial_fires_count: 4,
        high_risk_count: 3,
        critical_alerts_count: 1,
        total_detections: 5,
        trend_percentage_24h: 12.0,
        class_distribution: {
          'Industrial Fire': 2,
          'Gas Flare / Persistent Thermal Source': 2,
          'Wildfire / Natural Fire': 1
        },
        severity_distribution: {
          'CRITICAL': 1,
          'HIGH': 2,
          'MEDIUM': 1,
          'LOW': 1
        },
        is_live_firms_connected: false
      };
    }
  },

  // Fires
  getActiveFires: async (hours: number = 48): Promise<FireDetection[]> => {
    try {
      return await fetchJson<FireDetection[]>(`/fires/active?hours=${hours}`);
    } catch (e) {
      console.warn('Using offline fire sample', e);
      return [];
    }
  },

  getFires: async (params: {
    page?: number;
    page_size?: number;
    severity?: string;
    predicted_class?: string;
    min_confidence?: number;
    sensor?: string;
    is_industrial_only?: boolean;
  }): Promise<{ total: number; page: number; page_size: number; items: FireDetection[] }> => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    if (params.severity) q.append('severity', params.severity);
    if (params.predicted_class) q.append('predicted_class', params.predicted_class);
    if (params.min_confidence) q.append('min_confidence', params.min_confidence.toString());
    if (params.sensor) q.append('sensor', params.sensor);
    if (params.is_industrial_only) q.append('is_industrial_only', 'true');

    return await fetchJson<{ total: number; page: number; page_size: number; items: FireDetection[] }>(`/fires?${q.toString()}`);
  },

  getFireById: async (id: string): Promise<FireDetection> => {
    return await fetchJson<FireDetection>(`/fires/${encodeURIComponent(id)}`);
  },

  getFireSatelliteContext: async (id: string): Promise<SatelliteContext> => {
    return await fetchJson<SatelliteContext>(`/fires/${encodeURIComponent(id)}/satellite`);
  },

  // Alerts
  getAlerts: async (params?: { status?: string; severity?: string; limit?: number }): Promise<AlertItem[]> => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.limit) q.append('limit', params.limit.toString());
    return await fetchJson<AlertItem[]>(`/alerts?${q.toString()}`);
  },

  acknowledgeAlert: async (id: string, userName: string = 'Authorized Analyst'): Promise<AlertItem> => {
    return await fetchJson<AlertItem>(`/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ user_name: userName })
    });
  },

  resolveAlert: async (id: string, userName: string = 'Incident Commander', notes: string = 'Resolved'): Promise<AlertItem> => {
    return await fetchJson<AlertItem>(`/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ user_name: userName, notes })
    });
  },

  // Industrial Sites
  getIndustrialSites: async (): Promise<IndustrialSite[]> => {
    return await fetchJson<IndustrialSite[]>('/industrial-sites');
  },

  // Subscriptions
  getSubscriptions: async (userEmail?: string): Promise<NotificationSubscription[]> => {
    const q = userEmail ? `?user_email=${encodeURIComponent(userEmail)}` : '';
    return await fetchJson<NotificationSubscription[]>(`/subscriptions${q}`);
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
    return await fetchJson<NotificationSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(sub)
    });
  },

  deleteSubscription: async (id: number): Promise<{ message: string }> => {
    return await fetchJson<{ message: string }>(`/subscriptions/${id}`, {
      method: 'DELETE'
    });
  },

  // System & Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    return await fetchJson<SystemHealth>('/system/health');
  },

  getFirmsStatus: async (): Promise<any> => {
    return await fetchJson<any>('/system/firms-status');
  },

  getSyncLogs: async (): Promise<any[]> => {
    return await fetchJson<any[]>('/system/sync-logs');
  },

  triggerManualSync: async (): Promise<any> => {
    return await fetchJson<any>('/admin/sync', {
      method: 'POST'
    });
  }
};
