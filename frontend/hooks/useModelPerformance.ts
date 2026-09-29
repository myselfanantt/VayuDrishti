import useSWR from "swr";
import {
  fetchPerformanceSummary,
  fetchPerformanceByLeadTime,
  fetchPerformanceByRegime,
  fetchPerformanceSpatial,
  fetchPerformanceROCCurve,
  fetchPerformanceCalibration,
  fetchPerformanceModelVersions,
} from "@/lib/api";
import type {
  PerformanceSummary,
  LeadTimeSkill,
  RegimeSkill,
  ModelVersion,
} from "@/lib/types";

export function useModelPerformance() {
  const { data: summary, isLoading: loadingSummary } = useSWR<PerformanceSummary>(
    "performance-summary",
    fetchPerformanceSummary
  );
  const { data: leadTime, isLoading: loadingLeadTime } = useSWR<LeadTimeSkill>(
    "performance-lead-time",
    fetchPerformanceByLeadTime
  );
  const { data: regime, isLoading: loadingRegime } = useSWR<RegimeSkill[]>(
    "performance-regime",
    fetchPerformanceByRegime
  );
  const { data: spatial, isLoading: loadingSpatial } = useSWR<any>(
    "performance-spatial",
    fetchPerformanceSpatial
  );
  const { data: rocCurve, isLoading: loadingRoc } = useSWR<{ fpr: number[]; tpr: number[]; auc: number }>(
    "performance-roc",
    fetchPerformanceROCCurve
  );
  const { data: calibration, isLoading: loadingCalibration } = useSWR<{ forecast_bins: number[]; observed_freq: number[] }>(
    "performance-calibration",
    fetchPerformanceCalibration
  );
  const { data: versions, isLoading: loadingVersions } = useSWR<ModelVersion[]>(
    "performance-versions",
    fetchPerformanceModelVersions
  );

  return {
    summary,
    leadTime,
    regime,
    spatial,
    rocCurve,
    calibration,
    versions,
    isLoading:
      loadingSummary ||
      loadingLeadTime ||
      loadingRegime ||
      loadingSpatial ||
      loadingRoc ||
      loadingCalibration ||
      loadingVersions,
  };
}
