# FlowForge Technical Specification
*Formal TypeScript Interfaces, Branded Types, Zod Schemas & State Machine Model*

## 1. Domain Types & Nominal Branding

```typescript
export type Brand<K, T> = K & { readonly __brand: T };

export type WorkflowId = Brand<string, 'WorkflowId'>;
export type NodeId = Brand<string, 'NodeId'>;
export type RunId = Brand<string, 'RunId'>;
export type ExecutionToken = Brand<string, 'ExecutionToken'>;

export const makeWorkflowId = (id: string): WorkflowId => id as WorkflowId;
export const makeNodeId = (id: string): NodeId => id as NodeId;
export const makeRunId = (id: string): RunId => id as RunId;
```

---

## 2. Discriminated Union Node Configurations

```typescript
export interface BaseNodeConfig {
  title: string;
  description: string;
}

export interface TriggerConfig extends BaseNodeConfig {
  kind: 'trigger';
  parameters: {
    source: string;
    rate_limit?: string;
    auth?: string;
  };
}

export interface TransformConfig extends BaseNodeConfig {
  kind: 'transform';
  parameters: {
    scaling: 'StandardScaler' | 'RobustScaler' | 'MinMax';
    rolling_window_sec?: number;
    imputation?: string;
  };
}

export interface InferenceConfig extends BaseNodeConfig {
  kind: 'inference';
  parameters: {
    model: string;
    threshold?: number;
    n_estimators?: number;
    temperature?: number;
  };
}

export interface ConditionConfig extends BaseNodeConfig {
  kind: 'condition';
  parameters: {
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number | string;
    true_branch: string;
    false_branch: string;
  };
}

export interface ActionConfig extends BaseNodeConfig {
  kind: 'action';
  parameters: {
    action?: string;
    channel?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    target_endpoint?: string;
  };
}

export interface JoinConfig extends BaseNodeConfig {
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
```

---

## 3. Finite State Machine Transitions

```typescript
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

export const VALID_TRANSITIONS: Record<EngineState, EngineState[]> = {
  idle: ['validating'],
  validating: ['compiling', 'failed'],
  compiling: ['running', 'failed'],
  running: ['paused', 'completed', 'failed'],
  paused: ['running', 'failed', 'idle'],
  completed: ['idle', 'validating'],
  failed: ['idle', 'validating'],
};
```
