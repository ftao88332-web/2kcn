import Link from "next/link";
import { useEffect, useState } from "react";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/types";
import { ovrColor } from "@/lib/format";
import { supa } from "@/lib/supabase";
import { DetailCard, PriceSnapshot } from "@/lib/types";
import PriceChart from "@/components/price-chart";

/** 静态导出时为索引里每张卡生成一个占位页；详情数据在客户端从 Supabase 拉。 */
export function generateStaticParams() {
  return (cards as IndexCard[]).map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const card = (cards as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) return { title: "2K中文库" };
  return {
    title: `${card.name} ${card.overall} OVR | 2K中文库`,
    description: `${card.name} ${card.version} ${card.overall}OVR、属性徽章与行情快照。`,
  };
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const card = (cards as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) {
    return (
      <p className="text-sm text-slate-400">
        该卡还没被抓取。回 <Link href="/players/" className="text-accent">卡库</Link> 逛逛。
      </p>
    );
  }
  return <PlayerDetail id={params.id} fallback={card} />;
}

function PlayerDetail({ id, fallback }: { id: string; fallback: IndexCard }) {
  const [detail, setDetail] = useState<DetailCard | null>(null);
  const [prices, setPrices] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supa();
      if (!sb) {
        setLoading(false);
        return; // 未配置 Supabase：只显示索引里的静态信息
      }
      const [d, p] = await Promise.all([
        sb.from("cards").select("*").eq("id", Number(id)).maybeSingle(),
        sb.from("price_snapshots")
          .select("ts,mt,auctionable")
          .eq("card_id", Number(id))
          .order("ts", { ascending: false })
          .limit(90),
      ]);
      if (d.data) setDetail(d.data as DetailCard);
      if (p.data) setPrices(p.data as PriceSnapshot[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  const attrs = detail?.attrs ?? {};
  return (
    <div className="space-y-6">
      <div className="flex gap-4 rounded-2xl border border-court-700 bg-court-800 p-5">
        {detail?.image_url || fallback.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={detail?.image_url ?? fallback.image ?? ""}
            alt={fallback.name}
            className="h-36 w-32 rounded-lg object-cover"
          />
        ) : null}
        <div>
          <p className={`text-4xl font-black ${ovrColor(detail?.overall ?? fallback.overall)}`}>
            {detail?.overall ?? fallback.overall} OVR
          </p>
          <h1 className="mt-1 text-xl font-bold text-white">{fallback.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {fallback.version} · {fallback.theme ?? ""} · {fallback.position}
            {fallback.sec ? `/${fallback.sec}` : ""}
          </p>
          {detail?.height_cm ? (
            <p className="mt-1 text-xs text-slate-500">
              身高 {(detail.height_cm / 100).toFixed(2)}m · 臂展{" "}
              {detail.wingspan_cm ? (detail.wingspan_cm / 100).toFixed(2) : "?"}m · 体重{detail.weight_kg}kg
            </p>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">行情</h2>
        <div className="rounded-xl border border-court-700 bg-court-800 p-4">
          <PriceChart prices={[...prices].reverse()} />
          <p className="mt-2 text-xs text-slate-500">
            MT 标价历史（每日快照）。可交易卡才有价格，未配置 Supabase 时无数据。
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">属性</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(attrs).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-court-700/60 py-1">
              <span className="truncate text-slate-400">{k}</span>
              <span className="font-semibold text-slate-100">{v ?? "-"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
