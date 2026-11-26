"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import cards from "@/data/cards_index.json";
import { IndexCard, priceOfId, fmtMt, fmtNum, PLATFORMS } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";
import { TIER_CN, TIER_COLOR, rarity } from "@/lib/i18n";
import CardTile from "@/components/card-tile";
import { useFavorites } from "@/lib/use-favorites";

const ALL = cards as unknown as IndexCard[];
const PAGE = 60;

const POS = ["PG", "SG", "SF", "PF", "C"];

/** 可排序维度：键 → 中文标题 */
const SORTS: { key: string; label: string }[] = [
  { key: "overall", label: "总评" },
  { key: "price", label: "价格" },
  { key: "shot_3pt", label: "三分" },
  { key: "ball_handle", label: "运球" },
  { key: "speed", label: "速度" },
  { key: "perimeter_defense", label: "外防" },
  { key: "interior_defense", label: "内防" },
  { key: "offensive_rebound", label: "攻板" },
  { key: "defensive_rebound", label: "防板" },
  { key: "badge_count", label: "徽章数" },
  { key: "height_cm", label: "身高" },
];

type Basis = "co" | "pc" | "a";

interface Filters {
  q: string;
  pos: string[];
  tier: string[];
  team: string;
  collection: string;
  minOvr: number;
  minBadges: number;
  minHeight: number;
  maxPrice: number | null;
  tradable: boolean | null;
}

const emptyFilters = (): Filters => ({
  q: "", pos: [], tier: [], team: "", collection: "",
  minOvr: 68, minBadges: 0, minHeight: 0, maxPrice: null, tradable: null,
});

function attrNum(c: IndexCard, key: string): number {
  const v = (c.attrs ?? {})[key];
  return typeof v === "number" ? v : -1;
}

export default function PlayersPage() {
  const { doc } = usePrices();
  const { has: isFav } = useFavorites();
  const [onlyFav, setOnlyFav] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sortKey, setSortKey] = useState("overall");
  const [sortDesc, setSortDesc] = useState(true);
  const [basis, setBasis] = useState<Basis>("a");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [shown, setShown] = useState(PAGE);

  const teams = useMemo(() => [...new Set(ALL.map((c) => c.team).filter(Boolean) as string[])].sort(), []);
  const collections = useMemo(() => [...new Set(ALL.map((c) => c.collection).filter(Boolean) as string[])].sort(), []);
  const tiers = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of ALL) if (c.tier != null) m.set(c.tier, (m.get(c.tier) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const priceOf = (c: IndexCard) => priceOfId(doc, c.id, basis);

  const filtered = useMemo(() => {
    const kw = filters.q.trim().toLowerCase();
    return ALL.filter((c) => {
      if ((c.overall ?? 0) < filters.minOvr) return false;
      if ((c.badge_count ?? 0) < filters.minBadges) return false;
      if ((c.height_cm ?? 0) < filters.minHeight) return false;
      if (filters.pos.length && !filters.pos.some((p) => c.position === p || c.sec === p)) return false;
      if (filters.tier.length && !filters.tier.includes(String(c.tier))) return false;
      if (filters.team && c.team !== filters.team) return false;
      if (filters.collection && c.collection !== filters.collection) return false;
      const p = priceOf(c);
      if (filters.maxPrice != null && (p == null || p > filters.maxPrice)) return false;
      if (filters.tradable != null) {
        const hasPrice = p != null;
        if (filters.tradable !== hasPrice) return false;
      }
      if (onlyFav && !isFav(c.id)) return false;
      if (kw && ![c.name, c.team, c.theme, c.collection].some((v) => (v ?? "").toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [filters, doc, basis, onlyFav, isFav]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDesc ? 1 : -1;
    arr.sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === "price") { va = priceOf(a) ?? -1; vb = priceOf(b) ?? -1; }
      else if (sortKey === "overall") { va = a.overall ?? -1; vb = b.overall ?? -1; }
      else if (sortKey === "badge_count") { va = a.badge_count ?? -1; vb = b.badge_count ?? -1; }
      else if (sortKey === "height_cm") { va = a.height_cm ?? -1; vb = b.height_cm ?? -1; }
      else { va = attrNum(a, sortKey); vb = attrNum(b, sortKey); }
      return (vb - va) * dir || (b.overall ?? 0) - (a.overall ?? 0);
    });
    return arr;
  }, [filtered, sortKey, sortDesc, doc, basis]);

  useEffect(() => setShown(PAGE), [filters, sortKey, sortDesc, basis]);

  const list = sorted.slice(0, shown);
  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-bold text-white">卡库</h1>
        <span className="text-xs text-slate-500">
          索引 {ALL.length} 张 · 筛选出 {filtered.length} 张
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setOnlyFav((v) => !v)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${onlyFav ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-court-600 text-slate-400"}`}>
            {onlyFav ? "★ 只看收藏" : "☆ 收藏"}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-court-600 text-xs">
            {(["grid", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 py-1.5 ${view === v ? "bg-accent/20 text-accent" : "text-slate-400"}`}>
                {v === "grid" ? "卡片" : "表格"}
              </button>
            ))}
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}
            className="rounded-lg border border-court-600 bg-court-800 px-2 py-1.5 text-xs text-ink outline-none">
            {SORTS.map((s) => <option key={s.key} value={s.key}>按 {s.label}</option>)}
          </select>
          <button onClick={() => setSortDesc((d) => !d)}
            className="rounded-lg border border-court-600 px-2 py-1.5 text-xs text-slate-300">
            {sortDesc ? "↓ 降序" : "↑ 升序"}
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="space-y-3 rounded-xl border border-court-600 bg-court-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="搜索球员 / 球队 / 系列"
            className="w-64 rounded-lg border border-court-600 bg-court-900 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label className="text-sm text-slate-400">
            总评 ≥ <b className="text-ink">{filters.minOvr}</b>
            <input type="range" min={68} max={99} value={filters.minOvr}
              onChange={(e) => setFilters({ ...filters, minOvr: Number(e.target.value) })}
              className="ml-2 accent-accent" />
          </label>
          <label className="text-sm text-slate-400">
            徽章 ≥ <b className="text-ink">{filters.minBadges}</b>
            <input type="range" min={0} max={40} value={filters.minBadges}
              onChange={(e) => setFilters({ ...filters, minBadges: Number(e.target.value) })}
              className="ml-2 accent-accent" />
          </label>
          <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)}
            className="rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none">
            <option value="a">综合价</option>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}价</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* 位置多选 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted">位置</span>
            {POS.map((p) => (
              <button key={p} onClick={() => setFilters({ ...filters, pos: toggle(filters.pos, p) })}
                className={`rounded-md border px-2 py-1 text-xs ${filters.pos.includes(p) ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}>
                {p}
              </button>
            ))}
          </div>

          {/* 卡种多选 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted">卡种</span>
            {tiers.map(([t, n]) => (
              <button key={t} onClick={() => setFilters({ ...filters, tier: toggle(filters.tier, String(t)) })}
                className={`rounded-md border px-2 py-1 text-xs ${filters.tier.includes(String(t)) ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}
                title={`${TIER_CN[t] ?? t} · ${n} 张`}>
                <i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: TIER_COLOR[t] ?? "#888" }} />
                {TIER_CN[t] ?? t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={filters.team} onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            className="rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none">
            <option value="">全部球队</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.collection} onChange={(e) => setFilters({ ...filters, collection: e.target.value })}
            className="rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none">
            <option value="">全部系列</option>
            {collections.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="text-sm text-slate-400">
            价格 ≤
            <input type="number" min={0} step={10000} value={filters.maxPrice ?? ""} placeholder="不限"
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
              className="ml-2 w-28 rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none" />
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-muted">可交易</span>
            {[["all", "全部"], ["yes", "有价"], ["no", "无价"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilters({ ...filters, tradable: v === "all" ? null : v === "yes" })}
                className={`rounded-md border px-2 py-1 ${(filters.tradable === null) === (v === "all") ? "border-accent bg-accent/15 text-accent" : "border-court-600"}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => setFilters(emptyFilters())}
            className="rounded-lg border border-court-600 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300">
            重置
          </button>
        </div>
      </div>

      {list.length ? (
        view === "grid" ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((c) => <CardTile key={c.id} card={c} />)}
            </div>
            {shown < sorted.length && (
              <div className="pt-2 text-center">
                <button onClick={() => setShown((n) => n + PAGE)}
                  className="rounded-lg border border-court-600 px-5 py-2 text-sm text-accent transition-colors hover:border-accent/60 hover:bg-accent/10">
                  加载更多（剩余 {sorted.length - shown} 张）
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="overflow-hidden rounded-xl border border-court-600">
            <table className="w-full text-sm">
              <thead className="bg-court-800 text-left text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">卡</th>
                  <th className="px-2 py-2">位置</th>
                  <th className="px-2 py-2">球队</th>
                  <th className="px-2 py-2">系列</th>
                  <th className="px-2 py-2 text-right">三分</th>
                  <th className="px-2 py-2 text-right">运球</th>
                  <th className="px-2 py-2 text-right">外防</th>
                  <th className="px-2 py-2 text-right">徽章</th>
                  <th className="px-2 py-2 text-right">价格</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const rar = rarity(c.overall);
                  const p = priceOf(c);
                  return (
                    <tr key={c.id} className="border-t border-court-700/60 bg-court-900/40 hover:bg-court-800/60">
                      <td className="px-3 py-2">
                        <LinkRow id={c.id} ovr={c.overall} name={c.name} rar={rar.text} />
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-300">{c.position}{c.sec ? `/${c.sec}` : ""}</td>
                      <td className="px-2 py-2 text-xs text-slate-400">{c.team ?? "-"}</td>
                      <td className="px-2 py-2 text-xs text-slate-400">{c.theme ?? c.collection ?? "-"}</td>
                      <td className="px-2 py-2 text-right text-xs">{attrNum(c, "shot_3pt")}</td>
                      <td className="px-2 py-2 text-right text-xs">{attrNum(c, "ball_handle")}</td>
                      <td className="px-2 py-2 text-right text-xs">{attrNum(c, "perimeter_defense")}</td>
                      <td className="px-2 py-2 text-right text-xs">{c.badge_count ?? 0}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-gain">{p != null ? fmtMt(p) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shown < sorted.length && (
              <div className="border-t border-court-600 py-3 text-center">
                <button onClick={() => setShown((n) => n + PAGE)}
                  className="text-sm text-accent hover:underline">
                  加载更多（剩余 {sorted.length - shown} 张）
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <p className="py-10 text-sm text-slate-500">没有匹配的卡片，试试放宽筛选条件。</p>
      )}
    </div>
  );
}

function LinkRow({ id, ovr, name, rar }: { id: number; ovr: number | null; name: string; rar: string }) {
  return (
    <Link href={`/player/${id}/`} className="group">
      <span className={`font-black ${rar}`}>{ovr ?? "-"}</span>
      <span className="ml-2 text-slate-100 group-hover:text-accent">{name}</span>
    </Link>
  );
}
