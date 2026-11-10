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
type Zone = [key: string, label: string, x: number, y: number, w: number, h: number];

// 半场俯视网格：三分 5 格 + 中距离 5 格 + 近筐 3 格 + 篮下
const HZ_ZONES: Zone[] = [
  ["hz_3pt_left", "左翼三分", 20, 18, 56, 87],
  ["hz_3pt_left_center", "左弧顶三分", 76, 18, 56, 87],
  ["hz_3pt_center", "弧顶三分", 132, 18, 56, 87],
  ["hz_3pt_right_center", "右弧顶三分", 188, 18, 56, 87],
  ["hz_3pt_right", "右翼三分", 244, 18, 56, 87],
  ["hz_mid_left", "左中距离", 20, 105, 56, 75],
  ["hz_mid_left_center", "左腰中距离", 76, 105, 56, 75],
  ["hz_mid_center", "罚球线", 132, 105, 56, 75],
  ["hz_mid_right_center", "右腰中距离", 188, 105, 56, 75],
  ["hz_mid_right", "右中距离", 244, 105, 56, 75],
  ["hz_close_left", "左侧近筐", 110, 180, 33.3, 70],
  ["hz_close_middle", "正面近筐", 143.3, 180, 33.4, 70],
  ["hz_close_right", "右侧近筐", 176.7, 180, 33.3, 70],
  ["hz_under_basket", "篮下", 135, 250, 50, 40],
];

const hzColor = (v: number) =>
  v >= 3 ? "#B762FF" : v === 2 ? "#4ADE80" : v === 1 ? "rgba(79,140,255,.45)" : "#232736";
const hzName = (v: number) => (v >= 3 ? "大热" : v === 2 ? "热" : v === 1 ? "常规" : "冷区");

export function Hotzones({ hz }: { hz: Record<string, unknown> }) {
  const val = (k: string) => (k in hz ? Number(hz[k]) : -1);
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
      <svg viewBox="0 0 320 300" className="h-64 w-64 shrink-0" role="img" aria-label="投篮热区半场图">
        {/* 底色 */}
        <rect x="20" y="10" width="280" height="280" rx="4" fill="#141824" />

        {HZ_ZONES.map(([key, label, x, y, w, h]) => {
          const v = val(key);
          if (v < 0) return null;
          return (
            <rect key={key} x={x} y={y} width={w} height={h} rx="2"
              fill={hzColor(v)} stroke="#0F1118" strokeWidth="1.5">
              <title>{`${label}：${hzName(v)}${v > 0 ? `（${v}）` : ""}`}</title>
            </rect>
          );
        })}

        {/* 球场线画在热区之上，避免被色块盖住 */}
        <g fill="none" stroke="#0B0E16" strokeWidth="1.6" opacity=".9">
          <rect x="20" y="10" width="280" height="280" rx="4" />
          <path d="M20 250 L20 105 A140 140 0 0 1 300 105 L300 250" strokeDasharray="6 4" />
          <rect x="110" y="180" width="100" height="110" />
          <circle cx="160" cy="180" r="26" />
          <line x1="145" y1="258" x2="175" y2="258" strokeWidth="3" />
          <circle cx="160" cy="270" r="5" stroke="#E8EBF2" strokeWidth="1.2" />
        </g>
      </svg>

      <div className="space-y-2 text-[11px] leading-5 text-muted">
        <p className="font-semibold text-ink/90">投篮热区</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#B762FF] align-[-1px]" />大热</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-gain align-[-1px]" />热</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent/50 align-[-1px]" />常规</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-court-700 align-[-1px]" />冷区</span>
        </p>
        <p className="max-w-[180px]">悬停任意区域查看具体热度值。数据来自 2kdb 卡片详情。</p>
      </div>
    </div>
  );
}
