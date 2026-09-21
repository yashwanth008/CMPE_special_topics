"""
Playwright End-to-End Automated Browser Test Suite for Project 15:
SPY SOTA Time Series Forecasting & Quantitative Trading Platform
Port: 5188 (Frontend) | 8015 (FastAPI Backend)
"""

import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "15_spy_timeseries_sota_forecasting", "docs", "screenshots")
)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def run_e2e_tests():
    print("Starting Playwright E2E Browser Test Suite for Project 15...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        url = "http://localhost:5188/"
        print(f"Navigating to {url}...")
        page.goto(url, wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # 1. Multi-Quantile Forecast Studio (Tab 1)
        print("Testing Tab 1: Multi-Quantile Forecast Studio...")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_forecast_studio.png"), full_page=True)

        # Toggle 1-Day Horizon
        page.click("button:has-text('Next-Day (t+1)')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_forecast_1day.png"), full_page=True)

        # 2. Candlestick Chart (Tab 2)
        print("Testing Tab 2: SPY Technical Studio...")
        page.click("button:has-text('SPY Technical Studio')")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_candlestick_chart.png"), full_page=True)

        # 3. SOTA Tournament Leaderboard (Tab 3)
        print("Testing Tab 3: SOTA Tournament...")
        page.click("button:has-text('SOTA Tournament')")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_tournament_leaderboard.png"), full_page=True)

        # 4. Quantitative Backtest (Tab 4)
        print("Testing Tab 4: Quantitative Backtest...")
        page.click("button:has-text('Quantitative Backtest')")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_backtest_studio.png"), full_page=True)

        # 5. TreeSHAP & Stress Test (Tab 5)
        print("Testing Tab 5: TreeSHAP & Stress Test...")
        page.click("button:has-text('TreeSHAP & Stress Test')")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_xai_shap_studio.png"), full_page=True)

        # 6. 10-Page CRISP-DM Paper (Tab 6)
        print("Testing Tab 6: 10-Page CRISP-DM Paper...")
        page.click("button:has-text('10-Page CRISP-DM Paper')")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_crisp_dm_paper_p1.png"), full_page=True)

        # Navigate Paper Page
        page.click("button:has-text('p.5')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_crisp_dm_paper_p5.png"), full_page=True)

        # 7. 30-Skills Catalog (Tab 7)
        print("Testing Tab 7: 30-Skills Catalog...")
        page.click("button:has-text('30-Skills Catalog')")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_skills_matrix.png"), full_page=True)

        # 8. AST Code Auditor (Tab 8)
        print("Testing Tab 8: AST Code Auditor...")
        page.click("button:has-text('AST Code Auditor')")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_ast_code_auditor.png"), full_page=True)

        browser.close()
        print(f"\nSUCCESS! 10 Screenshots captured and saved to: {SCREENSHOTS_DIR}")


if __name__ == "__main__":
    run_e2e_tests()
