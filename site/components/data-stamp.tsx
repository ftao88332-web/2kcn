"use client";

import { usePrices } from "@/lib/use-prices";
import { relativeBy } from "@/lib/core";

/** 全站行情快照时间戳（挂在页头/页脚旁）。 */
export default function DataStamp() {
  const { doc } = usePrices();
  if (!doc?.ts) return null;
  return (
    <span className="text-[11px] text-slate-500">
      行情快照 {relativeBy(doc.ts)}
    </span>
  );
}
