# 📋 Implementation Plan — Project 01: NYC Taxi Trip Duration Prediction (`01_nyc_taxi_trip_prediction`)

## 1. Executive Summary & Problem Formulation
Predicting taxi trip duration and fare metrics across New York City using the Kaggle NYC Taxi Challenge dataset. Implements the complete 6-phase CRISP-DM lifecycle, AutoResearch hill-climbing, geospatial Haversine/Manhattan distance calculations, and interactive map trip estimation.

## 2. Technical Architecture & Tech Stack
* **Backend**: FastAPI Microservice (`server/main.py`, Port 8000).
* **Frontend**: React 18 + Vite + Lucide Icons + Leaflet/SVG Mapping (`client/`, Port 5174).
* **Core ML Stack**: LightGBM, XGBoost, Scikit-Learn `ColumnTransformer`, NumPy, Pandas.

## 3. Mathematical Formulations & Feature Engineering
* **Haversine Great-Circle Distance ($d_{\text{hav}}$)**:
  $$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right), \quad d_{\text{hav}} = 2R \arcsin(\sqrt{a})$$
* **Manhattan L1 Grid Distance ($d_{\text{man}}$)**:
  $$d_{\text{man}} = 111.0 \cdot \left( |\Delta \phi| + |\Delta \lambda| \cos(40.75^\circ) \right)$$
* **Log-Transformed Target Objective**:
  $$\mathcal{L}_{\text{RMSLE}} = \sqrt{\frac{1}{N} \sum_{i=1}^N \left( \log(1 + y_i) - \log(1 + \hat{y}_i) \right)^2}$$

## 4. Step-by-Step Execution Checklist
- [x] **Data Processing**: Implemented WGS84 coordinate boundary validation and cyclical hour/day transformations.
- [x] **AutoResearch Engine**: Benchmarked LightGBM, XGBoost, Random Forest, and Ridge. LightGBM achieved champion score (RMSLE: 0.384).
- [x] **CRISP-DM Research Report**: Authored formal 6-phase markdown report and interactive modal.
- [x] **FastAPI Deployment**: Built `/api/predict`, `/api/eda`, `/api/models/tournament`, and `/api/crisp-dm` endpoints.

## 5. Verification & Acceptance Criteria
* `curl http://127.0.0.1:8000/api/health` returns status healthy.
* Interactive trip estimation calculates fares in $< 5$ms.
