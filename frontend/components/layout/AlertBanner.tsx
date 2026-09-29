"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { RISK_COLORS } from "@/lib/constants";
import type { LiveAlert } from "@/lib/types";

export default function AlertBanner() {
  const liveAlerts = useStore((s) => s.liveAlerts);
  const latestCritical = liveAlerts.find(
    (a) => a.type === "bust_alert" && (a.severity === "CRITICAL" || (a.payload?.severity as string) === "CRITICAL")
  );

  return (
    <AnimatePresence>
      {latestCritical && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "#FEE8E7",
            borderBottom: "2px solid #EA4335",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 20px",
            }}
          >
            <div className="alert-dot" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#C5221F" }}>
              CRITICAL BUST ALERT
            </span>
            <span style={{ fontSize: 13, color: "#C5221F" }}>
              {latestCritical.region_name ?? (latestCritical.payload?.region_name as string) ?? "Unknown Region"} ·{" "}
              Lead Day {latestCritical.lead_day ?? (latestCritical.payload?.lead_day as number) ?? "?"} ·{" "}
              {((latestCritical.bust_probability ?? (latestCritical.payload?.bust_probability as number) ?? 0) * 100).toFixed(0)}% bust probability
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
