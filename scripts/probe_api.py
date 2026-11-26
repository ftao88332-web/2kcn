import json
import re

import httpx

URL = "https://2kdb.net/api/trpc/players.getPlayersForTable"
H = {"User-Agent": "2kcn-scraper/0.2"}
INPUT = json.dumps({"json": {"limit": 3, "page": 0}})

for qs in ({"input": INPUT}, {"batch": "1", "input": '{"0":' + INPUT + "}"}):
    r = httpx.get(URL, params=qs, headers=H, timeout=30)
    print("status", r.status_code, "len", len(r.text))
    if r.status_code == 200:
        print(r.text[:600])
        keys = sorted(set(re.findall(r'"([A-Za-z_][A-Za-z0-9_]*)"', r.text)))
        print("keys:", keys[:60])
        break
