"use client";

import { useState } from "react";
import { PriceEntry, PLATFORMS, fmtMt, fmtNum, relativeBy } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

const platName = (p?: string) => (p === "pc" ? "PC" : "主机");

/** 趋势窗口：1D 近 8 点 / 1W 近 16 点 / 1M 全部 */
const WINDOWS = [
  { key: "1d", label: "1D", n: 8 },
  { key: "1w", label: "1W", n: 16 },
  { key: "1m", label: "1M", n: 30 },
] as const;

type WinKey = (typeof WINDOWS)[number]["key"];

/** 涨跌：首点 → 末点 百分比 */
function change(pts: number[]): { pct: number; up: boolean } | null {
  const arr = pts.filter((v) => v != null);
  if (arr.length < 2) return null;
  const first = arr[0], last = arr[arr.length - 1];
  if (first <= 0) return null;
  const pct = ((last - first) / first) * 100;
  return { pct, up: pct >= 0 };
}

/** 迷你走势：按自身 min~max 归一，避免小波动看起来是直线 */
function Trend({ pts }: { pts: number[] }) {
  if (pts.length < 2) return null;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  return (
    <div className="mt-2 flex h-8 items-end gap-0.5">
      {pts.map((v, i) => (
        <div key={i} className="min-w-[4px] flex-1 rounded-t bg-gain/60 hover:bg-gain"
          style={{ height: `${15 + ((v - lo) / span) * 85}%` }} title={fmtMt(v)} />
      ))}
    </div>
  );
}

export default function PricePanel({ cardId }: { cardId: number | string }) {
  const { doc, loading } = usePrices();
  const entry: PriceEntry | undefined = doc?.cards?.[String(cardId)];
  const [win, setWin] = useState<WinKey>("1w");

  if (loading) return <div className="h-28 animate-pulse rounded-lg bg-court-700/60" />;
  if (!entry || (entry.co == null && entry.pc == null && entry.a == null)) {
    return (
      <div>
        <p className="text-lg font-bold text-ink">暂无公开成交</p>
        <p className="mt-1 text-xs text-muted">该卡不可交易或近期无成交记录。</p>
      </div>
    );
  }

  const trends = { co: entry.tr ?? [], pc: entry.tp ?? [] };
  const counts = { co: entry.cos, pc: entry.pcs };
  const winN = WINDOWS.find((w) => w.key === win)!.n;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs">
        <span className="text-muted">趋势</span>
        {WINDOWS.map((w) => (
          <button key={w.key} onClick={() => setWin(w.key)}
            className={`rounded-md border px-2 py-0.5 ${win === w.key ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}>
            {w.label}
          </button>
        ))}
      </div>

      {/* 两个价格池并列：主机 / PC */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {PLATFORMS.map((p) => {
          const price = p.key === "co" ? entry.co : entry.pc;
          const n = counts[p.key];
          const pts = (trends[p.key] ?? []).slice(-winN);
          const chg = change(pts);
          return (
            <div key={p.key} className="rounded-lg border border-court-600 bg-court-900/50 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold text-ink">
                  {p.label}
                  <span className="ml-1.5 text-[10px] font-normal text-muted">{p.hint}</span>
                </p>
                <p className="text-[10px] text-muted">{n == null ? "笔数未知" : `${fmtNum(n)} 笔`}</p>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-black tracking-tight text-gain">{fmtMt(price)}</p>
                {chg && (
                  <span className={`text-xs font-bold ${chg.up ? "text-gain" : "text-rose-400"}`}>
                    {chg.up ? "▲" : "▼"} {Math.abs(chg.pct).toFixed(1)}%
                  </span>
                )}
              </div>
              <Trend pts={pts} />
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>两池综合 <b className="text-ink/90">{fmtMt(entry.a)}</b></span>
        <span>·</span>
        <span>{fmtNum(entry.s)} 笔成交</span>
        <span>·</span>
        <span>更新于 {relativeBy(entry.u)}</span>
      </div>

      {/* 成交记录表 */}
      {entry.sales.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-court-600 text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">成交价</th>
              <th className="py-2 text-right font-medium">一口价</th>
              <th className="py-2 text-right font-medium">端</th>
              <th className="py-2 text-right font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {entry.sales.slice(0, 6).map((s, i) => (
              <tr key={i} className="border-b border-court-600/50 transition-colors even:bg-court-700/30 hover:bg-court-700/60">
                <td className="py-2 font-medium text-gain">{s.b.toLocaleString("en-US")}</td>
                <td className="py-2 text-right text-muted">{s.o ? s.o.toLocaleString("en-US") : "-"}</td>
                <td className="py-2 text-right text-[11px] text-muted">{platName(s.p)}</td>
                <td className="py-2 text-right text-muted">{relativeBy(s.t)}<span className="ml-1.5 text-[10px] opacity-70">{s.t.slice(11)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
