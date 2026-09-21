import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FileText, CheckCircle } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const CrispDmPaperDossier: React.FC = () => {
  const [paperData, setPaperData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8015/api/paper')
      .then((res) => res.json())
      .then((data) => {
        setPaperData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Paper fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400 font-mono text-xs">
        Loading 10-Page KaTeX CRISP-DM Research Paper Dossier...
      </div>
    );
  }

  const pages = paperData?.pages || [];
  const activePageData = pages[currentPage - 1];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-emerald-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-heading font-extrabold text-white">10-Page CRISP-DM Academic Research Paper</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                IEEE / ACM Standard
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Rigorous mathematical proofs, financial econometrics, foundation model architectures, and zero-leakage governance.
            </p>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 rounded-lg text-xs font-mono font-bold text-indigo-300 border border-slate-700">
              Page {currentPage} of {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pages.length, p + 1))}
              disabled={currentPage === pages.length}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Table of Contents Navigation */}
        <div className="lg:col-span-4 glass-panel p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Table of Contents (10 Pages)
          </h3>
          <div className="space-y-1">
            {pages.map((p: any) => {
              const isSelected = p.page_number === currentPage;
              return (
                <button
                  key={p.page_number}
                  onClick={() => setCurrentPage(p.page_number)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="font-mono text-indigo-400 mr-1.5">p.{p.page_number}</span>
                    {p.title.split(':')[1] || p.title}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{p.crisp_dm_phase.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Active Page Content with KaTeX */}
        <div className="lg:col-span-8 glass-panel p-8 min-h-[500px]">
          {activePageData && (
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-6">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  {activePageData.crisp_dm_phase}
                </span>
                <span className="text-xs font-mono text-slate-400">Page {currentPage} of 10</span>
              </div>

              <MarkdownMathRenderer content={activePageData.content_markdown} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
