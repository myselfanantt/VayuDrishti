"use client";
import { useEffect, useRef, useState } from "react";
import { INDIA_CENTER } from "@/lib/constants";

interface SpatialSkillMapProps {
  geojson?: any;
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

export default function SpatialSkillMap({ geojson }: SpatialSkillMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  // Ensure mapbox-gl script is injected if not already loaded
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).mapboxgl) {
      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js";
      script.async = true;
      script.onload = () => {
        setMapLoaded((prev) => !prev);
      };
      script.onerror = () => {
        setMapError(true);
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (typeof window === "undefined" || !(window as any).mapboxgl) {
      setMapError(true);
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    if (token.startsWith("pk.")) {
      mapboxgl.accessToken = token;
    }

    try {
      const styleConfig = token.startsWith("pk.")
        ? "mapbox://styles/mapbox/light-v11"
        : OSM_STYLE;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleConfig as any,
        center: INDIA_CENTER,
        zoom: 4.2,
        interactive: true,
      });

      map.on("load", () => {
        setMapLoaded(true);
      });

      map.on("error", () => {
        setMapError(true);
      });

      mapRef.current = map;
    } catch (e) {
      setMapError(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !geojson) return;

    try {
      if (map.getSource("spatial-auc")) {
        map.getSource("spatial-auc").setData(geojson);
      } else {
        map.addSource("spatial-auc", {
          type: "geojson",
          data: geojson,
        });

        // Add circle layer for Point features
        map.addLayer({
          id: "spatial-auc-circles",
          type: "circle",
          source: "spatial-auc",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3, 10,
              6, 24,
              10, 48
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "auc_roc"],
              0.65, "#EA4335",
              0.75, "#FBBC04",
              0.85, "#1A73E8",
              0.95, "#34A853",
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#FFFFFF",
          },
        });

        // Add text labels layer
        map.addLayer({
          id: "spatial-auc-labels",
          type: "symbol",
          source: "spatial-auc",
          layout: {
            "text-field": ["to-string", ["get", "auc_roc"]],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
          },
          paint: {
            "text-color": "#FFFFFF",
          },
        });
      }
    } catch (err) {
      console.error("Spatial map update error:", err);
    }
  }, [geojson, mapLoaded]);

  const getAucColor = (auc: number) => {
    if (auc >= 0.90) return "#34A853";
    if (auc >= 0.80) return "#1A73E8";
    if (auc >= 0.70) return "#FBBC04";
    return "#EA4335";
  };

  const featuresList = geojson?.features ?? [];

  return (
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
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#202124" }}>
            Spatial Skill Map (Per-Grid Cell AUC-ROC)
          </h3>
          <div style={{ fontSize: 12, color: "#5F6368", marginTop: 2 }}>
            Geographical performance distribution of forecast bust detection model across India.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#EA4335" }} />
            <span>&lt; 0.70</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#FBBC04" }} />
            <span>0.70 – 0.80</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#1A73E8" }} />
            <span>0.80 – 0.90</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#34A853" }} />
            <span>&gt; 0.90</span>
          </div>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 340,
          borderRadius: 6,
          overflow: "hidden",
          background: "#F8F9FA",
          position: "relative",
          border: "1px solid #DADCE0",
        }}
      >
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

        {/* Fallback / Interactive SVG Grid overlay when mapbox is rendering or unavailable */}
        {(!mapLoaded || mapError || !token.startsWith("pk.")) && (
          <div style={{ position: "absolute", inset: 0, background: "#F8F9FA", zIndex: 10 }}>
            <IndiaSpatialFallback geojson={geojson} />
          </div>
        )}

        {/* Floating breakdown card */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #DADCE0",
            borderRadius: 6,
            padding: "10px 14px",
            maxWidth: 240,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5F6368", marginBottom: 6 }}>
            REGIONAL AUC BREAKDOWN
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {featuresList.slice(0, 10).map((f: any, i: number) => {
              const props = f.properties ?? {};
              const color = getAucColor(props.auc_roc);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    padding: "2px 0",
                  }}
                >
                  <span style={{ color: "#202124", fontWeight: 500 }}>{props.region_name ?? "Region"}</span>
                  <span style={{ fontFamily: "Roboto Mono", fontWeight: 700, color }}>
                    {props.auc_roc?.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function IndiaSpatialFallback({ geojson }: { geojson?: any }) {
  const features = geojson?.features ?? [];
  const [hovered, setHovered] = useState<any | null>(null);

  const getAucColor = (auc: number) => {
    if (auc >= 0.90) return "#34A853";
    if (auc >= 0.80) return "#1A73E8";
    if (auc >= 0.70) return "#FBBC04";
    return "#EA4335";
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#F8F9FA" }}>
      <svg viewBox="0 0 400 340" style={{ width: "100%", height: "100%" }}>
        <text x="200" y="20" textAnchor="middle" style={{ fontSize: 11, fill: "#9AA0A6", fontWeight: 500 }}>
          India Domain — Per-Region AUC-ROC Skill Map
        </text>

        {/* Outline of India */}
        <path
          d="M 170 35 L 210 45 L 250 65 L 310 105 L 300 145 L 260 165 L 235 205 L 195 285 L 165 235 L 135 175 L 115 135 L 105 95 L 135 65 Z"
          fill="#EEF2F6"
          stroke="#CBD5E1"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {features.map((f: any, i: number) => {
          const coords = f.geometry?.coordinates ?? [80, 20];
          const props = f.properties ?? {};
          const lon = coords[0], lat = coords[1];
          const auc = props.auc_roc ?? 0.85;

          const x = ((lon - 65) / 35) * 320 + 35;
          const y = 320 - ((lat - 5) / 33) * 280;
          const color = getAucColor(auc);

          return (
            <g
              key={i}
              style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
              onMouseEnter={() => setHovered({ ...props, x, y })}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={16}
                fill={color}
                fillOpacity={0.9}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                style={{ fontSize: 9, fill: "#FFFFFF", fontWeight: 700, fontFamily: "Roboto Mono, monospace" }}
              >
                {auc.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
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
            {hovered.region_name ?? "Region"} ({hovered.region_id})
          </div>
          <div style={{ color: "#34A853", fontWeight: 700, fontSize: 13, marginTop: 2 }}>
            AUC-ROC: {hovered.auc_roc?.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}
