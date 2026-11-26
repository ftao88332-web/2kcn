import PlayersPage from "../players/page";

/** 兼容路由 /cards，与 /players 共用同一套卡库页面。 */
export default function CardsPage() {
  return <PlayersPage />;
}
