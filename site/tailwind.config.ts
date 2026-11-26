import type { Config } from "tailwindcss";

/** 2K Card Lab 设计 Token（V1.0 冻结）：深色专业数据终端 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          900: "#0B111B", // bg-primary  全站背景
          800: "#111B29", // bg-secondary 导航与主要容器
          700: "#172333", // bg-card      内容卡片
          650: "#202F42", // bg-hover     悬停状态
          600: "#29394D", // border       分割线与边框
        },
        accent: "#38BDF8", // 品牌蓝
        ink: "#F1F5F9",    // text-primary
        muted: "#94A3B8",  // text-secondary
        gain: "#22C55E",   // 上涨 / 成功
        danger: "#EF4444", // 下跌 / 错误
        warning: "#F59E0B", // 警告
        // 徽章等级色（只用于徽章，不用于卡片宝石等级）
        badge: {
          bronze: "#B77945",
          silver: "#BFC7D1",
          gold: "#EABF53",
          hof: "#A78BFA",
          legend: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["Inter", "MiSans", "Microsoft YaHei", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
