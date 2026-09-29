"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ActiveAlertList from "@/components/alerts/ActiveAlertList";
import AlertRuleCard from "@/components/alerts/AlertRuleCard";
import NewAlertRuleModal from "@/components/alerts/NewAlertRuleModal";
import AlertVolumeChart from "@/components/alerts/AlertVolumeChart";
import AlertAccuracyDonut from "@/components/alerts/AlertAccuracyDonut";
import AlertHistoryTable from "@/components/alerts/AlertHistoryTable";
import { useAlerts } from "@/hooks/useAlerts";

export default function AlertsPage() {
  const [historyFilters, setHistoryFilters] = useState<{ region?: string; severity?: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    activeAlerts,
    rules,
    history,
    volumeStats,
    accuracyStats,
    isLoading,
    handleAcknowledge,
    handleCreateRule,
    handleDeleteRule,
  } = useAlerts(historyFilters);

  const acknowledgedTodayCount = 12;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FA" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", padding: 24, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>
                Alert Management
              </h1>
              <div style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
                {activeAlerts.length} active | {acknowledgedTodayCount} acknowledged today
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "#1A73E8",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + New Rule
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ height: 160, background: "#E0E0E0", borderRadius: 8 }} />
              <div style={{ height: 200, background: "#E0E0E0", borderRadius: 8 }} />
            </div>
          ) : (
            <>
              {/* Active Alerts */}
              <ActiveAlertList alerts={activeAlerts} onAcknowledge={handleAcknowledge} />

              {/* Alert Rules Section */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #DADCE0",
                  borderRadius: 8,
                  padding: "16px 20px",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
                    Alert Rules — Threshold Configuration
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rules.map((rule) => (
                    <AlertRuleCard key={rule.rule_id} rule={rule} onDelete={handleDeleteRule} />
                  ))}
                </div>
              </div>

              {/* Volume & Accuracy Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <AlertVolumeChart data={volumeStats} />
                <AlertAccuracyDonut stats={accuracyStats} />
              </div>

              {/* History Table */}
              <AlertHistoryTable history={history} onFilterChange={setHistoryFilters} />

              {/* New Rule Modal */}
              <NewAlertRuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateRule}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
