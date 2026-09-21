import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "core"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["port"] == 8015
    assert data["zero_leakage_certified"] is True


def test_ohlcv_data_endpoint():
    response = client.get("/api/data/ohlcv")
    assert response.status_code == 200
    data = response.json()
    assert data["total_bars"] == 126
    assert data["train_split_count"] == 105
    assert data["test_split_count"] == 21
    assert len(data["bars"]) == 126
    first_bar = data["bars"][0]
    assert "open" in first_bar and "close" in first_bar and "vix_close" in first_bar


def test_forecast_predict_5d():
    payload = {
        "horizon": "5_days",
        "model_override": "Caruana_Greedy_Weighted_Ensemble",
        "vix_stress_delta": 0.0,
        "tnx_stress_delta": 0.0
    }
    response = client.post("/api/forecast/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "target_1d_price" in data
    assert "target_5d_price" in data
    assert len(data["forecast_trajectory"]) == 5
    assert data["directional_signal"] in ["STRONG_BUY", "BUY", "NEUTRAL", "SELL", "STRONG_SELL"]


def test_forecast_predict_1d():
    payload = {
        "horizon": "1_day",
        "model_override": "Chronos_T5_Foundation",
        "vix_stress_delta": 3.5,
        "tnx_stress_delta": 25.0
    }
    response = client.post("/api/forecast/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "target_1d_price" in data
    assert "macro_stress_applied" in data


def test_tournament_leaderboard():
    response = client.get("/api/tournament/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data["leaderboard"]) >= 6
    top_model = data["leaderboard"][0]
    assert top_model["rank"] == 1
    assert "Caruana" in top_model["model_name"]
    assert top_model["annualized_sharpe"] > 1.5


def test_backtest_run():
    payload = {
        "initial_capital": 100000.0,
        "slippage_bps": 2.0
    }
    response = client.post("/api/backtest/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["initial_capital"] == 100000.0
    assert data["strategy_total_return_pct"] is not None
    assert data["annualized_sharpe_ratio"] > 1.0
    assert len(data["daily_equity_curve"]) > 0


def test_xai_shap():
    response = client.post("/api/xai/shap", json={})
    assert response.status_code == 200
    data = response.json()
    assert "shap_waterfall" in data
    assert len(data["shap_waterfall"]["shap_waterfall"]) > 0


def test_paper_dossier():
    response = client.get("/api/paper")
    assert response.status_code == 200
    data = response.json()
    assert data["total_pages"] == 10
    assert len(data["pages"]) == 10


def test_architecture_skills():
    response = client.get("/api/architecture")
    assert response.status_code == 200
    data = response.json()
    assert data["total_skills"] == 30
    assert len(data["skills"]) == 30


def test_code_auditor():
    response = client.get("/api/code-audit")
    assert response.status_code == 200
    data = response.json()
    assert data["compliance_rate_pct"] == 100.0
    assert "A+" in data["overall_grade"]
    assert data["critical_violations_detected"] == 0


if __name__ == "__main__":
    print("Running automated unit test suite for SPY SOTA Microservice...")
    test_health_endpoint()
    print("[PASS] test_health_endpoint passed")
    test_ohlcv_data_endpoint()
    print("[PASS] test_ohlcv_data_endpoint passed")
    test_forecast_predict_5d()
    print("[PASS] test_forecast_predict_5d passed")
    test_forecast_predict_1d()
    print("[PASS] test_forecast_predict_1d passed")
    test_tournament_leaderboard()
    print("[PASS] test_tournament_leaderboard passed")
    test_backtest_run()
    print("[PASS] test_backtest_run passed")
    test_xai_shap()
    print("[PASS] test_xai_shap passed")
    test_paper_dossier()
    print("[PASS] test_paper_dossier passed")
    test_architecture_skills()
    print("[PASS] test_architecture_skills passed")
    test_code_auditor()
    print("[PASS] test_code_auditor passed")
    print("\nALL 10 UNIT TESTS PASSED SUCCESSFULLY! (100% PASS)")
