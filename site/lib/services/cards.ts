/** 卡片数据服务：所有页面共用的查询、筛选、排序逻辑。 */
import index from "@/data/cards_index.json";
import { IndexCard } from "@/lib/core";

export type SortKey =
  | "overall" | "price" | "badge_count" | "hof_count" | "height_cm" | "released_at"
  | "shot_3pt" | "shot_3pt_desc" | "ball_handle" | "speed" | "perimeter_defense"
  | "interior_defense" | "offensive_rebound" | "defensive_rebound"
  | "shot_mid" | "driving_layup" | "steal" | "block" | "strength" | "vertical"
  | "speed_with_ball" | "passing_accuracy";

export type CardStats = Record<string, number | null>;

export interface QueryCard extends IndexCard {
  has_evo?: boolean | null;
  has_duo?: boolean | null;
  released_at?: string | null;
  stats?: CardStats | null;
}

export interface CardQuery {
  q?: string;
  pos?: string[];
  tier?: number[];
  minOvr?: number | null;
  maxOvr?: number | null;
  minBadges?: number | null;
  team?: string | null;
  collection?: string | null;
  tradable?: boolean | null;
  maxPrice?: number | null;
  minPrice?: number | null;
  evo?: boolean | null;
  duo?: boolean | null;
  priceOf?: (id: number) => number | null;
}

export const CARDS: QueryCard[] = index as unknown as QueryCard[];
export const BY_ID_INDEX = new Map<number, QueryCard>(CARDS.map((c) => [c.id, c]));

export function getIndexCard(id: number | string): QueryCard | undefined {
  return BY_ID_INDEX.get(Number(id));
}

/** 卡片可打的全部位置（主 + 副） */
export function positionsOf(c: QueryCard): string[] {
  return [...new Set([c.position, c.sec].filter(Boolean) as string[])];
}

export function stat(c: QueryCard, key: string): number | null {
  const v = c.stats?.[key];
  return typeof v === "number" ? v : null;
}

const norm = (s: string) => s.toLowerCase().trim();

export function matches(c: QueryCard, f: CardQuery): boolean {
  if (f.q) {
    const q = norm(f.q);
    const hay = [c.name, c.team, c.collection, c.theme].filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.pos?.length && !f.pos.some((p) => positionsOf(c).includes(p))) return false;
  if (f.tier?.length && !f.tier.includes(c.tier ?? -1)) return false;
  if (f.minOvr != null && (c.overall ?? 0) < f.minOvr) return false;
  if (f.maxOvr != null && (c.overall ?? 0) > f.maxOvr) return false;
  if (f.minBadges != null && (c.badge_count ?? 0) < f.minBadges) return false;
  if (f.team && c.team !== f.team) return false;
  if (f.collection && c.collection !== f.collection) return false;
  if (f.evo != null && Boolean(c.has_evo) !== f.evo) return false;
  if (f.duo != null && Boolean(c.has_duo) !== f.duo) return false;

  if (f.tradable != null) {
    const price = f.priceOf ? f.priceOf(c.id) : null;
    // 可交易 = 有有效成交价；无价不能当作 0 价
    if (f.tradable && price == null) return false;
    if (!f.tradable && price != null) return false;
  }
  if (f.maxPrice != null || f.minPrice != null) {
    const price = f.priceOf ? f.priceOf(c.id) : null;
    if (price == null) return false; // 无价格不参与价格区间筛选
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.minPrice != null && price < f.minPrice) return false;
  }
  return true;
}

export function search(f: CardQuery = {}): QueryCard[] {
  return CARDS.filter((c) => matches(c, f));
}

function keyNum(c: QueryCard, key: SortKey, priceOf?: (id: number) => number | null): number {
  if (key === "price") {
    const p = priceOf ? priceOf(c.id) : null;
    return p == null ? -1 : p; // 无价排最后
  }
  if (key === "overall") return c.overall ?? -1;
  if (key === "badge_count") return c.badge_count ?? -1;
  if (key === "hof_count") return c.hof_count ?? -1;
  if (key === "height_cm") return c.height_cm ?? -1;
  if (key === "released_at") {
    return c.released_at ? Date.parse(c.released_at) : -1;
  }
  const v = stat(c, key);
  return v == null ? -1 : v;
}

export function sortCards(
  list: QueryCard[],
  key: SortKey = "overall",
  desc = true,
  priceOf?: (id: number) => number | null
): QueryCard[] {
  const dir = desc ? -1 : 1;
  return list.slice().sort((a, b) => {
    const va = keyNum(a, key, priceOf);
    const vb = keyNum(b, key, priceOf);
    // 无数据（-1）恒排在最后
    if (va === -1 && vb === -1) return (b.overall ?? 0) - (a.overall ?? 0);
    if (va === -1) return 1;
    if (vb === -1) return -1;
    return (va - vb) * dir || (b.overall ?? 0) - (a.overall ?? 0);
  });
}

export function byTier(list: QueryCard[]): { tier: number; count: number }[] {
  const m = new Map<number, number>();
  for (const c of list) {
    if (c.tier == null) continue;
    m.set(c.tier, (m.get(c.tier) ?? 0) + 1);
  }
  return [...m.entries()].map(([tier, count]) => ({ tier, count })).sort((a, b) => a.tier - b.tier);
}

/** 全站搜索：卡片名 / 球队 / 系列 / 球员名，按相关度粗排 */
export function quickSearch(q: string, limit = 10): QueryCard[] {
  const k = norm(q);
  if (!k) return [];
  const scored = CARDS.map((c) => {
    const name = (c.name ?? "").toLowerCase();
    let s = 0;
    if (name === k) s = 100;
    else if (name.startsWith(k)) s = 70;
    else if (name.includes(k)) s = 50;
    else if ((c.team ?? "").toLowerCase().includes(k)) s = 25;
    else if ((c.collection ?? "").toLowerCase().includes(k)) s = 20;
    else if ((c.theme ?? "").toLowerCase().includes(k)) s = 15;
    return { c, s: s + (c.overall ?? 0) / 100 };
  }).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.c);
}
