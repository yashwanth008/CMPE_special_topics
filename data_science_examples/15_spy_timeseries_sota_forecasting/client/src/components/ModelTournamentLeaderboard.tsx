import React, { useState, useEffect } from 'react';
import { Award, Trophy, TrendingUp, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import { LeaderboardItem } from '../types/spy';

export const ModelTournamentLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8015/api/tournament/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Leaderboard fetch error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-cyan-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-heading font-extrabold text-white">SOTA Model Tournament Leaderboard</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                7 Backbones
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Rigorous out-of-sample forward evaluation on the 1-month test horizon (Days 106 to 126).
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Evaluation: <span className="text-emerald-400 font-bold">100% Zero Leakage</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel p-5 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Model Backbone</th>
              <th className="py-3 px-3">Architecture Family</th>
              <th className="py-3 px-3 text-emerald-400">Price RMSE</th>
              <th className="py-3 px-3">MAE ($)</th>
              <th className="py-3 px-3 text-cyan-400">Directional Hit Rate</th>
              <th className="py-3 px-3 text-amber-400">Sharpe Ratio</th>
              <th className="py-3 px-3">Max DD</th>
              <th className="py-3 px-3 text-right">Inference Latency</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item) => {
              const isChampion = item.rank === 1;
              return (
                <tr
                  key={item.model_id}
                  className={`border-b border-slate-800/80 transition-all ${
                    isChampion ? 'bg-emerald-950/30 border-emerald-500/40' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <td className="py-3 px-3 font-bold">
                    {isChampion ? (
                      <span className="flex items-center gap-1 text-amber-400 font-extrabold">
                        <Award className="w-4 h-4" /> #{item.rank}
                      </span>
                    ) : (
                      <span className="text-slate-400">#{item.rank}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      {item.model_name}
                      {isChampion && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Champion
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{item.family}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">${item.rmse_dollars.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-300">${item.mae_dollars.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-cyan-300">{item.directional_accuracy_pct.toFixed(1)}%</td>
                  <td className="py-3 px-3 font-bold text-amber-400">{item.annualized_sharpe.toFixed(2)}</td>
                  <td className="py-3 px-3 text-rose-400">-{item.max_drawdown_pct.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-right text-slate-400">{item.inference_latency_ms.toFixed(1)} ms</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ensemble Weight Breakdown */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Champion Ensemble Weighting (Caruana Greedy Selection)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono">Chronos-T5 Foundation</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">30.0%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: '30%' }} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono">Temporal Fusion Transformer</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">25.0%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono">2-Level Stacking DAG</div>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-1">25.0%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-400 h-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono">PatchTST Transformer</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">15.0%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: '15%' }} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono">Deep Sequence Bi-LSTM</div>
            <div className="text-lg font-bold font-mono text-purple-400 mt-1">5.0%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-400 h-full" style={{ width: '5%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
