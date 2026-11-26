"""tRPC 实时行情管线：2kdb 的 auctionHouse 接口直接可用（无需登录）。

发现的接口（GET，可 batch）：
  /api/trpc/players.getPlayerPriceSummary?input={"0":{"json":{"relationId":<id>,"version":"27"}}}
    -> {averagePrice, salesCount, averagePrices[平台], latestSales[20], priceTrends[平台][点]}
  /api/trpc/auctionHouse.getMarketOverview,...?batch=1&input=...
    -> {mostActive: [{averagePrice, salesCount, totalVolume, lastSaleAt, player{relationId,name,...}}]}
策略：每轮 = 活跃卡(top) ∪ tracked ∪ 库内 OVR≥90 的卡，逐批拉单卡 summary，
写入 site/public/data/prices.json（站点直接读=打开即出价）。
"""
import datetime as dt
import json
import os
import urllib.parse
from typing import Any

from .common import Client, S

TRPC = f"{S.base}/api/trpc"


def _trpc_get(http: Client, procs: list[str], inputs: list[dict]) -> list[Any]:
    """调用 tRPC：procs 与 inputs 一一对应（batch 并列）。"""
    body = {str(i): {"json": item} for i, item in enumerate(inputs)}
    url = (f"{TRPC}/" + ",".join(procs) +
           f"?batch=1&input={urllib.parse.quote(json.dumps(body, separators=(',', ':')), safe='')}")
    resp = http.get(url)
    data = resp.json()
    out: list[Any] = []
    for item in data:
        res = item.get("result", {}).get("data", {}).get("json")
        out.append(res)
    return out


def fetch_market_overview(http: Client, version: str = "27", range_: str = "day",
                          platform: str = "consoles") -> dict | None:
    try:
        rows = _trpc_get(http, ["auctionHouse.getMarketOverview"],
                         [{"version": version, "range": range_, "platform": platform}])
        return rows[0]
    except Exception as exc:
        print(f"[warn] overview: {exc}")
        return None


def compact_price(summary: dict, ts_iso: str) -> dict:
    """summary → prices.json 里的卡条目

    2K27 的拍卖行只有两个价格池（2kdb 源码 v>=27 同样是 ["consoles","pc"]）：
      consoles = 主机（PS / Xbox / Switch 合并），pc = PC。
    """
    if not summary:
        return {}
    plats = {p.get("platform"): p for p in (summary.get("averagePrices") or [])}
    trends = {p.get("platform"): (p.get("points") or [])[-30:] for p in (summary.get("priceTrends") or [])}
    latest = (summary.get("latestSales") or [])[:6]
    co, pc = plats.get("consoles") or {}, plats.get("pc") or {}
    return {
        "a": summary.get("averagePrice"),            # 两池综合均价
        "s": summary.get("salesCount"),              # 总成交笔数
        "u": ts_iso,                                  # 更新时刻
        "co": co.get("averagePrice"), "pc": pc.get("averagePrice"),
        "cos": co.get("salesCount"), "pcs": pc.get("salesCount"),
        "tr": trends.get("consoles") or [],
        "tp": trends.get("pc") or [],
        "sales": [
            {"b": s.get("current_high_bid"), "o": s.get("buyout_value") or None,
             "t": (s.get("endtime_utc") or "")[:16].replace("T", " "),
             "p": s.get("platform")}
            for s in latest if s.get("current_high_bid") is not None
        ],
    }


def snapshot(http: Client, card_ids: list[int], version: str = "27",
             batch_size: int = 8) -> dict[int, dict]:
    """批量拉价格 → 返回 {卡id: compact}。间隔由 Client 统一控制（SCRAPE_DELAY）。"""
    result: dict[int, dict] = {}
    now_iso = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for i in range(0, len(card_ids), batch_size):
        chunk = card_ids[i:i + batch_size]
        inputs = [{"relationId": cid, "version": version} for cid in chunk]
        urls_procedures = ["players.getPlayerPriceSummary"] * len(chunk)
        try:
            rows = _trpc_get(http, urls_procedures, inputs)
        except Exception as exc:
            print(f"[warn] batch {chunk[:2]}: {exc}")
            rows = [None] * len(chunk)
        for cid, summ in zip(chunk, rows):
            if not summ:
                continue
            result[cid] = compact_price(summ, now_iso)
    return result


def write_site_prices(prices: dict[int, dict], active: list[dict] | None = None,
                      active_pc: list[dict] | None = None) -> None:
    """prices + 两个端各自的活跃榜 → site/public/data/prices.json。"""
    payload = {"ts": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "cards": {str(k): v for k, v in prices.items()},
               "active": active or [],
               "activePc": active_pc or []}
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "..", "site", "public", "data", "prices.json")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"site/public/data/prices.json 已写 {len(payload['cards'])} 卡 / active {len(payload['active'])}")
