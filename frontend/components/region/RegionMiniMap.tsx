"use client";
import { useEffect, useRef, useState } from "react";

interface RegionMiniMapProps {
  latBounds?: [number, number];
  lonBounds?: [number, number];
  districtsGeojson?: any;
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

export default function RegionMiniMap({ latBounds = [18, 22.5], lonBounds = [84, 87.5], districtsGeojson }: RegionMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

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
      const centerLat = (latBounds[0] + latBounds[1]) / 2;
      const centerLon = (lonBounds[0] + lonBounds[1]) / 2;

      const styleConfig = token.startsWith("pk.")
        ? "mapbox://styles/mapbox/light-v11"
        : OSM_STYLE;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleConfig as any,
        center: [centerLon, centerLat],
        zoom: 6.5,
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
  }, [token, latBounds, lonBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !districtsGeojson) return;

    try {
      if (map.getSource("districts")) {
        map.getSource("districts").setData(districtsGeojson);
      } else {
        map.addSource("districts", {
          type: "geojson",
          data: districtsGeojson,
        });

        // Determine geometry type
        const geomType = districtsGeojson?.features?.[0]?.geometry?.type ?? "Point";

        if (geomType === "Point") {
          map.addLayer({
            id: "districts-fill",
            type: "circle",
            source: "districts",
            paint: {
              "circle-radius": 14,
              "circle-color": [
                "match",
                ["get", "current_risk"],
                "CRITICAL", "#EA4335",
                "HIGH", "#FBBC04",
                "#1A73E8",
              ],
              "circle-opacity": 0.8,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#FFFFFF",
            },
          });
        } else {
          map.addLayer({
            id: "districts-fill",
            type: "fill",
            source: "districts",
            paint: {
              "fill-color": [
                "match",
                ["get", "current_risk"],
                "CRITICAL", "#EA4335",
                "HIGH", "#FBBC04",
                "#1A73E8",
              ],
              "fill-opacity": 0.4,
            },
          });

          map.addLayer({
            id: "districts-line",
            type: "line",
            source: "districts",
            paint: {
              "line-color": "#202124",
              "line-width": 1,
            },
          });
        }
      }
    } catch (e) {
      console.error("District layer update error:", e);
    }
  }, [districtsGeojson, mapLoaded]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADCE0",
        borderRadius: 8,
        padding: "16px 20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#202124" }}>
        Region Risk Map & District Boundaries
      </h3>
      <div
        style={{
          flex: 1,
          minHeight: 240,
          borderRadius: 6,
          overflow: "hidden",
          background: "#F1F3F4",
          border: "1px solid #DADCE0",
          position: "relative",
        }}
      >
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

        {(!mapLoaded || mapError || !token.startsWith("pk.")) && (
          <div style={{ position: "absolute", inset: 0, background: "#F8F9FA", zIndex: 10 }}>
            <MiniMapSvgFallback districtsGeojson={districtsGeojson} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMapSvgFallback({ districtsGeojson }: { districtsGeojson?: any }) {
  const features = districtsGeojson?.features ?? [];

  const getRiskColor = (risk: string) => {
    if (risk === "CRITICAL") return "#EA4335";
    if (risk === "HIGH") return "#FF6D00";
    if (risk === "MODERATE") return "#FBBC04";
    return "#34A853";
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#F8F9FA", padding: 12 }}>
      <svg viewBox="0 0 300 200" style={{ width: "100%", height: "100%" }}>
        <text x="150" y="20" textAnchor="middle" style={{ fontSize: 10, fill: "#5F6368", fontWeight: 600 }}>
          District Risk Distribution
        </text>

        {features.map((f: any, i: number) => {
          const coords = f.geometry?.coordinates ?? [85, 20];
          const props = f.properties ?? {};
          const lon = coords[0], lat = coords[1];
          const risk = props.current_risk ?? "MODERATE";
          const color = getRiskColor(risk);

          const x = 50 + (i % 4) * 65;
          const y = 55 + Math.floor(i / 4) * 45;

          return (
            <g key={i} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={14} fill={color} fillOpacity={0.85} stroke="#FFF" strokeWidth={1.5} />
              <text x={x} y={y + 3} textAnchor="middle" style={{ fontSize: 8, fill: "#FFF", fontWeight: 700 }}>
                {props.district_name?.slice(0, 3)?.toUpperCase() ?? `D${i+1}`}
              </text>
              <title>{`${props.district_name ?? "District"}: ${risk} Risk`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
