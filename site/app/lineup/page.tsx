"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import cards from "@/data/cards_index.json";
import { IndexCard, fmtMt, withBase } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

const ALL = cards as unknown as IndexCard[];
const BY_ID = new Map(ALL.map((c) => [c.id, c]));

const SLOTS = [
  "PG", "SG", "SF", "PF", "C",
  "替补 1", "替补 2", "替补 3", "替补 4", "替补 5",
  "替补 6", "替补 7", "替补 8", "替补 9", "替补 10",
];
const STORE = "lineup_v1";

const empty = (): (number | null)[] => Array(SLOTS.length).fill(null);

/** 阵容里的参考价：双平台均价优先，其次主机 / PC */
function priceOf(id: number, doc: ReturnType<typeof usePrices>["doc"]): number | null {
  const e = doc?.cards?.[String(id)];
  return e?.a ?? e?.co ?? e?.pc ?? null;
}

export default function LineupPage() {
  const { doc } = usePrices();
  const [ids, setIds] = useState<(number | null)[]>(empty);
  const [slot, setSlot] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);

  // 载入：URL hash 优先，其次 localStorage
  useEffect(() => {
    const m = window.location.hash.match(/lu=([\d,]*)/);
    if (m) {
      const arr = m[1].split(",").map((x) => (x && BY_ID.has(Number(x)) ? Number(x) : null));
      setIds(Array.from({ length: SLOTS.length }, (_, i) => arr[i] ?? null));
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE) || "[]");
        if (Array.isArray(saved)) {
          setIds(Array.from({ length: SLOTS.length }, (_, i) => saved[i] ?? null));
        }
      } catch { /* 忽略损坏的本地数据 */ }
    }
    setReady(true);
  }, []);

  // 持久化 + 同步分享链接（不产生历史记录）
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE, JSON.stringify(ids));
    const hash = ids.some(Boolean) ? `#lu=${ids.map((id) => id ?? 0).join(",")}` : "";
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }, [ids, ready]);

  const used = useMemo(() => new Set(ids.filter(Boolean) as number[]), [ids]);
  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return ALL
      .filter((c) => !used.has(c.id))
      .filter((c) => !kw || [c.name, c.team, c.theme, c.collection]
        .some((v) => (v ?? "").toLowerCase().includes(kw)))
      .slice(0, 24);
  }, [q, used]);

  const roster = ids.map((id) => (id ? BY_ID.get(id) ?? null : null));
  const filled = roster.filter(Boolean) as IndexCard[];
  const avgOvr = filled.length
    ? (filled.reduce((s, c) => s + (c.overall ?? 0), 0) / filled.length).toFixed(1)
    : "—";
  const priced = filled.map((c) => priceOf(c.id, doc)).filter((p): p is number => p != null);
  const budget = priced.reduce((s, p) => s + p, 0);

  function put(id: number) {
    if (slot == null) return;
    setIds((prev) => {
      const next = prev.slice();
      const at = next.indexOf(id);
      if (at >= 0) next[at] = null; // 已在阵容中 → 换位而非重复
      next[slot] = id;
      return next;
    });
    setSlot(null);
    setQ("");
  }

  function remove(i: number) {
    setIds((prev) => prev.map((v, j) => (j === i ? null : v)));
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}#lu=${ids.map((id) => id ?? 0).join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("分享链接已复制");
    } catch {
      window.prompt("复制分享链接", url);
    }
  }

  function exportPng() {
    const W = 1100, H = 760, scale = 2;
    const cv = document.createElement("canvas");
    cv.width = W * scale;
    cv.height = H * scale;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    ctx.fillStyle = "#0F1118";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4F8CFF";
    ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = "#E8EBF2";
    ctx.font = "800 34px system-ui, 'Microsoft YaHei', sans-serif";
    ctx.fillText("我的 2K27 阵容", 48, 62);
    ctx.fillStyle = "#98A2B3";
    ctx.font = "500 17px system-ui, 'Microsoft YaHei', sans-serif";
    ctx.fillText(
      `平均总评 ${avgOvr}  ·  总造价 ${priced.length ? fmtMt(budget) : "—"}  ·  ${filled.length}/15 人`,
      48, 94
    );

    const CW = 312;
    const drawCol = (start: number, x: number, title: string) => {
      ctx.fillStyle = "#4F8CFF";
      ctx.font = "700 15px system-ui, 'Microsoft YaHei', sans-serif";
      ctx.fillText(title, x, 140);
      for (let i = 0; i < 5; i++) {
        const idx = start + i;
        const y = 166 + i * 52;
        ctx.fillStyle = i % 2 ? "#1A1D29" : "#151824";
        ctx.fillRect(x, y, CW, 44);
        const c = roster[idx];
        ctx.fillStyle = "#98A2B3";
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillText(SLOTS[idx], x + 10, y + 27);
        if (!c) {
          ctx.fillStyle = "#3A4054";
          ctx.font = "500 14px system-ui, 'Microsoft YaHei', sans-serif";
          ctx.fillText("空位", x + 70, y + 28);
          continue;
        }
        ctx.fillStyle = "#4F8CFF";
        ctx.font = "800 18px system-ui, sans-serif";
        ctx.fillText(String(c.overall ?? "?"), x + 70, y + 28);
        ctx.fillStyle = "#E8EBF2";
        ctx.font = "600 14px system-ui, 'Microsoft YaHei', sans-serif";
        ctx.fillText(clip(ctx, c.name ?? "", 118), x + 106, y + 28);
        const p = priceOf(c.id, doc);
        ctx.fillStyle = p != null ? "#4ADE80" : "#4A5065";
        ctx.font = "500 12px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(p != null ? fmtMt(p) : "—", x + CW - 10, y + 27);
        ctx.textAlign = "left";
      }
    };
    drawCol(0, 48, "首发");
    drawCol(5, 394, "替补");
    drawCol(10, 740, "替补（续）");

    ctx.fillStyle = "#4A5065";
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillText("2K中文库  ·  ftao88332-web.github.io/2kcn", 48, H - 24);

    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `2k27-lineup-${avgOvr}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-xl font-bold text-white">我的阵容</h1>
        <span className="text-xs text-slate-500">
          平均总评 <b className="text-accent">{avgOvr}</b> · 造价{" "}
          <b className="text-gain">{fmtMt(budget)}</b>
          {priced.length < filled.length && `（${priced.length}/${filled.length} 张有报价）`}
        </span>
        <div className="ml-auto flex gap-2">
          <button onClick={share}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-accent hover:border-accent/60 hover:bg-accent/10">
            分享链接
          </button>
          <button onClick={exportPng}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-ink/90 hover:border-accent/60 hover:bg-accent/10">
            导出图片
          </button>
          <button onClick={() => { if (confirm("清空阵容？")) { setIds(empty()); setSlot(null); } }}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-slate-400 hover:border-rose-400/60 hover:text-rose-300">
            清空
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
        <div className="space-y-4">
          <Section title="首发">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Slot key={i} i={i} card={roster[i]} active={slot === i}
                  onPick={() => { setSlot(i); setQ(""); }} onRemove={() => remove(i)} />
              ))}
            </div>
          </Section>
          <Section title="替补">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {Array.from({ length: 10 }, (_, n) => n + 5).map((i) => (
                <Slot key={i} i={i} card={roster[i]} active={slot === i}
                  onPick={() => { setSlot(i); setQ(""); }} onRemove={() => remove(i)} />
              ))}
            </div>
          </Section>
        </div>

        <div className="rounded-xl border border-court-600 bg-court-800 p-4">
          {slot == null ? (
            <div className="space-y-2 text-sm text-slate-400">
              <p className="font-semibold text-ink">选一张卡放进阵容</p>
              <p>点击左侧任意空位，然后搜索球员加入。同一张卡不会重复入选。</p>
              <p className="text-xs text-slate-500">阵容自动保存在本机；点「分享链接」可发给朋友直接还原。</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">选择 {SLOTS[slot]}</p>
                <button onClick={() => setSlot(null)} className="text-xs text-slate-500 hover:text-ink">取消</button>
              </div>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="搜索球员 / 球队 / 系列"
                className="w-full rounded-lg border border-court-600 bg-court-900 px-3 py-2 text-sm outline-none focus:border-accent" />
              <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
                {results.map((c) => (
                  <button key={c.id} onClick={() => put(c.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-court-600 hover:bg-court-700/60">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={withBase(c.image)} alt="" loading="lazy"
                        className="h-10 w-8 shrink-0 rounded object-cover object-top" />
                    ) : <div className="h-10 w-8 shrink-0 rounded bg-court-700" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{c.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {c.position ?? ""} · {c.team ?? "自由球员"} · {c.theme ?? c.collection ?? ""}
                      </span>
                    </span>
                    <span className="text-sm font-black text-accent">{c.overall ?? "?"}</span>
                  </button>
                ))}
                {!results.length && <p className="py-6 text-center text-xs text-slate-500">没有匹配的卡片</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        想看完整卡库？<Link href="/players/" className="text-accent hover:underline">去卡库</Link>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-court-600 bg-court-800 p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">{title}</p>
      {children}
    </section>
  );
}

function Slot({ i, card, active, onPick, onRemove }: {
  i: number; card: IndexCard | null; active: boolean; onPick: () => void; onRemove: () => void;
}) {
  return (
    <div className={`group relative rounded-lg border bg-court-900/60 p-2 transition ${active ? "border-accent" : "border-court-600"}`}>
      <button onClick={onPick} className="block w-full text-left">
        <span className="mb-1 block text-[10px] font-bold text-slate-500">{SLOTS[i]}</span>
        {card ? (
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-ink">{card.name}</span>
              <span className="block truncate text-[10px] text-slate-500">
                {card.position ?? ""} · {card.team ?? ""}
              </span>
            </span>
            <span className="text-base font-black text-accent">{card.overall ?? "?"}</span>
          </span>
        ) : (
          <span className="grid h-10 place-items-center rounded border border-dashed border-court-600 text-lg text-slate-600 group-hover:border-accent/60 group-hover:text-accent">+</span>
        )}
      </button>
      {card && (
        <button onClick={onRemove} title="移出阵容"
          className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 place-items-center rounded-full bg-court-700 text-[10px] text-slate-300 group-hover:grid hover:bg-rose-500 hover:text-white">
          ×
        </button>
      )}
    </div>
  );
}

/** Canvas 文本超宽截断 */
function clip(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}
