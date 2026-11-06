"""本地文件存储：卡面图打包进 site/public/img，数据池写 scraper/out。"""
import os

from .settings import S


def save_image(data: bytes, key: str) -> str:
    """把卡面图写进站点静态目录，返回站内相对 URL（/img/...）。"""
    path = os.path.join(S.site_public_dir, *key.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(data)
    return f"/img/{key}"


def out_dir() -> str:
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
    os.makedirs(d, exist_ok=True)
    return d
