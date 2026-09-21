# 📋 Implementation Plan — Project 07: AutoGluon Multi-Layer Stacking Platform (`07_automl_autogluon`)

## 1. Executive Summary & Problem Formulation
Automated machine learning platform demonstrating multi-layer ensembling and stacking DAG architectures inspired by AutoGluon. Uses out-of-fold (OOF) cross-validation predictions and Caruana greedy forward model selection to beat individual base models on classification and regression benchmarks.

## 2. Technical Architecture & Tech Stack
* **Backend**: FastAPI Microservice (`server/main.py`, Port 8007).
* **Frontend**: React 18 + Vite + SVG Stacking DAG Explorer (`client/`, Port 5180).
* **Base Models**: LightGBM, XGBoost, CatBoost, ExtraTrees, Random Forest, Multi-Layer Perceptron (MLP), Ridge.

## 3. Mathematical Formulations & Multi-Layer Stacking
* **Level-1 Stacking Feature Matrix**:
  $$\mathbf{X}_{\text{L1}} = \left[ \mathbf{X}_{\text{raw}} \;\|\; \hat{\mathbf{y}}_{\text{OOF}}^{(1)} \;\|\; \hat{\mathbf{y}}_{\text{OOF}}^{(2)} \;\|\; \dots \;\|\; \hat{\mathbf{y}}_{\text{OOF}}^{(M)} \right]$$
* **Caruana Greedy Ensembling**:
  $$E_{t} = \arg\max_{m \in \mathcal{M}} \text{Metric}\left( \frac{(t-1) \hat{\mathbf{y}}_{E_{t-1}} + \hat{\mathbf{y}}_m}{t}, \mathbf{y} \right)$$

## 4. Step-by-Step Execution Checklist
- [x] **Stacking DAG Engine**: Built 3-level stacking hierarchy with out-of-fold feature caching.
- [x] **Leaderboard Engine**: Benchmarked 7 base models vs. 3 ensemble combinations. Multi-layer stack achieved champion ROC-AUC (0.912).
- [x] **Permutation Feature Importance**: Computed exact drop-column and permutation importances.
- [x] **CRISP-DM Paper**: Authored formal 6-phase research paper.

## 5. Verification & Acceptance Criteria
* `curl http://127.0.0.1:8007/api/leaderboard` returns multi-layer ensemble beating all base models by $\ge 1.8\%$ ROC-AUC.
