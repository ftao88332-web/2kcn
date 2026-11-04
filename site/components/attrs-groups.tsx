import { ATTR_GROUPS, attrCn } from "@/lib/i18n";

/** 数值条配色：数值越高越接近主色（不抢眼，只表意） */
function barColor(v: number): string {
  if (v >= 95) return "bg-accent";
  if (v >= 90) return "bg-accent/70";
  if (v >= 80) return "bg-accent/40";
  if (v >= 70) return "bg-muted/40";
  return "bg-muted/20";
}

/** 高数值文字：95+ 主色加粗，90+ 主色 */
function numColor(v: number): string {
  if (v >= 95) return "text-accent font-bold";
  if (v >= 90) return "text-accent";
  return "text-ink/90";
}

export default function AttrsGroups({ attrs }: { attrs: Record<string, unknown> | null | undefined }) {
  if (!attrs || !Object.keys(attrs).length) {
    return <p className="text-sm text-muted">属性数据暂缺。</p>;
  }
  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
      {ATTR_GROUPS.map((g) => {
        const rows = g.keys.filter((k) => attrs[k] != null);
        if (!rows.length) return null;
        return (
          <div key={g.en}>
            <p className="mb-2.5 border-b border-court-600 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
              {g.cn} <span className="opacity-60">{g.en}</span>
            </p>
            <div className="space-y-2.5">
              {rows.map((k) => {
                const v = Number(attrs[k]);
                return (
                  <div key={k} className="flex items-center gap-2.5">
                    <span className="w-20 shrink-0 text-xs text-muted">{attrCn(k)}</span>
                    <div className="h-1.5 min-w-0 flex-1 rounded-full bg-court-700">
                      <div className={`h-1.5 rounded-full ${barColor(v)}`} style={{ width: `${Math.min(100, v)}%` }} />
                    </div>
                    <span className={`w-7 shrink-0 text-right text-xs ${numColor(v)}`}>{v}</span>
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
