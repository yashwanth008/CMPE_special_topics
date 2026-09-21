import React, { useState, useEffect } from 'react';
import { Binary, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RecordItem } from '../types';

export const Phase3Outliers: React.FC = () => {
  const [contamination, setContamination] = useState<number>(0.05);
  const [data, setData] = useState<{
    total_outliers: number;
    outlier_percentage: number;
    methodology: string;
    outlier_samples: RecordItem[];
    clean_samples: RecordItem[];
  } | null>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8010/api/outliers/detect?contamination=${contamination}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, [contamination]);

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <Binary className="w-4 h-4" />
          <span>CRISP-DM Phase 3: Outlier Analysis & Processing</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Isolation Forest & Robust Statistical Diagnostics
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Outliers can severely bias Ordinary Least Squares (OLS) loss surfaces and distort clustering centroids.
          Using ensemble random partitioning trees (Isolation Forests), samples residing in sparse peripheral regions isolate with significantly shorter path depths $h(x)$.
        </p>
      </div>

      {/* Contamination Slider & KPI */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">
              Contamination Prior (γ = {(contamination * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="accent-rose-500 cursor-pointer w-48"
            />
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Identified Anomalies:</span>
              <span className="text-rose-400 font-bold">{data.total_outliers} records</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Decision Criterion:</span>
              <span className="text-slate-300">Tree Path Depth $E(h(x)) &lt; c(n)$</span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison: Isolated Outliers vs Inliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlier Samples */}
        <div className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Isolated Outlier Samples (High Deviation)
          </h3>
          <p className="text-[11px] text-slate-400">
            Records exhibiting extreme capital gains ($&gt; \$90k$), unusual age-to-income ratios, or abnormal work hours.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="p-1.5">ID</th>
                  <th className="p-1.5">Age</th>
                  <th className="p-1.5">Cap Gain</th>
                  <th className="p-1.5">Hours</th>
                  <th className="p-1.5 text-rose-400 font-bold">Income</th>
                </tr>
              </thead>
              <tbody>
                {data?.outlier_samples.slice(0, 7).map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-800/40 hover:bg-rose-500/5">
                    <td className="p-1.5 text-slate-500">{rec.id}</td>
                    <td className="p-1.5 text-slate-300">{rec.age}</td>
                    <td className="p-1.5 text-amber-400 font-bold">${rec.capital_gain.toLocaleString()}</td>
                    <td className="p-1.5 text-slate-300">{rec.hours_per_week}h</td>
                    <td className="p-1.5 text-rose-400 font-bold">${rec.annual_income.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clean Inlier Samples */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Standard Inlier Distribution Core
          </h3>
          <p className="text-[11px] text-slate-400">
            Typical demographic profiles exhibiting steady wage progression with regular variance.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="p-1.5">ID</th>
                  <th className="p-1.5">Age</th>
                  <th className="p-1.5">Cap Gain</th>
                  <th className="p-1.5">Hours</th>
                  <th className="p-1.5 text-emerald-400 font-bold">Income</th>
                </tr>
              </thead>
              <tbody>
                {data?.clean_samples.slice(0, 7).map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-800/40 hover:bg-emerald-500/5">
                    <td className="p-1.5 text-slate-500">{rec.id}</td>
                    <td className="p-1.5 text-slate-300">{rec.age}</td>
                    <td className="p-1.5 text-slate-300">${rec.capital_gain.toLocaleString()}</td>
                    <td className="p-1.5 text-slate-300">{rec.hours_per_week}h</td>
                    <td className="p-1.5 text-emerald-400 font-bold">${rec.annual_income.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
