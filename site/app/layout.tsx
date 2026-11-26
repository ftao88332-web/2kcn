import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import DataStamp from "@/components/data-stamp";
import GlobalSearch from "@/components/global-search";

export const metadata: Metadata = {
  title: {
    default: "2K Card Lab | NBA 2K MyTEAM Database",
    template: "%s | 2K Card Lab",
  },
  description:
    "2K Card Lab 是 NBA 2K MyTEAM 中文数据平台，提供球员卡数据库、徽章、球员属性、市场行情分析和阵容构建工具。",
  applicationName: "2K Card Lab",
};

const NAV = [
  { href: "/", label: "首页" },
  { href: "/cards/", label: "球员卡" },
  { href: "/market/", label: "市场" },
  { href: "/compare/", label: "工具", sub: [{ href: "/compare/", label: "球员比较" }, { href: "/lineup/", label: "阵容构建" }] },
  { href: "/updates/", label: "更新" },
  { href: "/badges/", label: "数据库" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-court-600 bg-court-800/95 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 overflow-x-auto px-4">
            <Link href="/" className="shrink-0 leading-none">
              <span className="text-xl font-black tracking-tight text-accent">2K</span>
              <span className="ml-1 text-xl font-black tracking-tight text-white">CARD LAB</span>
              <span className="ml-2 hidden align-middle text-[10px] font-medium tracking-widest text-slate-500 sm:inline">
                NBA 2K MYTEAM DATABASE
              </span>
            </Link>
            {NAV.map((n) =>
              n.sub ? (
                <div key={n.href} className="group relative shrink-0">
                  <Link href={n.href} className="text-sm text-slate-300 hover:text-white">{n.label}</Link>
                  <div className="invisible absolute left-0 top-full z-50 w-32 rounded-lg border border-court-600 bg-court-800 p-1 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                    {n.sub.map((s) => (
                      <Link key={s.href} href={s.href}
                        className="block rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-court-650 hover:text-white">
                        {s.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={n.href} href={n.href} className="shrink-0 text-sm text-slate-300 hover:text-white">
                  {n.label}
                </Link>
              )
            )}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <GlobalSearch />
              <Link href="/cards/?fav=1"
                className="hidden rounded-lg border border-court-600 px-2 py-1 text-xs text-slate-400 hover:text-amber-300 sm:block"
                title="查看我的收藏">
                ★ 收藏
              </Link>
              <DataStamp />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-5">{children}</main>
        <footer className="border-t border-court-600 py-6 text-center text-xs leading-5 text-slate-500">
          <b className="text-slate-400">2K Card Lab</b> · NBA 2K MyTEAM 数据平台 · 非官方站点，与 2K Sports / Visual Concepts 无关联。
          <br />
          徽章中文名称采用 2kAuction 2K27 简体中文词库（53 条）及其余站内既有译名；卡面等游戏资产版权归 2K Sports。
          <br />
          行情来自公开拍卖行聚合，仅供参考，不构成交易建议；主机与 PC 两个价格池互不相通，约每 15 分钟更新一次。
        </footer>
      </body>
    </html>
  );
}
