"use client";

import { useMemo, useState } from "react";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/types";
import CardTile from "@/components/card-tile";

const VERSIONS = ["2k27", "2k26", "2k25", "2k24"];

export default function PlayersPage() {
  const [q, setQ] = useState("");
  const [ver, setVer] = useState<string>("全部");
  const [minOvr, setMinOvr] = useState(80);

  const list = useMemo(() => {
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
      .slice(0, 120);
  }, [q, ver, minOvr]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">卡库</h1>
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
          {["全部", ...VERSIONS].map((v) => (
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
        <span className="text-xs text-slate-500">展示前 120 条（索引 {cards.length} 张）</span>
      </div>
      {list.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">没有匹配的卡片。</p>
      )}
    </div>
  );
}
