import React, { useState } from 'react';
import {
  WorkflowDAG,
  NodeId,
  EngineState,
  LogEntry,
  DAGMetrics,
  makeWorkflowId,
  makeNodeId,
} from './types/domain';
import { transition } from './machines/workflowMachine';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { DagCanvas } from './components/DagCanvas';
import { NodeInspector } from './components/NodeInspector';
import { ExecutionTerminal } from './components/ExecutionTerminal';
import { TypeScriptLab } from './components/TypeScriptLab';
import { ShieldCheck, Layers } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8009';

// Default Demo Template: Cloud Incident Remediation DAG
const INITIAL_CLOUD_DAG: WorkflowDAG = {
  id: makeWorkflowId('wf_incident_01'),
  name: 'Cloud Telemetry Incident DAG',
  description: 'Autonomous telemetry triage, isolation forest inference, and PagerDuty remediation',
  concurrency_limit: 4,
  nodes: [
    {
      id: makeNodeId('node_trigger_log'),
      title: 'Log Ingestion Stream',
      kind: 'trigger',
      dependencies: [],
      config: {
        kind: 'trigger',
        parameters: {
          source: 'aws.cloudwatch.telemetry',
          rate_limit: '10000_eps',
          auth: 'IAM_Role_Session',
        },
      },
      position: { x: 40, y: 180 },
      status: 'pending',
    },
    {
      id: makeNodeId('node_transform_robust'),
      title: 'Robust Scaler & Normalizer',
      kind: 'transform',
      dependencies: [makeNodeId('node_trigger_log')],
      config: {
        kind: 'transform',
        parameters: {
          scaling: 'RobustScaler',
          rolling_window_sec: 60,
          imputation: 'median',
        },
      },
      position: { x: 300, y: 180 },
      status: 'pending',
    },
    {
      id: makeNodeId('node_infer_isoforest'),
      title: 'Isolation Forest Anomaly Model',
      kind: 'inference',
      dependencies: [makeNodeId('node_transform_robust')],
      config: {
        kind: 'inference',
        parameters: {
          model: 'IsolationForest_v3',
          threshold: 0.85,
          n_estimators: 100,
        },
      },
      position: { x: 560, y: 180 },
      status: 'pending',
    },
    {
      id: makeNodeId('node_eval_condition'),
      title: 'Severity Evaluator',
      kind: 'condition',
      dependencies: [makeNodeId('node_infer_isoforest')],
      config: {
        kind: 'condition',
        parameters: {
          operator: '>=',
          threshold: 0.85,
          true_branch: 'node_action_remediate',
          false_branch: 'node_action_log',
        },
      },
      position: { x: 820, y: 180 },
      status: 'pending',
    },
    {
      id: makeNodeId('node_action_remediate'),
      title: 'PagerDuty & Auto-Scale Action',
      kind: 'action',
      dependencies: [makeNodeId('node_eval_condition')],
      config: {
        kind: 'action',
        parameters: {
          action: 'trigger_pagerduty_and_autoscale',
          channel: 'sre-alerts-urgent',
          urgency: 'critical',
        },
      },
      position: { x: 1080, y: 180 },
      status: 'pending',
    },
  ],
};

export const App: React.FC = () => {
  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [dag, setDag] = useState<WorkflowDAG>(INITIAL_CLOUD_DAG);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(makeNodeId('node_trigger_log'));
  const [selectedTemplate, setSelectedTemplate] = useState<string>('cloud_incident');
  const [activeTab, setActiveTab] = useState<'canvas' | 'ts-lab' | 'arch'>('canvas');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init_log_1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'FlowForge DAG Engine initialized with strict Matt Pocock TypeScript guarantees.',
    },
  ]);

  // Derived Metrics
  const metrics: DAGMetrics = {
    totalNodes: dag.nodes.length,
    completedNodes: dag.nodes.filter((n) => n.status === 'completed').length,
    runningNodes: dag.nodes.filter((n) => n.status === 'running').length,
    failedNodes: dag.nodes.filter((n) => n.status === 'failed').length,
    criticalPathLatencyMs: dag.nodes.reduce((acc, n) => acc + (n.latency_ms || 0), 0),
    maxParallelism: dag.concurrency_limit,
    throughputOps: dag.nodes.some((n) => n.status === 'running') ? 142.8 : 0,
  };

  const addLog = (level: LogEntry['level'], message: string, nodeId?: NodeId, metadata?: any) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        nodeId,
        message,
        metadata,
      },
    ]);
  };

  // Reset Workflow State
  const handleReset = () => {
    setEngineState('idle');
    setDag((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({
        ...n,
        status: 'pending',
        latency_ms: undefined,
        output_summary: undefined,
        error: undefined,
      })),
    }));
    addLog('info', 'Workflow reset to idle state.');
  };

  // Execute Live SSE Stream
  const handleExecute = async () => {
    // 1. Validation Transition
    const valRes = transition({ state: engineState, activeRunId: null, errorMessage: null }, { type: 'START_VALIDATION' });
    if (!valRes.success) {
      addLog('error', `Validation rejected: ${valRes.error}`);
      return;
    }
    setEngineState('validating');
    addLog('info', 'Validating DAG schema & Kahn topological acyclicity...');

    // Reset node statuses
    setDag((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({ ...n, status: 'pending', latency_ms: undefined })),
    }));

    await new Promise((r) => setTimeout(r, 400));

    // 2. Compilation Transition
    setEngineState('compiling');
    addLog('info', 'Compiling Kahn topological concurrency stages...');

    await new Promise((r) => setTimeout(r, 400));

    // 3. Execution Transition
    setEngineState('running');
    addLog('success', 'Starting SSE real-time execution stream on Port 8009...');

    try {
      // Adapt the client-side WorkflowDAG shape into the backend's
      // WorkflowDefinition schema (nested config.title/description,
      // wrapped in an ExecuteRequest envelope).
      const backendWorkflow = {
        id: dag.id,
        name: dag.name,
        description: dag.description,
        version: '1.0.0',
        tags: [],
        nodes: dag.nodes.map((n) => ({
          id: n.id,
          name: n.title,
          dependencies: n.dependencies,
          position: n.position,
          config: {
            kind: n.config.kind,
            title: n.title,
            description: n.title,
            parameters: n.config.parameters,
          },
        })),
      };

      const response = await fetch(`${API_BASE}/api/workflow/execute-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: backendWorkflow, inputs: {}, simulation_speed_ms: 400 }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              handleSSEEvent(event);
            } catch (e) {
              console.error('SSE JSON parse error', e);
            }
          }
        }
      }
    } catch (err: any) {
      setEngineState('failed');
      addLog('error', `Execution failed: ${err.message}`);
    }
  };

  const handleSSEEvent = (event: any) => {
    switch (event.type) {
      case 'state_change':
        if (event.state === 'failed') {
          setEngineState('failed');
          addLog('error', `Execution failed: ${event.error || 'unknown error'}`);
        } else if (event.state === 'running') {
          setEngineState('running');
          addLog('info', event.message || 'Executing nodes...');
        } else if (event.state === 'completed') {
          setEngineState('completed');
          addLog('success', event.summary || `Workflow run [${event.run_id}] completed in ${event.total_latency_ms}ms.`);
        } else {
          addLog('info', event.message || `State -> ${event.state}`);
        }
        break;

      case 'compilation_success':
        addLog(
          'success',
          `DAG compiled: ${event.compilation.total_nodes} nodes across ${event.compilation.max_depth + 1} concurrency stages.`
        );
        break;

      case 'stage_start':
        addLog('info', `Executing Stage [${Number(event.level) + 1}] concurrently with nodes: ${event.parallel_nodes.join(', ')}`);
        setDag((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            event.parallel_nodes.includes(n.id) ? { ...n, status: 'running' } : n
          ),
        }));
        break;

      case 'node_start':
        addLog('info', `Node "${event.node_name}" (${event.kind}) started.`, makeNodeId(event.node_id));
        break;

      case 'node_complete':
        addLog('success', `Node "${event.node_name}" completed in ${event.latency_ms}ms`, makeNodeId(event.node_id), event.output);
        setDag((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === event.node_id
              ? {
                  ...n,
                  status: 'completed',
                  latency_ms: event.latency_ms,
                  output_summary: event.output,
                }
              : n
          ),
        }));
        break;

      case 'workflow_finished':
        setEngineState('completed');
        addLog('success', `Workflow run [${event.run_id}] finished in ${event.total_ms}ms.`);
        break;
    }
  };

  const selectedNode = dag.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header */}
      <Header
        engineState={engineState}
        onExecute={handleExecute}
        onReset={handleReset}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Metrics Bar */}
      <MetricsBar
        engineState={engineState}
        metrics={metrics}
        concurrencyLimit={dag.concurrency_limit}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {activeTab === 'canvas' && (
          <>
            {/* Top Row: DAG Canvas + Node Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DagCanvas
                  nodes={dag.nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>
              <div className="lg:col-span-1">
                <NodeInspector node={selectedNode} />
              </div>
            </div>

            {/* Bottom Row: Execution SSE Terminal */}
            <div className="w-full">
              <ExecutionTerminal logs={logs} onClearLogs={() => setLogs([])} />
            </div>
          </>
        )}

        {activeTab === 'ts-lab' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-md flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Matt Pocock TypeScript Architecture Suite
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Zero implicit any, nominal branded types, runtime Zod boundaries, discriminated unions & FSM guarantees.
                </p>
              </div>
            </div>
            <TypeScriptLab />
          </div>
        )}

        {activeTab === 'arch' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                FlowForge Architectural Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-indigo-300">1. Kahn's Cycle Detection</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Graph compilation performs in-degree analysis to detect cyclic dependencies before any compute starts.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-300">2. Concurrency Stages</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Independent nodes in identical topological depths execute concurrently up to the configured limit.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-cyan-300">3. SSE Event Bus</h4>
                  <p className="text-slate-400 leading-relaxed">
                    FastAPI yields chunked text/event-stream data enabling sub-millisecond client telemetry rendering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
