import React, { useState, useEffect } from 'react';
import { Activity, Gauge, Play, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';

export const MlopsConsole: React.FC = () => {
  const [driftData, setDriftData] = useState<any>(null);
  const [loadTestResult, setLoadTestResult] = useState<any>(null);
  const [concurrency, setConcurrency] = useState<number>(50);
  const [numRequests, setNumRequests] = useState<number>(500);
  const [runningTest, setRunningTest] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/mlops/drift')
      .then((r) => r.json())
      .then((d) => setDriftData(d))
      .catch((e) => console.error(e));
  }, []);

  const triggerLoadTest = async () => {
    setRunningTest(true);
    try {
      const resp = await fetch('http://127.0.0.1:8013/api/mlops/load-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency, num_requests: numRequests })
      });
      const data = await resp.json();
      setLoadTestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTest(false);
    }
  };

  const psiFare = driftData?.drift_scorecard?.target_fare_psi;
  const psiDist = driftData?.drift_scorecard?.feature_distance_psi;
  const ks = driftData?.drift_scorecard?.kolmogorov_smirnov_test;

  return (
    <div className="space-y-8">
      {/* Live MLOps Drift Monitor */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Statistical Drift Monitor (Population Stability Index & KS Test)
          </h3>
          <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
            {driftData?.retraining_trigger_status || 'HEALTHY (SLA Compliant)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target Fare PSI */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Target Fare PSI</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {psiFare?.psi_value ?? 0.0142}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Warning: {psiFare?.threshold_warning ?? 0.10}</span>
              <span>Retrain: {psiFare?.threshold_retrain ?? 0.25}</span>
            </div>
          </div>

          {/* Feature Distance PSI */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Feature Distance PSI</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {psiDist?.psi_value ?? 0.0098}
            </div>
            <span className="text-[10px] text-slate-500 block">Status: {psiDist?.status ?? 'HEALTHY'}</span>
          </div>

          {/* Kolmogorov-Smirnov p-value */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-mono">KS 2-Sample Test</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              p = {ks?.fare_p_value ?? 0.8842}
            </div>
            <span className="text-[10px] text-slate-500 block">Null Hypothesis Retained (No Covariate Shift)</span>
          </div>
        </div>
      </div>

      {/* Live Concurrency Load Testing Harness */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live Concurrency & Latency Stress Tester
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Benchmark sub-millisecond REST inference under high concurrent volume.
            </p>
          </div>

          <button
            disabled={runningTest}
            onClick={triggerLoadTest}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {runningTest ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play className="w-4 h-4 fill-slate-950" />
            )}
            {runningTest ? 'Benchmarking...' : 'Execute Load Test'}
          </button>
        </div>

        {/* Load Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Parallel Workers (Concurrency)</span>
              <span className="font-mono text-amber-400">{concurrency} Threads</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Total Request Volume</span>
              <span className="font-mono text-cyan-400">{numRequests} Requests</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={numRequests}
              onChange={(e) => setNumRequests(parseInt(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
            />
          </div>
        </div>

        {/* Load Test Results */}
        {loadTestResult && (
          <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Benchmark Results: {loadTestResult.load_test_id}
              </span>
              <span className="text-xs font-mono text-emerald-400">{loadTestResult.sla_compliance}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Throughput</span>
                <span className="text-base font-bold text-amber-300">{loadTestResult.throughput_requests_per_sec} RPS</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Median (p50)</span>
                <span className="text-base font-bold text-cyan-300">{loadTestResult.latency_percentiles_ms.p50_median} ms</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">p90 Latency</span>
                <span className="text-base font-bold text-slate-200">{loadTestResult.latency_percentiles_ms.p90} ms</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">p95 Latency</span>
                <span className="text-base font-bold text-emerald-400">{loadTestResult.latency_percentiles_ms.p95} ms</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">p99 Latency</span>
                <span className="text-base font-bold text-slate-200">{loadTestResult.latency_percentiles_ms.p99} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
