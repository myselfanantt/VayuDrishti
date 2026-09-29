"use client";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BustConfidenceHeader from "@/components/explain/BustConfidenceHeader";
import SHAPWaterfallChart from "@/components/charts/SHAPWaterfallChart";
import MeteorologicalNarrative from "@/components/explain/MeteorologicalNarrative";
import SimilarEventsTable from "@/components/explain/SimilarEventsTable";
import ReliabilityDiagram from "@/components/explain/ReliabilityDiagram";
import { useExplainability } from "@/hooks/useExplainability";

export default function ExplainabilityPage({ params }: { params: { bustId: string } }) {
  const { data, isLoading, error } = useExplainability(params.bustId);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FA" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", padding: 24, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ height: 100, background: "#E0E0E0", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: 300 }}>
                <div style={{ background: "#E0E0E0", borderRadius: 8 }} />
                <div style={{ background: "#E0E0E0", borderRadius: 8 }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: 20, background: "#FFF0EF", color: "#EA4335", borderRadius: 8, border: "1px solid #EA4335" }}>
              Failed to load bust explanation data. Please try again.
            </div>
          )}

          {data && (
            <>
              <BustConfidenceHeader data={data} />

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #DADCE0", borderRadius: 8, padding: "16px 20px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
                    SHAP Feature Contributions
                  </h3>
                  <div style={{ fontSize: 12, color: "#5F6368", marginBottom: 12 }}>
                    Meteorological drivers increasing or decreasing bust probability.
                  </div>
                  <SHAPWaterfallChart
                    features={data.shap_values}
                    baseValue={0.5}
                    predictedValue={data.bust_probability}
                    height={280}
                  />
                </div>

                <MeteorologicalNarrative narrative={data.narrative} />
              </div>

              <SimilarEventsTable events={data.similar_events} />

              <ReliabilityDiagram data={data.reliability} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
