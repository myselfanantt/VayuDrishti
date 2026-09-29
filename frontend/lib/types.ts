// ── Core Domain Types ────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type SynopticRegime =
  | "active_monsoon"
  | "break_monsoon"
  | "monsoon_depression"
  | "western_disturbance"
  | "heat_wave"
  | "cyclone_bob"
  | "cyclone_as"
  | "normal";

export interface ForecastRun {
  id?: string;
  run_id: string;
  model_name: string;
  init_time: string;
  domain: string;
  resolution: number;
  lead_days: number;
  status: string;
  created_at?: string;
}

export interface BustDetection {
  id: string;
  run_id: string;
  region_id: string;
  region_name: string;
  lat: number;
  lon: number;
  lead_day: number;
  bust_probability: number;
  confidence_score: number;
  uncertainty_low: number;
  uncertainty_high: number;
  severity: Severity;
  synoptic_regime: SynopticRegime | string;
  is_verified: boolean;
  actual_bust?: boolean;
  verification_mae?: number;
  created_at?: string;
  event_date?: string;
  narrative?: string;
}

export interface BustStats {
  total_detections: number;
  critical_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  avg_confidence: number;
  top_affected_regions: Array<{ region_id: string; region_name: string; count: number; avg_prob: number }>;
}

export interface RegionRisk {
  region_id: string;
  region_name: string;
  state: string;
  lat: number;
  lon: number;
  risk_level: RiskLevel;
  bust_probability: number;
  confidence_score: number;
  historical_hit_rate: number;
  dominant_synoptic?: string;
  affected_lead_days: number[];
}

export interface LeadTimeConfidence {
  lead_day: number;
  mean_confidence: number;
  uncertainty_low: number;
  uncertainty_high: number;
  bust_probability: number;
  high_risk_cells: number;
}

export interface GridCell {
  lat: number;
  lon: number;
  bust_probability: number;
  confidence_score: number;
  uncertainty_low: number;
  uncertainty_high: number;
  severity: string;
}

export interface SHAPFeature {
  feature: string;
  shap_value: number;
  direction: "positive" | "negative";
  magnitude: number;
  description: string;
}

export interface SHAPResult {
  top_drivers: SHAPFeature[];
  base_value: number;
  predicted_value: number;
  feature_values: Record<string, number>;
  all_attributions: Record<string, number>;
}

export interface SimilarEvent {
  id?: string;
  event_date?: string;
  region_name?: string;
  synoptic_regime?: string;
  bust_probability?: number;
  bust_mae?: number;
  similarity_score?: number;
}

export interface ExplainResponse {
  bust_id: string;
  run_id: string;
  region_name: string;
  lead_day: number;
  bust_probability: number;
  confidence_score: number;
  shap_values: SHAPResult;
  narrative: string;
  similar_events: SimilarEvent[];
  reliability_diagram: ReliabilityPoint[];
  calibration_note: string;
  generated_at: string;
}

export interface ReliabilityPoint {
  bin_center: number;
  mean_predicted: number;
  mean_observed: number;
  count: number;
}

export interface SynopticEvent {
  id: string;
  event_type: string;
  name?: string;
  onset_time: string;
  center_lat?: number;
  center_lon?: number;
  intensity?: string;
  bust_mae_avg?: number;
}

export interface AlertSubscription {
  id: string;
  region_id: string;
  threshold: number;
  email?: string;
  is_active: boolean;
  trigger_count: number;
  created_at: string;
}

export interface LiveAlert {
  type: "bust_alert" | "confidence_update" | "connection_established";
  alert_id?: string;
  region_name?: string;
  region_id?: string;
  bust_probability?: number;
  severity?: Severity;
  lead_day?: number;
  synoptic_regime?: string;
  triggered_at?: string;
  payload?: Record<string, unknown>;
}

export interface TaskStatus {
  task_id: string;
  status: "pending" | "running" | "complete" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  progress?: number;
}

// ── API Response Wrappers ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
}

// ── ADDENDUM PROMPT TYPES ───────────────────────────────────────────

export interface AddendumSimilarEvent {
  date: string;
  event_name: string;
  region: string;
  bust_mae: number;
}

export interface ExplainabilityResult {
  bust_id: string;
  region: string;
  lead_day: number;
  init_time: string;
  bust_probability: number;
  confidence_score: number;
  uncertainty_low: number;
  uncertainty_high: number;
  synoptic_tags: string[];
  shap_values: SHAPFeature[];
  narrative: string;
  similar_events: AddendumSimilarEvent[];
  reliability: ReliabilityData;
}

export interface ReliabilityData {
  forecast_prob_bins: number[];
  observed_frequency: number[];
  hit_rate: number;
  false_alarm_rate: number;
}

export interface PerformanceSummary {
  auc_roc: number;
  brier_score: number;
  hit_rate: number;
  false_alarm_rate: number;
  delta_auc: number;
  delta_brier: number;
  delta_hit_rate: number;
}

export interface LeadTimeSkill {
  lead_days: number[];
  auc: number[];
  ci_low: number[];
  ci_high: number[];
}

export interface RegimeSkill {
  regime: string;
  auc: number;
  n_events: number;
}

export interface ModelVersion {
  version: string;
  trained_period: string;
  auc: number;
  brier_score: number;
  released_at: string;
}

export type AlertSeverity = "CRITICAL" | "HIGH" | "MODERATE";

export interface ActiveAlert {
  alert_id: string;
  region: string;
  bust_probability: number;
  lead_day: number;
  severity: AlertSeverity;
  issued_at: string;
  bust_id: string;
  acknowledged: boolean;
}

export interface AlertRule {
  rule_id: string;
  region_id: string;
  region_name: string;
  threshold: number;
  lead_day_max: number;
  severity: AlertSeverity;
  notify_channels: string[];
  created_at: string;
}

export interface AlertHistoryItem {
  alert_id: string;
  date: string;
  region: string;
  bust_probability: number;
  severity: AlertSeverity;
  outcome: "bust_confirmed" | "false_alarm" | "pending";
}

export interface AlertStats {
  volume: { date: string; critical: number; high: number; moderate: number }[];
  accuracy: { verified: number; false_alarm: number; missed: number };
}

export interface RegionDetail {
  region_id: string;
  name: string;
  zone: string;
  district_count: number;
  current_risk_level: AlertSeverity;
  bust_rate_5yr: number;
  lat_bounds: [number, number];
  lon_bounds: [number, number];
}

export interface SeasonalPatternCell {
  month: number;
  lead_day: number;
  avg_bust_prob: number;
}

export interface RegionDriver {
  feature: string;
  meteorological_label: string;
  avg_shap: number;
  direction: "positive" | "negative";
}

export interface RegionBustEvent {
  bust_id: string;
  date: string;
  lead_day: number;
  bust_probability: number;
  verified: boolean;
}
