"use client";

import { useEffect, useState } from "react";
import { PricesDoc, withBase } from "@/lib/core";

let cache: PricesDoc | null = null;

/** 全站共享的 prices.json（只 fetch 一次）。
 *  query 用 5 分钟时间片：绕开 GitHub Pages 的 10 分钟 CDN 缓存，行情 15 分钟一更才看得见。 */
export function usePrices(): { doc: PricesDoc | null; loading: boolean } {
  const [doc, setDoc] = useState<PricesDoc | null>(cache);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) return;
    const slot = Math.floor(Date.now() / 300_000);
    fetch(withBase(`/data/prices.json?t=${slot}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PricesDoc) => { cache = d; setDoc(d); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  return { doc, loading };
}
