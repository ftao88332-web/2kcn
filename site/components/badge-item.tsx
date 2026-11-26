"use client";

import { badgeName, levelOf, categoryOf, type BadgeLevel } from "@/lib/services/badges";

/** 全站唯一的徽章展示组件：详情页、卡库、比较器、徽章库都必须用它。 */
export default function BadgeItem({
  badgeId,
  tier,
  showEn = false,
  showCategory = false,
  title,
}: {
  badgeId: string;
  tier?: number | null;
  showEn?: boolean;
  showCategory?: boolean;
  title?: string;
}) {
  const { zh, en, known } = badgeName(badgeId);
  const lv: BadgeLevel | undefined = levelOf(tier);
  const cat = categoryOf(badgeId);
  const color = lv?.color ?? "#64748B";
  const tip = title ?? `${zh}${en && en !== zh ? ` / ${en}` : ""}${lv ? ` · ${lv.name_zh}` : ""}`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] leading-none"
      style={{ borderColor: `${color}66`, background: `${color}14` }}
      title={tip}
    >
      <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="font-medium text-ink">{zh}</span>
      {showEn && en && en !== zh && <span className="text-[10px] text-slate-500">{en}</span>}
      {lv && <span className="text-[10px] font-semibold" style={{ color }}>{lv.name_zh}</span>}
      {showCategory && cat && <span className="text-[10px] text-slate-500">{cat.name_zh}</span>}
      {!known && <span className="text-[9px] text-amber-400/80">词库外</span>}
    </span>
  );
}
