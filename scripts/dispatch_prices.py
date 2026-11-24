"""定时触发 prices 工作流（GitHub 自带 cron 在本仓库实测晚 5–7 小时）。

适合 Windows 任务计划 / 树莓派 crontab，零依赖、只用标准库。
网络抖动时自动重试 3 次（api.github.com 在国内时常被重置）。

用法：
  set GH_PAT=ghp_xxx     # classic 勾 repo+workflow，或 fine-grained 勾 Actions: read/write
  python scripts/dispatch_prices.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

REPO = os.environ.get("GH_REPO", "ftao88332-web/2kcn")
WORKFLOW = os.environ.get("GH_WORKFLOW", "prices.yml")
URL = f"https://api.github.com/repos/{REPO}/actions/workflows/{WORKFLOW}/dispatches"
ATTEMPTS = 3


def trigger(token: str) -> int:
    body = json.dumps({"ref": os.environ.get("GH_REF", "main")}).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "2kcn-local-cron",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status


def main() -> int:
    token = os.environ.get("GH_PAT")
    if not token:
        print("缺少 GH_PAT 环境变量", file=sys.stderr)
        return 2

    for i in range(1, ATTEMPTS + 1):
        try:
            status = trigger(token)
            print(f"已触发 {WORKFLOW}（HTTP {status}）")
            return 0
        except urllib.error.HTTPError as exc:
            msg = exc.read().decode(errors="ignore")[:200]
            print(f"第 {i} 次失败 HTTP {exc.code}: {msg}", file=sys.stderr)
            if exc.code < 500 and exc.code != 429:
                return 1  # token 或参数有问题，重试没用
        except Exception as exc:
            print(f"第 {i} 次网络错误：{exc}", file=sys.stderr)
        if i < ATTEMPTS:
            time.sleep(5 * i)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
