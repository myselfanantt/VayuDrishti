"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { INDIA_CENTER, INDIA_ZOOM, RISK_COLORS } from "@/lib/constants";

declare const mapboxgl: any;

interface ConfidenceMapProps {
  geojson?: unknown;
  regionGeojson?: unknown;
  onCellClick?: (props: Record<string, unknown>) => void;
  height?: number;
  activeLayer?: string;
}

const OSM_STYLE = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function ConfidenceMap({
  geojson,
  regionGeojson,
  onCellClick,
  height = 500,
  activeLayer = "bust_probability",
}: ConfidenceMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const selectedLeadDay = useStore((s) => s.selectedLeadDay);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  // Dynamic script loader for Mapbox GL
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).mapboxgl) {
      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js";
      script.async = true;
      script.onload = () => {
        setMapLoaded((prev) => !prev);
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (typeof window === "undefined" || !(window as any).mapboxgl) {
      setMapError("Mapbox GL loading...");
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    if (token.startsWith("pk.")) {
      mapboxgl.accessToken = token;
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: token.startsWith("pk.")
          ? "mapbox://styles/mapbox/light-v11"
          : (OSM_STYLE as any),
        center: INDIA_CENTER,
        zoom: INDIA_ZOOM,
        minZoom: 3,
        maxZoom: 10,
      });

      map.on("load", () => {
        setMapLoaded(true);
        mapRef.current = map;
      });

      map.on("error", (e: any) => {
        if (e.error?.status === 401) {
          setMapError("Map token invalid — showing grid overlay only");
        }
      });
    } catch (err) {
      setMapError("Map initialization failed");
    }
  }, [token]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !geojson) return;
    const map = mapRef.current as any;
    try {
      const getPaintColor = () => {
        if (activeLayer === "confidence_score") {
          return [
            "interpolate", ["linear"], ["get", "confidence_score"],
            0.4, "#D2E3FC", 0.65, "#8AB4F8", 0.8, "#4285F4", 0.95, "#1A73E8"
          ];
        }
        if (activeLayer === "historical_bias") {
          return [
            "interpolate", ["linear"], ["get", "historical_bias"],
            0.2, "#E8D0FF", 0.4, "#B388FF", 0.6, "#7C4DFF"
          ];
        }
        if (activeLayer === "risk_zones") {
          return [
            "step", ["get", "bust_probability"],
            "#34A853", 0.55, "#FBBC04", 0.75, "#EA4335"
          ];
        }
        return [
          "interpolate", ["linear"], ["get", "bust_probability"],
          0, "#34A853", 0.3, "#FBBC04", 0.55, "#FF6D00", 0.75, "#EA4335", 1.0, "#B71C1C"
        ];
      };

      if (map.getSource("bust-probability")) {
        map.getSource("bust-probability").setData(geojson);
        map.setPaintProperty("bust-probability-circles", "circle-color", getPaintColor());
      } else {
        map.addSource("bust-probability", { type: "geojson", data: geojson });
        map.addLayer({
          id: "bust-probability-circles",
          type: "circle",
          source: "bust-probability",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 8, 14],
            "circle-color": getPaintColor(),
            "circle-opacity": 0.8,
          },
        });

        const popup = new (window as any).mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        map.on("mouseenter", "bust-probability-circles", (e: any) => {
          map.getCanvas().style.cursor = "pointer";
          const props = e.features[0].properties;
          const prob = ((props.bust_probability ?? 0) * 100).toFixed(1);
          const conf = ((props.confidence_score ?? 0) * 100).toFixed(1);
          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:Roboto Mono,monospace;font-size:12px;color:#fff;background:#202124;padding:6px 10px;border-radius:4px">
                <div style="font-weight:700;font-size:13px;color:#FBBC04">${props.region_name ?? "Grid Cell"}</div>
                <div style="color:#DADCE0">${prob}% Bust Risk | Conf: ${conf}%</div>
                <div style="color:#9AA0A6;font-size:10px">Lead Day ${props.lead_day ?? selectedLeadDay}</div>
              </div>
            `)
            .addTo(map);
        });

        map.on("mouseleave", "bust-probability-circles", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });

        map.on("click", "bust-probability-circles", (e: any) => {
          if (onCellClick) onCellClick(e.features[0].properties);
        });
      }
    } catch (err) {
      console.error("Map layer update error:", err);
    }
  }, [geojson, mapLoaded, onCellClick, selectedLeadDay, activeLayer]);

  return (
    <div style={{ position: "relative", height: height ?? "100%", borderRadius: 8, overflow: "hidden", border: "1px solid #DADCE0" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Fallback grid overlay when mapbox is loading or demo */}
      {(mapError || !token.startsWith("pk.") || !mapLoaded) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#F8F9FA",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <IndiaGridFallback
            geojson={geojson as any}
            onCellClick={onCellClick}
            activeLayer={activeLayer}
            selectedLeadDay={selectedLeadDay}
          />
        </div>
      )}

      {/* Color scale legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #DADCE0",
          borderRadius: 6,
          padding: "10px 12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: "#5F6368", marginBottom: 6, textTransform: "uppercase" }}>
          {activeLayer.replace(/_/g, " ")}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["#34A853", "#FBBC04", "#FF6D00", "#EA4335"].map((color, i) => (
            <div key={i}>
              <div style={{ width: 20, height: 8, background: color, borderRadius: 2 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9AA0A6", marginTop: 3 }}>
          <span>Low</span><span>Med</span><span>High</span>
        </div>
      </div>

      {/* Lead day badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid #DADCE0",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#1A73E8",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      >
        Day {selectedLeadDay} Forecast Grid
      </div>
    </div>
  );
}

function IndiaGridFallback({
  geojson,
  onCellClick,
  activeLayer = "bust_probability",
  selectedLeadDay = 1,
}: {
  geojson?: { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }> } | null;
  onCellClick?: (props: Record<string, unknown>) => void;
  activeLayer?: string;
  selectedLeadDay?: number;
}) {
  const features = geojson?.features ?? [];
  const [hoveredProp, setHoveredProp] = useState<any | null>(null);

  const getCellColor = (prob: number, conf: number, bias: number) => {
    if (activeLayer === "confidence_score") {
      if (conf >= 0.85) return "#1A73E8";
      if (conf >= 0.70) return "#4285F4";
      if (conf >= 0.50) return "#8AB4F8";
      return "#D2E3FC";
    }
    if (activeLayer === "historical_bias") {
      if (bias >= 0.6) return "#7C4DFF";
      if (bias >= 0.4) return "#B388FF";
      return "#E8D0FF";
    }
    if (activeLayer === "risk_zones") {
      if (prob >= 0.75) return "#EA4335";
      if (prob >= 0.55) return "#FBBC04";
      return "#34A853";
    }
    // Default: bust_probability
    if (prob >= 0.75) return "#EA4335";
    if (prob >= 0.55) return "#FF6D00";
    if (prob >= 0.30) return "#FBBC04";
    return "#34A853";
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#F8F9FA" }}>
      <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%" }}>
        <text x="200" y="20" textAnchor="middle" style={{ fontSize: 11, fill: "#9AA0A6", fontWeight: 500 }}>
          India Domain — 0.25° × 0.25° Grid (Click any cell to inspect)
        </text>

        {features.slice(0, 500).map((f, i) => {
          const coords = f.geometry?.coordinates as number[] | undefined;
          if (!coords) return null;
          const lon = coords[0], lat = coords[1];
          const props = f.properties ?? {};
          const prob = (props.bust_probability as number) ?? 0.5;
          const conf = (props.confidence_score as number) ?? 0.8;
          const bias = (props.historical_rmse as number) ?? 0.4;

          const x = ((lon - 65) / 35) * 370 + 15;
          const y = 380 - ((lat - 5) / 33) * 360;
          const color = getCellColor(prob, conf, bias);

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill={color}
              fillOpacity={0.8}
              stroke="#FFF"
              strokeWidth={0.5}
              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
              onMouseEnter={() => setHoveredProp({ ...props, lon, lat })}
              onMouseLeave={() => setHoveredProp(null)}
              onClick={() => onCellClick?.({ ...props, lon, lat, lead_day: selectedLeadDay })}
            >
              <title>{`Lat: ${lat.toFixed(1)}°, Lon: ${lon.toFixed(1)}° | Risk: ${(prob * 100).toFixed(0)}%`}</title>
            </circle>
          );
        })}

        {/* Boundary outline */}
        <path
          d="M 15 380 L 15 30 L 385 30 L 385 380 Z"
          fill="none"
          stroke="#DADCE0"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredProp && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#202124",
            color: "#FFF",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          <div style={{ fontWeight: 700, color: "#FBBC04" }}>
            Bust Risk: {((hoveredProp.bust_probability ?? 0.7) * 100).toFixed(1)}%
          </div>
          <div style={{ color: "#DADCE0", fontSize: 11, marginTop: 2 }}>
            Region: {hoveredProp.region_name ?? "India Grid"} (D{selectedLeadDay})
          </div>
          <div style={{ color: "#9AA0A6", fontSize: 11 }}>
            Confidence: {((hoveredProp.confidence_score ?? 0.8) * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  );
}
