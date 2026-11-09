import Link from "next/link";
import { IndexCard, withBase } from "@/lib/core";
import { rarity } from "@/lib/i18n";

export default function CardTile({ card }: { card: IndexCard }) {
  const rar = rarity(card.overall);
  return (
    <Link
      href={`/player/${card.id}/`}
      className={`group overflow-hidden rounded-xl border bg-court-800 transition hover:translate-y-[-2px] hover:brightness-110 ${rar.border}`}
    >
      <div className="relative">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(card.image)}
            alt={card.name}
            loading="lazy"
            className="h-40 w-full object-cover object-top"
          />
        ) : (
          <div className="grid h-40 w-full place-items-center bg-court-700 text-xs text-slate-500">暂无卡面</div>
        )}
        <div className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-lg font-black leading-none bg-court-900/70">
          <span className={rar.text}>{card.overall ?? "?"}</span>
          <span className="ml-1 text-[10px] font-bold text-slate-300">{card.position ?? ""}</span>
        </div>
        {card.mt != null && (
          <div className="absolute right-2 top-2 rounded bg-court-900/80 px-1.5 py-0.5 text-[10px] font-mono text-gain">
            {card.mt.toLocaleString("en-US")}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-bold text-white group-hover:text-accent">{card.name}</p>
        <p className="truncate text-[11px] text-slate-400">
          {card.theme ?? card.collection ?? ""} <span className="text-slate-600">{card.version}</span>
        </p>
      </div>
    </Link>
  );
}
