import useSWR from "swr";
import {
  fetchRegionDetail,
  fetchRegionConfidenceForecast,
  fetchRegionSeasonalPattern,
  fetchRegionDominantDrivers,
  fetchRegionBustHistory,
  fetchRegionDistricts,
} from "@/lib/api";
import type {
  RegionDetail,
  SeasonalPatternCell,
  RegionDriver,
  RegionBustEvent,
} from "@/lib/types";

export function useRegionDetail(regionId: string) {
  const { data: detail, isLoading: loadingDetail } = useSWR<RegionDetail>(
    regionId ? ["region-detail", regionId] : null,
    () => fetchRegionDetail(regionId)
  );

  const { data: forecast, isLoading: loadingForecast } = useSWR<{
    lead_days: number[];
    confidence: number[];
    uncertainty_low: number[];
    uncertainty_high: number[];
  }>(
    regionId ? ["region-confidence", regionId] : null,
    () => fetchRegionConfidenceForecast(regionId)
  );

  const { data: seasonal, isLoading: loadingSeasonal } = useSWR<SeasonalPatternCell[]>(
    regionId ? ["region-seasonal", regionId] : null,
    () => fetchRegionSeasonalPattern(regionId)
  );

  const { data: drivers, isLoading: loadingDrivers } = useSWR<RegionDriver[]>(
    regionId ? ["region-drivers", regionId] : null,
    () => fetchRegionDominantDrivers(regionId)
  );

  const { data: history, isLoading: loadingHistory } = useSWR<RegionBustEvent[]>(
    regionId ? ["region-bust-history", regionId] : null,
    () => fetchRegionBustHistory(regionId)
  );

  const { data: districts, isLoading: loadingDistricts } = useSWR(
    regionId ? ["region-districts", regionId] : null,
    () => fetchRegionDistricts(regionId)
  );

  return {
    detail,
    forecast,
    seasonal,
    drivers,
    history,
    districts,
    isLoading:
      loadingDetail ||
      loadingForecast ||
      loadingSeasonal ||
      loadingDrivers ||
      loadingHistory ||
      loadingDistricts,
  };
}
