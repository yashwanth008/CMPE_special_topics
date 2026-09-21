import React, { useState } from 'react';
import { ShieldCheck, Code } from 'lucide-react';

export const TypeScriptLab: React.FC = () => {
  const [activePattern, setActivePattern] = useState<'branded' | 'discriminated' | 'assertNever' | 'fsm' | 'result'>('branded');

  const patterns = [
    {
      id: 'branded',
      title: 'Nominal Branded Types',
      desc: 'Prevents string cross-contamination (e.g. passing a WorkflowId where a NodeId was expected).',
      code: `// Brand Utility
export type Brand<K, T> = K & { readonly __brand: T };

export type WorkflowId = Brand<string, 'WorkflowId'>;
export type NodeId = Brand<string, 'NodeId'>;

// Constructor Functions
export const makeWorkflowId = (id: string): WorkflowId => id as WorkflowId;
export const makeNodeId = (id: string): NodeId => id as NodeId;

// Type Safety Verification
const wfId = makeWorkflowId('wf_incident_01');
const nId: NodeId = wfId; // ❌ Type Error: Type '__brand: "WorkflowId"' is not assignable to '__brand: "NodeId"'`,
    },
    {
      id: 'discriminated',
      title: 'Strict Discriminated Unions',
      desc: 'Enforces type-narrowing based on a literal discriminant property ("kind").',
      code: `export interface TriggerConfig {
  kind: 'trigger';
  parameters: { source: string; rate_limit?: string };
}

export interface InferenceConfig {
  kind: 'inference';
  parameters: { model: string; threshold?: number };
}

export type NodeConfig = TriggerConfig | InferenceConfig;

// Exhaustive Narrowing Function
function processConfig(cfg: NodeConfig) {
  if (cfg.kind === 'trigger') {
    console.log(cfg.parameters.source); // ✅ Perfectly Typed
  } else {
    console.log(cfg.parameters.model);  // ✅ Narrowed to InferenceConfig
  }
}`,
    },
    {
      id: 'assertNever',
      title: 'Exhaustive assertNever() Helper',
      desc: 'Guarantees at compile time that every possible union member is addressed.',
      code: `export function assertNever(value: never, message?: string): never {
  throw new Error(message || \`Unhandled union variant: \${JSON.stringify(value)}\`);
}

function handleNode(cfg: NodeConfig) {
  switch (cfg.kind) {
    case 'trigger':
      return handleTrigger(cfg);
    case 'inference':
      return handleInference(cfg);
    default:
      // If a 'transform' kind is added without a case above, TypeScript fails build here!
      return assertNever(cfg);
  }
}`,
    },
    {
      id: 'fsm',
      title: 'Finite State Machine Transitions',
      desc: 'Formal table of legal transitions preventing illegal operations.',
      code: `export type EngineState = 'idle' | 'validating' | 'compiling' | 'running' | 'completed' | 'failed';

export const VALID_TRANSITIONS: Record<EngineState, EngineState[]> = {
  idle: ['validating'],
  validating: ['compiling', 'failed'],
  compiling: ['running', 'failed'],
  running: ['completed', 'failed'],
  completed: ['idle', 'validating'],
  failed: ['idle', 'validating'],
};`,
    },
    {
      id: 'result',
      title: 'Functional Result<T, E> Monad',
      desc: 'Eliminates unexpected unhandled rejections with explicit success/error objects.',
      code: `export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

// Usage
const res = compileDAG(graph);
if (res.success) {
  execute(res.data); // ✅ Guaranteed Valid
} else {
  alert(res.error);  // ✅ Guaranteed Error String
}`,
    },
  ];

  const current = patterns.find((p) => p.id === activePattern)!;

  return (
    <div className="space-y-6">
      {/* Pattern Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePattern(p.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activePattern === p.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {p.title}
          </button>
        ))}
      </div>

      {/* Detail Showcase Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              {current.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{current.desc}</p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
            Matt Pocock Pattern
          </span>
        </div>

        {/* Code Block */}
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed shadow-inner">
          {current.code}
        </pre>
      </div>
    </div>
  );
};
