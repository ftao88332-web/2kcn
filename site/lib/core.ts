/** 站点共享类型、路径工具与行情数据。 */

export type IndexCard = {
  id: number;
  playerId: number | null;
  name: string;
  version: string;
  overall: number | null;
  position: string | null;
  sec: string | null;
  team: string | null;
  theme: string | null;
  collection: string | null;
  image: string | null;
  mt: number | null;
  auctionable: boolean | null;
  attrs?: Record<string, unknown> | null;
  badges?: Record<string, unknown> | null;
  hotzones?: Record<string, unknown> | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  wingspan_cm?: number | null;
};

export type PriceEntry = {
  a: number | null;   // 双平台均价
  s: number | null;   // 成交笔数
  u: string;          // 更新时间
  pc: number | null;  // PC 均价
  co: number | null;  // 主机均价
  tr: number[];       // 主机端趋势点
  sales: { b: number; o: number | null; t: string }[];
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
  active: ActiveCard[];
};

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string | null | undefined): string {
  return path ? BASE + path : "";
}

export function fmtMt(n: number | null | undefined): string {
  return n == null ? "-" : n.toLocaleString("en-US") + " MT";
}

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
