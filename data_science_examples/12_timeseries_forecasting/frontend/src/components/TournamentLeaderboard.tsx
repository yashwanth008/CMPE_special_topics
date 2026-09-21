import React, { useState, useEffect } from 'react';
import { Trophy, Award } from 'lucide-react';
import { ModelTournamentItem } from '../types';

export const TournamentLeaderboard: React.FC = () => {
  const [tournament, setTournament] = useState<{
    evaluation_protocol: string;
    test_horizon_days: number;
    leaderboard: ModelTournamentItem[];
  } | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8012/api/models/tournament')
      .then((res) => res.json())
      .then((d) => setTournament(d))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Trophy className="w-4 h-4" />
          <span>Walk-Forward Backtesting Tournament Leaderboard</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Multi-Model Forecasting Benchmark (140-Day Test Horizon)
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Models are evaluated across 5 expanding-window backtesting folds.
          Metrics include Mean Absolute Scaled Error (MASE vs seasonal naive baseline), Mean Absolute Percentage Error (MAPE), and 95% Confidence Interval empirical coverage.
        </p>
      </div>

      {/* Leaderboard Table */}
      {tournament && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Tournament Scorecard (Expanding Walk-Forward Validation)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Protocol: {tournament.evaluation_protocol}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2.5">Rank & Model Architecture</th>
                  <th className="p-2.5">Model Family</th>
                  <th className="p-2.5 text-center text-cyan-400 font-bold">MAPE (%)</th>
                  <th className="p-2.5 text-center text-emerald-400 font-bold">MASE</th>
                  <th className="p-2.5 text-center">RMSE (MW)</th>
                  <th className="p-2.5 text-center">95% Coverage</th>
                  <th className="p-2.5 text-right">Train Time</th>
                </tr>
              </thead>
              <tbody>
                {tournament.leaderboard.map((m) => (
                  <tr
                    key={m.rank}
                    className={`border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors ${
                      m.rank === 1 ? 'bg-cyan-500/5 font-semibold text-white' : 'text-slate-300'
                    }`}
                  >
                    <td className="p-2.5 flex items-center gap-2">
                      {m.rank === 1 ? (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      ) : (
                        <span className="w-4 text-center text-slate-500">{m.rank}</span>
                      )}
                      <span>{m.model_name}</span>
                    </td>
                    <td className="p-2.5 text-slate-400">{m.type}</td>
                    <td className="p-2.5 text-center text-cyan-400 font-bold">{m.mape}%</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">{m.mase}</td>
                    <td className="p-2.5 text-center font-mono">{m.rmse} MW</td>
                    <td className="p-2.5 text-center font-mono">{m.coverage_95_pct}%</td>
                    <td className="p-2.5 text-right font-mono text-slate-500">{m.training_time_sec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
