/** 站点共享类型、路径工具与行情数据。 */

export type IndexCard = {
  id: number;
  name: string;
  version: string;
  overall: number | null;
  off_overall?: number | null;
  def_overall?: number | null;
  position: string | null;
  sec: string | null;
  team: string | null;
  theme: string | null;
  collection: string | null;
  tier?: number | null;
  image: string | null;
  mt: number | null;
  badge_count?: number | null;
  hof_count?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  weight_lb?: number | null;
  wingspan_cm?: number | null;
  released_at?: string | null;
  has_evo?: boolean | null;
  has_duo?: boolean | null;
  /** 卡库/比较器共用的关键属性（瘦字段，完整属性在 cards.json 的 attrs） */
  stats?: Record<string, number | null> | null;
  attrs?: Record<string, unknown> | null;
  badges?: Record<string, unknown> | null;
  hotzones?: Record<string, unknown> | null;
  animations?: Record<string, unknown> | null;
  plays?: string[] | null;
  duos?: { id: number; name?: string | null; overall?: number | null; position?: string | null }[] | null;
  evos?: { stage?: number | null; label?: string | null; gains?: { k: string; d: number }[] | null }[] | null;
};

export type PriceEntry = {
  a: number | null;   // 两个价格池的综合均价
  s: number | null;   // 总成交笔数
  u: string;          // 更新时间
  co: number | null;  // 主机（PS/XBOX/SWITCH）均价
  pc: number | null;  // PC 均价
  cos?: number | null; // 主机成交笔数
  pcs?: number | null; // PC 成交笔数
  tr: number[];       // 主机走势点
  tp?: number[];      // PC 走势点
  sales: { b: number; o: number | null; t: string; p?: string }[];
};

export type ActiveCard = {
  id: number | null;
  name: string | null;
  ovr: number | null;
  theme: string | null;
  camp: string | null;
  price: number | null;
  sales: number | null;
  volume: number | null;
  last: string;
};

export type PricesDoc = {
  ts: string;
  cards: Record<string, PriceEntry>;
  active: ActiveCard[];        // 主机榜
  activePc?: ActiveCard[];     // PC 榜
};

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string | null | undefined): string {
  return path ? BASE + path : "";
}

export function fmtMt(n: number | null | undefined): string {
  return n == null ? "-" : n.toLocaleString("en-US") + " MT";
}

/** 不带单位的数字（列表角标用） */
export function fmtNum(n: number | null | undefined): string {
  return n == null ? "-" : n.toLocaleString("en-US");
}

/** 从 prices 文档取某张卡的价格（默认综合均价，可指定端） */
export function priceOfId(
  doc: PricesDoc | null,
  id: number,
  basis: "co" | "pc" | "a" = "a"
): number | null {
  const e = doc?.cards?.[String(id)];
  if (!e) return null;
  return e[basis] ?? e.a ?? null;
}

/** 2K27 拍卖行只有两个价格池 */
export const PLATFORMS = [
  { key: "co", label: "主机", hint: "PS / XBOX / SWITCH" },
  { key: "pc", label: "PC", hint: "Steam" },
] as const;

export function relativeBy(isoPrefix: string, now?: Date): string {
  if (!isoPrefix) return "";
  const d = new Date(isoPrefix.endsWith("Z") ? isoPrefix : isoPrefix + "Z");
  const diff = Math.max(0, (now ? now.getTime() : Date.now()) - d.getTime());
  const m = Math.round(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} 小时前` : `${Math.round(h / 24)} 天前`;
}
