"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BADGES, CATEGORIES, LEVELS, LEXICON_META, categoryOf } from "@/lib/badge-lexicon";
import { holderCount, holdersOf, tierCounts } from "@/lib/services/badges";
import { getIndexCard } from "@/lib/services/cards";
import { rarity } from "@/lib/i18n";

const CAT_ALL = "all";

export default function BadgesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(CAT_ALL);
  const [level, setLevel] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return BADGES.filter((b) => {
      if (cat !== CAT_ALL && b.category !== cat) return false;
      if (level != null && (tierCounts(b.badge_id)[String(level)] ?? 0) === 0) return false;
      if (!k) return true;
      return [b.name_zh_cn, b.name_en, b.badge_id, ...b.aliases].some((v) => v.toLowerCase().includes(k));
    }).sort((a, b) => holderCount(b.badge_id) - holderCount(a.badge_id));
  }, [q, cat, level]);

  const shownCount = useMemo(() => BADGES.filter((b) => holderCount(b.badge_id) > 0).length, []);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-white">徽章数据库</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          共 <b className="text-ink">{BADGES.length}</b> 条徽章：<b className="text-ink">{LEXICON_META.official_adopted_count}</b> 条采用
          <a href={LEXICON_META.lexicon_url} target="_blank" rel="noreferrer" className="mx-1 text-accent hover:underline">2kAuction 2K27 简体中文词库</a>
          ，<b className="text-ink">{LEXICON_META.legacy_count}</b> 条性格类徽章不在该词库内、沿用站内既有译名。
          徽章名称与等级全部来自同一份词库，详情页 / 卡库筛选 / 比较器共用，不另存第二套译名。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="搜索中文名 / 英文名 / 旧译别名（如 空中魔术师）"
          className="w-80 rounded-lg border border-court-600 bg-court-800 px-3 py-2 text-sm outline-none focus:border-accent" />
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setCat(CAT_ALL)}
            className={`rounded-md border px-2 py-1 text-xs ${cat === CAT_ALL ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}>
            全部 {BADGES.length}
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`rounded-md border px-2 py-1 text-xs ${cat === c.id ? "border-accent bg-accent/15 text-accent" : "border-court-600 text-slate-400"}`}>
              {c.name_zh} {c.count}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-slate-500">按等级筛选拥有卡</span>
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevel(level === l.tier ? null : l.tier)}
              className="rounded-md border px-2 py-1 text-[11px]"
              style={{
                borderColor: level === l.tier ? l.color : "rgba(41,57,77,1)",
                background: level === l.tier ? `${l.color}22` : "transparent",
                color: l.color,
              }}>
              {l.name_zh}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        筛选出 {list.length} 条 · 库中被卡片拥有的 {shownCount} 条
        {level != null && ` · 仅显示有「${LEVELS.find((l) => l.tier === level)?.name_zh}」等级持有者的徽章`}
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => {
          const cat = categoryOf(b.badge_id);
          const n = holderCount(b.badge_id);
          const tc = tierCounts(b.badge_id);
          const open = openId === b.badge_id;
          const ids = open ? holdersOf(b.badge_id).slice(0, 12) : [];
          return (
            <div key={b.badge_id} className="rounded-xl border border-court-600 bg-court-800 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{b.name_zh_cn}</p>
                  <p className="truncate text-[11px] text-slate-500">{b.name_en} · {b.badge_id}</p>
                </div>
                <span className="shrink-0 rounded border border-court-600 px-1.5 py-0.5 text-[10px] text-slate-400">
                  {cat?.name_zh ?? b.category}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                {LEVELS.filter((l) => (tc[String(l.tier)] ?? 0) > 0).map((l) => (
                  <span key={l.id} className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: l.color, background: `${l.color}18` }}>
                    {l.name_zh} {tc[String(l.tier)]}
                  </span>
                ))}
                {n === 0 && <span className="text-[10px] text-amber-400/80">库中暂无持有者</span>}
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">{b.description_zh_cn}</p>

              {b.aliases.length > 0 && (
                <p className="mt-1 text-[10px] text-slate-600">旧译别名：{b.aliases.join(" / ")}</p>
              )}
              {b.translation_status !== "source_adopted" && (
                <p className="mt-1 text-[10px] text-amber-500/70">词库外名称 · 待官方核对</p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{n} 张卡持有</span>
                {n > 0 && (
                  <button onClick={() => setOpenId(open ? null : b.badge_id)}
                    className="ml-auto text-[11px] text-accent hover:underline">
                    {open ? "收起" : "查看持有卡片"}
                  </button>
                )}
              </div>

              {open && ids.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-court-600 pt-2">
                  {ids.map((id) => {
                    const c = getIndexCard(id);
                    if (!c) return null;
                    const rar = rarity(c.overall);
                    return (
                      <Link key={id} href={`/card/${id}/`} className="group flex items-center gap-2">
                        <span className={`w-6 shrink-0 text-right text-xs font-black ${rar.text}`}>{c.overall ?? "-"}</span>
                        <span className="truncate text-xs text-slate-300 group-hover:text-accent">{c.name}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-slate-600">{c.position}</span>
                      </Link>
                    );
                  })}
                  {holdersOf(b.badge_id).length > ids.length && (
                    <p className="pt-1 text-[10px] text-slate-600">仅显示前 {ids.length} 张，共 {n} 张</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!list.length && <p className="py-10 text-sm text-slate-500">没有匹配的徽章，试试中文名或旧译别名。</p>}

      <p className="rounded-lg border border-court-600 bg-court-800/60 p-3 text-[11px] leading-5 text-slate-500">
        数据口径：徽章名称为第三方简体中文词库（2kAuction），不代表 2K 官方译名；说明文字为社区通用机制解释，实际效果以游戏内为准。
        徽章等级（{LEVELS.map((l) => `${l.name_zh}${l.id === "legend" ? "（G.O.A.T. 专属）" : ""}`).join(" / ")}）与卡片宝石档位完全独立。
      </p>
    </div>
  );
}
