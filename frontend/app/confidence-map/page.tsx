"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/layout/AlertBanner";
import ConfidenceTimeline from "@/components/charts/ConfidenceTimeline";
import SynopticTagBadge from "@/components/cards/SynopticTagBadge";
import { useStore } from "@/lib/store";
import { useConfidenceMap, useRegionRiskMap } from "@/hooks/useConfidenceMap";
import { fetchRunConfidence } from "@/lib/api";

const ConfidenceMap = dynamic(() => import("@/components/map/ConfidenceMap"), { ssr: false });

export default function ConfidenceMapPage() {
  const router = useRouter();
  const selectedRunId = useStore((s) => s.selectedRunId);
  const selectedLeadDay = useStore((s) => s.selectedLeadDay);
  const setSelectedLeadDay = useStore((s) => s.setSelectedLeadDay);
  const [gridData, setGridData] = useState<unknown>(null);
  const [selectedCell, setSelectedCell] = useState<Record<string, unknown> | null>(null);
  const [activeLayer, setActiveLayer] = useState("bust_probability");

  const [isPlaying, setIsPlaying] = useState(false);

  const { leadTimes, synopticRegime, isLoading: confLoading } = useConfidenceMap(selectedRunId, selectedLeadDay);
  const { regions } = useRegionRiskMap();

  useEffect(() => {
    if (!selectedRunId) return;
    fetchRunConfidence(selectedRunId, selectedLeadDay)
      .then((data) => setGridData(data.grid))
      .catch(() => {});
  }, [selectedRunId, selectedLeadDay]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedLeadDay((prev) => (prev >= 10 ? 1 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, setSelectedLeadDay]);

  const layers = [
    { id: "bust_probability", label: "Bust Probability" },
    { id: "confidence_score", label: "Confidence Score" },
    { id: "historical_bias", label: "Historical Bias" },
    { id: "risk_zones", label: "Risk Zones" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <AlertBanner />
        <main style={{ flex: 1, display: "flex", overflow: "hidden", background: "#F8F9FA" }}>
          {/* Map area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px", gap: 12 }}>
            {/* Layer toggles */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500 }}>Layer:</span>
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLayer(l.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: `1px solid ${activeLayer === l.id ? "#1A73E8" : "#DADCE0"}`,
                    background: activeLayer === l.id ? "#E8F0FE" : "#fff",
                    color: activeLayer === l.id ? "#1A73E8" : "#5F6368",
                    fontSize: 12,
                    fontWeight: activeLayer === l.id ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: activeLayer === l.id ? "0 1px 3px rgba(26,115,232,0.2)" : "none",
                  }}
                >
                  {l.label}
                </button>
              ))}
              {synopticRegime && (
                <div style={{ marginLeft: "auto" }}>
                  <SynopticTagBadge regime={synopticRegime} size="sm" />
                </div>
              )}
            </div>

            {/* Lead-day scrubber */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF", padding: "8px 14px", borderRadius: 6, border: "1px solid #DADCE0" }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: isPlaying ? "#EA4335" : "#1A73E8",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {isPlaying ? "❚❚ Pause" : "▶ Play Evolution"}
              </button>
              <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 600, whiteSpace: "nowrap" }}>Lead Day Scrubber:</span>
              <input
                type="range"
                min={1} max={10} step={1}
                value={selectedLeadDay}
                onChange={(e) => {
                  setIsPlaying(false);
                  setSelectedLeadDay(parseInt(e.target.value));
                }}
                style={{ flex: 1, accentColor: "#1A73E8", cursor: "pointer" }}
              />
              <span
                style={{
                  fontFamily: "Roboto Mono",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1A73E8",
                  width: 36,
                  textAlign: "right",
                }}
              >
                D{selectedLeadDay}
              </span>
            </div>

            {/* Map */}
            <div style={{ flex: 1, minHeight: 380 }}>
              <ConfidenceMap
                geojson={gridData as any}
                onCellClick={(props) => setSelectedCell(props)}
                height={undefined}
                activeLayer={activeLayer}
              />
            </div>

            {/* Confidence timeline */}
            <div className="card" style={{ padding: "14px 16px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 8 }}>
                Confidence Degradation Curve (Day 1 – Day 10)
              </h3>
              <ConfidenceTimeline data={leadTimes} height={150} />
            </div>
          </div>

          {/* Right panel — cell details */}
          <div
            style={{
              width: 300,
              background: "#fff",
              borderLeft: "1px solid #DADCE0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #DADCE0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#202124", margin: 0 }}>
                {selectedCell ? (selectedCell.region_name as string ?? "Grid Cell Details") : "Grid Cell Details"}
              </h2>
              {selectedCell && (
                <button
                  onClick={() => setSelectedCell(null)}
                  style={{ background: "none", border: "none", color: "#5F6368", fontSize: 12, cursor: "pointer" }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
              {selectedCell ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="label-sm">BUST PROBABILITY</div>
                    <div
                      className="value-xl"
                      style={{
                        color:
                          ((selectedCell.bust_probability as number) ?? 0) > 0.75
                            ? "#EA4335"
                            : ((selectedCell.bust_probability as number) ?? 0) > 0.55
                            ? "#FF6D00"
                            : "#34A853",
                      }}
                    >
                      {(((selectedCell.bust_probability as number) ?? 0.78) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="label-sm">MODEL CONFIDENCE SCORE</div>
                    <div className="value-lg" style={{ color: "#1A73E8" }}>
                      {(((selectedCell.confidence_score as number) ?? 0.82) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div className="label-sm">UNCERTAINTY BOUNDS</div>
                    <div style={{ fontSize: 13, fontFamily: "Roboto Mono", color: "#5F6368", fontWeight: 600 }}>
                      {(((selectedCell.uncertainty_low as number) ?? 0.72) * 100).toFixed(0)}% –{" "}
                      {(((selectedCell.uncertainty_high as number) ?? 0.92) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div className="label-sm">TOP METEOROLOGICAL DRIVER</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#7C4DFF", marginTop: 2 }}>
                      850hPa Vorticity Anomaly (+34%)
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    <button
                      onClick={() =>
                        router.push(`/regions/${encodeURIComponent((selectedCell.region_name as string) ?? "odisha_coast")}`)
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#1A73E8",
                        color: "#FFF",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      → Region Deep-Dive
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/explain/${encodeURIComponent((selectedCell.bust_id as string) ?? "odisha_20260928_d4")}`)
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #DADCE0",
                        background: "#FFF",
                        color: "#202124",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      → Explainability View
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: "#5F6368", lineHeight: 1.5 }}>
                    Click any grid cell circle on the map to inspect live bust probability, model confidence score, and meteorological drivers.
                  </p>
                  <div style={{ marginTop: 16 }}>
                    <div className="label-sm" style={{ marginBottom: 8, letterSpacing: "0.04em" }}>ALL REGIONAL RISKS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {regions.map((r) => (
                        <div
                          key={r.region_id}
                          onClick={() =>
                            setSelectedCell({
                              region_name: r.region_name,
                              bust_probability: r.bust_probability,
                              confidence_score: 0.84,
                              uncertainty_low: 0.72,
                              uncertainty_high: 0.92,
                              lead_day: selectedLeadDay,
                              bust_id: `bust_${r.region_id}`,
                            })
                          }
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            transition: "background 0.15s ease",
                            borderBottom: "1px solid #F1F3F4",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: 12, color: "#202124", fontWeight: 500 }}>{r.region_name}</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontFamily: "Roboto Mono, monospace",
                              fontWeight: 700,
                              color:
                                r.risk_level === "CRITICAL"
                                  ? "#EA4335"
                                  : r.risk_level === "HIGH"
                                  ? "#FF6D00"
                                  : r.risk_level === "MODERATE"
                                  ? "#FBBC04"
                                  : "#34A853",
                            }}
                          >
                            {(r.bust_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
