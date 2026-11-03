/** 总评 → 色带（近似 2kdb 的稀有度观感，MVP 版） */
export function ovrColor(ovr: number | null): string {
  if (ovr == null) return "text-slate-400";
  if (ovr >= 99) return "text-fuchsia-400";
  if (ovr >= 97) return "text-amber-300";
  if (ovr >= 95) return "text-yellow-300";
  if (ovr >= 90) return "text-emerald-400";
  if (ovr >= 85) return "text-sky-400";
  if (ovr >= 80) return "text-lime-400";
  return "text-slate-300";
}
