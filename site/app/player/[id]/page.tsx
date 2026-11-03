import Link from "next/link";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/types";
import PlayerDetail from "@/components/player-detail";

/** 服务端页：为索引内每张卡生成静态占位页；详情数据由客户端组件拉取/兜底 */
export function generateStaticParams() {
  return (cards as unknown as IndexCard[]).map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const card = (cards as unknown as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) return { title: "2K中文库" };
  return {
    title: `${card.name} ${card.overall} OVR | 2K中文库`,
    description: `${card.name} ${card.version} ${card.overall}OVR、属性徽章与行情快照。`,
  };
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const card = (cards as unknown as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) {
    return (
      <p className="text-sm text-slate-400">
        该卡还没被抓取。回 <Link href="/players/" className="text-accent">卡库</Link> 逛逛。
      </p>
    );
  }
  return <PlayerDetail id={params.id} fallback={card} />;
}
