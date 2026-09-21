// FlowForge Core Domain Types — Matt Pocock TypeScript Discipline
// Features Nominal Branding, Strict Discriminated Unions, Result Monads, and FSM Definitions.

export type Brand<K, T> = K & { readonly __brand: T };

export type WorkflowId = Brand<string, 'WorkflowId'>;
export type NodeId = Brand<string, 'NodeId'>;
export type RunId = Brand<string, 'RunId'>;
export type ExecutionToken = Brand<string, 'ExecutionToken'>;

export const makeWorkflowId = (id: string): WorkflowId => id as WorkflowId;
export const makeNodeId = (id: string): NodeId => id as NodeId;
export const makeRunId = (id: string): RunId => id as RunId;

// Node Statuses
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// Discriminated Union Configurations
export interface TriggerConfig {
  kind: 'trigger';
  parameters: {
    source: string;
    rate_limit?: string;
    auth?: string;
  };
}

export interface TransformConfig {
  kind: 'transform';
  parameters: {
    scaling: 'StandardScaler' | 'RobustScaler' | 'MinMax';
    rolling_window_sec?: number;
    imputation?: string;
  };
}

export interface InferenceConfig {
  kind: 'inference';
  parameters: {
    model: string;
    threshold?: number;
    n_estimators?: number;
    temperature?: number;
  };
}

export interface ConditionConfig {
  kind: 'condition';
  parameters: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number | string;
    true_branch: string;
    false_branch: string;
  };
}

export interface ActionConfig {
  kind: 'action';
  parameters: {
    action?: string;
    channel?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    target_endpoint?: string;
  };
}

export interface JoinConfig {
  kind: 'join';
  parameters: {
    join_mode: 'wait_all' | 'wait_any';
    timeout_ms?: number;
  };
}

export type NodeConfig =
  | TriggerConfig
  | TransformConfig
  | InferenceConfig
  | ConditionConfig
  | ActionConfig
  | JoinConfig;

export interface WorkflowNode {
  id: NodeId;
  title: string;
  kind: NodeConfig['kind'];
  dependencies: NodeId[];
  config: NodeConfig;
  position: { x: number; y: number };
  status: NodeExecutionStatus;
  latency_ms?: number;
  output_summary?: Record<string, any>;
  error?: string;
}

export interface WorkflowDAG {
  id: WorkflowId;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  concurrency_limit: number;
}

// Engine Finite State Machine Types
export type EngineState =
  | 'idle'
  | 'validating'
  | 'compiling'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export type EngineEvent =
  | { type: 'START_VALIDATION' }
  | { type: 'START_COMPILATION' }
  | { type: 'COMPILATION_ERROR'; error: string }
  | { type: 'START_EXECUTION' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'EXECUTION_SUCCESS'; runId: RunId }
  | { type: 'EXECUTION_FAILURE'; error: string }
  | { type: 'RESET' };

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  nodeId?: NodeId;
  message: string;
  metadata?: Record<string, any>;
}

export interface DAGMetrics {
  totalNodes: number;
  completedNodes: number;
  runningNodes: number;
  failedNodes: number;
  criticalPathLatencyMs: number;
  maxParallelism: number;
  throughputOps: number;
}
