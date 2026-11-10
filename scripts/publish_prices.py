"""把本地 prices.json 直接写到 gh-pages 的 /data/prices.json。

只更新一个静态文件，不触发整站重构建；前端本来就是运行时 fetch 行情。
依赖环境变量：GITHUB_TOKEN、GITHUB_REPOSITORY。
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.github.com"
BRANCH = "gh-pages"
PATH = "data/prices.json"
LOCAL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "site", "public", "data", "prices.json")


def call(url: str, token: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "2kcn-prices",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read() or b"{}")


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not token or not repo:
        print("缺少 GITHUB_TOKEN / GITHUB_REPOSITORY", file=sys.stderr)
        return 1
    with open(LOCAL, "rb") as fh:
        content = base64.b64encode(fh.read()).decode()

    url = f"{API}/repos/{repo}/contents/{PATH}"
    for attempt in range(1, 5):
        try:
            sha = None
            try:
                sha = call(f"{url}?ref={BRANCH}", token).get("sha")
            except urllib.error.HTTPError as exc:
                if exc.code != 404:
                    raise
            body = {"message": f"prices: {time.strftime('%F %T UTC', time.gmtime())}",
                    "content": content, "branch": BRANCH}
            if sha:
                body["sha"] = sha
            res = call(url, token, "PUT", body)
            print(f"已发布 {PATH} @ {res.get('commit', {}).get('sha', '?')[:7]}")
            return 0
        except urllib.error.HTTPError as exc:
            print(f"[warn] 第 {attempt} 次失败：HTTP {exc.code}")
            if attempt == 4:
                print(exc.read().decode(errors="ignore")[:300], file=sys.stderr)
        except Exception as exc:  # 网络抖动
            print(f"[warn] 第 {attempt} 次失败：{exc}")
        time.sleep(5 * attempt)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
