import os
import sys
import time
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add core to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../core')))

from dataset import generate_synthetic_mobility_data, DATA_CATALOG_ENTRY
from business import get_business_dossier
from audit import DataQualityAuditor
from eda import ProgrammaticEDAEngine
from clustering import SpatialMobilityClusteringEngine
from autoresearch import AutoResearchTournamentEngine
from explainability import ExplainableAIEngine
from mlops import MLOpsGovernanceEngine
from paper import get_crisp_dm_paper_dossier
from snippets import get_code_audit_snippets
from architecture import get_system_architecture_dossier

# Initialize FastAPI App
app = FastAPI(
    title="NYC TLC Mobility & Dynamic Surge Pricing Intelligence Microservice",
    description="Enterprise CRISP-DM Standard ML API for urban taxi fare prediction, tip propensity, and XAI audit.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Caching & Model Artifact Initialization
print("[INFO] Initializing NYC TLC Mobility Data Science & MLOps Engine on Port 8013...", flush=True)
t0 = time.time()
base_df = generate_synthetic_mobility_data(n_samples=5000, seed=42)
auditor = DataQualityAuditor(base_df)
quality_audit_res = auditor.run_full_quality_audit()

eda_engine = ProgrammaticEDAEngine(base_df)
eda_res = eda_engine.generate_full_eda_dossier()

clustering_engine = SpatialMobilityClusteringEngine(base_df)
clustering_res = clustering_engine.run_clustering_tournament()

tournament_engine = AutoResearchTournamentEngine(n_samples=3000)
tournament_res = tournament_engine.run_tournament()
ablations_res = tournament_engine.run_ablation_study()
optuna_res = tournament_engine.get_optuna_hpo_trajectory()

xai_engine = ExplainableAIEngine()
global_shap_res = xai_engine.get_global_explanations()
pdp_res = xai_engine.get_partial_dependence_curves()
qa_checklist_res = xai_engine.get_peer_review_qa_checklist()

mlops_engine = MLOpsGovernanceEngine(base_df)
drift_res = mlops_engine.run_drift_audit(base_df)
paper_res = get_crisp_dm_paper_dossier()
snippets_res = get_code_audit_snippets()
business_res = get_business_dossier()

print(f"[OK] NYC TLC Engine Ready in {time.time() - t0:.2f}s!", flush=True)

# Pydantic Schemas
class TripInferenceRequest(BaseModel):
    pickup_latitude: float = Field(40.7549, ge=40.48, le=40.95, description="Pickup WGS84 Latitude")
    pickup_longitude: float = Field(-73.9840, ge=-74.30, le=-73.65, description="Pickup WGS84 Longitude")
    dropoff_latitude: float = Field(40.6413, ge=40.48, le=40.95, description="Dropoff WGS84 Latitude")
    dropoff_longitude: float = Field(-73.7781, ge=-74.30, le=-73.65, description="Dropoff WGS84 Longitude")
    passenger_count: int = Field(1, ge=1, le=6, description="Passenger count")
    vendor_id: str = Field("CreativeMobile", description="Technology vendor")
    rate_code: str = Field("Standard", description="TLC rate code tier")
    payment_type: str = Field("Credit Card", description="Payment method")
    hour_of_day: int = Field(17, ge=0, le=23, description="Hour of day")
    day_of_week: int = Field(4, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    temperature_c: float = Field(18.0, description="Temperature in Celsius")
    precipitation_mm: float = Field(0.0, ge=0.0, description="Precipitation in mm")
    wind_speed_kmh: float = Field(12.0, ge=0.0, description="Wind speed in km/h")
    congestion_surcharge: float = Field(2.50, description="Congestion surcharge in USD")

class LoadTestRequest(BaseModel):
    concurrency: int = Field(50, ge=1, le=200, description="Number of parallel virtual workers")
    num_requests: int = Field(500, ge=10, le=5000, description="Total requests to execute")

# REST Endpoints
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NYC TLC Mobility & Dynamic Surge Pricing Intelligence Platform",
        "port": 8013,
        "crisp_dm_version": "1.0.0",
        "uptime_sec": round(time.time() - t0, 1)
    }

@app.get("/api/business/dossier")
def get_business_info():
    return business_res

@app.get("/api/crisp-dm/report")
def get_crisp_dm_paper():
    return paper_res

@app.get("/api/data/catalog")
def get_data_catalog():
    return {
        "catalog_entry": DATA_CATALOG_ENTRY,
        "quality_audit": quality_audit_res
    }

@app.get("/api/eda/summary")
def get_eda_summary():
    return eda_res

@app.get("/api/clustering/spatial")
def get_spatial_clustering():
    return clustering_res

@app.get("/api/models/tournament")
def get_model_tournament():
    return {
        "tournament": tournament_res,
        "ablations": ablations_res,
        "optuna_hpo": optuna_res
    }

@app.get("/api/explainability/shap")
def get_shap_explanations():
    return {
        "global_shap": global_shap_res,
        "partial_dependence": pdp_res,
        "peer_review_qa_checklist": qa_checklist_res
    }

@app.post("/api/explainability/instance")
def explain_single_trip(req: TripInferenceRequest):
    return xai_engine.explain_instance(req.model_dump())

@app.get("/api/code/snippets")
def get_code_snippets():
    return {
        "snippets": snippets_res
    }

@app.post("/api/predict")
def predict_trip(req: TripInferenceRequest):
    t_start = time.perf_counter()
    req_dict = req.model_dump()
    
    # Calculate geometric distances
    p_lat, p_lon = req.pickup_latitude, req.pickup_longitude
    d_lat, d_lon = req.dropoff_latitude, req.dropoff_longitude
    
    lat1, lon1 = np.radians(p_lat), np.radians(p_lon)
    lat2, lon2 = np.radians(d_lat), np.radians(d_lon)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    haversine_km = round(float(6371.0 * 2.0 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))), 3)
    manhattan_km = round(float(111.0 * (np.abs(p_lat - d_lat) + np.abs(p_lon - d_lon) * np.cos(np.radians(40.75)))), 3)
    trip_distance_km = round(max(0.6, 0.4 * haversine_km + 0.6 * manhattan_km), 3)

    is_rush = (req.day_of_week < 5) and (((req.hour_of_day >= 7) and (req.hour_of_day <= 9)) or ((req.hour_of_day >= 16) and (req.hour_of_day <= 19)))
    req_dict["is_rush_hour"] = is_rush
    req_dict["trip_distance_km"] = trip_distance_km
    req_dict["haversine_distance_km"] = haversine_km

    # Estimated duration
    avg_speed = 12.0 if is_rush else 22.0
    trip_duration_min = round(max(2.0, (trip_distance_km / avg_speed) * 60.0), 1)
    req_dict["trip_duration_min"] = trip_duration_min

    # Local SHAP explanation & predicted fare
    explanation = xai_engine.explain_instance(req_dict)
    predicted_fare = explanation["predicted_total_fare_usd"]

    # High Tip Probability
    tip_prob = 0.35 + 0.10 * (req.precipitation_mm > 1.0) + (0.08 if req.day_of_week >= 5 else 0.0)
    if req.payment_type != "Credit Card":
        tip_prob = 0.02
    tip_prob = round(float(np.clip(tip_prob, 0.01, 0.95)), 3)

    # Surge Multiplier Tier
    surge_tier = "Standard (1.0x)"
    if req.precipitation_mm > 5.0 and is_rush:
        surge_tier = "Severe Weather Surge (1.35x)"
    elif req.precipitation_mm > 2.0:
        surge_tier = "Moderate Rain Surge (1.15x)"
    elif is_rush:
        surge_tier = "Peak Rush Hour (1.10x)"

    # Carbon Footprint
    carbon_kg = round(0.21 * trip_distance_km + 0.015 * trip_duration_min, 3)

    latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)

    return {
        "trip_metrics": {
            "haversine_distance_km": haversine_km,
            "manhattan_distance_km": manhattan_km,
            "trip_distance_km": trip_distance_km,
            "estimated_duration_min": trip_duration_min,
            "is_rush_hour": is_rush
        },
        "predictions": {
            "predicted_total_fare_usd": predicted_fare,
            "high_tip_probability": tip_prob,
            "high_tip_prediction": bool(tip_prob >= 0.50),
            "surge_pricing_tier": surge_tier,
            "estimated_carbon_emissions_kg": carbon_kg
        },
        "explainability": explanation,
        "telemetry": {
            "inference_latency_ms": latency_ms,
            "model_architecture": "Histogram Gradient Boosting (TreeSHAP Audited)"
        }
    }

@app.get("/api/mlops/drift")
def get_mlops_drift():
    return drift_res

@app.post("/api/mlops/load-test")
def run_concurrency_load_test(req: LoadTestRequest):
    return mlops_engine.execute_live_load_test(concurrency=req.concurrency, num_requests=req.num_requests)

@app.get("/api/architecture/skills")
def get_system_architecture():
    return get_system_architecture_dossier()
