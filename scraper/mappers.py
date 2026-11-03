"""把 2kdb 原始卡片对象映射成数据库行 + 站点索引行。

2kdb 的 flight 对象是"扁平"的：身份、属性、徽章、速度区、市场字段混在同一个字典里。
分桶策略：
  - hz_ 前缀    → hotzones
  - market 词表 → market（mt / vc / salary / is_auctionable / upgrades / logo_id）
  - 徽章词表（fields.json 里维护，可空）→ badges
  - 其余        → attrs（MVP 默认全放这里，UI 按 attrs 展示）
"""
import json
import os
import datetime as dt
from typing import Any

IDENT_KEYS = {"relationId", "playerId", "name", "nickname", "version", "date",
              "updatedAt", "college", "jersey", "collection", "theme", "team",
              "tier", "overall", "off_overall", "def_overall", "position",
              "secondary_position", "height", "wingspan", "weight", "plays",
              "shoe", "dominant_hand", "dominant_dunk_hand"}
MARKET_KEYS = {"mt", "salary", "vc", "is_auctionable", "upgrades", "logo_id"}

_FIELDS_PATH = os.path.join(os.path.dirname(__file__), "fields.json")
try:
    with open(_FIELDS_PATH, "r", encoding="utf-8") as fh:
        _fields = json.load(fh)
    BADGE_SLUGS: set[str] = set(_fields.get("badge_slugs", []))
except FileNotFoundError:
    BADGE_SLUGS = set()


def card_row(raw: dict[str, Any], source_url: str, image_url: str | None) -> dict[str, Any]:
    """原始 player 对象 → Supabase cards 行"""
    attrs: dict[str, Any] = {}
    badges: dict[str, Any] = {}
    hotzones: dict[str, Any] = {}
    market: dict[str, Any] = {}
    stats: dict[str, Any] = {}

    for key, val in raw.items():
        k = str(key)
        if k in IDENT_KEYS:
            continue
        if k.startswith("hz_"):
            hotzones[k] = val
        elif k in MARKET_KEYS:
            market[k] = val
        elif k in BADGE_SLUGS:
            badges[k] = val
        elif isinstance(val, dict):
            stats[k] = val
        else:
            attrs[k] = val

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
        "stats": stats,
        "market": market,
        "source_url": source_url,
        "parsed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def index_row(row: dict[str, Any]) -> dict[str, Any]:
    """cards 行 → site/data/cards.json 精简行（列表/搜索/首页用）"""
    market = row.get("market") or {}
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
        # 换代/全量数据大后可改为 Supabase 拉取；现阶段随索引打包保证零依赖可看
        "attrs": row.get("attrs"),
        "height_cm": row.get("height_cm"),
        "weight_kg": row.get("weight_kg"),
        "wingspan_cm": row.get("wingspan_cm"),
    }
