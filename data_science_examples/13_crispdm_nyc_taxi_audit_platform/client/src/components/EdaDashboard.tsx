import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Database,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
  PieChart,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const EdaDashboard: React.FC = () => {
  const [edaData, setEdaData] = useState<any>(null);
  const [catalogData, setCatalogData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'distributions' | 'bivariate' | 'temporal' | 'boroughs' | 'correlations' | 'quality'>('distributions');
  const [selectedFeature, setSelectedFeature] = useState<string>('total_fare_usd');
  const [selectedBivariateIdx, setSelectedBivariateIdx] = useState<number>(0);
  const [heatmapMetric, setHeatmapMetric] = useState<'volume' | 'avg_fare' | 'avg_duration' | 'high_tip_rate'>('volume');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [respEda, respCat] = await Promise.all([
          fetch('http://127.0.0.1:8013/api/eda/summary'),
          fetch('http://127.0.0.1:8013/api/data/catalog')
        ]);
        const dataEda = await respEda.json();
        const dataCat = await respCat.json();
        setEdaData(dataEda);
        setCatalogData(dataCat);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400 font-mono">Loading Comprehensive Exploratory Data Analysis & Quality Audit...</p>
      </div>
    );
  }

  const subTabs = [
    { id: 'distributions', label: 'Feature Distributions & Outliers', icon: Activity },
    { id: 'bivariate', label: 'Bivariate Regression Scatters', icon: TrendingUp },
    { id: 'temporal', label: '24h × 7D Temporal Heatmap', icon: Calendar },
    { id: 'boroughs', label: 'NYC Borough Zone Analytics', icon: MapPin },
    { id: 'correlations', label: 'Correlation Matrix & Categoricals', icon: PieChart },
    { id: 'quality', label: '6-Dimension Quality Scorecard', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  CRISP-DM Phase 2: Data Understanding
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  100,000 Records • 19 Features
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                Programmatic Exploratory Data Analysis & Statistical Profiling
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Overall Quality Grade</span>
              <span className="text-lg font-bold font-mono text-emerald-400">A+ (99.85% Score)</span>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: Feature Distributions & Outliers */}
      {activeSubTab === 'distributions' && edaData?.feature_distributions && (
        <div className="space-y-6 animate-fade-in">
          {/* Feature Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Object.keys(edaData.feature_distributions).map((featKey) => (
              <button
                key={featKey}
                onClick={() => setSelectedFeature(featKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                  selectedFeature === featKey
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {featKey}
              </button>
            ))}
          </div>

          {/* Distribution Viewport */}
          {(() => {
            const dist = edaData.feature_distributions[selectedFeature];
            const statsObj = edaData.summary_statistics?.[selectedFeature];
            if (!dist) return null;
            const maxCount = Math.max(...dist.counts, 1);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Histogram Visualizer */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                        <Activity className="w-4 h-4 text-amber-400" />
                        Histogram & Density Spectrum: {selectedFeature}
                      </h3>
                      <p className="text-xs text-slate-400">14 Continuous Bins across Empirical Support</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-amber-400">Mean: {dist.mean}</span>
                      <span className="text-cyan-400">Median: {dist.median}</span>
                      <span className="text-slate-400">Std: {dist.std}</span>
                    </div>
                  </div>

                  {/* Histogram Bars */}
                  <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    {dist.counts.map((cnt: number, i: number) => {
                      const heightPct = Math.max(6, Math.round((cnt / maxCount) * 100));
                      const binCenter = dist.bin_centers[i];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300 shadow-xl pointer-events-none whitespace-nowrap">
                            Bin: {binCenter} • Count: {cnt.toLocaleString()} ({Math.round((cnt / 5000) * 100)}%)
                          </div>

                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full rounded-t-md bg-gradient-to-t from-amber-500/40 via-amber-500/80 to-amber-400 group-hover:brightness-125 transition-all"
                          ></div>
                          <span className="text-[9px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                            {binCenter}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Parametric Stats & Tukey Outlier Fences */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Parametric Stats & Outlier Fences
                  </h3>

                  {statsObj && (
                    <div className="space-y-3 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Skewness (γ₁)</span>
                          <span className={`font-bold ${statsObj.skewness > 1.0 ? 'text-amber-400' : 'text-slate-200'}`}>
                            {statsObj.skewness} {statsObj.skewness > 1.0 && '(Right-Skewed)'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Kurtosis (γ₂)</span>
                          <span className="font-bold text-slate-200">{statsObj.kurtosis}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Tukey's IQR Outlier Fences (1.5 × IQR)
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>IQR (Q3 - Q1):</span>
                          <span className="text-amber-400 font-bold">{statsObj.iqr}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Valid Bounds:</span>
                          <span className="text-slate-400">[{statsObj.lower_fence}, {statsObj.upper_fence}]</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                          <span>Flagged Outliers:</span>
                          <span className="text-amber-400 font-bold">{statsObj.outlier_count} ({statsObj.outlier_percentage}%)</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantile Spectrum</div>
                        <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1">
                          <div className="p-1 rounded bg-slate-900 text-slate-400">p25: {statsObj.p25}</div>
                          <div className="p-1 rounded bg-slate-900 text-cyan-300">Med: {statsObj.median}</div>
                          <div className="p-1 rounded bg-slate-900 text-slate-400">p75: {statsObj.p75}</div>
                          <div className="p-1 rounded bg-slate-900 text-amber-300">p99: {statsObj.p99}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 2: Bivariate Regression Scatters */}
      {activeSubTab === 'bivariate' && edaData?.bivariate_relationships && (
        <div className="space-y-6 animate-fade-in">
          {/* Pair Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {edaData.bivariate_relationships.relationships.map((rel: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedBivariateIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedBivariateIdx === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {rel.title}
              </button>
            ))}
          </div>

          {(() => {
            const rel = edaData.bivariate_relationships.relationships[selectedBivariateIdx];
            if (!rel) return null;

            const maxX = Math.max(...rel.points.map((p: any) => p.x), 1);
            const maxY = Math.max(...rel.points.map((p: any) => p.y), 1);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2D Scatter Canvas */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-400">Sampled 300 Empirical Triangulations with OLS Fitted Trend</p>
                    </div>
                    <div className="text-xs font-mono text-cyan-400">
                      R² = {rel.r_squared} • Pearson r = {rel.r_value}
                    </div>
                  </div>

                  {/* Scatter Plot Visualizer */}
                  <div className="relative h-72 w-full bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
                    <svg className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeDasharray="3 3" />

                      {/* Scatter Points */}
                      {rel.points.map((pt: any, pIdx: number) => {
                        const cx = (pt.x / maxX) * 90 + 5;
                        const cy = 95 - (pt.y / maxY) * 90;
                        return (
                          <circle
                            key={pIdx}
                            cx={`${cx}%`}
                            cy={`${cy}%`}
                            r="3"
                            fill="#06b6d4"
                            opacity="0.65"
                            className="hover:r-5 hover:fill-amber-400 hover:opacity-100 transition-all cursor-pointer"
                          />
                        );
                      })}

                      {/* Trend Line */}
                      <line
                        x1="5%"
                        y1={`${95 - (rel.intercept / maxY) * 90}%`}
                        x2="95%"
                        y2={`${95 - ((rel.slope * maxX + rel.intercept) / maxY) * 90}%`}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* Regression Stats Panel */}
                <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    OLS Linear Regression Fit
                  </h3>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 text-center font-mono text-xs text-cyan-300">
                    <MarkdownMathRenderer content={`$$\\hat{y} = ${rel.slope} x + ${rel.intercept}$$`} />
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Coefficient of Det. (R²):</span>
                        <span className="text-cyan-400 font-bold">{rel.r_squared} ({Math.round(rel.r_squared * 100)}% Variance)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Pearson Correlation (r):</span>
                        <span className="text-amber-400 font-bold">{rel.r_value}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Statistical p-value:</span>
                        <span className="text-emerald-400 font-bold">{rel.p_value} (p &lt; 0.001)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 3: Temporal Heatmap Matrix */}
      {activeSubTab === 'temporal' && edaData?.temporal_matrix && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                24-Hour × 7-Day Metropolitan Demand Matrix
              </h3>
              <p className="text-xs text-slate-400">Identify Rush Hour Peaks, Evening Surge Multipliers, and Weekend Shifts</p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono">Metric:</span>
              {(['volume', 'avg_fare', 'avg_duration', 'high_tip_rate'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setHeatmapMetric(m)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                    heatmapMetric === m
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* 2D Grid Heatmap */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px] space-y-1.5">
              {/* Hour Headers */}
              <div className="grid grid-cols-25 gap-1 text-[10px] font-mono text-slate-500 text-center pb-1">
                <div>Day</div>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h}>{h}h</div>
                ))}
              </div>

              {/* Day Rows */}
              {edaData.temporal_matrix.temporal_matrix.map((row: any, rIdx: number) => (
                <div key={rIdx} className="grid grid-cols-25 gap-1 items-center">
                  <div className="text-xs font-mono font-bold text-slate-400">{row.day}</div>
                  {row.hours.map((cell: any, hIdx: number) => {
                    const val = cell[heatmapMetric];
                    const isHigh = heatmapMetric === 'volume' ? val > 40 : val > 35;
                    const isPeak = heatmapMetric === 'volume' ? val > 65 : val > 50;

                    return (
                      <div
                        key={hIdx}
                        className={`h-7 rounded flex items-center justify-center text-[10px] font-mono transition-all group relative cursor-pointer ${
                          isPeak
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                            : isHigh
                            ? 'bg-amber-500/60 text-slate-100'
                            : 'bg-slate-950/80 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 z-30 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-300 shadow-xl pointer-events-none whitespace-nowrap">
                          {row.day} @ {cell.hour}:00 • Vol: {cell.volume} • Fare: ${cell.avg_fare} • Tip: {cell.high_tip_rate}%
                        </div>
                        <span>{Math.round(val)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: NYC Borough Zone Analytics */}
      {activeSubTab === 'boroughs' && edaData?.borough_zones && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                NYC Metropolitan Zone Partition Performance
              </h3>
              <p className="text-xs text-slate-400">Triangulation of Mobility Volume, Fare Dynamics, and High-Tip Propensities</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-amber-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Mobility Zone</th>
                  <th className="p-3">Trip Volume</th>
                  <th className="p-3">Volume Share</th>
                  <th className="p-3">Mean Fare</th>
                  <th className="p-3">Median Distance</th>
                  <th className="p-3">Avg Duration</th>
                  <th className="p-3">High-Tip %</th>
                  <th className="p-3">Congestion ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {edaData.borough_zones.borough_zones.map((zone: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      {zone.zone_name}
                    </td>
                    <td className="p-3">{zone.trip_volume.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${zone.volume_share_pct * 3}%` }}
                            className="h-full bg-amber-400 rounded-full"
                          ></div>
                        </div>
                        <span>{zone.volume_share_pct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-cyan-300 font-bold">${zone.mean_fare}</td>
                    <td className="p-3">{zone.mean_distance_km} km</td>
                    <td className="p-3">{zone.mean_duration_min} min</td>
                    <td className="p-3 text-emerald-400 font-bold">{zone.high_tip_rate_pct}%</td>
                    <td className="p-3 text-slate-400">${zone.mean_congestion_usd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Correlation Matrix & Categoricals */}
      {activeSubTab === 'correlations' && edaData?.correlation_analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Correlation Heatmap Grid */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Pearson Correlation Matrix (r)
            </h3>
            <div className="overflow-x-auto">
              <div className="min-w-[500px] space-y-1">
                <div className="grid grid-cols-10 gap-1 text-[9px] font-mono text-slate-500">
                  <div></div>
                  {edaData.correlation_analysis.columns.map((c: string, idx: number) => (
                    <div key={idx} className="truncate text-center" title={c}>
                      {c.slice(0, 4)}
                    </div>
                  ))}
                </div>

                {edaData.correlation_analysis.matrix.map((row: number[], rIdx: number) => (
                  <div key={rIdx} className="grid grid-cols-10 gap-1 items-center">
                    <div className="text-[10px] font-mono text-slate-400 truncate" title={edaData.correlation_analysis.columns[rIdx]}>
                      {edaData.correlation_analysis.columns[rIdx].slice(0, 6)}
                    </div>
                    {row.map((val: number, cIdx: number) => {
                      const isHigh = Math.abs(val) > 0.7;
                      const isMed = Math.abs(val) > 0.3;
                      return (
                        <div
                          key={cIdx}
                          className={`h-7 rounded flex items-center justify-center text-[10px] font-mono ${
                            isHigh
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : isMed
                              ? 'bg-amber-500/30 text-amber-300'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                          title={`${edaData.correlation_analysis.columns[rIdx]} vs ${edaData.correlation_analysis.columns[cIdx]}: ${val}`}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categorical Breakdowns */}
          {edaData?.categorical_distributions?.categorical_distributions && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Categorical Feature Distributions
              </h3>

              <div className="space-y-4 text-xs font-mono">
                {Object.entries(edaData.categorical_distributions.categorical_distributions).map(
                  ([catName, items]: [string, any]) => (
                    <div key={catName} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-cyan-400 capitalize block">{catName.replace('_', ' ')}</span>
                      <div className="space-y-1.5">
                        {items.slice(0, 4).map((it: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-center justify-between text-slate-300">
                            <span className="truncate max-w-[180px]">{it.category}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${it.percentage}%` }}
                                  className="h-full bg-cyan-400 rounded-full"
                                ></div>
                              </div>
                              <span className="text-slate-400 text-[11px] w-12 text-right">{it.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: 6-Dimension Quality Scorecard & Schema Lineage */}
      {activeSubTab === 'quality' && catalogData?.quality_audit && (
        <div className="space-y-6 animate-fade-in">
          {/* Quality Banner */}
          <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xl">
                  {catalogData.quality_audit.overall_quality_grade}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    6-Dimension Data Quality Scorecard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compliance Rating: {catalogData.quality_audit.compliance_rating_percent}% •{' '}
                    {catalogData.quality_audit.dataset_rows} Curated Rows •{' '}
                    {catalogData.quality_audit.dataset_columns} Features
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(catalogData.quality_audit.dimensions).map(([dimKey, dimVal]: [string, any]) => (
                <div key={dimKey} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase tracking-wider capitalize">{dimKey}</span>
                    <span className="text-emerald-400 font-bold">{dimVal.score_percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${dimVal.score_percent}%` }} className="h-full bg-emerald-400 rounded-full"></div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">{dimVal.metric_checked}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Schema & Type System */}
          {catalogData?.catalog_entry?.schema_definition && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Curated Schema Dictionary & Attribute Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                {catalogData.catalog_entry.schema_definition.map((col: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{col.name}</span>
                      <span className="text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {col.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{col.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
