"""核对 2kdb 各卡种档位的官方名称（从卡片页标题里取 "NN OVR <Tier> Cut"）。"""
import json
import re
import time

import httpx

UA = {"User-Agent": "2kcn-scraper/0.2"}
FULL = "scraper/out/cards_full.json"


def main() -> None:
    with open(FULL, "r", encoding="utf-8") as fh:
        pool = json.load(fh)
    samples: dict[int, tuple[str, str, int]] = {}
    for k, v in pool.items():
        t = v.get("tier")
        if t and t not in samples:
            samples[t] = (k, v.get("name") or "", v.get("overall") or 0)

    with httpx.Client(headers=UA, timeout=20, follow_redirects=True) as cli:
        for t in sorted(samples):
            cid, name, ovr = samples[t]
            url = f"https://2kdb.net/player/{cid}"
            try:
                r = cli.get(url)
                m = re.search(r"<title>(.*?)</title>", r.text, re.S)
                title = (m.group(1) if m else "").strip()
                gem = re.search(r"(\d+)\s*OVR\s+(.+?)\s+Cut", title)
                label = gem.group(2) if gem else "?"
                print(f"tier {t:>2} | {ovr} OVR | {name[:22]:22} | {label}")
            except Exception as e:  # noqa: BLE001
                print(f"tier {t:>2} | 抓取失败 {e}")
            time.sleep(0.4)


if __name__ == "__main__":
    main()
