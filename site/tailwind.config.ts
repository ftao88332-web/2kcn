import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: { 900: "#12141c", 800: "#191c27", 700: "#232838", 600: "#333b52" },
        accent: "#facc15",
      },
    },
  },
  plugins: [],
};
export default config;
