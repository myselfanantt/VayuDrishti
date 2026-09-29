import useSWR from "swr";
import {
  fetchActiveAlerts,
  fetchAlertRules,
  fetchAlertHistory,
  fetchAlertStatsVolume,
  fetchAlertStatsAccuracy,
  acknowledgeAlert,
  createAlertRule,
  deleteAlertRule,
} from "@/lib/api";
import { useLiveAlerts } from "./useLiveAlerts";
import type {
  ActiveAlert,
  AlertRule,
  AlertHistoryItem,
  AlertStats,
} from "@/lib/types";

export function useAlerts(historyFilters?: { region?: string; severity?: string; page?: number }) {
  const { liveAlerts } = useLiveAlerts();

  const {
    data: activeData,
    isLoading: loadingActive,
    mutate: mutateActive,
  } = useSWR<{ alerts: ActiveAlert[] }>("alerts-active", fetchActiveAlerts);

  const {
    data: rulesData,
    isLoading: loadingRules,
    mutate: mutateRules,
  } = useSWR<{ rules: AlertRule[] }>("alerts-rules", fetchAlertRules);

  const {
    data: historyData,
    isLoading: loadingHistory,
    mutate: mutateHistory,
  } = useSWR<{ history: AlertHistoryItem[]; total: number }>(
    ["alerts-history", historyFilters?.region, historyFilters?.severity, historyFilters?.page],
    () => fetchAlertHistory(historyFilters)
  );

  const { data: volumeData, isLoading: loadingVolume } = useSWR<
    { date: string; critical: number; high: number; moderate: number }[]
  >("alerts-volume", fetchAlertStatsVolume);

  const { data: accuracyData, isLoading: loadingAccuracy } = useSWR<{
    verified: number;
    false_alarm: number;
    missed: number;
  }>("alerts-accuracy", fetchAlertStatsAccuracy);

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    mutateActive();
  };

  const handleCreateRule = async (rule: {
    region_id: string;
    threshold: number;
    lead_day_max: number;
    notify_channels: string[];
  }) => {
    await createAlertRule(rule);
    mutateRules();
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteAlertRule(ruleId);
    mutateRules();
  };

  return {
    activeAlerts: activeData?.alerts ?? [],
    liveWsAlerts: liveAlerts,
    rules: rulesData?.rules ?? [],
    history: historyData?.history ?? [],
    historyTotal: historyData?.total ?? 0,
    volumeStats: volumeData ?? [],
    accuracyStats: accuracyData,
    isLoading: loadingActive || loadingRules || loadingHistory || loadingVolume || loadingAccuracy,
    handleAcknowledge,
    handleCreateRule,
    handleDeleteRule,
  };
}
