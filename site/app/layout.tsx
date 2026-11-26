import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import DataStamp from "@/components/data-stamp";
import GlobalSearch from "@/components/global-search";
import BrandLogo from "@/components/brand-logo";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: {
    default: "2K Card Lab | NBA 2K MyTEAM Database",
    template: "%s | 2K Card Lab",
  },
  description:
    "2K Card Lab 是 NBA 2K MyTEAM 中文数据平台，提供球员卡数据库、徽章、球员属性、市场行情分析和阵容构建工具。",
  applicationName: "2K Card Lab",
  openGraph: {
    title: "2K Card Lab | NBA 2K MyTEAM Database",
    description: "NBA 2K MyTEAM 中文数据平台：球员卡数据库、徽章词库、市场行情与我的阵容。",
    siteName: "2K Card Lab",
    type: "website",
    images: [{ url: `${BASE}/brand/og-cover.png`, width: 1200, height: 312, alt: "2K Card Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2K Card Lab",
    description: "NBA 2K MyTEAM 中文数据平台",
    images: [`${BASE}/brand/og-cover.png`],
  },
};

const NAV = [
  { href: "/", label: "首页" },
  { href: "/cards/", label: "球员卡" },
  { href: "/market/", label: "市场" },
  { href: "/rankings/", label: "我的排名" },
  { href: "/compare/", label: "球员比较" },
  { href: "/lineup/", label: "我的阵容" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-court-600 bg-court-800/95 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 overflow-x-auto px-4">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="2K Card Lab 首页">
              <BrandLogo variant="mark" height={32} />
            </Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 text-sm text-slate-300 hover:text-white">
                {n.label}
              </Link>
            ))}
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
        <footer className="border-t border-court-600 py-6 text-center text-xs leading-6 text-slate-500">
          <div className="mb-3 flex justify-center">
            <Link href="/" aria-label="2K Card Lab"><BrandLogo variant="mark" height={24} className="opacity-70 hover:opacity-100" /></Link>
          </div>
          <p className="mb-4">
            <Link href="/badges/" className="text-slate-400 hover:text-accent">徽章数据库</Link>
            <span className="mx-2 text-slate-600">·</span>
            <Link href="/compare/" className="text-slate-400 hover:text-accent">球员比较</Link>
            <span className="mx-2 text-slate-600">·</span>
            <Link href="/lineup/" className="text-slate-400 hover:text-accent">我的阵容</Link>
          </p>
          <p className="mx-auto max-w-3xl px-4 text-left text-[11px] leading-5 text-slate-500">
            版权免责声明： 本站为 NBA2K 爱好者自制图鉴站点，完全非商用，不提供任何付费、广告、交易服务。页面中出现的卡牌原画、球员肖像、游戏素材、NBA 及 2K 相关商标，版权归属 Take-Two、NBA 以及对应权利人所有。 素材仅用于玩家查阅、交流参考，无任何侵权意图。如版权方认为本站内容侵害您的权益，请联系
            <a href="mailto:ft050915@163.com" className="text-slate-400 hover:text-accent">ft050915@163.com</a>
            ，我会第一时间删除相关内容。 本站球员数据仅供参考，不保证 100% 准确。
          </p>
        </footer>
      </body>
    </html>
  );
}
