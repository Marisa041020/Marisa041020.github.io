#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量压缩照片，输出 WebP，供博客相册使用。

用法（最简单：把这个文件夹拖到 压缩照片.bat 上）
    python compress_photos.py <照片文件夹> [选项]

常用选项
    -o, --out DIR        输出目录，默认 hexo/source/img/photos
    -m, --max-edge N     长边最大像素，默认 2048
    -q, --quality N      WebP 质量，默认 80
    -f, --force          已有同名输出也重新压
    --keep-exif          保留 EXIF（默认清除，含 GPS 定位）
    --dry-run            只统计不写文件

默认会做三件事：
    1. 按 EXIF 方向自动转正（手机竖拍不会躺倒）
    2. 长边压到 2048px
    3. 清除 EXIF —— 手机照片常带拍摄地点经纬度，上传前必须去掉
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("缺少 Pillow，请先运行：python -m pip install pillow -i https://mirrors.aliyun.com/pypi/simple/")

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def human(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.0f} KB"
    return f"{n / 1024 / 1024:.2f} MB"


def default_out() -> Path:
    # 本文件在 hexo/tools/ 下，默认输出到 hexo/source/img/photos/
    return Path(__file__).resolve().parent.parent / "source" / "img" / "photos"


def has_gps(img: Image.Image) -> bool:
    try:
        exif = img.getexif()
        if not exif:
            return False
        for ifd_id in (0x8825,):  # GPSInfo
            if ifd_id in exif:
                return True
        return False
    except Exception:
        return False


def convert_one(src: Path, out_dir: Path, max_edge: int, quality: int,
                keep_exif: bool, force: bool, dry_run: bool):
    dst = out_dir / (src.stem + ".webp")
    before = src.stat().st_size

    if dst.exists() and not force:
        return ("skip", before, dst.stat().st_size, "已存在")

    with Image.open(src) as im:
        gps = has_gps(im)
        im = ImageOps.exif_transpose(im)

        if im.mode in ("RGBA", "LA", "P"):
            # 透明通道压到白底，避免 WebP 变黑边
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")

        w, h = im.size
        long_edge = max(w, h)
        if long_edge > max_edge:
            scale = max_edge / long_edge
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

        if dry_run:
            return ("dry", before, 0, f"{w}x{h} -> {im.size[0]}x{im.size[1]}")

        out_dir.mkdir(parents=True, exist_ok=True)
        save_kw = dict(format="WEBP", quality=quality, method=6)
        if keep_exif:
            exif_bytes = im.info.get("exif")
            if exif_bytes:
                save_kw["exif"] = exif_bytes
        im.save(dst, **save_kw)

    after = dst.stat().st_size
    note = "含GPS" if gps and not keep_exif else ""
    return ("ok", before, after, note)


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("src", help="照片所在文件夹")
    ap.add_argument("-o", "--out", default=None, help="输出目录")
    ap.add_argument("-m", "--max-edge", type=int, default=2048)
    ap.add_argument("-q", "--quality", type=int, default=80)
    ap.add_argument("-f", "--force", action="store_true")
    ap.add_argument("--keep-exif", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    src_dir = Path(args.src).expanduser()
    if not src_dir.is_dir():
        sys.exit(f"不是文件夹：{src_dir}")

    out_dir = Path(args.out).expanduser() if args.out else default_out()

    files = sorted(p for p in src_dir.iterdir()
                   if p.is_file() and p.suffix.lower() in EXTS)
    if not files:
        sys.exit(f"这个文件夹里没有可处理的图片：{src_dir}")

    print(f"来源：{src_dir}")
    print(f"输出：{out_dir}")
    print(f"参数：长边 {args.max_edge}px · 质量 {args.quality} · "
          f"{'保留' if args.keep_exif else '清除'} EXIF\n")

    total_before = total_after = 0
    done = skipped = failed = 0
    gps_count = 0

    for f in files:
        try:
            status, before, after, note = convert_one(
                f, out_dir, args.max_edge, args.quality,
                args.keep_exif, args.force, args.dry_run)
        except Exception as e:
            failed += 1
            print(f"  [失败] {f.name} -> {e}")
            continue

        if status == "skip":
            skipped += 1
            print(f"  [跳过] {f.name}（输出已存在）")
            continue

        done += 1
        total_before += before
        total_after += after
        if note and "GPS" in note:
            gps_count += 1
        pct = (1 - after / before) * 100 if before else 0
        extra = f"  {note}" if note else ""
        print(f"  [完成] {f.name}  {human(before)} -> {human(after)}  -{pct:.0f}%{extra}")

    print()
    if done:
        saved = total_before - total_after
        pct = saved / total_before * 100 if total_before else 0
        print(f"共 {done} 张，{human(total_before)} -> {human(total_after)}，"
              f"省下 {human(saved)}（{pct:.0f}%）")
    if skipped:
        print(f"跳过 {skipped} 张（输出已存在，加 -f 可强制重压）")
    if failed:
        print(f"失败 {failed} 张")
    if gps_count:
        print(f"其中 {gps_count} 张带 GPS 定位信息，已清除")
    if not args.dry_run and done:
        print("\n下一步：在 hexo 目录运行 publish.bat 发布，或者把新文件 commit 上去。")


if __name__ == "__main__":
    main()
