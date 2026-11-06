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
