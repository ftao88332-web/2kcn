"use client";

import { useState } from "react";
import { IndexCard, withBase } from "@/lib/core";
import { weightText, lengthText } from "@/lib/units";
import { TIER_CN, TIER_EN, TIER_COLOR } from "@/lib/i18n";
import { LEVELS } from "@/lib/badge-lexicon";
import { AttrsGroups, BadgesGrid, Hotzones, AnimationsGrid, DuoRow, EvoRow } from "@/components/detail-sections";
import BadgeItem from "@/components/badge-item";
import PricePanel from "@/components/price-panel";
import { useFavorites } from "@/lib/use-favorites";

type Tab = "overview" | "attributes" | "badges" | "animations" | "hotzones" | "market";

const TABS: { key: Tab; label: string; en: string }[] = [
  { key: "overview", label: "概览", en: "Overview" },
  { key: "attributes", label: "属性", en: "Attributes" },
  { key: "badges", label: "徽章", en: "Badges" },
  { key: "animations", label: "动作包", en: "Animations" },
  { key: "hotzones", label: "热区", en: "Hot Zones" },
  { key: "market", label: "行情", en: "Market" },
];

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function badgeSummary(badges: Record<string, unknown>): string {
  const c: Record<number, number> = {};
  for (const v of Object.values(badges)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) c[n] = (c[n] ?? 0) + 1;
  }
  return LEVELS.filter((l) => c[l.tier]).map((l) => `${l.name_zh}×${c[l.tier]}`).join(" · ") || "暂无徽章";
}

export default function PlayerDetail({ card }: { card: IndexCard }) {
  const badges = (card.badges ?? {}) as Record<string, number>;
  const hz = (card.hotzones ?? {}) as Record<string, unknown>;
  return <PlayerDetailInner card={card} badges={badges} hz={hz} />;
}

function PlayerDetailInner({ card, badges, hz }: { card: IndexCard; badges: Record<string, number>; hz: Record<string, unknown> }) {
  const { has, toggle } = useFavorites();
  const fav = has(card.id);
  const [tab, setTab] = useState<Tab>("overview");
  const topBadges = Object.entries(badges)
    .map(([slug, tier]) => ({ slug, tier: Number(tier) }))
    .filter((b) => b.tier > 0)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, 6);
  const hasHz = Object.keys(hz).length > 0;
  const hasAnim = card.animations && Object.keys(card.animations).length > 0;

  return (
    <div className="space-y-4">
      {/* Header：名称 / OVR / 位置 / 系列 */}
      <section className="rounded-xl border border-court-600 bg-court-800 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[auto,1fr]">
          <div className="w-fit rounded-xl border border-court-600 bg-court-700/60 p-1.5">
            {card.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withBase(card.image)} alt={card.name}
                className="aspect-[3/4] w-52 rounded-lg object-cover sm:w-64 lg:w-72" />
            ) : (
              <div className="grid aspect-[3/4] w-52 place-items-center rounded-lg bg-court-700 text-xs text-muted sm:w-64 lg:w-72">
                暂无卡面
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-3">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <p className="text-7xl font-black leading-none text-accent sm:text-8xl">{card.overall ?? "?"}</p>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="break-words text-3xl font-black leading-tight text-ink sm:text-4xl">{card.name}</h1>
                  <button onClick={() => toggle(card.id)}
                    title={fav ? "取消收藏" : "收藏"}
                    className={`rounded-full border px-2.5 py-1 text-sm transition ${fav ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-court-600 text-slate-400 hover:text-ink"}`}>
                    {fav ? "★ 已收藏" : "☆ 收藏"}
                  </button>
                </div>
                <p className="mt-1.5 text-sm text-muted">
                  {card.position ?? ""}{card.sec ? ` / ${card.sec}` : ""}
                  {" · "}<span className="text-ink/90">{card.team ?? "自由球员"}</span>
                  {(card.theme || card.collection) && (
                    <span className="ml-1.5 text-slate-500">· {card.theme || card.collection}</span>
                  )}
                  {card.tier != null && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 align-middle text-[11px]"
                      style={{
                        color: TIER_COLOR[card.tier] ?? "#94a3b8",
                        borderColor: `${TIER_COLOR[card.tier] ?? "#94a3b8"}80`,
                        background: `${TIER_COLOR[card.tier] ?? "#94a3b8"}14`,
                      }}>
                      <i className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_COLOR[card.tier] ?? "#94a3b8" }} />
                      {TIER_CN[card.tier] ?? `tier ${card.tier}`}
                      <span className="opacity-70">{TIER_EN[card.tier] ?? ""}</span>
                    </span>
                  )}
                </p>
                {(card.off_overall != null || card.def_overall != null) && (
                  <p className="mt-1 text-[11px] text-muted">
                    进攻总评 <b className="text-ink/90">{card.off_overall ?? "-"}</b>
                    <span className="mx-1.5 opacity-60">·</span>
                    防守总评 <b className="text-ink/90">{card.def_overall ?? "-"}</b>
                    <span className="mx-1.5 opacity-60">·</span>
                    徽章 <b className="text-ink/90">{card.badge_count ?? Object.values(badges).filter((v) => v > 0).length}</b>
                  </p>
                )}
              </div>
            </div>

            {topBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topBadges.map((b) => <BadgeItem key={b.slug} badgeId={b.slug} tier={b.tier} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 六个 Tab */}
      <nav className="sticky top-14 z-20 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-court-600 bg-court-800/95 p-1.5 backdrop-blur">
        {TABS.map((t) => {
          const disabled = (t.key === "hotzones" && !hasHz) || (t.key === "animations" && !hasAnim);
          return (
            <button key={t.key} disabled={disabled} onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition ${
                tab === t.key ? "bg-accent/20 text-accent" : disabled ? "text-slate-600" : "text-slate-400 hover:text-ink"
              }`}>
              {t.label}
              <span className="ml-1 hidden text-[10px] opacity-60 sm:inline">{t.en}</span>
            </button>
          );
        })}
      </nav>

      {tab === "overview" && (
        <>
          <section className="rounded-xl border border-court-600 bg-court-800 p-5">
            <h2 className="mb-4 text-base font-bold text-ink">基本信息</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              <Meta label="身高" value={lengthText(card.height_cm)} />
              <Meta label="臂展" value={lengthText(card.wingspan_cm)} />
              <Meta label="体重" value={weightText(card.weight_kg, card.weight_lb, { withLb: true })} />
              <Meta label="卡种" value={card.version?.toUpperCase()} />
              <Meta label="卡包 / 系列" value={card.theme || card.collection || "-"} />
              <Meta label="主位置 / 副位置" value={`${card.position ?? "-"}${card.sec ? ` / ${card.sec}` : ""}`} />
              <Meta label="上线日期" value={card.released_at ?? "-"} />
              <Meta label="徽章总数" value={`${Object.values(badges).filter((v) => v > 0).length} 个`} />
            </div>
            {card.plays && card.plays.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-court-600 pt-4">
                <span className="text-[11px] text-muted">打法标签</span>
                {card.plays.map((p) => (
                  <span key={p} className="rounded border border-court-600 bg-court-900/60 px-1.5 py-0.5 text-[11px] text-muted">{p}</span>
                ))}
              </div>
            )}
          </section>
          {card.duos && card.duos.length > 0 && (
            <section className="rounded-xl border border-court-600 bg-court-800 p-5">
              <h2 className="mb-3 text-base font-bold text-ink">双人组</h2>
              <DuoRow duos={card.duos} />
            </section>
          )}
          {card.evos && card.evos.length > 0 && (
            <section className="rounded-xl border border-court-600 bg-court-800 p-5">
              <h2 className="mb-3 text-base font-bold text-ink">进化路线</h2>
              <EvoRow evos={card.evos} />
            </section>
          )}
        </>
      )}

      {tab === "attributes" && (
        <section className="rounded-xl border border-court-600 bg-court-800 p-5">
          <h2 className="mb-4 text-base font-bold text-ink">属性</h2>
          <AttrsGroups attrs={(card.attrs ?? {}) as Record<string, unknown>} />
        </section>
      )}

      {tab === "badges" && (
        <section className="rounded-xl border border-court-600 bg-court-800 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
            徽章 <span className="text-xs font-normal text-muted">{badgeSummary(badges)}</span>
          </h2>
          <BadgesGrid badges={badges} />
        </section>
      )}

      {tab === "animations" && hasAnim && (
        <section className="rounded-xl border border-court-600 bg-court-800 p-5">
          <h2 className="mb-4 text-base font-bold text-ink">动作包</h2>
          <AnimationsGrid animations={card.animations as Record<string, unknown>} />
        </section>
      )}

      {tab === "hotzones" && hasHz && (
        <section className="rounded-xl border border-court-600 bg-court-800 p-5">
          <h2 className="mb-4 text-base font-bold text-ink">投篮热区</h2>
          <Hotzones hz={hz} />
        </section>
      )}

      {tab === "market" && (
        <section className="rounded-xl border border-court-600 bg-court-800 p-5">
          <h2 className="mb-4 text-base font-bold text-ink">拍卖行 & 成交历史</h2>
          <PricePanel cardId={card.id} />
        </section>
      )}
    </div>
  );
}
