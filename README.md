# 2kCN · 国内版 NBA 2K MyTEAM 数据库 / 行情站

线上：<https://ftao88332-web.github.io/2kcn/>

零成本技术栈：**GitHub Actions 定时抓取 → Next.js 静态导出 → `gh-pages`**。
没有数据库、没有图床、没有服务器；卡面图与数据全部随站点静态发布。
方案文档：[`国内版2KDB建站方案.md`](./国内版2KDB建站方案.md) / [`MVP方案-交易行情搬砖工具.md`](./MVP方案-交易行情搬砖工具.md)

## 目录结构

```
├── scraper/                  # Python 抓取器
│   ├── flight.py             #   解析 2kdb 页面 RSC 数据流（属性/徽章/热区一次全解）
│   ├── main.py               #   CLI：parse / full27 / market / index / rescrape
│   ├── market.py             #   实时行情（tRPC）→ site/public/data/prices.json
│   ├── stores.py             #   本地文件存储（卡面图 → site/public/img）
│   ├── settings.py           #   环境变量配置
│   ├── tracked_ids.json      #   关注的卡 id → 每日刷新行情
│   └── out/cards_full.json   #   全量数据池（随 git 提交，断点续跑）
├── scripts/publish.sh        # 本地一键：重建索引 → 构建 → 推送 gh-pages
├── site/                     # Next.js 静态导出（output: "export"）
│   ├── app/                  #   首页 / 卡库 / 卡片详情 / 市场总览
│   ├── data/cards.json       #   全量详情数据（详情页 SSG 用）
│   ├── data/cards_index.json #   轻量索引（卡库列表分批加载用）
│   └── public/               #   卡面图 + prices.json
└── .github/workflows/
    ├── deploy-site.yml       # main 变更 → 构建 → git push gh-pages
    └── scrape.yml            # 每天 10:20 / 22:20（北京）抓取 + 部署
```

## 本地跑通

```bash
# 1) 抓取器
python -m venv .venv && .venv\Scripts\activate        # Windows
pip install -r scraper/requirements.txt

# 解析单卡（调试）
curl -sS https://2kdb.net/player/2761654 -o test.html
python -m scraper.main parse test.html --save         # 同时更新 site/data/*.json

# 日常任务（仅 2K27）
python -m scraper.main full27 --limit 300    # 枚举 2K27 全量并补抓（断点续跑）
python -m scraper.main index                 # 由数据池重建 cards.json / cards_index.json
python -m scraper.main market                # 拉实时行情 → prices.json
```

环境变量直接读进程环境（`scraper/settings.py`），可参考 `.env.example`；不自动加载 `.env` 文件。

```bash
# 2) 站点
cd site
npm ci
npm run dev     # http://localhost:3000
npm run build   # 产物在 site/out/
```

本地发布：`bash scripts/publish.sh`（重建索引 → 构建 `/2kcn` → 推送 `gh-pages`）。

## 上线（全部免费层）

1. **GitHub Pages**：仓库 Settings → Pages → Source 选 `gh-pages` 分支。
2. **自动部署**：push `main` 后 `deploy site` workflow 会构建并 `git push --force` 到 `gh-pages`（单次 pack，不受 API 5,000/h 限额影响）。
3. **定时抓取**：`scrape` workflow 每天两跑，抓完自动提交数据并部署。
4. 以后要更好 SEO/速度：花 ¥60/年 上自定义域名挂到 Pages。

## 边界与红线

- 图片资产归 2K Sports；不挂广告不收费；页脚已带免责声明 + 投诉邮箱。
- 抓取节奏默认 1.2~1.5 秒/请求，别调小；上游是个人站，磕着用。
