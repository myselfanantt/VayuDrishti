"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/layout/AlertBanner";
import BustEventCard from "@/components/cards/BustEventCard";
import SynopticTagBadge from "@/components/cards/SynopticTagBadge";
import { useBustDetections } from "@/hooks/useBustDetections";
import { RISK_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from "recharts";

const REGIONS = [
  "OD", "WB", "KL", "UK", "MH_KONK", "AP", "TS", "TN", "RJ", "UP", "GJ", "KA",
];
const SEVERITIES = ["CRITICAL", "HIGH", "MODERATE", "LOW"];

export default function BustTimelinePage() {
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
  const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { busts, stats, total, isLoading } = useBustDetections({
    region: selectedRegion,
    severity: selectedSeverity,
    days: 30,
    page,
    page_size: 20,
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const count = busts.filter((b) => {
      const d = new Date(b.event_date ?? b.created_at ?? "");
      return d.getMonth() + 1 === month;
    }).length;
    return { month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], count };
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <AlertBanner />
        <main style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "#F8F9FA" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#202124", marginBottom: 4 }}>
            Bust Event Timeline
          </h1>
          <p style={{ fontSize: 13, color: "#5F6368", marginBottom: 20 }}>
            Historical forecast bust detections — last 30 days · {total} total events
          </p>

          {/* Stats row */}
          {stats && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "CRITICAL", value: stats.critical_count, color: "#EA4335" },
                { label: "HIGH", value: stats.high_count, color: "#FF6D00" },
                { label: "MODERATE", value: stats.moderate_count, color: "#FBBC04" },
                { label: "LOW", value: stats.low_count, color: "#34A853" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="card"
                  style={{
                    padding: "12px 16px",
                    flex: 1,
                    minWidth: 100,
                    borderLeft: `3px solid ${s.color}`,
                  }}
                >
                  <div className="label-sm">{s.label}</div>
                  <div
                    className="value-xl"
                    style={{ color: s.color, marginTop: 2 }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* Monthly distribution */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Monthly Distribution</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9AA0A6" }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={3}>
                    {monthlyData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i >= 5 && i <= 8 ? "#EA4335" : i >= 9 || i <= 1 ? "#7C4DFF" : "#1A73E8"}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top regions */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top Affected Regions</h2>
              {stats?.top_affected_regions.map((r, i) => (
                <div
                  key={r.region_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: i < (stats.top_affected_regions.length - 1) ? "1px solid #F1F3F4" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#E8F0FE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1A73E8",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: "#202124" }}>{r.region_name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "Roboto Mono", color: "#EA4335" }}>
                      {r.count} events
                    </div>
                    <div style={{ fontSize: 10, color: "#9AA0A6" }}>
                      avg {(r.avg_prob * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500 }}>Filter:</span>
            <select
              value={selectedSeverity ?? ""}
              onChange={(e) => { setSelectedSeverity(e.target.value || undefined); setPage(1); }}
              className="input-base"
              style={{ width: "auto" }}
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={selectedRegion ?? ""}
              onChange={(e) => { setSelectedRegion(e.target.value || undefined); setPage(1); }}
              className="input-base"
              style={{ width: "auto" }}
            >
              <option value="">All Regions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {(selectedRegion || selectedSeverity) && (
              <button
                className="btn-secondary"
                onClick={() => { setSelectedRegion(undefined); setSelectedSeverity(undefined); setPage(1); }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Bust events grid */}
          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 6 }} />)}
            </div>
          ) : busts.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {busts.map((bust, i) => <BustEventCard key={bust.id ?? i} bust={bust} index={i} />)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </button>
                <span style={{ fontSize: 13, color: "#5F6368", alignSelf: "center" }}>
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button className="btn-secondary" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                  Next
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9AA0A6" }}>
              No bust events match the current filters
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
