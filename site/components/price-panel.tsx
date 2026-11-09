"use client";

import { PriceEntry, fmtMt, relativeBy } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

export default function PricePanel({ cardId }: { cardId: number | string }) {
  const { doc, loading } = usePrices();
  const entry: PriceEntry | undefined = doc?.cards?.[String(cardId)];

  if (loading) return <div className="h-28 animate-pulse rounded-lg bg-court-700/60" />;
  if (!entry || (entry.a == null && entry.s === 0)) {
    return (
      <div>
        <p className="text-lg font-bold text-ink">暂无公开成交</p>
        <p className="mt-1 text-xs text-muted">该卡不可交易或近期无成交记录。</p>
      </div>
    );
  }
  const maxTr = Math.max(1, ...entry.tr);
  return (
    <div>
      {/* 顶部醒目价格 */}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <p className="text-4xl font-black tracking-tight text-gain">{fmtMt(entry.a)}</p>
        <div className="flex gap-2 text-xs">
          <span className="rounded-md bg-court-700 px-2 py-1 text-ink/90">主机 <b className="text-gain">{fmtMt(entry.co)}</b></span>
          <span className="rounded-md bg-court-700 px-2 py-1 text-ink/90">PC <b className="text-gain">{fmtMt(entry.pc)}</b></span>
        </div>
        <p className="ml-auto text-[11px] text-muted">{entry.s ?? 0} 笔成交 · 更新于 {relativeBy(entry.u)}</p>
      </div>

      {/* 走势 */}
      {entry.tr.length > 1 && (
        <div className="mt-5">
          <p className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">价格走势（主机端）</p>
          <div className="flex h-12 items-end gap-1">
            {entry.tr.map((v, i) => (
              <div
                key={i}
                className="min-w-[6px] flex-1 rounded-t bg-gain/70 transition-colors hover:bg-gain"
                style={{ height: `${(v / maxTr) * 100}%` }}
                title={fmtMt(v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 成交记录表：斑马行 + hover，细分割线 */}
      {entry.sales.length > 0 && (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-court-600 text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">成交价</th>
              <th className="py-2 text-right font-medium">一口价</th>
              <th className="py-2 text-right font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {entry.sales.slice(0, 6).map((s, i) => (
              <tr key={i} className="border-b border-court-600/50 transition-colors even:bg-court-700/30 hover:bg-court-700/60">
                <td className="py-2 font-medium text-gain">{s.b.toLocaleString("en-US")}</td>
                <td className="py-2 text-right text-muted">{s.o ? s.o.toLocaleString("en-US") : "-"}</td>
                <td className="py-2 text-right text-muted">{relativeBy(s.t)}<span className="ml-1.5 text-[10px] opacity-70">{s.t.slice(11)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[10px] leading-4 text-muted">
        数据来自社区聚合的拍卖行成交记录 · 全站快照 {relativeBy(doc?.ts ?? "")} · 非挂单价
      </p>
    </div>
  );
}
