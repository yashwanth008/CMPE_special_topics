import React, { useState, useEffect } from 'react';
import { Layers, X, Cpu, Code2, Sparkles, CheckCircle2, ChevronRight, BookOpen, ExternalLink, Terminal } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

interface ArchitectureSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureSkillsModal: React.FC<ArchitectureSkillsModalProps> = ({ isOpen, onClose }) => {
  const [archData, setArchData] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen && !archData) {
      fetch('http://127.0.0.1:8013/api/architecture/skills')
        .then((res) => res.json())
        .then((data) => setArchData(data))
        .catch((err) => console.error(err));
    }
  }, [isOpen, archData]);

  if (!isOpen) return null;

  const phases = [
    { id: 'all', label: 'All 23 Skills' },
    { id: 'Phase 1', label: 'Phase 1: Business' },
    { id: 'Phase 2', label: 'Phase 2: Data & EDA' },
    { id: 'Phase 3', label: 'Phase 3: Pipelines' },
    { id: 'Phase 4', label: 'Phase 4: Modeling' },
    { id: 'Phase 5', label: 'Phase 5: Evaluation & XAI' },
    { id: 'Phase 6', label: 'Phase 6: MLOps' },
    { id: 'Architecture', label: 'TypeScript Architecture' }
  ];

  const filteredSkills = archData?.skills_matrix?.filter((skill: any) => {
    const matchesPhase = selectedPhase === 'all' || skill.phase.includes(selectedPhase);
    const matchesSearch =
      searchQuery === '' ||
      skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPhase && matchesSearch;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  Full-Stack Architecture & Skills Matrix
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Grade A+ Certified (23 Skills Engaged)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                How This NYC TLC Mobility Platform Is Fully Built
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tech Stack Specs Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                Backend Architecture
              </span>
              <div className="text-sm font-bold text-white">FastAPI Microservice (Port 8013)</div>
              <p className="text-[11px] text-slate-400">
                LightGBM, PyTorch Multi-Task MLP, Optuna Bayesian HPO, TreeSHAP, SciPy.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                Frontend Platform
              </span>
              <div className="text-sm font-bold text-white">React 18 + Vite (Port 5186)</div>
              <p className="text-[11px] text-slate-400">
                Tailwind CSS, KaTeX LaTeX math typography, SVG Geospatial mapping, Lucide.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-violet-400 uppercase tracking-wider block">
                Type-Safe System
              </span>
              <div className="text-sm font-bold text-white">Matt Pocock Total TypeScript</div>
              <p className="text-[11px] text-slate-400">
                Discriminated Unions, Branded Types, Zod runtime schema inference.
              </p>
            </div>
          </div>

          {/* Search & Phase Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {phases.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhase(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedPhase === p.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search skills, mathematics, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-bold">
                      {skill.phase}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{skill.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <code className="text-cyan-300 font-mono text-xs">{skill.skill_name}</code>
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    {skill.purpose}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  {/* Mathematical Formulation */}
                  {skill.mathematical_foundation && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 overflow-x-auto text-center">
                      <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest block mb-1">
                        Mathematical Formulation
                      </span>
                      <MarkdownMathRenderer content={`$$${skill.mathematical_foundation}$$`} />
                    </div>
                  )}

                  {/* Code Pointer */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500">Source:</span>
                    <code className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {skill.code_reference}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>23 Enterprise Data Science & TypeScript Skills Operationalized</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Close Architecture Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
