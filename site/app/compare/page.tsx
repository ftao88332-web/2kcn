"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrices } from "@/lib/use-prices";
import { priceOfId, withBase, PLATFORMS } from "@/lib/core";
import { CARDS, QueryCard, quickSearch, stat, positionsOf } from "@/lib/services/cards";
import { TIER_CN } from "@/lib/i18n";
import { weightText, mtText } from "@/lib/units";

const MAX = 4;

type Row = { key: string; label: string };
type Group = { cn: string; en: string; rows: Row[] };

const GROUPS: Group[] = [
  {
    cn: "投篮", en: "SHOOTING",
    rows: [
      { key: "shot_3pt", label: "三分" },
      { key: "shot_mid", label: "中距离" },
      { key: "shot_close", label: "近距离" },
      { key: "free_throw", label: "罚球" },
      { key: "shot_iq", label: "投篮智商" },
    ],
  },
  {
    cn: "终结", en: "FINISHING",
    rows: [
      { key: "driving_layup", label: "突破上篮" },
      { key: "driving_dunk", label: "突破扣篮" },
      { key: "standing_dunk", label: "原地扣篮" },
      { key: "post_control", label: "背身控制" },
    ],
  },
  {
    cn: "传控", en: "PLAYMAKING",
    rows: [
      { key: "ball_handle", label: "控球" },
      { key: "speed_with_ball", label: "持球速度" },
      { key: "passing_accuracy", label: "传球准度" },
      { key: "passing_vision", label: "传球视野" },
    ],
  },
  {
    cn: "身体", en: "ATHLETICISM",
    rows: [
      { key: "speed", label: "速度" },
      { key: "acceleration", label: "加速" },
      { key: "strength", label: "力量" },
      { key: "vertical", label: "弹跳" },
      { key: "stamina", label: "体力" },
    ],
  },
  {
    cn: "防守", en: "DEFENSE",
    rows: [
      { key: "perimeter_defense", label: "外线防守" },
      { key: "interior_defense", label: "内线防守" },
      { key: "steal", label: "抢断" },
      { key: "block", label: "盖帽" },
      { key: "help_defense_iq", label: "协防智商" },
    ],
  },
  {
    cn: "篮板", en: "REBOUNDING",
    rows: [
      { key: "offensive_rebound", label: "进攻篮板" },
      { key: "defensive_rebound", label: "防守篮板" },
    ],
  },
];

type Cell = { c: QueryCard; v: string; num?: number | null };

export default function ComparePage() {
  const { doc } = usePrices();
  const [ids, setIds] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [basis, setBasis] = useState<"co" | "pc">("co");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("ids");
    if (p) setIds(p.split(",").map(Number).filter((n) => CARDS.some((c) => c.id === n)).slice(0, MAX));
  }, []);

  useEffect(() => {
    const url = ids.length ? `?ids=${ids.join(",")}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [ids]);

  const picked = useMemo(
    () => ids.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean) as QueryCard[],
    [ids]
  );
  const results = useMemo(
    () => (q.trim() ? quickSearch(q, 8).filter((c) => !ids.includes(c.id)) : []),
    [q, ids]
  );

  const add = (c: QueryCard) => {
    if (ids.length >= MAX || ids.includes(c.id)) return;
    setIds([...ids, c.id]);
    setQ("");
    setOpen(false);
  };
  const remove = (id: number) => setIds(ids.filter((x) => x !== id));

  const statRow = (key: string): Cell[] =>
    picked.map((c) => {
      const v = stat(c, key);
      return { c, v: v == null ? "—" : String(v), num: v };
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-bold text-white">球员卡比较</h1>
        <span className="text-xs text-slate-500">最多 {MAX} 张 · 数值最优项高亮 · 无数据显示 —</span>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-court-600 text-xs">
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => setBasis(p.key)}
              className={`px-2.5 py-1.5 ${basis === p.key ? "bg-accent/20 text-accent" : "text-slate-400"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-court-600 bg-court-800 p-4">
        <div className="relative">
          <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="输入球员名 / 球队 / 系列，添加要比较的卡"
            className="w-full rounded-lg border border-court-600 bg-court-900 px-3 py-2 text-sm text-ink outline-none placeholder:text-slate-500 focus:border-accent/60" />
          {open && results.length > 0 && (
            <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-court-600 bg-court-900 shadow-xl">
              {results.map((c) => (
                <button key={c.id} onClick={() => add(c)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-court-700">
                  <span className="w-7 font-black text-accent">{c.overall}</span>
                  <span className="text-ink">{c.name}</span>
                  <span className="text-slate-500">{positionsOf(c).join("/")}</span>
                  <span className="ml-auto text-slate-500">{c.tier != null ? TIER_CN[c.tier] ?? c.tier : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {picked.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {picked.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 rounded-lg border border-court-600 bg-court-900/60 px-2 py-1 text-xs text-ink">
                <b className="text-accent">{c.overall}</b>{c.name}
                <button onClick={() => remove(c.id)} className="text-slate-500 hover:text-red-400">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {picked.length === 0 ? (
        <p className="rounded-xl border border-court-600 bg-court-800 p-8 text-center text-sm text-slate-500">
          先搜索并添加 2～4 张球员卡，即可横向对比属性、徽章与行情。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-court-600 bg-court-800">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="sticky top-0 z-10 bg-court-900">
              <tr>
                <th className="w-28 px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">指标</th>
                {picked.map((c) => (
                  <th key={c.id} className="px-3 py-2.5 text-left">
                    <Link href={`/player/${c.id}/`} className="group flex items-center gap-2">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={withBase(c.image)} alt={c.name} className="h-11 w-9 rounded object-cover" />
                      ) : null}
                      <span>
                        <span className="block text-xs font-bold text-ink group-hover:text-accent">{c.name}</span>
                        <span className="block text-[10px] text-slate-500">{c.overall} OVR · {positionsOf(c).join("/")}</span>
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <GroupHead cn="基础" en="BASE" cols={picked.length} />
              <StatTr label="总评" cells={picked.map((c) => ({ c, v: String(c.overall ?? "—"), num: c.overall }))} />
              <StatTr label="进攻 / 防守"
                cells={picked.map((c) => ({ c, v: `${c.off_overall ?? "-"} / ${c.def_overall ?? "-"}` }))} />
              <StatTr label="卡种"
                cells={picked.map((c) => ({ c, v: c.tier != null ? TIER_CN[c.tier] ?? String(c.tier) : "—" }))} />
              <StatTr label="身高"
                cells={picked.map((c) => ({ c, v: c.height_cm ? `${(c.height_cm / 100).toFixed(2)} m` : "—" }))} />
              <StatTr label="体重"
                cells={picked.map((c) => ({ c, v: weightText(c.weight_kg, c.weight_lb) }))} />
              <StatTr label="臂展"
                cells={picked.map((c) => ({ c, v: c.wingspan_cm ? `${(c.wingspan_cm / 100).toFixed(2)} m` : "—" }))} />
              <StatTr label="徽章"
                cells={picked.map((c) => ({ c, v: `${c.badge_count ?? 0} 个（名人堂 ${c.hof_count ?? 0}）` }))} />

              {GROUPS.map((g) => (
                <Fragment key={g.en}>
                  <GroupHead cn={g.cn} en={g.en} cols={picked.length} />
                  {g.rows.map((r) => (
                    <StatTr key={r.key} label={r.label} cells={statRow(r.key)} />
                  ))}
                </Fragment>
              ))}

              <GroupHead cn="行情" en="MARKET" cols={picked.length} />
              <StatTr label={basis === "co" ? "主机价" : "PC 价"}
                cells={picked.map((c) => {
                  const p = priceOfId(doc, c.id, basis);
                  return { c, v: p == null ? "暂无报价" : mtText(p) };
                })} />
              <StatTr label="双人组 / 进化"
                cells={picked.map((c) => ({
                  c,
                  v: [c.has_duo ? "有双人组" : "", c.has_evo ? "可进化" : ""].filter(Boolean).join(" · ") || "—",
                }))} />

              <tr>
                <td className="px-3 py-2.5" />
                {picked.map((c) => (
                  <td key={c.id} className="px-3 py-2.5">
                    <button onClick={() => remove(c.id)} className="text-[11px] text-slate-500 hover:text-red-400">移除</button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupHead({ cn, en, cols }: { cn: string; en: string; cols: number }) {
  return (
    <tr className="border-t border-court-600 bg-court-900/60">
      <td className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
        {cn} <span className="opacity-60">{en}</span>
      </td>
      <td colSpan={cols} />
    </tr>
  );
}

function StatTr({ label, cells }: { label: string; cells: Cell[] }) {
  const nums = cells.map((c) => c.num).filter((v): v is number => typeof v === "number");
  const best = nums.length > 1 ? Math.max(...nums) : null;
  return (
    <tr className="border-t border-court-700/60">
      <td className="px-3 py-2 text-[11px] text-slate-400">{label}</td>
      {cells.map((x) => {
        const hot = best != null && x.num != null && x.num === best;
        return (
          <td key={x.c.id} className={`px-3 py-2 text-xs ${hot ? "font-bold text-accent" : "text-ink/90"}`}>
            {x.v}
          </td>
        );
      })}
    </tr>
  );
}
