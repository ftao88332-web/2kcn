#!/usr/bin/env bash
# 发布：site → GitHub Pages(gh-pages 分支)。用法：bash scripts/publish.sh
set -e
cd "$(dirname "$0")/.."

echo "== 1) 重建索引 =="
python -m scraper.main index

echo "== 2) 构建（NEXT_PUBLIC_BASE_PATH=/2kcn）=="
(cd site && MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH="/2kcn" npm run build)

echo "== 3) 产物推到 gh-pages 孤儿分支 =="
CUR=$(git branch --show-current)
rm -rf .gp-snap && mkdir .gp-snap && cp -r site/out/. .gp-snap/
git switch --orphan gh-pages-tmp
git reset -q --hard 2>/dev/null || true
find . -mindepth 1 -maxdepth 1 -not -name .git -not -name .gp-snap -exec rm -rf {} +
cp -r .gp-snap/. .
git add -A
git commit -q -m "publish: $(date -u +%%F_%T)"
git push -qf origin HEAD:gh-pages
rm -rf .gp-snap
git switch "$CUR"
echo "== 发布完成 =="
