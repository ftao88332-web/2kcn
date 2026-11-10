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
  publish_prices.py   只把 prices.json 写到 gh-pages（不重建站点）
site/
  app/                首页 / 卡库 / 详情 / 市场 / 阵容
  components/         卡片瓦片、详情区块（属性/徽章/半场热区）、行情面板
  lib/core.ts         类型、路径、行情读取
  lib/i18n.ts         中英文词表
  public/img/         卡面图（自托管）
  public/data/        prices.json
.github/workflows/    抓取 + 构建发布 + 15 分钟行情
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
`prices` 每 15 分钟只更新 `gh-pages/data/prices.json`，不触发整站重建。
整站发布前会跑 `scripts/keep_prices.py`：线上行情比仓库新就沿用线上的，避免把 15 分钟快照冲掉。

> 注意：GitHub 的 `schedule` 在本仓库经常延迟数小时（`scrape` 的两次日常任务实测晚 5–7 小时），
> 所以 15 分钟只是「触发目标」，实际刷新以线上 `prices.json` 的 `ts` 为准。

### 外部定时器（让 15 分钟真的成立）

用 cron-job.org（免费）每 15 分钟调一次 `workflow_dispatch`，绕开 GitHub 的调度延迟：

- URL：`https://api.github.com/repos/ftao88332-web/2kcn/actions/workflows/prices.yml/dispatches`
- Method：`POST`
- Headers：`Authorization: Bearer <fine-grained PAT，仅勾 Actions: read/write>`
  、`Accept: application/vnd.github+json`、`Content-Type: application/json`
- Body：`{"ref":"main"}`
- 间隔：15 分钟（PAT 有效期最长 1 年，到期记得换）

GitHub 自带的 cron 留着当兜底，重复触发无副作用（`concurrency` 会取消旧的那次）。

## 阵容

`/lineup/` 纯前端：15 人（5 首发 + 10 替补），`localStorage` 持久化，
`#lu=` 链接分享，按最新行情自动算总造价，可导出 PNG。

## 边界

- 卡图版权归 2K Sports；不挂广告、不收费。
- 抓取间隔默认 1.5 秒，别调小。
