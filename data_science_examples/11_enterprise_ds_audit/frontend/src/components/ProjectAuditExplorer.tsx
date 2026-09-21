import React from 'react';
import { ProjectAudit } from '../types';
import { ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

interface ProjectAuditExplorerProps {
  projects: ProjectAudit[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export const ProjectAuditExplorer: React.FC<ProjectAuditExplorerProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
}) => {
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-6">
      {/* Project Selector Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              currentProject.id === p.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="truncate max-w-[130px]">{p.title}</span>
          </button>
        ))}
      </div>

      {currentProject && (
        <div className="space-y-6">
          {/* Main Detail Header */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                {currentProject.category} • {currentProject.folder}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{currentProject.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Methodology: <span className="text-slate-200">{currentProject.methodology}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-500 block">Compliance</span>
                <span className="text-2xl font-bold text-emerald-400">{currentProject.compliance_score}%</span>
              </div>
              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-lg font-bold font-mono">
                {currentProject.grade}
              </div>
            </div>
          </div>

          {/* Key Findings Audit Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Findings List */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Quality & Leakage Audit Findings
              </h3>

              <div className="space-y-2.5">
                {currentProject.key_findings.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {f.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {f.status}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px] pt-1">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Card */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Mitchell et al. Model Card
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(currentProject.model_card).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 text-[10px] block capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="text-slate-200 font-semibold text-[11px] break-words">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Math Formula Proof */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mt-3">
                <span className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">
                  Mathematical Formulation Proof
                </span>
                <code className="text-[11px] text-emerald-300 font-mono block overflow-x-auto">
                  {currentProject.math_proof}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
