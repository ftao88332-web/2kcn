import { IndexCard } from "@/lib/types";
import { rarity, badgeCn, TIER_CN } from "@/lib/i18n";
import { withBase } from "@/lib/base";
import PricePanel from "@/components/price-panel";
import BadgesGrid from "@/components/badges-grid";
import AttrsGroups from "@/components/attrs-groups";

const cm = (v: number | null | undefined) => (v ? (v / 100).toFixed(2) + " m" : "-");

/** 投篮热区：值 0=冷 1=常规 2=热 3=大热（null=无数据） */
function Hotzones({ hz }: { hz: Record<string, unknown> }) {
  const ORDER: [string, string][] = [
    ["hz_under_basket", "篮下"],
    ["hz_close_left", "近左"], ["hz_close_middle", "近中"], ["hz_close_right", "近右"],
    ["hz_mid_left", "中左"], ["hz_mid_left_center", "中偏左"], ["hz_mid_center", "中"],
    ["hz_mid_right_center", "中偏右"], ["hz_mid_right", "中右"],
    ["hz_3pt_left", "三分左"], ["hz_3pt_left_center", "三分偏左"], ["hz_3pt_center", "三分中"],
    ["hz_3pt_right_center", "三分偏右"], ["hz_3pt_right", "三分右"],
  ];
  const cls = (v: number) =>
    v >= 3 ? "bg-rose-500" : v === 2 ? "bg-amber-400" : v === 1 ? "bg-sky-600" : "bg-court-700";
  return (
    <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
      {ORDER.filter(([k]) => k in hz).map(([k, label]) => {
        const v = Number(hz[k]);
        return (
          <div key={k} className="text-center">
            <div className={`mx-auto h-5 w-5 rounded-full ${v ? cls(v) : "bg-court-700"}`} title={label} />
            <p className="mt-1 text-[10px] text-slate-500">{label}</p>
          </div>
        );
      })}
      <div className="self-center text-[10px] leading-4 text-slate-500">
        <span className="mr-2"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-rose-500 align-[-1px]" />大热</span>
        <span className="mr-2"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400 align-[-1px]" />热</span>
        <span className="mr-2"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-600 align-[-1px]" />常规</span>
        <span className="mr-2"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-court-700 align-[-1px]" />冷区</span>
      </div>
    </div>
  );
}

/** 徽章数量摘要（铜/银/金/名人堂/传奇） */function badgeSummary(badges: Record<string, unknown>): string {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const v of Object.values(badges)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) c[n] = (c[n] ?? 0) + 1;
  }
  const parts: string[] = [];
  if (c[5]) parts.push(`传奇×${c[5]}`);
  if (c[4]) parts.push(`名人堂×${c[4]}`);
  if (c[3]) parts.push(`金×${c[3]}`);
  if (c[2]) parts.push(`银×${c[2]}`);
  if (c[1]) parts.push(`铜×${c[1]}`);
  return parts.join(" · ") || "暂无徽章";
}

export default function PlayerDetail({ card }: { card: IndexCard }) {
  const rar = rarity(card.overall);
  const img = withBase(card.image);
  const badges = (card.badges ?? {}) as Record<string, unknown>;
  const attrs = (card.attrs ?? {}) as Record<string, unknown>;
  const hz = (card.hotzones ?? {}) as Record<string, unknown>;

  // 名牌上的 Top-6 徽章（按等级排序）
  const topBadges = Object.entries(badges)
    .map(([slug, v]) => ({ slug, tier: Number(v) }))
    .filter((b) => Number.isFinite(b.tier) && b.tier > 0)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 顶部：卡图 + 名牌 + 实时价格 */}
      <div className="grid gap-6 md:grid-cols-[auto,1fr]">
        <div className={`w-fit rounded-2xl border-2 ${rar.border} bg-court-800 p-2 shadow-lg shadow-black/40`}>
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={card.name} className="h-56 w-44 rounded-xl object-cover sm:h-72 sm:w-56" />
          ) : (
            <div className="grid h-56 w-44 place-items-center rounded-xl bg-court-700 text-xs text-slate-500 sm:h-72 sm:w-56">
              暂无卡面
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className={`text-7xl font-black leading-none ${rar.text}`}>{card.overall ?? "?"}</p>
            <div className="pb-1">
              <h1 className="text-3xl font-black text-white">{card.name}</h1>
              <p className="mt-1 text-sm text-slate-400">
                {card.position ?? ""}{card.sec ? ` / ${card.sec}` : ""} · {card.team ?? "自由球员"}
                {" · "}<span className="text-slate-300">{card.theme ?? card.collection ?? ""}</span>
                {" · "}<span className="text-slate-500">{card.version?.toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-court-700 px-2 py-1 text-slate-300">身高 {cm(card.height_cm)}</span>
            <span className="rounded bg-court-700 px-2 py-1 text-slate-300">臂展 {cm(card.wingspan_cm)}</span>
            <span className="rounded bg-court-700 px-2 py-1 text-slate-300">体重 {card.weight_kg ?? "-"} kg</span>
          </div>

          {/* 名牌 Top 徽章 */}
          {topBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topBadges.map((b) => {
                const { name, zh } = badgeCn(b.slug);
                return (
                  <span key={b.slug} className="rounded border border-court-600 bg-court-800 px-1.5 py-0.5 text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-100">{name}</span>
                    <span className="ml-1 text-[10px] text-slate-500">{TIER_CN[b.tier] ?? ""}</span>
                    {!zh && <span className="ml-0.5 text-[9px] text-slate-600">EN</span>}
                  </span>
                );
              })}
            </div>
          )}

          <PricePanel cardId={card.id} />
        </div>
      </div>

      {/* 徽章全表 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-white">徽章</h2>
          <span className="text-xs text-slate-500">{badgeSummary(badges)}</span>
        </div>
        <BadgesGrid badges={badges as Record<string, number>} />
      </section>

      {/* 属性分组 */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-white">属性</h2>
        <AttrsGroups attrs={attrs} />
      </section>

      {/* 投篮热区（有数据才渲染） */}
      {Object.keys(hz).length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-bold text-white">投篮热区</h2>
          <div className="rounded-xl border border-court-700 bg-court-800 p-4">
            <Hotzones hz={hz} />
          </div>
        </section>
      )}
    </div>
  );
}
