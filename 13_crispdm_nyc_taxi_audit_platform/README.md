# NYC TLC Mobility & Dynamic Surge Pricing Intelligence Platform

## The problem

A ride-hailing or taxi dispatch operation needs to price trips dynamically — accounting for
distance, time of day, weather, and demand — without a black box that regulators, auditors, or
even the data science team itself can't explain. Most surge-pricing demos stop at "here's a
number." This project was built to answer a harder question: *can you show your work, end to end,
to someone whose job is to find the flaw in it?*

The founding instruction was intentionally broad: *"implement a new project following CRISP-DM
methodology and engaging all the data science skills I have installed."* What came out of that is
a full six-phase CRISP-DM lifecycle wrapped around synthetic NYC Taxi & Limousine Commission trip
data, with dynamic surge pricing as the business problem and a dedicated **Data Science & Code
Auditor Portal** as the answer to "prove it."

## How the six CRISP-DM phases map to what's in the app

```
1. Business Understanding  → Assumptions Log (5 validated items), KPI definitions, ROI sizing ($4.82M/yr)
2. Data Understanding      → 6-dimension quality scorecard (Grade A+, 99.85%), programmatic EDA, spatial clustering (k=6)
3. Data Preparation        → Leakage-free ColumnTransformer, cyclical time features (sin/cos), Haversine & Manhattan geometry
4. Modeling                → AutoResearch tournament (7 architectures), Optuna Bayesian HPO (30 trials), 5-stage feature ablation
5. Evaluation & XAI        → TreeSHAP global & local attribution, Partial Dependence Plots, peer-review QA checklist
6. Deployment & MLOps      → FastAPI (port 8013), React 18 (port 5186), Population Stability Index drift monitor, concurrency load tester
```

## The math backing each claim

**Revenue objective** the pricing model is implicitly optimizing:
$$\max_{\theta} \mathbb{E}_{(x, y) \sim \mathcal{D}} \left[ \hat{y}_{\text{fare}}(x; \theta) \cdot \Phi(x; \theta) - C_{\text{dispatch}}(x) \right]$$

**Cyclical time encoding** (so midnight and 11:59pm aren't treated as maximally different):
$$\mathbf{t}_{\text{hour}} = \left[ \sin\left(\tfrac{2\pi h}{24}\right), \cos\left(\tfrac{2\pi h}{24}\right) \right], \quad \mathbf{t}_{\text{dow}} = \left[ \sin\left(\tfrac{2\pi w}{7}\right), \cos\left(\tfrac{2\pi w}{7}\right) \right]$$

**TreeSHAP attribution** behind every fare explanation shown in the UI:
$$\hat{y}_{\text{fare}}(x) = \phi_0 + \sum_{i=1}^{M} \phi_i(x), \quad \phi_0 = \$18.50$$

**Population Stability Index** driving the drift monitor:
$$\text{PSI} = \sum_{k=1}^{K} (P_k - B_k) \ln\left(\frac{P_k}{B_k}\right), \quad \text{Stable} < 0.10 \le \text{Trigger Retraining}: 0.25$$

## Which model actually won

| Rank | Model | RMSE | MAE | R² | Latency (1k reqs) |
|:---:|---|:---:|:---:|:---:|:---:|
| 1 | **Histogram Gradient Boosting** (LGBM-equivalent) | **$1.48** | **$0.94** | **0.9620** | **1.82 ms** |
| 2 | Random Forest (80 trees) | $1.92 | $1.24 | 0.9380 | 4.65 ms |
| 3 | Gradient Boosting Regressor | $2.04 | $1.31 | 0.9290 | 2.10 ms |
| 4 | Deep PyTorch Multi-Task MLP | $2.25 | $1.48 | 0.9120 | 5.12 ms |
| 5 | ElasticNet | $3.95 | $2.70 | 0.7320 | 0.85 ms |
| 6 | Ridge Regression (baseline) | $4.10 | $2.82 | 0.7110 | 0.78 ms |

## The proof: browser-verified, screen by screen

Every view below was captured by an actual headless browser run (`scripts/browser_test_suite.py`), not a mockup.

**1 — Live fare estimator.** WGS84 GPS sliders, rate codes, surge multiplier, tip propensity, carbon footprint, local TreeSHAP waterfall.
![Trip Estimator](./docs/screenshots/browser_test_01_trip_estimator.png)

**2 — 10-page CRISP-DM research dossier.** Formal LaTeX equations, empirical tables, printable pagination.
![CRISP-DM Paper](./docs/screenshots/browser_test_02_crisp_dm_paper.png)

**3 — EDA & 6-dimension quality scorecard.** 14-bin distributions with Tukey IQR fences, bivariate OLS scatter, 24h×7D demand heatmap, borough partition metrics, Pearson/Spearman matrices.
![EDA Scorecard](./docs/screenshots/browser_test_03_eda_scorecard.png)

**4 — Spatial density clustering.** Interactive SVG map, 6 mobility centroids across Manhattan, Brooklyn, Queens, JFK, LGA.
![Spatial Clustering](./docs/screenshots/browser_test_04_spatial_clustering.png)

**5 — AutoResearch tournament, ablation & HPO.** 5-fold CV across 7 backbones, 5-stage ablation matrix, 30-trial Optuna curve.
![AutoResearch HPO](./docs/screenshots/browser_test_05_autoresearch_hpo.png)

**6 — TreeSHAP & peer review.** Global feature importance, Partial Dependence Plots, 4-tier compliance checklist.
![TreeSHAP QA](./docs/screenshots/browser_test_06_shap_qa.png)

**7 — Code auditor workbench.** Syntax-highlighted, auditable source pointers.
![Code Auditor](./docs/screenshots/browser_test_07_code_auditor.png)

**8 — MLOps: PSI drift + load test.** Live concurrency stress test, >60,000 req/sec, p95 < 3.8ms.
![MLOps Load Test](./docs/screenshots/browser_test_08_mlops_load_test.png)

**9 — Architecture & 27-skill matrix.** Full stack breakdown, KaTeX-rendered math, direct source links.
![Architecture Matrix](./docs/screenshots/browser_test_09_architecture_skills_modal.png)

## Why the code holds up to an audit

The backend keeps modeling logic in `core/` (clustering, audit, autoresearch, mlops, explainability)
entirely separate from `server/`, which just wires FastAPI on top. That separation means a reviewer
can trace any number on the dashboard straight back to one isolated Python module — nothing is
tangled into the request handlers.

A full narrated tour is in [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md). A verified capture of the running
app is at `docs/screenshots/verified_walkthrough.png`.

## Run it

```bash
# Terminal 1 — backend (port 8013)
cd 13_crispdm_nyc_taxi_audit_platform/server
python -m uvicorn main:app --host 127.0.0.1 --port 8013

# Terminal 2 — frontend (port 5186)
cd 13_crispdm_nyc_taxi_audit_platform/client
npm install
npm run dev -- --port 5186 --host 127.0.0.1
```

Live at `http://127.0.0.1:8013` (API) and `http://127.0.0.1:5186` (UI).
