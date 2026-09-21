import React, { useState } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, TrendingDown } from 'lucide-react';

export const LeakageSandbox: React.FC = () => {
  const [pipelineMode, setPipelineMode] = useState<string>('proper_fit_transform');
  const [result, setResult] = useState<any>({
    mode: 'Leakage-Free Preprocessing (Best Practice)',
    leakage_detected: false,
    risk_level: 'NONE (PASSED)',
    train_rmse: 2.21,
    apparent_test_rmse: 2.28,
    true_unseen_production_rmse: 2.31,
    generalization_degradation: '< 1.5% Drift (Rock Solid)',
    root_cause: 'Imputers and Scalers fitted strictly on training partition inside cross-validation folds. Production distribution shift is accurately modeled.',
  });

  const runSimulation = (mode: string) => {
    setPipelineMode(mode);
    fetch('http://127.0.0.1:8011/api/audit/leakage-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_mode: mode, sample_size: 500 }),
    })
      .then((res) => res.json())
      .then((d) => setResult(d))
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
          <Sliders className="w-4 h-4" />
          <span>Interactive Machine Learning Governance Sandbox</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Data Leakage & Preprocessing Boundary Diagnostics
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          One of the most dangerous and common flaws in enterprise data science is subtle data leakage—fitting scalers, imputers, or encoders prior to train/test splitting.
          Use this interactive sandbox to simulate and compare leaky vs fully isolated pipelines.
        </p>
      </div>

      {/* Selector Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => runSimulation('proper_fit_transform')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            pipelineMode === 'proper_fit_transform'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          Strict Training Partition Isolation (Best Practice)
        </button>

        <button
          onClick={() => runSimulation('leaky_global_scaling')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            pipelineMode === 'leaky_global_scaling'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          Simulate Flawed Global Preprocessing Leakage
        </button>
      </div>

      {/* Simulation Result Card */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status */}
          <div
            className={`p-6 rounded-2xl border backdrop-blur-md space-y-4 ${
              result.leakage_detected
                ? 'border-rose-500/40 bg-rose-950/20'
                : 'border-emerald-500/40 bg-emerald-950/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono text-slate-300">Diagnostic Verdict</span>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  result.leakage_detected
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {result.risk_level}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{result.mode}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{result.root_cause}</p>
            </div>
          </div>

          {/* Metrics Variance */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              Generalization Error vs Production Drift
            </h3>

            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block">Train RMSE:</span>
                <span className="text-lg font-bold text-slate-200">{result.train_rmse}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block">Apparent Test RMSE:</span>
                <span className="text-lg font-bold text-blue-400">{result.apparent_test_rmse}</span>
              </div>
              <div
                className={`p-3.5 rounded-xl border text-center ${
                  result.leakage_detected
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                }`}
              >
                <span className="text-[10px] block font-medium">True Production RMSE:</span>
                <span className="text-lg font-bold">{result.true_unseen_production_rmse}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Production Drift Impact:</span>
              <span
                className={`font-bold ${
                  result.leakage_detected ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {result.generalization_degradation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
