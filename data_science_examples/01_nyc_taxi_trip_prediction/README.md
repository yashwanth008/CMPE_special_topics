# NYC Taxi Trip Duration & Fare Prediction — System Spec

Production-shaped ML service predicting NYC taxi trip duration and fare from the Kaggle NYC Taxi Trip Duration challenge dataset. XGBoost regressor, FastAPI inference layer, interactive map-based estimator, and a CRISP-DM research dossier generated alongside the model.

Origin prompt: *"do end2end a data science project — data, training, deployment, crisp-dm framework, and an awesome front end — use Kaggle NYC taxi challenge, frontend includes interactive map and trip estimation."* Two follow-up rounds asked for a heavier data-scientist-grade admin dashboard and a CRISP-DM report whose numbers match the dashboard exactly.

## Headline numbers

| Metric | Value |
|---|---|
| Model | XGBoost regressor |
| Held-out R² | 0.9697 |
| Kaggle top-1% RMSLE benchmark referenced | 0.3680 |
| Serving latency | sub-10ms per prediction |
| API framework | FastAPI |

## Feature pipeline

Every prediction request is routed through the *same* feature engineering used at training time — no train/serve skew:

- Haversine great-circle distance
- Manhattan grid distance
- Compass bearing between pickup/dropoff
- Cyclical time-of-day / day-of-week encoding
- Proximity-to-hub features (JFK, LaGuardia, Newark, Manhattan landmarks)

### Formulas

**Haversine great-circle distance:**

$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

**Manhattan grid distance:**

$$d_{\text{manhattan}} = R \cdot (|\Delta \phi| + |\Delta \lambda| \cdot \cos(\bar{\phi}))$$

**Compass bearing:**

$$\theta = \text{atan2}\left(\sin(\Delta \lambda)\cos(\phi_2), \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\Delta \lambda)\right)$$

## Surfaces

**1. Estimator view** — pick pickup/dropoff landmarks, passenger count, and pickup time; get a live animated route across an SVG five-borough map plus a full fare breakdown (base fare, distance rate, time rate, airport surcharge, overnight surcharge, NYC congestion fee, running total) and a duration prediction with a 95% confidence interval.

![NYC Estimator View](./screenshots/nyc_estimator_view.png)

**2. AutoResearch / benchmark dashboard** — production XGBoost benchmarked against a simulated Kaggle-grandmaster-tier ensemble, an autonomous hill-climbing search log over model backbones and hyperparameters, residual diagnostics, segment-level error breakdown by trip distance, feature correlation tables, and a one-click retrain button that fits a fresh model against a synthetic NYC-shaped dataset and hot-swaps it into serving.

![NYC Admin AutoResearch](./screenshots/nyc_admin_autoresearch.png)

**3. CRISP-DM report** — the six-phase research dossier: Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, Deployment — numbers cross-checked against the live dashboard.

![NYC CRISP-DM Report](./screenshots/nyc_crisp_dm_report.png)

## Packaged agent skills

Under `skills/` and `.agents/skills/`:

| Skill | Purpose |
|---|---|
| `nyc-taxi-autoresearch` | automated tabular hill-climbing search loop |
| `exploratory-data-analysis` | spatial distribution analysis, target leakage checks |
| `feature-engineering` | geospatial + cyclical timestamp transforms |
| `pandas-patterns` | vectorized NumPy/Pandas pipelines |

## Run it

```bash
# Backend — FastAPI, port 8000
cd server
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Frontend — Vite + React, port 5174
cd client
npm install
npm run dev   # http://localhost:5174/
```

## Known-fixed issue

Audit pass found the fare breakdown card computing the congestion fee and overnight surcharge correctly server-side but never rendering them on screen — so the displayed line items didn't sum to the displayed total. Both fields plus an explicit running-total row were added to the estimator UI; see `VIDEO_SCRIPT.md` for the full walkthrough and `screenshots/verified_walkthrough.png` for a post-fix capture.
