import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileCode, Check } from 'lucide-react';

export const CodeAuditorWorkbench: React.FC = () => {
  const [auditData, setAuditData] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8014/api/code-audit')
      .then((res) => res.json())
      .then((d) => setAuditData(d))
      .catch((e) => console.error('Audit fetch error:', e));
  }, []);

  if (!auditData) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Running forensic static AST analysis & zero-leakage code audit...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Forensic AST Code Auditor & Zero Data Leakage Workbench
            </h2>
            <p className="text-sm text-slate-400">
              Static code analysis engine certifying cross-validation fold isolation, deterministic reproducibility, and latency safety budgets.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Audit Status:</span>
            <span className="font-bold text-emerald-300">{auditData.overall_audit_grade}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Total Forensic Rules Scanned:</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{auditData.total_rules_checked} Rules</div>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30">
          <span className="text-xs text-slate-400">Critical Leakage Violations:</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{auditData.critical_violations} (Zero Leakage)</div>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400">Compiler & AST Warnings:</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{auditData.warnings} Warnings</div>
        </div>
      </div>

      {/* Rules Evidence Table */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Forensic Compliance Checklist & Source Evidence</h3>
        <div className="space-y-3">
          {auditData.rules.map((rule: any) => (
            <div
              key={rule.rule_id}
              className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                    {rule.rule_id}
                  </span>
                  <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {rule.severity}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {rule.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{rule.evidence}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Audited Source File:</span>
                </span>
                <span className="font-mono text-cyan-300">{rule.file_location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
