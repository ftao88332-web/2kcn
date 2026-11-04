import { ATTR_GROUPS, attrCn } from "@/lib/i18n";

/** 分组属性条：值色带（≥97 紫 / ≥92 绿 / ≥85 黄绿 / ≥75 灰 / <75 暗红） */
function barColor(v: number): string {
  if (v >= 97) return "bg-purple-400";
  if (v >= 92) return "bg-emerald-400";
  if (v >= 85) return "bg-lime-400";
  if (v >= 75) return "bg-yellow-500/80";
  return "bg-rose-500/70";
}

export default function AttrsGroups({ attrs }: { attrs: Record<string, unknown> | null | undefined }) {
  if (!attrs || !Object.keys(attrs).length) {
    return <p className="text-sm text-slate-500">属性数据暂缺。</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ATTR_GROUPS.map((g) => {
        const rows = g.keys.filter((k) => attrs[k] != null);
        if (!rows.length) return null;
        return (
          <div key={g.en} className="rounded-xl border border-court-700 bg-court-800 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent/90">
              {g.cn} <span className="text-slate-600">{g.en}</span>
            </p>
            <div className="space-y-2">
              {rows.map((k) => {
                const v = Number(attrs[k]);
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs text-slate-400">{attrCn(k)}</span>
                    <div className="h-2 min-w-0 flex-1 rounded-full bg-court-700">
                      <div className={`h-2 rounded-full ${barColor(v)}`} style={{ width: `${Math.min(100, v)}%` }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-xs font-bold text-slate-100">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
