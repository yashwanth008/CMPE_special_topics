"""
FastAPI Microservice for AutoGluon Multimodal AutoML Suite
Serves high-performance inference and analytics on Port 8014.
"""

import os
import sys
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure core package is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../core')))

from tabular_engine import AutoGluonTabularEngine
from timeseries_engine import AutoGluonTimeSeriesEngine
from multimodal_engine import AutoGluonMultiModalEngine
from eda_engine import AutoGluonEDAEngine
from autoresearch_engine import AutoResearchTournamentEngine
from xai_engine import AutoGluonXAIEngine
from mlops_engine import AutoGluonMLOpsEngine
from paper import get_crisp_dm_paper_dossier
from architecture import get_system_architecture_dossier
from code_auditor import CodeAuditorWorkbench

app = FastAPI(
    title="AutoGluon Multimodal AutoML Microservice",
    description="Next-generation multi-modal AutoML API powering 3-Level Stacking DAGs, Chronos TimeSeries, and Vision-Language-Tabular Fusion.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[INFO] Initializing AutoGluon Multimodal AutoML Suite on Port 8014...", flush=True)
t0 = time.time()

tabular_engine = AutoGluonTabularEngine(seed=42)
timeseries_engine = AutoGluonTimeSeriesEngine(seed=42)
multimodal_engine = AutoGluonMultiModalEngine(seed=42)
eda_engine = AutoGluonEDAEngine(tabular_engine)
autoresearch_engine = AutoResearchTournamentEngine(seed=42)
xai_engine = AutoGluonXAIEngine(tabular_engine)
mlops_engine = AutoGluonMLOpsEngine(tabular_engine)
code_auditor = CodeAuditorWorkbench()

# Precompute static dossiers for ultra-fast serving
eda_dossier = eda_engine.generate_full_eda_dossier()
autoresearch_dossier = autoresearch_engine.get_tournament_dossier()
paper_dossier = get_crisp_dm_paper_dossier()
architecture_dossier = get_system_architecture_dossier()
code_audit_dossier = code_auditor.run_full_audit()

print(f"[OK] AutoGluon Engine Ready in {time.time() - t0:.2f}s!", flush=True)


# Pydantic Request Models
class ChurnInferenceRequest(BaseModel):
    age: float = Field(42.0, ge=18, le=90)
    tenure_months: float = Field(18.0, ge=1, le=72)
    monthly_charges: float = Field(75.50, ge=15.0, le=160.0)
    total_charges: float = Field(1359.0, ge=15.0, le=12000.0)
    contract_type: str = Field("Month-to-Month")
    tech_support: str = Field("No")
    payment_method: str = Field("Electronic Check")
    online_security: str = Field("No")
    paperless_billing: str = Field("Yes")
    streaming_tv: str = Field("Yes")
    num_support_tickets: int = Field(2, ge=0, le=10)


class DiamondInferenceRequest(BaseModel):
    carat: float = Field(1.05, ge=0.2, le=5.0)
    cut: str = Field("Ideal")
    color: str = Field("G")
    clarity: str = Field("VS1")
    depth: float = Field(61.5, ge=50.0, le=75.0)
    table: float = Field(57.0, ge=50.0, le=75.0)
    x: float = Field(6.55, ge=3.0, le=11.0)
    y: float = Field(6.58, ge=3.0, le=11.0)
    z: float = Field(4.03, ge=2.0, le=8.0)


class TimeSeriesForecastRequest(BaseModel):
    horizon: int = Field(14, ge=1, le=30)
    promo_plan: Optional[List[int]] = None
    model_selected: str = Field("Chronos-Bolt-Base")


class MultimodalFusionRequest(BaseModel):
    title: str = Field("QuantumPro Ultra-Slim Noise Cancelling Headphones")
    description: str = Field("Ergonomic over-ear wireless acoustic headphones featuring dual hybrid active noise cancellation, 40mm beryllium drivers, titanium headband, and 48-hour continuous battery life.")
    category: str = Field("Electronics")
    brand: str = Field("AcoustiQ")
    condition: str = Field("New")
    seller_rating: float = Field(4.9, ge=1.0, le=5.0)


class ZeroShotSearchRequest(BaseModel):
    query: str = Field("lightweight carbon bike for road racing")


class LocalShapRequest(BaseModel):
    inputs: Dict[str, Any]


class WhatIfRequest(BaseModel):
    base_inputs: Dict[str, Any]
    modifications: Dict[str, Any]


class LoadTestRequest(BaseModel):
    concurrency: int = Field(50, ge=1, le=200)
    num_requests: int = Field(1000, ge=10, le=5000)


# REST Endpoints
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AutoGluon Multimodal AutoML Suite",
        "port": 8014,
        "capabilities": ["Tabular 3-Level Stacking DAG", "Chronos Probabilistic TimeSeries", "Vision-Language Fusion", "AutoResearch Tournament", "Model Distillation", "CRISP-DM Paper"]
    }


@app.post("/api/tabular/predict-churn")
def predict_churn(req: ChurnInferenceRequest):
    return tabular_engine.predict_churn(req.model_dump())


@app.post("/api/tabular/predict-diamond")
def predict_diamond(req: DiamondInferenceRequest):
    return tabular_engine.predict_diamond_price(req.model_dump())


@app.get("/api/tabular/leaderboard")
def get_tabular_leaderboard(task: str = "classification"):
    if task == "regression":
        return {"task": "Diamond Valuation Regression", "leaderboard": tabular_engine.reg_models["leaderboard"]}
    return {"task": "Customer Churn Classification", "leaderboard": tabular_engine.clf_models["leaderboard"]}


@app.post("/api/timeseries/forecast")
def forecast_timeseries(req: TimeSeriesForecastRequest):
    return timeseries_engine.forecast(horizon=req.horizon, promo_plan=req.promo_plan, model_selected=req.model_selected)


@app.get("/api/timeseries/leaderboard")
def get_timeseries_leaderboard():
    return {"leaderboard": timeseries_engine.benchmark_leaderboard}


@app.post("/api/multimodal/predict-fusion")
def predict_multimodal_fusion(req: MultimodalFusionRequest):
    return multimodal_engine.predict_product_fusion(
        title=req.title,
        description=req.description,
        category=req.category,
        brand=req.brand,
        condition=req.condition,
        seller_rating=req.seller_rating
    )


@app.post("/api/multimodal/zero-shot-search")
def zero_shot_search(req: ZeroShotSearchRequest):
    return {"query": req.query, "results": multimodal_engine.zero_shot_search(req.query)}


@app.get("/api/eda/dossier")
def get_eda_dossier():
    return eda_dossier


@app.get("/api/autoresearch/tournament")
def get_autoresearch_tournament():
    return autoresearch_dossier


@app.get("/api/xai/global")
def get_global_xai():
    return xai_engine.get_global_explanations()


@app.post("/api/xai/local-shap")
def compute_local_shap(req: LocalShapRequest):
    return xai_engine.compute_local_shap_waterfall(req.inputs)


@app.post("/api/xai/what-if")
def compute_what_if(req: WhatIfRequest):
    return xai_engine.run_what_if_sensitivity(req.base_inputs, req.modifications)


@app.get("/api/mlops/distillation")
def get_mlops_distillation():
    return mlops_engine.get_distillation_benchmarks()


@app.post("/api/mlops/load-test")
def run_mlops_load_test(req: LoadTestRequest):
    return mlops_engine.run_concurrency_load_test(concurrency=req.concurrency, num_requests=req.num_requests)


@app.get("/api/mlops/drift-psi")
def get_mlops_drift_psi():
    return mlops_engine.compute_psi_drift()


@app.get("/api/paper")
def get_paper():
    return paper_dossier


@app.get("/api/architecture")
def get_architecture():
    return architecture_dossier


@app.get("/api/code-audit")
def get_code_audit():
    return code_audit_dossier


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8014)
