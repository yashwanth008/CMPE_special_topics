"""Optional: take a headless Chrome screenshot of a generated page (used for demo evidence)."""
import pathlib

def screenshot(html_path, png_path, width=520, height=520, wait_ms=400):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  (playwright not installed: screenshot skipped)"); return None
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(executable_path="/usr/bin/google-chrome") if pathlib.Path("/usr/bin/google-chrome").exists() else p.chromium.launch()
        except Exception as e:
            print("  (no browser available: screenshot skipped)", type(e).__name__); return None
        pg = b.new_page(viewport={"width": width, "height": height})
        pg.goto(pathlib.Path(html_path).resolve().as_uri()); pg.wait_for_timeout(wait_ms)
        pg.screenshot(path=png_path); b.close()
    print(f"  screenshot -> {png_path}")
    return png_path
