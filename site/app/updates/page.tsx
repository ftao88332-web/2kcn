import Link from "next/link";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/core";
import { TIER_CN } from "@/lib/i18n";
import { withBase } from "@/lib/core";

const ALL = cards as unknown as IndexCard[];

const fmtDay = (s?: string | null) => (s ? s.slice(0, 10) : "—");

function Mini({ card }: { card: IndexCard }) {
  return (
    <Link href={`/player/${card.id}/`}
      className="flex items-center gap-2.5 rounded-lg border border-court-600 bg-court-900/50 px-2.5 py-2 hover:border-accent/60 hover:bg-court-700/60">
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={withBase(card.image)} alt={card.name} className="h-11 w-9 rounded object-cover" />
      ) : (
        <span className="grid h-11 w-9 place-items-center rounded bg-court-700 text-[10px] text-muted">无图</span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <b className="text-sm text-accent">{card.overall ?? "?"}</b>
          <span className="truncate text-xs font-semibold text-ink">{card.name}</span>
        </span>
        <span className="block truncate text-[10px] text-slate-500">
          {card.position ?? ""}{card.sec ? `/${card.sec}` : ""}
          {card.tier != null ? ` · ${TIER_CN[card.tier] ?? card.tier}` : ""}
          {card.collection ? ` · ${card.collection}` : ""}
        </span>
      </span>
    </Link>
  );
}

export default function UpdatesPage() {
  const newest = ALL.slice()
    .sort((a, b) => (b.released_at ?? "").localeCompare(a.released_at ?? ""))
    .slice(0, 24);
  const evos = ALL.filter((c) => c.evos && c.evos.length > 0);
  const duos = ALL.filter((c) => c.duos && c.duos.length > 0);
  const latestDay = ALL.map((c) => c.released_at ?? "").sort().slice(-1)[0] || "—";

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-bold text-white">最新更新</h1>
        <p className="mt-1.5 text-xs text-slate-500">
          共 {ALL.length} 张卡 · 最近入库 {fmtDay(latestDay)} · 可进化 {evos.length} 张 · 有双人组 {duos.length} 张
        </p>
      </section>

      <section>
        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-white">
          最新入库 <span className="text-xs font-normal text-slate-500">按上线日期倒序，取前 24 张</span>
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {newest.map((c) => <Mini key={c.id} card={c} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-white">
          进化卡 <span className="text-xs font-normal text-slate-500">满足条件可逐阶段提升</span>
        </h2>
        {evos.length ? (
          <div className="space-y-2">
            {evos.map((c) => (
              <div key={c.id} className="rounded-xl border border-court-600 bg-court-800 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Mini card={c} />
                  <span className="ml-auto text-[11px] text-slate-500">{c.evos?.length} 个阶段</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.evos?.map((e, i) => (
                    <span key={i} className="rounded bg-court-700/60 px-2 py-1 text-[11px] text-ink/85">
                      阶段 {e.stage ?? i + 1}
                      {e.label ? ` · ${e.label}` : ""}
                      {e.gains?.length ? ` · ${e.gains.slice(0, 3).map((g) => `${g.k} +${g.d}`).join("、")}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">暂无进化卡数据。</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-white">
          双人组 <span className="text-xs font-normal text-slate-500">搭档同场可激活加成</span>
        </h2>
        {duos.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {duos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-court-600 bg-court-800 px-3 py-2">
                <Mini card={c} />
                <span className="text-[11px] text-slate-500">搭档</span>
                <div className="ml-auto flex flex-wrap gap-1.5">
                  {c.duos?.map((d) => (
                    <Link key={d.id} href={`/player/${d.id}/`}
                      className="rounded bg-court-700/60 px-1.5 py-0.5 text-[11px] text-ink/85 hover:text-accent">
                      {d.overall ?? "?"} {d.name ?? "搭档卡"}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">暂无双人组数据。</p>
        )}
      </section>

      <section className="rounded-xl border border-court-600 bg-court-800 p-4 text-xs leading-6 text-slate-500">
        <b className="text-slate-300">关于「数据调整」追踪</b><br />
        属性、徽章、动作包的变更记录需要保留历史版本快照并逐字段比对，仅靠重新采集无法判断“是否真的变了”。
        当前每次采集都会覆盖同一份数据，因此该模块暂未启用；待加入版本快照后再开放。
      </section>
    </div>
  );
}
