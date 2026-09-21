# FastAPI Microservice for Data Science Visual Mastery Platform

import os
import sys
import json
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))
from simulator_engine import simulator

app = FastAPI(
    title="Data Science Visual Mastery Platform API",
    description="Interactive curriculum modules, live mathematical simulators, and quiz grading",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../content'))

def load_json(filename: str) -> Dict[str, Any]:
    path = os.path.join(CONTENT_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

class BayesSimRequest(BaseModel):
    words: List[Dict[str, Any]]
    prior_spam: float = Field(0.4, ge=0.01, le=0.99)
    prior_ham: float = Field(0.6, ge=0.01, le=0.99)

class ConfusionSimRequest(BaseModel):
    threshold: float = Field(0.5, ge=0.05, le=0.95)

class DescentSimRequest(BaseModel):
    eta: float = Field(0.1, ge=0.01, le=0.8)
    n_steps: int = Field(6, ge=1, le=20)
    x0: float = 2.0
    y0: float = 1.0

class BackpropSimRequest(BaseModel):
    w: float = 2.0
    x: float = 1.5
    target: float = 1.0

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Data Science Visual Mastery Platform",
        "port": 8008,
        "total_modules": 4,
        "interactive_simulators": 4
    }

@app.get("/api/modules")
def get_all_modules():
    mod_files = [
        "naive_bayes_module.json",
        "evaluation_metrics_module.json",
        "calculus_gradients_module.json",
        "backprop_chainrule_module.json"
    ]
    modules = []
    for f in mod_files:
        data = load_json(f)
        if data:
            modules.append({
                "id": data.get("id"),
                "title": data.get("title"),
                "subtitle": data.get("subtitle"),
                "read_time": data.get("read_time"),
                "key_formula": data.get("key_formula")
            })
    return {"success": True, "modules": modules}

@app.get("/api/module/{module_id}")
def get_module(module_id: str):
    file_map = {
        "naive_bayes": "naive_bayes_module.json",
        "evaluation_metrics": "evaluation_metrics_module.json",
        "calculus_gradients": "calculus_gradients_module.json",
        "backprop_chainrule": "backprop_chainrule_module.json"
    }
    if module_id not in file_map:
        raise HTTPException(status_code=404, detail="Module not found")
    data = load_json(file_map[module_id])
    return {"success": True, "module": data}

@app.get("/api/quizzes")
def get_quizzes():
    data = load_json("quizzes_and_interviews.json")
    return {"success": True, "data": data}

@app.post("/api/simulate/bayes")
def simulate_bayes(req: BayesSimRequest):
    return {"success": True, "result": simulator.simulate_bayes_napkin(req.words, req.prior_spam, req.prior_ham)}

@app.post("/api/simulate/confusion")
def simulate_confusion(req: ConfusionSimRequest):
    return {"success": True, "result": simulator.simulate_confusion_matrix(req.threshold)}

@app.post("/api/simulate/descent")
def simulate_descent(req: DescentSimRequest):
    return {"success": True, "result": simulator.simulate_gradient_descent(req.eta, req.n_steps, req.x0, req.y0)}

@app.post("/api/simulate/backprop")
def simulate_backprop(req: BackpropSimRequest):
    return {"success": True, "result": simulator.simulate_backpropagation(req.w, req.x, req.target)}

@app.get("/api/gh-pages-manifest")
def get_gh_pages_manifest():
    return {
        "success": True,
        "author": "dlmastery",
        "repository": "dlmastery/data_science_examples",
        "gh_pages_root": "https://dlmastery.github.io/data_science_examples/",
        "projects": [
            { "id": "01", "name": "NYC Taxi Fare Predictor", "path": "01_nyc_taxi_predictor/" },
            { "id": "02", "name": "NanoLlama Transformer", "path": "02_nanollama_transformer/" },
            { "id": "03", "name": "Customer Segmentation", "path": "03_customer_segmentation/" },
            { "id": "04", "name": "Market Basket Mining", "path": "04_market_basket_apriori/" },
            { "id": "05", "name": "Data Science Skills Lab", "path": "05_data_science_skills_lab/" },
            { "id": "06", "name": "Anomaly Detection Threat Platform", "path": "06_anomaly_detection/" },
            { "id": "07", "name": "AutoGluon AutoML Multi-Task Platform", "path": "07_automl_autogluon/" },
            { "id": "08", "name": "Data Science Visual Mastery Textbook", "path": "08_datascience_visual_mastery/" }
        ]
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8008, reload=True)
