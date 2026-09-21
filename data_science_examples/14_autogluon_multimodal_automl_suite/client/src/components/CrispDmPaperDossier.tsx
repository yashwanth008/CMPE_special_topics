import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Bookmark, FileText } from 'lucide-react';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const CrispDmPaperDossier: React.FC = () => {
  const [paperData, setPaperData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetch('http://127.0.0.1:8014/api/paper')
      .then((res) => res.json())
      .then((data) => setPaperData(data))
      .catch((e) => console.error('Paper fetch error:', e));
  }, []);

  if (!paperData) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading 10-Page CRISP-DM Academic Research Paper Dossier...
      </div>
    );
  }

  const page = paperData.pages.find((p: any) => p.page_number === currentPage) || paperData.pages[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              10-Page CRISP-DM Academic Research Paper & Mathematical Dossier
            </h2>
            <p className="text-sm text-slate-400">
              Formal IEEE/ACM standard manuscript with rigorous LaTeX mathematical derivations of multi-layer stacking, Chronos T5 tokenization, and cross-modal attention.
            </p>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-paper-prev"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-cyan-300 font-bold px-3 py-1 bg-slate-900 rounded-lg border border-slate-700">
              Page {currentPage} of {paperData.total_pages}
            </span>
            <button
              id="btn-paper-next"
              onClick={() => setCurrentPage((p) => Math.min(paperData.total_pages, p + 1))}
              disabled={currentPage === paperData.total_pages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Manuscript Reading Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-4 glass-panel p-5 space-y-3 h-fit">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            Manuscript Table of Contents
          </h3>

          <div className="space-y-1.5">
            {paperData.pages.map((p: any) => (
              <button
                key={p.page_number}
                id={`toc-page-${p.page_number}`}
                onClick={() => setCurrentPage(p.page_number)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                  currentPage === p.page_number
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="font-mono text-[11px] text-cyan-400 font-bold mt-0.5">
                  §{p.page_number}
                </span>
                <div className="truncate">
                  <div className="truncate">{p.title.replace(/^Section \d+:\s*/, '')}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paper Page Content */}
        <div className="lg:col-span-8 glass-panel p-8 space-y-6">
          <div className="border-b border-indigo-500/20 pb-4">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              {page.subtitle}
            </div>
            <h1 className="text-2xl font-black text-white mt-1">{page.title}</h1>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
            <MarkdownMathRenderer content={page.content} />
          </div>

          {/* Bottom Pagination controls */}
          <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Section</span>
            </button>

            <span className="font-mono text-slate-500">
              AutoGluon Multimodal Intelligence • Academic Paper Series
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(paperData.total_pages, p + 1))}
              disabled={currentPage === paperData.total_pages}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 cursor-pointer font-semibold"
            >
              <span>Next Section</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
