export interface ThermalAnomaly {
  id: number;
  event_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  satellite: string;
  frp: number;
  brightness: number;
  source_confidence: string;
  daynight: string;
  source: string;
  processing_status: string;
  is_simulated: boolean;
  created_at: string;
  classification_class: string;
  classification_confidence: number;
  risk_score: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  facility_name: string;
}

export interface IndustrialAsset {
  id: number;
  asset_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  boundary_geojson?: string;
  radius_meters: number;
  operational_status: string;
  criticality_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  source_confidence: string;
  baseline_frp_min: number;
  baseline_frp_max: number;
  baseline_frp_median: number;
  baseline_count: number;
  last_updated: string;
  active_anomalies_count: number;
  historical_observations_count: number;
  current_risk_level: string;
  persistence_detected: boolean;
}

export interface Alert {
  id: number;
  alert_id: string;
  anomaly_id: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  facility_name: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'RESOLVED';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestigationNote {
  id: string;
  timestamp: string;
  author: string;
  text: string;
}

export interface Investigation {
  id: number;
  anomaly_id: number;
  status: 'NEW' | 'UNDER REVIEW' | 'VERIFIED' | 'FALSE POSITIVE' | 'RESOLVED';
  assigned_analyst: string;
  notes: InvestigationNote[];
  recommendation: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BaselineAnalysis {
  has_sufficient_history: boolean;
  observation_count: number;
  current_frp: number;
  historical_median_frp?: number;
  frp_min?: number;
  frp_max?: number;
  deviation_percent?: number;
  persistence_detected: boolean;
  persistence_duration_days: number;
  recurrence_frequency_per_week: number;
  interpretation: string;
}

export interface ClassificationDetails {
  predicted_class: string;
  confidence_score: number;
  class_probabilities: Record<string, number>;
  supporting_evidence: string[];
  uncertainty_factors: string[];
  feature_contributions: Record<string, number>;
  model_name: string;
}

export interface RiskDetails {
  risk_score: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  investigation_priority: string;
  components: {
    intensity: number;
    proximity: number;
    abnormality: number;
    persistence: number;
    criticality: number;
    confidence: number;
  };
  formula_weights: Record<string, number>;
}

export interface AnomalyIntelligence {
  event: ThermalAnomaly;
  spatial: {
    nearest_asset_name: string;
    nearest_asset_id?: string;
    distance_to_nearest_asset_m: number;
    is_inside_boundary: boolean;
    distance_to_boundary_m: number;
    asset_category: string;
    land_context: string;
    settlement_distance_m: number;
  };
  thermal: {
    frp: number;
    brightness: number;
    daynight: string;
    satellite: string;
    source_confidence: string;
  };
  temporal: BaselineAnalysis;
  classification: ClassificationDetails;
  risk: RiskDetails;
  investigation: Investigation;
  audit_logs: Array<{
    id: number;
    action: string;
    user_name: string;
    details: string;
    timestamp: string;
  }>;
  source_metadata: {
    source_provider: string;
    processing_pipeline: string;
    is_simulated_record: boolean;
    generated_at: string;
  };
}

export interface SystemHealth {
  system_mode: 'LIVE' | 'DEMO';
  status: string;
  timestamp: string;
  sources: Array<{
    source_name: string;
    status: string;
    record_count: number;
    last_sync: string;
    latency_ms: number;
    message: string;
  }>;
  active_anomalies: number;
  industrial_assets: number;
  critical_alerts: number;
}

export interface AnalyticsSummary {
  total_anomalies: number;
  industrial_events_count: number;
  high_risk_count: number;
  persistent_sources_count: number;
  new_events_24h: number;
  avg_confidence: number;
  by_classification: Record<string, number>;
  by_severity: Record<string, number>;
  by_region: Record<string, number>;
  top_assets_by_risk: Array<{
    asset_id: string;
    name: string;
    category: string;
    criticality: string;
    risk_score: number;
    active_anomalies: number;
  }>;
  daily_thermal_trends: Array<{
    date: string;
    industrial_frp: number;
    natural_frp: number;
    detections: number;
  }>;
  industrial_vs_natural_ratio: {
    'Industrial Associated': number;
    'Agricultural / Wildfire': number;
  };
}
