"use client";

import { useEffect, useState } from "react";
import { ActiveCard, PricesDoc, fmtMt, relativeBy } from "@/lib/prices";
import { withBase } from "@/lib/base";
import Link from "next/link";
import { rarity } from "@/lib/i18n";

/** 实时成交榜（prices.json 的 active 板块） */
export default function MarketBoard({ limit = 10 }: { limit?: number }) {
  const [doc, setDoc] = useState<PricesDoc | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(withBase("/data/prices.json"));
        if (res.ok) setDoc((await res.json()) as PricesDoc);
      } catch { /* 静默 */ }
    })();
  }, []);

  if (!doc) {
    return <div className="h-40 animate-pulse rounded-xl bg-court-800" />;
  }
  const rs = doc.active.filter((a): a is ActiveCard & { id: number } => !!a.id).slice(0, limit);
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">全站快照：{relativeBy(doc.ts)}</p>
      <div className="overflow-hidden rounded-xl border border-court-700">
        <table className="w-full text-sm">
          <thead className="bg-court-800 text-left text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">卡</th>
              <th className="px-3 py-2">系列</th>
              <th className="px-2 py-2 text-right">成交均价</th>
              <th className="hidden px-2 py-2 text-right sm:table-cell">成交笔数</th>
              <th className="hidden px-3 py-2 text-right md:table-cell">最近成交</th>
            </tr>
          </thead>
          <tbody>
            {rs.map((a) => {
              const rar = rarity(a.ovr);
              return (
                <tr key={a.id} className="border-t border-court-700/60 bg-court-900/40 hover:bg-court-800/60">
                  <td className="px-3 py-2">
                    <Link href={`/player/${a.id}/`} className="group">
                      <span className={`font-black ${rar.text}`}>{a.ovr ?? "-"}</span>
                      <span className="ml-2 text-slate-100 group-hover:text-accent">{a.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{a.theme ?? a.camp ?? ""}</td>
                  <td className="px-2 py-2 text-right font-mono text-gain">{fmtMt(a.price)}</td>
                  <td className="hidden px-2 py-2 text-right text-slate-400 sm:table-cell">{a.sales?.toLocaleString("en-US") ?? "-"}</td>
                  <td className="hidden px-3 py-2 text-right text-slate-500 md:table-cell">{relativeBy(a.last)}</td>
                </tr>
              );
            })}
            {!rs.length && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  暂无数据 —— 跑一轮 <code className="text-slate-300">python -m scraper.main market</code>。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
