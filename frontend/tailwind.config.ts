import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#F8F9FA",
          surface: "#FFFFFF",
          elevated: "#F1F3F4",
        },
        text: {
          primary: "#202124",
          secondary: "#5F6368",
          muted: "#9AA0A6",
        },
        accent: {
          blue: "#1A73E8",
          green: "#34A853",
          yellow: "#FBBC04",
          red: "#EA4335",
          indigo: "#7C4DFF",
          orange: "#FF6D00",
        },
        border: {
          DEFAULT: "#DADCE0",
          focus: "#1A73E8",
        },
      },
      fontFamily: {
        sans: ["Google Sans Text", "Inter", "system-ui", "sans-serif"],
        display: ["Google Sans Display", "DM Sans", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-alert": "pulse-alert 2s ease-in-out infinite",
        "slide-in": "slide-in 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
      keyframes: {
        "pulse-alert": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-in": {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
