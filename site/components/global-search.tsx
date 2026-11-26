"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quickSearch, positionsOf, QueryCard } from "@/lib/services/cards";

export default function GlobalSearch({ placeholder = "搜索球员 / 球队 / 系列" }: { placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => (debounced.trim() ? quickSearch(debounced, 8) : []), [debounced]);

  const go = (c: QueryCard) => {
    setOpen(false);
    setQ("");
    router.push(`/player/${c.id}/`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="relative w-full sm:w-64">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="w-full rounded-lg border border-court-600 bg-court-900/80 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-slate-500 focus:border-accent/60"
      />
      {open && results.length > 0 && (
        <div className="absolute right-0 z-50 mt-1 max-h-80 w-72 overflow-auto rounded-lg border border-court-600 bg-court-900 shadow-2xl">
          {results.map((c, i) => (
            <button key={c.id} onClick={() => go(c)} onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${i === active ? "bg-court-700" : "hover:bg-court-700"}`}>
              <span className="w-7 font-black text-accent">{c.overall}</span>
              <span className="truncate text-ink">{c.name}</span>
              <span className="ml-auto shrink-0 text-[10px] text-slate-500">{positionsOf(c).join("/")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
