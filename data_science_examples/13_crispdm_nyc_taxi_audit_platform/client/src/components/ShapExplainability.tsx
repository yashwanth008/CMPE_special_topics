import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ShapExplainability: React.FC = () => {
  const [xaiData, setXaiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/explainability/shap')
      .then((r) => r.json())
      .then((d) => {
        setXaiData(d);
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400 font-mono">Computing TreeSHAP Shapley values...</p>
      </div>
    );
  }

  const globalShap = xaiData?.global_shap?.feature_importance || [];
  const pdp = xaiData?.partial_dependence;
  const qaChecklist = xaiData?.peer_review_qa_checklist || [];

  return (
    <div className="space-y-8">
      {/* Global TreeSHAP Feature Attribution */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Global TreeSHAP Feature Attribution (Mean |SHAP Value|)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Methodology: Exact TreeSHAP (Lundberg et al., 2020) • Population Base Value: $18.50 USD
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {globalShap.map((item: any, idx: number) => (
            <div key={idx} className="space-y-1 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-amber-300">{item.feature}</span>
                <span className="text-slate-400">{item.relative_importance}% ({item.direction})</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${item.relative_importance}%` }}
                  className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partial Dependence Plots (PDP) */}
      {pdp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              PDP: Trip Distance (km) vs. Marginal Fare ($ USD)
            </h4>
            <div className="h-40 bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-end gap-1.5">
              {pdp.pdp_trip_distance.x_values.map((x: number, idx: number) => {
                const y = pdp.pdp_trip_distance.y_marginal_fare[idx];
                const heightPct = Math.min(95, Math.max(10, (y / 80) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white pointer-events-none whitespace-nowrap">
                      {x}km: ${y}
                    </div>
                    <div style={{ height: `${heightPct}%` }} className="w-full bg-amber-400/80 group-hover:bg-amber-400 rounded-t"></div>
                    <span className="text-[8px] font-mono text-slate-500">{x}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              PDP: Precipitation (mm) vs. Non-linear Weather Surge ($ USD)
            </h4>
            <div className="h-40 bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-end gap-1.5">
              {pdp.pdp_precipitation.x_values.map((x: number, idx: number) => {
                const y = pdp.pdp_precipitation.y_marginal_fare[idx];
                const heightPct = Math.min(95, Math.max(10, (y / 35) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white pointer-events-none whitespace-nowrap">
                      {x}mm: ${y}
                    </div>
                    <div style={{ height: `${heightPct}%` }} className="w-full bg-cyan-400/80 group-hover:bg-cyan-400 rounded-t"></div>
                    <span className="text-[8px] font-mono text-slate-500">{x}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Peer Review QA Checklist */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Data Science Expert Peer-Review Audit Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qaChecklist.map((q: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 font-mono">{q.audit_category}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {q.status}
                </span>
              </div>
              <p className="text-slate-400">{q.item}</p>
              <div className="p-2.5 rounded-lg bg-slate-900/90 text-emerald-300 font-mono text-[11px]">
                {q.auditor_verdict}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
