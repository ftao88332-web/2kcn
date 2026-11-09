"use client";

import { useState } from "react";
import { ATTR_GROUPS, TIER_CN, attrCn, badgeCn } from "@/lib/i18n";

/* ---------------- 属性 ---------------- */
const barColor = (v: number) =>
  v >= 95 ? "bg-accent" : v >= 90 ? "bg-accent/70" : v >= 80 ? "bg-accent/40"
  : v >= 70 ? "bg-muted/40" : "bg-muted/20";
const numColor = (v: number) =>
  v >= 95 ? "text-accent font-bold" : v >= 90 ? "text-accent" : "text-ink/90";

export function AttrsGroups({ attrs }: { attrs: Record<string, unknown> }) {
  if (!Object.keys(attrs).length) return <p className="text-sm text-muted">属性数据暂缺。</p>;
  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
      {ATTR_GROUPS.map((g) => {
        const rows = g.keys.filter((k) => attrs[k] != null);
        if (!rows.length) return null;
        return (
          <div key={g.en}>
            <p className="mb-2.5 border-b border-court-600 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
              {g.cn} <span className="opacity-60">{g.en}</span>
            </p>
            <div className="space-y-2.5">
              {rows.map((k) => {
                const v = Number(attrs[k]);
                return (
                  <div key={k} className="flex items-center gap-2.5">
                    <span className="w-20 shrink-0 text-xs text-muted">{attrCn(k)}</span>
                    <div className="h-1.5 min-w-0 flex-1 rounded-full bg-court-700">
                      <div className={`h-1.5 rounded-full ${barColor(v)}`} style={{ width: `${Math.min(100, v)}%` }} />
                    </div>
                    <span className={`w-7 shrink-0 text-right text-xs ${numColor(v)}`}>{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- 徽章 ---------------- */
const TIER_STYLE: Record<number, string> = {
  5: "border-[#B762FF]/70 bg-[#B762FF]/10 text-[#D9A9FF]",
  4: "border-[#B762FF]/60 bg-[#B762FF]/10 text-[#C48CFF]",
  3: "border-[#FFC845]/50 bg-[#FFC845]/10 text-[#FFC845]",
  2: "border-[#C5CDDB]/40 bg-[#C5CDDB]/10 text-[#C5CDDB]",
  1: "border-[#B88646]/60 bg-[#B88646]/10 text-[#CE9B5C]",
};
const COLLAPSED = 24;

export function BadgesGrid({ badges }: { badges: Record<string, number> }) {
  const [showAll, setShowAll] = useState(false);
  const owned = Object.entries(badges).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!owned.length) return <p className="text-sm text-muted">该卡暂无已解锁徽章。</p>;
  const list = showAll ? owned : owned.slice(0, COLLAPSED);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {list.map(([slug, tier]) => {
          const { name, zh } = badgeCn(slug);
          return (
            <span key={slug}
              className={`inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${TIER_STYLE[tier] ?? "border-court-600 bg-court-700 text-ink/80"}`}
              title={`${slug} · ${TIER_CN[tier] ?? ""}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              <span className="font-semibold">{name}</span>
              <span className="text-[10px] opacity-80">{TIER_CN[tier] ?? tier}</span>
              {!zh && <span className="text-[9px] opacity-60">EN</span>}
            </span>
          );
        })}
      </div>
      {owned.length > COLLAPSED && (
        <button onClick={() => setShowAll(!showAll)}
          className="mt-4 rounded-md border border-court-600 px-3 py-1.5 text-xs text-accent hover:border-accent/60 hover:bg-accent/10">
          {showAll ? "折叠" : `展开全部 ${owned.length} 个徽章`}
        </button>
      )}
    </div>
  );
}

/* ---------------- 热区 ---------------- */
const HZ_ORDER: [string, string][] = [
  ["hz_under_basket", "篮下"],
  ["hz_close_left", "近左"], ["hz_close_middle", "近中"], ["hz_close_right", "近右"],
  ["hz_mid_left", "中左"], ["hz_mid_left_center", "中偏左"], ["hz_mid_center", "中"],
  ["hz_mid_right_center", "中偏右"], ["hz_mid_right", "中右"],
  ["hz_3pt_left", "三分左"], ["hz_3pt_left_center", "三分偏左"], ["hz_3pt_center", "三分中"],
  ["hz_3pt_right_center", "三分偏右"], ["hz_3pt_right", "三分右"],
];

export function Hotzones({ hz }: { hz: Record<string, unknown> }) {
  const cls = (v: number) =>
    v >= 3 ? "bg-[#B762FF]" : v === 2 ? "bg-gain" : v === 1 ? "bg-accent/50" : "bg-court-700";
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
      {HZ_ORDER.filter(([k]) => k in hz).map(([k, label]) => {
        const v = Number(hz[k]);
        return (
          <div key={k} className="text-center">
            <div className={`mx-auto h-5 w-5 rounded-full ${v ? cls(v) : "bg-court-700"}`} title={label} />
            <p className="mt-1.5 text-[10px] text-muted">{label}</p>
          </div>
        );
      })}
      <div className="self-center text-[10px] leading-5 text-muted">
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#B762FF] align-[-1px]" />大热</span>
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-gain align-[-1px]" />热</span>
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-accent/50 align-[-1px]" />常规</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-court-700 align-[-1px]" />冷区</span>
      </div>
    </div>
  );
}
