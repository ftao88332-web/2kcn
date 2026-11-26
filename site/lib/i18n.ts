/** 属性/徽章中文词表（属性表与 scraper/fields.py 对应；徽章名称统一走 lib/badge-lexicon.ts）。 */
import { badgeName } from "@/lib/badge-lexicon";

export const ATTR_CN: Record<string, string> = {
  shot_close: "近距离投篮", shot_mid: "中距离", shot_3pt: "三分", free_throw: "罚球",
  shot_iq: "投篮智商", offensive_consistency: "进攻稳定性",
  driving_layup: "突破上篮", standing_dunk: "原地扣篮", driving_dunk: "突破扣篮",
  post_control: "背身控制", post_hook: "背身勾手", post_fade: "背身后仰",
  draw_foul: "制造犯规", hands: "接球手感",
  speed_with_ball: "持球速度", ball_handle: "运球", passing_accuracy: "传球准度",
  passing_vision: "传球视野", passing_iq: "传球智商",
  speed: "速度", agility: "敏捷", acceleration: "加速", vertical: "弹跳",
  strength: "力量", stamina: "体力", hustle: "拼抢", lateral_quickness: "横移",
  interior_defense: "内防", perimeter_defense: "外防", help_defense_iq: "协防智商",
  pass_perception: "传球感知", steal: "抢断", block: "盖帽", defensive_consistency: "防守稳定性",
  offensive_rebound: "进攻篮板", defensive_rebound: "防守篮板",
  intangibles: "无形资产", potential: "潜力",
};

export const ATTR_GROUPS: { en: string; cn: string; keys: string[] }[] = [
  { en: "FINISHING", cn: "内线收尾", keys: ["standing_dunk", "driving_dunk", "driving_layup", "post_control", "post_hook", "post_fade", "draw_foul", "hands"] },
  { en: "SHOOTING", cn: "投篮", keys: ["shot_close", "shot_mid", "shot_3pt", "free_throw", "shot_iq", "offensive_consistency"] },
  { en: "PLAYMAKING", cn: "传控", keys: ["speed_with_ball", "ball_handle", "passing_accuracy", "passing_vision", "passing_iq"] },
  { en: "ATHLETICISM", cn: "身体", keys: ["speed", "agility", "acceleration", "vertical", "strength", "stamina", "hustle", "lateral_quickness"] },
  { en: "DEFENSE", cn: "防守", keys: ["interior_defense", "perimeter_defense", "help_defense_iq", "pass_perception", "steal", "block", "defensive_consistency"] },
  { en: "REBOUNDING", cn: "篮板", keys: ["offensive_rebound", "defensive_rebound"] },
  { en: "POTENTIAL", cn: "潜力", keys: ["intangibles", "potential"] },
];

/** 徽章名称统一由词库提供（见 lib/badge-lexicon.ts），这里不再维护第二套译名。
 *  徽章等级（与卡种档位是两套体系）名称也以词库 levels 为准，此处仅做旧代码兼容。 */
export const BADGE_TIER_CN: Record<number, string> = {
  1: "青铜", 2: "白银", 3: "黄金", 4: "名人堂", 5: "传奇",
};

/** 卡种（Gem Tier）：2K27 里 90 分以上每个总评都有独立的宝石档 */
export const TIER_CN: Record<number, string> = {
  4: "金", 5: "翡翠", 6: "蓝宝石", 7: "红宝石",
  9: "紫水晶", 10: "钻石", 11: "粉钻", 12: "银河欧泊",
  13: "暗物质", 14: "像素", 15: "熔岩", 21: "G.O.A.T.",
};
export const TIER_EN: Record<number, string> = {
  4: "Gold", 5: "Emerald", 6: "Sapphire", 7: "Ruby",
  9: "Amethyst", 10: "Diamond", 11: "Pink Diamond", 12: "Galaxy Opal",
  13: "Dark Matter", 14: "Pixel", 15: "Magma", 21: "G.O.A.T.",
};

/** tier → 稀有度色（近似 2kdb 卡面配色） */
export const TIER_COLOR: Record<number, string> = {
  4: "#E3B341", 5: "#2ECC71", 6: "#4A90E2", 7: "#E5484D",
  9: "#A371F7", 10: "#7DD3FC", 11: "#F472B6", 12: "#B762FF",
  13: "#6D28D9", 14: "#22D3EE", 15: "#F97316",
  21: "#FACC15",
};

export function attrCn(k: string): string {
  return ATTR_CN[k] ?? k.replace(/_/g, " ");
}
/** 兼容旧调用：名称走统一徽章词库 */
export function badgeCn(slug: string): { name: string; zh: boolean } {
  const { zh, known } = badgeName(slug);
  return { name: zh, zh: known };
}

/** OVR → 稀有度色（按 2K27 卡种档位对齐） */
export function rarity(ovr: number | null | undefined): { text: string; border: string } {
  const o = ovr ?? 0;
  if (o >= 99) return { text: "text-amber-200", border: "border-amber-300/70" };   // G.O.A.T.
  if (o >= 96) return { text: "text-orange-300", border: "border-orange-400/60" }; // 熔岩
  if (o >= 95) return { text: "text-cyan-300", border: "border-cyan-400/60" };     // 像素
  if (o >= 94) return { text: "text-purple-300", border: "border-purple-500/60" }; // 暗物质
  if (o >= 93) return { text: "text-violet-300", border: "border-violet-400/60" }; // 银河欧泊
  if (o >= 92) return { text: "text-pink-300", border: "border-pink-400/60" };     // 粉钻
  if (o >= 91) return { text: "text-sky-300", border: "border-sky-400/60" };       // 钻石
  if (o >= 90) return { text: "text-fuchsia-300", border: "border-fuchsia-400/60" }; // 紫水晶
  if (o >= 87) return { text: "text-red-300", border: "border-red-400/60" };       // 红宝石
  if (o >= 84) return { text: "text-blue-300", border: "border-blue-400/60" };     // 蓝宝石
  if (o >= 80) return { text: "text-emerald-300", border: "border-emerald-400/60" }; // 翡翠
  return { text: "text-amber-300", border: "border-amber-400/60" };                // 金
}

/* ---------------- 动作包（动画）分组与译名 ---------------- */
export const ANIM_GROUPS: { en: string; cn: string; keys: string[] }[] = [
  { en: "JUMP SHOT", cn: "投篮", keys: ["upper_release_a", "lower_base_a", "hop_jumper_a", "spin_jumper_a", "dribble_pull_up_a", "go_to_shot_a", "release_timing_a"] },
  { en: "LAYUP / FINISH", cn: "上篮终结", keys: ["layup_package_a", "step_through_shot_a", "post_fade_a", "post_hook_a", "post_hop_shot_a", "post_go_to_shot_a", "free_throw_a"] },
  { en: "DRIBBLE STYLE", cn: "运球风格", keys: ["dribble_style_a", "motion_style_a", "signature_size_up_a", "breakdown_combos_a", "crossover_combos_a", "crossover_escape_a", "hesitation_crossover_combo_a", "double_crossover_combo_a"] },
  { en: "DRIBBLE ESCAPE", cn: "摆脱运球", keys: ["behind_the_back_escape_a", "behind_the_back_launch_a", "between_legs_escape_a", "crossover_escape_a", "hesitation_escape_a", "lateral_hesitation_a", "moving_behind_the_back_a", "moving_breakdown_combos_a", "moving_cross_spin_a", "moving_hesitation_a", "moving_spin_a", "moving_stepback_a", "lateral_stepback_a", "stepback_crossover_a"] },
  { en: "TRIPLE THREAT", cn: "三威胁", keys: ["triple_threat_style_a", "triple_threat_breakdown_a", "triple_threat_jab_step_a", "triple_threat_stepover_a", "misdirection_crossover_a", "misdirection_behind_the_back_a", "misdirection_hesitation_a", "in_and_out_a"] },
  { en: "OTHER", cn: "其他", keys: ["pass_style_a", "dunk_emotion_a", "chew_gum_a", "nba_jumpball_ritual_a", "pre_game_1_a", "pre_game_2_a"] },
];

export const ANIM_CN: Record<string, string> = {
  upper_release_a: "上半身出手", lower_base_a: "下半身基础", hop_jumper_a: "跳步跳投",
  spin_jumper_a: "转身跳投", dribble_pull_up_a: "运球急停", go_to_shot_a: "招牌跳投",
  release_timing_a: "出手节奏", layup_package_a: "上篮包", step_through_shot_a: "跨步上篮",
  post_fade_a: "背身后仰", post_hook_a: "背身勾手", post_hop_shot_a: "背身跳步",
  post_go_to_shot_a: "背身招牌", free_throw_a: "罚球包", dribble_style_a: "运球风格",
  motion_style_a: "移动风格", signature_size_up_a: "招牌试探步", breakdown_combos_a: "组合突破",
  crossover_combos_a: "交叉组合", crossover_escape_a: "交叉摆脱", hesitation_crossover_combo_a: "犹豫交叉",
  double_crossover_combo_a: "双交叉", behind_the_back_escape_a: "背后摆脱", behind_the_back_launch_a: "背后启动",
  between_legs_escape_a: "胯下摆脱", hesitation_escape_a: "犹豫摆脱", lateral_hesitation_a: "横移犹豫",
  moving_behind_the_back_a: "行进背后", moving_breakdown_combos_a: "行进突破组合", moving_cross_spin_a: "行进交叉转身",
  moving_hesitation_a: "行进犹豫", moving_spin_a: "行进转身", moving_stepback_a: "行进后撤",
  lateral_stepback_a: "横移后撤", stepback_crossover_a: "后撤交叉", triple_threat_style_a: "三威胁风格",
  triple_threat_breakdown_a: "三威胁突破", triple_threat_jab_step_a: "三威胁试探步", triple_threat_stepover_a: "三威胁跨步",
  misdirection_crossover_a: "误导交叉", misdirection_behind_the_back_a: "误导背后", misdirection_hesitation_a: "误导犹豫",
  in_and_out_a: "内外运球", pass_style_a: "传球风格", dunk_emotion_a: "扣篮动作",
  chew_gum_a: "嚼口香糖", nba_jumpball_ritual_a: "跳球仪式", pre_game_1_a: "赛前动作 1", pre_game_2_a: "赛前动作 2",
};

export function animCn(k: string): string {
  return ANIM_CN[k] ?? k.replace(/_a$/, "").replace(/_/g, " ");
}
