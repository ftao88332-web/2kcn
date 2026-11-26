"""断点续跑：为旧库卡片补抓动作包（animations）等新字段。

分批落盘，中断后重跑会跳过已含 animations 的卡。
  python scripts/rescrape_animations.py [--delay 0.4] [--limit N]
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.common import Client, out_dir
from scraper.parse import parse_card, card_row

FULL = os.path.join(out_dir(), "cards_full.json")


def load():
    with open(FULL, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save(pool):
    with open(FULL, "w", encoding="utf-8", newline="") as fh:
        json.dump(pool, fh, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delay", type=float, default=0.4)
    ap.add_argument("--limit", type=int, default=10_000)
    args = ap.parse_args()

    pool = load()
    todo = [k for k, v in pool.items() if not v.get("animations")]
    print(f"库内 {len(pool)} 张；待补动作包 {len(todo)} 张")

    client = Client()
    done = fail = 0
    for n, cid in enumerate(todo[: args.limit], 1):
        old = pool[cid]
        url = old.get("source_url") or f"https://2kdb.net/player/{cid}"
        try:
            row = card_row(parse_card(client.get(url).text)["card"], url, old.get("image_url"))
            pool[cid] = row
            done += 1
        except Exception as exc:
            fail += 1
            print(f"[fail] {cid}: {exc}")
        if n % 25 == 0:
            save(pool)
            print(f"  … {n}/{len(todo)}（成功 {done}，失败 {fail}）")
        time.sleep(args.delay)

    save(pool)
    print(f"完成：成功 {done}，失败 {fail}，库内 {len(pool)} 张")


if __name__ == "__main__":
    main()
