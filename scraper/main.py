"""命令行入口。

用法：
  python -m scraper.main parse <本地html> [--save]      # 解析单卡，调试用；--save 进本地数据池+建索引
  python -m scraper.main daily [--new-limit N]          # 每日任务：新卡解析 + tracked 行情快照
  python -m scraper.main index                          # 由本地数据池重建 site/data/cards.json
势：daily 结束后把 cards_full 提交回 git（workflow 负责），cards.json 保持同步。
"""
import argparse
import datetime as dt
import json
import os
import sys
import time

from .flight import parse_card, best_image
from .http_client import Client
from .mappers import card_row, index_row
from .settings import S
from .stores import Stores, out_dir

FULL_PATH = os.path.join(out_dir(), "cards_full.json")
SITE_DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "site", "data", "cards.json")
TRACKED_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracked_ids.json")


def load_full() -> dict[str, dict]:
    if os.path.exists(FULL_PATH):
        with open(FULL_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def save_full(pool: dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(FULL_PATH), exist_ok=True)
    with open(FULL_PATH, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(pool, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def build_site_index(pool: dict[str, dict]) -> None:
    rows = (index_row(r) for r in pool.values())
    rows = sorted(rows, key=lambda r: (r["version"] or "", -(r["overall"] or 0), r["name"] or ""))
    os.makedirs(os.path.dirname(SITE_DATA), exist_ok=True)
    with open(SITE_DATA, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"site/data/cards.json 已重建：{len(pool)} 行")


def sitemap_ids(client: Client) -> list[str]:
    import re as _re
    cache = os.path.join(out_dir(), "sitemap_cache")
    os.makedirs(cache, exist_ok=True)
    path = os.path.join(cache, "players-0.xml")
    if os.path.exists(path) and time.time() - os.path.getmtime(path) < 86400:
        xml = open(path, "r", encoding="utf-8").read()
    else:
        xml = client.get(f"{S.base}/sitemaps/sitemap/players-0.xml").text
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(xml)
    ids = _re.findall(r"2kdb\.net/player/(\d+)", xml)
    return sorted(set(ids), key=lambda s: int(s), reverse=True)  # 新卡 id 大，优先


def fetch_and_parse(client: Client, card_id: str, stores: Stores,
                    snapshot: bool = False) -> dict | None:
    """抓详情页 → 解析 → （可选）传图 → 返回 cards 行。失败返回 None。"""
    url = f"{S.base}/player/{card_id}"
    try:
        html = client.get(url).text
        parsed = parse_card(html)
    except Exception as exc:
        print(f"[fail] {card_id}: {exc}")
        return None
    raw = parsed["card"]
    image_url = None
    img = best_image(parsed["images"])
    if img:
        try:
            data = client.get_binary(img)
            key_file = f"players/{raw.get('version')}/{card_id}.webp"
            image_url = stores.upload_image(data, key_file)
        except Exception as exc:
            print(f"[warn] 图片失败 {card_id}: {exc}")
    row = card_row(raw, source_url=url, image_url=image_url)
    stores.upsert("cards", [row], on_conflict="id")
    if snapshot:
        today = dt.date.today().isoformat()
        stores.upsert("price_snapshots",
                      [{"card_id": row["id"], "ts": today, "mt": (row["market"] or {}).get("mt"),
                        "auctionable": (row["market"] or {}).get("is_auctionable"),
                        "raw": {"ovr": row["overall"], "theme": row["theme"]}}],
                      on_conflict="card_id,ts")
    return row


def cmd_parse(args: argparse.Namespace) -> int:
    stores = Stores(dry_run=not S.sb_ready)
    html = open(args.html_file, "r", encoding="utf-8").read()
    url_hint = getattr(args, "url", None) or "file://"
    parsed = parse_card(html)
    raw = parsed["card"]
    row = card_row(raw, source_url=url_hint, image_url=None)  # 本地调试不下载原图
    out = {"card": row, "image_candidates": parsed["images"][:6]}
    if args.save:
        pool = load_full()
        pool[str(row["id"])] = row
        save_full(pool)
        build_site_index(pool)
    print(json.dumps(out, ensure_ascii=False, indent=2)[:1600])
    return 0


def cmd_daily(args: argparse.Namespace) -> int:
    client = Client()
    stores = Stores()
    limit = args.new_limit
    stats = {"new_ok": 0, "new_fail": 0, "snap_ok": 0, "snap_fail": 0}

    ids = sitemap_ids(client)
    pool = load_full()
    new_ids = [i for i in ids if i not in pool][:limit]
    print(f"sitemap 卡片总数 {len(ids)}；本次解析新卡 {len(new_ids)}")

    for cid in new_ids:
        row = fetch_and_parse(client, cid, stores)
        if row:
            pool[str(row["id"])] = row
            stats["new_ok"] += 1
        else:
            stats["new_fail"] += 1

    tracked = []
    if os.path.exists(TRACKED_PATH):
        with open(TRACKED_PATH, "r", encoding="utf-8") as fh:
            raw_tracked = json.load(fh)
        tracked = raw_tracked["ids"] if isinstance(raw_tracked, dict) else raw_tracked
    print(f"tracked 行情快照 {len(tracked)} 张")
    for cid in tracked:
        row = fetch_and_parse(client, cid, stores, snapshot=True)
        if row:
            pool[str(row["id"])] = row
            stats["snap_ok"] += 1
        else:
            stats["snap_fail"] += 1

    save_full(pool)
    build_site_index(pool)
    stores.log_run("daily", stats["new_ok"] + stats["snap_ok"],
                   stats["new_fail"] + stats["snap_fail"], stores.summary)
    print("统计:", json.dumps(stats, ensure_ascii=False), stores.summary)
    return 0


def cmd_index(_args: argparse.Namespace) -> int:
    build_site_index(load_full())
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="scraper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_parse = sub.add_parser("parse", help="解析本地 HTML（调试）")
    p_parse.add_argument("html_file")
    p_parse.add_argument("--url", help="原始来源 URL，供 source_url 字段")
    p_parse.add_argument("--save", action="store_true", help="写入本地数据池并重建索引")
    p_parse.set_defaults(func=cmd_parse)

    p_daily = sub.add_parser("daily", help="每日任务")
    p_daily.add_argument("--new-limit", type=int, default=S.new_limit)
    p_daily.set_defaults(func=cmd_daily)

    p_index = sub.add_parser("index", help="重建 site/data/cards.json")
    p_index.set_defaults(func=cmd_index)

    args = ap.parse_args()
    rc = args.func(args)
    sys.stdout.flush()
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
