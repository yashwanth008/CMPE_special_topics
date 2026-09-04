import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Download } from 'lucide-react';
import { TimeSeriesRecord, ForecastResponse } from '../types';

export const ForecastStudio: React.FC = () => {
  const [history, setHistory] = useState<TimeSeriesRecord[]>([]);
  const [horizon, setHorizon] = useState<number>(14);
  const [modelChoice, setModelChoice] = useState<string>('lightgbm');
  const [surgePct, setSurgePct] = useState<number>(0);
  const [forecastRes, setForecastRes] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8012/api/dataset/timeseries?limit=90')
      .then((res) => res.json())
      .then((d) => setHistory(d.records || []))
      .catch((err) => console.error(err));
  }, []);

  const runForecast = () => {
    fetch('http://127.0.0.1:8012/api/forecast/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horizon_days: horizon,
        model_choice: modelChoice,
        scenario_surge_pct: surgePct,
        confidence_level: 0.95,
      }),
    })
      .then((res) => res.json())
      .then((d) => setForecastRes(d))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    runForecast();
  }, [horizon, modelChoice, surgePct]);

  const downloadCsv = () => {
    if (!forecastRes) return;
    const header = 'step,date,forecast_mw,lower_bound_95,upper_bound_95,trend_component,seasonal_component';
    const rows = forecastRes.forecast.map((f) =>
      [f.step, f.date, f.forecast_mw, f.lower_bound_95, f.upper_bound_95, f.trend_component, f.seasonal_component].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timepulse_forecast_${modelChoice}_${horizon}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Chart Dimensions
  const chartHeight = 320;
  const chartWidth = 780;

  // Build points for SVG rendering (Last 45 days historical + Future Horizon)
  const renderHistory = history.slice(-45);
  const allValues = [
    ...renderHistory.map((r) => r.demand_mw),
    ...(forecastRes?.forecast.map((f) => f.upper_bound_95) || []),
    ...(forecastRes?.forecast.map((f) => f.lower_bound_95) || []),
  ];
  const minY = Math.min(...allValues, 1000);
  const maxY = Math.max(...allValues, 2600);
  const totalLen = renderHistory.length + (forecastRes?.forecast.length || 0);

  const getX = (idx: number) => (idx / (totalLen - 1)) * chartWidth;
  const getY = (val: number) => chartHeight - ((val - minY) / (maxY - minY)) * (chartHeight - 40) - 20;

  // Build History Path
  const historyPath = renderHistory
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.demand_mw)}`)
    .join(' ');

  // Build Forecast Path & 95% Confidence Polygon
  let forecastPath = '';
  let confidencePolygon = '';
  if (forecastRes && forecastRes.forecast.length > 0) {
    const startIdx = renderHistory.length - 1;
    const startVal = renderHistory[startIdx].demand_mw;

    const fPoints = forecastRes.forecast.map((f, i) => ({
      x: getX(startIdx + 1 + i),
      y: getY(f.forecast_mw),
      yUpper: getY(f.upper_bound_95),
      yLower: getY(f.lower_bound_95),
    }));

    forecastPath = `M ${getX(startIdx)} ${getY(startVal)} ` + fPoints.map((p) => `L ${p.x} ${p.y}`).join(' ');

    const upperLine = `M ${getX(startIdx)} ${getY(startVal)} ` + fPoints.map((p) => `L ${p.x} ${p.yUpper}`).join(' ');
    const lowerLineRev = fPoints.slice().reverse().map((p) => `L ${p.x} ${p.yLower}`).join(' ');
    confidencePolygon = `${upperLine} ${lowerLineRev} Z`;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Activity className="w-4 h-4" />
          <span>Interactive Forecasting Studio & Scenario Simulation</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Multi-Horizon Cloud Grid Energy Demand Forecaster
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Interact with multi-horizon predictions ($h = 7..60$ days) powered by LightGBM Multi-Lag GBDT, Deep N-BEATS, and SARIMAX backbones.
          Simulate weather demand surges and view expanding 95% confidence interval ribbons.
        </p>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Model Backbone</label>
            <select
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="lightgbm">LightGBM Multi-Lag GBDT (SOTA Champion)</option>
              <option value="nbeats">Deep N-BEATS Neural Forecaster</option>
              <option value="prophet">Prophet Additive Model</option>
              <option value="sarimax">SARIMAX (2,1,2)[7]</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Horizon ($h = {horizon}$ days):</span>
            </div>
            <input
              type="range"
              min="7"
              max="60"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              className="accent-cyan-500 cursor-pointer w-32"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Demand Surge ({surgePct >= 0 ? `+${surgePct}` : surgePct}%):</span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="5"
              value={surgePct}
              onChange={(e) => setSurgePct(parseInt(e.target.value))}
              className="accent-amber-500 cursor-pointer w-32"
            />
          </div>
        </div>

        {forecastRes && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Peak Demand:</span>
              <span className="text-cyan-400 font-bold">{forecastRes.summary.peak_forecast_mw} MW</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Mean Projected:</span>
              <span className="text-emerald-400 font-bold">{forecastRes.summary.mean_forecast_mw} MW</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Timeline Forecast SVG Canvas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-mono">
              <span className="w-3 h-0.5 bg-slate-400 inline-block"></span> 45-Day Actuals
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span> {horizon}-Day Forecast
            </span>
            <span className="flex items-center gap-1.5 text-cyan-500/60 font-mono">
              <span className="w-3 h-2 bg-cyan-500/20 border border-cyan-500/40 inline-block rounded-sm"></span> 95% Confidence Band
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Anomaly Flag
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Continuous 24h Aggregated Telemetry</span>
        </div>

        <div className="relative w-full h-[340px] bg-slate-950/80 rounded-xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1={getY(1500)} x2={chartWidth} y2={getY(1500)} stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="0" y1={getY(2000)} x2={chartWidth} y2={getY(2000)} stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="0" y1={getY(2500)} x2={chartWidth} y2={getY(2500)} stroke="#1e293b" strokeDasharray="4 4" />

            {/* Confidence Polygon */}
            {confidencePolygon && (
              <path d={confidencePolygon} fill="#06b6d4" opacity="0.15" />
            )}

            {/* History Line */}
            <path d={historyPath} fill="none" stroke="#94a3b8" strokeWidth="2" />

            {/* Anomaly Marker Dots on History */}
            {renderHistory.map((r, i) => {
              if (!r.is_anomaly) return null;
              return (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(r.demand_mw)}
                  r="4.5"
                  fill="#f43f5e"
                  stroke="#fff"
                  strokeWidth="1.5"
                >
                  <title>{`Anomaly on ${r.date}: ${r.demand_mw} MW`}</title>
                </circle>
              );
            })}

            {/* Forecast Line */}
            {forecastPath && (
              <path d={forecastPath} fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="6 2" />
            )}
          </svg>
        </div>
      </div>

      {/* Forecast Data Table (Head 10 horizon steps) */}
      {forecastRes && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Projected Forecast Schedule (Next {horizon} Days)
            </h3>
            <button
              onClick={downloadCsv}
              className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2">Step</th>
                  <th className="p-2">Forecast Date</th>
                  <th className="p-2 text-cyan-400 font-bold">Predicted Demand (MW)</th>
                  <th className="p-2 text-slate-400">95% Lower Bound</th>
                  <th className="p-2 text-slate-400">95% Upper Bound</th>
                  <th className="p-2 text-slate-500">Trend Term</th>
                  <th className="p-2 text-slate-500">Seasonal Term</th>
                </tr>
              </thead>
              <tbody>
                {forecastRes.forecast.map((f) => (
                  <tr key={f.step} className="border-b border-slate-800/40 hover:bg-slate-800/40">
                    <td className="p-2 text-slate-500">+{f.step}d</td>
                    <td className="p-2 text-slate-200 font-semibold">{f.date}</td>
                    <td className="p-2 text-cyan-400 font-bold text-sm font-mono">{f.forecast_mw} MW</td>
                    <td className="p-2 text-slate-400">{f.lower_bound_95} MW</td>
                    <td className="p-2 text-slate-400">{f.upper_bound_95} MW</td>
                    <td className="p-2 text-slate-500">{f.trend_component} MW</td>
                    <td className="p-2 text-slate-500">{f.seasonal_component} MW</td>
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
