/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kx: {
          bg: "#0B0C0E",
          elevated: "#12141A",
          surface: "#181B22",
          hover: "#1F232C",
          border: "#2A2F3A",
          text: "#F4F1EA",
          muted: "#9B968A",
          subtle: "#6E6A62",
          accent: "#D4A017",
          shoot: "#FF7A45",
          info: "#6B8CFF",
          success: "#3DDC97",
          danger: "#E5484D",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        kx: "0 0 0 1px rgba(212,160,23,0.12), 0 24px 48px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
