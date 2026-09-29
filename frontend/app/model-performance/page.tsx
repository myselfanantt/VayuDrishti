"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MetricStatCard from "@/components/performance/MetricStatCard";
import SkillByLeadTimeChart from "@/components/performance/SkillByLeadTimeChart";
import SkillByRegimeChart from "@/components/performance/SkillByRegimeChart";
import ROCCurveChart from "@/components/performance/ROCCurveChart";
import ReliabilityDiagram from "@/components/explain/ReliabilityDiagram";
import ModelVersionTable from "@/components/performance/ModelVersionTable";
import { useModelPerformance } from "@/hooks/useModelPerformance";

const SpatialSkillMap = dynamic(() => import("@/components/performance/SpatialSkillMap"), { ssr: false });

export default function ModelPerformancePage() {
  const {
    summary,
    leadTime,
    regime,
    spatial,
    rocCurve,
    calibration,
    versions,
    isLoading,
  } = useModelPerformance();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FA" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", padding: 24, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>
                Model Performance & Verification Metrics
              </h1>
              <div style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
                Last updated: {new Date().toISOString().slice(0, 10)} 06Z · Evaluated against IMD station observations
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, height: 100 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ background: "#E0E0E0", borderRadius: 8 }} />
                ))}
              </div>
              <div style={{ height: 260, background: "#E0E0E0", borderRadius: 8 }} />
            </div>
          ) : (
            <>
              {/* Top Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                <MetricStatCard
                  label="AUC-ROC"
                  value={summary?.auc_roc.toFixed(3) ?? "0.847"}
                  delta={`▲ +${(summary?.delta_auc ?? 0.03).toFixed(2)}`}
                  isPositiveGood={true}
                  borderColor="#1A73E8"
                />
                <MetricStatCard
                  label="Brier Score"
                  value={summary?.brier_score.toFixed(3) ?? "0.143"}
                  delta={`▼ -${Math.abs(summary?.delta_brier ?? 0.013).toFixed(3)}`}
                  isPositiveGood={false}
                  subtext="lower is better"
                  borderColor="#34A853"
                />
                <MetricStatCard
                  label="Hit Rate"
                  value={`${((summary?.hit_rate ?? 0.742) * 100).toFixed(1)}%`}
                  delta={`▲ +${((summary?.delta_hit_rate ?? 0.021) * 100).toFixed(1)}%`}
                  isPositiveGood={true}
                  borderColor="#7C4DFF"
                />
                <MetricStatCard
                  label="False Alarm Rate"
                  value={`${((summary?.false_alarm_rate ?? 0.178) * 100).toFixed(1)}%`}
                  delta="▼ -1.2%"
                  isPositiveGood={false}
                  subtext="lower is better"
                  borderColor="#FBBC04"
                />
              </div>

              {/* Charts Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {leadTime && <SkillByLeadTimeChart data={leadTime} />}
                {regime && <SkillByRegimeChart data={regime} />}
              </div>

              {/* Spatial Skill Map */}
              <SpatialSkillMap geojson={spatial} />

              {/* ROC & Calibration Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <ROCCurveChart data={rocCurve} />
                {calibration && (
                  <ReliabilityDiagram
                    data={{
                      forecast_prob_bins: calibration.forecast_bins,
                      observed_frequency: calibration.observed_freq,
                      hit_rate: summary?.hit_rate ?? 0.74,
                      false_alarm_rate: summary?.false_alarm_rate ?? 0.18,
                    }}
                  />
                )}
              </div>

              {/* Model Versions Table */}
              {versions && <ModelVersionTable versions={versions} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
