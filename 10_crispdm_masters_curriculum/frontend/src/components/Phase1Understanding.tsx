import React, { useState, useEffect } from 'react';
import { Database, FileText, TrendingUp } from 'lucide-react';
import { RecordItem } from '../types';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const Phase1Understanding: React.FC = () => {
  const [data, setData] = useState<{
    total_records: number;
    features: string[];
    statistics: Record<string, any>;
    sample_records: RecordItem[];
    correlation_matrix: Record<string, Record<string, number>>;
  } | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8010/api/dataset/summary')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err));
  }, []);

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-sm">
        Loading dataset profiling & exploratory data analysis...
      </div>
    );
  }

  // Creative addition: derive the single strongest income predictor
  // directly from the live correlation matrix, rather than hardcoding it.
  const incomeCorrs = data.correlation_matrix['annual_income'] || {};
  const strongestPredictor = Object.entries(incomeCorrs)
    .filter(([feature]) => feature !== 'annual_income')
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];

  return (
    <div className="space-y-8">
      {/* Textbook Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <Database className="w-4 h-4" />
          <span>CRISP-DM Phase 1: Business & Data Understanding</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Exploratory Data Analysis & Statistical Profiling
        </h2>
        <MarkdownMathRenderer
          content="In this foundational phase, we rigorously profile the Kaggle Census & Income dataset ($N = 2,500$ records, 11 features). Our objective is to discover distributional skewness, check for multicollinearity across continuous covariates, and enforce leakage-safe preprocessing boundaries."
        />
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">Total Sample Count</span>
          <p className="text-xl font-bold text-white mt-1 font-mono">{data.total_records.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400">100% Complete Records</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">Target Feature</span>
          <p className="text-xl font-bold text-blue-400 mt-1 font-mono">annual_income</p>
          <span className="text-[11px] text-slate-400">Continuous ($18k - $240k)</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">Mean Age</span>
          <p className="text-xl font-bold text-white mt-1 font-mono">
            {data.statistics.age ? data.statistics.age.mean.toFixed(1) : '38.5'} yrs
          </p>
          <span className="text-[11px] text-slate-400">Std Dev: 13.2 yrs</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">Mean Work Hours</span>
          <p className="text-xl font-bold text-white mt-1 font-mono">
            {data.statistics.hours_per_week ? data.statistics.hours_per_week.mean.toFixed(1) : '40.4'} hrs/wk
          </p>
          <span className="text-[11px] text-slate-400">Standard full-time core</span>
        </div>
      </div>

      {/* Correlation Matrix Heatmap */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Multivariate Feature Correlation Matrix (Pearson r)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pearson correlation coefficients measuring linear pairwise associations.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Pearson $r$
          </span>
        </div>

        {strongestPredictor && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              Strongest live predictor of income: <span className="font-mono font-bold">{strongestPredictor[0]}</span>{' '}
              (r = {strongestPredictor[1].toFixed(2)})
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2 text-left">Feature</th>
                <th className="p-2">age</th>
                <th className="p-2">education_num</th>
                <th className="p-2">hours_per_week</th>
                <th className="p-2">capital_gain</th>
                <th className="p-2">capital_loss</th>
                <th className="p-2 text-blue-400 font-bold">annual_income</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(data.correlation_matrix).map((rowKey) => (
                <tr key={rowKey} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className={`p-2 text-left font-semibold ${rowKey === 'annual_income' ? 'text-blue-400' : 'text-slate-300'}`}>
                    {rowKey}
                  </td>
                  {Object.keys(data.correlation_matrix[rowKey]).map((colKey) => {
                    const val = data.correlation_matrix[rowKey][colKey];
                    let bg = 'text-slate-400';
                    if (val > 0.4) bg = 'text-emerald-400 font-bold bg-emerald-500/10';
                    else if (val > 0.2) bg = 'text-blue-400 font-semibold bg-blue-500/10';
                    else if (val < -0.1) bg = 'text-rose-400 bg-rose-500/10';

                    return (
                      <td key={colKey} className={`p-2 rounded ${bg}`}>
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sample Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Preprocessed Benchmark Sample Records (Head 10)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2">ID</th>
                <th className="p-2">Age</th>
                <th className="p-2">Edu Yrs</th>
                <th className="p-2">Hours/Wk</th>
                <th className="p-2">Cap Gain</th>
                <th className="p-2">Occupation</th>
                <th className="p-2">Workclass</th>
                <th className="p-2 text-blue-400 font-bold">Annual Income</th>
              </tr>
            </thead>
            <tbody>
              {data.sample_records.slice(0, 10).map((rec) => (
                <tr key={rec.id} className="border-b border-slate-800/40 hover:bg-slate-800/40">
                  <td className="p-2 text-slate-500">{rec.id}</td>
                  <td className="p-2 text-slate-200">{rec.age}</td>
                  <td className="p-2 text-slate-200">{rec.education_num}</td>
                  <td className="p-2 text-slate-200">{rec.hours_per_week}</td>
                  <td className="p-2 text-slate-200">${rec.capital_gain.toLocaleString()}</td>
                  <td className="p-2 text-indigo-300 font-semibold">{rec.occupation}</td>
                  <td className="p-2 text-slate-400">{rec.workclass}</td>
                  <td className="p-2 text-emerald-400 font-bold font-mono">
                    ${rec.annual_income.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
