import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "2K中文库 | NBA 2K MyTEAM 实时行情·球员卡数据库",
  description:
    "NBA 2K 中文玩家数据站：球员卡数据、拍卖行实时成交价、每日行情快照、中文徽章属性翻译。非官方站点。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-court-700 bg-court-900/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-black tracking-wide text-accent text-lg">
              2K中文库
            </Link>
            <Link href="/players/" className="text-sm text-slate-300 hover:text-white">卡库</Link>
            <Link href="/market/" className="text-sm text-slate-300 hover:text-white">市场</Link>
            <Link href="/lineup/" className="text-sm text-slate-300 hover:text-white">阵容</Link>
            <span className="ml-auto rounded-full bg-[#ff6b6b] px-2 py-0.5 text-[10px] font-bold text-[#0b1020]">
              公测
            </span>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-court-700 py-6 text-center text-xs leading-5 text-slate-500">
          非官方站点，与 2K Sports / Visual Concepts 无关联。卡面等游戏资产版权归 2K Sports。
          <br />
          行情与数据为社区聚合，仅供参考。投诉联系：contact@example.com（24h 内下架处理）。
        </footer>
      </body>
    </html>
  );
}
