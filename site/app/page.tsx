import Link from "next/link";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/types";
import CardTile from "@/components/card-tile";

export default function Home() {
  const list = (cards as IndexCard[]).slice(0, 12);
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-court-700 bg-court-800 p-6">
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          NBA 2K 中文数据库 <span className="text-accent">· 行情搬砖工具</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          卡片数据、每日行情快照、无风险套利名单（低于快速出售底价的挂单）。中文搜索球员绰号、
          拼音缩写，数据每天自动同步。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/players/"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-court-900 hover:brightness-110"
          >
            浏览卡库
          </Link>
          <Link
            href="/market/"
            className="rounded-lg border border-court-600 px-4 py-2 text-sm text-slate-200 hover:border-accent/60"
          >
            市场总览
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">高总评卡片</h2>
        {list.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((c) => (
              <CardTile key={c.id} card={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            数据还在抓取中。跑一次 <code className="text-slate-300">python -m scraper.main daily</code> 后这里就有卡了。
          </p>
        )}
      </section>
    </div>
  );
}
