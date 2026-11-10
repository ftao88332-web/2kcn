import MarketBoard from "@/components/market-board";

export default function MarketPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">市场总览</h1>
      <p className="max-w-2xl text-sm text-slate-400">
        价格为拍卖行<b className="text-slate-200">实际成交均价</b>（非挂单价），双平台合并显示，
        可在球员页查看分平台价格与最近 20 笔成交。快照约每 <b className="text-slate-200">15 分钟</b>自动更新
        （GitHub 定时任务，偶尔会晚几分钟），每张卡下方标注自己的更新时间。
      </p>
      <MarketBoard limit={30} />
    </div>
  );
}
