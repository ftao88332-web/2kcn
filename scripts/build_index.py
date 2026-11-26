"""构建站点数据（无第三方依赖）。

  python scripts/build_index.py

输入：scraper/out/cards_full.json
输出：site/data/cards.json（详情页 SSG）
      site/data/cards_index.json（卡库列表，只含展示字段）
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, "scraper", "out", "cards_full.json")
DATA = os.path.join(ROOT, "site", "data")
LEAN_FIELDS = ("id", "name", "version", "overall", "off_overall", "def_overall",
               "position", "sec", "team", "theme", "collection", "tier", "height_cm",
               "weight_kg", "weight_lb", "wingspan_cm", "image", "mt", "badge_count",
               "hof_count", "released_at", "has_evo", "has_duo", "stats")
# 比较器/表格共用属性（避免前端再读整份详情数据）
CMP_ATTRS = (
    "shot_3pt", "shot_mid", "shot_close", "free_throw", "shot_iq",
    "driving_layup", "driving_dunk", "standing_dunk", "post_control",
    "ball_handle", "speed_with_ball", "passing_accuracy", "passing_vision",
    "speed", "acceleration", "strength", "vertical", "stamina",
    "perimeter_defense", "interior_defense", "steal", "block", "help_defense_iq",
    "offensive_rebound", "defensive_rebound",
)


def release_date(row: dict) -> str | None:
    """卡片上线日期：优先取 2kdb 的 date added（$D2026-08-29T...），否则用抓取时间。"""
    raw = ((row.get("attrs") or {}).get("date") or "")
    if isinstance(raw, str) and len(raw) >= 11:
        return raw.lstrip("$D")[:10]
    parsed = row.get("parsed_at")
    return parsed[:10] if isinstance(parsed, str) else None


def index_row(row: dict, pool: dict | None = None) -> dict:
    market = row.get("market") or {}
    badges = {k: v for k, v in (row.get("badges") or {}).items()
              if isinstance(v, int) and 0 < v <= 5}
    animations = {k: v for k, v in (row.get("animations") or {}).items()
                  if isinstance(v, str) and v and v not in ("None", "Off")}
    hof = sum(1 for v in badges.values() if v >= 4)

    # 双人组：从 attrs.duo1 里取搭档 relationId，关联卡库拿名字/总评
    duos: list[dict] = []
    for duo in (row.get("attrs", {}).get("duo1") or []):
        rid = duo.get("relationId1") or duo.get("relationId2")
        other = duo.get("relationId2") if rid == row["id"] else duo.get("relationId1")
        if other is None:
            continue
        mate = (pool or {}).get(str(other)) or {}
        duos.append({
            "id": other,
            "name": mate.get("name"),
            "overall": mate.get("overall"),
            "position": mate.get("position"),
        })
    # 进化阶段：attrs.evos 是同一张卡各进化阶段的加成包（evo_num / evo_name），
    # 只有生效项为正值，其余为 0，因此这里列正向加成
    evos: list[dict] = []
    for evo in ((row.get("attrs") or {}).get("evos") or []):
        gains: list[dict] = []
        for k, v in evo.items():
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                continue
            if k in ("playerId", "relationId", "evo_num", "date") or v <= 0:
                continue
            gains.append({"k": k, "d": v})
        gains.sort(key=lambda g: -g["d"])
        evos.append({
            "stage": evo.get("evo_num"),
            "label": evo.get("evo_name"),
            "gains": gains[:12],
        })

    # 比较/表格共用的关键属性（明细见 cards.json，这里只留瘦字段）
    a = row.get("attrs") or {}
    stats = {}
    for k in CMP_ATTRS:
        v = a.get(k)
        stats[k] = v if isinstance(v, (int, float)) and not isinstance(v, bool) else None

    return {
        "id": row["id"],
        "name": row.get("name"),
        "version": row.get("version"),
        "overall": row.get("overall"),
        "off_overall": row.get("off_overall"),
        "def_overall": row.get("def_overall"),
        "position": row.get("position"),
        "sec": row.get("sec_position"),
        "team": row.get("team"),
        "theme": row.get("theme"),
        "collection": row.get("collection"),
        "tier": row.get("tier"),
        "height_cm": row.get("height_cm"),
        "weight_lb": row.get("weight_lb"),
        "weight_kg": row.get("weight_kg"),
        "wingspan_cm": row.get("wingspan_cm"),
        "released_at": release_date(row),
        "image": row.get("image_url"),
        "mt": market.get("mt"),
        "badge_count": len(badges),
        "hof_count": hof,
        "has_evo": bool(evos),
        "has_duo": bool(duos),
        "stats": stats,
        "attrs": row.get("attrs"),
        "badges": badges,
        "hotzones": row.get("hotzones") or None,
        "animations": animations or None,
        "plays": row.get("plays"),
        "duos": duos or None,
        "evos": evos or None,
    }


def main() -> None:
    with open(FULL, "r", encoding="utf-8") as fh:
        pool = json.load(fh)
    rows = [index_row(r, pool) for r in pool.values() if r.get("version") == "2k27"]
    rows.sort(key=lambda r: (-(r["overall"] or 0), r["name"] or ""))

    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "cards.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    lean = [{k: r.get(k) for k in LEAN_FIELDS} for r in rows]
    with open(os.path.join(DATA, "cards_index.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(lean, fh, ensure_ascii=False, separators=(",", ":"))
    # 只有这些 id 才有详情页；行情榜里可能有库里暂时没有的卡，前端据此避免死链
    with open(os.path.join(DATA, "card_ids.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(sorted(r["id"] for r in rows), fh, separators=(",", ":"))

    # 徽章反向索引：badge_id -> 拥有它的卡（供徽章库与卡库"指定徽章"筛选用）
    badge_index: dict[str, dict] = {}
    for r in rows:
        for slug, tier in (r.get("badges") or {}).items():
            if not isinstance(tier, int) or tier <= 0:
                continue
            entry = badge_index.setdefault(slug, {"n": 0, "t": {}, "cards": []})
            entry["n"] += 1
            entry["t"][str(tier)] = entry["t"].get(str(tier), 0) + 1
            entry["cards"].append(r["id"])
    with open(os.path.join(DATA, "badge_index.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(badge_index, fh, ensure_ascii=False, separators=(",", ":"))

    print(f"cards.json {len(rows)} 行 / cards_index.json {len(lean)} 行 / card_ids.json {len(rows)} 个 / badge_index.json {len(badge_index)} 个徽章")


if __name__ == "__main__":
    main()
