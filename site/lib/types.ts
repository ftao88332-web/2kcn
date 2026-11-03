export type IndexCard = {
  id: number;
  playerId: number | null;
  name: string;
  version: string;
  overall: number | null;
  position: string | null;
  sec: string | null;
  team: string | null;
  theme: string | null;
  collection: string | null;
  image: string | null;
  mt: number | null;
  auctionable: boolean | null;
};

export type DetailCard = {
  id: number;
  name: string;
  version: string;
  overall: number | null;
  attrs: Record<string, number | null> | null;
  badges: Record<string, number | null> | null;
  hotzones: Record<string, number | null> | null;
  height_cm: number | null;
  weight_kg: number | null;
  wingspan_cm: number | null;
  parsed_at: string | null;
  image_url: string | null;
};

export type PriceSnapshot = { ts: string; mt: number | null; auctionable: boolean | null };
