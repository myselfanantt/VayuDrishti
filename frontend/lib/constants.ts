export const INDIA_BOUNDS = {
  sw: [65.0, 5.0] as [number, number],
  ne: [100.0, 38.0] as [number, number],
};

export const INDIA_CENTER: [number, number] = [82.5, 22.0];
export const INDIA_ZOOM = 4.5;

export const RISK_COLORS: Record<string, string> = {
  LOW: "#34A853",
  MODERATE: "#FBBC04",
  HIGH: "#FF6D00",
  CRITICAL: "#EA4335",
};

export const RISK_BG_COLORS: Record<string, string> = {
  LOW: "#E8F5E9",
  MODERATE: "#FEF9E7",
  HIGH: "#FEF0E0",
  CRITICAL: "#FEE8E7",
};

export const RISK_TEXT_COLORS: Record<string, string> = {
  LOW: "#1E6C3B",
  MODERATE: "#8A6914",
  HIGH: "#B06000",
  CRITICAL: "#C5221F",
};

export const SYNOPTIC_LABELS: Record<string, string> = {
  active_monsoon: "Active Monsoon",
  break_monsoon: "Break Monsoon",
  monsoon_depression: "Monsoon Depression",
  western_disturbance: "Western Disturbance",
  heat_wave: "Heat Wave",
  cyclone_bob: "Bay of Bengal Cyclone",
  cyclone_as: "Arabian Sea Cyclone",
  normal: "Normal Conditions",
};

export const SYNOPTIC_COLORS: Record<string, string> = {
  active_monsoon: "#1A73E8",
  break_monsoon: "#FBBC04",
  monsoon_depression: "#EA4335",
  western_disturbance: "#7C4DFF",
  heat_wave: "#FF6D00",
  cyclone_bob: "#00BCD4",
  cyclone_as: "#009688",
  normal: "#5F6368",
};

export const LEAD_DAY_COLORS = [
  "#1A73E8", "#0D9488", "#34A853", "#8BC34A",
  "#FBBC04", "#FF9800", "#FF5722", "#EA4335",
  "#9C27B0", "#7C4DFF",
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/confidence-map", label: "Confidence Map", icon: "Map" },
  { href: "/bust-timeline", label: "Bust Timeline", icon: "Activity" },
];

export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  "850hPa_relative_vorticity": "850 hPa Vorticity",
  "CAPE": "CAPE Index",
  "model_bias_30d": "30-Day Model Bias",
  "OLR_anomaly": "OLR Anomaly",
  "precipitable_water": "Precipitable Water",
  "850hPa_wind_speed_anomaly": "850 hPa Wind Anomaly",
  "500hPa_geopotential_height_anomaly": "500 hPa Height Anomaly",
  "historical_RMSE": "Historical RMSE",
  "sea_surface_temp_anomaly": "SST Anomaly",
  "MSLP_gradient": "MSLP Gradient",
  "200hPa_divergence": "200 hPa Divergence",
  "synoptic_regime_encoding": "Synoptic Regime",
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
