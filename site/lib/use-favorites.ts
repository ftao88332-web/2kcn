"use client";

import { useCallback, useEffect, useState } from "react";

const STORE = "fav_v1";
const isBrowser = typeof window !== "undefined";

function read(): Set<number> {
  if (!isBrowser) return new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || "[]");
    return new Set((Array.isArray(raw) ? raw : []).map(Number).filter(Boolean));
  } catch {
    return new Set();
  }
}

/** 本地收藏夹（localStorage），跨页面共享。 */
export function useFavorites() {
  const [favs, setFavs] = useState<Set<number>>(() => (typeof window === "undefined" ? new Set() : read()));

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify([...favs]));
  }, [favs]);

  const toggle = useCallback((id: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const has = useCallback((id: number) => favs.has(id), [favs]);

  return { favs: [...favs], toggle, has };
}
