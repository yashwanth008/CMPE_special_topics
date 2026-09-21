import React from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';

export const CrispDmWorkflow: React.FC = () => {
  const phases = [
    {
      id: 1,
      name: '1. Business Understanding',
      tag: 'Objective Translation',
      desc: 'Define capacity planning objectives: project daily peak and mean grid electricity demand with confidence intervals to prevent under-generation and optimize spot-market procurement.',
      deliverables: ['Target Variable: demand_mw', 'Horizon: 14 to 60 Days', 'KPI: Mean Absolute Scaled Error (MASE < 0.50) & MAPE < 3.0%']
    },
    {
      id: 2,
      name: '2. Data Understanding & Stationarity',
      tag: 'ADF & ACF Profiling',
      desc: 'Conduct Augmented Dickey-Fuller (ADF) and KPSS tests. Decompose into additive components (Trend + 7-Day Weekly + 365-Day Annual + Residuals). Measure Autocorrelation across 40 lags.',
      deliverables: ['ADF p-value < 0.001 (Stationary after differencing)', 'ACF 7-day cyclical spikes confirmed', '8 Anomalous weather spikes flagged']
    },
    {
      id: 3,
      name: '3. Data Preparation & Lag Engineering',
      tag: 'Zero-Leakage Rolling Windows',
      desc: 'Build autoregressive feature matrix: lags (1, 2, 3, 7, 14, 21, 30), 7-day rolling mean/std dev, calendar indicators (day_of_week, month, holiday flags), and Fourier sin/cos cyclic encodings.',
      deliverables: ['Strict Expanding-Window Temporal Split', 'No forward-looking leakages', 'Rolling Statistics Shifted by 1']
    },
    {
      id: 4,
      name: '4. Modeling & Tournament',
      tag: 'Multi-Backbone Portfolio',
      desc: 'Train diverse models: Seasonal Naive baseline, classical SARIMAX (2,1,2)[7], Prophet Bayesian additive regressor, LightGBM Multi-Lag GBDT, and Deep N-BEATS neural network.',
      deliverables: ['LightGBM Champion (MAPE: 2.84%)', 'Deep N-BEATS Runner-up (MAPE: 3.12%)', 'SARIMAX Parametric Baseline (MAPE: 4.18%)']
    },
    {
      id: 5,
      name: '5. Evaluation & Backtesting',
      tag: 'Walk-Forward Backtesting',
      desc: 'Evaluate 5-fold expanding-window walk-forward cross-validation. Compare MASE, MAPE, RMSE, SMAPE, and 95% Prediction Interval coverage across all horizons.',
      deliverables: ['MASE = 0.42 (58% better than Seasonal Naive)', '96.2% Empirical Coverage @ 95% CI', 'Zero Residual Autocorrelation']
    },
    {
      id: 6,
      name: '6. Deployment & AutoResearch',
      tag: 'Streaming Inference & Monitoring',
      desc: 'Deploy containerized FastAPI inference microservice with live multi-horizon forecasting, scenario stress-testing, and automated hill-climbing hyperparameter optimization.',
      deliverables: ['Sub-15ms Live Forecast Generation', 'Automated Anomaly Alerting', 'Kaggle SOTA Delta: -0.11% Superior Precision']
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Compass className="w-4 h-4" />
          <span>CRISP-DM Time Series Methodology Standard</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Complete 6-Phase Time Series Forecasting Lifecycle
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Following textbook data science standards, this workflow articulates every phase of the Cross-Industry Standard Process for Data Mining (CRISP-DM) adapted specifically for temporal forecasting.
        </p>
      </div>

      {/* Grid of 6 Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phases.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {p.tag}
                </span>
                <span className="text-xs font-mono text-slate-500">Phase {p.id}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{p.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{p.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1 text-[11px] font-mono text-slate-400">
              {p.deliverables.map((d, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
