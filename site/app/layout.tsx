import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "2K中文数据库 | MyTEAM 行情·卡库·搬砖工具",
  description:
    "NBA 2K 中文玩家社区数据站：球员卡数据、每日行情快照、搬砖参考。非官方站点，数据为社区聚合。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-court-700">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-black tracking-wide text-accent">
              2K中文库
            </Link>
            <Link href="/players/" className="text-sm text-slate-300 hover:text-white">
              卡库
            </Link>
            <Link href="/market/" className="text-sm text-slate-300 hover:text-white">
              行情
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-court-700 py-6 text-center text-xs leading-5 text-slate-500">
          非官方站点，与 2K Sports / Visual Concepts 无关联。卡面等游戏资产版权归 2K Sports。
          <br />
          行情与数据为社区聚合，仅供参考。投诉联系：contact@example.com（24h 内下架处理）。
        </footer>
      </body>
    </html>
  );
}
