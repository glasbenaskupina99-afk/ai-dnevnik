#!/usr/bin/env python3
"""Prenese naslovne fotografije člankov (Wikimedia Commons) v mapo images/ kot WebP.

Za vsak članek v content/articles.json, katerega `imageUrl` je še zunanji URL:
  - prenese sliko (počasi, s ponovnimi poskusi zaradi omejitev Wikimedie),
  - jo pomanjša na največ 1200 px in shrani kot images/<id>.webp,
  - v `imageSource` shrani izvorni URL, v `imageUrl` pa lokalno pot.

Zagon:  python3 scripts/fetch-images.py   (nato: node scripts/build-content.mjs)
Potrebuje Pillow:  pip install pillow
"""
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "articles.json")
OUT_DIR = os.path.join(ROOT, "images")
UA = "AIDnevnikImageFetcher/1.0 (static news site; one-off thumbnail download)"


def fetch(url, attempts=6):
    delay = 10
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, timeout=40).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == attempts - 1:
                raise
            wait = int(e.headers.get("Retry-After") or delay)
            print(f"  429, čakam {wait} s …", flush=True)
            time.sleep(wait)
            delay = min(delay * 2, 120)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    data = json.load(open(CONTENT, encoding="utf-8"))
    failed = []
    for a in data["articles"]:
        if not a.get("imageUrl", "").startswith("http"):
            continue
        # thumb.wikimedia.org ne obstaja; pravi strežnik je upload.wikimedia.org
        url = a["imageUrl"].replace("https://thumb.wikimedia.org", "https://upload.wikimedia.org")
        rel = f"images/{a['id']}.webp"
        print(f"→ {a['id']}", flush=True)
        try:
            img = Image.open(io.BytesIO(fetch(url))).convert("RGB")
            img.thumbnail((1200, 1200))
            img.save(os.path.join(ROOT, rel), "WEBP", quality=80)
            a["imageSource"] = url
            a["imageUrl"] = rel
            json.dump(data, open(CONTENT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        except Exception as e:  # noqa: BLE001
            print(f"  NAPAKA: {e}", flush=True)
            failed.append(a["id"])
        time.sleep(4)
    print(f"Končano. Neuspešno: {len(failed)} {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
