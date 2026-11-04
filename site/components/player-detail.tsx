import { IndexCard } from "@/lib/types";
import { badgeCn, TIER_CN } from "@/lib/i18n";
import { withBase } from "@/lib/base";
import PricePanel from "@/components/price-panel";
import BadgesGrid from "@/components/badges-grid";
import AttrsGroups from "@/components/attrs-groups";

const cm = (v: number | null | undefined) => (v ? (v / 100).toFixed(2) + " m" : "-");

/** 统一卡片区块：细边框卡片 + 左侧主色竖线标题 */
function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-court-600 bg-court-800 p-5 shadow-lg shadow-black/20 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="h-4 w-1 shrink-0 rounded-full bg-accent" />
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {aside != null && (
          <span className="ml-auto text-xs text-muted">{aside}</span>
        )}
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

/** 投篮热区：值 0=冷 1=常规 2=热 3=大热 */
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
    v >= 3 ? "bg-[#B762FF]" : v === 2 ? "bg-gain" : v === 1 ? "bg-accent/50" : "bg-court-700";
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
      {ORDER.filter(([k]) => k in hz).map(([k, label]) => {
        const v = Number(hz[k]);
        return (
          <div key={k} className="text-center">
            <div className={`mx-auto h-5 w-5 rounded-full ${v ? cls(v) : "bg-court-700"}`} title={label} />
            <p className="mt-1.5 text-[10px] text-muted">{label}</p>
          </div>
        );
      })}
      <div className="self-center text-[10px] leading-5 text-muted">
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#B762FF] align-[-1px]" />大热</span>
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-gain align-[-1px]" />热</span>
        <span className="mr-3"><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-accent/50 align-[-1px]" />常规</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-court-700 align-[-1px]" />冷区</span>
      </div>
    </div>
  );
}

/** 徽章数量摘要（铜/银/金/名人堂/传奇） */
function badgeSummary(badges: Record<string, unknown>): string {
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
  const img = withBase(card.image);
  const badges = (card.badges ?? {}) as Record<string, unknown>;
  const attrs = (card.attrs ?? {}) as Record<string, unknown>;
  const hz = (card.hotzones ?? {}) as Record<string, unknown>;

  const topBadges = Object.entries(badges)
    .map(([slug, v]) => ({ slug, tier: Number(v) }))
    .filter((b) => Number.isFinite(b.tier) && b.tier > 0)
    .sort((a, b) => b.tier - a.tier)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      {/* 1. 头部信息区 */}
      <section className="rounded-xl border border-court-600 bg-court-800 p-5 shadow-lg shadow-black/20 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[auto,1fr]">
          {/* 卡图 */}
          <div className="w-fit rounded-xl border border-court-600 bg-court-700/60 p-1.5">
            {card.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={card.name} className="h-52 w-40 rounded-lg object-cover sm:h-64 sm:w-52" />
            ) : (
              <div className="grid h-52 w-40 place-items-center rounded-lg bg-court-700 text-xs text-muted sm:h-64 sm:w-52">
                暂无卡面
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-4">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              {/* 总评：视觉锚点 */}
              <p className="text-7xl font-black leading-none text-accent sm:text-8xl">{card.overall ?? "?"}</p>
              <div className="min-w-0 pb-1">
                <h1 className="break-words text-3xl font-black leading-tight text-ink sm:text-4xl">{card.name}</h1>
                <p className="mt-1.5 text-sm text-muted">
                  {card.position ?? ""}{card.sec ? ` / ${card.sec}` : ""}
                  {" · "}<span className="text-ink/90">{card.team ?? "自由球员"}</span>
                </p>
              </div>
            </div>

            {/* 名牌 Top 徽章 */}
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

            {/* 附属信息网格 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-court-600 pt-4 sm:grid-cols-3 lg:grid-cols-5">
              <Meta label="身高" value={cm(card.height_cm)} />
              <Meta label="臂展" value={cm(card.wingspan_cm)} />
              <Meta label="体重" value={card.weight_kg ? `${card.weight_kg} kg` : "-"} />
              <Meta label="卡种" value={card.version?.toUpperCase()} />
              <Meta label="卡包 / 系列" value={card.theme || card.collection || "-"} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. 属性面板区 */}
      <Section title="属性">
        <AttrsGroups attrs={attrs} />
      </Section>

      {/* 3. 徽章区 */}
      <Section title="徽章" aside={badgeSummary(badges)}>
        <BadgesGrid badges={badges as Record<string, number>} />
      </Section>

      {/* 4. 热区区 */}
      {Object.keys(hz).length > 0 && (
        <Section title="投篮热区">
          <Hotzones hz={hz} />
        </Section>
      )}

      {/* 5. 拍卖行 & 成交历史 */}
      <Section title="拍卖行 & 成交历史" aside={`全站快照 · ${card.overall ?? "?"} OVR`}>
        <PricePanel cardId={card.id} />
      </Section>
    </div>
  );
}
