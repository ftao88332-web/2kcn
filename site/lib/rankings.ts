/** 我的球员排名（My Rankings）——纯本地存储，无后端。 */

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
export type Pos = (typeof POSITIONS)[number];

export const POS_CN: Record<Pos, string> = {
  PG: "控球后卫",
  SG: "得分后卫",
  SF: "小前锋",
  PF: "大前锋",
  C: "中锋",
};

export type RankItem = {
  card_id: number;
  note: string;
};

export type Scheme = {
  id: string;
  name: string;
  description: string;
  positions: Record<Pos, RankItem[]>;
  locked: Record<Pos, boolean>;
  created_at: string;
  updated_at: string;
};

export type RankingsDoc = {
  version: 1;
  active_id: string;
  schemes: Scheme[];
};

const STORE = "rankings_v1";

export const emptyPositions = (): Record<Pos, RankItem[]> => ({
  PG: [], SG: [], SF: [], PF: [], C: [],
});

export const emptyLocked = (): Record<Pos, boolean> => ({
  PG: false, SG: false, SF: false, PF: false, C: false,
});

const now = () => new Date().toISOString();

export function newScheme(name: string, description = ""): Scheme {
  return {
    id: `rk_${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    positions: emptyPositions(),
    locked: emptyLocked(),
    created_at: now(),
    updated_at: now(),
  };
}

export function defaultDoc(): RankingsDoc {
  const first = newScheme("综合实力排名", "所有模式下的综合表现");
  return { version: 1, active_id: first.id, schemes: [first] };
}

export function readDoc(): RankingsDoc {
  if (typeof window === "undefined") return defaultDoc();
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!raw || !Array.isArray(raw.schemes) || raw.schemes.length === 0) return defaultDoc();
    // 容忍旧/残缺数据：补齐五个位置与锁定字段
    const schemes: Scheme[] = raw.schemes.map((s: Partial<Scheme>) => ({
      id: String(s.id ?? `rk_${Math.random().toString(36).slice(2, 9)}`),
      name: String(s.name ?? "未命名方案"),
      description: String(s.description ?? ""),
      positions: { ...emptyPositions(), ...(s.positions ?? {}) },
      locked: { ...emptyLocked(), ...(s.locked ?? {}) },
      created_at: String(s.created_at ?? now()),
      updated_at: String(s.updated_at ?? now()),
    }));
    const active = schemes.some((s) => s.id === raw.active_id) ? raw.active_id : schemes[0].id;
    return { version: 1, active_id: active, schemes };
  } catch {
    return defaultDoc();
  }
}

export function writeDoc(doc: RankingsDoc) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE, JSON.stringify(doc));
  } catch {
    /* 配额或隐私模式：静默失败，界面仍可使用 */
  }
}

/** 分享用纯文本：不含任何用户身份信息，仅榜单结构与备注。 */
export function schemeToText(scheme: Scheme, nameOf: (id: number) => string, ovrOf: (id: number) => string) {
  const head = [`2K Card Lab · 我的球员排名`, `${scheme.name}${scheme.description ? `（${scheme.description}）` : ""}`, `更新：${scheme.updated_at.slice(0, 10)}`, ""];
  const body = POSITIONS.filter((p) => scheme.positions[p].length > 0).map((p) => {
    const lines = scheme.positions[p].map((it, i) => {
      const note = it.note.trim() ? ` — ${it.note.trim()}` : "";
      return `${i + 1}. ${nameOf(it.card_id)} (${ovrOf(it.card_id)})${note}`;
    });
    return [`${p} · ${POS_CN[p]}`, ...lines, ""].join("\n");
  });
  return [...head, ...body].join("\n").trim();
}
