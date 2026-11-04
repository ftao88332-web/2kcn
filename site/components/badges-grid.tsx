"use client";

import { useState } from "react";
import { badgeCn, TIER_CN } from "@/lib/i18n";

const TIER_STYLE: Record<number, string> = {
  1: "border-orange-400/70 bg-orange-400/10 text-orange-200",
  2: "border-slate-400/70 bg-slate-300/10 text-slate-100",
  3: "border-yellow-400/80 bg-yellow-400/10 text-yellow-200",
  4: "border-fuchsia-400/80 bg-fuchsia-400/10 text-fuchsia-200",
  5: "border-rainbow text-white bg-gradient-to-r from-fuchsia-500/20 to-cyan-400/20",
};

export default function BadgesGrid({ badges }: { badges: Record<string, number> | undefined }) {
  const [showAll, setShowAll] = useState(false);
  const owned = Object.entries(badges ?? {}).filter(([, v]) => typeof v === "number" && v > 0);
  if (!owned.length) {
    return <p className="text-sm text-slate-500">该卡暂无已解锁徽章。</p>;
  }
  owned.sort((a, b) => (b[1] as number) - (a[1] as number));
  const list = showAll ? owned : owned.slice(0, 24);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map(([slug, tier]) => {
          const { name, zh } = badgeCn(slug);
          return (
            <span
              key={slug}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${TIER_STYLE[tier] ?? "border-court-600 bg-court-800 text-slate-300"}`}
              title={`${slug} · ${TIER_CN[tier] ?? ""}`}
            >
              <span className="font-semibold">{name}</span>
              <span className="text-[10px] opacity-80">{TIER_CN[tier] ?? tier}</span>
              {!zh && <span className="text-[9px] opacity-60">EN</span>}
            </span>
          );
        })}
      </div>
      {owned.length > 24 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-3 text-xs text-accent hover:underline">
          {showAll ? "收起" : `显示全部 ${owned.length} 个徽章`}
        </button>
      )}
    </div>
  );
}
