"""配置：全部来自环境变量，缺什么就自动降级（跳过对应能力）。"""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # Supabase（写库需要 service role key，只放在 CI/本地环境变量里，绝不提交）
    supabase_url: str | None = os.environ.get("SUPABASE_URL") or None
    supabase_key: str | None = os.environ.get("SUPABASE_SERVICE_KEY") or None

    # Cloudflare R2（图床，S3 兼容）
    r2_account_id: str | None = os.environ.get("R2_ACCOUNT_ID") or None
    r2_access_key: str | None = os.environ.get("R2_ACCESS_KEY_ID") or None
    r2_secret: str | None = os.environ.get("R2_SECRET_ACCESS_KEY") or None
    r2_bucket: str | None = os.environ.get("R2_BUCKET") or None
    # 公开访问域名（R2 公开桶或你的自定义图床域），形如 https://img.example.com
    r2_public_base: str | None = (os.environ.get("R2_PUBLIC_BASE") or "").rstrip("/") or None

    # 运行参数
    base: str = "https://2kdb.net"
    ua: str = "2kcn-scraper/0.1 (github repo: local; contact: you@example.com)"
    delay_s: float = float(os.environ.get("SCRAPE_DELAY", "1.5"))      # 每次请求间隔（礼貌抓取）
    timeout_s: float = 30.0
    new_limit: int = int(os.environ.get("NEW_LIMIT", "40"))           # 每日新解析新卡数量
    batch_size: int = 400                                             # Supabase 单次 upsert 行数上限

    @property
    def sb_ready(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def r2_ready(self) -> bool:
        return bool(self.r2_account_id and self.r2_access_key and self.r2_secret
                    and self.r2_bucket and self.r2_public_base)


S = Settings()
