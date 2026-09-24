import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      colors: {
        // Software Canvas: Soft Crisp Light Slate
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        rule: "#E2E8F0",
        lift: "#F1F5F9",

        ink: "#0F172A",
        muted: "#475569",

        // Sidebar & Header: Crisp Light Pure White Theme
        sidebar: {
          950: "#F8FAFC",
          900: "#FFFFFF",
          800: "#F1F5F9",
          700: "#E2E8F0",
          text: "#0F172A",
          muted: "#64748B",
        },

        // Primary Accent: Vivid Cobalt Blue
        sarson: {
          700: "#1D4ED8",
          600: "#2563EB",
          500: "#2563EB",
          400: "#3B82F6",
          100: "#DBEAFE",
          50:  "#EFF6FF",
        },

        // Status Colors
        status: {
          "cash-bg":      "#DCFCE7",
          "cash-text":    "#15803D",
          "cash-border":  "#86EFAC",

          "udhaar-bg":    "#FFEDD5",
          "udhaar-text":  "#C2410C",
          "udhaar-border":"#FDBA74",

          "alert-bg":     "#FEE2E2",
          "alert-text":   "#B91C1C",
          "alert-border": "#FCA5A5",

          "info-bg":      "#EFF6FF",
          "info-text":    "#1D4ED8",
          "info-border":  "#93C5FD",
        },
      },
      boxShadow: {
        "card": "0 4px 14px 0 rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        "modal": "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        "action": "0 4px 14px 0 rgba(245, 158, 11, 0.35)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.2s ease-out",
        "scale-in":   "scaleIn 0.15s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
