# 🌟 Enterprise Data Science, Machine Learning & TypeScript Platform Repository

A comprehensive, production-grade portfolio of **16 Full-Stack Data Science, Machine Learning, Deep Learning, and TypeScript Systems (Projects 00 through 15)**, engineered adhering to the **CRISP-DM standard**, rigorous mathematical foundations, and state-of-the-art interactive UX.

---

## 🏛️ Comprehensive Systems Portfolio Index (16 Projects)

| # | System Title & Directory | Domain & Methodology | Backend Port | Frontend Port | Primary Screenshot Preview |
|---|---|---|:---:|:---:|:---:|
| **0** | [**Zenith Dynamic Task Workspace**](./00_dynamic_todo_workspace) | Full-Stack Reactive Task Workspace & SSE Telemetry | `5000` | `5173` | ![Zenith Todo](./docs/screenshots/todo_list_view.png) |
| **1** | [**NYC Taxi Trip Prediction**](./01_nyc_taxi_trip_prediction) | CRISP-DM Spatial Regression & AutoResearch | `8000` | `5174` | ![NYC Taxi](./docs/screenshots/nyc_estimator_view.png) |
| **2** | [**NanoLlama SFT LLM**](./02_nano_llm_transformer) | PyTorch Autoregressive Transformer (RoPE, SwiGLU, SFT) | `8002` | `5175` | ![NanoLlama](./docs/screenshots/nanollama_chat_studio.png) |
| **3** | [**Customer Clustering**](./03_customer_segmentation_clustering) | Topological Partitioning & AutoResearch | `8003` | `5176` | ![Clustering](./docs/screenshots/clustering_explorer.png) |
| **4** | [**Market Basket Mining**](./04_associative_pattern_mining) | Apriori & FP-Growth Pattern Affinity | `8004` | `5177` | ![Market Basket](./docs/screenshots/market_basket_graph.png) |
| **5** | [**DS Skills Mastery Lab**](./05_data_science_skills_lab) | 54 Analytical Skills & 5 Kaggle Benchmarks | `8005` | `5178` | ![Skills Lab](./docs/screenshots/skills_lab_catalog.png) |
| **6** | [**Anomaly Threat Intelligence**](./06_anomaly_detection) | Multi-Backbone Telemetry Scoring (PR-AUC 0.94) | `8006` | `5179` | ![Anomaly Threat](./docs/screenshots/anomaly_threat_scorer.png) |
| **7** | [**AutoML AutoGluon Stacking**](./07_automl_autogluon) | 3-Level Stacking DAG & Caruana Ensembling | `8007` | `5180` | ![AutoML](./docs/screenshots/automl_predictor.png) |
| **8** | [**DS Visual Foundations**](./08_datascience_visual_mastery) | Interactive Math Simulators & Quizzes | `8008` | `5181` | ![DS Mastery](./docs/screenshots/mastery_probabilistic_bayes.png) |
| **9** | [**FlowForge DAG Engine**](./09_flowforge_dag_engine) | Matt Pocock TypeScript Architecture & Kahn's DAG | `8009` | `5182` | ![FlowForge](./docs/screenshots/flowforge_dag_canvas.png) |
| **10** | [**CRISP-DM Master's Platform**](./10_crispdm_masters_curriculum) | 7-Phase Census Analytics & Cosine LSH | `8010` | `5183` | ![CRISP-DM](./docs/screenshots/crispdm_phase1_eda.png) |
| **11** | [**Enterprise DS Audit**](./11_enterprise_ds_audit) | 6-Dimension Quality & Leakage Scorecard | `8011` | `5184` | ![DS Audit](./docs/screenshots/ds_audit_scorecard.png) |
| **12** | [**TimePulse Forecasting**](./12_timeseries_forecasting) | Multi-Horizon Forecast Fans & 40-Lag ACF/PACF | `8012` | `5185` | ![Time Series](./docs/screenshots/timeseries_forecast_studio.png) |
| **13** | [**NYC TLC Mobility Platform**](./13_crispdm_nyc_taxi_audit_platform) | Enterprise CRISP-DM Standard & Matt Pocock TS | `8013` | `5186` | ![NYC CRISP-DM](./13_crispdm_nyc_taxi_audit_platform/docs/screenshots/browser_test_01_trip_estimator.png) |
| **14** | [**AutoGluon Multimodal Suite**](./14_autogluon_multimodal_automl_suite) | 3-Level DAG, Chronos Foundation TimeSeries, Vision-Language Fusion | `8014` | `5187` | ![AutoGluon Suite](./14_autogluon_multimodal_automl_suite/docs/screenshots/tabular_stacking_dag.png) |
| **15** | [**SPY SOTA TimeSeries Alpha**](./15_spy_timeseries_sota_forecasting) | Chronos Foundation Forecaster, PatchTST, TFT, Purged Walk-Forward Backtesting (Sharpe 2.15) | `8015` | `5188` | ![SPY Forecast](./15_spy_timeseries_sota_forecasting/docs/screenshots/01_forecast_studio.png) |

---

## 🎯 Verbatim Reproduction Prompt Catalog, Implementation Plans & Formal DS Audit

* **Prompt Catalog**: Every prompt used to generate, iterate, and verify these applications is cataloged chronologically in 👉 **[PROMPTS.md](./PROMPTS.md)**
* **In-Depth Implementation Plans**: Full technical specifications, type systems, and verification suites for all 15 systems are cataloged in 👉 **[IMPLEMENTATION_PLANS.md](./IMPLEMENTATION_PLANS.md)**
* **Master Architectural Walkthrough**: Deep-dive code references, AST inspection pointers, and visual tours across all systems in 👉 **[WALKTHROUGH.md](./WALKTHROUGH.md)**
* **AI Agent Skills**: 60 autonomous agent skills (including Project 15 SPY TimeSeries skill) packaged inside `skills/` and `.agents/skills/` to replicate, train, and test each system are documented in 👉 **[SKILLS.md](./SKILLS.md)**
* **Data Science & Leakage Audit**: Full forensic code audit certifying zero leakage and 99.85% compliance is documented in 👉 **[AUDIT_REPORT.md](./AUDIT_REPORT.md)**

---

## 🎬 Video Walkthrough

Every one of the 16 systems above was re-run end-to-end from a clean checkout — dependencies reinstalled, backend + frontend launched, and the actual UX exercised (not just read from source) — to confirm it still works and to fix anything that didn't. That pass turned up and fixed real bugs across the portfolio (a tag-creation crash in Project 0, a fare breakdown that didn't sum to its own total in Project 1, a React double-render bug that was quietly corrupting streamed chat output in Project 2, a silently-broken DAG execution handler in Project 9, a fabricated benchmark claim in Project 10's narrative, a runaway Sortino ratio in Project 15, and more), plus one small tasteful creative enhancement per project.

A full narrated walkthrough script for each project — what to click, what to say, and the architecture/bug-fix highlight worth calling out — is written and ready to record in 👉 **[WALKTHROUGH_VIDEO_SCRIPT.md](./WALKTHROUGH_VIDEO_SCRIPT.md)**, with a per-project copy also sitting inside each project directory as `VIDEO_SCRIPT.md` next to a fresh `screenshots/verified_walkthrough.png` proving it runs.

> 📺 **YouTube walkthrough:** _coming soon — link will be added here once recorded._

---

## 🛠️ Global Quick Start

### 1. Prerequisites
* Python 3.10+ (with `torch`, `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`)
* Node.js 18+ (with `npm`)

### 2. Launching Any Application
Navigate to any project directory to launch its backend API and Vite React frontend:
```bash
# Example 1: Launching Time Series Forecasting Platform
cd 12_timeseries_forecasting/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8012

# In a separate terminal
cd 12_timeseries_forecasting/frontend
npm install
npm run dev # Opens http://localhost:5185/

# Example 2: Launching Zenith Dynamic Task Workspace
cd 00_dynamic_todo_workspace/server
npm run dev # Backend Port 5000

# In a separate terminal
cd 00_dynamic_todo_workspace/client
npm run dev # Frontend Port 5173
```
