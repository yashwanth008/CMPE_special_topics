import { z } from 'zod';

export const TriggerConfigSchema = z.object({
  kind: z.literal('trigger'),
  parameters: z.object({
    source: z.string(),
    rate_limit: z.string().optional(),
    auth: z.string().optional(),
  }),
});

export const TransformConfigSchema = z.object({
  kind: z.literal('transform'),
  parameters: z.object({
    scaling: z.enum(['StandardScaler', 'RobustScaler', 'MinMax']),
    rolling_window_sec: z.number().optional(),
    imputation: z.string().optional(),
  }),
});

export const InferenceConfigSchema = z.object({
  kind: z.literal('inference'),
  parameters: z.object({
    model: z.string(),
    threshold: z.number().optional(),
    n_estimators: z.number().optional(),
    temperature: z.number().optional(),
  }),
});

export const ConditionConfigSchema = z.object({
  kind: z.literal('condition'),
  parameters: z.object({
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']),
    threshold: z.union([z.number(), z.string()]),
    true_branch: z.string(),
    false_branch: z.string(),
  }),
});

export const ActionConfigSchema = z.object({
  kind: z.literal('action'),
  parameters: z.object({
    action: z.string().optional(),
    channel: z.string().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    target_endpoint: z.string().optional(),
  }),
});

export const JoinConfigSchema = z.object({
  kind: z.literal('join'),
  parameters: z.object({
    join_mode: z.enum(['wait_all', 'wait_any']),
    timeout_ms: z.number().optional(),
  }),
});

export const NodeConfigSchema = z.discriminatedUnion('kind', [
  TriggerConfigSchema,
  TransformConfigSchema,
  InferenceConfigSchema,
  ConditionConfigSchema,
  ActionConfigSchema,
  JoinConfigSchema,
]);

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(['trigger', 'transform', 'inference', 'condition', 'action', 'join']),
  dependencies: z.array(z.string()),
  config: NodeConfigSchema,
  position: z.object({ x: z.number(), y: z.number() }),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']).default('pending'),
  latency_ms: z.number().optional(),
  output_summary: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export const WorkflowDAGSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  concurrency_limit: z.number().default(4),
});

export type InferredWorkflowDAG = z.infer<typeof WorkflowDAGSchema>;
export type InferredWorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type InferredNodeConfig = z.infer<typeof NodeConfigSchema>;
