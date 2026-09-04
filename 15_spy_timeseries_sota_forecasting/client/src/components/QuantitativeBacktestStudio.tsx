import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, TrendingUp, ShieldAlert, Sliders, RefreshCw, CheckCircle, Percent } from 'lucide-react';
import { BacktestResponse } from '../types/spy';

export const QuantitativeBacktestStudio: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [slippageBps, setSlippageBps] = useState<number>(2.0);
  const [backtest, setBacktest] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8015/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_capital: initialCapital,
          slippage_bps: slippageBps
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBacktest(data);
      }
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, [initialCapital, slippageBps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-heading font-extrabold text-white">Quantitative Backtest &amp; Risk Studio</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Purged Walk-Forward (1-Mo)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Marcos López de Prado purged &amp; embargoed trading simulation with realistic 2 bps slippage friction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span>Slippage:</span>
              <span className="font-bold text-emerald-400">{slippageBps.toFixed(1)} bps</span>
            </div>

            <button
              onClick={runBacktest}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Simulate
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {backtest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-4 border-emerald-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Strategy P&amp;L</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              +{backtest.strategy_total_return_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ${backtest.final_equity.toLocaleString()}
            </div>
          </div>

          <div className="glass-panel p-4 border-slate-700">
            <div className="text-[10px] text-slate-400 font-mono uppercase">SPY Benchmark</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              +{backtest.benchmark_total_return_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ${backtest.benchmark_final_equity.toLocaleString()}
            </div>
          </div>

          <div className="glass-panel p-4 border-amber-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Alpha Generated</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              +{backtest.alpha_excess_return_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Over Buy-and-Hold</div>
          </div>

          <div className="glass-panel p-4 border-purple-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Sharpe Ratio</div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">
              {backtest.annualized_sharpe_ratio.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Annualized (Rf=4.5%)</div>
          </div>

          <div className="glass-panel p-4 border-indigo-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Sortino Ratio</div>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {backtest.annualized_sortino_ratio.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Downside Penalty</div>
          </div>

          <div className="glass-panel p-4 border-rose-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Max Drawdown</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              -{backtest.max_drawdown_pct.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">95% VaR: {backtest.value_at_risk_95_pct.toFixed(2)}%</div>
          </div>

          <div className="glass-panel p-4 border-teal-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Win Rate</div>
            <div className="text-xl font-bold font-mono text-teal-300 mt-1">
              {backtest.win_rate_pct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Winning Trading Days</div>
          </div>

          <div className="glass-panel p-4 border-orange-500/30">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Profit Factor</div>
            <div className="text-xl font-bold font-mono text-orange-300 mt-1">
              {backtest.profit_factor.toFixed(2)}x
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Gross Profit / Gross Loss</div>
          </div>
        </div>
      )}

      {/* Equity Curve SVG Visualizer */}
      {backtest && backtest.daily_equity_curve && (
        <div className="glass-panel p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Cumulative Out-of-Sample Equity Curve</h3>
              <p className="text-xs text-slate-400 font-mono">1-Month Forward Simulated Trading ($100k Initial)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> SOTA Strategy</span>
              <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> SPY Buy-and-Hold</span>
            </div>
          </div>

          <div className="h-64 w-full bg-slate-950/70 rounded-xl border border-slate-800 p-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              {(() => {
                const curve = backtest.daily_equity_curve;
                const minEq = Math.min(...curve.map(c => Math.min(c.strategy_equity, c.benchmark_equity))) * 0.995;
                const maxEq = Math.max(...curve.map(c => Math.max(c.strategy_equity, c.benchmark_equity))) * 1.005;

                const getY = (val: number) => 180 - ((val - minEq) / (maxEq - minEq)) * 150;
                const getX = (idx: number) => 40 + (idx / (curve.length - 1)) * 520;

                const stratPath = curve.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.strategy_equity)}`).join(' ');
                const benchPath = curve.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.benchmark_equity)}`).join(' ');

                return (
                  <g>
                    {/* Grid */}
                    <line x1="40" y1="30" x2="560" y2="30" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="90" x2="560" y2="90" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="40" y1="150" x2="560" y2="150" stroke="#1e293b" strokeDasharray="3,3" />

                    {/* Benchmark Path */}
                    <path d={benchPath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,4" />

                    {/* Strategy Path */}
                    <path d={stratPath} fill="none" stroke="#10b981" strokeWidth="3" />

                    {/* Final Nodes */}
                    <circle cx={getX(curve.length - 1)} cy={getY(curve[curve.length - 1].strategy_equity)} r="5" fill="#34d399" />
                    <text x={getX(curve.length - 1) + 8} y={getY(curve[curve.length - 1].strategy_equity) + 4} fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      ${curve[curve.length - 1].strategy_equity.toLocaleString()}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Underwater Drawdown Chart */}
          <div className="mt-6 h-32 w-full bg-slate-950/70 rounded-xl border border-slate-800 p-4">
            <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">Underwater Drawdown Curve (% Off Equity Peak)</div>
            <svg viewBox="0 0 600 80" className="w-full h-24 overflow-visible">
              {(() => {
                const curve = backtest.daily_equity_curve;
                const maxDd = Math.max(...curve.map(c => c.drawdown_pct), 0.01);
                const getY = (dd: number) => 8 + (dd / maxDd) * 62;
                const getX = (idx: number) => 40 + (idx / (curve.length - 1)) * 520;

                const areaPath =
                  `M ${getX(0)} 8 ` +
                  curve.map((c, i) => `L ${getX(i)} ${getY(c.drawdown_pct)}`).join(' ') +
                  ` L ${getX(curve.length - 1)} 8 Z`;
                const linePath = curve.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.drawdown_pct)}`).join(' ');

                return (
                  <g>
                    <line x1="40" y1="8" x2="560" y2="8" stroke="#1e293b" strokeDasharray="3,3" />
                    <path d={areaPath} fill="#f43f5e" fillOpacity="0.18" stroke="none" />
                    <path d={linePath} fill="none" stroke="#fb7185" strokeWidth="2" />
                    <text x="40" y="6" fill="#64748b" fontSize="9" fontFamily="monospace">0%</text>
                    <text x="40" y="76" fill="#64748b" fontSize="9" fontFamily="monospace">-{maxDd.toFixed(2)}%</text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Trade Execution Signal Log */}
          {backtest.recent_trade_signals && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Recent Daily Signal &amp; Execution Audit Log
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">SPY Close</th>
                      <th className="py-2 px-3">Predicted 1D Return</th>
                      <th className="py-2 px-3">Position</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3 text-right">Slippage Deducted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtest.recent_trade_signals.map((sig, i) => (
                      <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-semibold text-slate-300">{sig.date}</td>
                        <td className="py-2 px-3 font-bold text-white">${sig.price.toFixed(2)}</td>
                        <td className={`py-2 px-3 font-bold ${sig.predicted_ret_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sig.predicted_ret_pct >= 0 ? '+' : ''}{sig.predicted_ret_pct.toFixed(3)}%
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sig.position === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : (sig.position === 'SHORT' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300')
                          }`}>
                            {sig.position}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{sig.action}</td>
                        <td className="py-2 px-3 text-right text-slate-400">${sig.slippage_cost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
