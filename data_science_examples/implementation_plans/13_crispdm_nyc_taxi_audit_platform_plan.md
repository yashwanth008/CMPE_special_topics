# 📋 Implementation Plan — Project 13: NYC TLC Mobility & Dynamic Surge Pricing Platform (`13_crispdm_nyc_taxi_audit_platform`)

## 1. Executive Summary & Problem Formulation
Enterprise-grade flagship demonstration of the **CRISP-DM (Cross-Industry Standard Process for Data Mining)** methodology combined with **Matt Pocock Total TypeScript Architectural Patterns** on high-dimensional NYC Taxi & Limousine Commission mobility records. Features a 10-page in-depth academic paper dossier, spatial density clustering, AutoResearch multi-model tournament, TreeSHAP explainability force decompositions, code auditor workbench, and live MLOps load-testing.

## 2. Technical Architecture & Tech Stack
* **Backend Microservice**: FastAPI + PyTorch + LightGBM + Optuna + TreeSHAP (`server/main.py`, Port 8013).
* **Frontend Platform**: React 18 + Vite + TypeScript + Lucide Icons (`client/`, Port 5186).
* **Matt Pocock Patterns**: Discriminated Unions (`AsyncState<T>`, `AdminTab`), Branded Types (`TripId`, `ClusterId`), and Zod runtime schema inference.

## 3. Mathematical Formulations & Multi-Task Design
* **Revenue Optimization Objective**:
  $$\max_{\theta} \mathbb{E}_{(x, y) \sim \mathcal{D}} \left[ \hat{y}_{\text{fare}}(x; \theta) \cdot \Phi(x; \theta) - C_{\text{dispatch}}(x) \right]$$
* **TreeSHAP Additive Force Decomposition**:
  $$\hat{y}_{\text{fare}}(x) = \phi_0 + \sum_{i=1}^{M} \phi_i(x), \quad \phi_0 = \$18.50 \text{ USD}$$
* **Population Stability Index (PSI) Drift Formulation**:
  $$\text{PSI} = \sum_{k=1}^K (P_k - B_k) \ln\left( \frac{P_k}{B_k} \right)$$

## 4. Step-by-Step Execution Checklist
- [x] **Phase 1: Business Understanding**: Authored Assumptions Log (5 items), KPI targets, and ROI sizing ($4.82M/yr).
- [x] **Phase 2: Data Understanding**: Automated 6-Dimension Quality Audit (Grade A+ 99.85%), Programmatic 6-subtab EDA suite, and Spatial K-Means clustering ($k=6$).
- [x] **Phase 3: Data Preparation**: Leakage-free `ColumnTransformer` with cyclical time embeddings and Haversine/Manhattan geometry.
- [x] **Phase 4: Modeling**: AutoResearch 7-model tournament, Optuna 30-trial Bayesian HPO, and 5-stage feature ablation matrix.
- [x] **Phase 5: Evaluation & XAI**: Global & local TreeSHAP force plots, Partial Dependence Plots (PDP), and Peer Review QA checklist.
- [x] **Phase 6: Deployment & MLOps**: FastAPI microservice on Port 8013, React frontend on Port 5186, PSI drift monitor, and Live Concurrency Load Tester.
- [x] **Admin & Architecture Portal**: 10-Page KaTeX LaTeX academic paper viewer, 6-subtab EDA suite, spatial clustering map, leaderboard, SHAP viewer, Code Auditor, Load Tester, and "How This App Is Built" 27-Skills Operational Matrix.
- [x] **Safe Skills Integration**: Integrated 6 safe CRISP-DM skills (`crisp-dm-audit-framework`, `fairness-bias-audit`, `shap-interpretability-guide`, `mlops-model-monitoring`, `calibration-and-uncertainty`, `causal-inference-analysis`).

## 5. Verification & Acceptance Criteria
* `python scripts/test_project_13.py` passes all 10 automated test suites with 100% success.
* `python scripts/browser_test_suite.py` passes all 12 Playwright browser automation test steps with 100% success.

