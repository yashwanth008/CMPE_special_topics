import React from 'react';
import { WorkflowNode, NodeConfig } from '../types/domain';
import { assertNever } from '../utils/assertNever';
import { ShieldCheck, Sliders, Terminal } from 'lucide-react';

interface NodeInspectorProps {
  node: WorkflowNode | null;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node }) => {
  if (!node) {
    return (
      <div className="h-full rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Sliders className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm font-medium">No Node Selected</p>
        <p className="text-xs text-slate-600 mt-1">Click any DAG node on the canvas to inspect its configuration & type-narrowed parameters.</p>
      </div>
    );
  }

  // Type-Narrowed Parameter Renderer (Exhaustive Match)
  const renderConfigDetails = (config: NodeConfig) => {
    switch (config.kind) {
      case 'trigger':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Data Source:</span>
              <span className="font-mono text-emerald-400">{config.parameters.source}</span>
            </div>
            {config.parameters.rate_limit && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rate Limit:</span>
                <span className="font-mono text-slate-200">{config.parameters.rate_limit}</span>
              </div>
            )}
            {config.parameters.auth && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Auth Mechanism:</span>
                <span className="font-mono text-slate-200">{config.parameters.auth}</span>
              </div>
            )}
          </div>
        );

      case 'transform':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Scaling Algorithm:</span>
              <span className="font-mono text-amber-400">{config.parameters.scaling}</span>
            </div>
            {config.parameters.rolling_window_sec && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rolling Window:</span>
                <span className="font-mono text-slate-200">{config.parameters.rolling_window_sec} seconds</span>
              </div>
            )}
            {config.parameters.imputation && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Imputation Strategy:</span>
                <span className="font-mono text-slate-200">{config.parameters.imputation}</span>
              </div>
            )}
          </div>
        );

      case 'inference':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">AI Backbone:</span>
              <span className="font-mono text-indigo-400">{config.parameters.model}</span>
            </div>
            {config.parameters.threshold !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Anomaly Threshold:</span>
                <span className="font-mono text-slate-200">{config.parameters.threshold}</span>
              </div>
            )}
            {config.parameters.n_estimators !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Estimators:</span>
                <span className="font-mono text-slate-200">{config.parameters.n_estimators}</span>
              </div>
            )}
            {config.parameters.temperature !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Temperature:</span>
                <span className="font-mono text-slate-200">{config.parameters.temperature}</span>
              </div>
            )}
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Condition Logic:</span>
              <span className="font-mono text-purple-400">
                value {config.parameters.operator} {config.parameters.threshold}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">True Branch:</span>
              <span className="font-mono text-emerald-400">{config.parameters.true_branch}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">False Branch:</span>
              <span className="font-mono text-rose-400">{config.parameters.false_branch}</span>
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-2">
            {config.parameters.action && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono text-cyan-400">{config.parameters.action}</span>
              </div>
            )}
            {config.parameters.channel && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Dispatch Channel:</span>
                <span className="font-mono text-slate-200">{config.parameters.channel}</span>
              </div>
            )}
            {config.parameters.urgency && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Urgency:</span>
                <span className="font-mono text-amber-400 uppercase font-semibold">{config.parameters.urgency}</span>
              </div>
            )}
          </div>
        );

      case 'join':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Join Strategy:</span>
              <span className="font-mono text-pink-400">{config.parameters.join_mode}</span>
            </div>
            {config.parameters.timeout_ms && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Timeout:</span>
                <span className="font-mono text-slate-200">{config.parameters.timeout_ms} ms</span>
              </div>
            )}
          </div>
        );

      default:
        return assertNever(config);
    }
  };

  return (
    <div className="h-full rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 flex flex-col justify-between backdrop-blur-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              Kind: {node.kind}
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">{node.title}</h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {node.id}
          </span>
        </div>

        {/* Type-Safe Narrowed Parameters */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Type-Narrowed Config</span>
          </div>
          {renderConfigDetails(node.config)}
        </div>

        {/* Runtime State & Execution Metadata */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Runtime Execution State</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-mono uppercase font-semibold text-slate-200">{node.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dependencies:</span>
              <span className="font-mono text-slate-400">
                {node.dependencies.length > 0 ? node.dependencies.join(', ') : 'None (Root Trigger)'}
              </span>
            </div>
            {node.latency_ms !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Stage Duration:</span>
                <span className="font-mono text-emerald-400">{node.latency_ms} ms</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Output Summary */}
      {node.output_summary && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Output Payload
          </span>
          <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 font-mono overflow-x-auto max-h-32">
            {JSON.stringify(node.output_summary, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
