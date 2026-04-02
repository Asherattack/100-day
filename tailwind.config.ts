import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#00ff88",
        deep: "#050806",
        panel: "rgba(16, 26, 19, 0.94)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(0, 255, 136, 0.35)",
      },
      backgroundImage: {
        grid: "radial-gradient(rgba(0, 255, 136, 0.2) 0.5px, transparent 0.5px)",
      },
    },
  },
  plugins: [],
};

export default config;
