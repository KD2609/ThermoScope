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
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  facility_name?: string;
  residential_area_name?: string;
  distance_to_residence_km?: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
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
