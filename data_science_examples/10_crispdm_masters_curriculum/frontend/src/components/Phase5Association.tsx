import React, { useState, useEffect } from 'react';
import { Network, ArrowRight } from 'lucide-react';
import { AssociationRule } from '../types';

export const Phase5Association: React.FC = () => {
  const [minSupport, setMinSupport] = useState<number>(0.10);
  const [minConfidence, setMinConfidence] = useState<number>(0.60);
  const [rules, setRules] = useState<AssociationRule[]>([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:8010/api/association/rules?min_support=${minSupport}&min_confidence=${minConfidence}`)
      .then((res) => res.json())
      .then((d) => setRules(d.rules || []))
      .catch((err) => console.error(err));
  }, [minSupport, minConfidence]);

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <Network className="w-4 h-4" />
          <span>CRISP-DM Phase 5: Associative Pattern Matching</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Apriori & FP-Growth Demographic Association Rule Mining
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Association rule mining discovers non-obvious conditional co-occurrences (Antecedent implies Consequent) across demographic traits and high-income outcomes.
          Evaluate candidate rules using Support (frequency), Confidence (conditional certainty), Lift (statistical independence multiplier), and Conviction.
        </p>
      </div>

      {/* Filter Slider Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">
              Min Support ($s = {(minSupport * 100).toFixed(0)}\%$)
            </label>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="accent-indigo-500 cursor-pointer w-36"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">
              Min Confidence ($c = {(minConfidence * 100).toFixed(0)}\%$)
            </label>
            <input
              type="range"
              min="0.40"
              max="0.90"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="accent-indigo-500 cursor-pointer w-36"
            />
          </div>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
          Discovered Rules: <span className="text-blue-400 font-bold">{rules.length} patterns</span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {r.id}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  Lift: {r.lift.toFixed(2)}x
                </span>
              </div>

              {/* Antecedent -> Consequent */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.antecedent.map((ant, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200">
                      {ant}
                    </span>
                  ))}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {r.consequent.map((con, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold">
                      {con}
                    </span>
                  ))}
                </div>
              </div>

              {/* Business Insight Callout */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {r.insight}
              </p>
            </div>

            {/* Metrics Footer */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-center">
              <div className="p-1.5 rounded bg-slate-950">
                <span className="text-slate-500 block text-[9px]">Support:</span>
                <span className="text-slate-200">{(r.support * 100).toFixed(0)}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950">
                <span className="text-slate-500 block text-[9px]">Confidence:</span>
                <span className="text-slate-200">{(r.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="p-1.5 rounded bg-slate-950">
                <span className="text-slate-500 block text-[9px]">Conviction:</span>
                <span className="text-slate-200">{r.conviction.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
