"use client";

import { useMemo, useState } from "react";
import cards from "@/data/cards_index.json";
import { IndexCard, priceOfId, fmtMt, fmtNum } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";
import { rarity } from "@/lib/i18n";
import Link from "next/link";
import MarketBoard from "@/components/market-board";

const ALL = cards as unknown as IndexCard[];

type Tab = "active" | "price" | "volume" | "rise" | "fall";
const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "活跃成交" },
  { key: "price", label: "价格最高" },
  { key: "volume", label: "成交量" },
  { key: "rise", label: "涨幅榜" },
  { key: "fall", label: "跌幅榜" },
];

/** 由走势首尾点算涨跌百分比，不足 2 点返回 null */
function pct(entry: { tr?: number[]; tp?: number[] } | undefined, pc: boolean): number | null {
  const pts = (pc ? entry?.tp : entry?.tr) ?? [];
  const a = pts.filter((v) => v != null);
  if (a.length < 2 || a[0] <= 0) return null;
  return ((a[a.length - 1] - a[0]) / a[0]) * 100;
}

export default function MarketPage() {
  const { doc } = usePrices();
  const [tab, setTab] = useState<Tab>("active");
  const [pc, setPc] = useState(false);

  const ranked = useMemo(() => {
    if (!doc) return [];
    const rows = ALL.map((c) => {
      const e = doc.cards?.[String(c.id)];
      const price = priceOfId(doc, c.id, pc ? "pc" : "co");
      const sales = pc ? e?.pcs : e?.cos;
      const chg = pct(e, pc);
      return { c, price, sales: sales ?? e?.s ?? null, chg };
    });
    const withPrice = rows.filter((r) => r.price != null);
    const by: Record<Tab, typeof rows> = {
      active: withPrice,
      price: withPrice.slice().sort((a, b) => (b.price ?? 0) - (a.price ?? 0)),
      volume: rows.slice().sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0)),
      rise: withPrice.filter((r) => r.chg != null).sort((a, b) => (b.chg ?? 0) - (a.chg ?? 0)),
      fall: withPrice.filter((r) => r.chg != null).sort((a, b) => (a.chg ?? 0) - (b.chg ?? 0)),
    };
    return by[tab].slice(0, 25);
  }, [doc, tab, pc]);

  // 市场概况：按当前价格池统计，缺价不参与均价
  const summary = useMemo(() => {
    if (!doc) return null;
    const key = pc ? "pc" : "co";
    let cards = 0, deals = 0, latest = 0, sum = 0;
    for (const c of ALL) {
      const e = doc.cards?.[String(c.id)];
      if (!e) continue;
      const p = (e[key] ?? null) as number | null;
      if (p != null) { cards++; sum += p; }
      deals += (pc ? e.pcs : e.cos) ?? e.s ?? 0;
      const t = Date.parse(e.u);
      if (Number.isFinite(t) && t > latest) latest = t;
    }
    return { cards, deals, avg: cards ? sum / cards : null, latest };
  }, [doc, pc]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white">市场总览</h1>
      </div>

      {/* 第一层：市场概况 */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "活跃卡片", value: fmtNum(summary.cards) },
            { label: "成交总量", value: fmtNum(summary.deals) },
            { label: "均价", value: summary.avg != null ? fmtMt(Math.round(summary.avg)) : "-" },
            { label: "最近更新", value: summary.latest ? new Date(summary.latest).toLocaleString("zh-CN", { hour12: false }) : "暂无" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-court-600 bg-court-800 px-3 py-2.5">
              <div className="text-[11px] text-muted">{s.label}</div>
              <div className="mt-0.5 truncate font-mono text-sm text-ink">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-court-600 text-xs">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-2.5 py-1.5 ${tab === t.key ? "bg-accent/20 text-accent" : "text-slate-400 hover:text-ink"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-court-600 text-xs">
          {[["co", "主机"], ["pc", "PC"]].map(([v, l]) => (
            <button key={v} onClick={() => setPc(v === "pc")}
              className={`px-2.5 py-1.5 ${(pc ? "pc" : "co") === v ? "bg-accent/20 text-accent" : "text-slate-400"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === "active" ? (
        <>
          <MarketBoard list="co" limit={15} />
          <MarketBoard list="pc" limit={15} />
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-court-600">
          <table className="w-full text-sm">
            <thead className="bg-court-800 text-left text-[10px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">球员</th>
                <th className="px-2 py-2">系列</th>
                <th className="px-2 py-2 text-right">成交均价</th>
                <th className="px-2 py-2 text-right">成交笔数</th>
                {(tab === "rise" || tab === "fall") && <th className="px-2 py-2 text-right">涨跌</th>}
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ c, price, sales, chg }) => {
                const rar = rarity(c.overall);
                return (
                  <tr key={c.id} className="border-t border-court-700/60 bg-court-900/40 hover:bg-court-800/60">
                    <td className="px-3 py-2">
                      <Link href={`/player/${c.id}/`} className="group">
                        <span className={`font-black ${rar.text}`}>{c.overall ?? "-"}</span>
                        <span className="ml-2 text-slate-100 group-hover:text-accent">{c.name}</span>
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-400">{c.theme ?? c.collection ?? "-"}</td>
                    <td className="px-2 py-2 text-right font-mono text-xs text-gain">{price != null ? fmtMt(price) : "-"}</td>
                    <td className="px-2 py-2 text-right text-xs text-slate-400">{sales != null ? fmtNum(sales) : "-"}</td>
                    {(tab === "rise" || tab === "fall") && (
                      <td className={`px-2 py-2 text-right text-xs font-bold ${chg == null ? "text-muted" : chg >= 0 ? "text-gain" : "text-rose-400"}`}>
                        {chg == null ? "-" : `${chg >= 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(1)}%`}
                      </td>
                    )}
                  </tr>
                );
              })}
              {!ranked.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">暂无该榜数据。</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

