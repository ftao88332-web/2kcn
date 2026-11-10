"""构建前把线上更新的行情快照留下来。

整站发布是 `git push --force` 到 gh-pages，会用仓库里的 prices.json 覆盖线上；
而 prices 工作流每 15 分钟直接把新行情写到 gh-pages，不进 main。
所以在构建前比一次 ts：线上更新就用线上的，否则保留仓库里的。

用法：`python scripts/keep_prices.py`（取不到线上数据时安静跳过，不影响发布）
"""
import json
import os
import time
import urllib.request

URL = "https://ftao88332-web.github.io/2kcn/data/prices.json"
LOCAL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "site", "public", "data", "prices.json")


def fetch_live() -> dict | None:
    """优先 raw.githubusercontent（CDN 不缓存），退回 Pages（Fastly 最多缓存 10 分钟）。"""
    repo = os.environ.get("GITHUB_REPOSITORY", "ftao88332-web/2kcn")
    urls = [f"https://raw.githubusercontent.com/{repo}/gh-pages/data/prices.json",
            f"{URL}?t={int(time.time())}"]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "2kcn-build"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except Exception as exc:
            print(f"[warn] {url} 取不到：{exc}")
    return None


def main() -> int:
    live = fetch_live()
    if not live:
        print("[skip] 线上行情取不到，按仓库里的发布")
        return 0

    cur = {}
    if os.path.exists(LOCAL):
        try:
            with open(LOCAL, encoding="utf-8") as fh:
                cur = json.load(fh)
        except Exception:
            cur = {}

    if (live.get("ts") or "") > (cur.get("ts") or ""):
        with open(LOCAL, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(live, fh, ensure_ascii=False, separators=(",", ":"))
        print(f"沿用线上行情 {live['ts']}（仓库 {cur.get('ts') or '无'}）")
    else:
        print(f"保留仓库行情 {cur.get('ts')}（线上 {live.get('ts') or '无'}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
