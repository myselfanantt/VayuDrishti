"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import RegionHeader from "@/components/region/RegionHeader";
import UpcomingConfidenceChart from "@/components/region/UpcomingConfidenceChart";
import SeasonalHeatmap from "@/components/region/SeasonalHeatmap";
import RegionalDriversChart from "@/components/region/RegionalDriversChart";
import RegionBustHistory from "@/components/region/RegionBustHistory";
import { useRegionDetail } from "@/hooks/useRegionDetail";

const RegionMiniMap = dynamic(() => import("@/components/region/RegionMiniMap"), { ssr: false });

export default function RegionDetailPage({ params }: { params: { regionId: string } }) {
  const {
    detail,
    forecast,
    seasonal,
    drivers,
    history,
    districts,
    isLoading,
  } = useRegionDetail(params.regionId);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8F9FA" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", padding: 24, maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ height: 100, background: "#E0E0E0", borderRadius: 8 }} />
              <div style={{ height: 260, background: "#E0E0E0", borderRadius: 8 }} />
            </div>
          ) : (
            <>
              {detail && <RegionHeader detail={detail} />}

              {/* Upcoming Confidence Chart */}
              <UpcomingConfidenceChart data={forecast} />

              {/* Map & Seasonal Heatmap Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <RegionMiniMap
                  latBounds={detail?.lat_bounds}
                  lonBounds={detail?.lon_bounds}
                  districtsGeojson={districts}
                />
                {seasonal && <SeasonalHeatmap data={seasonal} />}
              </div>

              {/* Dominant Bust Drivers */}
              {drivers && <RegionalDriversChart drivers={drivers} />}

              {/* Bust Event History */}
              {history && <RegionBustHistory events={history} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
