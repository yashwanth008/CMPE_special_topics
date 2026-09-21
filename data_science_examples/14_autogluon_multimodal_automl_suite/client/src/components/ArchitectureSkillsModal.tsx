import React, { useState, useEffect } from 'react';
import { X, Cpu, CheckCircle2, Search, ExternalLink, Filter } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

interface ArchitectureSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureSkillsModal: React.FC<ArchitectureSkillsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (isOpen && !data) {
      fetch('http://127.0.0.1:8014/api/architecture')
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch((e) => console.error('Architecture fetch error:', e));
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const categories = ['All', 'Core AutoML', 'Foundation Models', 'Multimodal Deep Learning', 'Data Preparation', 'Exploratory Analysis', 'Explainable AI', 'Production Optimization', 'Governance & Quality'];

  const filteredSkills = data?.skills.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1326] border border-indigo-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-indigo-500/20 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Architecture & 30-Skills Matrix</h3>
              <p className="text-xs text-slate-400">
                Rigorous mathematical formulation, line references, and execution status for all operational skills.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills e.g. chronos, shap..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)]">
          {data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSkills.map((skill: any) => (
                <div
                  key={skill.id}
                  className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                        {skill.id}
                      </span>
                      <h4 className="text-sm font-bold text-white font-mono">{skill.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {skill.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{skill.description}</p>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mathematical Formula:</div>
                    <MarkdownMathRenderer content={`$$${skill.formula_latex}$$`} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>{skill.phase}</span>
                    <span className="font-mono text-cyan-300">{skill.source_ref}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">Loading skills...</div>
          )}
        </div>
      </div>
    </div>
  );
};
