import Link from "next/link";
import cards from "@/data/cards.json";
import { IndexCard } from "@/lib/core";
import PlayerDetail from "@/components/player-detail";

/** 兼容路由 /card/:id，与 /player/:id 共用同一套详情组件与静态参数。 */
export function generateStaticParams() {
  return (cards as unknown as IndexCard[]).map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const card = (cards as unknown as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) return { title: "2K Card Lab" };
  return {
    title: `${card.name} ${card.overall} OVR | 2K Card Lab`,
    description: `${card.name} ${card.version} ${card.overall}OVR、属性徽章与行情快照。`,
  };
}

export default function CardPage({ params }: { params: { id: string } }) {
  const card = (cards as unknown as IndexCard[]).find((c) => String(c.id) === params.id);
  if (!card) {
    return (
      <p className="text-sm text-slate-400">
        该卡还没被抓取。回 <Link href="/players/" className="text-accent">卡库</Link> 逛逛。
      </p>
    );
  }
  return <PlayerDetail card={card} />;
}
