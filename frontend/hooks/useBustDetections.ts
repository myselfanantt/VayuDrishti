import useSWR from "swr";
import { fetchBusts, fetchRecentBusts } from "@/lib/api";
import type { BustDetection, BustStats } from "@/lib/types";

interface UseBustDetectionsOptions {
  region?: string;
  severity?: string;
  days?: number;
  page?: number;
  page_size?: number;
}

export function useBustDetections(options: UseBustDetectionsOptions = {}) {
  const key = ["busts", options.region, options.severity, options.days, options.page, options.page_size];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetchBusts(options),
    { refreshInterval: 60_000, revalidateOnFocus: false }
  );

  return {
    busts: (data?.busts ?? []) as BustDetection[],
    stats: data?.stats as BustStats | undefined,
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useRecentBusts(limit = 10) {
  const { data, error, isLoading } = useSWR(
    ["recent-busts", limit],
    () => fetchRecentBusts(limit),
    { refreshInterval: 30_000 }
  );
  return {
    busts: (data?.busts ?? []) as BustDetection[],
    isLoading,
    error,
  };
}
