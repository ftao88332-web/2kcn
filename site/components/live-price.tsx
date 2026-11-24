"use client";

import { fmtNum } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

/** 列表里的实时价：主机 / PC 两行；prices.json 没有则回退每日快照价。 */
export default function LivePrice({ id, fallback }: { id: number; fallback?: number | null }) {
  const { doc } = usePrices();
  const e = doc?.cards?.[String(id)];
  const co = e?.co ?? null;
  const pc = e?.pc ?? null;

  if (co == null && pc == null) {
    if (fallback == null) return null;
    return (
      <div className="absolute right-2 top-2 rounded bg-court-900/80 px-1.5 py-0.5 text-[10px] font-mono text-gain"
        title="每日快照价">
        {fmtNum(fallback)}
      </div>
    );
  }

  return (
    <div
      className="absolute right-2 top-2 rounded bg-court-900/85 px-1.5 py-0.5 text-right text-[9px] font-mono leading-tight"
      title={e ? `行情更新于 ${e.u.replace("T", " ").replace("Z", "")} UTC` : "行情"}
    >
      {co != null && (
        <div className="text-gain"><span className="text-[8px] text-muted">主机 </span>{fmtNum(co)}</div>
      )}
      {pc != null && (
        <div className="text-accent"><span className="text-[8px] text-muted">PC </span>{fmtNum(pc)}</div>
      )}
    </div>
  );
}
