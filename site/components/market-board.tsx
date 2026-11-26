"use client";

import { ActiveCard, fmtMt, relativeBy } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";
import Link from "next/link";
import { rarity } from "@/lib/i18n";
import cardIds from "@/data/card_ids.json";

/** 有详情页的卡；行情榜偶尔会带进库里还没有的卡，别做成死链 */
const HAS_PAGE = new Set(cardIds as number[]);

/** 实时成交榜：list="co" 主机榜，"pc" PC 榜（prices.json 的 active / activePc） */
export default function MarketBoard({ list = "co", limit = 10 }: { list?: "co" | "pc"; limit?: number }) {
  const { doc } = usePrices();
  const pc = list === "pc";
  const title = pc ? "PC 端" : "主机端";
  const hint = pc ? "Steam" : "PS / XBOX / SWITCH";

  if (!doc) {
    return <div className="h-40 animate-pulse rounded-xl bg-court-800" />;
  }
  const src = pc ? doc.activePc ?? [] : doc.active ?? [];
  const rs = src.filter((a): a is ActiveCard & { id: number } => !!a.id).slice(0, limit);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        <span className="text-[11px] text-muted">{hint}</span>
        <span className="ml-auto text-[11px] text-slate-500">全站快照：{relativeBy(doc.ts)}</span>
      </div>
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
                    {HAS_PAGE.has(a.id) ? (
                      <Link href={`/player/${a.id}/`} className="group">
                        <span className={`font-black ${rar.text}`}>{a.ovr ?? "-"}</span>
                        <span className="ml-2 text-slate-100 group-hover:text-accent">{a.name}</span>
                      </Link>
                    ) : (
                      <span>
                        <span className={`font-black ${rar.text}`}>{a.ovr ?? "-"}</span>
                        <span className="ml-2 text-slate-100">{a.name}</span>
                        <span className="ml-1.5 text-[10px] text-slate-500">（暂无详情页）</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{a.theme ?? a.camp ?? ""}</td>
                  <td className={`px-2 py-2 text-right font-mono ${pc ? "text-accent" : "text-gain"}`}>{fmtMt(a.price)}</td>
                  <td className="hidden px-2 py-2 text-right text-slate-400 sm:table-cell">{a.sales?.toLocaleString("en-US") ?? "-"}</td>
                  <td className="hidden px-3 py-2 text-right text-slate-500 md:table-cell">{relativeBy(a.last)}</td>
                </tr>
              );
            })}
            {!rs.length && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
