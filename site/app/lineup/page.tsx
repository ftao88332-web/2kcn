"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import cards from "@/data/cards_index.json";
import { IndexCard, fmtMt, withBase } from "@/lib/core";
import { usePrices } from "@/lib/use-prices";

const ALL = cards as unknown as IndexCard[];
const BY_ID = new Map(ALL.map((c) => [c.id, c]));

/** 15 人 = 3 组 × 5 个位置：每个位置只能放该位置的卡 */
const POS = ["PG", "SG", "SF", "PF", "C"];
const UNITS = ["首发", "替补", "替补（续）"];
const SLOTS = Array.from({ length: 15 }, (_, i) => ({
  pos: POS[i % 5],
  unit: UNITS[Math.floor(i / 5)],
}));
const STORE = "lineup_v1";
type Basis = "co" | "pc";

const empty = (): (number | null)[] => Array(SLOTS.length).fill(null);

/** 位置对号入座：位置不符的卡放到同位置的空位，放不下就丢弃 */
function normalize(arr: (number | null)[]): (number | null)[] {
  const out = empty();
  for (const id of arr) {
    if (!id) continue;
    const c = BY_ID.get(id);
    if (!c) continue;
    const at = SLOTS.findIndex((s, i) => s.pos === c.position && out[i] == null);
    if (at >= 0) out[at] = id;
  }
  return out;
}

/** 参考价：按当前选择的端取价 */
function priceOf(id: number, doc: ReturnType<typeof usePrices>["doc"], basis: Basis): number | null {
  const e = doc?.cards?.[String(id)];
  return e?.[basis] ?? e?.a ?? null;
}

export default function LineupPage() {
  const { doc } = usePrices();
  const [ids, setIds] = useState<(number | null)[]>(empty);
  const [slot, setSlot] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [basis, setBasis] = useState<Basis>("co");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // 载入：URL hash 优先，其次 localStorage
  useEffect(() => {
    const m = window.location.hash.match(/lu=([\d,]*)/);
    if (m) {
      const arr = m[1].split(",").map((x) => (x && BY_ID.has(Number(x)) ? Number(x) : null));
      setIds(normalize(Array.from({ length: SLOTS.length }, (_, i) => arr[i] ?? null)));
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE) || "[]");
        if (Array.isArray(saved)) {
          setIds(normalize(Array.from({ length: SLOTS.length }, (_, i) => saved[i] ?? null)));
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
  const slotPos = slot == null ? null : SLOTS[slot].pos;
  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return ALL
      .filter((c) => !used.has(c.id))
      .filter((c) => !slotPos || c.position === slotPos)
      .filter((c) => !kw || [c.name, c.team, c.theme, c.collection]
        .some((v) => (v ?? "").toLowerCase().includes(kw)))
      .slice(0, 30);
  }, [q, used, slotPos]);

  const roster = ids.map((id) => (id ? BY_ID.get(id) ?? null : null));
  const filled = roster.filter(Boolean) as IndexCard[];
  const avgOvr = filled.length
    ? (filled.reduce((s, c) => s + (c.overall ?? 0), 0) / filled.length).toFixed(1)
    : "—";
  const priced = filled.map((c) => priceOf(c.id, doc, basis)).filter((p): p is number => p != null);
  const budget = priced.reduce((s, p) => s + p, 0);
  const basisLabel = basis === "co" ? "主机" : "PC";

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

  async function exportPng() {
    if (busy) return;
    setBusy(true);
    try {
      const imgs = await Promise.all(roster.map((c) =>
        c?.image ? loadImage(withBase(c.image)) : Promise.resolve(null)));

      const W = 1100, H = 1000, scale = 2;
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
        `平均总评 ${avgOvr}  ·  总造价 ${priced.length ? fmtMt(budget) : "—"}（${basisLabel}价）  ·  ${filled.length}/15 人`,
        48, 96
      );

      const COL_W = 187, IMG_W = 132, IMG_H = 188, GAP = 18;
      const startX = (W - (COL_W * 5 + GAP * 4)) / 2;

      for (let r = 0; r < 3; r++) {
        const rowY = 150 + r * 264;
        ctx.fillStyle = "#4F8CFF";
        ctx.font = "700 15px system-ui, 'Microsoft YaHei', sans-serif";
        ctx.fillText(UNITS[r], startX, rowY - 8);

        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          const x = startX + c * (COL_W + GAP) + (COL_W - IMG_W) / 2;
          const y = rowY;
          const card = roster[idx];

          // 图片框
          ctx.fillStyle = "#1A1D29";
          roundRect(ctx, x, y, IMG_W, IMG_H, 10);
          ctx.fill();
          const img = imgs[idx];
          if (img) {
            ctx.save();
            roundRect(ctx, x, y, IMG_W, IMG_H, 10);
            ctx.clip();
            ctx.drawImage(img, x, y, IMG_W, IMG_H);
            ctx.restore();
          }

          // 位置角标
          ctx.fillStyle = "rgba(15,17,24,0.78)";
          roundRect(ctx, x + 5, y + 5, 34, 20, 5);
          ctx.fill();
          ctx.fillStyle = "#98A2B3";
          ctx.font = "700 12px system-ui, sans-serif";
          ctx.fillText(SLOTS[idx].pos, x + 12, y + 19);

          if (!card) {
            ctx.fillStyle = "#3A4054";
            ctx.font = "600 13px system-ui, 'Microsoft YaHei', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("空位", x + IMG_W / 2, y + IMG_H / 2 + 5);
            ctx.textAlign = "left";
            continue;
          }

          // 总评角标
          ctx.fillStyle = "rgba(15,17,24,0.85)";
          roundRect(ctx, x + IMG_W - 44, y + 5, 39, 24, 5);
          ctx.fill();
          ctx.fillStyle = "#4F8CFF";
          ctx.font = "800 17px system-ui, sans-serif";
          ctx.fillText(String(card.overall ?? "?"), x + IMG_W - 37, y + 23);

          // 姓名 + 价格
          ctx.fillStyle = "#E8EBF2";
          ctx.font = "700 13px system-ui, 'Microsoft YaHei', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(clip(ctx, card.name ?? "", IMG_W + 24), x + IMG_W / 2, y + IMG_H + 20);
          const p = priceOf(card.id, doc, basis);
          ctx.fillStyle = p != null ? "#4ADE80" : "#4A5065";
          ctx.font = "500 12px ui-monospace, monospace";
          ctx.fillText(p != null ? fmtMt(p) : "—", x + IMG_W / 2, y + IMG_H + 38);
          ctx.textAlign = "left";
        }
      }

      ctx.fillStyle = "#4A5065";
      ctx.font = "500 13px system-ui, sans-serif";
      ctx.fillText(`2K中文库  ·  ftao88332-web.github.io/2kcn  ·  价格取自${basisLabel}端`, 48, H - 24);

      cv.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `2k27-lineup-${avgOvr}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
    } finally {
      setBusy(false);
    }
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
        <div className="flex overflow-hidden rounded-lg border border-court-600 text-xs">
          {(["co", "pc"] as Basis[]).map((b) => (
            <button key={b} onClick={() => setBasis(b)}
              className={`px-2.5 py-1.5 ${basis === b ? "bg-accent/20 text-accent" : "text-slate-400 hover:text-ink"}`}>
              {b === "co" ? "主机价" : "PC 价"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={share}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-accent hover:border-accent/60 hover:bg-accent/10">
            分享链接
          </button>
          <button onClick={exportPng} disabled={busy}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-ink/90 hover:border-accent/60 hover:bg-accent/10 disabled:opacity-50">
            {busy ? "生成中…" : "导出图片"}
          </button>
          <button onClick={() => { if (confirm("清空阵容？")) { setIds(empty()); setSlot(null); } }}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-slate-400 hover:border-rose-400/60 hover:text-rose-300">
            清空
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
        <div className="space-y-4">
          {UNITS.map((unit, u) => (
            <Section key={unit} title={unit}>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {Array.from({ length: 5 }, (_, n) => u * 5 + n).map((i) => (
                  <Slot key={i} i={i} card={roster[i]} active={slot === i} basis={basis}
                    doc={doc} onPick={() => { setSlot(i); setQ(""); }} onRemove={() => remove(i)} />
                ))}
              </div>
            </Section>
          ))}
        </div>

        <div className="rounded-xl border border-court-600 bg-court-800 p-4">
          {slot == null ? (
            <div className="space-y-2 text-sm text-slate-400">
              <p className="font-semibold text-ink">选一张卡放进阵容</p>
              <p>点击左侧任意空位，然后搜索该位置的球员。每个位置只能放自己位置的卡（PG 不能打中锋）。</p>
              <p className="text-xs text-slate-500">阵容自动保存在本机；点「分享链接」可发给朋友直接还原。</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  选择 {SLOTS[slot].unit} {SLOTS[slot].pos}
                </p>
                <button onClick={() => setSlot(null)} className="text-xs text-slate-500 hover:text-ink">取消</button>
              </div>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={`搜索 ${slotPos} 球员 / 球队 / 系列`}
                className="w-full rounded-lg border border-court-600 bg-court-900 px-3 py-2 text-sm outline-none focus:border-accent" />
              <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
                {results.map((c) => (
                  <button key={c.id} onClick={() => put(c.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-court-600 hover:bg-court-700/60">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={withBase(c.image)} alt="" loading="lazy"
                        className="h-12 w-9 shrink-0 rounded object-cover object-top" />
                    ) : <div className="h-12 w-9 shrink-0 rounded bg-court-700" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{c.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {c.position ?? ""} · {c.team ?? "自由球员"} · {c.theme ?? c.collection ?? ""}
                      </span>
                    </span>
                    <span className="text-sm font-black text-accent">{c.overall ?? "?"}</span>
                  </button>
                ))}
                {!results.length && <p className="py-6 text-center text-xs text-slate-500">没有匹配的 {slotPos} 卡片</p>}
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

function Slot({ i, card, active, basis, doc, onPick, onRemove }: {
  i: number; card: IndexCard | null; active: boolean; basis: Basis;
  doc: ReturnType<typeof usePrices>["doc"];
  onPick: () => void; onRemove: () => void;
}) {
  const price = card ? priceOf(card.id, doc, basis) : null;
  return (
    <div className={`group relative overflow-hidden rounded-lg border bg-court-900/60 transition ${active ? "border-accent" : "border-court-600"}`}>
      <button onClick={onPick} className="block w-full text-left">
        <span className="relative block h-24 w-full overflow-hidden bg-court-800 sm:h-28">
          {card?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withBase(card.image)} alt={card.name} loading="lazy"
              className="h-full w-full object-cover object-top" />
          ) : (
            <span className="grid h-full w-full place-items-center text-xl text-slate-600 group-hover:text-accent">
              {card ? "" : "+"}
            </span>
          )}
          <span className="absolute left-1 top-1 rounded bg-court-900/80 px-1 text-[10px] font-bold text-slate-300">
            {SLOTS[i].pos}
          </span>
          {card && (
            <span className="absolute right-1 top-1 rounded bg-court-900/85 px-1 text-[11px] font-black text-accent">
              {card.overall ?? "?"}
            </span>
          )}
        </span>
        <span className="block px-1.5 py-1">
          <span className="block truncate text-[11px] font-semibold text-ink">
            {card ? card.name : <span className="text-slate-500">空位</span>}
          </span>
          <span className="block truncate text-[10px] font-mono text-gain">{price != null ? fmtMt(price) : "—"}</span>
        </span>
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
