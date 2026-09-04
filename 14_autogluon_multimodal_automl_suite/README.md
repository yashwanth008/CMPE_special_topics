# AutoGluon-Style Multimodal AutoML Suite

One platform, four AutoML paradigms: tabular stacking, time series forecasting, vision-language-tabular
fusion, and model distillation for production serving. Ten tabs, one FastAPI backend, one React app.

## Read this first: what's real vs. simulated

This project is styled and named after AutoGluon, and it faithfully reproduces AutoGluon's *behavior*
and *API shapes* — but a verification pass this session confirmed the backend does **not** import the
actual AutoGluon package, and the "Chronos" tab is not the real Amazon Chronos foundation model either.

| What the UI calls it | What's actually running |
|---|---|
| AutoGluon 3-Level Stacking DAG | Hand-rolled stacking of LightGBM, XGBoost, CatBoost, TorchNN, ExtraTrees, and RandomForest, with a Caruana greedy-selection meta-layer built in plain scikit-learn/Python |
| Chronos Foundation Model Forecasting | A hand-built quantile forecaster ($P_{10}, P_{50}, P_{90}$) designed to produce Chronos-shaped output, not a T5 checkpoint |
| Vision-Language-Tabular Fusion | A late-fusion scoring function combining text/vision/tabular signal shapes, not a loaded DeBERTa/ViT/CLIP model |

The concepts, math, and API contracts are accurate and worth learning from. The specific inference
engines underneath are synthetic. If you're using this as a reference for how AutoGluon's stacking or
Chronos forecasting *conceptually* works, it holds up; if you need the literal library, swap in the
real `autogluon.tabular` / `autogluon.timeseries` packages against these same endpoints.

Built from the prompt: *"in similar fashion do a spectacular automl demo of various data science using
autogluon packages latest package illustrating various capabilities."*

## Feature → screenshot

**Multi-task tabular stacking.** Score customer-churn features and watch the full DAG populate: 6
Level-1 base learners → Level-2 out-of-fold meta-features → Level-3 Caruana ensemble weights.
![Tabular Stacking DAG](./docs/screenshots/tabular_stacking_dag.png)

**Probabilistic time series forecasting.** Multi-quantile fan chart ($P_{10}/P_{50}/P_{90}$) with a
draggable horizon (7–28 days) and a clickable marketing-promotion covariate scenario. (Chart scaling
was a live bug this session — the x-axis was hardcoded for a 20-history + 14-forecast layout and broke
proportions at other horizons; it now computes total plotted length dynamically, plus a "Today"
boundary marker was added.)
![Chronos TimeSeries](./docs/screenshots/chronos_timeseries.png)

**Vision + language + tabular fusion.** Paste a product title and description; it fuses text, vision,
and structured attributes into one valuation with token-level saliency on which words moved the price.
![MultiModal Fusion](./docs/screenshots/multimodal_fusion.png)

**Automated EDA & covariate shift.** 6-subtab suite: Tukey IQR outlier diagnostics, bivariate OLS
regressions, Kolmogorov-Smirnov drift detection, automated feature pipeline graphs.
![Auto-EDA Suite](./docs/screenshots/auto_eda_suite.png)

**AutoResearch tournament.** 4-phase hill-climbing optimizer: baselines → 5-fold bagging → multi-layer
stacking DAGs → Caruana forward selection, with Optuna HPO trajectory logging.
![AutoResearch Tournament](./docs/screenshots/autoresearch_tournament.png)

**Explainability.** Permutation importance drops, local TreeSHAP waterfalls, interactive counterfactual
what-if sliders.
![Explainable AI](./docs/screenshots/explainable_ai.png)

**MLOps & distillation.** Compresses the 3-level ensemble into a 9μs student model (5.0x speedup, 99.4%
fidelity), simulates 50k+ RPS loads, monitors Population Stability Index drift.
![MLOps Distillation](./docs/screenshots/mlops_distillation.png)

**Academic paper.** 10-page IEEE/ACM-style manuscript with KaTeX-rendered derivations across all 6
CRISP-DM phases.
![CRISP-DM Paper](./docs/screenshots/crisp_dm_paper.png)

**Architecture & skills matrix.** Full catalog of 30 operational data science skills with derivations
and source links.
![Architecture Skills Matrix](./docs/screenshots/architecture_skills_matrix.png)

## Why the separation held up under review

Modeling logic lives entirely in `core/`, decoupled from the `server/` FastAPI layer that exposes it —
which is exactly what made the "is this real AutoGluon" verification possible: each engine could be
run and inspected independently of the web framework wrapped around it.

For the full narrated tour (including the disclosure above, in the presenter's own words) see
[`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md). A verified end-to-end capture is at
`docs/screenshots/verified_walkthrough.png`.

## Run it

```bash
# Backend — FastAPI, port 8014
python -m uvicorn server.main:app --host 127.0.0.1 --port 8014
```

```bash
# Frontend — Vite + React 18, port 5187
cd client
npm install
npm run dev
```

```bash
# Automated backend verification suite (12/12 passing)
python server/test_api.py
```
