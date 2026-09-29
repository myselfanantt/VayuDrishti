"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/layout/AlertBanner";
import ConfidenceTimeline from "@/components/charts/ConfidenceTimeline";
import BustEventCard from "@/components/cards/BustEventCard";
import RegionRiskCard from "@/components/cards/RegionRiskCard";
import SynopticTagBadge from "@/components/cards/SynopticTagBadge";
import { useStore } from "@/lib/store";
import { useRecentBusts } from "@/hooks/useBustDetections";
import { useRegionRiskMap, useConfidenceMap } from "@/hooks/useConfidenceMap";
import { useSynopticContext } from "@/hooks/useSynopticContext";
import { SYNOPTIC_LABELS } from "@/lib/constants";
import type { RegionRisk } from "@/lib/types";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: "16px 18px", flex: 1, minWidth: 120 }}>
      <div className="label-sm">{label}</div>
      <div
        className="value-xl"
        style={{ marginTop: 4, color: color ?? "#202124" }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const selectedRunId = useStore((s) => s.selectedRunId);
  const { busts: recentBusts, isLoading: bustsLoading } = useRecentBusts(12);
  const { regions, isLoading: regionsLoading } = useRegionRiskMap();
  const { leadTimes, isLoading: confLoading, synopticRegime } = useConfidenceMap(selectedRunId, 1);
  const { regime, regimeLabel } = useSynopticContext();

  const highRiskRegions = regions.filter((r) => r.risk_level === "HIGH" || r.risk_level === "CRITICAL").slice(0, 5);
  const criticalBusts = recentBusts.filter((b) => b.severity === "CRITICAL" || b.severity === "HIGH").slice(0, 8);
  const avgConfidence = leadTimes.length > 0 ? leadTimes.reduce((s, d) => s + d.mean_confidence, 0) / leadTimes.length : 0;
  const maxBustProb = leadTimes.length > 0 ? Math.max(...leadTimes.map((d) => d.bust_probability)) : 0;
  const activeSynopticEvents = synopticRegime
    ? [synopticRegime, "western_disturbance"].filter((r) => r !== "normal")
    : ["active_monsoon", "western_disturbance"];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <AlertBanner />
        <main style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "#F8F9FA" }}>
          {/* Page title */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#202124" }}>
              Operational Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "#5F6368", marginTop: 2 }}>
              AI-driven forecast bust detection · India domain · NCMRWF
            </p>
          </div>

          {/* Top stats row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <StatCard
              label="MAX BUST PROBABILITY"
              value={`${(maxBustProb * 100).toFixed(1)}%`}
              sub="Across all lead days"
              color={maxBustProb > 0.75 ? "#EA4335" : maxBustProb > 0.55 ? "#FF6D00" : "#202124"}
            />
            <StatCard
              label="MEAN CONFIDENCE"
              value={`${(avgConfidence * 100).toFixed(1)}%`}
              sub="Day 1–10 average"
              color="#1A73E8"
            />
            <StatCard
              label="HIGH RISK REGIONS"
              value={highRiskRegions.length}
              sub="CRITICAL + HIGH"
              color={highRiskRegions.length > 3 ? "#EA4335" : "#FF6D00"}
            />
            <StatCard
              label="RECENT BUSTS"
              value={recentBusts.length}
              sub="Last 7 days"
            />
          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Confidence timeline */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>
                  Confidence Timeline — Day 1 to 10
                </h2>
                <p style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
                  Bust probability with uncertainty bands
                </p>
              </div>
              {confLoading ? (
                <div className="skeleton" style={{ height: 220, borderRadius: 4 }} />
              ) : (
                <ConfidenceTimeline data={leadTimes} height={220} />
              )}
            </div>

            {/* Active synoptic events */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ padding: "16px 18px" }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#202124", marginBottom: 10 }}>
                  Active Synoptic Events
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {activeSynopticEvents.map((e) => (
                    <SynopticTagBadge key={e} regime={e} />
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#F8F9FA", borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#202124", marginBottom: 4 }}>
                    Dominant Regime
                  </div>
                  <div style={{ fontSize: 12, color: "#5F6368", lineHeight: 1.6 }}>
                    {SYNOPTIC_LABELS[synopticRegime ?? "active_monsoon"] ?? "Active Southwest Monsoon"}.
                    Historical model skill during this regime: MAE bias +18–32 mm/day over
                    east-central India. Bust probability elevated on Days 3–6.
                  </div>
                </div>
              </div>

              {/* High risk regions mini-list */}
              <div className="card" style={{ padding: "16px 18px", flex: 1 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#202124", marginBottom: 10 }}>
                  High Risk Regions
                </h2>
                {regionsLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 6 }} />)}
                  </div>
                ) : highRiskRegions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {highRiskRegions.map((r) => <RegionRiskCard key={r.region_id} region={r} />)}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#9AA0A6", padding: "20px 0", textAlign: "center" }}>
                    No high-risk regions detected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent busts list */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>
                Recent Bust Detections
              </h2>
              <span style={{ fontSize: 12, color: "#5F6368" }}>
                {criticalBusts.length} critical/high severity events
              </span>
            </div>
            {bustsLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 6 }} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {criticalBusts.map((bust, i) => (
                  <BustEventCard key={bust.id ?? i} bust={bust} index={i} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
