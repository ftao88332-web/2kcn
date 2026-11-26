"""就地修正 cards_full.json 的体重单位。

历史数据把 2kdb 的磅值直接写进了 weight_kg 字段（如 G.O.A.T. 240 lb 显示成 240 kg）。
本脚本保留原始磅值到 weight_lb，并写入换算后的 weight_kg。

  python scripts/fix_units.py            # 执行（幂等）
  python scripts/fix_units.py --dry-run  # 只统计不写盘
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, "scraper", "out", "cards_full.json")
LB_TO_KG = 0.45359237


def main() -> None:
    dry = "--dry-run" in sys.argv
    with open(FULL, "r", encoding="utf-8") as fh:
        pool = json.load(fh)

    fixed = skipped = 0
    for row in pool.values():
        lb = row.get("weight_lb")
        kg = row.get("weight_kg")
        if lb is not None and kg is not None and abs(kg - round(lb * LB_TO_KG, 1)) < 0.2:
            skipped += 1
            continue
        if kg is None:
            continue
        # 旧数据里 weight_kg 实际存的是磅
        if lb is None:
            row["weight_lb"] = kg
        row["weight_kg"] = round(row["weight_lb"] * LB_TO_KG, 1)
        fixed += 1

    print(f"修正 {fixed} 张，已正确 {skipped} 张，共 {len(pool)} 张")
    if dry:
        return
    with open(FULL, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(pool, fh, ensure_ascii=False, separators=(",", ":"))
    print("已写回 cards_full.json")


if __name__ == "__main__":
    main()
