"""核心解析：从 2kdb 球员页（Next.js RSC 数据流）提取结构化卡片数据。

原理：页面 HTML 中所有 self.__next_f.push([1,"…"]) 的字符串字面量解码后拼接成
flight 文本，卡片对象形如 {"player":{...}}，可直接做字符串感知的大括号配对后
json.loads。卡面图地址藏在 <link rel=preload> 的 imgproxy URL 里。
"""
import json
import re
from typing import Any

PUSH_START = 'self.__next_f.push([1,'
CARD_ANCHOR = '{"player":{"relationId"'

# img.2kdb.net/{签名}/s:宽/0/f:webp/... /plain/local%3A%2F%2F%2Fimages%2Fplayers%2F{版本}}%2F{卡ID}.png
IMG_RE = re.compile(
    r'https://img\.2kdb\.net/[A-Za-z0-9_\-]+/s:(\d+):0[^"]*?/plain/'
    r'local%3A%2F%2F%2Fimages%2Fplayers%2F(\d+)%2F(\d+)\.png'
)


def extract_flight(html: str) -> str:
    """按顺序解码页面上所有 flight 字符串并拼接。手工扫描转义，避免正则误伤。"""
    parts: list[str] = []
    pos = 0
    while True:
        i = html.find(PUSH_START, pos)
        if i < 0:
            break
        q = html.find('"', i + len(PUSH_START))
        if q < 0:
            break
        j = q + 1
        while j < len(html):
            c = html[j]
            if c == "\\":
                j += 2
                continue
            if c == '"':
                break
            j += 1
        raw = html[q: j + 1]
        try:
            parts.append(json.loads(raw))
        except json.JSONDecodeError:
            parts.append(raw[1:-1])
        pos = j + 1
    return "".join(parts)


def match_object(text: str, start: int) -> str:
    """从 start（必须指向 '{'）做字符串感知的大括号配对，返回闭合子串。"""
    depth = 0
    instr = False
    esc = False
    j = start
    while j < len(text):
        c = text[j]
        if instr:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                instr = False
        else:
            if c == '"':
                instr = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start: j + 1]
        j += 1
    raise ValueError("未闭合的对象（页面结构可能变化）")


def parse_card(html: str) -> dict[str, Any]:
    """解析单卡。返回 {"card": {...原始字段...}, "image_candidates": [(宽, url, 版本, 卡id)]}"""
    flight = extract_flight(html)
    i = flight.find(CARD_ANCHOR)
    if i < 0:
        raise ValueError("未找到卡片数据锚点（页面可能不是球员详情页或已改版）")
    obj = match_object(flight, i)
    data = json.loads(obj)

    images: list[tuple[int, str, str]] = []
    seen: set[str] = set()
    for m in IMG_RE.finditer(html):
        width, ver, cid = m.group(1), m.group(2), m.group(3)
        url = m.group(0)
        if url not in seen:
            seen.add(url)
            images.append((int(width), url, f"{ver}{cid}"))
    return {"card": data["player"], "images": images}


def best_image(images: list[tuple[int, str, str]]) -> str | None:
    """取最高分辨率的卡面 URL（preload 里一般是 384 与 640 两档）。"""
    if not images:
        return None
    return max(images, key=lambda t: t[0])[1]
