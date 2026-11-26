"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cards from "@/data/cards_index.json";
import type { IndexCard } from "@/lib/core";
import CardPicker from "@/components/card-picker";
import { TIER_CN, TIER_COLOR } from "@/lib/i18n";
import {
  POSITIONS, POS_CN, type Pos, type RankItem, type RankingsDoc,
  readDoc, writeDoc, newScheme, emptyPositions, schemeToText,
} from "@/lib/rankings";

const ALL = cards as unknown as IndexCard[];
const BY_ID = new Map<number, IndexCard>(ALL.map((c) => [c.id, c]));

export default function RankingsPage() {
  const [doc, setDoc] = useState<RankingsDoc | null>(null);
  const [pos, setPos] = useState<Pos>("PG");
  const [picker, setPicker] = useState(false);
  const [schemeDialog, setSchemeDialog] = useState<{ mode: "new" | "rename" | "copy"; value: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<{ pos: Pos; items: RankItem[] }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // localStorage 只能在挂载后读，避免静态导出的 hydration 差异
  useEffect(() => { setDoc(readDoc()); }, []);

  const scheme = useMemo(
    () => doc?.schemes.find((s) => s.id === doc.active_id) ?? doc?.schemes[0] ?? null,
    [doc]
  );
  const items = scheme ? scheme.positions[pos] : [];
  const locked = scheme ? scheme.locked[pos] : false;

  const commit = (next: RankingsDoc) => { setDoc(next); writeDoc(next); };

  const patchScheme = (mut: (s: NonNullable<typeof scheme>) => NonNullable<typeof scheme>) => {
    if (!doc || !scheme) return;
    const updated = mut({ ...scheme, updated_at: new Date().toISOString() });
    commit({ ...doc, schemes: doc.schemes.map((s) => (s.id === updated.id ? updated : s)) });
  };

  /** 任何位置内容变更都先进撤销栈，再落盘。 */
  const changePos = (p: Pos, next: RankItem[]) => {
    if (!scheme) return;
    setUndoStack((s) => [...s.slice(-9), { pos: p, items: scheme.positions[p] }]);
    patchScheme((s) => ({ ...s, positions: { ...s.positions, [p]: next } }));
  };

  const undo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last || !scheme) return;
    setUndoStack((s) => s.slice(0, -1));
    setPos(last.pos);
    patchScheme((s) => ({ ...s, positions: { ...s.positions, [last.pos]: last.items } }));
  };

  const addCard = (id: number) => {
    if (items.some((it) => it.card_id === id)) return;
    changePos(pos, [...items, { card_id: id, note: "" }]);
    setPicker(false);
  };

  const removeAt = (i: number) => changePos(pos, items.filter((_, k) => k !== i));

  const setNote = (i: number, note: string) => {
    const next = items.map((it, k) => (k === i ? { ...it, note } : it));
    // 备注单独走不压栈的写入，避免每敲一个字都生成一步撤销
    patchScheme((s) => ({ ...s, positions: { ...s.positions, [pos]: next } }));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    changePos(pos, next);
  };

  const toggleLock = () => {
    patchScheme((s) => ({ ...s, locked: { ...s.locked, [pos]: !s.locked[pos] } }));
  };

  const createScheme = (mode: "new" | "rename" | "copy", value: string) => {
    if (!doc || !scheme) return;
    const name = value.trim() || "未命名方案";
    if (mode === "rename") {
      patchScheme((s) => ({ ...s, name }));
    } else {
      const base = mode === "copy" ? { ...scheme, name: `${scheme.name} 副本` } : null;
      const fresh = base
        ? { ...base, id: `rk_${Math.random().toString(36).slice(2, 9)}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : newScheme(name);
      if (base) fresh.name = name;
      commit({ ...doc, active_id: fresh.id, schemes: [...doc.schemes, fresh] });
      setPos("PG");
    }
    setUndoStack([]);
    setSchemeDialog(null);
  };

  const deleteScheme = () => {
    if (!doc || !scheme) return;
    if (!window.confirm(`删除方案「${scheme.name}」？该方案下五个位置的排名都会消失。`)) return;
    const rest = doc.schemes.filter((s) => s.id !== scheme.id);
    const list = rest.length ? rest : [newScheme("综合实力排名", "所有模式下的综合表现")];
    commit({ ...doc, active_id: list[0].id, schemes: list });
    setUndoStack([]);
  };

  const exportJson = () => {
    if (!scheme) return;
    const blob = new Blob([JSON.stringify(scheme, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${scheme.name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const s = raw.scheme ?? raw;
        if (!s || !s.positions) throw new Error("bad");
        const imported = {
          id: `rk_${Math.random().toString(36).slice(2, 9)}`,
          name: String(s.name ?? "导入的排名"),
          description: String(s.description ?? ""),
          positions: { ...emptyPositions(), ...s.positions },
          locked: { PG: false, SG: false, SF: false, PF: false, C: false },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (!doc) return;
        commit({ ...doc, active_id: imported.id, schemes: [...doc.schemes, imported] });
        setUndoStack([]);
      } catch {
        window.alert("这个文件不是 2K Card Lab 导出的排名文件。");
      }
    };
    reader.readAsText(file);
  };

  const copyShare = async () => {
    if (!scheme) return;
    const text = schemeToText(
      scheme,
      (id) => BY_ID.get(id)?.name ?? `#${id}`,
      (id) => `${BY_ID.get(id)?.overall ?? "-"} OVR`,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("复制下面的排名文本：", text);
    }
  };

  if (!doc || !scheme) {
    return <div className="py-20 text-center text-sm text-slate-500">正在读取本地排名…</div>;
  }

  const names = new Set(items.map((it) => it.card_id));

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-court-600 bg-court-800 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent">MY RANKINGS</p>
        <h1 className="mt-2 text-2xl font-black text-white">我的球员排名 <span className="ml-2 text-xs font-medium tracking-widest text-slate-500">NBA 2K27 · MYTEAM PLAYER RANKINGS</span></h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          官方给数据，顺序由你定。五个位置各自独立排名，可以任意把 95 分的卡排在 99 分前面。
          排名按<strong className="text-slate-300">具体球员卡</strong>记录（同一名球员的不同版本分别排名），数据只存在这台设备的浏览器里。
        </p>
      </header>

      {/* 方案 */}
      <section className="rounded-2xl border border-court-600 bg-court-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted">我的排名方案</span>
          {doc.schemes.map((s) => {
            const total = POSITIONS.reduce((n, p) => n + s.positions[p].length, 0);
            const active = s.id === doc.active_id;
            return (
              <button key={s.id} onClick={() => { commit({ ...doc, active_id: s.id }); setUndoStack([]); setPos("PG"); }}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${active ? "border-accent bg-accent/10 text-accent" : "border-court-600 text-slate-300 hover:border-accent/50"}`}>
                {s.name} <span className="ml-1 text-[10px] text-slate-500">{total}</span>
              </button>
            );
          })}
          <button onClick={() => setSchemeDialog({ mode: "new", value: "" })}
            className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-slate-400 hover:border-accent/50 hover:text-white">+ 新建方案</button>
        </div>
        {scheme.description && <p className="mt-2 text-[11px] text-slate-500">{scheme.description} · 更新于 {scheme.updated_at.slice(0, 16).replace("T", " ")}</p>}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-court-600 pt-3">
          <button onClick={() => setSchemeDialog({ mode: "rename", value: scheme.name })}
            className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">重命名</button>
          <button onClick={() => setSchemeDialog({ mode: "copy", value: `${scheme.name} 副本` })}
            className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">复制方案</button>
          <button onClick={copyShare} className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">
            {copied ? "已复制 ✓" : "复制分享文本"}
          </button>
          <button onClick={exportJson} className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">导出 JSON</button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">导入 JSON</button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          <button onClick={deleteScheme} className="rounded-lg border border-court-600 px-2.5 py-1 text-[11px] text-rose-400/80 hover:text-rose-300">删除方案</button>
        </div>
      </section>

      {/* 位置 */}
      <section className="rounded-2xl border border-court-600 bg-court-800 p-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-court-600 pb-3">
          <span className="text-[11px] text-muted">我的榜单</span>
          {POSITIONS.map((p) => (
            <button key={p} onClick={() => { setPos(p); setUndoStack([]); }}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${pos === p ? "border-accent bg-accent/10 text-accent" : "border-court-600 text-slate-300 hover:border-accent/50"}`}>
              {p} <span className="ml-1 text-[10px] text-slate-500">{scheme.positions[p].length}</span>
              {scheme.locked[p] && <span className="ml-1">🔒</span>}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500">{POS_CN[pos]} · 共 {items.length} 名球员</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setPicker(true)} disabled={locked}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-[#08121c] disabled:cursor-not-allowed disabled:opacity-40">
            添加球员卡
          </button>
          <button onClick={undo} disabled={undoStack.length === 0}
            className="rounded-lg border border-court-600 px-2.5 py-1.5 text-[11px] text-slate-400 disabled:opacity-40 hover:text-white">
            撤销{undoStack.length ? `（${undoStack.length}）` : ""}
          </button>
          <button onClick={toggleLock}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${locked ? "border-warning/60 text-warning" : "border-court-600 text-slate-400 hover:text-white"}`}>
            {locked ? "已锁定 · 点击解锁" : "锁定本位置"}
          </button>
          <span className="text-[11px] text-slate-600">自动保存 · 仅本机浏览器</span>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-court-600 py-12 text-center">
            <p className="text-sm text-slate-400">{POS_CN[pos]} 还没有球员</p>
            <p className="mt-1 text-xs text-slate-600">点「添加球员卡」，从 1358 张卡里挑你认为最强的。</p>
          </div>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {items.map((it, i) => {
              const c = BY_ID.get(it.card_id);
              return (
                <li key={it.card_id}
                  draggable={!locked}
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => { if (dragFrom !== null) e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
                  onDragEnd={() => setDragFrom(null)}
                  className={`flex flex-wrap items-center gap-2 rounded-xl border bg-court-700/40 p-2 ${dragFrom === i ? "border-accent/70 opacity-60" : "border-court-600"}`}>
                  <span className="w-6 shrink-0 text-center font-mono text-sm font-bold text-accent">{i + 1}</span>
                  {!locked && <span className="cursor-grab select-none text-slate-600" title="拖拽排序">⋮⋮</span>}
                  {c?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-12 w-9 shrink-0 rounded object-cover" loading="lazy" />
                  ) : <div className="h-12 w-9 shrink-0 rounded bg-court-900" />}
                  <span className="font-mono text-sm font-bold text-accent">{c?.overall ?? "-"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {c?.name ?? `未知卡片 #${it.card_id}`}
                      {c?.version && <span className="ml-1 text-[11px] text-slate-500">{c.version}</span>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                      {c?.position && <span className="rounded bg-court-900 px-1 py-0.5 text-slate-300">{c.position}</span>}
                      {c?.sec && <span className="max-w-[9rem] truncate">{c.sec}</span>}
                      {c?.tier != null && (
                        <span className="rounded px-1 py-0.5" style={{ color: TIER_COLOR[c.tier] ?? "#94A3B8", background: `${TIER_COLOR[c.tier] ?? "#94A3B8"}1a` }}>
                          {TIER_CN[c.tier] ?? "—"}
                        </span>
                      )}
                      {c && <a href={`/card/${c.id}/`} className="text-accent/80 hover:underline">卡片详情</a>}
                    </p>
                  </div>
                  <input value={it.note} onChange={(e) => setNote(i, e.target.value)} placeholder="写下你的评价（选填）" disabled={locked}
                    className="ml-auto h-8 w-full min-w-[8rem] flex-1 rounded-lg border border-court-600 bg-court-900 px-2 text-[11px] text-ink outline-none focus:border-accent sm:w-auto sm:max-w-xs" />
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => move(i, i - 1)} disabled={locked || i === 0}
                      className="rounded border border-court-600 px-1.5 py-0.5 text-[11px] text-slate-400 disabled:opacity-30 hover:text-white">↑</button>
                    <button onClick={() => move(i, i + 1)} disabled={locked || i === items.length - 1}
                      className="rounded border border-court-600 px-1.5 py-0.5 text-[11px] text-slate-400 disabled:opacity-30 hover:text-white">↓</button>
                    <button onClick={() => removeAt(i)} disabled={locked}
                      className="rounded border border-court-600 px-1.5 py-0.5 text-[11px] text-rose-400/80 disabled:opacity-30 hover:text-rose-300">移除</button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {locked && <p className="mt-3 text-[11px] text-warning">本位置已锁定：添加、删除、排序、备注都不可修改，先解锁再编辑。</p>}
      </section>

      <p className="text-[11px] leading-5 text-slate-600">
        排名是你自己的判断，不是官方数据，也不构成强度结论。榜单只写入本机 localStorage，清除浏览器数据会一起丢失，建议定期导出 JSON 备份。
        社区排名、账号同步、图片导出属于下一阶段（需要后端），V1 不提供。
      </p>

      <CardPicker open={picker} cards={ALL} excludes={names} onPick={addCard} onClose={() => setPicker(false)} />

      {schemeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSchemeDialog(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-court-600 bg-court-800 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ink">
              {schemeDialog.mode === "new" ? "新建排名方案" : schemeDialog.mode === "rename" ? "重命名方案" : "复制方案"}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">方案之间互不覆盖，各自保存五个位置。</p>
            <input autoFocus value={schemeDialog.value} onChange={(e) => setSchemeDialog({ ...schemeDialog, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") createScheme(schemeDialog.mode, schemeDialog.value); }}
              placeholder="如 竞技场实战排名 / 性价比排名"
              className="mt-3 h-9 w-full rounded-lg border border-court-600 bg-court-900 px-2 text-xs text-ink outline-none focus:border-accent" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setSchemeDialog(null)} className="rounded-lg border border-court-600 px-3 py-1.5 text-xs text-slate-400">取消</button>
              <button onClick={() => createScheme(schemeDialog.mode, schemeDialog.value)}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-[#08121c]">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
