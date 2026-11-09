"""基础设施：配置、HTTP 客户端、本地存储。"""
import os
import random
import time
from dataclasses import dataclass

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


@dataclass(frozen=True)
class Settings:
    base: str = "https://2kdb.net"
    ua: str = "2kcn-scraper/0.2"
    delay_s: float = float(os.environ.get("SCRAPE_DELAY", "1.5"))
    timeout_s: float = 30.0
    img_dir: str = os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "public", "img")
    )


S = Settings()


class Client:
    """带重试与礼貌间隔的 HTTP 客户端。"""

    def __init__(self) -> None:
        self.http = httpx.Client(
            headers={"User-Agent": S.ua, "Accept-Language": "en-US,en;q=0.9"},
            timeout=S.timeout_s,
            follow_redirects=True,
        )

    @retry(reraise=True, stop=stop_after_attempt(3),
           wait=wait_exponential(multiplier=2, min=2, max=20),
           retry=retry_if_exception_type((httpx.HTTPError, httpx.StreamError)))
    def get(self, url: str) -> httpx.Response:
        resp = self.http.get(url)
        resp.raise_for_status()
        time.sleep(S.delay_s + random.uniform(0, 0.8))
        return resp

    def get_binary(self, url: str) -> bytes:
        return self.get(url).content


def save_image(data: bytes, key: str) -> str:
    """卡面图写入站点静态目录，返回站内路径 /img/...。"""
    path = os.path.join(S.img_dir, *key.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(data)
    return f"/img/{key}"


def out_dir() -> str:
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
    os.makedirs(d, exist_ok=True)
    return d
