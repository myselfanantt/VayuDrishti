"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import { RISK_COLORS } from "@/lib/constants";
import type { LiveAlert } from "@/lib/types";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: "/confidence-map",
    label: "Confidence Map",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    href: "/bust-timeline",
    label: "Bust Timeline",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: "/model-performance",
    label: "Model Performance",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alert Management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

function AlertItem({ alert }: { alert: LiveAlert }) {
  const prob = alert.bust_probability ?? (alert.payload?.bust_probability as number) ?? 0;
  const severity = alert.severity ?? (alert.payload?.severity as string) ?? "MODERATE";
  const region = alert.region_name ?? (alert.payload?.region_name as string) ?? "Unknown";
  const color = RISK_COLORS[severity] ?? "#FBBC04";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-3 py-2 border-l-2"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, fontWeight: 600, color }} className="uppercase">
          {severity}
        </span>
        <span style={{ fontSize: 11, color: "#9AA0A6", fontFamily: "Roboto Mono, monospace" }}>
          {(prob * 100).toFixed(0)}%
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#202124", marginTop: 1 }}>{region}</div>
    </motion.div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const { liveAlerts } = useLiveAlerts();
  const bustAlerts = liveAlerts.filter((a) => a.type === "bust_alert").slice(0, 6);

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 64 : 240,
        minWidth: sidebarCollapsed ? 64 : 240,
        background: "#fff",
        borderRight: "1px solid #DADCE0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
        transition: "all 0.2s ease",
        zIndex: 10,
      }}
    >
      {/* Logo Header - Clickable to toggle sidebar */}
      <div
        onClick={toggleSidebar}
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: sidebarCollapsed ? "0 18px" : "0 20px",
          borderBottom: "1px solid #DADCE0",
          gap: 12,
          flexShrink: 0,
          cursor: "pointer",
        }}
        title={sidebarCollapsed ? "Click to expand sidebar" : "Click to collapse sidebar"}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: "#1A73E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          V
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#202124", letterSpacing: -0.3 }}>
              VayuDrishti
            </div>
            <div style={{ fontSize: 10, color: "#9AA0A6", marginTop: -1 }}>NCMRWF · MoES</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 8px", flexShrink: 0 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                gap: 12,
                padding: sidebarCollapsed ? "10px 0" : "9px 12px",
                borderRadius: 6,
                border: "none",
                background: isActive ? "#E8F0FE" : "transparent",
                color: isActive ? "#1A73E8" : "#5F6368",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
                marginBottom: 4,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget.style.background = "#F1F3F4");
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget.style.background = "transparent");
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </div>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Live Alerts Feed */}
      {!sidebarCollapsed && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div className="alert-dot" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5F6368", letterSpacing: "0.06em" }}>
              LIVE ALERTS
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {bustAlerts.length === 0 ? (
              <div style={{ padding: "12px 16px", fontSize: 12, color: "#9AA0A6" }}>
                No active alerts
              </div>
            ) : (
              bustAlerts.map((alert, i) => <AlertItem key={i} alert={alert} />)
            )}
          </div>
        </div>
      )}

      {/* Bottom status */}
      {!sidebarCollapsed && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #DADCE0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: "#34A853", fontWeight: 500 }}>System Online</span>
        </div>
      )}
    </aside>
  );
}
