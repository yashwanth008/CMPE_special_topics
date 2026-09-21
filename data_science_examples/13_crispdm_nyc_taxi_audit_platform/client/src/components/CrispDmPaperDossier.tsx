import React, { useState, useEffect } from 'react';
import { CrispDmPaper, PaperSection, AsyncState } from '../types';
import { FileText, Printer, Award, BookOpen, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const CrispDmPaperDossier: React.FC = () => {
  const [paperState, setPaperState] = useState<AsyncState<CrispDmPaper>>({ status: 'idle' });
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const fetchPaper = async () => {
      setPaperState({ status: 'loading' });
      try {
        const resp = await fetch('http://127.0.0.1:8013/api/crisp-dm/report');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data: CrispDmPaper = await resp.json();
        setPaperState({ status: 'success', data });
      } catch (err: any) {
        setPaperState({ status: 'error', error: err.message });
      }
    };
    fetchPaper();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Academic Standard Research Dossier
          </div>
          <h3 className="text-xl font-bold text-white">10-Page In-Depth CRISP-DM Master Publication</h3>
          <p className="text-xs text-slate-400">Formal mathematical formulation, ablation tables, and data science peer review.</p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {paperState.status === 'loading' && (
        <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400 font-mono">Loading 10-page academic publication...</p>
        </div>
      )}

      {paperState.status === 'success' && (
        <div className="space-y-6">
          {/* Page Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-print">
            {paperState.data.sections.map((sec) => (
              <button
                key={sec.page_number}
                onClick={() => setCurrentPage(sec.page_number)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  currentPage === sec.page_number
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>Pg {sec.page_number}</span>
                <span className="hidden md:inline text-[10px] opacity-75">
                  ({sec.phase.split(':')[0]})
                </span>
              </button>
            ))}
          </div>

          {/* Academic Paper Sheet */}
          <div className="glass-card p-8 sm:p-12 rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl relative">
            {/* Paper Header / DOI Banner */}
            <div className="border-b border-slate-800 pb-6 mb-8 text-center space-y-3">
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                CRISP-DM Standard Peer-Reviewed Mobility Dossier • DOI: {paperState.data.doi}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-snug">
                {paperState.data.title}
              </h2>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400 pt-2">
                {paperState.data.authors.map((a, idx) => (
                  <span key={idx} className="font-semibold text-slate-300">
                    {a.name} <span className="font-normal text-slate-500">({a.affiliation})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Abstract on Page 1 */}
            {currentPage === 1 && (
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/20 mb-8">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Abstract
                </h4>
                <MarkdownMathRenderer content={paperState.data.abstract} />
              </div>
            )}

            {/* Current Page Section */}
            {(() => {
              const sec = paperState.data.sections.find((s) => s.page_number === currentPage);
              if (!sec) return null;
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                        {sec.phase}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {sec.section_title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      Page {sec.page_number} of {paperState.data.pages_count}
                    </span>
                  </div>

                  {/* Section Text - Rendered with LaTeX math & Markdown */}
                  <MarkdownMathRenderer content={sec.content} />

                  {/* Optional Key Metrics Table */}
                  {sec.key_metrics && (
                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Technical Validation & Benchmark Targets
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {sec.key_metrics.map((m, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block mb-1">{m.kpi}</span>
                            <div className="text-sm font-bold text-cyan-300 font-mono">{m.achieved}</div>
                            <span className="text-[10px] text-emerald-400 mt-1 block">Target: {m.target}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Page Navigation Footer */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800 no-print">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Page
              </button>

              <span className="text-xs font-mono text-slate-500">
                Page {currentPage} of {paperState.data.pages_count}
              </span>

              <button
                disabled={currentPage === paperState.data.pages_count}
                onClick={() => setCurrentPage((p) => Math.min(paperState.data.pages_count, p + 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition-all"
              >
                Next Page <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
