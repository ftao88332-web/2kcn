# 2K Card Lab · NBA 2K MyTEAM 数据平台

线上：<https://ftao88332-web.github.io/2kcn/>

品牌：**2K Card Lab**（简称 Card Lab）· 中文副标题「NBA 2K MyTEAM 数据平台」·
英文描述「MyTEAM Database & Market Analytics」· 默认简体中文 / Dark 主题。
（旧名「2K 中文库」已停用。）

纯静态、零成本：GitHub Actions 抓取 → Next.js 导出 → `gh-pages`。
只收录 **2K27**，没有数据库、没有图床、没有服务器。

## 结构

```
scraper/
  common.py           配置 + HTTP 客户端 + 图片存储
  parse.py            页面解析 + 字段规范化（统一单位：height/wingspan=cm，weight 同时存 lb 与 kg）
  main.py             CLI：parse / full27 / rescrape / market
  market.py           实时行情 → site/public/data/prices.json
  out/cards_full.json 唯一数据源（卡池）
scripts/
  build_index.py      cards_full → cards.json / cards_index.json / badge_index.json
  publish_prices.py   只把 prices.json 写到 gh-pages（不重建站点）
site/
  app/                首页 / 球员卡 / 详情 / 市场 / 比较 / 阵容 / 更新 / 徽章库
  components/         卡片瓦片、统一徽章组件、详情 Tabs、行情面板
  lib/data/badges.2k27.json  徽章词库（53 条官方词库 + 15 条词库外）
  lib/badge-lexicon.ts       徽章名称/分类/等级查询
  lib/services/              卡库、徽章、单位等服务层（全站共用）
  lib/i18n.ts         属性/卡种/动作包词表（不再维护徽章译名）
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

## 行情

2K27 的拍卖行只有**两个价格池**（2kdb 前端源码 v≥27 同样写着 `["consoles","pc"]`）：

- **主机** `consoles`：PS / Xbox / Switch 合并计入
- **PC** `pc`：Steam

两边价格互不相通，所以卡片瓦片、球员详情、市场总览都按端分别显示，
`prices.json` 里每张卡同时带 `co` / `pc`（均价）、`cos` / `pcs`（成交笔数）、`tr` / `tp`（走势）。

## 阵容

`/lineup/` 纯前端：15 人 = 3 组 × 5 个位置（PG SG SF PF C 各 3 人，首发 / 替补 / 替补续），
卡可打主位置和副位置（副位置也能落位）；阵容会提示缺位置 / 缺中锋 / 人数不足；
槽位显示卡面图，`localStorage` 持久化，`#lu=` 链接分享，按主机价或 PC 价算总造价，可导出带卡面的 PNG。

## 卡库与市场

- `/cards/`（兼容 `/players/`）：名称 / 总评区间 / 位置 / 卡种 / 系列 / 徽章数区间 / **指定徽章** /
  价格区间 / 可交易 / 进化 / 双人组 等维度筛选；卡片 / 表格双视图；支持收藏夹（`localStorage`）。
  所有筛选条件同步到 URL（`?pos=PG,SG&minOvr=95&...`），刷新与分享可还原。
- `/market/`：市场概况（活跃卡、成交总量、均价、最近更新）+ 活跃成交 / 价格最高 / 成交量 / 涨幅 / 跌幅榜，主机 / PC 可切换。
- 详情页 `/card/:id/`（兼容 `/player/:id/`）：六个 Tab —— 概览 / 属性 / 徽章 / 动作包 / 热区 / 行情。
- `/compare/`：2–4 张卡横向对比，含独有徽章与主机 / PC 价格。
- `/lineup/`：15 人阵容，平均总评 + 总造价，缺价明确提示不按 0 计。

## 徽章词库（V1.0 定版）

徽章名称与等级**只有一份来源**：`site/lib/data/badges.2k27.json`。

- 53 条采用 [2kAuction 2K27 简体中文词库](https://2kauction.com/zh-hans/badges?game=2k27)（`translation_status: source_adopted`），
  分类：终结 11 / 投篮 9 / 组织 10 / 防守 12 / 篮板 5 / 体格 6。
- 15 条性格类徽章不在该词库内，沿用站内既有译名并标 `legacy_unverified`，待官方核对后按 `badge_id` 更新。
- 旧译名不丢弃，作为搜索别名保留（如 `aerial_wizard` → 正式名「空中作业」，别名「空中魔术师」）。
- 徽章等级固定：青铜 / 白银 / 黄金 / 名人堂，另保留「传奇」（仅 2K27 G.O.A.T. 卡出现，词库未定义该档）。
  **徽章等级与卡片宝石档位是两套完全独立的体系**，不得互相替代。
- 所有页面（详情 / 卡库筛选 / 比较器 / 徽章库）统一使用 `components/badge-item.tsx` 与 `lib/services/badges.ts`，
  不允许各页另存词表。
- 数据层关系：`Card` 存 `gem_tier`（宝石档），`CardBadge` 存 `badge_id + tier`（徽章等级），互不混用。

## 边界

- 卡图版权归 2K Sports；不挂广告、不收费。
- 抓取间隔默认 1.5 秒，别调小。
