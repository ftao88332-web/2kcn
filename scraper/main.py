"""2K27 抓取命令行。

  python -m scraper.main parse <html> [--save]   # 解析单卡（调试）
  python -m scraper.main full27 [--limit N]      # 枚举全量并补抓（断点续跑）
  python -m scraper.main rescrape                # 用当前解析器重抓全部
  python -m scraper.main market                  # 实时行情 → prices.json

数据池：scraper/out/cards_full.json
站点数据：运行 `python scripts/build_index.py` 生成。
"""
import argparse
import json
import os
import sys
import time
import urllib.parse

from .common import Client, S, out_dir, save_image
from .parse import best_image, card_row, parse_card

FULL_PATH = os.path.join(out_dir(), "cards_full.json")
TRPC = f"{S.base}/api/trpc"
COLS_27 = ["average_price_playstation", "average_price_xbox", "badges_summary", "date",
           "height", "overall", "position", "weight", "wingspan"]


def load_full() -> dict[str, dict]:
    if os.path.exists(FULL_PATH):
        with open(FULL_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def save_full(pool: dict[str, dict]) -> None:
    with open(FULL_PATH, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(pool, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def fetch_and_parse(client: Client, card_id: str) -> dict | None:
    """详情页 → 结构化行 + 下载卡面图。失败返回 None。"""
    url = f"{S.base}/player/{card_id}"
    try:
        parsed = parse_card(client.get(url).text)
    except Exception as exc:
        print(f"[fail] {card_id}: {exc}")
        return None
    row = card_row(parsed["card"], source_url=url, image_url=None)
    img = best_image(parsed["images"])
    if img:
        try:
            row["image_url"] = save_image(
                client.get_binary(img), f"players/{row['version']}/{card_id}.webp"
            )
        except Exception as exc:
            print(f"[warn] 图片失败 {card_id}: {exc}")
    return row


def fetch_players_page(http: Client, page: int, version: str = "27") -> list[dict]:
    """players.getPlayersForTable 单页（50 条）。"""
    body = {"0": {"json": {"page": page, "name": None, "f": None, "match": None,
                           "sort": None, "desc": None, "cols": COLS_27, "version": version}}}
    url = (f"{TRPC}/players.getPlayersForTable?batch=1&input="
           + urllib.parse.quote(json.dumps(body, separators=(",", ":")), safe=""))
    data = http.get(url).json()
    rows = (data[0].get("result") or {}).get("data", {}).get("json") or {}
    return rows.get("players") or []


def fetch_all_players(version: str = "27", max_pages: int = 80) -> list[dict]:
    """翻页直到空页/不足 50 条，拿到该版本全部卡（卡池扩容也跟得上）。"""
    http = Client()
    out: dict[int, dict] = {}
    for page in range(1, max_pages + 1):
        rows = fetch_players_page(http, page, version)
        if not rows:
            break
        for p in rows:
            out[p["relationId"]] = p
        if len(rows) < 50:
            break
    return list(out.values())


def cmd_parse(args: argparse.Namespace) -> int:
    parsed = parse_card(open(args.html_file, "r", encoding="utf-8").read())
    row = card_row(parsed["card"], source_url=args.url or "file://", image_url=None)
    if args.save:
        pool = load_full()
        pool[str(row["id"])] = row
        save_full(pool)
    print(json.dumps({"card": row, "images": parsed["images"][:6]},
                     ensure_ascii=False, indent=2)[:1600])
    return 0


def cmd_full27(args: argparse.Namespace) -> int:
    rows = fetch_all_players()
    pool = load_full()
    missing = [r for r in rows if str(r["relationId"]) not in pool]
    print(f"列表 {len(rows)} 张；库内 {len(pool)} 张；待补抓 {len(missing)} 张")
    done = 0
    for r in missing[: args.limit]:
        cid = str(r["relationId"])
        row = fetch_and_parse(Client(), cid)
        if row:
            pool[cid] = row
            done += 1
            if done % 20 == 0:
                save_full(pool)
                print(f"  … {done}/{len(missing)}")
        else:
            print(f"[fail] {cid}")
        time.sleep(max(0.0, args.delay))
    save_full(pool)
    print(f"full27 完成：本轮新增 {done} 张，库内共 {len(pool)} 张")
    return 0


def cmd_rescrape(args: argparse.Namespace) -> int:
    client = Client()
    pool = load_full()
    ids = sorted(pool, key=int, reverse=True)
    print(f"重抓 {len(ids)} 张（间隔 {args.delay}s）…")
    ok = fail = 0
    for n, cid in enumerate(ids, 1):
        old = pool[cid]
        url = old.get("source_url") or f"{S.base}/player/{cid}"
        try:
            row = card_row(parse_card(client.get(url).text)["card"], url, old.get("image_url"))
            pool[str(row["id"])] = row
            ok += 1
        except Exception as exc:
            fail += 1
            print(f"[fail] {cid}: {exc}")
        if n % 25 == 0:
            print(f"  … {n}/{len(ids)}")
        time.sleep(args.delay)
    save_full(pool)
    print(f"rescrape 完成：ok {ok} fail {fail}")
    return 0


def cmd_market(_args: argparse.Namespace) -> int:
    from . import market as mkt
    client = Client()
    overview = mkt.fetch_market_overview(client) or {}
    active, active_ids = [], []
    for item in overview.get("mostActive") or []:
        p = item.get("player") or {}
        active.append({
            "id": p.get("relationId"), "name": p.get("name"), "ovr": p.get("overall"),
            "theme": p.get("theme"), "camp": p.get("collection"),
            "price": item.get("averagePrice"), "sales": item.get("salesCount"),
            "volume": item.get("totalVolume"), "last": (item.get("lastSaleAt") or "")[:16],
        })
        active_ids.append(p.get("relationId"))

    hot = [int(k) for k, v in load_full().items() if (v.get("overall") or 0) >= 90]
    ids = list(dict.fromkeys([i for i in active_ids if i] + hot))
    print(f"实时价覆盖 {len(ids)} 张（active {len(active_ids)} / hot {len(hot)}）")
    mkt.write_site_prices(mkt.snapshot(client, ids), active)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="scraper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("parse", help="解析本地 HTML（调试）")
    p.add_argument("html_file")
    p.add_argument("--url")
    p.add_argument("--save", action="store_true", help="写入数据池")
    p.set_defaults(func=cmd_parse)

    p = sub.add_parser("full27", help="全量 2K27（断点续跑）")
    p.add_argument("--limit", type=int, default=5000)
    p.add_argument("--delay", type=float, default=0.6)
    p.set_defaults(func=cmd_full27)

    p = sub.add_parser("rescrape", help="用当前解析器重抓全部已入库卡")
    p.add_argument("--delay", type=float, default=0.55)
    p.set_defaults(func=cmd_rescrape)

    p = sub.add_parser("market", help="实时行情 → prices.json")
    p.set_defaults(func=cmd_market)

    args = ap.parse_args()
    rc = args.func(args)
    sys.stdout.flush()
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
