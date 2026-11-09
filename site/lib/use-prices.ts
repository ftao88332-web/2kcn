"use client";

import { useEffect, useState } from "react";
import { PricesDoc, withBase } from "@/lib/core";

let cache: PricesDoc | null = null;

/** 全站共享的 prices.json（只 fetch 一次）。 */
export function usePrices(): { doc: PricesDoc | null; loading: boolean } {
  const [doc, setDoc] = useState<PricesDoc | null>(cache);
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    if (cache) return;
    fetch(withBase("/data/prices.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PricesDoc) => { cache = d; setDoc(d); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);
  return { doc, loading };
}
