import Link from "next/link";
import { IndexCard } from "@/lib/types";
import { ovrColor } from "@/lib/format";
import { withBase } from "@/lib/base";

export default function CardTile({ card }: { card: IndexCard }) {
  return (
    <Link
      href={`/player/${card.id}/`}
      className="group rounded-xl border border-court-700 bg-court-800 p-3 transition hover:border-accent/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-3xl font-black leading-none ${ovrColor(card.overall)}`}>
            {card.overall ?? "?"}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
            {card.version} · {card.position ?? "?"}
            {card.sec ? `/${card.sec}` : ""}
          </p>
        </div>
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(card.image)}
            alt={card.name}
            loading="lazy"
            className="h-20 w-16 rounded object-cover"
          />
        ) : (
          <div className="grid h-20 w-16 place-items-center rounded bg-court-700 text-xs text-slate-500">
            无图
          </div>
        )}
      </div>
      <p className="mt-2 truncate font-semibold text-slate-100 group-hover:text-accent">
        {card.name}
      </p>
      <p className="truncate text-xs text-slate-400">
        {card.theme ?? card.collection ?? ""}
        {card.mt != null ? ` · ${card.mt.toLocaleString()} MT` : ""}
      </p>
    </Link>
  );
}
