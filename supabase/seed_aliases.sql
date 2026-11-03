-- 别名种子示例（中文名/绰号/拼音缩写）——补 alias 就是补搜索体验。
-- 没有 alias 的卡片照样能用英文名搜索；这里只写最常见的。
-- INSERT 前请先跑抓取器把对应卡解析进 cards 表。

insert into aliases (card_id, alias, kind) values
  (2761654, '唐斯', 'cn'),
  (2761654, 'KAT', 'nick'),
  (2755398, '诺阿', 'cn')
on conflict (card_id, alias) do nothing;
