import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import DataStamp from "@/components/data-stamp";
import GlobalSearch from "@/components/global-search";

export const metadata: Metadata = {
  title: "2K中文库 | NBA 2K MyTEAM 实时行情·球员卡数据库",
  description:
    "NBA 2K 中文玩家数据站：球员卡数据、拍卖行实时成交价、每日行情快照、中文徽章属性翻译。非官方站点。",
};

const NAV = [
  { href: "/", label: "首页" },
  { href: "/cards/", label: "数据库" },
  { href: "/market/", label: "市场" },
  { href: "/lineup/", label: "阵容" },
  { href: "/compare/", label: "比较" },
  { href: "/updates/", label: "更新" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-court-700 bg-court-900/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2.5">
            <Link href="/" className="shrink-0 text-lg font-black tracking-wide text-accent">
              2K中文库
            </Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className="shrink-0 text-sm text-slate-300 hover:text-white">
                {n.label}
              </Link>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <GlobalSearch />
              <span className="hidden rounded-full bg-[#ff6b6b] px-2 py-0.5 text-[10px] font-bold text-[#0b1020] sm:block">
                公测
              </span>
              <DataStamp />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-court-700 py-6 text-center text-xs leading-5 text-slate-500">
          非官方站点，与 2K Sports / Visual Concepts 无关联。卡面等游戏资产版权归 2K Sports。
          <br />
          数据来自公开拍卖行聚合，仅供参考，不构成任何交易建议；行情每约 15 分钟更新一次，以页面顶部时间为准。
        </footer>
      </body>
    </html>
  );
}
