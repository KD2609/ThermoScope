export interface FirePrediction {
  id?: number;
  fire_detection_id: string;
  predicted_class: string;
  confidence: number;
  risk_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  model_version: string;
  class_probabilities: Record<string, number>;
  nearby_industrial_name?: string;
  nearby_industrial_type?: string;
  distance_to_industrial_km?: number;
  nearby_residential_name?: string;
  distance_to_residential_km?: number;
  recommended_response?: string;
  predicted_at?: string;
}

export interface FireDetection {
  id: string;
  source: string;
  sensor: string;
  latitude: number;
  longitude: number;
  detection_time: string;
  brightness_temperature: number;
  frp: number;
  confidence: number;
  day_night: 'D' | 'N';
  satellite: string;
  instrument: string;
  is_demo_fallback: boolean;
  incident_id?: string;
  created_at?: string;
  prediction?: FirePrediction;
}

export interface IndustrialSite {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  source: string;
  risk_category: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description?: string;
  distance_km?: number;
}

export interface ResidentialArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  building_count: number;
  population_estimate: number;
  danger_radius_km: number;
  distance_km?: number;
}

export interface AlertItem {
  id: string;
  fire_detection_id: string;
  incident_id?: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  facility_name?: string;
  residential_area_name?: string;
  distance_to_residence_km?: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  escalation_level?: string;
  escalated_at?: string;
  assigned_to?: string;
  assigned_at?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at?: string;
}

export interface NotificationSubscription {
  id: number;
  user_email: string;
  area_name: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  email_enabled: boolean;
  browser_enabled: boolean;
  sms_enabled: boolean;
  created_at?: string;
}

export interface DashboardStats {
  active_fires_count: number;
  industrial_fires_count: number;
  high_risk_count: number;
  critical_alerts_count: number;
  active_alerts_count?: number;
  total_detections: number;
  trend_percentage_24h: number;
  class_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  last_sync_time?: string;
  is_live_firms_connected: boolean;
}

export interface SystemHealth {
  database: {
    status: string;
    dialect: string;
    is_sqlite: boolean;
    connected: boolean;
  };
  nasa_firms: {
    status: string;
    last_sync?: string;
    source: string;
    is_api_key_set: boolean;
    total_processed: number;
  };
  ml_engine: {
    status: string;
    model_version: string;
    classes_count: number;
    is_model_loaded: boolean;
  };
  active_alerts_count: number;
  total_records_processed: number;
  last_ingestion_time?: string;
  uptime_status: string;
}

export interface SatelliteContext {
  available: boolean;
  image_url?: string;
  provider: string;
  capture_date?: string;
  resolution?: string;
  disclaimer: string;
}

export interface Incident {
  id: string;
  title: string;
  status: 'NEW' | 'INVESTIGATING' | 'CONFIRMED' | 'CONTAINED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  first_detected_at?: string;
  last_detected_at?: string;
  detection_count: number;
  latitude: number;
  longitude: number;
  radius_km: number;
  max_frp: number;
  avg_frp: number;
  primary_class: string;
  nearby_facility_name?: string;
  nearby_facility_id?: string;
  distance_to_facility_km?: number;
  assigned_to?: string;
  assigned_at?: string;
  closed_at?: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
  detections?: FireDetection[];
}

export interface WeatherContext {
  latitude: number;
  longitude: number;
  temperature?: number;
  relative_humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  wind_direction_cardinal?: string;
  precipitation?: number;
  weather_source: string;
  fetched_at?: string;
  cached: boolean;
}

export interface TrajectoryPoint {
  fire_id: string;
  detection_time: string;
  latitude: number;
  longitude: number;
  frp: number;
  distance_from_prev_km: number;
  bearing_degrees?: number;
  bearing_cardinal?: string;
  speed_kmh?: number;
}

export interface IncidentTrajectory {
  incident_id: string;
  observation_count: number;
  total_displacement_km: number;
  net_distance_km: number;
  net_bearing_degrees?: number;
  net_bearing_cardinal?: string;
  average_speed_kmh: number;
  movement_trend: 'STATIONARY' | 'LINEAR_EXPANSION' | 'CLUSTERED' | 'SCATTERED';
  observed_movement_summary: string;
  points: TrajectoryPoint[];
  wind_correlation?: {
    alignment_status: 'ALIGNED' | 'PARTIALLY_ALIGNED' | 'NOT_ALIGNED' | 'INSUFFICIENT_DATA';
    angular_difference_deg?: number;
    wind_speed_kmh?: number;
    downwind_bearing_deg?: number;
    correlation_summary: string;
    disclaimer?: string;
  };
}

export interface Hotspot {
  hotspot_id: string;
  center_latitude: number;
  center_longitude: number;
  detection_count: number;
  active_days: number;
  average_frp: number;
  median_frp: number;
  max_frp: number;
  persistence_score: number;
  window_days: number;
  nearby_facility?: string;
  dominant_class: string;
  composite_hotspot_risk?: number;
  rank?: number;
}

export interface RiskExplanationItem {
  factor: string;
  score: number;
  weight: number;
  evidence: string;
  level: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
}

export interface RiskExplanation {
  fire_id: string;
  risk_score: number;
  severity: string;
  summary_headline: string;
  explanations: RiskExplanationItem[];
  recommendation: string;
}

export interface ImpactExposureItem {
  name: string;
  category: 'INDUSTRIAL' | 'RESIDENTIAL' | 'INFRASTRUCTURE';
  type: string;
  distance_km: number;
  danger_tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  details?: Record<string, any>;
}

export interface ImpactAnalysis {
  fire_id: string;
  latitude: number;
  longitude: number;
  danger_zone: string;
  population_exposure_estimate?: number;
  population_source: string;
  facilities_at_risk_count: number;
  residential_settlements_at_risk_count: number;
  critical_infrastructure_count: number;
  impact_items: ImpactExposureItem[];
  exposure_summary: string;
}

export interface FacilityRiskProfile {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  risk_category: string;
  current_risk_score: number;
  current_status: 'NORMAL' | 'ELEVATED_OBSERVATION' | 'ACTIVE_INCIDENT_NEARBY' | 'CRITICAL_ALERT';
  risk_trend: 'STABLE' | 'INCREASING' | 'DECREASING';
  detections_24h: number;
  detections_7d: number;
  detections_30d: number;
  detections_90d: number;
  max_nearby_frp_30d: number;
  avg_nearby_frp_30d: number;
  nearest_active_fire_km?: number;
  nearest_active_fire_id?: string;
  persistence_score: number;
  is_anomaly_detected: boolean;
  anomaly_magnitude?: number;
  recurring_pattern?: string;
}

export interface AnalystReview {
  id?: number;
  fire_detection_id: string;
  incident_id?: string;
  decision: 'CONFIRMED' | 'FALSE_POSITIVE' | 'INCORRECT_CLASSIFICATION' | 'UNKNOWN';
  corrected_class?: string;
  analyst_id: string;
  analyst_name: string;
  notes?: string;
  reviewed_at?: string;
}

export interface WhatIfSimulationResult {
  is_simulation: boolean;
  disclaimer: string;
  simulated_risk_score: number;
  simulated_severity: string;
  recommended_response: string;
  risk_delta_vs_baseline?: number;
  input_parameters: Record<string, any>;
}

export interface IntelligenceBrief {
  timestamp: string;
  headline: string;
  active_incidents_count: number;
  critical_incidents_count: number;
  active_anomalies_count: number;
  persistent_hotspots_count: number;
  escalated_alerts_count: number;
  facilities_under_elevated_exposure: string[];
  top_active_incidents: Incident[];
  key_takeaways: string[];
}

export interface DataQualityReport {
  timestamp: string;
  is_data_stale: boolean;
  minutes_since_last_sync?: number;
  freshness_status: string;
  last_sync_time?: string;
  last_sync_status: string;
  lifetime_records_fetched: number;
  lifetime_records_inserted: number;
  lifetime_duplicates_or_filtered: number;
  database_connected: boolean;
  postgis_enabled: boolean;
  postgis_version?: string;
  quality_score_pct: number;
}

export interface ModelMonitoring {
  model_version: string;
  total_inferences: number;
  average_confidence: number;
  class_distribution: Record<string, number>;
  analyst_reviews_total: number;
  analyst_review_breakdown: Record<string, number>;
  analyst_confirmed_accuracy_pct: number;
  status: string;
}

