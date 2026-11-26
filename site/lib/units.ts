/** 统一单位换算与展示格式。库内存储单位：身高/臂展 = cm，体重原始值 = lb（另存 kg）。 */

export const LB_TO_KG = 0.45359237;

export function lbToKg(lb: number | null | undefined): number | null {
  return lb == null ? null : Math.round(lb * LB_TO_KG * 10) / 10;
}

/** 体重：优先用已换算的 kg，缺省时用 lb 换算，绝不把 lb 当 kg 直接显示 */
export function weightText(
  kg: number | null | undefined,
  lb: number | null | undefined,
  opts: { withLb?: boolean } = {}
): string {
  const v = kg ?? lbToKg(lb);
  if (v == null) return "-";
  const base = `${v.toFixed(1)} kg`;
  return opts.withLb && lb != null ? `${base}（${lb} lb）` : base;
}

/** 身高/臂展：库内 cm，展示 m + cm */
export function lengthText(cm: number | null | undefined): string {
  if (cm == null) return "-";
  return `${(cm / 100).toFixed(2)} m（${Math.round(cm)} cm）`;
}

/** 只要 m，用于表格紧凑列 */
export function meterText(cm: number | null | undefined): string {
  return cm == null ? "-" : `${(cm / 100).toFixed(2)} m`;
}

/** 价格：MT 整数带千分位 */
export function mtText(n: number | null | undefined): string {
  return n == null ? "-" : `${Math.round(n).toLocaleString("en-US")} MT`;
}

/** 涨跌幅：正数补 + 号，保留一位小数 */
export function pctText(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "-";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
