"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { fetchForecastRuns } from "@/lib/api";
import type { ForecastRun } from "@/lib/types";

export default function TopBar() {
  const [runs, setRuns] = useState<ForecastRun[]>([]);
  const selectedRunId = useStore((s) => s.selectedRunId);
  const setSelectedRunId = useStore((s) => s.setSelectedRunId);
  const setForecastRuns = useStore((s) => s.setForecastRuns);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const systemStatus = useStore((s) => s.systemStatus);

  useEffect(() => {
    fetchForecastRuns(1, 10).then((data) => {
      setRuns(data.runs);
      setForecastRuns(data.runs);
      if (!selectedRunId && data.runs.length > 0) {
        setSelectedRunId(data.runs[0].run_id);
      }
    }).catch(() => {});
  }, [setSelectedRunId, setForecastRuns, selectedRunId]);

  const statusColor = systemStatus === "live" ? "#34A853" : systemStatus === "degraded" ? "#FBBC04" : "#EA4335";
  const statusLabel = systemStatus === "live" ? "Live" : systemStatus === "degraded" ? "Degraded" : "Offline";

  const selectedRun = runs.find((r) => r.run_id === selectedRunId);

  return (
    <header
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #DADCE0",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      {/* Toggle sidebar */}
      <button
        onClick={toggleSidebar}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          color: "#5F6368",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
        }}
        title="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Run selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#5F6368", fontWeight: 500 }}>Forecast Run:</span>
        <select
          value={selectedRunId ?? ""}
          onChange={(e) => setSelectedRunId(e.target.value)}
          style={{
            border: "1px solid #DADCE0",
            borderRadius: 6,
            padding: "5px 28px 5px 10px",
            fontSize: 13,
            fontFamily: "Roboto Mono, monospace",
            background: "#fff",
            color: "#202124",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {runs.map((r) => (
            <option key={r.run_id} value={r.run_id}>
              {r.model_name} · {new Date(r.init_time).toUTCString().slice(5, 22)} UTC
            </option>
          ))}
        </select>
      </div>

      {/* Model badge */}
      {selectedRun && (
        <div
          style={{
            padding: "3px 10px",
            background: "#E8F0FE",
            borderRadius: 4,
            fontSize: 12,
            color: "#1A73E8",
            fontWeight: 600,
          }}
        >
          {selectedRun.model_name} · 0.25°
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* System status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: statusColor,
            animation: systemStatus === "live" ? "pulse-dot 2s ease-in-out infinite" : "none",
          }}
        />
        <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>
          {statusLabel}
        </span>
      </div>

      {/* VayuDrishti wordmark */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A73E8", letterSpacing: -0.3 }}>
        SIH 2026 · Problem 26079
      </div>

      {/* User Profile Dropdown */}
      <UserProfileMenu />
    </header>
  );
}

function UserProfileMenu() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const loginUser = useStore((s) => s.loginUser);
  const logoutUser = useStore((s) => s.logoutUser);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSysInfoOpen, setIsSysInfoOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editable user state
  const [userProfile, setUserProfile] = useState({
    name: user?.name ?? "Dr. Suraj Zaware",
    displayTitle: user?.name?.split(" ")[0] ?? "Dr. Suraj",
    role: user?.role ?? "Senior Scientist",
    department: user?.organization ?? "NCMRWF / MoES",
    designation: "Operational Forecaster",
  });

  const [editForm, setEditForm] = useState(userProfile);

  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name,
        displayTitle: user.name.split(" ")[0],
        role: user.role,
        department: user.organization,
        designation: "Operational Forecaster",
      });
      setEditForm({
        name: user.name,
        displayTitle: user.name.split(" ")[0],
        role: user.role,
        department: user.organization,
        designation: "Operational Forecaster",
      });
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile(editForm);

    const updatedUser = {
      id: user?.id ?? "usr_2607",
      name: editForm.name,
      email: user?.email ?? "suraj.zaware@ncmrwf.gov.in",
      role: editForm.role,
      organization: editForm.department,
      initials: getInitials(editForm.name),
    };

    loginUser(updatedUser);
    setIsEditModalOpen(false);
    showToast("✓ Profile updated successfully");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logoutUser();
    router.push("/");
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#202124",
            color: "#FFF",
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 8px 4px 4px",
          background: isOpen ? "#F1F3F4" : "transparent",
          borderRadius: 20,
          border: "1px solid #DADCE0",
          cursor: "pointer",
          outline: "none",
          transition: "background 0.15s ease",
        }}
        title="User Profile & Settings"
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1A73E8, #7C4DFF)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {user?.initials ?? getInitials(userProfile.name)}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#202124" }}>
          {userProfile.displayTitle}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5F6368" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 42,
              width: 270,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              border: "1px solid #DADCE0",
              padding: "12px 0",
              zIndex: 50,
            }}
          >
            {/* User Header */}
            <div style={{ padding: "0 16px 12px 16px", borderBottom: "1px solid #F1F3F4" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#202124" }}>
                {user?.name ?? userProfile.name}
              </div>
              <div style={{ fontSize: 11, color: "#5F6368", marginTop: 2 }}>
                {user?.role ?? userProfile.role} · {user?.organization ?? userProfile.department}
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "2px 8px",
                  background: "#E8F0FE",
                  color: "#1A73E8",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 4,
                }}
              >
                {userProfile.designation}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ padding: "8px 0" }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setEditForm(userProfile);
                  setIsEditModalOpen(true);
                }}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#202124",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Edit Profile</span>
                <span style={{ fontSize: 11, color: "#1A73E8", fontWeight: 600 }}>Edit</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !notifications;
                  setNotifications(nextState);
                  showToast(nextState ? "🔔 Live Push Notifications Enabled" : "🔕 Notifications Disabled");
                }}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#202124",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>Live Push Notifications</span>
                <span style={{ fontSize: 11, color: notifications ? "#34A853" : "#EA4335", fontWeight: 700 }}>
                  {notifications ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSysInfoOpen(true);
                }}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#202124",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>NCMRWF System Info</span>
                <span style={{ fontSize: 10, color: "#5F6368" }}>v1.0.0</span>
              </button>
            </div>

            <div style={{ borderTop: "1px solid #F1F3F4", paddingTop: 6 }}>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#EA4335",
                  fontWeight: 600,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FCE8E6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Log Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* SYSTEM INFO MODAL */}
      {isSysInfoOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setIsSysInfoOpen(false)}
        >
          <div
            style={{
              width: 440,
              background: "#FFF",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
              border: "1px solid #DADCE0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🖥️</span>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#202124" }}>
                  NCMRWF Operational Telemetry
                </h3>
              </div>
              <button
                onClick={() => setIsSysInfoOpen(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#5F6368" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: "#3C4043" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F3F4" }}>
                <span style={{ color: "#5F6368" }}>Operational Model:</span>
                <span style={{ fontWeight: 700, fontFamily: "Roboto Mono" }}>NCUM / GFS (0.25° × 0.25°)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F3F4" }}>
                <span style={{ color: "#5F6368" }}>AI/ML Diagnostic Engine:</span>
                <span style={{ fontWeight: 700, color: "#1A73E8" }}>PyTorch 2.1 + SHAP XAI</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F3F4" }}>
                <span style={{ color: "#5F6368" }}>Backend Telemetry API:</span>
                <span style={{ fontWeight: 700, color: "#34A853" }}>FastAPI v0.109 (Active 200 OK)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F3F4" }}>
                <span style={{ color: "#5F6368" }}>Domain Resolution:</span>
                <span style={{ fontWeight: 700 }}>India & Indian Ocean (5°N–38°N)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#5F6368" }}>Challenge Context:</span>
                <span style={{ fontWeight: 700, color: "#EA580C" }}>SIH 2026 — Problem ID 26079</span>
              </div>
            </div>

            <button
              onClick={() => setIsSysInfoOpen(false)}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "8px",
                borderRadius: 6,
                border: "none",
                background: "#1A73E8",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close Telemetry Window
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            style={{
              width: 400,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#202124" }}>Edit Scientist Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#5F6368" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Header Display Title
                </label>
                <input
                  type="text"
                  value={editForm.displayTitle}
                  onChange={(e) => setEditForm({ ...editForm, displayTitle: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Role / Position
                </label>
                <input
                  type="text"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Department / Organization
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5F6368", marginBottom: 4 }}>
                  Operational Designation
                </label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    fontSize: 13,
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #DADCE0",
                    background: "#fff",
                    color: "#5F6368",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "#1A73E8",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
