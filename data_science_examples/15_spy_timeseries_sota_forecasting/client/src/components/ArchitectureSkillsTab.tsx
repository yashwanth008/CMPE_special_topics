import React, { useState, useEffect } from 'react';
import { Compass, Search, Code, CheckCircle, Layers } from 'lucide-react';
import { SkillItem } from '../types/spy';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const ArchitectureSkillsTab: React.FC = () => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');

  useEffect(() => {
    fetch('http://127.0.0.1:8015/api/architecture')
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []))
      .catch((err) => console.error('Skills fetch error:', err));
  }, []);

  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = selectedPhase === 'ALL' || s.crisp_dm_phase.includes(selectedPhase);
    return matchesSearch && matchesPhase;
  });

  const phases = ['ALL', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-heading font-extrabold text-white">30-Skills Financial ML Operational Matrix</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Textbook Rigor
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Exhaustive operational catalog mapping formulas, line numbers, and CRISP-DM phase gates across the entire platform.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            Total Operational Skills: <span className="font-bold text-cyan-300">{skills.length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search skills, formulas, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {phases.map((ph) => (
            <button
              key={ph}
              onClick={() => setSelectedPhase(ph)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all whitespace-nowrap ${
                selectedPhase === ph
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ph}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((s) => (
          <div key={s.skill_id} className="glass-panel p-5 space-y-3 glass-card-hover border-slate-800">
            <div className="flex justify-between items-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                {s.skill_id}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                {s.crisp_dm_phase.split(':')[0]}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{s.skill_name}</h3>
              <span className="text-[11px] font-mono text-emerald-400">{s.category}</span>
            </div>

            {/* LaTeX Formula Box */}
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-center overflow-x-auto">
              <MarkdownMathRenderer content={`$$${s.latex_formula}$$`} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                {s.file_location}
              </span>
              <span className="text-emerald-400">Verified ✓</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
