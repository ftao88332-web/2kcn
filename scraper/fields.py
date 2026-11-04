"""2K 数据的词表与分桶规则（2K24~27 通用骨架）。

页面 flight 对象是扁平的，物理结构按顺序：
  身份字段 → 属性(约44个) → 汇总统计 → 倾向(*_t) → 动画(*_a，值为字符串) →
  徽章(值 0~4/None) → 个徽章(人格徽章) → total_* 计数器 → 速度区(hz_*) → 市场字段
分桶按"键名后缀 + 键表 + 值域"三重启发，不依赖页面渲染。
"""
from typing import Any

# ------------------------------------------------------------ 属性组（顺序即展示顺序）
ATTR_GROUPS: list[tuple[str, str, list[str]]] = [
    ("SHOOTING", "投篮", ["shot_close", "shot_mid", "shot_3pt", "free_throw", "shot_iq", "offensive_consistency"]),
    ("INSIDE SCORING", "内线终结", ["driving_layup", "standing_dunk", "driving_dunk", "post_control", "post_hook", "post_fade", "draw_foul", "hands"]),
    ("PLAYMAKING", "传控", ["speed_with_ball", "ball_handle", "passing_accuracy", "passing_vision", "passing_iq"]),
    ("ATHLETICISM", "运动", ["speed", "agility", "acceleration", "vertical", "strength", "stamina", "hustle", "lateral_quickness"]),
    ("DEFENSE", "防守", ["interior_defense", "perimeter_defense", "help_defense_iq", "pass_perception", "steal", "block", "defensive_consistency"]),
    ("REBOUND", "篮板", ["offensive_rebound", "defensive_rebound"]),
    ("POTENTIAL", "潜力", ["intangibles", "potential"]),
]
ATTR_KEYS: set[str] = {k for _en, _cn, ks in ATTR_GROUPS for k in ks}

ATTR_CN: dict[str, str] = {
    "shot_close": "近距离投篮", "shot_mid": "中距离", "shot_3pt": "三分", "free_throw": "罚球",
    "shot_iq": "投篮智商", "offensive_consistency": "进攻稳定性",
    "driving_layup": "突破上篮", "standing_dunk": "原地扣篮", "driving_dunk": "突破扣篮",
    "post_control": "背身控制", "post_hook": "背身勾手", "post_fade": "背身后仰",
    "draw_foul": "制造犯规", "hands": "接球手感",
    "speed_with_ball": "持球速度", "ball_handle": "运球", "passing_accuracy": "传球准度",
    "passing_vision": "传球视野", "passing_iq": "传球智商",
    "speed": "速度", "agility": "敏捷", "acceleration": "加速", "vertical": "弹跳",
    "strength": "力量", "stamina": "体力", "hustle": "拼抢", "lateral_quickness": "横移",
    "interior_defense": "内防", "perimeter_defense": "外防", "help_defense_iq": "协防智商",
    "pass_perception": "传球感知", "steal": "抢断", "block": "盖帽", "defensive_consistency": "防守稳定性",
    "offensive_rebound": "进攻篮板", "defensive_rebound": "防守篮板",
    "intangibles": "无形资产", "potential": "潜力",
}

# ------------------------------------------------------------ 通用徽章中文（2K25~27 常用名；缺漏回退英文美化）
BADGE_CN: dict[str, str] = {
    # 终结
    "acrobat": "杂技上篮", "aerial_wizard": "空中魔术师", "backdown_punisher": "背身惩罚者",
    "bully": "欺压", "consistent_finisher": "稳定终结", "contact_finisher": "对抗终结",
    "cross_key_scorer": "临界得分", "deep_hooks": "深位勾手", "dream_shake": "梦幻舞步",
    "dropstepper": "欧洲步", "fancy_footwork": "花式脚步", "fearless_finisher": "无畏终结",
    "float_game": "抛投大师", "flyer": "飞行者", "giant_slayer": "巨人杀手",
    "layup_mixmaster": "上篮混音", "paint_prodigy": "油漆区天赋", "physical_finisher": "身体终结",
    "precision_dunker": "精准扣将", "relentless_finisher": "不懈终结", "rim_wrecker": "篮筐破坏者",
    "rise_up": "拔地而起", "posterizer": "隔扣海报", "poster": "隔扣", "bell_tower": "钟楼",
    "quick_chain": "快速串联", "hook_specialist": "勾手专家", "post_powerhouse": "背身霸王",
    "slippery": "滑不留手", "bigdriver": "大个突破", "hyperdrive": "超光速",
    "athletic_finisher": "运动终结", "driver": "突破者", "bull_dozing": "碾压",
    # 投篮
    "deadeye": "神射手", "limitless_range": "无限射程", "catch_and_shoot": "接球投篮",
    "set_shots_specialist": "定投专家", "shifty_shooter": "晃投", "slippery_off_ball": "无球摆脱",
    "post_fade_phenom": "背身后仰大师", "minimarksman": "迷你神枪", "agent_3": "Agent 3",
    "specialist": "专家", "blink": "眨眼出手", "twilight_zone": "禁区边缘",
    "subzero": "绝对零度", "check_swatch": "必进表现", "brick_wall": "挡拆墙",
    "corner_specialist": "底角专家", "pace_breaker": "节奏破坏", "range_extension": "射程延伸",
    "spot_up": "定点射手", "interior_shot": "内线投篮", "midrange_deadeye": "中投死眼",
    "proficient_shooter": "熟练射手", "quick_draw": "速射", "off_ball_pincedoter": "无球",
    # 传控
    "ankle_assassin": "脚踝刺客", "dimer": "助攻手", "handles_for_days": "运球永动机",
    "lightning_launch": "闪电梯助", "strong_handle": "控球铁腕", "unpluckable": "不易被掏",
    "versatile_visionary": "全能视野", "bail_out": "救球", "break_starter": "快攻发起",
    "floor_general": "场上指挥官", "glue_hands": "胶水手", "hyperdrive": "超速驱动",
    "killer_combos": "致命连技", "lob_city_finder": "空接连线", "needle_threader": "穿针引线",
    "pass_fake_maestro": "假传大师", "post_playmaker": "背身组织", "special_delivery": "精准递球",
    "stop_and_go": "启停步", "tight_handles": "紧持球", "triple_threat_juke": "三威胁假动作",
    "vice_grip": "铁钳", "relay_passer": "中继传球", "bounceit": "击地传导",
    "clutch": "关键时刻",
    # 防守
    "anchor": "定海神针", "ankle_braces": "护踝", "ball_stripper": "掏球手",
    "boxout_beast": "挡人兽", "brick_walling": "挡拆墙", "challenger": "挑战者",
    "chase_down_artist": "追帽艺术家", "clamps": "手掌锁", "defensive_leader": "防守领袖",
    "glove": "手套", "heart_crusher": "斗志粉碎", "hustler": "拼命三郎",
    "interceptor": "拦截者", "intimidator": "恐吓者", "lightning_reflexes": "闪电反应",
    "menace": "威胁", "moving_truck": "推土机", "off_ball_pest": "无球纠缠",
    "pick_dodger": "绕挡专家", "pick_pocket": "袋鼠手", "pogo_stick": "弹簧腿",
    "post_lockdown": "背身锁死", "post_move_lockdown": "背身动作锁死", "rebound_chaser": "篮板猎人",
    "rim_protector": "护筐者", "tireless_defender": "不知疲倦", "trapper": "陷阱布置",
    "work_horse": "劳模", "worm": "蠕虫", "shot_blocker": "盖帽墙",
    # 人格徽章
    "alpha_dog": "天之骄子", "enforcer": "执行者", "extremely_confident": "极度自信",
    "expressive": "表现欲", "high_work_ethic": "高职业素养", "legendary_work_ethic": "传奇职业素养",
    "pat_my_back": "自我激励", "unpredictable": "不可预测", "reserved": "低调",
    "friendly": "亲和", "team_player": "团队至上", "keep_it_real": "率真",
    "laid_back": "淡定", "media_ringmaster": "媒体操盘手", "warm_weather_fan": "温暖天气",
    "finance_savvy": "务实理财", "work_ethic": "职业道德",
    # 其他常出现
    "free_tests": "免费点数", "blow_by": "一步过", "bulldozer": "推土机突破",
    "fast_feet": "快手快脚", "open_looks": "空位嗅觉", "special": "特型",
}
BADGE_CN = {k: v for k, v in BADGE_CN.items() if v}

TIER_CN = {1: "铜", 2: "银", 3: "金", 4: "名人堂", 5: "传奇"}

IDENT_KEYS = {"relationId", "playerId", "name", "nickname", "version", "date", "updatedAt",
              "college", "jersey", "collection", "theme", "team", "tier", "overall",
              "off_overall", "def_overall", "position", "secondary_position", "height",
              "wingspan", "weight", "plays", "shoe", "dominant_hand", "dominant_dunk_hand"}
MARKET_KEYS = {"mt", "salary", "vc", "is_auctionable", "upgrades", "logo_id"}
AGG_KEYS = {"total_stats", "stats_total", "stats_core", "overall_durability", "total_badges",
            "total_bronze", "total_silver", "total_gold", "total_hof", "total_legend"}


def classify(key: str, val: Any) -> str:
    """值 → 'attr' | 'tendency' | 'animation' | 'badge' | 'hotzone'（market/ident 由调用方先剥）。"""
    if key in ATTR_KEYS:
        return "attr"
    k = str(key)
    if k.startswith("hz_"):
        return "hotzone"
    if k.endswith("_t") and not k.startswith("hz_"):
        return "tendency"
    if k.endswith("_a"):
        return "animation"
    if k in AGG_KEYS:
        return "agg"
    if isinstance(val, dict):
        return "statobj"
    if (val is None or (isinstance(val, int) and 0 <= val <= 5)) and not k.endswith("_t"):
        return "badge"
    return "attr"
