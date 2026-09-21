import React, { useState, useEffect } from 'react';
import { CodeSnippet } from '../types';
import { Code2, Copy, Check, Lightbulb, Terminal } from 'lucide-react';

export const CodeAuditorWorkbench: React.FC = () => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/code/snippets')
      .then((r) => r.json())
      .then((d) => {
        setSnippets(d.snippets || []);
        if (d.snippets?.length > 0) {
          setSelectedSnippet(d.snippets[0]);
        }
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleCopy = () => {
    if (selectedSnippet) {
      navigator.clipboard.writeText(selectedSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400 font-mono">Loading Code Auditor Workbench...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4" /> Code Auditor & Architecture Workbench
          </div>
          <h3 className="text-lg font-bold text-white">
            Curated Source Code Snippets & Mathematical Pointers
          </h3>
          <p className="text-xs text-slate-400">
            Inspect verified implementations across all 6 CRISP-DM phases and Matt Pocock TypeScript patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Snippet Index List */}
        <div className="lg:col-span-4 space-y-2.5">
          {snippets.map((s) => (
            <button
              key={s.snippet_id}
              onClick={() => setSelectedSnippet(s)}
              className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                selectedSnippet?.snippet_id === s.snippet_id
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-mono text-cyan-400 block mb-1 uppercase">
                {s.phase}
              </span>
              <div className="text-xs font-bold text-slate-200">{s.title}</div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                {s.language.toUpperCase()} • {s.snippet_id}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Code Viewer & Architectural Pointer */}
        <div className="lg:col-span-8 space-y-4">
          {selectedSnippet && (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              {/* Code Box Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-950/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {selectedSnippet.title}
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Code Content */}
              <pre className="p-5 text-xs font-mono text-slate-200 bg-slate-950/95 overflow-x-auto leading-relaxed">
                <code>{selectedSnippet.code}</code>
              </pre>

              {/* Architectural Pointer Footer */}
              <div className="p-4 bg-amber-950/20 border-t border-amber-500/20 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300 font-bold block mb-0.5">
                    Data Science Auditor Pointer:
                  </strong>
                  {selectedSnippet.pointer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
