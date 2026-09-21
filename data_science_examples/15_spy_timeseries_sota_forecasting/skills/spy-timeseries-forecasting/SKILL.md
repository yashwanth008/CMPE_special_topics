---
name: spy-timeseries-forecasting
description: State-of-the-Art Financial Time Series Forecasting & Quantitative Alpha Platform on S&P 500 ETF (SPY) with Foundation Models (Chronos-T5, PatchTST), Temporal Fusion Transformers (TFT), 2-Level Stacking DAGs, Purged Walk-Forward Backtesting, and Forensic AST Zero-Leakage Code Auditing.
---

# SPY Time Series SOTA Forecasting & Quantitative Alpha Skill

## 1. Architectural Blueprint & Mathematical Formulations
- **Stationary Log Returns**: $r_t = \ln(P_t / P_{t-1})$.
- **Multi-Step Quantile Price Target Recovery**:
  $$\hat{P}_{t+h}^{(\alpha)} = P_t \cdot \exp\left(\sum_{k=1}^h \hat{r}_{t+k}^{(\alpha)}\right), \quad \alpha \in \{0.10, 0.50, 0.90\}$$
- **Asymmetric Pinball Loss**: $\mathcal{L}_\alpha(y, \hat{q}_\alpha) = \max(\alpha(y - \hat{q}_\alpha), (1-\alpha)(\hat{q}_\alpha - y))$.
- **Caruana Greedy Forward Selection Ensemble**:
  $$\hat{\mathbf{y}}_{\text{ens}}^{(t)} = \frac{t-1}{t}\hat{\mathbf{y}}_{\text{ens}}^{(t-1)} + \frac{1}{t}\hat{\mathbf{y}}_{m^*}$$

## 2. Zero-Leakage Data Science Protocol
1. **Chronological Splitting**: 6 months dataset ($N=126$ trading days) partitioned strictly into in-sample training ($t \in [1, 105]$) and out-of-sample forward backtest ($t \in [106, 126]$).
2. **Fit-on-Train Isolation**: All scalers (`RobustScaler`) and normalizers are fitted exclusively on training splits.
3. **Purged & Embargoed Cross-Validation**: Eliminates multi-day overlap leakage and autoregressive memory drift.

## 3. Microservice Orchestration
- **FastAPI Backend**: `http://127.0.0.1:8015/`
- **React 18 Frontend**: `http://localhost:5188/`
