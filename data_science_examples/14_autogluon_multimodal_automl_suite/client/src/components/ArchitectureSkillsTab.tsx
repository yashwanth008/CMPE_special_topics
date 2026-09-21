import React, { useState, useEffect } from 'react';
import { Cpu, Search, CheckCircle2 } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const ArchitectureSkillsTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetch('http://127.0.0.1:8014/api/architecture')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error('Architecture tab fetch error:', e));
  }, []);

  if (!data) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading System Architecture & 30-Skills Catalog...
      </div>
    );
  }

  const categories = ['All', 'Core AutoML', 'Foundation Models', 'Multimodal Deep Learning', 'Data Preparation', 'Exploratory Analysis', 'Explainable AI', 'Production Optimization', 'Governance & Quality'];

  const filteredSkills = data.skills.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              System Architecture & 30 Data Science Skills Operational Matrix
            </h2>
            <p className="text-sm text-slate-400">
              Complete catalog of operational data science skills with LaTeX mathematical formulations, source code line references, and execution status.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono">
            <span className="text-slate-300">Total Skills:</span>
            <span className="font-bold text-cyan-300">{data.skills.length} Operational</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-6 pt-4 border-t border-slate-700/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills e.g. chronos, stacking..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Skills Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map((skill: any) => (
          <div
            key={skill.id}
            className="glass-panel p-5 space-y-3 border-slate-800 hover:border-indigo-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  {skill.id}
                </span>
                <h4 className="text-sm font-bold text-white font-mono">{skill.name}</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {skill.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{skill.description}</p>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mathematical Derivation:</div>
              <MarkdownMathRenderer content={`$$${skill.formula_latex}$$`} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>{skill.phase}</span>
              <span className="font-mono text-cyan-300 font-semibold">{skill.source_ref}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
