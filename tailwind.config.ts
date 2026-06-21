import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ink — the encrypted-vault base. Near-black with cool depth.
        ink: {
          900: "#06070A",
          800: "#0A0C11",
          700: "#0F121A",
          600: "#151925",
          500: "#1C2130",
          400: "#272D40",
        },
        // Mist — text + muted UI.
        mist: {
          100: "#EAECF2",
          200: "#C7CBD6",
          300: "#9AA0B2",
          400: "#6C7388",
          500: "#4A5066",
        },
        // Violet — the Noxis brand signal.
        violet: {
          300: "#B3A8FF",
          400: "#9A8DFF",
          500: "#7C6CFF",
          600: "#6354E6",
          700: "#4A3DBE",
        },
        // Cipher — phosphor mint for "encrypted / verified" states.
        cipher: {
          400: "#5BFFD2",
          500: "#2BF0BE",
          600: "#13C99B",
        },
        amber: { 500: "#F0B23D" },
        rose: { 500: "#FF6B7A" },
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,108,255,0.18), 0 18px 60px -18px rgba(124,108,255,0.35)",
        cipher: "0 0 0 1px rgba(43,240,190,0.22), 0 14px 40px -16px rgba(43,240,190,0.30)",
        panel: "0 24px 80px -28px rgba(0,0,0,0.85)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(43,240,190,0.35)" },
          "70%": { boxShadow: "0 0 0 10px rgba(43,240,190,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(43,240,190,0)" },
        },
        "drift": {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-14px,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        scan: "scan 4s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        drift: "drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
