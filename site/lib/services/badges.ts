/** 徽章服务层：词库（名称/分类/等级）+ 拥有数据（反向索引）。
 *  详情页、卡库筛选、比较器、徽章库统一从这里取，不允许各页自建词表。 */
import badgeIndex from "@/data/badge_index.json";

export * from "@/lib/badge-lexicon";
import { BADGE_BY_ID, BADGES, type BadgeDef } from "@/lib/badge-lexicon";

type HolderEntry = { n: number; t: Record<string, number>; cards: number[] };
const HOLDERS = badgeIndex as unknown as Record<string, HolderEntry>;

export function holdersOf(id: string): number[] {
  return HOLDERS[id]?.cards ?? [];
}

export function holderCount(id: string): number {
  return HOLDERS[id]?.n ?? 0;
}

export function tierCounts(id: string): Record<string, number> {
  return HOLDERS[id]?.t ?? {};
}

/** 词库里存在但库中无任何卡片拥有的徽章（数据质量检查用） */
export function orphanBadges(): BadgeDef[] {
  return BADGES.filter((b) => holderCount(b.badge_id) === 0);
}

/** 库里出现但词库未收录的徽章 id（检测未翻译/无效徽章） */
export function unknownBadgeIds(): string[] {
  return Object.keys(HOLDERS).filter((id) => !BADGE_BY_ID.has(id));
}
