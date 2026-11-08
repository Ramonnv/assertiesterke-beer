# Haalt het ronde lettertype "Baloo 2" op bij Google Fonts (voor offline gebruik in de app).
import sys, os, re, urllib.request
out = sys.argv[1] if len(sys.argv) > 1 else "web/fonts"
os.makedirs(out, exist_ok=True)
req = urllib.request.Request("https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap",
                             headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"})
css = urllib.request.urlopen(req).read().decode()
blocks = re.findall(r"/\* latin \*/\s*@font-face\s*{[^}]*}", css)
src = re.search(r"url\((https://[^)]+\.woff2)\)", blocks[0] if blocks else css).group(1)
urllib.request.urlretrieve(src, os.path.join(out, "baloo.woff2"))
print("lettertype:", os.path.getsize(os.path.join(out, "baloo.woff2")), "bytes")
