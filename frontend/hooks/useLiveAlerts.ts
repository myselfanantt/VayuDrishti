import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { LiveAlert } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useLiveAlerts() {
  const wsRef = useRef<WebSocket | null>(null);
  const addLiveAlert = useStore((s) => s.addLiveAlert);
  const liveAlerts = useStore((s) => s.liveAlerts);
  const setSystemStatus = useStore((s) => s.setSystemStatus);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_URL}/api/v1/ws/live-alerts`);
      wsRef.current = ws;

      ws.onopen = () => {
        setSystemStatus("live");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as LiveAlert;
          if (msg.type === "bust_alert" || msg.type === "confidence_update") {
            addLiveAlert(msg);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setSystemStatus("degraded");
        setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        setSystemStatus("offline");
        ws.close();
      };
    } catch {
      setSystemStatus("offline");
    }
  }, [addLiveAlert, setSystemStatus]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { liveAlerts };
}
