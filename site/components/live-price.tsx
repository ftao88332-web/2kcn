"use client";

import { fmtMt } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

/** 列表里的实时价：prices.json 有就用最新均价，没有回退每日快照值；都没有则不渲染。 */
export default function LivePrice({ id, fallback }: { id: number; fallback?: number | null }) {
  const { doc } = usePrices();
  const e = doc?.cards?.[String(id)];
  const v = e?.a ?? e?.co ?? e?.pc ?? fallback ?? null;
  if (v == null) return null;
  return (
    <div
      className="absolute right-2 top-2 rounded bg-court-900/80 px-1.5 py-0.5 text-[10px] font-mono text-gain"
      title={e ? `行情更新于 ${e.u.replace("T", " ").replace("Z", "")} UTC` : "每日快照价"}
    >
      {fmtMt(v)}
    </div>
  );
}
