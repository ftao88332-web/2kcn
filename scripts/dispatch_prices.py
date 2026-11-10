"""定时触发 prices 工作流（GitHub 自带 cron 在本仓库实测晚 5–7 小时）。

适合 Windows 任务计划 / 树莓派 crontab，零依赖、只用标准库。

用法：
  set GH_PAT=github_pat_xxx     # fine-grained，只勾 Actions: read/write，仅本仓库
  python scripts/dispatch_prices.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

REPO = os.environ.get("GH_REPO", "ftao88332-web/2kcn")
WORKFLOW = os.environ.get("GH_WORKFLOW", "prices.yml")
URL = f"https://api.github.com/repos/{REPO}/actions/workflows/{WORKFLOW}/dispatches"


def main() -> int:
    token = os.environ.get("GH_PAT")
    if not token:
        print("缺少 GH_PAT 环境变量", file=sys.stderr)
        return 2
    body = json.dumps({"ref": os.environ.get("GH_REF", "main")}).encode()
    req = urllib.request.Request(URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "2kcn-local-cron",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"已触发 {WORKFLOW}（HTTP {resp.status}）")
        return 0
    except urllib.error.HTTPError as exc:
        print(f"触发失败 HTTP {exc.code}: {exc.read().decode(errors='ignore')[:200]}", file=sys.stderr)
    except Exception as exc:
        print(f"网络错误：{exc}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
