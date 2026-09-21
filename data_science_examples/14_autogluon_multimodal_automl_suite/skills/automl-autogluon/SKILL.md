---
name: automl-autogluon
description: AutoGluon Multi-Layer Stacking Ensembles, Chronos Foundation Model TimeSeries, Vision-Language-Tabular Fusion, and AutoResearch Tabular Optimization.
---

# AutoGluon Multimodal AutoML Suite Skill

This skill documents the automated reproduction, multi-layer stacking architecture, Chronos foundation time series forecasting, vision-language fusion, and evaluation of the **AutoGluon Multimodal AutoML Suite** (`14_autogluon_multimodal_automl_suite`).

---

## 1. Quickstart & Service Architecture

- **FastAPI Microservice (Port 8014)**: `python -m uvicorn server.main:app --host 127.0.0.1 --port 8014`
- **React 18 + Vite Web App (Port 5187)**: `npm run dev` (in `client/`)

```
14_autogluon_multimodal_automl_suite/
├── core/
│   ├── tabular_engine.py       # 3-Level Stacking DAG & Multi-Task Tabular Predictor
│   ├── timeseries_engine.py    # Chronos T5 Transformer & Probabilistic Quantile Forecaster
│   ├── multimodal_engine.py    # DeBERTa Text + ViT Vision + Tabular Late-Fusion Deep Learning
│   ├── eda_engine.py           # Auto-EDA, Tukey IQR Outliers, Bivariate OLS & KS-test Covariate Drift
│   ├── autoresearch_engine.py  # 4-Phase Iterative Tournament Hill Climbing & Optuna HPO
│   ├── xai_engine.py           # TreeSHAP Waterfall & Counterfactual What-If Simulator
│   ├── mlops_engine.py         # Sub-10μs Student Distillation & Concurrency Benchmark
│   ├── paper.py                # 10-Page CRISP-DM Academic Manuscript with KaTeX Math
│   ├── architecture.py         # 30-Skills Operational Catalog & Matrix
│   └── code_auditor.py         # AST Static Analysis & Zero Leakage Verifier
├── server/
│   ├── main.py                 # High-Performance FastAPI Backend (Port 8014)
│   └── test_api.py             # 12-Test Unit Verification Suite (100% Pass)
└── client/
    ├── src/
    │   ├── components/         # TabularStacking, ChronosTimeSeries, MultiModalFusion, EDA, AutoResearch, XAI, MLOps, Paper, Skills, Audit
    │   ├── App.tsx             # Main shell
    │   └── index.css           # Violet/Indigo/Cyan Glassmorphism Design System
    └── vite.config.js          # Port 5187
```

---

## 2. Automated Verification

Run backend unit tests:
```powershell
python server/test_api.py
```
*(12 / 12 tests pass in < 0.70s)*.
