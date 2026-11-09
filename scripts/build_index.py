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
LEAN_FIELDS = ("id", "name", "version", "overall", "position", "team",
               "theme", "collection", "image", "mt")


def index_row(row: dict) -> dict:
    market = row.get("market") or {}
    badges = {k: v for k, v in (row.get("badges") or {}).items()
              if isinstance(v, int) and 0 < v <= 5}
    return {
        "id": row["id"],
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
        "attrs": row.get("attrs"),
        "badges": badges,
        "hotzones": row.get("hotzones") or None,
        "height_cm": row.get("height_cm"),
        "weight_kg": row.get("weight_kg"),
        "wingspan_cm": row.get("wingspan_cm"),
    }


def main() -> None:
    with open(FULL, "r", encoding="utf-8") as fh:
        pool = json.load(fh)
    rows = [index_row(r) for r in pool.values() if r.get("version") == "2k27"]
    rows.sort(key=lambda r: (-(r["overall"] or 0), r["name"] or ""))

    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, "cards.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    lean = [{k: r.get(k) for k in LEAN_FIELDS} for r in rows]
    with open(os.path.join(DATA, "cards_index.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(lean, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"cards.json {len(rows)} 行 / cards_index.json {len(lean)} 行")


if __name__ == "__main__":
    main()
