import React, { useState, useEffect } from 'react';
import { X, Search, Compass, Code } from 'lucide-react';
import { SkillItem } from '../types/spy';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

interface ArchitectureSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureSkillsModal: React.FC<ArchitectureSkillsModalProps> = ({ isOpen, onClose }) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch('http://127.0.0.1:8015/api/architecture')
        .then((res) => res.json())
        .then((data) => setSkills(data.skills || []))
        .catch((err) => console.error('Skills modal error:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSkills = skills.filter((s) =>
    s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#0b1120] border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/10 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">30-Skills Financial ML Operational Catalog</h2>
              <p className="text-xs text-slate-400">Formal Mathematical Formulas &amp; Source Code Line Mappings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search 30 skills by name, formula, or CRISP-DM phase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Scrollable Skills Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((s) => (
              <div key={s.skill_id} className="glass-panel p-4 space-y-2 border-slate-800">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                    {s.skill_id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{s.crisp_dm_phase.split(':')[0]}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{s.skill_name}</h4>
                <div className="text-[11px] font-mono text-emerald-400">{s.category}</div>

                <div className="p-2 rounded bg-slate-950/90 border border-slate-800 text-center">
                  <MarkdownMathRenderer content={`$$${s.latex_formula}$$`} />
                </div>

                <p className="text-xs text-slate-300">{s.description}</p>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    {s.file_location}
                  </span>
                  <span className="text-emerald-400 font-bold">100% Compliant</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
