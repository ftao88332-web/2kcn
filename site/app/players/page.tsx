"use client";

import { useEffect, useMemo, useState } from "react";
import cards from "@/data/cards_index.json";
import { IndexCard } from "@/lib/types";
import CardTile from "@/components/card-tile";

const PAGE = 120;

export default function PlayersPage() {
  const [q, setQ] = useState("");
  const [ver, setVer] = useState<string>("2k27");
  const [minOvr, setMinOvr] = useState(60);
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (cards as unknown as IndexCard[])
      .filter((c) => (ver === "全部" ? true : c.version === ver))
      .filter((c) => (c.overall ?? 0) >= minOvr)
      .filter((c) =>
        kw
          ? (c.name ?? "").toLowerCase().includes(kw) ||
            (c.team ?? "").toLowerCase().includes(kw) ||
            (c.theme ?? "").toLowerCase().includes(kw)
          : true
      )
      .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  }, [q, ver, minOvr]);

  // 筛选条件变化时回到第一批
  useEffect(() => setShown(PAGE), [q, ver, minOvr]);

  const total = cards.length;
  const list = filtered.slice(0, shown);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-bold text-white">卡库</h1>
        <span className="text-xs text-slate-500">
          索引 {total} 张 · 当前筛选 {filtered.length} 张
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索球员 / 球队 / 系列"
          className="w-64 rounded-lg border border-court-600 bg-court-800 px-3 py-2 outline-none focus:border-accent"
        />
        <select
          value={ver}
          onChange={(e) => setVer(e.target.value)}
          className="rounded-lg border border-court-600 bg-court-800 px-2 py-2"
        >
          {["2k27", "全部"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <label className="text-slate-400">
          总评 ≥ {minOvr}
          <input
            type="range"
            min={60}
            max={99}
            value={minOvr}
            onChange={(e) => setMinOvr(Number(e.target.value))}
            className="ml-2 accent-accent"
          />
        </label>
      </div>

      {list.length ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((c) => (
              <CardTile key={c.id} card={c} />
            ))}
          </div>
          {shown < filtered.length && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShown((n) => n + PAGE)}
                className="rounded-lg border border-court-600 px-5 py-2 text-sm text-accent transition-colors hover:border-accent/60 hover:bg-accent/10"
              >
                加载更多（剩余 {filtered.length - shown} 张）
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">没有匹配的卡片。</p>
      )}
    </div>
  );
}
