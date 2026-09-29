import useSWR from "swr";
import { fetchExplanation } from "@/lib/api";
import type { ExplainabilityResult } from "@/lib/types";

export function useExplainability(bustId: string) {
  const { data, error, isLoading, mutate } = useSWR<ExplainabilityResult>(
    bustId ? ["explainability", bustId] : null,
    () => fetchExplanation(bustId),
    { revalidateOnFocus: false }
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
