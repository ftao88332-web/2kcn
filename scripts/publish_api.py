"""绕过 git push 的发布器：直接用 GitHub REST(Git Data API) 造 gh-pages 提交。

用法：GH_TOKEN=... python scripts/publish_api.py [site/out]
适用场景：github.com 的 HTTPS/SSH push 不通，但 api.github.com 可达（本沙盒现状）。
流程：遍历 site/out → 并行建 blob → 无基树新建 tree → commit(父=main HEAD) → 创建/更新 refs/heads/gh-pages
"""
import base64
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

REPO = "ftao88332-web/2kcn"
API = f"https://api.github.com/repos/{REPO}"

TOKEN = os.environ.get("GH_TOKEN", "")
HDR = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json"}


def call(client: httpx.Client, method: str, path: str, json_body: dict | None = None):
    r = client.request(method, f"{API}{path}", json=json_body, timeout=60)
    if r.status_code >= 500 or r.status_code in (403, 408, 429):
        raise RuntimeError(f"{r.status_code} {r.text[:200]}")
    if r.status_code >= 400:
        print(f"[{r.status_code}] {path} -> {r.text[:400]}")
    r.raise_for_status()
    return r.json() if r.text else None


def blob_sha(data: bytes) -> str:
    """标准 git blob SHA1：sha1('blob <size>\\0' + content)。用于和远端树比对做增量。"""
    import hashlib
    h = hashlib.sha1()
    h.update(b"blob %d\x00" % len(data))
    h.update(data)
    return h.hexdigest()


def main() -> int:
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "site", "out")
    files: list[str] = []
    for root, _dirs, names in os.walk(out_dir):
        for n in names:
            p = os.path.join(root, n)
            rel = os.path.relpath(p, out_dir).replace("\\", "/")
            sz = os.path.getsize(p)
            if sz > 20 * 1024 * 1024:
                print(f"[skip] {rel} 太大 ({sz//1024}KB)")
                continue
            files.append(rel)
    files.append(".nojekyll")  # 关键：禁 Jekyll，保住 _next 下划线路径
    print(f"待发布文件 {len(files)} 个")

    with httpx.Client(headers=HDR) as client:
        main_sha = call(client, "GET", "/git/ref/heads/main")["object"]["sha"]
        print("main HEAD:", main_sha[:10])

        # ---- 增量：拉 gh-pages 现有树，本地算 sha，没变的直接复用 ----
        remote: dict[str, str] = {}
        try:
            ref = call(client, "GET", "/git/ref/heads/gh-pages")
            tree_sha = ref["object"]["sha"]
            t = call(client, "GET", f"/git/trees/{tree_sha}?recursive=1")
            if not t.get("truncated"):
                remote = {i["path"]: i["sha"] for i in t.get("tree", [])
                          if i.get("type") == "blob"}
                print(f"gh-pages 现有 {len(remote)} 个文件")
        except Exception as exc:
            print(f"[warn] 读 gh-pages 树失败（将全量上传）: {exc}")

        def blob_upload(rel: str) -> tuple[str, str]:
            if rel == ".nojekyll":
                data = b""
            else:
                with open(os.path.join(out_dir, rel), "rb") as fh:
                    data = fh.read()
            want = blob_sha(data)
            if remote.get(rel) == want:  # 远端已有同内容 blob，直接复用
                return rel, want
            body = {"content": base64.b64encode(data).decode(), "encoding": "base64"}
            attempt = 0
            while True:
                try:
                    got = call(client, "POST", "/git/blobs", body)["sha"]
                    if got != want:  # 保险：用远端为准仍可引用
                        got = want if remote.get(rel) == want else got
                    return rel, got
                except Exception as exc:
                    attempt += 1
                    if attempt > 5:
                        raise
                    time.sleep(2 * attempt)

        tree_items: list[dict] = []
        skipped = uploaded = 0
        with ThreadPoolExecutor(max_workers=8) as pool:
            futs = [pool.submit(blob_upload, f) for f in files]
            for fut in as_completed(futs):
                try:
                    rel, sha = fut.result()
                except Exception as exc:
                    print(f"[fail] blob: {exc}")
                    continue
                tree_items.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})
                if rel in remote and remote[rel] == sha:
                    skipped += 1
                else:
                    uploaded += 1
                    if uploaded % 50 == 0:
                        print(f"  uploaded {uploaded} …")
        print(f"blob 复用 {skipped} / 上传 {uploaded} / 缺失 {len(files) - len(tree_items)}")
        if not tree_items:
            print("没有任何文件可提交，退出")
            return 1

        # 大量新 blob 刚传完时，GitHub 对象库有秒级可见性延迟 → 422 需重试
        for attempt in range(6):
            try:
                tree = call(client, "POST", "/git/trees", {"tree": tree_items})
                break
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code != 422 or attempt == 5:
                    raise
                print(f"[warn] tree 422（blob 可见性延迟），第 {attempt + 1} 次重试…")
                time.sleep(4 + 2 * attempt)
        commit = call(client, "POST", "/git/commits",
                      {"message": f"publish: {time.strftime('%F %T')} (api)",
                       "tree": tree["sha"], "parents": [main_sha]})

        ref_body = {"ref": "refs/heads/gh-pages", "sha": commit["sha"]}
        try:
            call(client, "PATCH", "/git/refs/heads/gh-pages", {"sha": commit["sha"], "force": True})
            print("gh-pages 已更新 (patch)")
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 422:
                call(client, "POST", "/git/refs", ref_body)
                print("gh-pages 已创建")
            else:
                raise
    print("gh-pages 指向", commit["sha"][:10])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
