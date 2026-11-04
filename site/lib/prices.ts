/** 实时价格数据（price scrape → site/public/data/prices.json） */
export type PriceEntry = {
  a: number | null; //  双平台均价
  s: number | null; //  成交笔数
  u: string;        //  更新时间 ISO
  pc: number | null; //  PC 均价
  co: number | null; //  主机均价
  tr: number[];     //  主机端趋势点
  sales: { b: number; o: number | null; t: string }[]; // 最近成交
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

export function fmtMt(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("en-US") + " MT";
}

export function relativeBy(isoPrefix: string, now?: Date): string {
  if (!isoPrefix) return "";
  const d = new Date(isoPrefix.endsWith("Z") ? isoPrefix : isoPrefix + "Z");
  const t = now ? now.getTime() : Date.now();
  const diff = Math.max(0, t - d.getTime());
  const m = Math.round(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.round(h / 24)} 天前`;
}
