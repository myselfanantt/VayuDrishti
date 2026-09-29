import useSWR from "swr";
import { fetchRunConfidence, fetchRegionRiskMap } from "@/lib/api";
import type { LeadTimeConfidence, RegionRisk } from "@/lib/types";

export function useConfidenceMap(runId: string | null, leadDay = 1) {
  const { data, error, isLoading } = useSWR(
    runId ? ["confidence", runId, leadDay] : null,
    () => fetchRunConfidence(runId!, leadDay),
    { refreshInterval: 300_000, revalidateOnFocus: false }
  );

  return {
    leadTimes: (data?.lead_times ?? []) as LeadTimeConfidence[],
    grid: data?.grid,
    synopticRegime: data?.synoptic_regime,
    isLoading,
    error,
  };
}

export function useRegionRiskMap(runId?: string) {
  const { data, error, isLoading } = useSWR(
    ["region-risk", runId ?? "latest"],
    () => fetchRegionRiskMap(runId),
    { refreshInterval: 120_000 }
  );

  return {
    regions: (data?.regions ?? []) as RegionRisk[],
    geojson: data?.geojson,
    generatedAt: data?.generated_at,
    isLoading,
    error,
  };
}
