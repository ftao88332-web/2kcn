# 2kCN · NBA 2K27 MyTEAM 数据库 / 行情

线上：<https://ftao88332-web.github.io/2kcn/>

纯静态、零成本：GitHub Actions 抓取 → Next.js 导出 → `gh-pages`。
只收录 **2K27**，没有数据库、没有图床、没有服务器。

## 结构

```
scraper/
  common.py           配置 + HTTP 客户端 + 图片存储
  parse.py            页面解析 + 字段规范化
  main.py             CLI：parse / full27 / rescrape / market
  market.py           实时行情 → site/public/data/prices.json
  out/cards_full.json 唯一数据源（卡池）
scripts/
  build_index.py      cards_full → site/data/cards.json + cards_index.json
site/
  app/                首页 / 卡库 / 详情 / 市场
  components/         卡片瓦片、详情区块、行情面板
  lib/core.ts         类型、路径、行情读取
  lib/i18n.ts         中英文词表
  public/img/         卡面图（自托管）
  public/data/        prices.json
.github/workflows/    抓取 + 构建发布
```

## 本地运行

```bash
pip install -r scraper/requirements.txt

python -m scraper.main full27 --limit 300   # 抓取/补抓
python -m scraper.main market               # 行情
python scripts/build_index.py               # 生成站点数据（必须）

cd site && npm ci && npm run dev            # http://localhost:3000
npm run build                               # site/out/
```

环境变量：`SCRAPE_DELAY`（默认 1.5 秒）。直接读进程环境，不加载 `.env`。

## 发布

推 `main` → `deploy site` 自动构建并推送 `gh-pages`。
每天 10:20 / 22:20（北京）`scrape` 抓取新卡与行情并自动发布。

## 边界

- 卡图版权归 2K Sports；不挂广告、不收费。
- 抓取间隔默认 1.5 秒，别调小。
