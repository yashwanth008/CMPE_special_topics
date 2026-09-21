"""
30-Skills Operational Financial ML Architecture Matrix
Maps 30 comprehensive Data Science & Financial Engineering skills with formulas, line references, and CRISP-DM phase gates.
"""

from typing import Dict, Any, List


class FinancialArchitectureMatrix:
    def get_skills_matrix(self) -> Dict[str, Any]:
        skills = [
            {
                "skill_id": "SKILL_01",
                "skill_name": "Unit Root & Stationarity Log Transforms",
                "crisp_dm_phase": "Phase 2: Data Understanding",
                "category": "Time Series Econometrics",
                "latex_formula": r"r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)",
                "file_location": "core/data_engine.py:35-42",
                "description": "Converts non-stationary I(1) raw asset prices into weakly stationary I(0) log return series."
            },
            {
                "skill_id": "SKILL_02",
                "skill_name": "Parkinson High-Low Extreme Volatility Estimator",
                "crisp_dm_phase": "Phase 2: Data Understanding",
                "category": "Market Microstructure",
                "latex_formula": r"\sigma_P^2 = \frac{(\ln(H_t/L_t))^2}{4 \ln 2}",
                "file_location": "core/feature_pipeline.py:27-31",
                "description": "Efficient volatility estimator using intraday high and low bounds with 5x higher statistical efficiency than close-to-close."
            },
            {
                "skill_id": "SKILL_03",
                "skill_name": "Exponential Moving Average (EMA) Ribbon",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Technical Trend Analysis",
                "latex_formula": r"\text{EMA}_t = \alpha P_t + (1-\alpha) \text{EMA}_{t-1}, \quad \alpha = \frac{2}{N+1}",
                "file_location": "core/feature_pipeline.py:34-42",
                "description": "Calculates 9, 21, 50, and 200 period exponential moving average trends and relative price distances."
            },
            {
                "skill_id": "SKILL_04",
                "skill_name": "Relative Strength Index (RSI 14)",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Momentum Oscillators",
                "latex_formula": r"\text{RSI} = 100 - \frac{100}{1 + \text{RS}}, \quad \text{RS} = \frac{\overline{\text{Gain}}_{14}}{\overline{\text{Loss}}_{14}}",
                "file_location": "core/feature_pipeline.py:45-51",
                "description": "Bounded momentum oscillator identifying overbought (>70) and oversold (<30) market regimes."
            },
            {
                "skill_id": "SKILL_05",
                "skill_name": "MACD Fast/Slow Signal & Divergence Histogram",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Trend Following",
                "latex_formula": r"\text{MACD}_t = \text{EMA}_{12}(P_t) - \text{EMA}_{26}(P_t), \quad \text{Hist} = \text{MACD} - \text{EMA}_9(\text{MACD})",
                "file_location": "core/feature_pipeline.py:53-58",
                "description": "Identifies accelerating trend momentum and bullish/bearish centerline crossovers."
            },
            {
                "skill_id": "SKILL_06",
                "skill_name": "Bollinger Bands (20, 2σ) & %B Envelope",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Volatility Channels",
                "latex_formula": r"\%B = \frac{P_t - (\mu_{20} - 2\sigma_{20})}{4\sigma_{20}}",
                "file_location": "core/feature_pipeline.py:60-67",
                "description": "Dynamically adaptive standard deviation envelope measuring relative price location."
            },
            {
                "skill_id": "SKILL_07",
                "skill_name": "Average True Range (ATR 14) Volatility",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Risk Sizing",
                "latex_formula": r"\text{TR}_t = \max(H_t - L_t, |H_t - C_{t-1}|, |L_t - C_{t-1}|)",
                "file_location": "core/feature_pipeline.py:69-76",
                "description": "Measures absolute dollar volatility for dynamic position sizing and trailing stop-loss placement."
            },
            {
                "skill_id": "SKILL_08",
                "skill_name": "On-Balance Volume (OBV) Cumulative Flow",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Volume Analytics",
                "latex_formula": r"\text{OBV}_t = \text{OBV}_{t-1} + \text{sgn}(\Delta C_t) \cdot V_t",
                "file_location": "core/feature_pipeline.py:86-96",
                "description": "Accumulates institutional volume flow to confirm underlying price breakout strength."
            },
            {
                "skill_id": "SKILL_09",
                "skill_name": "CBOE VIX Implied Volatility Covariate",
                "crisp_dm_phase": "Phase 2: Data Understanding",
                "category": "Macro Risk Factors",
                "latex_formula": r"\text{VIX}^2 = \frac{2 e^{rT}}{T} \sum_i \frac{\Delta K_i}{K_i^2} Q(K_i) - \frac{1}{T}\left(\frac{F}{K_0} - 1\right)^2",
                "file_location": "core/data_engine.py:58-65",
                "description": "Integrates market fear index as an inverse risk spillover driver for equity index returns."
            },
            {
                "skill_id": "SKILL_10",
                "skill_name": "Cross-Asset Sector Momentum Ratios",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Inter-Market Analysis",
                "latex_formula": r"\mathcal{R}_{\text{Tech}} = \frac{\text{XLK}_t}{\text{SPY}_t}, \quad \mathcal{R}_{\text{Fin}} = \frac{\text{XLF}_t}{\text{SPY}_t}",
                "file_location": "core/data_engine.py:72-76",
                "description": "Monitors capital rotation between risk-on technology leaders and defensive sectors."
            },
            {
                "skill_id": "SKILL_11",
                "skill_name": "Chronological Sequential Splitting (Zero Lookahead)",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Data Governance",
                "latex_formula": r"\mathcal{D}_{\text{train}} = \{(\mathbf{x}_t, y_t)\}_{t=1}^{105}, \quad \mathcal{D}_{\text{test}} = \{(\mathbf{x}_t, y_t)\}_{t=106}^{126}",
                "file_location": "core/data_engine.py:90-96",
                "description": "Strictly partitions time series sequentially into 5-month training and 1-month forward backtest."
            },
            {
                "skill_id": "SKILL_12",
                "skill_name": "Fit-on-Train Preprocessing Isolation",
                "crisp_dm_phase": "Phase 3: Data Preparation",
                "category": "Data Governance",
                "latex_formula": r"\tilde{\mathbf{X}}_{\text{test}} = \frac{\mathbf{X}_{\text{test}} - \text{median}(\mathbf{X}_{\text{train}})}{\text{IQR}(\mathbf{X}_{\text{train}})}",
                "file_location": "core/feature_pipeline.py:108-115",
                "description": "Guarantees RobustScaler parameters are frozen from training split only without leaking test statistics."
            },
            {
                "skill_id": "SKILL_13",
                "skill_name": "Multi-Horizon Target Formulation",
                "crisp_dm_phase": "Phase 1: Business Understanding",
                "category": "Target Engineering",
                "latex_formula": r"y_{t+h} = \ln\left(\frac{P_{t+h}}{P_t}\right), \quad h \in \{1, 5\}",
                "file_location": "core/feature_pipeline.py:100-104",
                "description": "Formulates next-day and next-week cumulative log return prediction targets."
            },
            {
                "skill_id": "SKILL_14",
                "skill_name": "Amazon Chronos-T5 Foundation Model Quantization",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Foundation Time Series",
                "latex_formula": r"c_t = \text{Quantize}\left(\frac{r_t}{\sigma_{\text{hist}}}, \mathcal{V}_{4096}\right)",
                "file_location": "core/models/chronos_engine.py:18-35",
                "description": "Pretrained sequence transformer tokenizing continuous returns into 4096-token vocabulary."
            },
            {
                "skill_id": "SKILL_15",
                "skill_name": "PatchTST Subseries Patch Tokenization",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Transformer Architecture",
                "latex_formula": r"\mathbf{x}_p = \text{Unfold}(\mathbf{x}, P=8, S=4), \quad \text{Attn} = \text{Softmax}\left(\frac{\mathbf{Q}\mathbf{K}^T}{\sqrt{d}}\right)\mathbf{V}",
                "file_location": "core/models/patch_tst_engine.py:15-38",
                "description": "Channel-independent patch tokenization extracting local temporal patterns."
            },
            {
                "skill_id": "SKILL_16",
                "skill_name": "Temporal Fusion Transformer Variable Selection",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Attention Networks",
                "latex_formula": r"\mathbf{v}_t = \text{Softmax}\left(\mathbf{W}_\eta \cdot \text{ELU}(\mathbf{W}_{\text{in}}\mathbf{x}_t + \mathbf{b})\right)",
                "file_location": "core/models/tft_engine.py:20-42",
                "description": "Variable Selection Networks isolating the most relevant static and dynamic exogenous market signals."
            },
            {
                "skill_id": "SKILL_17",
                "skill_name": "2-Level Stacking DAG with OOF Meta-Features",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Ensemble Stacking",
                "latex_formula": r"\mathbf{x}_{\text{L2}} = [\mathbf{x}_{\text{raw}}, \hat{y}_{\text{LGBM}}^{\text{OOF}}, \hat{y}_{\text{XGB}}^{\text{OOF}}, \hat{y}_{\text{CatB}}^{\text{OOF}}]",
                "file_location": "core/models/stacking_engine.py:40-75",
                "description": "Hierarchical stacking meta-model trained on non-leaking cross-validated out-of-fold base predictions."
            },
            {
                "skill_id": "SKILL_18",
                "skill_name": "Deep Sequence Bi-LSTM with Multi-Head Attention",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Deep Sequence Learning",
                "latex_formula": r"\mathbf{h}_t = [\overrightarrow{\text{LSTM}}(\mathbf{x}_t); \overleftarrow{\text{LSTM}}(\mathbf{x}_t)], \quad \mathbf{c}_t = \text{MHA}(\mathbf{h}_t)",
                "file_location": "core/models/deep_sequence.py:14-45",
                "description": "Bidirectional recurrent architecture capturing both forward trend and reverse contextual dynamics."
            },
            {
                "skill_id": "SKILL_19",
                "skill_name": "GARCH(1,1) Conditional Volatility Modeling",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Econometrics",
                "latex_formula": r"\sigma_t^2 = \omega + \alpha \varepsilon_{t-1}^2 + \beta \sigma_{t-1}^2, \quad \alpha + \beta < 1",
                "file_location": "core/models/econometric.py:14-36",
                "description": "Estimates autoregressive conditional heteroskedasticity for dynamic volatility fan bounds."
            },
            {
                "skill_id": "SKILL_20",
                "skill_name": "Caruana Greedy Forward Selection Ensemble",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Ensemble Optimization",
                "latex_formula": r"m^* = \arg\max_m \text{Sharpe}\left(\frac{t-1}{t}\hat{y}_{\text{ens}}^{(t-1)} + \frac{1}{t}\hat{y}_m\right)",
                "file_location": "core/tournament_engine.py:45-72",
                "description": "Iterative greedy model blending with replacement optimizing out-of-sample risk-adjusted returns."
            },
            {
                "skill_id": "SKILL_21",
                "skill_name": "Asymmetric Pinball Quantile Loss",
                "crisp_dm_phase": "Phase 4: Modeling",
                "category": "Probabilistic Calibration",
                "latex_formula": r"\mathcal{L}_\alpha(y, \hat{q}_\alpha) = \max(\alpha(y - \hat{q}_\alpha), (1-\alpha)(\hat{q}_\alpha - y))",
                "file_location": "core/models/chronos_engine.py:48-55",
                "description": "Calibrates uncertainty fan envelopes (P10, P50, P90) under asymmetric financial risk penalties."
            },
            {
                "skill_id": "SKILL_22",
                "skill_name": "Purged & Embargoed Cross-Validation (López de Prado)",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Financial Backtesting",
                "latex_formula": r"\text{Purge}(\tau) = [t_{\text{start}} - h, t_{\text{end}}], \quad \text{Embargo} = [t_{\text{end}}, t_{\text{end}} + 5]",
                "file_location": "core/backtesting_engine.py:25-50",
                "description": "Eliminates multi-day overlap leakage and post-test autoregressive memory drift."
            },
            {
                "skill_id": "SKILL_23",
                "skill_name": "Annualized Sharpe & Sortino Ratio Computation",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Performance Attribution",
                "latex_formula": r"S = \sqrt{252}\frac{\mu - r_f}{\sigma}, \quad S_{\text{down}} = \sqrt{252}\frac{\mu - r_f}{\sigma_{\text{down}}}",
                "file_location": "core/backtesting_engine.py:65-75",
                "description": "Quantifies risk-adjusted portfolio alpha and downside semi-variance penalty."
            },
            {
                "skill_id": "SKILL_24",
                "skill_name": "Maximum Drawdown (MDD) Peak-to-Trough Analytics",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Tail Risk Management",
                "latex_formula": r"\text{MDD} = \max_t \left(\frac{\max_{\tau \le t} W_\tau - W_t}{\max_{\tau \le t} W_\tau}\right)",
                "file_location": "core/backtesting_engine.py:78-83",
                "description": "Measures largest historical capital peak-to-trough decline over the out-of-sample backtest."
            },
            {
                "skill_id": "SKILL_25",
                "skill_name": "95% & 99% Value-at-Risk (VaR) & Expected Shortfall (CVaR)",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Tail Risk Management",
                "latex_formula": r"\text{VaR}_\alpha = -\inf\{l \mid P(L \le l) \ge \alpha\}, \quad \text{CVaR}_\alpha = \mathbb{E}[L \mid L \ge \text{VaR}_\alpha]",
                "file_location": "core/backtesting_engine.py:85-92",
                "description": "Non-parametric historical quantile estimation of catastrophic daily portfolio loss."
            },
            {
                "skill_id": "SKILL_26",
                "skill_name": "Execution Slippage & Transaction Cost Modeling",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Execution Algorithms",
                "latex_formula": r"P_{\text{exec}} = P_{\text{mid}} \cdot (1 \pm \delta_{\text{slip}}), \quad \delta_{\text{slip}} = 2 \text{ bps}",
                "file_location": "core/backtesting_engine.py:15-22",
                "description": "Penalizes active portfolio turnover with realistic 2 basis point bid-ask spread friction."
            },
            {
                "skill_id": "SKILL_27",
                "skill_name": "TreeSHAP Local Additive Attribution",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Explainable AI (XAI)",
                "latex_formula": r"f(\mathbf{x}) = \mathbb{E}[f(\mathbf{x})] + \sum_{i=1}^D \phi_i, \quad \phi_i = \sum_{S \subseteq \mathcal{F}\setminus\{i\}} \frac{|S|!(|\mathcal{F}|-|S|-1)!}{|\mathcal{F}|!}(f(S\cup\{i\}) - f(S))",
                "file_location": "core/xai_engine.py:20-45",
                "description": "Decomposes single-day price forecasts into exact game-theoretic feature contributions."
            },
            {
                "skill_id": "SKILL_28",
                "skill_name": "Macroeconomic Shock Sensitivity Derivatives",
                "crisp_dm_phase": "Phase 5: Evaluation",
                "category": "Stress Testing",
                "latex_formula": r"\Delta \hat{r} = \frac{\partial \hat{r}}{\partial \text{VIX}}\Delta \text{VIX} + \frac{\partial \hat{r}}{\partial \text{TNX}}\Delta \text{TNX} + \frac{\partial \hat{r}}{\partial \text{DXY}}\Delta \text{DXY}",
                "file_location": "core/xai_engine.py:50-78",
                "description": "Simulates instantaneous tail risk shocks across interest rates, volatility, and currency markets."
            },
            {
                "skill_id": "SKILL_29",
                "skill_name": "Forensic Static AST Code Auditor",
                "crisp_dm_phase": "Phase 6: Deployment",
                "category": "Code Quality & Governance",
                "latex_formula": r"\text{Compliance} = \prod_{i=1}^{12} \mathbb{I}(\text{Rule}_i == \text{PASS}) = 1.0",
                "file_location": "core/code_auditor.py:20-60",
                "description": "Automated AST inspector verifying zero lookahead shift, fit-on-train isolation, and seed pinning."
            },
            {
                "skill_id": "SKILL_30",
                "skill_name": "High-Throughput Asynchronous FastAPI Inference",
                "crisp_dm_phase": "Phase 6: Deployment",
                "category": "Production Serving",
                "latex_formula": r"\text{Latency}_{p99} \le 20 \text{ ms} \quad \forall \text{ Endpoints}",
                "file_location": "server/main.py:40-120",
                "description": "Sub-20ms real-time REST endpoint orchestration for multi-horizon forecast delivery."
            }
        ]
        
        return {
            "title": "30-Skills Financial ML Operational Architecture Matrix",
            "total_skills": len(skills),
            "skills": skills
        }
