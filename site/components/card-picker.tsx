"use client";

import { useMemo, useState } from "react";
import type { IndexCard } from "@/lib/core";
import { TIER_CN, TIER_COLOR } from "@/lib/i18n";

/** 从卡库挑一张卡：按名字/系列搜索，可按位置过滤，已在榜单里的卡置灰。 */
export default function CardPicker({
  open, cards, excludes, onPick, onClose,
}: {
  open: boolean;
  cards: IndexCard[];
  excludes: Set<number>;
  onPick: (id: number) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return cards
      .filter((c) => (pos ? (c.position ?? "").includes(pos) : true))
      .filter((c) => (kw ? `${c.name} ${c.version ?? ""} ${c.sec ?? ""} ${c.collection ?? ""}`.toLowerCase().includes(kw) : true))
      .slice(0, 40);
  }, [cards, q, pos]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-court-600 bg-court-800 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-bold text-ink">添加球员卡</h3>
          <span className="text-[11px] text-slate-500">从 2K Card Lab 数据库中选择</span>
          <button onClick={onClose} className="ml-auto rounded-lg border border-court-600 px-2 py-1 text-xs text-slate-400 hover:text-white">关闭</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索球员名 / 系列（如 Jokic / 赛季）"
            className="h-9 min-w-0 flex-1 rounded-lg border border-court-600 bg-court-900 px-3 text-xs text-ink outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1">
            {["", "PG", "SG", "SF", "PF", "C"].map((p) => (
              <button key={p || "all"} onClick={() => setPos(p)}
                className={`rounded-md border px-2 py-1 text-[11px] ${pos === p ? "border-accent text-accent" : "border-court-600 text-slate-400 hover:text-white"}`}>
                {p || "全部"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {list.length === 0 && <p className="py-8 text-center text-xs text-slate-500">没有匹配的球员卡</p>}
          {list.map((c) => {
            const used = excludes.has(c.id);
            return (
              <button key={c.id} disabled={used} onClick={() => onPick(c.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  used ? "border-court-600 bg-court-900/40 opacity-40" : "border-court-600 bg-court-700/40 hover:border-accent/60 hover:bg-court-650/50"
                }`}>
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-10 w-8 shrink-0 rounded object-cover" loading="lazy" />
                ) : <div className="h-10 w-8 shrink-0 rounded bg-court-900" />}
                <span className="font-mono text-sm font-bold text-accent">{c.overall ?? "-"}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink">{c.name}
                  {c.version && <span className="ml-1 text-slate-500">{c.version}</span>}
                </span>
                {c.position && <span className="rounded bg-court-900 px-1.5 py-0.5 text-[10px] text-slate-300">{c.position}</span>}
                {c.sec && <span className="max-w-[7rem] truncate text-[10px] text-slate-500">{c.sec}</span>}
                {c.tier != null && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px]" style={{ color: TIER_COLOR[c.tier] ?? "#94A3B8", background: `${TIER_COLOR[c.tier] ?? "#94A3B8"}1a` }}>
                    {TIER_CN[c.tier] ?? "—"}
                  </span>
                )}
                <span className="shrink-0 text-[10px] text-slate-500">{used ? "已在榜单" : "加入"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
