import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Calendar, Zap, Award, BarChart2, ShieldCheck, RefreshCw } from 'lucide-react';

export const ChronosTimeSeriesForecaster: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(14);
  const [modelSelected, setModelSelected] = useState<string>('Chronos-Bolt-Base');
  const [promoSchedule, setPromoSchedule] = useState<number[]>([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      // Align promo schedule length
      let plan = [...promoSchedule];
      if (plan.length < horizon) {
        while (plan.length < horizon) plan.push(0);
      } else if (plan.length > horizon) {
        plan = plan.slice(0, horizon);
      }

      const res = await fetch('http://127.0.0.1:8014/api/timeseries/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon,
          promo_plan: plan,
          model_selected: modelSelected
        })
      });
      const data = await res.json();
      setForecastData(data);

      const lbRes = await fetch('http://127.0.0.1:8014/api/timeseries/leaderboard');
      const lbData = await lbRes.json();
      setLeaderboard(lbData.leaderboard || []);
    } catch (e) {
      console.error('TimeSeries forecast error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [horizon, modelSelected]);

  const togglePromo = (index: number) => {
    const updated = [...promoSchedule];
    updated[index] = updated[index] === 1 ? 0 : 1;
    setPromoSchedule(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              AutoGluon Chronos Probabilistic TimeSeries Forecaster
            </h2>
            <p className="text-sm text-slate-400">
              Zero-shot pretrained T5 foundation model for quantile density estimation with dynamic covariates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              id="select-ts-model"
              value={modelSelected}
              onChange={(e) => setModelSelected(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold cursor-pointer"
            >
              <option value="Chronos-Bolt-Base">🏆 Chronos-Bolt-Base (T5 Foundation)</option>
              <option value="DynamicWeightedEnsemble_TS">Dynamic Weighted Ensemble</option>
              <option value="PatchTST">PatchTST Transformer</option>
              <option value="DeepAR">DeepAR Probabilistic RNN</option>
              <option value="AutoARIMA">AutoARIMA Statistical</option>
              <option value="SeasonalNaive">SeasonalNaive Lag-7</option>
            </select>

            <button
              id="btn-run-ts-forecast"
              onClick={fetchForecast}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Generate Quantile Forecast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Forecast Visualizer & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Forecast Fan Chart & Schedule */}
        <div className="lg:col-span-8 glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Probabilistic Quantile Fan Chart (P10 - P50 - P90)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Horizon:</span>
              <input
                id="slider-ts-horizon"
                type="range"
                min="7"
                max="28"
                step="7"
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="w-24 accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 font-bold">{horizon} Days</span>
            </div>
          </div>

          {/* SVG Multi-Quantile Forecast Fan Chart */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 relative">
            <div className="flex items-center justify-end gap-4 text-[11px] mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-cyan-500/30 rounded border border-cyan-400/50" />
                <span className="text-slate-300">80% Confidence (P10-P90)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400" />
                <span className="text-slate-300">Median P50 / Mean</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">Promotion Spike</span>
              </div>
            </div>

            {forecastData ? (
              <div className="space-y-4">
                {/* SVG Visual Canvas */}
                <div className="h-64 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="fanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[40, 90, 140, 190].map((y, i) => (
                      <line key={i} x1="0" y1={y} x2="700" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    ))}

                    {/* "Today" boundary marker between history and forecast */}
                    {(() => {
                      const hist = forecastData.history.slice(-20);
                      const totalLen = hist.length + forecastData.forecast.length;
                      const boundaryX = ((hist.length - 1) / (totalLen - 1)) * 700;
                      return (
                        <g>
                          <line x1={boundaryX} y1="0" x2={boundaryX} y2="220" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                          <text x={boundaryX + 4} y="14" fill="#fbbf24" fontSize="9" fontFamily="monospace">TODAY</text>
                        </g>
                      );
                    })()}

                    {/* Historical trajectory */}
                    {(() => {
                      const hist = forecastData.history.slice(-20);
                      const fcastLen = forecastData.forecast.length;
                      const totalLen = hist.length + fcastLen;
                      const maxVal = 2600;
                      const minVal = 800;
                      const points = hist.map((pt: any, idx: number) => {
                        const x = (idx / (totalLen - 1)) * 700;
                        const y = 220 - ((pt.demand - minVal) / (maxVal - minVal)) * 180;
                        return `${x},${y}`;
                      });
                      return (
                        <polyline
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          points={points.join(' ')}
                        />
                      );
                    })()}

                    {/* Forecast Fan Area (P90 down to P10) */}
                    {(() => {
                      const hist = forecastData.history.slice(-20);
                      const fcast = forecastData.forecast;
                      const totalLen = hist.length + fcast.length;
                      const maxVal = 2600;
                      const minVal = 800;
                      const startX = ((hist.length - 1) / (totalLen - 1)) * 700;
                      const lastHistY = 220 - ((forecastData.history.slice(-1)[0].demand - minVal) / (maxVal - minVal)) * 180;

                      let upperPoints = [`${startX},${lastHistY}`];
                      let lowerPoints = [`${startX},${lastHistY}`];

                      fcast.forEach((pt: any, idx: number) => {
                        const x = ((hist.length + idx) / (totalLen - 1)) * 700;
                        const y90 = 220 - ((pt.p90 - minVal) / (maxVal - minVal)) * 180;
                        const y10 = 220 - ((pt.p10 - minVal) / (maxVal - minVal)) * 180;
                        upperPoints.push(`${x},${y90}`);
                        lowerPoints.unshift(`${x},${y10}`);
                      });

                      const polygonPoints = [...upperPoints, ...lowerPoints].join(' ');
                      return <polygon points={polygonPoints} fill="url(#fanGradient)" />;
                    })()}

                    {/* Forecast Median Line */}
                    {(() => {
                      const hist = forecastData.history.slice(-20);
                      const fcast = forecastData.forecast;
                      const totalLen = hist.length + fcast.length;
                      const maxVal = 2600;
                      const minVal = 800;
                      const startX = ((hist.length - 1) / (totalLen - 1)) * 700;
                      const lastHistY = 220 - ((forecastData.history.slice(-1)[0].demand - minVal) / (maxVal - minVal)) * 180;

                      let medPoints = [`${startX},${lastHistY}`];
                      fcast.forEach((pt: any, idx: number) => {
                        const x = ((hist.length + idx) / (totalLen - 1)) * 700;
                        const y50 = 220 - ((pt.p50 - minVal) / (maxVal - minVal)) * 180;
                        medPoints.push(`${x},${y50}`);
                      });

                      return (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="3"
                          points={medPoints.join(' ')}
                        />
                      );
                    })()}

                    {/* Promotion markers */}
                    {forecastData.forecast.map((pt: any, idx: number) => {
                      if (!pt.promotion) return null;
                      const hist = forecastData.history.slice(-20);
                      const totalLen = hist.length + forecastData.forecast.length;
                      const maxVal = 2600;
                      const minVal = 800;
                      const x = ((hist.length + idx) / (totalLen - 1)) * 700;
                      const y50 = 220 - ((pt.p50 - minVal) / (maxVal - minVal)) * 180;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y50}
                          r="4"
                          fill="#f59e0b"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Exogenous Promotion Schedule Planner */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Exogenous Covariate Schedule (Toggle Marketing Campaign Days):
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono">
                      +350 Volume Surge / Active Promo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {forecastData.forecast.map((pt: any, idx: number) => (
                      <button
                        key={idx}
                        id={`btn-toggle-promo-${idx}`}
                        onClick={() => togglePromo(idx)}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                          promoSchedule[idx] === 1
                            ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        D+{idx + 1} {promoSchedule[idx] === 1 ? '⚡ Promo' : 'Base'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Generating Chronos foundation forecast...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Metrics & Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Metrics Card */}
          {forecastData && (
            <div className="glass-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                Forecast Aggregate Summary
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Mean Daily Demand:</span>
                  <span className="text-sm font-bold font-mono text-cyan-300">
                    {forecastData.summary_metrics.expected_mean_demand} units
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Cumulative Volume ({horizon}D):</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {forecastData.summary_metrics.total_cumulative_volume.toLocaleString()} units
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Avg Uncertainty Spread (P90-P10):</span>
                  <span className="text-sm font-bold font-mono text-amber-300">
                    ±{forecastData.summary_metrics.uncertainty_spread_p90_p10} units
                  </span>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Promo Revenue Lift:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    +{forecastData.summary_metrics.promo_boost_contribution} units
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TimeSeries Backtesting Tournament Leaderboard */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              TimeSeries Leaderboard (WQL Metric)
            </h3>

            <div className="space-y-2 text-xs">
              {leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border transition-all ${
                    item.model === modelSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>{item.model}</span>
                    <span className="text-cyan-300 font-mono">WQL: {item.wql}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{item.family}</span>
                    <span>MASE: {item.mase}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
