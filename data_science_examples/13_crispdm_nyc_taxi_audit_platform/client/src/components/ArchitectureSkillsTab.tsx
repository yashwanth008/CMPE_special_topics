import React, { useState, useEffect } from 'react';
import { Layers, Terminal, Sparkles, CheckCircle2, ChevronRight, BookOpen, Code2, ShieldCheck, Cpu } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const ArchitectureSkillsTab: React.FC = () => {
  const [archData, setArchData] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/architecture/skills')
      .then((res) => res.json())
      .then((data) => setArchData(data))
      .catch((err) => console.error(err));
  }, []);

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

  const filteredSkills =
    archData?.skills_matrix?.filter((skill: any) => {
      const matchesPhase = selectedPhase === 'all' || skill.phase.includes(selectedPhase);
      const matchesSearch =
        searchQuery === '' ||
        skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPhase && matchesSearch;
    }) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  Full-Stack Architecture & Engineering Blueprints
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  23 Skills Operationalized
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                How This NYC TLC Mobility Platform Is Fully Built
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">Backend Engine</span>
              <span className="font-bold text-cyan-300">FastAPI (8013)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">Frontend UI</span>
              <span className="font-bold text-amber-300">React 18 + Vite (5186)</span>
            </div>
          </div>
        </div>

        {/* Tech Stack Specs Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
              Machine Learning Core
            </span>
            <div className="text-sm font-bold text-white">LightGBM & PyTorch Multi-Task MLP</div>
            <p className="text-[11px] text-slate-400">
              Histogram gradient boosting regressor, 5-fold CV tournament, and Huber multi-task loss.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
              AutoResearch & XAI
            </span>
            <div className="text-sm font-bold text-white">Optuna HPO & TreeSHAP Attribution</div>
            <p className="text-[11px] text-slate-400">
              30-trial Bayesian hyperparameter search and exact Shapley additive feature force decomposition.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-violet-400 uppercase tracking-wider block">
              Frontend & Type System
            </span>
            <div className="text-sm font-bold text-white">Matt Pocock Total TypeScript Patterns</div>
            <p className="text-[11px] text-slate-400">
              Discriminated Unions for async state machines, Branded Types, and Zod runtime schema inference.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPhase === p.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter by skill name, math, or code pointer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-72 font-mono"
        />
      </div>

      {/* Skills Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill: any, idx: number) => (
          <div
            key={idx}
            className="glass-card p-5 rounded-2xl border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-bold">
                  {skill.phase}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{skill.category}</span>
              </div>

              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <code className="text-cyan-300 font-mono text-xs">{skill.skill_name}</code>
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed mt-2">{skill.purpose}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              {/* Mathematical Foundation */}
              {skill.mathematical_foundation && (
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/20 overflow-x-auto text-center">
                  <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest block mb-1">
                    Mathematical Formulation
                  </span>
                  <MarkdownMathRenderer content={`$$${skill.mathematical_foundation}$$`} />
                </div>
              )}

              {/* Code Pointer */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Source:</span>
                <code className="text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {skill.code_reference}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
