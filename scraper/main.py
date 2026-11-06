"""命令行入口。

用法：
  python -m scraper.main parse <本地html> [--save]      # 解析单卡，调试用；--save 进本地数据池+建索引
  python -m scraper.main full27 [--limit N]             # 枚举 2K27 全部卡，补抓详情/图（断点续跑）
  python -m scraper.main market                         # 拉实时行情 → site/public/data/prices.json
  python -m scraper.main index                          # 由本地数据池重建 site/data/*.json
势：抓取结束后把 cards_full 提交回 git（workflow 负责），cards.json 保持同步。
"""
import argparse
import json
import os
import sys
import time

from .flight import parse_card, best_image
from .http_client import Client
from .mappers import card_row, index_row
from .settings import S
from .stores import save_image, out_dir

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


INDEX_FIELDS = ("id", "name", "version", "overall", "position", "team",
                "theme", "collection", "image", "mt")


def build_site_index(pool: dict[str, dict]) -> None:
    rows = (index_row(r) for r in pool.values())
    rows = sorted(rows, key=lambda r: (r["version"] or "", -(r["overall"] or 0), r["name"] or ""))
    os.makedirs(os.path.dirname(SITE_DATA), exist_ok=True)
    with open(SITE_DATA, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(rows, fh, ensure_ascii=False, separators=(",", ":"))
    # 轻量索引：卡库列表是客户端组件，只带展示字段，避免把属性/徽章打进浏览器包
    lean = [{k: r.get(k) for k in INDEX_FIELDS} for r in rows]
    lean_path = os.path.join(os.path.dirname(SITE_DATA), "cards_index.json")
    with open(lean_path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(lean, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"site/data/cards.json 已重建：{len(rows)} 行（轻量索引 {len(lean)} 行）")


def fetch_and_parse(client: Client, card_id: str) -> dict | None:
    """抓详情页 → 解析 → 下载卡面图 → 返回 cards 行。失败返回 None。"""
    url = f"{S.base}/player/{card_id}"
    try:
        html = client.get(url).text
        parsed = parse_card(html)
    except Exception as exc:
        print(f"[fail] {card_id}: {exc}")
        return None
    raw = parsed["card"]
    row = card_row(raw, source_url=url, image_url=None)  # 先建行，用规范化后的版本号当图片目录
    image_url = None
    img = best_image(parsed["images"])
    if img:
        try:
            data = client.get_binary(img)
            key_file = f"players/{row['version']}/{card_id}.webp"
            image_url = save_image(data, key_file)
        except Exception as exc:
            print(f"[warn] 图片失败 {card_id}: {exc}")
    row["image_url"] = image_url
    return row


def cmd_parse(args: argparse.Namespace) -> int:
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


def cmd_index(_args: argparse.Namespace) -> int:
    build_site_index(load_full())
    return 0


TRPC = f"{S.base}/api/trpc"
COLS_27 = ["average_price_playstation", "average_price_xbox", "badges_summary", "date",
           "height", "overall", "position", "weight", "wingspan"]


def fetch_players_table(http: Client, pages: list[int], version: str = "27",
                        batch: int = 10) -> list[dict]:
    """按页拉 players.getPlayersForTable（50/页），返回去重后的卡基础行。"""
    import urllib.parse
    out: dict[int, dict] = {}
    for i in range(0, len(pages), batch):
        chunk = pages[i:i + batch]
        inputs = {str(k): {"json": {"page": p, "name": None, "f": None, "match": None,
                                    "sort": None, "desc": None, "cols": COLS_27,
                                    "version": version}}
                  for k, p in enumerate(chunk)}
        procs = ",".join(["players.getPlayersForTable"] * len(chunk))
        url = (f"{TRPC}/{procs}?batch=1&input="
               + urllib.parse.quote(json.dumps(inputs, separators=(",", ":")), safe=""))
        rows = http.get(url).json()
        for item in rows:
            data = (item.get("result") or {}).get("data", {}).get("json") or {}
            for p in data.get("players") or []:
                out[p["relationId"]] = p
    return list(out.values())


def fetch_all_players(version: str = "27", max_pages: int = 80) -> list[dict]:
    """翻页直到空页/不足 50 条，拿到该版本全部卡（不写死页数，卡池扩容也跟得上）。"""
    http = Client()
    out: dict[int, dict] = {}
    for page in range(1, max_pages + 1):
        rows = fetch_players_table(http, [page], version)
        if not rows:
            break
        for p in rows:
            out[p["relationId"]] = p
        if len(rows) < 50:
            break
    return list(out.values())


def cmd_full27(args: argparse.Namespace) -> int:
    """全量 2K27：列表接口枚举全部卡 → 补抓缺失详情+图 → 重建索引。支持断点续跑。"""
    rows = fetch_all_players()
    print(f"2K27 列表接口返回 {len(rows)} 张卡")
    pool = load_full()
    missing = [r for r in rows if str(r["relationId"]) not in pool]
    print(f"库内已有 {len(pool)} 张，需补抓 {len(missing)} 张（限 {args.limit}）")
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
    build_site_index(pool)
    print(f"full27 完成：本轮新增 {done} 张，库内共 {len(pool)} 张")
    return 0


def cmd_rescrape(args: argparse.Namespace) -> int:
    """旧数据池没有分开的徽章/倾向桶 → 重新抓页面用当前解析器重建（保留图与来源）。"""
    client = Client()
    pool = load_full()
    ids = sorted(pool.keys(), key=lambda s: int(s), reverse=True)
    print(f"重抓 {len(ids)} 张卡（间隔 {args.delay}s）…")
    ok = fail = 0
    for n, cid in enumerate(ids, 1):
        old = pool[cid]
        url = old.get("source_url") or f"{S.base}/player/{cid}"
        try:
            html = client.get(url).text
            parsed = parse_card(html)
            row = card_row(parsed["card"], source_url=url, image_url=old.get("image_url"))
            pool[str(row["id"])] = row
            ok += 1
        except Exception as exc:
            fail += 1
            print(f"[fail] {cid}: {exc}")
        if n % 25 == 0:
            print(f"  … {n}/{len(ids)}")
        time.sleep(args.delay)
    save_full(pool)
    build_site_index(pool)
    print(f"rescrape 完成：ok {ok} fail {fail}")
    return 0


def cmd_market(args: argparse.Namespace) -> int:
    from . import market as mkt
    client = Client()
    overview = mkt.fetch_market_overview(client)
    active: list[dict] = []
    active_ids: list[int] = []
    if overview:
        for item in overview.get("mostActive") or []:
            p = item.get("player") or {}
            active.append({
                "id": p.get("relationId"), "name": p.get("name"),
                "ovr": p.get("overall"), "theme": p.get("theme"),
                "camp": p.get("collection"),
                "price": item.get("averagePrice"), "sales": item.get("salesCount"),
                "volume": item.get("totalVolume"), "last": (item.get("lastSaleAt") or "")[:16],
            })
            active_ids.append(p.get("relationId"))

    pool = load_full()
    tracked = []
    if os.path.exists(TRACKED_PATH):
        with open(TRACKED_PATH, "r", encoding="utf-8") as fh:
            raw_t = json.load(fh)
        tracked = [int(i) for i in (raw_t.get("ids") if isinstance(raw_t, dict) else raw_t)]
    hot = [int(k) for k, v in pool.items() if (v.get("overall") or 0) >= 90]
    ids = list(dict.fromkeys([i for i in active_ids if i] + tracked + hot))
    print(f"本轮实时价覆盖 {len(ids)} 张（active {len(active_ids)} / tracked {len(tracked)} / hot {len(hot)}）")
    prices = mkt.snapshot(client, ids)
    mkt.write_site_prices(prices, active)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="scraper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_parse = sub.add_parser("parse", help="解析本地 HTML（调试）")
    p_parse.add_argument("html_file")
    p_parse.add_argument("--url", help="原始来源 URL，供 source_url 字段")
    p_parse.add_argument("--save", action="store_true", help="写入本地数据池并重建索引")
    p_parse.set_defaults(func=cmd_parse)


    p_index = sub.add_parser("index", help="重建 site/data/cards.json")
    p_index.set_defaults(func=cmd_index)

    p_resc = sub.add_parser("rescrape", help="用当前解析器重抓全部已入库卡（分桶升级时用）")
    p_resc.add_argument("--delay", type=float, default=0.55)
    p_resc.set_defaults(func=cmd_rescrape)

    p_full = sub.add_parser("full27", help="全量 2K27：列表枚举 + 补抓详情/图（断点续跑）")
    p_full.add_argument("--limit", type=int, default=5000)
    p_full.add_argument("--delay", type=float, default=0.6)
    p_full.set_defaults(func=cmd_full27)

    p_market = sub.add_parser("market", help="实时行情 → prices.json")
    p_market.set_defaults(func=cmd_market)

    args = ap.parse_args()
    rc = args.func(args)
    sys.stdout.flush()
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
