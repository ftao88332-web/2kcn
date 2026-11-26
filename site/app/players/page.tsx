"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { priceOfId, fmtMt, fmtNum, PLATFORMS, IndexCard } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";
import { TIER_CN, TIER_EN, TIER_COLOR, rarity } from "@/lib/i18n";
import CardTile from "@/components/card-tile";
import { useFavorites } from "@/lib/use-favorites";
import { CARDS, QueryCard, stat, positionsOf } from "@/lib/services/cards";
import { holdersOf, searchBadges } from "@/lib/services/badges";
import { CATEGORIES, badgeName } from "@/lib/badge-lexicon";
import BadgeItem from "@/components/badge-item";

const ALL = CARDS as QueryCard[];
const PAGE = 60;

const POS = ["PG", "SG", "SF", "PF", "C"];

/** 可排序维度：键 → 中文标题 */
const SORTS: { key: string; label: string }[] = [
  { key: "overall", label: "总评" },
  { key: "price", label: "价格" },
  { key: "shot_3pt", label: "三分" },
  { key: "shot_mid", label: "中距离" },
  { key: "driving_layup", label: "上篮" },
  { key: "ball_handle", label: "运球" },
  { key: "speed", label: "速度" },
  { key: "perimeter_defense", label: "外防" },
  { key: "interior_defense", label: "内防" },
  { key: "offensive_rebound", label: "攻板" },
  { key: "defensive_rebound", label: "防板" },
  { key: "badge_count", label: "徽章数" },
  { key: "height_cm", label: "身高" },
  { key: "released_at", label: "最新上线" },
];

type Basis = "co" | "pc" | "a";

interface Filters {
  q: string;
  pos: string[];
  tier: string[];
  team: string;
  collection: string;
  minOvr: number;
  maxOvr: number;
  minBadges: number;
  maxBadges: number;
  minHeight: number;
  maxPrice: number | null;
  minPrice: number | null;
  tradable: boolean | null;
  evo: boolean | null;
  duo: boolean | null;
  badges: string[];
}

const emptyFilters = (): Filters => ({
  q: "", pos: [], tier: [], team: "", collection: "",
  minOvr: 0, maxOvr: 99, minBadges: 0, maxBadges: 99, minHeight: 0,
  maxPrice: null, minPrice: null, tradable: null, evo: null, duo: null, badges: [],
});

/** 索引里的关键属性（索引不带 attrs，统一走 stats） */
function attrNum(c: IndexCard, key: string): number | null {
  return stat(c as QueryCard, key);
}

function toTri(v: string | null): boolean | null {
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
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
  const [ready, setReady] = useState(false);
  const [badgeQ, setBadgeQ] = useState("");
  const [badgeCat, setBadgeCat] = useState<string>("all");

  const teams = useMemo(() => [...new Set(ALL.map((c) => c.team).filter(Boolean) as string[])].sort(), []);
  const collections = useMemo(() => [...new Set(ALL.map((c) => c.collection).filter(Boolean) as string[])].sort(), []);
  const tiers = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of ALL) if (c.tier != null) m.set(c.tier, (m.get(c.tier) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const priceOf = useCallback((c: IndexCard) => priceOfId(doc, c.id, basis), [doc, basis]);

  // 首帧读 URL 还原筛选，刷新/分享后状态一致
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const f = emptyFilters();
    f.q = sp.get("q") ?? "";
    f.pos = (sp.get("pos") ?? "").split(",").filter(Boolean);
    f.tier = (sp.get("tier") ?? "").split(",").filter(Boolean);
    f.team = sp.get("team") ?? "";
    f.collection = sp.get("coll") ?? "";
    f.minOvr = Number(sp.get("minOvr") ?? 0) || 0;
    f.maxOvr = Number(sp.get("maxOvr") ?? 99) || 99;
    f.minBadges = Number(sp.get("minBadge") ?? 0) || 0;
    f.maxBadges = sp.get("maxBadge") ? Number(sp.get("maxBadge")) : 99;
    f.minHeight = Number(sp.get("minH") ?? 0) || 0;
    f.maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : null;
    f.minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : null;
    f.tradable = toTri(sp.get("tradable"));
    f.evo = toTri(sp.get("evo"));
    f.duo = toTri(sp.get("duo"));
    f.badges = (sp.get("badges") ?? "").split(",").filter(Boolean);
    setFilters(f);
    const sk = sp.get("sort");
    if (sk && SORTS.some((s) => s.key === sk)) setSortKey(sk);
    if (sp.get("desc")) setSortDesc(sp.get("desc") !== "0");
    const bs = sp.get("basis");
    if (bs === "co" || bs === "pc" || bs === "a") setBasis(bs);
    if (sp.get("view") === "table") setView("table");
    setOnlyFav(sp.get("fav") === "1");
    setReady(true);
  }, []);

  // 筛选变化写回 URL（不新增历史记录）
  useEffect(() => {
    if (!ready) return;
    const sp = new URLSearchParams();
    const put = (k: string, v: string | number | null | undefined) => {
      if (v !== null && v !== undefined && v !== "" && v !== "0") sp.set(k, String(v));
    };
    put("q", filters.q.trim());
    put("pos", filters.pos.join(","));
    put("tier", filters.tier.join(","));
    put("team", filters.team);
    put("coll", filters.collection);
    put("minOvr", filters.minOvr);
    put("maxOvr", filters.maxOvr === 99 ? null : filters.maxOvr);
    put("minBadge", filters.minBadges);
    put("maxBadge", filters.maxBadges === 99 ? null : filters.maxBadges);
    put("badges", filters.badges.join(","));
    put("minH", filters.minHeight);
    put("maxPrice", filters.maxPrice);
    put("minPrice", filters.minPrice);
    if (filters.tradable !== null) sp.set("tradable", filters.tradable ? "1" : "0");
    if (filters.evo !== null) sp.set("evo", filters.evo ? "1" : "0");
    if (filters.duo !== null) sp.set("duo", filters.duo ? "1" : "0");
    if (sortKey !== "overall") sp.set("sort", sortKey);
    if (!sortDesc) sp.set("desc", "0");
    if (basis !== "a") sp.set("basis", basis);
    if (view === "table") sp.set("view", "table");
    if (onlyFav) sp.set("fav", "1");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ready, filters, sortKey, sortDesc, basis, view, onlyFav]);

  const filtered = useMemo(() => {
    const kw = filters.q.trim().toLowerCase();
    // 指定徽章：多选为 AND（同时拥有），用反查索引的集合判断
    const badgeSets = filters.badges.map((id) => new Set(holdersOf(id)));
    return ALL.filter((c) => {
      if ((c.overall ?? 0) < filters.minOvr) return false;
      if ((c.overall ?? 0) > filters.maxOvr) return false;
      if ((c.badge_count ?? 0) < filters.minBadges) return false;
      if ((c.badge_count ?? 0) > filters.maxBadges) return false;
      if ((c.height_cm ?? 0) < filters.minHeight) return false;
      if (filters.pos.length && !filters.pos.some((p) => positionsOf(c).includes(p))) return false;
      if (filters.tier.length && !filters.tier.includes(String(c.tier))) return false;
      if (filters.team && c.team !== filters.team) return false;
      if (filters.collection && c.collection !== filters.collection) return false;
      if (filters.evo !== null && Boolean(c.has_evo) !== filters.evo) return false;
      if (filters.duo !== null && Boolean(c.has_duo) !== filters.duo) return false;
      if (badgeSets.some((s) => !s.has(c.id))) return false;
      const p = priceOf(c);
      if (filters.maxPrice != null && (p == null || p > filters.maxPrice)) return false;
      if (filters.minPrice != null && (p == null || p < filters.minPrice)) return false;
      if (filters.tradable != null) {
        const hasPrice = p != null;
        if (filters.tradable !== hasPrice) return false;
      }
      if (onlyFav && !isFav(c.id)) return false;
      if (kw && ![c.name, c.team, c.theme, c.collection].some((v) => (v ?? "").toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [filters, priceOf, onlyFav, isFav]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    const dir = sortDesc ? -1 : 1;
    const num = (c: QueryCard, key: string): number => {
      if (key === "price") return priceOf(c) ?? -1;
      if (key === "overall") return c.overall ?? -1;
      if (key === "badge_count") return c.badge_count ?? -1;
      if (key === "height_cm") return c.height_cm ?? -1;
      if (key === "released_at") return c.released_at ? Date.parse(c.released_at) : -1;
      return attrNum(c, key) ?? -1;
    };
    arr.sort((a, b) => {
      const va = num(a, sortKey);
      const vb = num(b, sortKey);
      if (va === -1 && vb === -1) return (b.overall ?? 0) - (a.overall ?? 0);
      if (va === -1) return 1;
      if (vb === -1) return -1;
      return (va - vb) * dir || (b.overall ?? 0) - (a.overall ?? 0);
    });
    return arr;
  }, [filtered, sortKey, sortDesc, priceOf]);

  useEffect(() => setShown(PAGE), [filters, sortKey, sortDesc, basis, view]);
  const list = sorted.slice(0, shown);
  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const activeTags = [
    ...filters.pos.map((p) => ({ k: `pos:${p}`, label: `位置 ${p}`, clear: () => setFilters({ ...filters, pos: toggle(filters.pos, p) }) })),
    ...filters.tier.map((t) => ({ k: `tier:${t}`, label: `卡种 ${TIER_CN[Number(t)] ?? t}`, clear: () => setFilters({ ...filters, tier: toggle(filters.tier, t) }) })),
    ...(filters.team ? [{ k: "team", label: filters.team, clear: () => setFilters({ ...filters, team: "" }) }] : []),
    ...(filters.collection ? [{ k: "coll", label: filters.collection, clear: () => setFilters({ ...filters, collection: "" }) }] : []),
    ...(filters.tradable !== null ? [{ k: "tr", label: filters.tradable ? "有价" : "无价", clear: () => setFilters({ ...filters, tradable: null }) }] : []),
    ...(filters.evo !== null ? [{ k: "evo", label: filters.evo ? "可进化" : "无进化", clear: () => setFilters({ ...filters, evo: null }) }] : []),
    ...(filters.duo !== null ? [{ k: "duo", label: filters.duo ? "有双人组" : "无双人组", clear: () => setFilters({ ...filters, duo: null }) }] : []),
    ...(filters.maxPrice != null ? [{ k: "price", label: `价格 ≤ ${filters.maxPrice.toLocaleString()}`, clear: () => setFilters({ ...filters, maxPrice: null }) }] : []),
    ...(filters.minPrice != null ? [{ k: "priceMin", label: `价格 ≥ ${filters.minPrice.toLocaleString()}`, clear: () => setFilters({ ...filters, minPrice: null }) }] : []),
    ...filters.badges.map((id) => ({
      k: `badge:${id}`,
      label: `徽章 ${badgeName(id).zh}`,
      clear: () => setFilters({ ...filters, badges: filters.badges.filter((x) => x !== id) }),
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-bold text-white">球员卡</h1>
        <span className="text-xs text-slate-500">
          共 {ALL.length} 张 · 筛选出 {filtered.length} 张
          {doc?.ts && ` · 行情快照 ${new Date(doc.ts).toLocaleString("zh-CN", { hour12: false })}`}
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
            <input type="range" min={0} max={99} value={filters.minOvr}
              onChange={(e) => setFilters({ ...filters, minOvr: Number(e.target.value) })}
              className="ml-2 accent-accent" />
          </label>
          <label className="text-sm text-slate-400">
            总评 ≤ <b className="text-ink">{filters.maxOvr}</b>
            <input type="range" min={0} max={99} value={filters.maxOvr}
              onChange={(e) => setFilters({ ...filters, maxOvr: Number(e.target.value) })}
              className="ml-2 accent-accent" />
          </label>
          <label className="text-sm text-slate-400">
            徽章 ≥ <b className="text-ink">{filters.minBadges}</b>
            <input type="range" min={0} max={40} value={filters.minBadges}
              onChange={(e) => setFilters({ ...filters, minBadges: Number(e.target.value) })}
              className="ml-2 accent-accent" />
          </label>
          <label className="text-sm text-slate-400">
            徽章 ≤
            <input type="number" min={0} max={99} value={filters.maxBadges === 99 ? "" : filters.maxBadges} placeholder="不限"
              onChange={(e) => setFilters({ ...filters, maxBadges: e.target.value ? Number(e.target.value) : 99 })}
              className="ml-2 w-20 rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none" />
          </label>
          <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)}
            className="rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none">
            <option value="a">综合价</option>
            {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}价</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted">位置</span>
            {POS.map((p) => (
              <button key={p} onClick={() => setFilters({ ...filters, pos: toggle(filters.pos, p) })}
                className={`rounded-md border px-2 py-1 text-xs ${filters.pos.includes(p) ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted">卡种</span>
            {tiers.map(([t, n]) => (
              <button key={t} onClick={() => setFilters({ ...filters, tier: toggle(filters.tier, String(t)) })}
                className={`rounded-md border px-2 py-1 text-xs ${filters.tier.includes(String(t)) ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}
                title={`${TIER_CN[t] ?? t} ${TIER_EN[t] ?? ""} · ${n} 张`}>
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
            价格
            <input type="number" min={0} step={10000} value={filters.minPrice ?? ""} placeholder="最低"
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
              className="mx-1.5 w-24 rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none" />
            <span className="text-muted">–</span>
            <input type="number" min={0} step={10000} value={filters.maxPrice ?? ""} placeholder="最高"
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
              className="ml-1.5 w-24 rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none" />
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
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-muted">进化</span>
            {[["all", "全部"], ["yes", "有"], ["no", "无"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilters({ ...filters, evo: v === "all" ? null : v === "yes" })}
                className={`rounded-md border px-2 py-1 ${(filters.evo === null) === (v === "all") ? "border-accent bg-accent/15 text-accent" : "border-court-600"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-muted">双人组</span>
            {[["all", "全部"], ["yes", "有"], ["no", "无"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilters({ ...filters, duo: v === "all" ? null : v === "yes" })}
                className={`rounded-md border px-2 py-1 ${(filters.duo === null) === (v === "all") ? "border-accent bg-accent/15 text-accent" : "border-court-600"}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => setFilters(emptyFilters())}
            className="rounded-lg border border-court-600 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300">
            重置
          </button>
        </div>

        {/* 指定徽章：统一走徽章词库（中文名 / 英文名 / 旧译别名都能搜到） */}
        <div className="space-y-2 border-t border-court-600 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted">指定徽章</span>
            <Link href="/badges/" className="text-[11px] text-accent hover:underline">徽章库 →</Link>
            <input value={badgeQ} onChange={(e) => setBadgeQ(e.target.value)}
              placeholder="搜索徽章（如 空中作业 / Aerial Wizard / 空中魔术师）"
              className="w-72 rounded-lg border border-court-600 bg-court-900 px-2 py-1.5 text-xs text-ink outline-none focus:border-accent" />
            <div className="flex flex-wrap items-center gap-1">
              {[{ id: "all", name_zh: "全部" }, ...CATEGORIES].map((c) => (
                <button key={c.id} onClick={() => setBadgeCat(c.id)}
                  className={`rounded-md border px-1.5 py-0.5 text-[11px] ${badgeCat === c.id ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-500"}`}>
                  {c.name_zh}
                </button>
              ))}
            </div>
            {filters.badges.length > 0 && (
              <span className="text-[11px] text-slate-500">已选 {filters.badges.length} 个（需同时拥有）</span>
            )}
          </div>

          {filters.badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.badges.map((id) => (
                <button key={id} title="点击移除"
                  onClick={() => setFilters({ ...filters, badges: filters.badges.filter((x) => x !== id) })}>
                  <BadgeItem badgeId={id} showEn />
                </button>
              ))}
            </div>
          )}

          {(badgeQ.trim() || badgeCat !== "all") && (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-court-600 bg-court-900/60 p-2">
              {searchBadges(badgeQ)
                .filter((b) => badgeCat === "all" || b.category === badgeCat)
                .filter((b) => !filters.badges.includes(b.badge_id))
                .slice(0, 40)
                .map((b) => (
                  <button key={b.badge_id} onClick={() => setFilters({ ...filters, badges: [...filters.badges, b.badge_id] })}
                    className="hover:opacity-80">
                    <BadgeItem badgeId={b.badge_id} />
                  </button>
                ))}
            </div>
          )}
        </div>

        {activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted">已选</span>
            {activeTags.map((t) => (
              <button key={t.k} onClick={t.clear}
                className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20">
                {t.label} ✕
              </button>
            ))}
          </div>
        )}
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
          <div className="overflow-x-auto rounded-xl border border-court-600">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-court-800 text-left text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-court-800 px-3 py-2">卡</th>
                  <th className="px-2 py-2">位置</th>
                  <th className="px-2 py-2">球队</th>
                  <th className="px-2 py-2">系列</th>
                  <th className="px-2 py-2 text-right">三分</th>
                  <th className="px-2 py-2 text-right">运球</th>
                  <th className="px-2 py-2 text-right">速度</th>
                  <th className="px-2 py-2 text-right">外防</th>
                  <th className="px-2 py-2 text-right">内防</th>
                  <th className="px-2 py-2 text-right">攻板</th>
                  <th className="px-2 py-2 text-right">徽章</th>
                  <th className="px-2 py-2 text-right">价格</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const rar = rarity(c.overall);
                  const p = priceOf(c);
                  const cell = (k: string) => attrNum(c, k) ?? "-";
                  return (
                    <tr key={c.id} className="border-t border-court-700/60 bg-court-900/40 hover:bg-court-800/60">
                      <td className="sticky left-0 z-10 bg-court-900 px-3 py-2">
                        <LinkRow id={c.id} ovr={c.overall} name={c.name} rar={rar.text} />
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-300">{positionsOf(c).join("/")}</td>
                      <td className="px-2 py-2 text-xs text-slate-400">{c.team ?? "-"}</td>
                      <td className="px-2 py-2 text-xs text-slate-400">{c.theme ?? c.collection ?? "-"}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("shot_3pt")}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("ball_handle")}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("speed")}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("perimeter_defense")}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("interior_defense")}</td>
                      <td className="px-2 py-2 text-right text-xs">{cell("offensive_rebound")}</td>
                      <td className="px-2 py-2 text-right text-xs">{c.badge_count ?? 0}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-gain">{p != null ? fmtMt(p) : "-"}</td>
                      <td className="px-2 py-2 text-right">
                        <Link href={`/compare/?ids=${c.id}`} className="text-[11px] text-slate-500 hover:text-accent">对比</Link>
                      </td>
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
        <p className="py-10 text-sm text-slate-500">没有匹配的卡片</p>
      )}
    </div>
  );
}

function LinkRow({ id, ovr, name, rar }: { id: number; ovr: number | null; name: string; rar: string }) {
  return (
    <Link href={`/player/${id}/`} className="group flex items-center gap-1.5">
      <span className={`font-black ${rar}`}>{ovr ?? "-"}</span>
      <span className="text-slate-100 group-hover:text-accent">{name}</span>
    </Link>
  );
}
