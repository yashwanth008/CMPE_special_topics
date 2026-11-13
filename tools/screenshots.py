"""Screenshot every out/*.html that has no PNG yet (part 3 makes its own host screenshots)."""
import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from common.browser import screenshot
for h in sorted(pathlib.Path("out").glob("*.html")):
    png = h.with_suffix(".png")
    if not h.name.startswith("part3"): screenshot(h, png, 480, 420, 300)
