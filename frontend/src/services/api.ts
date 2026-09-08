import {
  ThermalAnomaly, IndustrialAsset, Alert, AnomalyIntelligence,
  SystemHealth, AnalyticsSummary
} from '../types';

const API_BASE = '/api';

export const api = {
  // Anomalies
  async getAnomalies(params?: { classification?: string; severity?: string; min_frp?: number; source?: string }): Promise<ThermalAnomaly[]> {
    const query = new URLSearchParams();
    if (params?.classification) query.append('classification', params.classification);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.min_frp) query.append('min_frp', params.min_frp.toString());
    if (params?.source) query.append('source', params.source);
    
    const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  async getAnomaliesGeoJSON(): Promise<any> {
    const res = await fetch(`${API_BASE}/anomalies/geojson`);
    if (!res.ok) throw new Error('Failed to fetch GeoJSON');
    return res.json();
  },

  async getAnomalyIntelligence(id: number): Promise<AnomalyIntelligence> {
    const res = await fetch(`${API_BASE}/anomalies/${id}/intelligence`);
    if (!res.ok) throw new Error(`Failed to fetch intelligence for anomaly ${id}`);
    return res.json();
  },

  // Assets
  async getAssets(): Promise<IndustrialAsset[]> {
    const res = await fetch(`${API_BASE}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async getAssetDetails(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/assets/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch asset ${id}`);
    return res.json();
  },

  // Alerts
  async getAlerts(params?: { severity?: string; status?: string }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(id: number, userName: string = 'Analyst Demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName })
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async assignAlert(id: number, assignedTo: string, userName: string = 'Analyst Demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: assignedTo, user_name: userName })
    });
    if (!res.ok) throw new Error('Failed to assign alert');
    return res.json();
  },

  async resolveAlert(id: number, userName: string = 'Analyst Demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: userName })
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // Investigations
  async updateInvestigation(id: number, data: { status?: string; assigned_analyst?: string; recommendation?: string; author?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update investigation');
    return res.json();
  },

  async addInvestigationNote(id: number, text: string, author: string = 'Analyst Demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/investigations/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author })
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  // System & Health
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async toggleSystemMode(mode: 'LIVE' | 'DEMO'): Promise<any> {
    const res = await fetch(`${API_BASE}/system/mode?mode=${mode}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle mode');
    return res.json();
  },

  // Demo Scenarios
  async triggerScenario(scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C'): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/scenario/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error('Failed to trigger scenario');
    return res.json();
  },

  async resetScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/scenario/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset scenario');
    return res.json();
  },

  async getSimulatorState(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/state`);
    if (!res.ok) throw new Error('Failed to get simulator state');
    return res.json();
  },

  // Reports
  getReportUrl(id: number): string {
    return `${API_BASE}/incidents/${id}/report?format=html`;
  }
};
