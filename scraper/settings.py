"""配置：读取环境变量；缺省值即可跑通抓取与本地打包。"""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # 卡面图直接打包进站点 site/public/img/...（零账号依赖，任何人打开即可看到）
    site_public_dir: str = os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "public", "img")
    )

    # 运行参数
    base: str = "https://2kdb.net"
    ua: str = "2kcn-scraper/0.1 (github repo: local; contact: you@example.com)"
    delay_s: float = float(os.environ.get("SCRAPE_DELAY", "1.5"))   # 每次请求间隔（礼貌抓取）
    timeout_s: float = 30.0


S = Settings()
