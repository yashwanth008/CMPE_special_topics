import React, { useState, useEffect } from 'react';
import { BarChart3, Calculator, Trophy, TrendingUp } from 'lucide-react';
import { RegressionBenchmark, FeatureImportance } from '../types';

export const Phase4Regression: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<RegressionBenchmark[]>([]);
  const [importances, setImportances] = useState<FeatureImportance[]>([]);

  // Interactive Live Predictor State
  const [age, setAge] = useState<number>(38);
  const [educationNum, setEducationNum] = useState<number>(13);
  const [hours, setHours] = useState<number>(42);
  const [capitalGain, setCapitalGain] = useState<number>(5000);
  const [prediction, setPrediction] = useState<{
    predicted_income: number;
    confidence_interval_95: [number, number];
    model_predictions: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8010/api/regression/benchmarks')
      .then((res) => res.json())
      .then((d) => {
        setBenchmarks(d.tournament_results);
        setImportances(d.feature_importances);
      })
      .catch((err) => console.error(err));
  }, []);

  const runPrediction = () => {
    fetch('http://127.0.0.1:8010/api/regression/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age,
        education_num: educationNum,
        hours_per_week: hours,
        capital_gain: capitalGain,
        capital_loss: 0,
      }),
    })
      .then((res) => res.json())
      .then((d) => setPrediction(d))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    runPrediction();
  }, [age, educationNum, hours, capitalGain]);

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <BarChart3 className="w-4 h-4" />
          <span>CRISP-DM Phase 4: Regression Modeling for Income</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Multi-Model Regression Tournament & Feature Importances
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          We benchmark a diverse model portfolio: baseline Ordinary Least Squares (OLS), $L_2$-regularized Ridge Regression, Random Forest Ensembles, and Gradient Boosting Regressors.
          Models are evaluated on an unseen 20% holdout test set using $R^2$, RMSE, MAE, and MAPE metrics.
        </p>
      </div>

      {/* Model Benchmark Tournament Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Regression Tournament Leaderboard (Holdout Test Set)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">80/20 Train-Test Split</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2.5">Model Architecture</th>
                <th className="p-2.5 text-center text-blue-400 font-bold">$R^2$ Score</th>
                <th className="p-2.5 text-center">RMSE ($)</th>
                <th className="p-2.5 text-center">MAE ($)</th>
                <th className="p-2.5 text-center">MAPE (%)</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b, i) => (
                <tr
                  key={b.model_name}
                  className={`border-b border-slate-800/40 hover:bg-slate-800/30 ${
                    i === benchmarks.length - 1 ? 'bg-blue-500/5 font-semibold text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="p-2.5 flex items-center gap-2">
                    {i === benchmarks.length - 1 && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{b.model_name}</span>
                  </td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">{b.r2_score}</td>
                  <td className="p-2.5 text-center font-mono">${b.rmse.toLocaleString()}</td>
                  <td className="p-2.5 text-center font-mono">${b.mae.toLocaleString()}</td>
                  <td className="p-2.5 text-center font-mono">{b.mape_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Live Wage Estimator + Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Interactive Predictor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            Live Income Prediction Simulator
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Age:</span>
                <span className="font-mono text-white">{age} years</span>
              </div>
              <input
                type="range"
                min="18"
                max="75"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Education Level (Years):</span>
                <span className="font-mono text-white">{educationNum} years (Bachelors/Masters)</span>
              </div>
              <input
                type="range"
                min="9"
                max="16"
                value={educationNum}
                onChange={(e) => setEducationNum(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Hours per Week:</span>
                <span className="font-mono text-white">{hours} hrs/wk</span>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Capital Gains ($):</span>
                <span className="font-mono text-white">${capitalGain.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={capitalGain}
                onChange={(e) => setCapitalGain(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {prediction && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-4">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Estimated Annual Income
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ${prediction.predicted_income.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  [95% CI: ${prediction.confidence_interval_95[0].toLocaleString()} - ${prediction.confidence_interval_95[1].toLocaleString()}]
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feature Importances */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Gradient Boosting Feature Contribution Weights
          </h3>

          <div className="space-y-3">
            {importances.map((imp) => (
              <div key={imp.feature} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{imp.feature}</span>
                  <span className="text-cyan-400">{(imp.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${imp.importance * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
