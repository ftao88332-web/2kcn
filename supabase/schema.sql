-- 2kCN 数据库 Schema v1（Supabase / Postgres）
-- 直接在 Supabase SQL Editor 里整个执行即可。

create extension if not exists pg_trgm;

-- ============================================================ 卡片主表
create table if not exists cards (
  id            bigint primary key,            -- 2kdb 卡片 relationId
  player_id     bigint,                        -- 同一球员跨版本的公共 id
  version       text not null default '',      -- 2k24 / 2k25 / 2k26 / 2k27
  name          text not null default '',
  nickname      text,
  position      text,
  sec_position  text,
  overall       int,
  off_overall   int,
  def_overall   int,
  height_cm     numeric,
  weight_kg     numeric,
  wingspan_cm   numeric,
  team          text,
  collection    text,
  theme         text,
  tier          int,
  plays         jsonb,
  shoe          text,
  image_url     text,                          -- R2 公开图床地址
  attrs         jsonb,                         -- 数值属性（全量字典）
  badges        jsonb,                         -- 徽章等级 {slug: level}
  hotzones      jsonb,                         -- 14 个速度区
  stats         jsonb,                         -- 生涯统计等嵌套对象
  market        jsonb,                         -- mt/vc/salary/is_auctionable
  source_url    text,
  parsed_at     timestamptz,
  updated_at    timestamptz default now()
);

create index if not exists cards_version_idx  on cards (version);
create index if not exists cards_player_idx   on cards (player_id);
create index if not exists cards_name_trgm    on cards using gin (name gin_trgm_ops);
create index if not exists cards_overall_idx  on cards (overall desc);

-- ============================================================ 别名（中文译名/绰号/拼音缩写）
create table if not exists aliases (
  card_id   bigint not null references cards(id) on delete cascade,
  alias     text not null,                     -- 如 杜兰特 / KD / 老詹 / WBY
  kind      text not null default 'cn',        -- cn=中文译名 nick=绰号 py=拼音缩写 team_cn=球队
  primary key (card_id, alias)
);
create index if not exists aliases_gin on aliases using gin (alias gin_trgm_ops);

-- ============================================================ 每日行情快照
create table if not exists price_snapshots (
  card_id     bigint not null references cards(id) on delete cascade,
  ts          date   not null,
  mt          int,                             -- 2kdb 页上的 MT 标价（可交易卡）
  auctionable boolean,
  raw         jsonb,                           -- 快照当天的补充信息（ovr/ hạnied 等）
  primary key (card_id, ts)
);
create index if not exists price_ts_idx on price_snapshots (ts desc);

-- ============================================================ 版本规则（税率/上限/快售底价——每年变，做成配置）
create table if not exists rules (
  game        text primary key,                -- 2k27
  tax         numeric default 0.10,            -- 拍卖行税率
  caps        jsonb,                           -- 总评分档 → 挂单上限
  quicksell   jsonb,                           -- 总评分档 → 快速出售底价
  updated_at  timestamptz default now()
);
insert into rules (game, tax) values ('2k27', 0.10)
  on conflict (game) do nothing;

-- ============================================================ 抓取日志
create table if not exists scrape_log (
  id      bigint generated always as identity primary key,
  run_at  timestamptz default now(),
  kind    text,
  ok      int default 0,
  fail    int default 0,
  note    text
);

-- ============================================================ 只开放公开读，写入只走 service key（脚本端）
alter table cards           enable row level security;
alter table aliases         enable row level security;
alter table price_snapshots enable row level security;
alter table rules           enable row level security;
alter table scrape_log      enable row level security;

create policy "public read cards"    on cards           for select using (true);
create policy "public read aliases"  on aliases         for select using (true);
create policy "public read prices"   on price_snapshots for select using (true);
create policy "public read rules"    on rules           for select using (true);
