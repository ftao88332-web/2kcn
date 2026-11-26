"use client";

import { IndexCard, withBase } from "@/lib/core";
import { TIER_CN, badgeCn, rarity } from "@/lib/i18n";
import { AttrsGroups, BadgesGrid, Hotzones, AnimationsGrid, DuoRow, EvoRow } from "@/components/detail-sections";
import PricePanel from "@/components/price-panel";
import { useFavorites } from "@/lib/use-favorites";

const cm = (v?: number | null) => (v ? (v / 100).toFixed(2) + " m" : "-");
function Section({ title, aside, children }: {
  title: string; aside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-court-600 bg-court-800 p-5 shadow-lg shadow-black/20 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="h-4 w-1 shrink-0 rounded-full bg-accent" />
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {aside != null && <span className="ml-auto text-xs text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

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
  return [5, 4, 3, 2, 1].filter((t) => c[t])
    .map((t) => `${TIER_CN[t]}×${c[t]}`).join(" · ") || "暂无徽章";
}

export default function PlayerDetail({ card }: { card: IndexCard }) {
  const badges = (card.badges ?? {}) as Record<string, number>;
  const hz = (card.hotzones ?? {}) as Record<string, unknown>;
  return <PlayerDetailInner card={card} badges={badges} hz={hz} />;
}

function PlayerDetailInner({ card, badges, hz }: { card: IndexCard; badges: Record<string, number>; hz: Record<string, unknown> }) {
  const { has, toggle } = useFavorites();
  const fav = has(card.id);
  const topBadges = Object.entries(badges)
    .map(([slug, tier]) => ({ slug, tier: Number(tier) }))
    .filter((b) => b.tier > 0)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-court-600 bg-court-800 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[auto,1fr]">
          <div className="w-fit rounded-xl border border-court-600 bg-court-700/60 p-1.5">
            {card.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={withBase(card.image)} alt={card.name}
                className="h-52 w-40 rounded-lg object-cover sm:h-64 sm:w-52" />
            ) : (
              <div className="grid h-52 w-40 place-items-center rounded-lg bg-court-700 text-xs text-muted sm:h-64 sm:w-52">
                暂无卡面
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-4">
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
                </p>
                {(card.off_overall != null || card.def_overall != null) && (
                  <p className="mt-1 text-[11px] text-muted">
                    进攻总评 <b className="text-ink/90">{card.off_overall ?? "-"}</b>
                    <span className="mx-1.5 opacity-60">·</span>
                    防守总评 <b className="text-ink/90">{card.def_overall ?? "-"}</b>
                  </p>
                )}
              </div>
            </div>

            {topBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topBadges.map((b) => {
                  const { name, zh } = badgeCn(b.slug);
                  return (
                    <span key={b.slug} className="rounded border border-court-600 bg-court-900/60 px-1.5 py-0.5 text-[11px] text-muted">
                      <span className="font-semibold text-ink">{name}</span>
                      <span className="ml-1 text-[10px]">{TIER_CN[b.tier] ?? ""}</span>
                      {!zh && <span className="ml-0.5 text-[9px] opacity-70">EN</span>}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-court-600 pt-4 sm:grid-cols-3 lg:grid-cols-5">
              <Meta label="身高" value={cm(card.height_cm)} />
              <Meta label="臂展" value={cm(card.wingspan_cm)} />
              <Meta label="体重" value={card.weight_kg ? `${card.weight_kg} kg` : "-"} />
              <Meta label="卡种" value={card.version?.toUpperCase()} />
              <Meta label="卡包 / 系列" value={card.theme || card.collection || "-"} />
            </div>

            {card.plays && card.plays.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.plays.map((p) => (
                  <span key={p} className="rounded border border-court-600 bg-court-900/60 px-1.5 py-0.5 text-[11px] text-muted">{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Section title="属性"><AttrsGroups attrs={(card.attrs ?? {}) as Record<string, unknown>} /></Section>
      <Section title="徽章" aside={badgeSummary(badges)}><BadgesGrid badges={badges} /></Section>
      {Object.keys(hz).length > 0 && <Section title="投篮热区"><Hotzones hz={hz} /></Section>}
      {card.animations && Object.keys(card.animations).length > 0 && (
        <Section title="动作包"><AnimationsGrid animations={card.animations as Record<string, unknown>} /></Section>
      )}
      {card.duos && card.duos.length > 0 && (
        <Section title="双人组"><DuoRow duos={card.duos} /></Section>
      )}
      {card.evos && card.evos.length > 0 && (
        <Section title="进化路线"><EvoRow evos={card.evos} /></Section>
      )}
      <Section title="拍卖行 & 成交历史" aside={`全站快照 · ${card.overall ?? "?"} OVR`}>
        <PricePanel cardId={card.id} />
      </Section>
    </div>
  );
}
