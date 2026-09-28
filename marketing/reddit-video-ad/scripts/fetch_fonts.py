"""Download the Trailhead typefaces (all SIL OFL) into src/fonts/ for offline,
deterministic rendering: Fraunces (display), Inter (body), IBM Plex Mono
(trail-marker labels) and Caveat (the learner's handwriting)."""
import re
import urllib.request
from pathlib import Path

FONTS = Path(__file__).resolve().parent.parent / "src" / "fonts"
CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1"
    "&family=Inter:wght@400..800"
    "&family=IBM+Plex+Mono:wght@500;600;700"
    "&family=Caveat:wght@500..700"
    "&display=block"
)
# A current Chrome UA makes Google Fonts serve variable woff2 files.
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})) as r:
        return r.read()


def main():
    FONTS.mkdir(parents=True, exist_ok=True)
    css = get(CSS_URL).decode()
    for url in sorted(set(re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", css))):
        name = url.split("/s/")[1].replace("/", "_")
        target = FONTS / name
        if not target.exists():
            target.write_bytes(get(url))
        css = css.replace(url, name)
    (FONTS / "fonts.css").write_text(css)
    print(f"fonts ready in {FONTS}")


if __name__ == "__main__":
    main()
