import { create } from "zustand";
import type { ForecastRun, BustDetection, RegionRisk, LiveAlert } from "./types";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  initials: string;
}

interface VayuDrishtiState {
  // Auth State
  user: UserProfile | null;
  isLoggedIn: boolean;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;

  // Current forecast run
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;

  // Forecast runs list
  forecastRuns: ForecastRun[];
  setForecastRuns: (runs: ForecastRun[]) => void;

  // Bust detections
  bustDetections: BustDetection[];
  setBustDetections: (busts: BustDetection[]) => void;

  // Region risks
  regionRisks: RegionRisk[];
  setRegionRisks: (risks: RegionRisk[]) => void;

  // Live alerts
  liveAlerts: LiveAlert[];
  addLiveAlert: (alert: LiveAlert) => void;
  clearAlerts: () => void;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Selected lead day for map
  selectedLeadDay: number;
  setSelectedLeadDay: (day: number) => void;

  // System status
  systemStatus: "live" | "degraded" | "offline";
  setSystemStatus: (status: "live" | "degraded" | "offline") => void;
}

const DEFAULT_USER: UserProfile = {
  id: "usr_2607",
  name: "Dr. Suraj Zaware",
  email: "suraj.zaware@ncmrwf.gov.in",
  role: "Lead Meteorologist",
  organization: "NCMRWF — MoES",
  initials: "SZ",
};

export const useStore = create<VayuDrishtiState>((set) => ({
  user: DEFAULT_USER,
  isLoggedIn: true,
  loginUser: (user) => set({ user, isLoggedIn: true }),
  logoutUser: () => set({ user: null, isLoggedIn: false }),

  selectedRunId: null,
  setSelectedRunId: (id) => set({ selectedRunId: id }),

  forecastRuns: [],
  setForecastRuns: (runs) => set({ forecastRuns: runs }),

  bustDetections: [],
  setBustDetections: (busts) => set({ bustDetections: busts }),

  regionRisks: [],
  setRegionRisks: (risks) => set({ regionRisks: risks }),

  liveAlerts: [],
  addLiveAlert: (alert) =>
    set((state) => ({
      liveAlerts: [alert, ...state.liveAlerts].slice(0, 50), // keep last 50
    })),
  clearAlerts: () => set({ liveAlerts: [] }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedLeadDay: 1,
  setSelectedLeadDay: (day) => set({ selectedLeadDay: day }),

  systemStatus: "live",
  setSystemStatus: (status) => set({ systemStatus: status }),
}));
