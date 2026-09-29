"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import AuthModal from "@/components/auth/AuthModal";

export default function RootLandingPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const logoutUser = useStore((s) => s.logoutUser);

  const [activeTab, setActiveTab] = useState("home");
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [highContrast, setHighContrast] = useState(false);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: highContrast ? "#000000" : "#0A1220",
        color: highContrast ? "#FFFFFF" : "#0F172A",
        filter: highContrast ? "contrast(1.2)" : "none",
      }}
    >
      {/* TOP BAR 1 — Government Banner */}
      <div
        style={{
          background: "#030712",
          color: "#9CA3AF",
          fontSize: 11,
          padding: "4px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 600, color: "#E5E7EB", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>🇮🇳</span> भारत सरकार | Government of India
          </span>
          <span style={{ color: "#4B5563" }}>|</span>
          <span style={{ color: "#D1D5DB" }}>Ministry of Earth Sciences</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="#main-content" style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 11 }}>
            Skip to Main Content
          </a>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => setFontSize("normal")}
              style={{
                background: "none",
                border: "none",
                color: fontSize === "normal" ? "#38BDF8" : "#9CA3AF",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: fontSize === "normal" ? 700 : 400,
              }}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize("large")}
              style={{
                background: "none",
                border: "none",
                color: fontSize === "large" ? "#38BDF8" : "#9CA3AF",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: fontSize === "large" ? 700 : 400,
              }}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("xlarge")}
              style={{
                background: "none",
                border: "none",
                color: fontSize === "xlarge" ? "#38BDF8" : "#9CA3AF",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: fontSize === "xlarge" ? 700 : 400,
              }}
            >
              A+
            </button>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "linear-gradient(90deg, #FFF 50%, #000 50%)", display: "inline-block", border: "1px solid #6B7280" }} />
            Contrast
          </button>
          <span style={{ color: "#6B7280" }}>|</span>
          <span style={{ color: "#E5E7EB", cursor: "pointer", fontWeight: 600 }}>हिन्दी</span>
        </div>
      </div>

      {/* TOP BAR 2 — Ministry & SIH Branding Header */}
      <header
        style={{
          background: "#FFFFFF",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        {/* Emblem & Ministry Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 44, height: 50 }}>
            <Image
              src="/emblem_of_india.png"
              alt="Emblem of India"
              width={44}
              height={50}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
              पृथ्वी विज्ञान मंत्रालय
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", lineHeight: 1.1 }}>
              Ministry of Earth Sciences
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginTop: 2 }}>
              राष्ट्रीय मध्यम अवधि मौसम पूर्वानुमान केन्द्र (NCMRWF)
            </span>
          </div>
        </div>

        {/* SIH 2026 & Digital India Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* SIH Innovation Badge */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#EA580C", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                SIH 2026 INNOVATION
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>
                Problem ID: <span style={{ fontFamily: "Roboto Mono, monospace", color: "#0F172A" }}>26079</span>
              </span>
            </div>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#FFEDD5",
                color: "#EA580C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ⬢
            </div>
          </div>

          {/* Digital India */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#0F172A", letterSpacing: "0.02em" }}>
              DIGITAL INDIA
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: "#64748B" }}>
              Power To Empower
            </span>
          </div>

          <div style={{ height: 28, width: 1, background: "#CBD5E1" }} />

          {/* User Auth Controls */}
          {isLoggedIn && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>{user.name}</span>
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{user.role}</span>
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                }}
                title={`${user.name} (${user.email})`}
              >
                {user.initials}
              </div>
              <button
                onClick={logoutUser}
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  color: "#64748B",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  marginLeft: 4,
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => openAuth("login")}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <span>Login</span>
              </button>
              <button
                onClick={() => openAuth("signup")}
                style={{
                  background: "#0F172A",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 3px rgba(15,23,42,0.2)",
                }}
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* TOP NAVIGATION BAR 3 — Main Section Tabs */}
      <nav
        style={{
          background: "#0F172A",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1E293B",
        }}
      >
        <div style={{ display: "flex", gap: 2 }}>
          <button
            onClick={() => setActiveTab("home")}
            style={{
              padding: "12px 18px",
              background: activeTab === "home" ? "#020617" : "transparent",
              color: activeTab === "home" ? "#FFFFFF" : "#94A3B8",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              borderBottom: activeTab === "home" ? "3px solid #38BDF8" : "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Home
          </button>
          <button
            onClick={() => setShowDossierModal(true)}
            style={{
              padding: "12px 18px",
              background: activeTab === "ps" ? "#020617" : "transparent",
              color: activeTab === "ps" ? "#FFFFFF" : "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: activeTab === "ps" ? "3px solid #38BDF8" : "3px solid transparent",
              cursor: "pointer",
            }}
          >
            Problem Statement 26079
          </button>
          <button
            onClick={() => router.push("/confidence-map")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: "3px solid transparent",
              cursor: "pointer",
            }}
          >
            NWP Uncertainty Map
          </button>
          <button
            onClick={() => router.push("/model-performance")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: "3px solid transparent",
              cursor: "pointer",
            }}
          >
            AI/ML Architecture
          </button>
          <button
            onClick={() => setShowDossierModal(true)}
            style={{
              padding: "12px 18px",
              background: "transparent",
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: "3px solid transparent",
              cursor: "pointer",
            }}
          >
            Evaluation Rubric
          </button>
          <button
            onClick={() => router.push("/explain/odisha_20260928_d4")}
            style={{
              padding: "12px 18px",
              background: "transparent",
              color: "#94A3B8",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderBottom: "3px solid transparent",
              cursor: "pointer",
            }}
          >
            API & Documentation
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#38BDF8", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
          NCMRWF Telemetry: Operational
        </div>
      </nav>

      {/* BREADCRUMB BAR 4 */}
      <div
        style={{
          background: "#F8FAFC",
          padding: "8px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #E2E8F0",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B" }}>
          <span>🏠</span>
          <Link href="/" style={{ color: "#475569", textDecoration: "none", fontWeight: 500 }}>Home</Link>
          <span>/</span>
          <span>Smart India Hackathon 2026</span>
          <span>/</span>
          <span>MoES</span>
          <span>/</span>
          <span style={{ fontWeight: 700, color: "#0F172A" }}>PS-26079</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "#F0FDF4",
              color: "#166534",
              border: "1px solid #BBF7D0",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
            SIH-2026 ACTIVE CHALLENGE
          </span>
          <span style={{ fontFamily: "Roboto Mono, monospace", fontSize: 11, color: "#64748B" }}>
            PSID: <strong style={{ color: "#0F172A" }}>26079</strong>
          </span>
        </div>
      </div>

      {/* MAIN HERO SECTION — Dark Earth Satellite View */}
      <main
        id="main-content"
        style={{
          flex: 1,
          position: "relative",
          backgroundImage: "url('/earth_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          padding: "40px 24px",
          overflow: "hidden",
        }}
      >
        {/* Dark Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 70% 50%, rgba(2, 6, 23, 0.4) 0%, rgba(2, 6, 23, 0.88) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Hero Card Container */}
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", position: "relative", zIndex: 10 }}>
          <div
            style={{
              maxWidth: 680,
              background: "rgba(15, 23, 42, 0.78)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 16,
              padding: "32px 36px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Pill Badges */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              <span
                style={{
                  background: "#EA580C",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: 20,
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFF" }} />
                SIH 2026 | PROBLEM STATEMENT 26079
              </span>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.14)",
                  color: "#E2E8F0",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                }}
              >
                Theme: Smart Automation
              </span>
            </div>

            {/* Main Title */}
            <h1
              style={{
                fontSize: fontSize === "normal" ? 30 : fontSize === "large" ? 34 : 38,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.2,
                margin: "0 0 12px 0",
                letterSpacing: "-0.02em",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts
            </h1>

            {/* Subtitle */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#38BDF8",
                margin: "0 0 16px 0",
                lineHeight: 1.4,
              }}
            >
              Autonomous AI/ML Diagnostic Engine for NCMRWF & IMD Numerical Weather Prediction
            </h2>

            {/* Paragraph */}
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#CBD5E1",
                margin: "0 0 24px 0",
              }}
            >
              Empowering meteorologists to detect sudden forecast failures before they materialize. Predict model error divergence across Day 1 to Day 10 horizons during rapid cyclones, depressions, and extreme monsoon surges.
            </p>

            {/* 3 Information Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                  MINISTRY & CENTER
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                  MoES & NCMRWF
                </div>
              </div>

              <div
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                  LEAD HORIZON
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                  Day 1 to Day 10
                </div>
              </div>

              <div
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                  DOMAIN
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                  Software / AI-XAI
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => setShowDossierModal(true)}
                style={{
                  background: "#FFFFFF",
                  color: "#0F172A",
                  border: "none",
                  padding: "12px 22px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(255,255,255,0.2)",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>📄</span> Explore Problem Dossier
              </button>

              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    openAuth("login");
                  } else {
                    router.push("/dashboard");
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0284C7 100%)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "12px 22px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span>🌐</span> Launch Interactive Sandbox
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          background: "#050B14",
          borderTop: "1px solid #1E293B",
          padding: "16px 24px",
          color: "#64748B",
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          © 2026 National Centre for Medium Range Weather Forecasting (NCMRWF) · Ministry of Earth Sciences (MoES)
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#dossier" onClick={() => setShowDossierModal(true)} style={{ color: "#94A3B8", textDecoration: "none" }}>Dossier</a>
          <Link href="/confidence-map" style={{ color: "#94A3B8", textDecoration: "none" }}>Confidence Map</Link>
          <Link href="/model-performance" style={{ color: "#94A3B8", textDecoration: "none" }}>Verification Skill</Link>
          <Link href="/alerts" style={{ color: "#94A3B8", textDecoration: "none" }}>Alert Rules</Link>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authMode}
        onClose={() => setShowAuthModal(false)}
      />

      {/* PROBLEM DOSSIER MODAL */}
      {showDossierModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setShowDossierModal(false)}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              borderRadius: 16,
              maxWidth: 720,
              width: "100%",
              padding: 28,
              color: "#FFF",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #1E293B", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📜</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#38BDF8" }}>
                  Problem Statement Dossier — PSID 26079
                </h3>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#CBD5E1", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <strong style={{ color: "#FFF" }}>Objective:</strong> Develop an autonomous machine learning system capable of flagging forecast "busts" (sudden, severe deviations between NWP model outputs and observed weather) up to 10 days in advance.
              </div>
              <div>
                <strong style={{ color: "#FFF" }}>Key Requirements:</strong>
                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  <li>Quantify probabilistic confidence score for GFS / NCUM operational model runs.</li>
                  <li>Identify meteorological driver anomalies (850hPa Vorticity, SST Anomaly, Divergence).</li>
                  <li>Interactive Spatial Confidence Map for all India weather sub-regions.</li>
                  <li>SHAP & XAI narrative explanations for operational meteorologists.</li>
                </ul>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    setShowDossierModal(false);
                    router.push("/dashboard");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    background: "#2563EB",
                    color: "#FFF",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  🚀 Open VayuDrishti Dashboard
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    background: "#1E293B",
                    color: "#CBD5E1",
                    fontWeight: 600,
                    border: "1px solid #334155",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
