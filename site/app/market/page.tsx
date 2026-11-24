import MarketBoard from "@/components/market-board";

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white">市场总览</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          价格为拍卖行<b className="text-slate-200">实际成交均价</b>（非挂单价）。2K27 的拍卖行分两个价格池：
          <b className="text-slate-200">主机</b>（PS / XBOX / SWITCH 合并计入）与 <b className="text-slate-200">PC</b>，
          两边价格互不相通，所以下面按端分开列。快照约每 <b className="text-slate-200">15 分钟</b>自动更新。
        </p>
      </div>
      <MarketBoard list="co" limit={15} />
      <MarketBoard list="pc" limit={15} />
    </div>
  );
}
