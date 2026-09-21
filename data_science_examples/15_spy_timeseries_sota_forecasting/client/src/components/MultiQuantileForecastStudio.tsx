import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Cpu, Sliders, RefreshCw, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { ForecastResponse } from '../types/spy';

export const MultiQuantileForecastStudio: React.FC = () => {
  const [horizon, setHorizon] = useState<'1_day' | '5_days'>('5_days');
  const [modelSelected, setModelSelected] = useState<string>('Caruana_Greedy_Weighted_Ensemble');
  const [vixDelta, setVixDelta] = useState<number>(0);
  const [tnxDeltaBps, setTnxDeltaBps] = useState<number>(0);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8015/api/forecast/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon,
          model_override: modelSelected,
          vix_stress_delta: vixDelta,
          tnx_stress_delta: tnxDeltaBps
        })
      });
      if (res.ok) {
        const data = await res.json();
        setForecast(data);
      }
    } catch (err) {
      console.error('Forecast fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [horizon, modelSelected, vixDelta, tnxDeltaBps]);

  const modelsList = [
    { id: 'Caruana_Greedy_Weighted_Ensemble', label: 'Caruana Greedy Weighted Ensemble (Champion)' },
    { id: 'Chronos_T5_Foundation', label: 'Amazon Chronos-T5 Transformer Foundation' },
    { id: 'Temporal_Fusion_Transformer_TFT', label: 'Temporal Fusion Transformer (TFT + VSN)' },
    { id: 'Stacking_DAG_L2', label: '2-Level Stacking DAG (LGBM + XGB + CatB)' },
    { id: 'PatchTST_Transformer', label: 'PatchTST (Patch Time Series Transformer)' },
    { id: 'Deep_Sequence_BiLSTM', label: 'Bi-LSTM + Multi-Head Self-Attention' },
    { id: 'AutoARIMA_GARCH11', label: 'AutoARIMA + GARCH(1,1) Volatility Baseline' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-extrabold text-white">Multi-Quantile Price Target Studio</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                P10 • P50 • P90 Envelopes
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Probabilistic multi-step return forecast minimizing asymmetric pinball loss. Zero future lookahead guaranteed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setHorizon('1_day')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  horizon === '1_day' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Next-Day (t+1)
              </button>
              <button
                onClick={() => setHorizon('5_days')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  horizon === '5_days' ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Next-Week (t+5)
              </button>
            </div>

            <button
              onClick={fetchForecast}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Calculate
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls & Targets, Right Fan Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Forecast Targets & Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Champion Forecast Card */}
          {forecast && (
            <div className="glass-panel p-5 border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Current SPY Price</span>
                <span className="text-sm font-bold font-mono text-white">${forecast.current_price.toFixed(2)}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">1-Day Target (P50)</div>
                  <div className="text-lg font-bold font-mono text-cyan-300">${forecast.target_1d_price.toFixed(2)}</div>
                  <div className={`text-xs font-mono flex items-center gap-0.5 ${forecast.expected_return_1d_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {forecast.expected_return_1d_pct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {forecast.expected_return_1d_pct >= 0 ? '+' : ''}{forecast.expected_return_1d_pct.toFixed(2)}%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">5-Day Target (P50)</div>
                  <div className="text-lg font-bold font-mono text-emerald-300">${forecast.target_5d_price.toFixed(2)}</div>
                  <div className={`text-xs font-mono flex items-center gap-0.5 ${forecast.expected_return_5d_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {forecast.expected_return_5d_pct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {forecast.expected_return_5d_pct >= 0 ? '+' : ''}{forecast.expected_return_5d_pct.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Trading Signal Badge */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Algorithmic Signal</div>
                  <div className={`text-sm font-extrabold ${
                    forecast.directional_signal.includes('BUY') ? 'text-emerald-400' : (forecast.directional_signal.includes('SELL') ? 'text-rose-400' : 'text-amber-400')
                  }`}>
                    {forecast.directional_signal.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Confidence</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">{(forecast.signal_confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Model Backbone Selector */}
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Select Model Backbone</span>
            </div>
            <select
              value={modelSelected}
              onChange={(e) => setModelSelected(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {modelsList.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Real-Time Macro Scenario Simulator */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Macro Shock Simulator</span>
              </div>
              <button
                onClick={() => { setVixDelta(0); setTnxDeltaBps(0); }}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline"
              >
                Reset
              </button>
            </div>

            {/* VIX Shock Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>VIX Delta Shock:</span>
                <span className={vixDelta > 0 ? 'text-rose-400' : (vixDelta < 0 ? 'text-emerald-400' : 'text-slate-400')}>
                  {vixDelta > 0 ? `+${vixDelta}` : vixDelta} pts
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="15"
                step="1"
                value={vixDelta}
                onChange={(e) => setVixDelta(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* 10Y Yield Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>10-Yr Yield Shift:</span>
                <span className={tnxDeltaBps > 0 ? 'text-rose-400' : (tnxDeltaBps < 0 ? 'text-emerald-400' : 'text-slate-400')}>
                  {tnxDeltaBps > 0 ? `+${tnxDeltaBps}` : tnxDeltaBps} bps
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={tnxDeltaBps}
                onChange={(e) => setTnxDeltaBps(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Multi-Quantile Fan Chart & Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="glass-panel p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Probabilistic Fan Chart Trajectory</h3>
                <p className="text-xs text-slate-400 font-mono">P10 (Bearish 10%) • P50 (Median) • P90 (Bullish 90%)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> P90 High</span>
                <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> P50 Expected</span>
                <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> P10 Low</span>
              </div>
            </div>

            {/* SVG Fan Chart Visualizer */}
            {forecast && forecast.forecast_trajectory && (
              <div className="h-64 w-full relative bg-slate-950/60 rounded-xl border border-slate-800 p-4 flex items-center justify-center">
                <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="40" y1="120" x2="580" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="40" y1="170" x2="580" y2="170" stroke="#1e293b" strokeDasharray="3,3" />

                  {/* Fan Polygon (P10 to P90 area) */}
                  {(() => {
                    const points = forecast.forecast_trajectory;
                    const minPrice = Math.min(...points.map(p => p.p10_price), forecast.current_price) * 0.995;
                    const maxPrice = Math.max(...points.map(p => p.p90_price), forecast.current_price) * 1.005;
                    const getY = (val: number) => 180 - ((val - minPrice) / (maxPrice - minPrice)) * 150;
                    const getX = (idx: number) => 60 + idx * 105;

                    let topPath = `M ${getX(0)} ${getY(forecast.current_price)}`;
                    let bottomPath = ``;

                    points.forEach((p, i) => {
                      topPath += ` L ${getX(i+1)} ${getY(p.p90_price)}`;
                    });

                    for (let i = points.length - 1; i >= 0; i--) {
                      bottomPath += ` L ${getX(i+1)} ${getY(points[i].p10_price)}`;
                    }
                    bottomPath += ` L ${getX(0)} ${getY(forecast.current_price)} Z`;

                    const fullFanPath = topPath + bottomPath;

                    return (
                      <g>
                        {/* Shaded Fan Area */}
                        <path d={fullFanPath} fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />

                        {/* P50 Median Line */}
                        <path
                          d={`M ${getX(0)} ${getY(forecast.current_price)} ` + points.map((p, i) => `L ${getX(i+1)} ${getY(p.p50_price)}`).join(' ')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                        />

                        {/* Current Anchor Node */}
                        <circle cx={getX(0)} cy={getY(forecast.current_price)} r="4.5" fill="#f8fafc" stroke="#06b6d4" strokeWidth="2" />
                        <text x={getX(0)} y={getY(forecast.current_price) - 10} fill="#f8fafc" fontSize="10" fontFamily="monospace" textAnchor="middle">
                          Today: ${forecast.current_price.toFixed(2)}
                        </text>

                        {/* Day Nodes */}
                        {points.map((p, i) => (
                          <g key={p.day_ahead}>
                            {/* P90 Node */}
                            <circle cx={getX(i+1)} cy={getY(p.p90_price)} r="3.5" fill="#34d399" />
                            {/* P50 Node */}
                            <circle cx={getX(i+1)} cy={getY(p.p50_price)} r="4" fill="#06b6d4" />
                            {/* P10 Node */}
                            <circle cx={getX(i+1)} cy={getY(p.p10_price)} r="3.5" fill="#f87171" />

                            {/* Label */}
                            <text x={getX(i+1)} y="195" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                              t+{p.day_ahead}d
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* Trajectory Data Table */}
            {forecast && forecast.forecast_trajectory && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Horizon</th>
                      <th className="py-2 px-3 text-rose-400">P10 (Bearish 10%)</th>
                      <th className="py-2 px-3 text-cyan-400">P50 (Median)</th>
                      <th className="py-2 px-3 text-emerald-400">P90 (Bullish 90%)</th>
                      <th className="py-2 px-3 text-right">Expected Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.forecast_trajectory.map((p) => (
                      <tr key={p.day_ahead} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">t+{p.day_ahead} Trading Day</td>
                        <td className="py-2.5 px-3 text-rose-300 font-bold">${p.p10_price.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-cyan-300 font-bold">${p.p50_price.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold">${p.p90_price.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${p.expected_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.expected_return_pct >= 0 ? '+' : ''}{p.expected_return_pct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Model Breakdown Bar */}
          {forecast && forecast.all_model_p50_5d && (
            <div className="glass-panel p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                All-Backbone 5-Day Price Target Consensus
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(forecast.all_model_p50_5d).map(([modelName, price]) => (
                  <div key={modelName} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-mono truncate" title={modelName}>
                      {modelName.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm font-bold font-mono text-cyan-300 mt-1">${price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
