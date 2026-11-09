"""解析与规范化：2kdb 页面 → 卡片数据结构。"""
import datetime as dt
import json
import re
from typing import Any

PUSH_START = 'self.__next_f.push([1,'
CARD_ANCHOR = '{"player":{"relationId"'
IMG_RE = re.compile(
    r'https://img\.2kdb\.net/[A-Za-z0-9_\-]+/s:(\d+):0[^"]*?/plain/'
    r'local%3A%2F%2F%2Fimages%2Fplayers%2F(\d+)%2F(\d+)\.png'
)

ATTR_KEYS = {
    "shot_close", "shot_mid", "shot_3pt", "free_throw", "shot_iq", "offensive_consistency",
    "driving_layup", "standing_dunk", "driving_dunk", "post_control", "post_hook", "post_fade",
    "draw_foul", "hands", "speed_with_ball", "ball_handle", "passing_accuracy", "passing_vision",
    "passing_iq", "speed", "agility", "acceleration", "vertical", "strength", "stamina", "hustle",
    "lateral_quickness", "interior_defense", "perimeter_defense", "help_defense_iq",
    "pass_perception", "steal", "block", "defensive_consistency", "offensive_rebound",
    "defensive_rebound", "intangibles", "potential",
}
IDENT_KEYS = {
    "relationId", "playerId", "name", "nickname", "version", "date", "updatedAt", "college",
    "jersey", "collection", "theme", "team", "tier", "overall", "off_overall", "def_overall",
    "position", "secondary_position", "height", "wingspan", "weight", "plays", "shoe",
    "dominant_hand", "dominant_dunk_hand",
}
MARKET_KEYS = {"mt", "salary", "vc", "is_auctionable", "upgrades", "logo_id"}
AGG_KEYS = {
    "total_stats", "stats_total", "stats_core", "overall_durability", "total_badges",
    "total_bronze", "total_silver", "total_gold", "total_hof", "total_legend",
}


def classify(key: str, val: Any) -> str:
    """值 → attr / tendency / animation / badge / hotzone / agg / statobj。"""
    if key in ATTR_KEYS:
        return "attr"
    if key.startswith("hz_"):
        return "hotzone"
    if key.endswith("_t"):
        return "tendency"
    if key.endswith("_a"):
        return "animation"
    if key in AGG_KEYS:
        return "agg"
    if isinstance(val, dict):
        return "statobj"
    if val is None or (isinstance(val, int) and 0 <= val <= 5):
        return "badge"
    return "attr"


def extract_flight(html: str) -> str:
    """解码页面所有 RSC push 字符串并拼接。"""
    parts: list[str] = []
    pos = 0
    while True:
        i = html.find(PUSH_START, pos)
        if i < 0:
            break
        q = html.find('"', i + len(PUSH_START))
        if q < 0:
            break
        j = q + 1
        while j < len(html):
            if html[j] == "\\":
                j += 2
                continue
            if html[j] == '"':
                break
            j += 1
        raw = html[q: j + 1]
        try:
            parts.append(json.loads(raw))
        except json.JSONDecodeError:
            parts.append(raw[1:-1])
        pos = j + 1
    return "".join(parts)


def match_object(text: str, start: int) -> str:
    """从 start 处的大括号开始做字符串感知配对。"""
    depth = 0
    instr = esc = False
    for j in range(start, len(text)):
        c = text[j]
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                instr = False
        elif c == '"':
            instr = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start: j + 1]
    raise ValueError("未闭合的对象（页面结构可能变化）")


def parse_card(html: str) -> dict[str, Any]:
    """返回 {"card": 原始字段, "images": [(宽度, url, 版本+id)]}。"""
    flight = extract_flight(html)
    i = flight.find(CARD_ANCHOR)
    if i < 0:
        raise ValueError("未找到卡片数据（页面可能已改版）")
    data = json.loads(match_object(flight, i))

    images, seen = [], set()
    for m in IMG_RE.finditer(html):
        width, ver, cid = m.group(1), m.group(2), m.group(3)
        if m.group(0) not in seen:
            seen.add(m.group(0))
            images.append((int(width), m.group(0), f"{ver}{cid}"))
    return {"card": data["player"], "images": images}


def best_image(images: list[tuple[int, str, str]]) -> str | None:
    return max(images, key=lambda t: t[0])[1] if images else None


def card_row(raw: dict[str, Any], source_url: str, image_url: str | None) -> dict[str, Any]:
    """原始 player 对象 → 卡片行（属性/徽章/热区/市场分桶）。"""
    attrs: dict[str, Any] = {}
    badges: dict[str, Any] = {}
    hotzones: dict[str, Any] = {}
    market: dict[str, Any] = {}

    for key, val in raw.items():
        k = str(key)
        if k in IDENT_KEYS:
            continue
        if k in MARKET_KEYS:
            market[k] = val
            continue
        kind = classify(k, val)
        if kind == "attr":
            attrs[k] = val
        elif kind == "badge":
            badges[k] = val
        elif kind == "hotzone":
            hotzones[k] = val
        elif kind in ("tendency", "animation"):
            continue  # 站点不展示
        else:
            market[k] = val

    owned = {k: v for k, v in badges.items() if isinstance(v, int) and v > 0}
    market["total_badges"] = len(owned)
    market["total_hof"] = sum(1 for v in owned.values() if v >= 4)

    return {
        "id": raw["relationId"],
        "player_id": raw.get("playerId"),
        "version": f"2k{raw.get('version') or ''}",
        "name": raw.get("name") or "",
        "nickname": raw.get("nickname"),
        "position": raw.get("position"),
        "sec_position": raw.get("secondary_position"),
        "overall": raw.get("overall"),
        "off_overall": raw.get("off_overall"),
        "def_overall": raw.get("def_overall"),
        "height_cm": raw.get("height"),
        "weight_kg": raw.get("weight"),
        "wingspan_cm": raw.get("wingspan"),
        "team": raw.get("team"),
        "collection": raw.get("collection"),
        "theme": raw.get("theme"),
        "tier": raw.get("tier"),
        "plays": raw.get("plays"),
        "shoe": raw.get("shoe"),
        "image_url": image_url,
        "attrs": attrs,
        "badges": badges,
        "hotzones": hotzones,
        "market": market,
        "source_url": source_url,
        "parsed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
