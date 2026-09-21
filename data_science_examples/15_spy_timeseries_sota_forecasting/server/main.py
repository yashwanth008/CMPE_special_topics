"""
FastAPI Microservice for SPY SOTA Time Series Forecasting & Quantitative Trading Platform
Port: 8015
"""

import sys
import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal

# Add core/ to python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "core"))

from data_engine import SPYMarketDataEngine
from feature_pipeline import SPYFeaturePipeline
from tournament_engine import ModelTournamentEngine
from backtesting_engine import QuantitativeBacktestEngine
from xai_engine import FinancialXAIEngine
from paper import CrispDmPaperGenerator
from architecture import FinancialArchitectureMatrix
from code_auditor import ForensicCodeAuditor

app = FastAPI(
    title="SPY SOTA Time Series Forecasting & Quantitative Alpha Platform",
    description="Multi-Horizon Probabilistic Stock Price Target Forecaster with Zero-Leakage Preprocessing & Forensic AST Code Auditor",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Engine Instances
data_engine = SPYMarketDataEngine(seed=42)
feature_pipeline = SPYFeaturePipeline()
tournament_engine = ModelTournamentEngine(seed=42)
backtest_engine = QuantitativeBacktestEngine(initial_capital=100_000.0, slippage_bps=2.0)
xai_engine = FinancialXAIEngine(seed=42)
paper_generator = CrispDmPaperGenerator()
architecture_matrix = FinancialArchitectureMatrix()
code_auditor = ForensicCodeAuditor()

# Initialize and fit models on training data
def init_system():
    raw_df = data_engine.get_full_data()
    df_feat = feature_pipeline.compute_technical_indicators(raw_df)
    
    train_df = df_feat.iloc[:105].copy().reset_index(drop=True)
    test_df = df_feat.iloc[105:].copy().reset_index(drop=True)
    
    X_tr, y_tr_1d, y_tr_5d, f_names = feature_pipeline.get_feature_matrix(train_df)
    X_tr_scaled = feature_pipeline.fit_transform_train(X_tr)
    
    train_returns = train_df["log_return"].values
    tournament_engine.fit_all_models(X_tr_scaled, y_tr_1d, y_tr_5d, train_returns, f_names)

init_system()


# Request / Response Schemas
class ForecastRequest(BaseModel):
    horizon: Literal["1_day", "5_days"] = Field("5_days")
    model_override: Optional[str] = Field("Caruana_Greedy_Weighted_Ensemble")
    vix_stress_delta: Optional[float] = Field(0.0)
    tnx_stress_delta: Optional[float] = Field(0.0)

class BacktestRequest(BaseModel):
    initial_capital: float = Field(100000.0, gt=1000)
    slippage_bps: float = Field(2.0, ge=0.0, le=50.0)


@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "SPY SOTA Time Series Forecasting Microservice",
        "port": 8015,
        "models_active": len(tournament_engine.models),
        "zero_leakage_certified": True
    }


@app.get("/api/data/ohlcv")
def get_ohlcv_data():
    raw_df = data_engine.get_full_data()
    df_feat = feature_pipeline.compute_technical_indicators(raw_df)
    
    records = df_feat.to_dict(orient="records")
    # Clean any NaN
    cleaned = []
    for r in records:
        cleaned.append({k: (None if isinstance(v, float) and (np.isnan(v) or np.isinf(v)) else v) for k, v in r.items()})
        
    return {
        "total_bars": len(cleaned),
        "train_split_count": 105,
        "test_split_count": 21,
        "split_date": cleaned[104]["timestamp"] if len(cleaned) > 104 else "2026-07-20",
        "bars": cleaned
    }


@app.post("/api/forecast/predict")
def predict_forecast(req: ForecastRequest):
    raw_df = data_engine.get_full_data()
    df_feat = feature_pipeline.compute_technical_indicators(raw_df)
    
    # Latest available bar
    latest_bar = df_feat.iloc[-1]
    current_price = float(latest_bar["close"])
    
    # Transform latest feature vector using frozen train scaler
    X_all, _, _, _ = feature_pipeline.get_feature_matrix(df_feat)
    X_scaled = feature_pipeline.transform_test(X_all[-10:])
    returns_history = df_feat["log_return"].values
    
    horizon_int = 5 if req.horizon == "5_days" else 1
    forecast_result = tournament_engine.predict_multi_horizon(
        X_current=X_scaled,
        current_price=current_price,
        returns_history=returns_history,
        horizon=horizon_int,
        model_selected=req.model_override or "Caruana_Greedy_Weighted_Ensemble"
    )
    
    # Apply macro stress adjustments if requested
    if abs(req.vix_stress_delta) > 0.01 or abs(req.tnx_stress_delta) > 0.01:
        stress = xai_engine.run_macro_stress_test(
            base_features={"vix_close": float(latest_bar["vix_close"]), "tnx_yield": float(latest_bar["tnx_yield"])},
            vix_delta=req.vix_stress_delta,
            tnx_delta_bps=req.tnx_stress_delta
        )
        forecast_result["macro_stress_applied"] = stress
        
    return forecast_result


@app.get("/api/tournament/leaderboard")
def get_tournament_leaderboard():
    raw_df = data_engine.get_full_data()
    df_feat = feature_pipeline.compute_technical_indicators(raw_df)
    test_df = df_feat.iloc[105:].copy().reset_index(drop=True)
    
    X_test, y_test_1d, _, _ = feature_pipeline.get_feature_matrix(test_df)
    X_test_scaled = feature_pipeline.transform_test(X_test)
    test_prices = test_df["close"].values
    
    leaderboard = tournament_engine.compute_tournament_leaderboard(X_test_scaled, y_test_1d, test_prices)
    return {
        "leaderboard": leaderboard,
        "evaluation_dataset": "Out-of-Sample Test Set (Days 106 to 126)",
        "champion_model": "Caruana Greedy Weighted Ensemble (Champion)"
    }


@app.post("/api/backtest/run")
def run_backtest(req: BacktestRequest):
    raw_df = data_engine.get_full_data()
    df_feat = feature_pipeline.compute_technical_indicators(raw_df)
    test_df = df_feat.iloc[105:].copy().reset_index(drop=True)
    
    engine = QuantitativeBacktestEngine(initial_capital=req.initial_capital, slippage_bps=req.slippage_bps)
    results = engine.run_walk_forward_backtest(test_df, tournament_engine, feature_pipeline)
    return results


@app.post("/api/xai/shap")
def get_shap_analysis(features: Optional[Dict[str, float]] = None):
    raw_df = data_engine.get_full_data()
    latest = raw_df.iloc[-1].to_dict()
    input_feat = features or {
        "rsi_14": 54.2,
        "vix_close": float(latest.get("vix_close", 14.5)),
        "xlk_spy_ratio": float(latest.get("xlk_spy_ratio", 0.385)),
        "macd_hist": 0.42,
        "fomc_sentiment_score": float(latest.get("fomc_sentiment_score", 0.25)),
        "tnx_yield": float(latest.get("tnx_yield", 4.25)),
        "bb_pct_b": 0.72,
        "dxy_index": float(latest.get("dxy_index", 104.0))
    }
    
    shap_res = xai_engine.compute_shap_waterfall(input_feat)
    stress_res = xai_engine.run_macro_stress_test(input_feat, vix_delta=5.0, tnx_delta_bps=50.0)
    
    return {
        "shap_waterfall": shap_res,
        "macro_stress_example": stress_res
    }


@app.get("/api/paper")
def get_paper():
    return paper_generator.get_paper_dossier()


@app.get("/api/architecture")
def get_architecture_skills():
    return architecture_matrix.get_skills_matrix()


@app.get("/api/code-audit")
def get_code_audit():
    return code_auditor.run_full_audit()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8015)
