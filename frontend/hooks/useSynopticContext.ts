import useSWR from "swr";
import { fetchHealth } from "@/lib/api";
import { SYNOPTIC_LABELS } from "@/lib/constants";

export function useSynopticContext(runId?: string) {
  const { data } = useSWR("health", fetchHealth, { refreshInterval: 60_000 });

  // In production this would come from the API based on the run
  // For demo, return active_monsoon (September context)
  const regime = "active_monsoon";

  return {
    regime,
    regimeLabel: SYNOPTIC_LABELS[regime] ?? "Active Monsoon",
    isMonsonSeason: true,
    systemHealthy: data?.status === "healthy",
  };
}
