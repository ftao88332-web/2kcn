import { PriceSnapshot } from "@/lib/types";

/** 轻量 SVG 价格曲线（不引第三方库） */
export default function PriceChart({ prices }: { prices: PriceSnapshot[] }) {
  const points = prices.filter((p) => p.mt != null) as (PriceSnapshot & { mt: number })[];
  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        快照不足 2 天，先攒几天数据再画曲线。
      </p>
    );
  }
  const w = 720;
  const h = 160;
  const pad = 8;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const vmin = Math.min(...points.map((p) => p.mt));
  const vmax = Math.max(...points.map((p) => p.mt));
  const span = vmax - vmin || 1;
  const ys = points.map((p) => h - pad - ((p.mt - vmin) / span) * (h - pad * 2));
  const line = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <path d={line} fill="none" stroke="#facc15" strokeWidth="2" />
      </svg>
      <p className="text-xs text-slate-400">
        最新 {last.mt.toLocaleString()} MT · 区间 {vmin.toLocaleString()} ~ {vmax.toLocaleString()} ·{" "}
        {points.length} 个快照点
      </p>
    </div>
  );
}
