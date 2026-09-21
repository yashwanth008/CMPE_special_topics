import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Award, Sliders, TrendingUp, RefreshCw, Zap } from 'lucide-react';

export const AutoResearchTournament: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8014/api/autoresearch/tournament')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error('Tournament fetch error:', e));
  }, []);

  if (!data) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading AutoResearch Tournament Optimization Trajectory...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              AutoResearch 4-Phase Tabular Tournament & Hill Climbing
            </h2>
            <p className="text-sm text-slate-400">
              Autonomous search space traversal progressing through baseline models, repeated bagging, meta-feature stacking DAGs, and Caruana forward ensemble selection.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono">
            <span className="text-slate-300">Champion SOTA:</span>
            <span className="font-bold text-cyan-300">WeightedEnsemble_L3 (AUC: 0.9442)</span>
          </div>
        </div>
      </div>

      {/* 4-Phase Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.phases.map((p: any) => (
          <div key={p.phase_id} className="glass-panel p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 font-mono">PHASE {p.phase_id}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {p.status}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white">{p.name.split(':')[1]}</h4>
            <p className="text-xs text-slate-400 line-clamp-3">{p.description}</p>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Champion:</span>
                <span className="font-mono text-cyan-300 font-semibold">{p.champion_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ROC-AUC:</span>
                <span className="font-mono text-emerald-400 font-bold">{p.validation_roc_auc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Backbone Leaderboard & Ablations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Complete Model Tournament Leaderboard
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/80 text-indigo-300 border-b border-slate-700/80">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Model Backbone</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">ROC-AUC</th>
                  <th className="p-3">F1-Score</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.leaderboard.map((m: any) => (
                  <tr key={m.rank} className={m.rank === 1 ? 'bg-indigo-950/30 font-semibold' : 'hover:bg-slate-800/40'}>
                    <td className="p-3 font-mono font-bold text-cyan-300">#{m.rank}</td>
                    <td className="p-3 font-mono text-white">{m.model}</td>
                    <td className="p-3 font-mono">L{m.level}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{m.roc_auc}</td>
                    <td className="p-3 font-mono">{m.f1_score}</td>
                    <td className="p-3 font-mono text-slate-400">{m.latency_ms}ms</td>
                    <td className="p-3 text-[11px] text-slate-400">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ablation Matrix & Optuna HPO */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ablations */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Ablation Study (Empirical Layer Contributions)
            </h3>

            <div className="space-y-2 text-xs">
              {data.ablations.map((ab: any, idx: number) => (
                <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center font-semibold text-slate-200">
                    <span className="truncate pr-2">{ab.ablation}</span>
                    <span className="font-mono text-rose-400 font-bold">{ab.delta}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{ab.impact}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Optuna HPO Convergence */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Optuna Bayesian HPO Convergence (25 Trials)
            </h3>

            <div className="h-40 bg-slate-900/80 rounded-lg p-2 border border-slate-800 relative">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* Trajectory Polyline */}
                {(() => {
                  const pts = data.optuna_hpo_trajectory;
                  const minScore = 0.90;
                  const maxScore = 0.95;
                  const polyPoints = pts.map((pt: any, idx: number) => {
                    const x = (idx / (pts.length - 1)) * 280 + 10;
                    const y = 110 - ((pt.best_cumulative_roc_auc - minScore) / (maxScore - minScore)) * 90;
                    return `${x},${y}`;
                  });
                  return (
                    <polyline
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="3"
                      points={polyPoints.join(' ')}
                    />
                  );
                })()}

                {/* Trial dots */}
                {data.optuna_hpo_trajectory.map((pt: any, idx: number) => {
                  const minScore = 0.90;
                  const maxScore = 0.95;
                  const x = (idx / (data.optuna_hpo_trajectory.length - 1)) * 280 + 10;
                  const y = 110 - ((pt.trial_roc_auc - minScore) / (maxScore - minScore)) * 90;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#06b6d4"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Trial #1 (0.9020)</span>
              <span>Trial #25 (0.9442)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
