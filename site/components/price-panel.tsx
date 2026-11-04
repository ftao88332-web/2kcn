"use client";

import { useEffect, useState } from "react";
import { PricesDoc, PriceEntry, fmtMt, relativeBy } from "@/lib/prices";
import { withBase } from "@/lib/base";

let cache: { doc: PricesDoc; at: number } | null = null;

/** 全站共享的实时价格文档（fetch 一次，模块级缓存） */
export function usePrices(): { doc: PricesDoc | null; loading: boolean } {
  const [doc, setDoc] = useState<PricesDoc | null>(cache?.doc ?? null);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) return;
    (async () => {
      try {
        const res = await fetch(withBase("/data/prices.json"));
        if (!res.ok) throw new Error(String(res.status));
        const parsed = (await res.json()) as PricesDoc;
        cache = { doc: parsed, at: Date.now() };
        setDoc(parsed);
      } catch {
        /* 没 prices.json / 网络问题：面板显示缺数据态 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { doc, loading };
}

export default function PricePanel({ cardId }: { cardId: number | string }) {
  const { doc, loading } = usePrices();
  const entry: PriceEntry | undefined = doc?.cards?.[String(cardId)];

  if (loading) return <div className="h-28 animate-pulse rounded-lg bg-court-700/60" />;
  if (!entry || (entry.a == null && entry.s === 0)) {
    return (
      <div className="rounded-lg border border-court-600 bg-court-800/70 p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-300">暂无公开成交</p>
        <p className="mt-1 text-xs">该卡不可交易或近期无成交记录。</p>
      </div>
    );
  }
  const maxTr = Math.max(1, ...entry.tr);
  return (
    <div className="rounded-lg border border-accent/30 bg-court-800/70 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-black text-accent">{fmtMt(entry.a)}</p>
        <p className="text-[11px] text-slate-500">成交均价 · {entry.s ?? 0} 笔 · {relativeBy(entry.u)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-court-700 px-2 py-1 text-slate-300">主机 {fmtMt(entry.co)}</span>
        <span className="rounded bg-court-700 px-2 py-1 text-slate-300">PC {fmtMt(entry.pc)}</span>
      </div>
      {entry.tr.length > 1 && (
        <div className="mt-3">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">价格走势</p>
          <div className="flex h-10 items-end gap-[3px]">
            {entry.tr.map((v, i) => (
              <div
                key={i}
                className="w-full rounded-t bg-gradient-to-t from-accent/40 to-accent"
                style={{ height: `${(v / maxTr) * 100}%` }}
                title={fmtMt(v)}
              />
            ))}
          </div>
        </div>
      )}
      {entry.sales.length > 0 && (
        <table className="mt-3 w-full text-xs">
          <thead className="text-left text-[10px] uppercase text-slate-500">
            <tr>
              <th className="py-1">最近成交</th>
              <th className="py-1 text-right">价格</th>
              <th className="py-1 text-right">时间</th>
            </tr>
          </thead>
          <tbody>
            {entry.sales.slice(0, 5).map((s, i) => (
              <tr key={i} className="border-t border-court-700/60">
                <td className="py-1 text-slate-300">{s.b.toLocaleString("en-US")}</td>
                <td className="py-1 text-right text-slate-400">{relativeBy(s.t)}</td>
                <td className="py-1 text-right text-slate-500">{s.t.slice(11)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-[10px] leading-4 text-slate-500">
        数据来自社区聚合的拍卖行成交记录 · 全站快照 {relativeBy(doc?.ts ?? "")}
      </p>
    </div>
  );
}
