"""tRPC 实时行情管线：2kdb 的 auctionHouse 接口直接可用（无需登录）。

发现的接口（GET，可 batch）：
  /api/trpc/players.getPlayerPriceSummary?input={"0":{"json":{"relationId":<id>,"version":"27"}}}
    -> {averagePrice, salesCount, averagePrices[平台], latestSales[20], priceTrends[平台][点]}
  /api/trpc/auctionHouse.getMarketOverview,...?batch=1&input=...
    -> {mostActive: [{averagePrice, salesCount, totalVolume, lastSaleAt, player{relationId,name,...}}]}
策略：每轮 = 活跃卡(top) ∪ tracked ∪ 库内 OVR≥90 的卡，逐批拉单卡 summary，
写入 price_snapshots(有凭据)+ site/public/data/prices.json（站点直接读=打开即出价）。
"""
import datetime as dt
import json
import urllib.parse
from typing import Any

from .http_client import Client
from .mappers import public_dir
from .settings import S

TRPC = f"{S.base}/api/trpc"
PRICE_DELAY = 1.2  # 对上游的礼貌间隔


class MarketSnapshot(dict):
    pass


def _trpc_get(http: Client, proc: str, inputs: list[dict], ) -> list[Any]:
    """调用 tRPC，inputs 顺序对应 procedure 名列表(单过程)或 batch 并列(过程同名)。"""
    if isinstance(proc, str):
        proc = [proc] * len(inputs)
    body = {str(i): {"json": item} for i, item in enumerate(inputs)}
    url = (f"{TRPC}/" + ",".join(proc) +
           f"?batch=1&input={urllib.parse.quote(json.dumps(body, separators=(',', ':')), safe='')}")
    resp = http.get(url)
    data = resp.json()
    out: list[Any] = []
    for item in data:
        res = item.get("result", {}).get("data", {}).get("json")
        out.append(res)
    return out


def fetch_price(http: Client, relation_id: int, version: str = "27") -> dict | None:
    """单卡价格 summary；失败返回 None"""
    try:
        rows = _trpc_get(http, "players.getPlayerPriceSummary",
                         [{"relationId": relation_id, "version": version}])
        return rows[0]
    except Exception as exc:
        print(f"[warn] price {relation_id}: {exc}")
        return None


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
    """summary → prices.json 里的卡条目"""
    if not summary:
        return {}
    plats = {p.get("platform"): p.get("averagePrice") for p in (summary.get("averagePrices") or [])}
    trends = {p.get("platform"): (p.get("points") or [])[-12:] for p in (summary.get("priceTrends") or [])}
    latest = (summary.get("latestSales") or [])[:6]
    return {
        "a": summary.get("averagePrice"),            # 双平台均价
        "s": summary.get("salesCount"),              # 销量
        "u": ts_iso,                                  # 更新时刻
        "pc": plats.get("pc"), "co": plats.get("consoles"),
        "tr": trends.get("consoles") or trends.get("pc") or [],
        "sales": [
            {"b": s.get("current_high_bid"), "o": s.get("buyout_value") or None,
             "t": (s.get("endtime_utc") or "")[:16].replace("T", " ")}
            for s in latest if s.get("current_high_bid") is not None
        ],
    }


def snapshot(http: Client, card_ids: list[int], stores, version: str = "27",
             batch_size: int = 8) -> dict[int, dict]:
    """批量拉价格 → 返回 {卡id: compact}；stores 用于写库/写站数据。"""
    import time as _t
    result: dict[int, dict] = {}
    now_iso = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    snap_rows: list[dict] = []
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
            snap_rows.append({
                "card_id": cid, "ts": dt.date.today().isoformat(),
                "mt": summ.get("averagePrice"), "auctionable": True,
                "raw": {"sales_count": summ.get("salesCount"),
                        "updated": now_iso,
                        "top_bid": (summ.get("latestSales") or [{}])[0].get("current_high_bid")},
            })
        _t.sleep(PRICE_DELAY)
    if snap_rows:
        stores.upsert("price_snapshots", snap_rows, on_conflict="card_id,ts")
    return result


def write_site_prices(prices: dict[int, dict], active: list[dict] | None = None) -> None:
    """prices + 活跃榜 → site/public/data/prices.json。"""
    payload = {"ts": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "cards": {str(k): v for k, v in prices.items()},
               "active": active or []}
    path = public_dir() + "/prices.json"
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"site/public/data/prices.json 已写 {len(payload['cards'])} 卡 / active {len(payload['active'])}")
