import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 页面底色 / 卡片底色 / 层级悬浮 / 边框
        court: {
          900: "#0F1118",
          800: "#1A1D29",
          700: "#232736",
          600: "#2D3242",
        },
        // 主色：总评、区块标题竖线、按钮
        accent: "#4F8CFF",
        // 文字体系
        ink: "#E8EBF2",
        muted: "#98A2B3",
        // 价格正向
        gain: "#4ADE80",
        // 徽章等级识别色
        badge: {
          hof: "#B762FF",
          gold: "#FFC845",
          silver: "#C5CDDB",
          bronze: "#B88646",
        },
      },
    },
  },
  plugins: [],
};
export default config;
