import React from 'react';
import { EngineState, DAGMetrics } from '../types/domain';
import { CheckCircle2, Clock, Cpu, Gauge } from 'lucide-react';

interface MetricsBarProps {
  engineState: EngineState;
  metrics: DAGMetrics;
  concurrencyLimit: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  engineState,
  metrics,
  concurrencyLimit,
}) => {
  const getStatusBadge = () => {
    switch (engineState) {
      case 'idle':
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">IDLE</span>;
      case 'validating':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[11px] animate-pulse">VALIDATING</span>;
      case 'compiling':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[11px] animate-pulse">COMPILING DAG</span>;
      case 'running':
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] animate-pulse">EXECUTING SSE</span>;
      case 'paused':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">PAUSED</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px]">COMPLETED</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[11px]">FAILED</span>;
    }
  };

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/40 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">State Machine:</span>
            {getStatusBadge()}
          </div>
        </div>

        {/* Real-time KPIs */}
        <div className="flex flex-wrap items-center gap-6 text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Progress:</span>
            <span className="font-semibold text-white font-mono">
              {metrics.completedNodes} / {metrics.totalNodes}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Concurrency:</span>
            <span className="font-semibold text-white font-mono">
              {metrics.runningNodes} / {concurrencyLimit} active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Total Latency:</span>
            <span className="font-semibold text-white font-mono">
              {metrics.criticalPathLatencyMs.toFixed(0)} ms
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Throughput:</span>
            <span className="font-semibold text-white font-mono">
              {metrics.throughputOps.toFixed(1)} ops/s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
