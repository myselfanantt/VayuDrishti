import { API_BASE_URL } from "./constants";
import type {
  ForecastRun, BustDetection, BustStats, RegionRisk,
  LeadTimeConfidence, ExplainResponse, AlertSubscription,
  TaskStatus, ExplainabilityResult, PerformanceSummary,
  LeadTimeSkill, RegimeSkill, ModelVersion, ActiveAlert,
  AlertRule, AlertHistoryItem, RegionDetail, SeasonalPatternCell,
  RegionDriver, RegionBustEvent,
} from "./types";

const BASE = API_BASE_URL;

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Forecast ──────────────────────────────────────────────────────────────

export async function fetchForecastRuns(
  page = 1, pageSize = 20, model?: string
): Promise<{ runs: ForecastRun[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (model) params.set("model", model);
  return fetchJSON(`/api/v1/forecast/runs?${params}`);
}

export async function fetchRunConfidence(
  runId: string, leadDay = 1
): Promise<{ run_id: string; lead_times: LeadTimeConfidence[]; grid: unknown; synoptic_regime?: string }> {
  return fetchJSON(`/api/v1/forecast/${encodeURIComponent(runId)}/confidence?lead_day=${leadDay}`);
}

// ── Busts ─────────────────────────────────────────────────────────────────

export async function fetchBusts(params?: {
  region?: string; severity?: string; days?: number; page?: number; page_size?: number;
}): Promise<{ busts: BustDetection[]; stats: BustStats; total: number }> {
  const q = new URLSearchParams();
  if (params?.region) q.set("region", params.region);
  if (params?.severity) q.set("severity", params.severity);
  if (params?.days) q.set("days", String(params.days));
  if (params?.page) q.set("page", String(params.page));
  if (params?.page_size) q.set("page_size", String(params.page_size));
  return fetchJSON(`/api/v1/busts/?${q}`);
}

export async function fetchRecentBusts(limit = 10): Promise<{ busts: BustDetection[] }> {
  return fetchJSON(`/api/v1/busts/recent?limit=${limit}`);
}

export async function triggerBustDetection(
  runId: string, forceRecompute = false
): Promise<{ task_id: string; status: string }> {
  return fetchJSON("/api/v1/busts/detect", {
    method: "POST",
    body: JSON.stringify({ run_id: runId, force_recompute: forceRecompute }),
  });
}

export async function fetchTaskStatus(taskId: string): Promise<TaskStatus> {
  return fetchJSON(`/api/v1/busts/detect/${taskId}`);
}

// ── Explain ───────────────────────────────────────────────────────────────

export async function fetchExplanation(bustId: string): Promise<ExplainabilityResult> {
  return fetchJSON(`/api/v1/explain/${bustId}`);
}

// ── Regions ───────────────────────────────────────────────────────────────

export async function fetchRegionRiskMap(runId?: string): Promise<{
  regions: RegionRisk[]; geojson: unknown; generated_at: string;
}> {
  const q = runId ? `?run_id=${encodeURIComponent(runId)}` : "";
  return fetchJSON(`/api/v1/regions/risk-map${q}`);
}

export async function fetchRegionHistory(regionId: string): Promise<{
  region_name: string; bust_rate: number; hit_rate: number; events: unknown[];
  monthly_climatology: unknown[];
}> {
  return fetchJSON(`/api/v1/regions/${regionId}/history`);
}

// ── Alerts ────────────────────────────────────────────────────────────────

export async function fetchLiveAlerts(): Promise<{ alerts: unknown[] }> {
  return fetchJSON("/api/v1/alerts/live");
}

export async function createAlertSubscription(
  params: { region_id: string; threshold: number; email?: string }
): Promise<{ subscription: AlertSubscription }> {
  return fetchJSON("/api/v1/alerts/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ── Health ────────────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<{ status: string; version: string }> {
  return fetchJSON("/health");
}

// ── Performance API ────────────────────────────────────────────────────────
export async function fetchPerformanceSummary() {
  return fetchJSON<PerformanceSummary>("/api/v1/performance/summary");
}
export async function fetchPerformanceByLeadTime() {
  return fetchJSON<LeadTimeSkill>("/api/v1/performance/by-lead-time");
}
export async function fetchPerformanceByRegime() {
  return fetchJSON<RegimeSkill[]>("/api/v1/performance/by-regime");
}
export async function fetchPerformanceSpatial() {
  return fetchJSON<any>("/api/v1/performance/spatial");
}
export async function fetchPerformanceROCCurve() {
  return fetchJSON<{ fpr: number[]; tpr: number[]; auc: number }>("/api/v1/performance/roc-curve");
}
export async function fetchPerformanceCalibration() {
  return fetchJSON<{ forecast_bins: number[]; observed_freq: number[] }>("/api/v1/performance/calibration");
}
export async function fetchPerformanceModelVersions() {
  return fetchJSON<ModelVersion[]>("/api/v1/performance/model-versions");
}

// ── Alerts API ────────────────────────────────────────────────────────────
export async function fetchActiveAlerts() {
  return fetchJSON<{ alerts: ActiveAlert[] }>("/api/v1/alerts/active");
}
export async function acknowledgeAlert(alertId: string) {
  return fetchJSON<{ success: boolean }>(`/api/v1/alerts/${alertId}/acknowledge`, { method: "POST" });
}
export async function fetchAlertRules() {
  return fetchJSON<{ rules: AlertRule[] }>("/api/v1/alerts/rules");
}
export async function createAlertRule(body: { region_id: string; threshold: number; lead_day_max: number; notify_channels: string[] }) {
  return fetchJSON<AlertRule>("/api/v1/alerts/rules", { method: "POST", body: JSON.stringify(body) });
}
export async function updateAlertRule(ruleId: string, body: unknown) {
  return fetchJSON<AlertRule>(`/api/v1/alerts/rules/${ruleId}`, { method: "PUT", body: JSON.stringify(body) });
}
export async function deleteAlertRule(ruleId: string) {
  return fetchJSON<{ success: boolean }>(`/api/v1/alerts/rules/${ruleId}`, { method: "DELETE" });
}
export async function fetchAlertHistory(params?: { region?: string; severity?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.region) q.set("region", params.region);
  if (params?.severity) q.set("severity", params.severity);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return fetchJSON<{ history: AlertHistoryItem[]; total: number }>(`/api/v1/alerts/history?${q}`);
}
export async function fetchAlertStatsVolume() {
  return fetchJSON<{ date: string; critical: number; high: number; moderate: number }[]>("/api/v1/alerts/stats/volume");
}
export async function fetchAlertStatsAccuracy() {
  return fetchJSON<{ verified: number; false_alarm: number; missed: number }>("/api/v1/alerts/stats/accuracy");
}

// ── Region Detail API ──────────────────────────────────────────────────────
export async function fetchRegionDetail(regionId: string) {
  return fetchJSON<RegionDetail>(`/api/v1/regions-detail/${regionId}`);
}
export async function fetchRegionConfidenceForecast(regionId: string) {
  return fetchJSON<{ lead_days: number[]; confidence: number[]; uncertainty_low: number[]; uncertainty_high: number[] }>(`/api/v1/regions-detail/${regionId}/confidence-forecast`);
}
export async function fetchRegionSeasonalPattern(regionId: string) {
  return fetchJSON<SeasonalPatternCell[]>(`/api/v1/regions-detail/${regionId}/seasonal-pattern`);
}
export async function fetchRegionDominantDrivers(regionId: string) {
  return fetchJSON<RegionDriver[]>(`/api/v1/regions-detail/${regionId}/dominant-drivers`);
}
export async function fetchRegionBustHistory(regionId: string) {
  return fetchJSON<RegionBustEvent[]>(`/api/v1/regions-detail/${regionId}/bust-history`);
}
export async function fetchRegionDistricts(regionId: string) {
  return fetchJSON<any>(`/api/v1/regions-detail/${regionId}/districts`);
}

