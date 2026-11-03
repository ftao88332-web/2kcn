"""礼貌的 HTTP 客户端：带重试、限速。"""
import random
import time

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from .settings import S


class Client:
    def __init__(self) -> None:
        self.http = httpx.Client(
            headers={"User-Agent": S.ua,
                     "Accept-Language": "en-US,en;q=0.9"},
            timeout=S.timeout_s,
            follow_redirects=True,
        )

    @retry(reraise=True, stop=stop_after_attempt(3),
           wait=wait_exponential(multiplier=2, min=2, max=20),
           retry=retry_if_exception_type((httpx.HTTPError, httpx.StreamError)))
    def get(self, url: str) -> httpx.Response:
        resp = self.http.get(url)
        resp.raise_for_status()
        time.sleep(S.delay_s + random.uniform(0, 0.8))  # 限速抖动
        return resp

    def get_binary(self, url: str) -> bytes:
        resp = self.get(url)
        return resp.content
