"""Supabase REST 写入（PostgREST）+ 图片上传 R2。没有凭据时自动降级为只写本地文件。"""
import json
import datetime as dt
import os
from typing import Any

import httpx

from .settings import S


class Stores:
    def __init__(self, dry_run: bool = False) -> None:
        self.dry = dry_run
        self.headers = {}
        self.stats = {"cards_upserted": 0, "snapshots_upserted": 0, "images_uploaded": 0}
        if S.sb_ready:
            self.headers = {
                "apikey": S.supabase_key or "",
                "Authorization": f"Bearer {S.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            }

    # ---------- Supabase ----------
    def upsert(self, table: str, rows: list[dict[str, Any]], on_conflict: str) -> None:
        if not rows:
            return
        if self.dry or not S.sb_ready:
            print(f"[dry] 跳过 upsert {table} x{len(rows)}（未配置 SUPABASE_URL/SERVICE_KEY）")
            for tbl_rows in [rows[i:i + S.batch_size] for i in range(0, len(rows), S.batch_size)]:
                self.stats["cards_upserted" if table == "cards" else "snapshots_upserted"] += len(tbl_rows)
            return
        url = f"{S.supabase_url}/rest/v1/{table}?on_conflict={on_conflict}"
        with httpx.Client(headers=self.headers, timeout=60) as client:
            for i in range(0, len(rows), S.batch_size):
                batch = rows[i:i + S.batch_size]
                resp = client.post(url, content=json.dumps(batch))
                resp.raise_for_status()
                self._bump(table, len(batch))

    def log_run(self, kind: str, ok: int, fail: int, note: str) -> None:
        if self.dry or not S.sb_ready:
            return
        try:
            self.upsert("scrape_log", [{"kind": kind, "ok": ok, "fail": fail,
                                       "note": note[:500],
                                       "run_at": dt.datetime.now(dt.timezone.utc).isoformat()}],
                        on_conflict="id")
        except Exception as exc:  # 日志失败不影响主流程
            print(f"[warn] scrape_log 写入失败: {exc}")

    def _bump(self, table: str, n: int) -> None:
        if table == "cards":
            self.stats["cards_upserted"] += n
        elif table == "price_snapshots":
            self.stats["snapshots_upserted"] += n

    # ---------- R2 ----------
    def upload_image(self, data: bytes, key: str, content_type: str = "image/webp") -> str | None:
        """上传 R2，返回公开 URL。没有凭据时返回 None 并把文件存到 out/images/。"""
        if self.dry or not S.r2_ready:
            self._save_local(key, data)
            return None
        import boto3
        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{S.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=S.r2_access_key,
            aws_secret_access_key=S.r2_secret,
        )
        s3.put_object(Bucket=S.r2_bucket, Key=key, Body=data,
                      ContentType=content_type, CacheControl="public, max-age=31536000")
        self.stats["images_uploaded"] += 1
        return f"{S.r2_public_base}/{key}"

    @staticmethod
    def _save_local(key: str, data: bytes) -> None:
        path = os.path.join(out_dir(), "images", key.replace("/", "__"))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as fh:
            fh.write(data)

    @property
    def summary(self) -> str:
        return json.dumps(self.stats, ensure_ascii=False)


def out_dir() -> str:
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
    os.makedirs(d, exist_ok=True)
    return d

