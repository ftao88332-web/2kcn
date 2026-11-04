"""把 2kdb 原始卡片对象映射成数据库行 + 站点索引行（v2：徽章/倾向/动画独立分桶）。"""
import datetime as dt
import os
from typing import Any

from .fields import (AGG_KEYS, ATTR_GROUPS, BADGE_CN, IDENT_KEYS, MARKET_KEYS, classify)


def card_row(raw: dict[str, Any], source_url: str, image_url: str | None) -> dict[str, Any]:
    """原始 player 对象 → Supabase cards 行（字段 v2）"""
    attrs: dict[str, Any] = {}
    badges: dict[str, Any] = {}
    tendencies: dict[str, Any] = {}
    animations: dict[str, Any] = {}
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
        elif kind == "tendency":
            tendencies[k] = val
        elif kind == "animation":
            animations[k] = val
        elif kind == "hotzone":
            hotzones[k] = val
        elif kind == "agg":
            market[k] = val  # 汇总计数放 market 侧，不算业务属性
        else:
            market[k] = val

    # 徽章级数值换算：0/None=无，1..5=铜/银/金/名人堂/传奇
    owned = {bk: v for bk, v in badges.items() if isinstance(v, int) and v > 0}
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
        "tendencies": tendencies,
        "animations": animations,
        "hotzones": hotzones,
        "stats": None,
        "market": market,
        "source_url": source_url,
        "parsed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def badge_label(slug: str) -> tuple[str, str]:
    """slug → (中文名或美化英文, 是否中文)"""
    cn = BADGE_CN.get(slug)
    if cn:
        return cn, "zh"
    pretty = slug.replace("_", " ").title()
    return pretty, "en"


def index_row(row: dict[str, Any]) -> dict[str, Any]:
    """cards 行 → site/data/cards.json 精简行（列表/搜索/详情兜底）"""
    market = row.get("market") or {}
    owned = {k: v for k, v in (row.get("badges") or {}).items() if isinstance(v, int) and 0 < v <= 5}
    return {
        "id": row["id"],
        "playerId": row.get("player_id"),
        "name": row.get("name"),
        "version": row.get("version"),
        "overall": row.get("overall"),
        "position": row.get("position"),
        "sec": row.get("sec_position"),
        "team": row.get("team"),
        "theme": row.get("theme"),
        "collection": row.get("collection"),
        "image": row.get("image_url"),
        "mt": market.get("mt"),
        "auctionable": market.get("is_auctionable"),
        "attrs": row.get("attrs"),
        "badges": {k: v for k, v in owned.items()},
        "hotzones": row.get("hotzones") or None,
        "height_cm": row.get("height_cm"),
        "weight_kg": row.get("weight_kg"),
        "wingspan_cm": row.get("wingspan_cm"),
    }


def public_dir() -> str:
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "public", "data")
    os.makedirs(base, exist_ok=True)
    return base
