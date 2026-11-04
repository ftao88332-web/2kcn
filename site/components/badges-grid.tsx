"use client";

import { useState } from "react";
import { badgeCn, TIER_CN } from "@/lib/i18n";

/** 徽章等级 → 识别色（设计方案固定色卡） */
const TIER_STYLE: Record<number, string> = {
  5: "border-[#B762FF]/70 bg-[#B762FF]/10 text-[#D9A9FF] hover:scale-[1.05]",
  4: "border-[#B762FF]/60 bg-[#B762FF]/10 text-[#C48CFF] hover:scale-[1.05]",
  3: "border-[#FFC845]/50 bg-[#FFC845]/10 text-[#FFC845] hover:scale-[1.05]",
  2: "border-[#C5CDDB]/40 bg-[#C5CDDB]/10 text-[#C5CDDB] hover:scale-[1.05]",
  1: "border-[#B88646]/60 bg-[#B88646]/10 text-[#CE9B5C] hover:scale-[1.05]",
};

const COLLAPSED = 24;

export default function BadgesGrid({ badges }: { badges: Record<string, number> | undefined }) {
  const [showAll, setShowAll] = useState(false);
  const owned = Object.entries(badges ?? {}).filter(
    ([, v]) => typeof v === "number" && v > 0
  );
  if (!owned.length) {
    return <p className="text-sm text-muted">该卡暂无已解锁徽章。</p>;
  }
  owned.sort((a, b) => (b[1] as number) - (a[1] as number));
  const list = showAll ? owned : owned.slice(0, COLLAPSED);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map(([slug, tier]) => {
          const { name, zh } = badgeCn(slug);
          return (
            <span
              key={slug}
              className={`inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-transform duration-100 ${
                TIER_STYLE[tier] ?? "border-court-600 bg-court-700 text-ink/80 hover:scale-[1.05]"
              }`}
              title={`${slug} · ${TIER_CN[tier] ?? ""}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              <span className="font-semibold">{name}</span>
              <span className="text-[10px] opacity-80">{TIER_CN[tier] ?? tier}</span>
              {!zh && <span className="text-[9px] opacity-60">EN</span>}
            </span>
          );
        })}
      </div>
      {owned.length > COLLAPSED && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 rounded-md border border-court-600 px-3 py-1.5 text-xs text-accent transition-colors hover:border-accent/60 hover:bg-accent/10"
        >
          {showAll ? "折叠" : `展开全部 ${owned.length} 个徽章`}
        </button>
      )}
    </div>
  );
}
