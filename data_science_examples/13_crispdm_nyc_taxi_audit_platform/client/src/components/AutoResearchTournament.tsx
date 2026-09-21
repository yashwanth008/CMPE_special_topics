import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Sliders, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export const AutoResearchTournament: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/models/tournament')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400 font-mono">Running AutoResearch multi-backbone tournament...</p>
      </div>
    );
  }

  const tournament = data?.tournament?.tournament_results || [];
  const ablations = data?.ablations || [];
  const optuna = data?.optuna_hpo;

  return (
    <div className="space-y-8">
      {/* Tournament Leaderboard Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Multi-Backbone AutoResearch Tournament (5-Fold CV)
          </h3>
          <span className="text-xs font-mono text-emerald-400">
            Champion: {data?.tournament?.best_model_name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Model Architecture</th>
                <th className="pb-3">RMSE (USD)</th>
                <th className="pb-3">MAE (USD)</th>
                <th className="pb-3">R² Score</th>
                <th className="pb-3">WAPE (%)</th>
                <th className="pb-3">Train Time</th>
                <th className="pb-3">Inf Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tournament.map((m: any) => (
                <tr key={m.rank} className={m.rank === 1 ? 'bg-amber-500/10 font-bold' : 'hover:bg-slate-800/30'}>
                  <td className="py-3 text-amber-400">#{m.rank}</td>
                  <td className="py-3 text-white font-semibold flex items-center gap-2">
                    {m.rank === 1 && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    {m.model_name}
                  </td>
                  <td className="py-3 text-amber-300 font-bold">${m.rmse_usd}</td>
                  <td className="py-3 text-slate-300">${m.mae_usd}</td>
                  <td className="py-3 text-cyan-300">{m.r2_score}</td>
                  <td className="py-3 text-slate-400">{m.wape_percent}%</td>
                  <td className="py-3 text-slate-400">{m.train_time_sec}s</td>
                  <td className="py-3 text-emerald-400">{m.inference_ms_per_1k} ms/1k</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Ablation Matrix */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Systematic Feature Ablation Matrix (Hypothesis Testing)
          </h3>
          <span className="text-xs font-mono text-slate-500">5 Ablation Configurations</span>
        </div>

        <div className="space-y-3">
          {ablations.map((a: any) => (
            <div
              key={a.ablation_id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono ${
                a.status === 'CHAMPION'
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-200">{a.ablation_id}: {a.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {a.features_used} Features
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">{a.status}</span>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400 block text-[10px]">RMSE</span>
                  <span className="text-amber-300 font-bold">${a.rmse_usd}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">R²</span>
                  <span className="text-cyan-300 font-bold">{a.r2_score}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Delta vs. Baseline</span>
                  <span className={`font-bold ${a.delta_rmse_pct.includes('+') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {a.delta_rmse_pct}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optuna HPO Convergence */}
      {optuna && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Optuna Bayesian Hyperparameter Optimization Trajectory (30 Trials)
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              Optimal Params: lr={optuna.best_params.learning_rate}, depth={optuna.best_params.max_depth}, n_est={optuna.best_params.n_estimators}
            </span>
          </div>

          <div className="h-44 bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-end gap-1.5 overflow-x-auto">
            {optuna.trials.map((t: any) => {
              // Map RMSE [1.4, 2.6] to bar height [20%, 95%]
              const heightPct = Math.min(95, Math.max(15, ((t.val_rmse_usd - 1.35) / 1.3) * 100));
              const isBest = t.val_rmse_usd === t.best_so_far_rmse;

              return (
                <div
                  key={t.trial_number}
                  className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-20 pointer-events-none">
                    T{t.trial_number}: ${t.val_rmse_usd} USD (lr={t.learning_rate})
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isBest ? 'bg-amber-400' : 'bg-slate-700 group-hover:bg-cyan-500'
                    }`}
                  ></div>
                  <span className="text-[9px] font-mono text-slate-500">T{t.trial_number}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
