import React, { useState, useEffect } from 'react';
import { BarChart3, AlertOctagon, TrendingUp, Shuffle, GitCommit, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AutoGluonEdaDashboard: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'distributions' | 'outliers' | 'bivariate' | 'covariate' | 'pipeline' | 'quality'>('distributions');
  const [dossier, setDossier] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('monthly_charges');

  useEffect(() => {
    fetch('http://127.0.0.1:8014/api/eda/dossier')
      .then((res) => res.json())
      .then((data) => setDossier(data))
      .catch((e) => console.error('EDA fetch error:', e));
  }, []);

  const subtabs = [
    { id: 'distributions', label: 'Feature Distributions & Moments', icon: BarChart3 },
    { id: 'outliers', label: 'Tukey IQR Outlier Fences', icon: AlertOctagon },
    { id: 'bivariate', label: 'Bivariate OLS Regressions', icon: TrendingUp },
    { id: 'covariate', label: 'KS-Test Covariate Drift', icon: Shuffle },
    { id: 'pipeline', label: 'AutoML Feature Pipeline', icon: GitCommit },
    { id: 'quality', label: '6-Dimension Quality Scorecard', icon: ShieldCheck }
  ];

  if (!dossier) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading AutoGluon Automated EDA & Covariate Shift Suite...
      </div>
    );
  }

  const currentDist = dossier.distributions.find((d: any) => d.feature === selectedFeature) || dossier.distributions[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              AutoGluon Automated Exploratory Data Analysis (Auto-EDA) Suite
            </h2>
            <p className="text-sm text-slate-400">
              Textbook-grade exploratory profiling, Kolmogorov-Smirnov covariate shift detection, and automated feature pipeline transformations.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Data Health Score:</span>
            <span className="font-mono font-bold text-emerald-300">
              {dossier.quality_scorecard.overall_health_score}% Optimal
            </span>
          </div>
        </div>

        {/* Subtabs Selector */}
        <div className="flex space-x-2 overflow-x-auto mt-6 pt-4 border-t border-slate-700/60 scrollbar-none">
          {subtabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-eda-${tab.id}`}
                onClick={() => setActiveSubtab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab 1: Feature Distributions & Moments */}
      {activeSubtab === 'distributions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Feature to Profile:
            </h3>
            <div className="space-y-2">
              {dossier.distributions.map((item: any) => (
                <button
                  key={item.feature}
                  onClick={() => setSelectedFeature(item.feature)}
                  className={`w-full p-3 rounded-lg text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedFeature === item.feature
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-medium">{item.feature}</span>
                  <span className="text-[11px] text-slate-500">μ={item.mean}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-white font-mono">{currentDist.feature} Distribution</h3>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-indigo-300">Mean: {currentDist.mean}</span>
                <span className="text-cyan-300">Median: {currentDist.median}</span>
                <span className="text-amber-300">Skew: {currentDist.skewness}</span>
              </div>
            </div>

            {/* SVG Histogram */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="h-56 w-full flex items-end gap-2 px-2 pt-4">
                {currentDist.bins.map((bin: any, idx: number) => {
                  const maxCount = Math.max(...currentDist.bins.map((b: any) => b.count));
                  const heightPct = (bin.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {bin.count}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t group-hover:from-indigo-500 group-hover:to-cyan-300 transition-all shadow-sm"
                      />
                      <div className="text-[8px] text-slate-500 font-mono rotate-45 origin-left pt-2 whitespace-nowrap">
                        {bin.bin_start}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Tukey IQR Outlier Fences */}
      {activeSubtab === 'outliers' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Tukey IQR [Q1 - 1.5×IQR, Q3 + 1.5×IQR] Diagnostic Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900/80 text-indigo-300 border-b border-slate-700/80">
                <tr>
                  <th className="p-3">Feature</th>
                  <th className="p-3">Q1 (25%)</th>
                  <th className="p-3">Median</th>
                  <th className="p-3">Q3 (75%)</th>
                  <th className="p-3">IQR</th>
                  <th className="p-3">Lower Fence</th>
                  <th className="p-3">Upper Fence</th>
                  <th className="p-3">Outlier Pct</th>
                  <th className="p-3">Engineering Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dossier.outliers_iqr.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-white">{item.feature}</td>
                    <td className="p-3 font-mono">{item.q1}</td>
                    <td className="p-3 font-mono text-cyan-300">{item.median}</td>
                    <td className="p-3 font-mono">{item.q3}</td>
                    <td className="p-3 font-mono">{item.iqr}</td>
                    <td className="p-3 font-mono text-amber-300">{item.lower_fence}</td>
                    <td className="p-3 font-mono text-amber-300">{item.upper_fence}</td>
                    <td className="p-3 font-mono font-bold text-rose-400">{item.outlier_percentage}%</td>
                    <td className="p-3 text-[11px] text-slate-300">{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Bivariate OLS Regressions */}
      {activeSubtab === 'bivariate' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dossier.bivariate_regressions.map((biv: any, idx: number) => (
            <div key={idx} className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {biv.x_axis} vs {biv.y_axis}
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                  R² = {biv.r_squared}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                OLS Fit: <span className="font-mono text-slate-200">y = {biv.slope_beta}x + {biv.intercept_alpha}</span>
              </div>

              <div className="h-44 bg-slate-900/80 rounded-lg p-2 border border-slate-800 relative">
                <svg className="w-full h-full" viewBox="0 0 200 120">
                  {/* Scatter dots */}
                  {biv.sample_points.map((pt: any, pIdx: number) => {
                    const xNorm = (pIdx % 30) * 6 + 10;
                    const yNorm = 110 - (pt.y % 100);
                    return <circle key={pIdx} cx={xNorm} cy={yNorm} r="2" fill="#818cf8" opacity="0.6" />;
                  })}
                  {/* Linear Trendline */}
                  <line x1="10" y1="95" x2="190" y2="25" stroke="#06b6d4" strokeWidth="2" strokeDasharray="2 2" />
                </svg>
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Pearson r: {biv.pearson_r}</span>
                <span>p-value: {biv.p_value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 4: KS-Test Covariate Drift */}
      {activeSubtab === 'covariate' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Kolmogorov-Smirnov Two-Sample Covariate Shift Audit</h3>
          <div className="space-y-3">
            {dossier.covariate_shift.map((shift: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono font-bold text-white text-sm">{shift.feature}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Train Mean: {shift.train_mean} | Test Mean: {shift.test_mean} | Action: {shift.action}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono text-xs">
                    <div className="text-slate-400">KS-Stat: {shift.ks_statistic}</div>
                    <div className="text-slate-400">p-val: {shift.p_value}</div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                      shift.status.includes('DRIFT')
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 5: AutoML Feature Pipeline DAG */}
      {activeSubtab === 'pipeline' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Automated Feature Engineering Pipeline Graph</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dossier.feature_pipeline_dag.map((stage: any, idx: number) => (
              <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                <div className="text-xs font-bold text-indigo-300">{stage.stage}</div>
                <div className="space-y-1">
                  {stage.operations.map((op: string, oIdx: number) => (
                    <div key={oIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span>{op}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  Output: {stage.transformed_dim}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 6: Quality Scorecard */}
      {activeSubtab === 'quality' && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">6-Dimension Enterprise Data Quality Scorecard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dossier.quality_scorecard.dimensions.map((dim: any, idx: number) => (
              <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{dim.dimension}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                    {dim.score}%
                  </span>
                </div>
                <p className="text-xs text-slate-400">{dim.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
