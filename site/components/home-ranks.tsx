"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import cards from "@/data/cards_index.json";
import { IndexCard, priceOfId, fmtMt } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";
import { useFavorites } from "@/lib/use-favorites";
import { rarity } from "@/lib/i18n";

const CARDS = cards as unknown as IndexCard[];

/** 行情涨跌 / 热门收藏榜（首页用，纯客户端计算，缺走势或无价一律不显示） */
export default function HomeRanks() {
  const { doc } = usePrices();
  const { favs } = useFavorites();
  const [pc, setPc] = useState(false);

  const rows = useMemo(() => {
    const out = CARDS.map((c) => {
      const e = doc?.cards?.[String(c.id)];
      const pts = ((pc ? e?.tp : e?.tr) ?? []).filter((v) => v != null) as number[];
      const chg = pts.length >= 2 && pts[0] > 0 ? ((pts[pts.length - 1] - pts[0]) / pts[0]) * 100 : null;
      return { c, price: priceOfId(doc, c.id, pc ? "pc" : "co"), chg };
    });
    const priced = out.filter((r) => r.price != null);
    return {
      rise: priced.filter((r) => r.chg != null && r.chg > 0).sort((a, b) => (b.chg ?? 0) - (a.chg ?? 0)).slice(0, 10),
      fall: priced.filter((r) => r.chg != null && r.chg < 0).sort((a, b) => (a.chg ?? 0) - (b.chg ?? 0)).slice(0, 10),
    };
  }, [doc, pc]);

  const favRows = useMemo(() => {
    const byId = new Map(CARDS.map((c) => [c.id, c]));
    return favs.map((id) => byId.get(id)).filter(Boolean).slice(0, 10) as IndexCard[];
  }, [favs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-court-600 text-xs">
          {[["co", "主机"], ["pc", "PC"]].map(([v, l]) => (
            <button key={v} onClick={() => setPc(v === "pc")}
              className={`px-2.5 py-1.5 ${(pc ? "pc" : "co") === v ? "bg-accent/20 text-accent" : "text-slate-400"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {([["rise", "涨幅榜", "text-gain"], ["fall", "跌幅榜", "text-rose-400"]] as const).map(([kind, title, color]) => (
          <section key={kind}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-white">{title}</h2>
              <Link href={`/market/?tab=${kind}`} className="text-xs text-accent hover:underline">全部 →</Link>
            </div>
            <div className="divide-y divide-court-600 overflow-hidden rounded-xl border border-court-600 bg-court-800">
              {rows[kind].length ? rows[kind].map(({ c, price, chg }) => (
                <Link key={c.id} href={`/card/${c.id}/`} className="flex items-center gap-2 px-3 py-2 hover:bg-court-650/60">
                  <span className={`w-7 shrink-0 text-right text-xs font-black ${rarity(c.overall).text}`}>{c.overall ?? "-"}</span>
                  <span className="min-w-0 truncate text-xs text-slate-200">{c.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-400">{price != null ? fmtMt(price) : "-"}</span>
                  <span className={`w-14 shrink-0 text-right text-[11px] font-bold ${color}`}>
                    {chg == null ? "-" : `${chg >= 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(1)}%`}
                  </span>
                </Link>
              )) : <p className="px-3 py-4 text-xs text-slate-500">暂无该方向的有效走势。</p>}
            </div>
          </section>
        ))}
      </div>

      {favRows.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-base font-bold text-white">我的收藏</h2>
            <Link href="/cards/?fav=1" className="text-xs text-accent hover:underline">去卡库 →</Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {favRows.map((c) => (
              <Link key={c.id} href={`/card/${c.id}/`}
                className="rounded-lg border border-court-600 bg-court-800 px-2 py-1 text-xs text-slate-300 hover:border-accent/50">
                <b className={`mr-1 ${rarity(c.overall).text}`}>{c.overall}</b>{c.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
