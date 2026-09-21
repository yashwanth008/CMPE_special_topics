# 🎯 Architectural Intent & Requirements: SOTA SPY Multi-Horizon Stock Forecasting & Quantitative Trading Platform

**Target Directory**: `15_spy_timeseries_sota_forecasting`  
**Standard**: CRISP-DM Standard Lifecycle Compliance & Zero Preprocessing/Temporal Leakage  
**Backend Port**: 8015 | **Frontend Port**: 5188  

---

## 1. Problem Statement & Business Intent

Predicting financial market movements for broad equity indices such as the **S&P 500 (SPY ETF)** is notoriously challenging due to non-stationarity, stochastic volatility, and low signal-to-noise ratios. Traditional time series tools (e.g. classical linear ARIMA) fail to capture non-linear regime shifts, cross-asset momentum, and macroeconomic spillover effects.

The intent of this platform is to build an **enterprise-grade, textbook-compliant, full-stack quantitative financial machine learning and algorithmic trading platform** that:
1. **Predicts Next-Day ($t+1$) and Next-Week ($t+5$) Stock Price Targets** with probabilistic multi-quantile uncertainty bounds ($P_{10}, P_{50}, P_{90}$).
2. **Orchestrates a State-of-the-Art Multi-Model Tournament**: Benchmarking Foundation Models (**Chronos-T5, PatchTST**), Attention Networks (**Temporal Fusion Transformer - TFT**), Gradient Boosted Stacking DAGs (**LightGBM + XGBoost + CatBoost**), Recurrent Deep Sequences (**Bi-LSTM + TCN**), and Classical Financial Econometrics (**AutoARIMA + GARCH(1,1)**).
3. **Integrates Multi-Modal Exogenous Market Signals**:
   - Technical Indicators: $\text{RSI}(14)$, $\text{MACD}(12,26,9)$, Bollinger Bands, $\text{ATR}(14)$, EMA ($9, 21, 50, 200$), Stochastic $\%K/\%D$, On-Balance Volume ($\text{OBV}$).
   - Macroeconomic Drivers: CBOE VIX Volatility Index (^VIX), 10-Year US Treasury Yield (^TNX), US Dollar Index (DXY).
   - Sector ETF Momentum: Technology ($\text{XLK}/\text{SPY}$), Financials ($\text{XLF}/\text{SPY}$), Semiconductors ($\text{SOXX}/\text{SPY}$).
   - NLP Market Sentiment: FOMC policy statement sentiment scores and news tone signals.
4. **Enforces Strict Zero Preprocessing & Temporal Leakage**:
   - Strict chronological sequential splitting: **First 5 months in-sample training (~105 days)** $\to$ **Last 1 month out-of-sample forward backtest (~21 days)**.
   - All scalers and feature transformers are fitted exclusively on training data and applied to test data.
   - Purged and Embargoed Walk-Forward Cross-Validation (Marcos López de Prado) to eliminate multi-step overlap leakage.
5. **Executes Quantitative Trading & Risk Backtesting**:
   - Converts price/return forecasts into executable long/short/cash allocations with confidence thresholding.
   - Generates simulated equity curves, annualized Sharpe/Sortino ratios, Maximum Drawdown ($\text{MDD}$), $95\%/99\%$ Value-at-Risk ($\text{VaR}$), and cumulative P&L against the SPY Buy-and-Hold benchmark with realistic 2 bps slippage.
6. **Embeds a Forensic Static AST Data Science Auditor**:
   - Automated code inspection scanner certifying zero lookahead operations (`shift(-k)` in feature space, `fit_transform` on test sets, global normalization).
7. **Presents Textbook Academic Rigor & Visual Excellence**:
   - 10-Page KaTeX LaTeX CRISP-DM Academic Research Paper Dossier.
   - 30 Data Science Skills Operational Financial ML Matrix & interactive modal dialog.
   - Real-time SVG candlestick and fan chart visualizer in React 18 + Tailwind CSS.

---

## 2. Non-Goals & Boundary Constraints

- **Non-Goal**: High-frequency tick-by-tick order-book execution (platform targets daily and weekly swing trading horizons $t+1, t+5$).
- **Non-Goal**: Opaque black-box predictions without interpretability (every prediction must be decomposed via TreeSHAP and variable selection weights).
- **Non-Goal**: Flawed random train/test shuffling (strictly forbidden in time series finance).
