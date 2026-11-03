import { createClient } from "@supabase/supabase-js";

/** 浏览器端只读客户端（anon key）。没配置环境变量时返回 null，页面自动降级到本地数据。 */
export function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
