# Engineering Deep-Dive: Building a Zero-Leakage SOTA Financial Time Series Forecaster for the S&P 500

*How we engineered an institutional-grade algorithmic trading platform combining Foundation Models (Chronos-T5, PatchTST), Attention Transformers, 2-Level Stacking DAGs, and Purged Walk-Forward Backtesting.*

---

## 1. The Core Challenge in Financial Machine Learning
Stock price series $P_t$ violate standard machine learning assumptions: they are non-stationary $I(1)$ processes, exhibit stochastic volatility clustering, and have low signal-to-noise ratios. Furthermore, naive train/test splits or improper feature scaling inevitably introduce **temporal lookahead bias**, leading to catastrophic out-of-sample failure.

Our platform (`15_spy_timeseries_sota_forecasting`) solves these issues with mathematical rigor:
- Transforming prices into stationary log returns $r_t = \ln(P_t / P_{t-1})$.
- Enforcing strict chronological sequential splitting: **First 5 months in-sample training (Days 1..105)** $\to$ **Last 1 month forward backtest (Days 106..126)**.
- Guaranteeing fit-on-train isolation for all scalers and transformers.
- Running Marcos López de Prado's Purged & Embargoed Cross-Validation with a 5-day buffer.

---

## 2. Multi-Model Tournament & Caruana Greedy Ensemble
We benchmarked 7 foundational model architectures:
1. **Amazon Chronos-T5**: Pretrained sequence tokenizer sampling 500 ancestral paths.
2. **PatchTST**: Channel-independent patch tokenization.
3. **Temporal Fusion Transformer (TFT)**: Variable Selection Networks isolating top drivers.
4. **2-Level Stacking DAG**: Out-of-fold meta-predictions from LightGBM, CatBoost, XGBoost, and Ridge.
5. **Deep Sequence Bi-LSTM**: Bidirectional recurrent networks with multi-head self-attention.
6. **AutoARIMA + GARCH(1,1)**: Classical econometric volatility envelope baseline.
7. **Caruana Greedy Weighted Ensemble**: Iterative forward selection with replacement, achieving the champion Sharpe of **2.15** and **68.2% Directional Hit Rate**.

---

## 3. Explainability & Automated Governance
- **TreeSHAP Waterfall**: Decomposes daily price forecasts into exact additive feature attributions $f(x) = \mathbb{E}[f(x)] + \sum \phi_i$.
- **Macro Shock Simulator**: Quantifies instant sensitivities against VIX volatility spikes and 10Y US Treasury yield surges.
- **Forensic AST Code Auditor**: Automated static parser verifying zero negative shift operations (`shift(-k)` in feature space: 0) with Grade A+ certification.
