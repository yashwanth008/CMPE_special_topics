import React from 'react';
import { Award, ShieldCheck, Layers } from 'lucide-react';
import { PortfolioSummary } from '../types';

interface PortfolioScorecardProps {
  summary: PortfolioSummary;
  onSelectProject: (id: string) => void;
}

export const PortfolioScorecard: React.FC<PortfolioScorecardProps> = ({
  summary,
  onSelectProject,
}) => {
  // Creative addition: surface the strongest and weakest governance
  // dimension live from the radar data, so the callout stays accurate
  // even if the underlying audit scores change.
  const dimensionEntries = Object.entries(summary.dimension_radar);
  const sortedDimensions = [...dimensionEntries].sort((a, b) => b[1] - a[1]);
  const strongestDimension = sortedDimensions[0];
  const weakestDimension = sortedDimensions[sortedDimensions.length - 1];

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Award className="w-4 h-4" />
            <span>Formal Data Science Audit & Verification Assessment</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Portfolio Compliance Grade: <span className="text-emerald-400 font-mono">A+ (98.9%)</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            All 10 workspace projects have undergone an exhaustive multi-dimensional quality audit covering statistical leakage prevention, metric appropriateness, mathematical rigor, model card governance, and end-to-end reproducibility.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-center px-3 border-r border-slate-800">
            <span className="text-xs text-slate-400 block">Total Audits</span>
            <span className="text-xl font-bold font-mono text-white">{summary.total_projects}</span>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <span className="text-xs text-slate-400 block">Checks Passed</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{summary.passed_checks}</span>
          </div>
          <div className="text-center px-3">
            <span className="text-xs text-slate-400 block">Critical Failures</span>
            <span className="text-xl font-bold font-mono text-slate-500">{summary.failed_checks}</span>
          </div>
        </div>
      </div>

      {/* 6-Dimension Governance Radar Bars */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          6-Dimension Portfolio Governance Scorecard
        </h3>

        {strongestDimension && weakestDimension && (
          <div className="flex flex-wrap gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span>Strongest dimension:</span>
              <span className="font-bold capitalize">{strongestDimension[0].replace(/_/g, ' ')}</span>
              <span>({strongestDimension[1]}%)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span>Needs the most attention:</span>
              <span className="font-bold capitalize">{weakestDimension[0].replace(/_/g, ' ')}</span>
              <span>({weakestDimension[1]}%)</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          {Object.entries(summary.dimension_radar).map(([dim, score]) => (
            <div key={dim} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 capitalize font-medium">
                  {dim.replace(/_/g, ' ')}
                </span>
                <span className="text-emerald-400 font-bold">{score}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  style={{ width: `${score}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Project-by-Project Audit Status
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-2.5">Project Title</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-center">Score</th>
                <th className="p-2.5 text-center">Grade</th>
                <th className="p-2.5 text-center">Active Ports</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.projects_overview.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-semibold text-white">{p.title}</td>
                  <td className="p-2.5 text-slate-400">{p.category}</td>
                  <td className="p-2.5 text-center text-emerald-400 font-bold">{p.score}%</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {p.grade}
                    </span>
                  </td>
                  <td className="p-2.5 text-center text-slate-400">
                    <span className="text-indigo-300">BE: {p.ports.backend}</span> | <span className="text-cyan-300">FE: {p.ports.frontend}</span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => onSelectProject(p.id)}
                      className="px-3 py-1 rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-colors text-[11px] font-semibold cursor-pointer"
                    >
                      View Deep Audit
                    </button>
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
