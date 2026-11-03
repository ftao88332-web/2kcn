# 2kCN · 国内版 NBA 2K MyTEAM 数据库 / 行情搬砖工具

零成本技术栈：GitHub Actions（定时抓取）→ Supabase（数据库）→ Cloudflare R2（卡面图）→ Cloudflare Pages（静态站）。
方案文档：[`国内版2KDB建站方案.md`](./国内版2KDB建站方案.md) / [`MVP方案-交易行情搬砖工具.md`](./MVP方案-交易行情搬砖工具.md)

## 目录结构

```
├── scraper/            # Python 抓取器（核心）
│   ├── flight.py       #   解析 2kdb 页面 RSC 数据流（属性/徽章/行情一次全解）
│   ├── main.py         #   CLI：parse / daily / index
│   ├── stores.py       #   Supabase 写库 + R2 传图（无凭据自动降级为本地 dry-run）
│   ├── tracked_ids.json#   你盯的卡 id 列表 → 每天快照行情进 price_snapshots
│   └── out/            #   cards_full.json（本地数据池，随 git 提交）
├── supabase/
│   ├── schema.sql      #   建表 + 只读 RLS，SQL Editor 里整体执行一次
│   └── seed_aliases.sql#   中文名/绰号 别名词表
├── site/               # Next.js 静态导出站点（output: "export"）
│   ├── app/            #   首页 / 卡库 / 卡片详情 / 市场总览
│   └── data/cards.json #   抓取器生成的全量索引（站内搜索用）
└── .github/workflows/scrape.yml  # 每天 10:20 / 22:20（北京）自动抓取并提交数据
```

## 本地跑通（10 分钟）

```bash
# 1) 抓取器
cd E:\wy\2k
python -m venv .venv && .venv\Scripts\activate        # Windows
pip install -r scraper/requirements.txt

# 完全免费试跑（无任何凭据）：解析一张卡，输出 JSON
curl -sS https://2kdb.net/player/2761654 -o test.html
python -m scraper.main parse test.html --save        # 同时写入 site/data/cards.json

# 2) Supabase（免费档）
#    新建项目 → SQL Editor → 粘贴 supabase/schema.sql 执行
#    Settings → API：拿到 URL / service_role key / anon key

# 3) 带凭据真正跑起来
copy .env.example .env   # 填 SUPABASE_URL / SUPABASE_SERVICE_KEY / R2_* 
python -m scraper.main daily                 # 新卡 + tracked 快照
python -m scraper.main daily --new-limit 300 # 首跑多喂一些

# 4) 站点
cd site
copy .env.example .env.local                 # 填 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
npm ci
npm run dev    # http://localhost:3000
npm run build  # 产物在 site/out/
```

## 上线（Cloudflare Pages + Actions，全部免费层）

1. **推仓库** → GitHub（public 即可；`cards_full.json`/`cards.json` 会随 Actions 提交回仓库）。
2. **Supabase**：执行 `supabase/schema.sql`；把 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY` 配到 GitHub repo Secrets。
3. **R2 图床**：Cloudflare 控制台建桶 + `R2_PUBLIC_BASE` 公开域，密钥配 Secrets（没有 R2 也能跑，图片先落本地 `scraper/out/images/`）。
4. **GitHub Actions**：Push 后等 cron，或手动 Run workflow 验证（会自动提交数据进仓库）。
5. **Cloudflare Pages**：连接该 repo，构建命令 `cd site && npm ci && npm run build`，输出目录 `site/out`；`NEXT_PUBLIC_*` 两个变量配到 Pages 的环境变量。
6. 以后要更好 SEO/速度：花 ¥60/年 上自定义域名挂到 Pages。

## 每周迭代清单（第一周目标：抓数开始跑）

- [x] 仓库骨架 + 抓取/建站/CI 全链路
- [x] 解析器已对 2kdb 线上页面验证（单卡 213 数值字段、速度区、身份字段）
- [ ] 首跑 `daily --new-limit 2000`，把 2K27 全卡灌进去
- [ ] `tracked_ids.json` 加 10~30 张你盯的卡，开始积累价格历史（**早一天是一天**）
- [ ] 补 `fields.json` 的 badge_slugs 词表（区分徽章/属性分桶）
- [ ] 补 alias 词表（先在 supabase/seed_aliases.sql 加 30 个球星常见中文）
- [ ] 涨跌幅榜：基于 price_snapshots 的相邻日聚合 SQL
- [ ] 百度收录：site/sitemap 待做

## 边界与红线

- 图片资产归 2K Sports；MVP 期不挂广告不收费；页脚已带免责声明 + 投诉邮箱。
- 抓取节奏默认 1.2~1.5 秒/请求，别调小；上游是个人站，磕着用。
- 每年换作代表时机制参数（税率/上限/快售底价）改 `rules` 表，不动代码。
