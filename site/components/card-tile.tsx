"use client";

import Link from "next/link";
import { IndexCard, withBase } from "@/lib/core";
import { rarity } from "@/lib/i18n";
import LivePrice from "@/components/live-price";
import { useFavorites } from "@/lib/use-favorites";

export default function CardTile({ card }: { card: IndexCard }) {
  const rar = rarity(card.overall);
  const { has, toggle } = useFavorites();
  const fav = has(card.id);
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-court-800 transition hover:translate-y-[-2px] hover:brightness-110 ${rar.border}`}>
      <Link href={`/player/${card.id}/`}>
        <div className="relative">
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={withBase(card.image)}
              alt={card.name}
              loading="lazy"
              className="aspect-[3/4] w-full object-cover object-top"
            />
          ) : (
            <div className="grid aspect-[3/4] w-full place-items-center bg-court-700 text-xs text-slate-500">暂无卡面</div>
          )}
          <div className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-lg font-black leading-none bg-court-900/70">
            <span className={rar.text}>{card.overall ?? "?"}</span>
            <span className="ml-1 text-[10px] font-bold text-slate-300">{card.position ?? ""}{card.sec ? `/${card.sec}` : ""}</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(card.id); }}
            title={fav ? "取消收藏" : "收藏"}
            className={`absolute right-2 top-2 rounded-full bg-court-900/70 px-2 py-1 text-sm transition hover:bg-court-700 ${fav ? "text-amber-300" : "text-slate-400"}`}
          >
            {fav ? "★" : "☆"}
          </button>
          <LivePrice id={card.id} fallback={card.mt} />
        </div>
      </Link>
      <div className="p-3">
        <p className="truncate font-bold text-white group-hover:text-accent">{card.name}</p>
        <p className="truncate text-[11px] text-slate-400">
          {card.theme ?? card.collection ?? ""} <span className="text-slate-600">{card.version}</span>
        </p>
      </div>
    </div>
  );
}
