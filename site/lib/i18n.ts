/** 属性/徽章中文词表（与 scraper/fields.py 对应，缺漏回退英文）。 */

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

export const BADGE_CN: Record<string, string> = {
  acrobat: "杂技上篮", aerial_wizard: "空中魔术师", backdown_punisher: "背身惩罚者",
  bully: "强拳击打", consistent_finisher: "稳定终结", contact_finisher: "对抗终结",
  cross_key_scorer: "临界得分", deep_hooks: "深位勾手", dream_shake: "梦幻舞步",
  dropstepper: "欧洲步", fancy_footwork: "花式脚步", fearless_finisher: "无畏终结",
  float_game: "抛投大师", flyer: "飞行者", giant_slayer: "巨人杀手",
  layup_mixmaster: "上篮混音", paint_prodigy: "油漆区天赋", physical_finisher: "身体终结",
  precision_dunker: "精准扣将", relentless_finisher: "不懈终结", rim_wrecker: "篮筐破坏者",
  rise_up: "拔地而起", posterizer: "隔扣海报", poster: "隔扣",
  quick_chain: "快速连招", hook_specialist: "勾手专家", post_powerhouse: "背身霸王",
  slippery: "滑不留手", bigdriver: "大个突破", hyperdrive: "极速驱动",
  athletic_finisher: "运动终结", deadeye: "神射手", limitless_range: "无限射程",
  catch_and_shoot: "接球投篮", set_shots_specialist: "定投专家", shifty_shooter: "晃投",
  slippery_off_ball: "无球摆脱", post_fade_phenom: "背身后仰大师", minimarksman: "迷你神枪",
  agent_3: "特工三号", specialist: "专家", blink: "眨眼出手", twilight_zone: "暮区",
  subzero: "绝对零度", brick_wall: "人墙", corner_specialist: "底角专家",
  pace_breaker: "节奏破坏", range_extension: "射程延伸", midrange_deadeye: "中投死眼",
  proficient_shooter: "熟练射手", quick_draw: "速射", ankle_assassin: "脚踝刺客",
  dimer: "助攻手", handles_for_days: "运球永动机", strong_handle: "控球铁腕",
  unpluckable: "不易被掏", versatile_visionary: "全能视野", bail_out: "救球",
  break_starter: "快攻发起者", floor_general: "场上指挥官", glue_hands: "胶水手",
  killer_combos: "致命连技", lob_city_passer: "空接派手", needle_threader: "穿针引线",
  pass_fake_maestro: "假传大师", post_playmaker: "背身组织", special_delivery: "精准递球",
  stop_and_go: "启停步", tight_handles: "紧持球", triple_threat_juke: "三威胁假动作",
  vice_grip: "铁钳手", relay_passer: "中继传球", light_launcher: "轻启步",
  anchor: "定海神针", ankle_braces: "护踝", ball_stripper: "掏球手",
  boxout_beast: "挡人兽", challenger: "挑战者", chase_down_artist: "追帽艺术家",
  clamps: "手掌锁", defensive_leader: "防守领袖", glove: "手套",
  heart_crusher: "斗志粉碎", hustler: "拼命三郎", interceptor: "拦截者",
  intimidator: "恐吓者", lightning_reflexes: "闪电反应", menace: "无球威胁",
  moving_truck: "推土机", off_ball_pest: "无球纠缠", pick_dodger: "绕挡专家",
  pick_pocket: "袋鼠手", pogo_stick: "弹簧腿", post_lockdown: "背身锁死",
  post_move_lockdown: "背身动作锁死", rebound_chaser: "篮板猎人", rim_protector: "护筐者",
  tireless_defender: "不知疲倦", trapper: "设陷者", work_horse: "劳模", worm: "蠕虫",
  alpha_dog: "天之骄子", enforcer: "执行者", extremely_confident: "极度自信",
  expressive: "表现欲", high_work_ethic: "高职业素养", legendary_work_ethic: "传奇素养",
  pat_my_back: "自我激励", unpredictable: "不可预测", reserved: "低调",
  friendly: "亲和", team_player: "团队至上", keep_it_real: "率真",
  laid_back: "淡定", media_ringmaster: "媒体操盘手", work_ethic: "职业道德",
  blow_by: "一步过", bulldozer: "推土机", fast_feet: "快手快脚",
  open_looks: "空位嗅觉", free_points: "免费点数",
  arc_cadence: "节奏弧线", boxout_boss: "卡位大师", breaker: "突破手",
  bruiser: "重锤", crasher: "冲板狂人", finance_savvy: "理财头脑",
  flash: "闪光快攻", ghost_stepper: "幽灵踏步", high_flying_denier: "飞天封盖",
  immovable_enforcer: "不动铁闸", lightning_launch: "闪电启动", mini_marksman: "微型神射手",
  pace: "节奏掌控", paint_patroller: "油漆区守卫", possession_closer: "球权终结者",
  post_spin_catalyst: "背身转身催化剂", quick_trigger: "快速出手", seatbelt: "安全带护球",
  set_and_fire: "定点开火", smooth_operator: "圆滑操盘手", static_middy: "定点中投",
  sync_snatcher: "协同抢断", wall_up: "贴墙防守", warm_weather_fan: "热情主场",
};

export const TIER_CN: Record<number, string> = { 1: "铜", 2: "银", 3: "金", 4: "青铜", 5: "绿宝石", 6: "翡翠", 7: "蓝宝石", 9: "红宝石", 10: "紫水晶", 11: "钻石", 12: "粉钻", 13: "银河", 14: "暗物质", 15: "GOAT", 21: "GOAT+" };

/** tier → 稀有度色（近似 2kdb） */
export const TIER_COLOR: Record<number, string> = {
  4: "#CD7F32", 5: "#3FB950", 6: "#16C784", 7: "#4A90E2", 9: "#E5484D",
  10: "#A371F7", 11: "#7DD3FC", 12: "#F472B6", 13: "#B762FF", 14: "#8B5CF6",
  15: "#F59E0B", 21: "#FACC15",
};

export function attrCn(k: string): string {
  return ATTR_CN[k] ?? k.replace(/_/g, " ");
}
export function badgeCn(slug: string): { name: string; zh: boolean } {
  const cn = BADGE_CN[slug];
  if (cn) return { name: cn, zh: true };
  return { name: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), zh: false };
}

/** OVR → 稀有度色（近似 2kdb） */
export function rarity(ovr: number | null | undefined): { text: string; border: string } {
  const o = ovr ?? 0;
  if (o >= 99) return { text: "text-fuchsia-300", border: "border-fuchsia-500/60" };
  if (o >= 97) return { text: "text-pink-300", border: "border-pink-500/60" };
  if (o >= 95) return { text: "text-cyan-300", border: "border-cyan-400/60" };
  if (o >= 93) return { text: "text-purple-300", border: "border-purple-400/60" };
  if (o >= 91) return { text: "text-rose-300", border: "border-rose-400/60" };
  if (o >= 89) return { text: "text-blue-300", border: "border-blue-400/60" };
  if (o >= 87) return { text: "text-emerald-300", border: "border-emerald-400/60" };
  if (o >= 84) return { text: "text-yellow-300", border: "border-yellow-400/70" };
  if (o >= 80) return { text: "text-slate-200", border: "border-slate-400/60" };
  return { text: "text-orange-300", border: "border-orange-400/60" };
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
