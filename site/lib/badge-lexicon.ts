/** 徽章词库（只含名称/分类/等级，不引拥有数据，供详情页与卡库轻量使用）。 */
import lexicon from "@/lib/data/badges.2k27.json";

export interface BadgeDef {
  badge_id: string;
  name_en: string;
  name_zh_cn: string;
  aliases: string[];
  category: string;
  description_zh_cn: string;
  translation_source: string;
  translation_locale: string;
  translation_status: string;
}

export interface BadgeCategory {
  id: string;
  name_en: string;
  name_zh: string;
  count: number;
}

export interface BadgeLevel {
  id: string;
  tier: number;
  name_en: string;
  name_zh: string;
  color: string;
  note?: string;
}

export const BADGE_LEXICON = lexicon;
export const BADGES: BadgeDef[] = lexicon.badges as BadgeDef[];
export const CATEGORIES: BadgeCategory[] = lexicon.categories as BadgeCategory[];
export const LEVELS: BadgeLevel[] = lexicon.levels as BadgeLevel[];
export const LEXICON_META = lexicon.meta;

export const BADGE_BY_ID = new Map<string, BadgeDef>(BADGES.map((b) => [b.badge_id, b]));
const LEVEL_BY_TIER = new Map<number, BadgeLevel>(LEVELS.map((l) => [l.tier, l]));

export function badgeOf(id: string): BadgeDef | undefined {
  return BADGE_BY_ID.get(id);
}

/** 徽章展示名：词库内用正式中文名，词库外回退英文，绝不再混用旧译作为主名 */
export function badgeName(id: string): { zh: string; en: string; known: boolean } {
  const def = BADGE_BY_ID.get(id);
  if (def) return { zh: def.name_zh_cn, en: def.name_en, known: true };
  return {
    zh: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    en: id.replace(/_/g, " "),
    known: false,
  };
}

export function levelOf(tier: number | null | undefined): BadgeLevel | undefined {
  return tier == null ? undefined : LEVEL_BY_TIER.get(tier);
}

export function levelName(tier: number | null | undefined): string {
  return levelOf(tier)?.name_zh ?? "-";
}

export function categoryOf(id: string): BadgeCategory | undefined {
  const def = BADGE_BY_ID.get(id);
  return def ? CATEGORIES.find((c) => c.id === def.category) : undefined;
}

/** 中文名 / 英文名 / 原 slug / 旧译别名 搜索 */
export function searchBadges(q: string, list: BadgeDef[] = BADGES): BadgeDef[] {
  const k = q.trim().toLowerCase();
  if (!k) return list;
  return list.filter((b) =>
    [b.name_zh_cn, b.name_en, b.badge_id, ...b.aliases].some((v) => v.toLowerCase().includes(k))
  );
}

export function badgesByCategory(category: string | null, list: BadgeDef[] = BADGES): BadgeDef[] {
  if (!category) return list;
  return list.filter((b) => b.category === category);
}
