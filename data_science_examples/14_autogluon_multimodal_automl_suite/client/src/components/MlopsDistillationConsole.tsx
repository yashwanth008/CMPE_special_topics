import React, { useState, useEffect } from 'react';
import { Zap, Activity, ShieldCheck, Play, Server, AlertTriangle, RefreshCw } from 'lucide-react';

export const MlopsDistillationConsole: React.FC = () => {
  const [distillData, setDistillData] = useState<any>(null);
  const [psiData, setPsiData] = useState<any>(null);
  const [concurrency, setConcurrency] = useState<number>(50);
  const [numRequests, setNumRequests] = useState<number>(1000);
  const [loadTestResult, setLoadTestResult] = useState<any>(null);
  const [loadTesting, setLoadTesting] = useState<boolean>(false);

  const fetchDistill = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8014/api/mlops/distillation');
      const data = await res.json();
      setDistillData(data);

      const psiRes = await fetch('http://127.0.0.1:8014/api/mlops/drift-psi');
      const pData = await psiRes.json();
      setPsiData(pData);
    } catch (e) {
      console.error('MLOps fetch error:', e);
    }
  };

  const runLoadTest = async () => {
    setLoadTesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8014/api/mlops/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency, num_requests: numRequests })
      });
      const data = await res.json();
      setLoadTestResult(data);
    } catch (e) {
      console.error('Load test error:', e);
    } finally {
      setLoadTesting(false);
    }
  };

  useEffect(() => {
    fetchDistill();
    runLoadTest();
  }, []);

  if (!distillData || !psiData) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading MLOps Distillation & Concurrency Suite...
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
              <Zap className="w-5 h-5 text-amber-400" />
              AutoGluon Model Distillation & Production MLOps Governance
            </h2>
            <p className="text-sm text-slate-400">
              Ensemble-to-Student distillation into sub-10μs student models, real-time concurrency load generation, and Population Stability Index (PSI) drift monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Governance:</span>
            <span className="font-bold text-emerald-300">{psiData.overall_status}</span>
          </div>
        </div>
      </div>

      {/* Model Distillation Benchmark (Teacher Ensemble vs Student Model) */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Ensemble-to-Student Model Distillation Benchmark
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teacher Ensemble */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Teacher Model</span>
              <span className="text-xs font-mono text-slate-400">3-Level Stacking DAG</span>
            </div>

            <div className="text-sm font-semibold text-slate-200">{distillData.teacher_ensemble.architecture}</div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">ROC-AUC:</span>
                <span className="text-base font-bold font-mono text-cyan-300">{distillData.teacher_ensemble.roc_auc}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Latency (p50):</span>
                <span className="text-base font-bold font-mono text-amber-300">{distillData.teacher_ensemble.latency_p50_ms} ms</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Throughput:</span>
                <span className="text-base font-bold font-mono text-white">{distillData.teacher_ensemble.throughput_rps.toLocaleString()} RPS</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Model Size:</span>
                <span className="text-base font-bold font-mono text-slate-300">{distillData.teacher_ensemble.model_size_mb} MB</span>
              </div>
            </div>
          </div>

          {/* Distilled Student */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-cyan-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Distilled Student Model</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {distillData.distilled_student.speedup_factor}
              </span>
            </div>

            <div className="text-sm font-semibold text-slate-200">{distillData.distilled_student.architecture}</div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Fidelity Retention:</span>
                <span className="text-base font-bold font-mono text-emerald-400">{distillData.distilled_student.fidelity_retention_pct}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Latency (p50):</span>
                <span className="text-base font-bold font-mono text-cyan-300">{distillData.distilled_student.latency_p50_ms} ms</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Throughput:</span>
                <span className="text-base font-bold font-mono text-emerald-400">{distillData.distilled_student.throughput_rps.toLocaleString()} RPS</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block">Model Size:</span>
                <span className="text-base font-bold font-mono text-cyan-300">{distillData.distilled_student.model_size_mb} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concurrency Load Test & PSI Drift Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Load Test Generator */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Concurrency Load Generator
            </h3>
            <button
              id="btn-run-load-test"
              onClick={runLoadTest}
              disabled={loadTesting}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-md"
            >
              {loadTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute Stress Test</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Concurrency Workers:</span>
              <input
                id="slider-concurrency"
                type="range"
                min="10"
                max="150"
                step="10"
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 font-semibold">{concurrency} Parallel Workers</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Total Requests:</span>
              <input
                id="slider-num-requests"
                type="range"
                min="200"
                max="3000"
                step="200"
                value={numRequests}
                onChange={(e) => setNumRequests(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 font-semibold">{numRequests} Requests</span>
            </div>
          </div>

          {loadTestResult && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Throughput:</span>
                  <div className="font-mono font-bold text-white">{loadTestResult.throughput_rps} RPS</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px]">p50 Latency:</span>
                  <div className="font-mono font-bold text-cyan-300">{loadTestResult.latency_p50_ms} ms</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px]">p95 Latency:</span>
                  <div className="font-mono font-bold text-amber-300">{loadTestResult.latency_p95_ms} ms</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px]">p99 Latency:</span>
                  <div className="font-mono font-bold text-rose-400">{loadTestResult.latency_p99_ms} ms</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                <span>System Status: {loadTestResult.system_health}</span>
                <span>Error Rate: {loadTestResult.error_rate_pct}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Population Stability Index (PSI) Drift Monitor */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Population Stability Index (PSI) Drift Monitor
            </h3>
            <span className="text-xs font-mono text-slate-400">PSI &lt; 0.10 Stable</span>
          </div>

          <div className="space-y-2.5">
            {psiData.features_psi.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-semibold text-white">{item.feature}</div>
                  <div className="text-[11px] text-slate-400">{item.interpretation}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-cyan-300">PSI: {item.psi_score}</div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.status === 'STABLE'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-indigo-300">Retraining Policy: </span>
            {psiData.retraining_trigger_recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
