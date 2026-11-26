import Link from "next/link";
import cards from "@/data/cards_index.json";
import { IndexCard } from "@/lib/core";
import CardTile from "@/components/card-tile";
import MarketBoard from "@/components/market-board";
import GlobalSearch from "@/components/global-search";
import BrandLogo from "@/components/brand-logo";
import HomeRanks from "@/components/home-ranks";
import { BADGES } from "@/lib/badge-lexicon";

const ALL = cards as unknown as IndexCard[];

export default function Home() {
  const latest = ALL.slice()
    .sort((a, b) => (b.released_at ?? "").localeCompare(a.released_at ?? "") || (b.overall ?? 0) - (a.overall ?? 0))
    .slice(0, 10);
  const topOvr = ALL.slice(0, 12);
  const playerCount = new Set(ALL.map((c) => c.name)).size;
  const newest = ALL.reduce((m, c) => ((c.released_at ?? "") > m ? (c.released_at as string) : m), "");

  return (
    <div className="space-y-10">
      {/* 1-2 品牌头 + 全站搜索 + 数据统计 */}
      <section className="rounded-2xl border border-court-600 bg-court-800 p-6">
        <BrandLogo variant="full" height={64} className="mb-3" />
        <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
          NBA 2K MyTEAM 数据平台
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          数据驱动每一次阵容选择：球员卡数据库、徽章、市场行情与阵容构建。
          徽章中文名统一采用 2kAuction 2K27 简体中文词库，主机与 PC 两个价格池独立统计。
        </p>
        <div className="mt-4 max-w-xl"><GlobalSearch /></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "球员卡", value: ALL.length },
            { label: "球员", value: playerCount },
            { label: "徽章词库", value: BADGES.length },
            { label: "最新入库", value: newest || "-" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-court-600 bg-court-700/50 px-3 py-2.5">
              <p className="text-[11px] text-muted">{s.label}</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-ink">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/cards/" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-[#08121c] transition hover:brightness-110">
            浏览球员卡
          </Link>
          <Link href="/market/" className="rounded-lg border border-court-600 px-4 py-2 text-sm text-slate-200 hover:border-accent/60">
            市场总览
          </Link>
          <Link href="/compare/" className="rounded-lg border border-court-600 px-4 py-2 text-sm text-slate-200 hover:border-accent/60">
            球员比较
          </Link>
        </div>
      </section>

      {/* 3 市场概览（主机 + PC 两个价格池）——手机端隐藏，避免首屏被行情挤满 */}
      <section className="hidden sm:block">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-white">市场概览 <span className="text-xs font-normal text-slate-500">主机 · PC 独立价格池</span></h2>
          <Link href="/market/" className="text-xs text-accent hover:underline">全部 →</Link>
        </div>
        <MarketBoard list="co" limit={10} />
        <div className="mt-3"><MarketBoard list="pc" limit={10} /></div>
      </section>

      {/* 4 最新卡片 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-white">最新卡片 <span className="text-xs font-normal text-slate-500">按入库日期倒序</span></h2>
          <Link href="/updates/" className="text-xs text-accent hover:underline">更新中心 →</Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {latest.map((c) => (
            <Link key={c.id} href={`/card/${c.id}/`}
              className="rounded-lg border border-court-600 bg-court-800 px-2.5 py-1.5 text-xs text-slate-300 hover:border-accent/50">
              <b className="mr-1 text-accent">{c.overall}</b>{c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 5-6 涨跌榜 + 收藏 */}
      <HomeRanks />

      {/* 7 高总评卡片 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-white">高总评卡片</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {topOvr.map((c) => <CardTile key={c.id} card={c} />)}
        </div>
      </section>

      {/* 8 快捷工具 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-white">快捷工具</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/compare/", title: "球员比较器", desc: "2–4 张卡横向对比属性、徽章与价格" },
            { href: "/lineup/", title: "阵容构建", desc: "15 人阵容、平均总评与总造价" },
            { href: "/badges/", title: "徽章数据库", desc: "53 条官方词库 + 分类与持有卡片" },
          ].map((t) => (
            <Link key={t.href} href={t.href}
              className="rounded-xl border border-court-600 bg-court-800 p-4 transition hover:border-accent/60 hover:bg-court-650/40">
              <p className="text-sm font-bold text-ink">{t.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-[11px] leading-5 text-slate-600">
        非官方站点，与 2K Sports / Visual Concepts 无关联。行情来自公开拍卖行聚合，仅供参考，不构成交易建议。
        数据更新时间以页面顶部行情时间戳为准；无历史快照时一律显示暂无数据，不做补零。
      </p>
    </div>
  );
}
