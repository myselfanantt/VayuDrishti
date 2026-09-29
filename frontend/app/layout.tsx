import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VayuDrishti — AI Forecast Bust Detection | NCMRWF",
  description:
    "AI-powered medium-range weather forecast bust detection system for India. " +
    "Detect impending forecast failures before they occur using spatiotemporal transformers, " +
    "SHAP explainability, and synoptic-regime-conditioned confidence scoring.",
  keywords: [
    "weather forecast", "bust detection", "NCMRWF", "medium range", "AI", "deep learning",
    "India weather", "monsoon", "SIH 2026",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.css"
          rel="stylesheet"
        />
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.5.2/mapbox-gl.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
