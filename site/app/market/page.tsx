import Link from "next/link";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/types";
import { ovrColor } from "@/lib/format";

/** 行情总览：静态索引卡片按 MT 排序成交投榜雏形（涨跌幅要等快照数据攒足后接入 Supabase 聚合查询） */
export default function MarketPage() {
  const tracked = (cards as IndexCard[])
    .filter((c) => c.mt != null)
    .sort((a, b) => (b.mt ?? 0) - (a.mt ?? 0))
    .slice(0, 30);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">市场总览</h1>
      <p className="text-sm text-slate-500">
        MVP 版按已知 MT 标价排序。涨幅/跌幅榜与"低于快售价名单"在快照数据攒几天后接入。
      </p>
      <div className="overflow-hidden rounded-xl border border-court-700">
        <table className="w-full text-sm">
          <thead className="bg-court-800 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">卡</th>
              <th className="px-3 py-2">版本</th>
              <th className="px-3 py-2">总评</th>
              <th className="px-3 py-2 text-right">MT 标价</th>
            </tr>
          </thead>
          <tbody>
            {tracked.map((c) => (
              <tr key={c.id} className="border-t border-court-700/60 bg-court-900/40">
                <td className="px-3 py-2">
                  <Link href={`/player/${c.id}/`} className="hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-400">{c.version}</td>
                <td className={`px-3 py-2 font-bold ${ovrColor(c.overall)}`}>{c.overall}</td>
                <td className="px-3 py-2 text-right font-mono">{(c.mt ?? 0).toLocaleString()}</td>
              </tr>
            ))}
            {!tracked.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  暂无可交易卡数据 —— 把你要盯的卡加进 scraper/tracked_ids.json，快照跑起来即可。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
