/** GitHub Pages 项目站点在 /仓库名 子路径下；构建注入 NEXT_PUBLIC_BASE_PATH。 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBase(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path; // 外链（R2 图床）不拼
  return `${BASE}${path}`;
}
