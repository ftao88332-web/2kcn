#!/usr/bin/env bash
# 发布：site 产物 → GitHub Pages（gh-pages 分支）。用法：bash scripts/publish.sh
# 原理：临时克隆本地仓库 → 在克隆里强推 gh-pages 分支 → 主工作区完全不受影响（脏了也能发）。
set -e
cd "$(dirname "$0")/.."

echo "== 1) 重建索引 =="
python -m scraper.main index

echo "== 2) 构建（/2kcn 子路径）=="
(cd site && MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH="/2kcn" npm run build)

echo "== 3) 临时克隆内组装 gh-pages 并强推 =="
TP=$(mktemp -d)
GHURL=$(git remote get-url origin)
git clone -q . "$TP/repo"
(
  cd "$TP/repo"
  git remote add gh "$GHURL"
  git switch -C gh-pages
  find . -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
  cp -r "$OLDPWD/site/out/." .
  git add -A
  git commit -q -m "publish: $(date -u +%FT%TZ)"
  ok=""
  for i in 1 2 3 4 5; do
    if git push -qf gh gh-pages 2>"$TP/push.err"; then ok=1; break; fi
    echo "push 第 $i 次失败，5s 后重试: $(tail -1 "$TP/push.err")"
    sleep 5
  done
  [ -n "$ok" ] || { echo "PUSH_FAILED"; tail -3 "$TP/push.err"; exit 1; }
)
rm -rf "$TP"
echo "== 发布完成 =="
