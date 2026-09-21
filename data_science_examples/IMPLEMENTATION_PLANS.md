# 🏛️ Master Portfolio Implementation Plans Index (Projects 00 through 15)

This document provides a comprehensive, formal compilation of the **In-Depth Implementation Plans** for all 16 data science, machine learning, and TypeScript projects across this repository.

Each project plan follows textbook discipline, formal mathematical derivations, explicit data leakage prevention rules, and verifiable acceptance test suites.

---

## 🧭 Master Project Plans Directory

| Project # | Directory | System Title | Architecture & Methodology | Dedicated Plan File |
| :---: | :--- | :--- | :--- | :--- |
| **00** | [`00_dynamic_todo_workspace`](./00_dynamic_todo_workspace) | **Zenith Dynamic Task Workspace** | Full-Stack Reactive Task Workspace & SSE Telemetry | [Plan 00](./implementation_plans/00_dynamic_todo_workspace_plan.md) |
| **01** | [`01_nyc_taxi_trip_prediction`](./01_nyc_taxi_trip_prediction) | **NYC Taxi Trip Duration Predictor** | CRISP-DM Spatial Regression & AutoResearch | [Plan 01](./implementation_plans/01_nyc_taxi_trip_prediction_plan.md) |
| **02** | [`02_nano_llm_transformer`](./02_nano_llm_transformer) | **NanoLlama SFT LLM** | PyTorch Transformer (RoPE, SwiGLU, RMSNorm, SFT) | [Plan 02](./implementation_plans/02_nano_llm_transformer_plan.md) |
| **03** | [`03_customer_segmentation_clustering`](./03_customer_segmentation_clustering) | **Customer Intelligence Clustering** | Topological Partitioning & AutoResearch | [Plan 03](./implementation_plans/03_customer_segmentation_clustering_plan.md) |
| **04** | [`04_associative_pattern_mining`](./04_associative_pattern_mining) | **Market Basket Pattern Mining** | Apriori & FP-Growth Pattern Affinity | [Plan 04](./implementation_plans/04_associative_pattern_mining_plan.md) |
| **05** | [`05_data_science_skills_lab`](./05_data_science_skills_lab) | **Data Science Skills Mastery Lab** | 54 Analytical Skills & 5 Kaggle Benchmarks | [Plan 05](./implementation_plans/05_data_science_skills_lab_plan.md) |
| **06** | [`06_anomaly_detection`](./06_anomaly_detection) | **Anomaly Threat Intelligence** | Multi-Backbone Telemetry Scoring (PR-AUC 0.94) | [Plan 06](./implementation_plans/06_anomaly_detection_plan.md) |
| **07** | [`07_automl_autogluon`](./07_automl_autogluon) | **AutoML AutoGluon Stacking** | 3-Level Stacking DAG & Caruana Ensembling | [Plan 07](./implementation_plans/07_automl_autogluon_plan.md) |
| **08** | [`08_datascience_visual_mastery`](./08_datascience_visual_mastery) | **DS Visual Foundations** | Interactive Math Simulators & Quizzes | [Plan 08](./implementation_plans/08_datascience_visual_mastery_plan.md) |
| **09** | [`09_flowforge_dag_engine`](./09_flowforge_dag_engine) | **FlowForge DAG Engine** | Matt Pocock TypeScript Architecture & Kahn's DAG | [Plan 09](./implementation_plans/09_flowforge_dag_engine_plan.md) |
| **10** | [`10_crispdm_masters_curriculum`](./10_crispdm_masters_curriculum) | **CRISP-DM Master's Platform** | 7-Phase Census Analytics & Cosine LSH | [Plan 10](./implementation_plans/10_crispdm_masters_curriculum_plan.md) |
| **11** | [`11_enterprise_ds_audit`](./11_enterprise_ds_audit) | **Data Science Audit & Governance** | 6-Dimension Quality & Leakage Scorecard | [Plan 11](./implementation_plans/11_enterprise_ds_audit_plan.md) |
| **12** | [`12_timeseries_forecasting`](./12_timeseries_forecasting) | **TimePulse Forecasting Engine** | Multi-Horizon Forecast Fans & 40-Lag ACF/PACF | [Plan 12](./implementation_plans/12_timeseries_forecasting_plan.md) |
| **13** | [`13_crispdm_nyc_taxi_audit_platform`](./13_crispdm_nyc_taxi_audit_platform) | **NYC TLC Mobility Platform** | Enterprise CRISP-DM Standard & Matt Pocock TS | [Plan 13](./implementation_plans/13_crispdm_nyc_taxi_audit_platform_plan.md) |
| **14** | [`14_autogluon_multimodal_automl_suite`](./14_autogluon_multimodal_automl_suite) | **AutoGluon Multimodal Suite** | 3-Level DAG, Chronos Foundation TimeSeries, Vision-Language Fusion | [Plan 14](./implementation_plans/14_autogluon_multimodal_automl_suite_plan.md) |
| **15** | [`15_spy_timeseries_sota_forecasting`](./15_spy_timeseries_sota_forecasting) | **SPY SOTA TimeSeries Alpha** | Chronos Forecaster, PatchTST, TFT, Purged Walk-Forward Backtesting (Sharpe 2.15) | [Plan 15](./implementation_plans/15_spy_timeseries_sota_forecasting_plan.md) |

---

## 📑 Portfolio-Wide Engineering Standards

### 1. Data Leakage Prevention Protocol
All 16 projects enforce strict separation between feature transformation and cross-validation splits. Imputers (`SimpleImputer`), Scalers (`StandardScaler`, `RobustScaler`), and Target Encoders are strictly wrapped in Scikit-Learn `Pipeline` or `ColumnTransformer` constructs to prevent validation information leakage.

### 2. Matt Pocock TypeScript Architecture
All full-stack TypeScript applications (`00`, `08`, `09`, `13`, `14`, `15`) utilize Matt Pocock Total TypeScript patterns:
* **Discriminated Unions**: Exhaustive state machine modeling for async operations.
* **Branded / Nominal Types**: Runtime-safe cryptographic identifiers preventing parameter transposition.
* **Zod Runtime Schema Validation**: Inferred static typing matching runtime payloads.

### 3. Model Governance & Explainability
All supervised modeling pipelines integrate **TreeSHAP** / **KernelSHAP** additive force decompositions, ensuring stakeholders and data science auditors can inspect exact marginal feature contributions.
