from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal, Union
import asyncio
import json
import time
import uuid

app = FastAPI(
    title="FlowForge - Matt Pocock TypeScript Workflow DAG Engine",
    version="1.0.0",
    description="Textbook full-stack autonomous workflow orchestrator with strict TypeScript patterns, Zod validation, and state machine transitions."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Domain Models & Discriminated Unions
# ---------------------------------------------------------
NodeType = Literal["trigger", "transform", "inference", "condition", "action", "join"]
NodeStatus = Literal["idle", "pending", "running", "succeeded", "failed", "skipped"]
EngineState = Literal["idle", "validating", "compiling", "running", "paused", "completed", "failed"]

class NodeConfig(BaseModel):
    kind: NodeType
    title: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class WorkflowNode(BaseModel):
    id: str
    name: str
    config: NodeConfig
    dependencies: List[str] = Field(default_factory=list)
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 100.0, "y": 100.0})

class WorkflowDefinition(BaseModel):
    id: str
    name: str
    description: str
    version: str = "1.0.0"
    nodes: List[WorkflowNode]
    tags: List[str] = Field(default_factory=list)

class CompileRequest(BaseModel):
    workflow: WorkflowDefinition

class ExecuteRequest(BaseModel):
    workflow: WorkflowDefinition
    inputs: Dict[str, Any] = Field(default_factory=dict)
    simulation_speed_ms: int = Field(default=400, ge=50, le=2000)

# ---------------------------------------------------------
# Pre-built Enterprise Workflow Templates
# ---------------------------------------------------------
TEMPLATES: List[WorkflowDefinition] = [
    WorkflowDefinition(
        id="wf_cloud_incident_response",
        name="⚡ Autonomous Cloud Incident Auto-Remediation",
        description="Event-driven telemetry ingestion, high-dimensional anomaly detection, automated root-cause analysis, and Slack/PagerDuty escalation.",
        tags=["Production", "DevOps", "AI Ops", "TypeScript Spec"],
        nodes=[
            WorkflowNode(
                id="node_trigger",
                name="Kubernetes Anomaly Webhook",
                config=NodeConfig(
                    kind="trigger",
                    title="Webhook Trigger",
                    description="Receives CPU spike and OOM telemetry payloads.",
                    parameters={"source": "k8s-telemetry-ingress", "rate_limit": "5000/sec", "auth": "HMAC-SHA256"}
                ),
                dependencies=[],
                position={"x": 50, "y": 150}
            ),
            WorkflowNode(
                id="node_transform_telemetry",
                name="Normalize & Dimensionality Projection",
                config=NodeConfig(
                    kind="transform",
                    title="Telemetry Vector Normalization",
                    description="Extracts z-scores, CPU/Memory gradients, and robust Mahalanobis features.",
                    parameters={"scaling": "RobustScaler", "rolling_window_sec": 60, "imputation": "train_median"}
                ),
                dependencies=["node_trigger"],
                position={"x": 260, "y": 150}
            ),
            WorkflowNode(
                id="node_anomaly_inference",
                name="Isolation Forest & Deep Autoencoder Scoring",
                config=NodeConfig(
                    kind="inference",
                    title="Multi-Backbone Anomaly Scorer",
                    description="Computes multi-head reconstruction error and contamination probability.",
                    parameters={"model": "IsolationForest+Autoencoder", "threshold": 0.85, "n_estimators": 200}
                ),
                dependencies=["node_transform_telemetry"],
                position={"x": 480, "y": 150}
            ),
            WorkflowNode(
                id="node_eval_severity",
                name="Severity Condition Evaluation",
                config=NodeConfig(
                    kind="condition",
                    title="Threat Threshold Branch",
                    description="Branches into Auto-Heal vs PagerDuty Critical Escalation.",
                    parameters={"operator": ">=", "threshold": 0.85, "true_branch": "P1-Critical", "false_branch": "P3-SelfHeal"}
                ),
                dependencies=["node_anomaly_inference"],
                position={"x": 700, "y": 150}
            ),
            WorkflowNode(
                id="node_auto_heal",
                name="Execute Horizontal Pod Autoscaler",
                config=NodeConfig(
                    kind="action",
                    title="Kubernetes HPA Remediation",
                    description="Scales replica count from 3 to 12 and flushes Redis cache.",
                    parameters={"action": "k8s.scale_deployment", "replicas": 12, "namespace": "prod-core"}
                ),
                dependencies=["node_eval_severity"],
                position={"x": 920, "y": 80}
            ),
            WorkflowNode(
                id="node_notify_slack",
                name="PagerDuty & Slack SOC Broadcast",
                config=NodeConfig(
                    kind="action",
                    title="Incident Broadcast Dispatcher",
                    description="Dispatches enriched diagnostic payload and incident runbook to #incident-war-room.",
                    parameters={"channel": "#incident-war-room", "urgency": "high", "slack_blocks": True}
                ),
                dependencies=["node_eval_severity"],
                position={"x": 920, "y": 240}
            ),
            WorkflowNode(
                id="node_join_sync",
                name="Remediation Audit Log Merge",
                config=NodeConfig(
                    kind="join",
                    title="Sync Join",
                    description="Ensures both auto-healing and notifications are completed before recording audit trail.",
                    parameters={"join_mode": "wait_all", "timeout_ms": 5000}
                ),
                dependencies=["node_auto_heal", "node_notify_slack"],
                position={"x": 1140, "y": 150}
            )
        ]
    ),
    WorkflowDefinition(
        id="wf_kaggle_automl_dag",
        name="🏆 Kaggle Multi-Model Stacking & Ensemble DAG",
        description="Automated feature pipeline, 3-backbone tournament (LightGBM, XGBoost, CatBoost), and Caruana Greedy Ensembling.",
        tags=["AutoML", "Feature Engineering", "Ensemble", "Production"],
        nodes=[
            WorkflowNode(
                id="node_raw_dataset",
                name="Ingest NYC Taxi / Housing Dataset",
                config=NodeConfig(
                    kind="trigger",
                    title="Batch Data Ingress",
                    description="Loads 100,000 parquet records with temporal features.",
                    parameters={"format": "parquet", "batch_size": 50000, "partitions": 4}
                ),
                dependencies=[],
                position={"x": 50, "y": 150}
            ),
            WorkflowNode(
                id="node_feat_eng",
                name="Target Encoding & Polynomial Transforms",
                config=NodeConfig(
                    kind="transform",
                    title="Leakage-Free Feature Engineering",
                    description="Computes K-Fold target encodings and geodetic haversine distances.",
                    parameters={"cv_folds": 5, "smooth_factor": 10.0, "polynomial_degree": 2}
                ),
                dependencies=["node_raw_dataset"],
                position={"x": 260, "y": 150}
            ),
            WorkflowNode(
                id="node_lgbm_train",
                name="Train LightGBM Level-1 Model",
                config=NodeConfig(
                    kind="inference",
                    title="LightGBM Regressor",
                    description="Gradient boosted trees with leaf-wise splitting.",
                    parameters={"n_estimators": 500, "learning_rate": 0.03, "num_leaves": 31}
                ),
                dependencies=["node_feat_eng"],
                position={"x": 500, "y": 70}
            ),
            WorkflowNode(
                id="node_xgb_train",
                name="Train XGBoost Level-1 Model",
                config=NodeConfig(
                    kind="inference",
                    title="XGBoost Regressor",
                    description="Histogram-based gradient boosted decision trees.",
                    parameters={"n_estimators": 450, "learning_rate": 0.04, "max_depth": 6}
                ),
                dependencies=["node_feat_eng"],
                position={"x": 500, "y": 180}
            ),
            WorkflowNode(
                id="node_catboost_train",
                name="Train CatBoost Level-1 Model",
                config=NodeConfig(
                    kind="inference",
                    title="CatBoost Regressor",
                    description="Symmetric tree structure with oblivious decision trees.",
                    parameters={"iterations": 600, "learning_rate": 0.05, "depth": 6}
                ),
                dependencies=["node_feat_eng"],
                position={"x": 500, "y": 290}
            ),
            WorkflowNode(
                id="node_greedy_ensemble",
                name="Caruana Greedy Stacking Ensemble",
                config=NodeConfig(
                    kind="join",
                    title="Level-2 Stacking Super Learner",
                    description="Optimizes ensemble weights via out-of-fold predictions minimizing RMSE.",
                    parameters={"ensemble_size": 25, "metric": "RMSE", "meta_learner": "RidgeCV"}
                ),
                dependencies=["node_lgbm_train", "node_xgb_train", "node_catboost_train"],
                position={"x": 760, "y": 180}
            ),
            WorkflowNode(
                id="node_deploy_model",
                name="Deploy ONNX Artifact to Model Registry",
                config=NodeConfig(
                    kind="action",
                    title="Production Model Deployment",
                    description="Exports graph to ONNX Runtime and updates serving canary endpoint.",
                    parameters={"registry": "MLflow/Production", "format": "ONNX", "latency_sla_ms": 15}
                ),
                dependencies=["node_greedy_ensemble"],
                position={"x": 1000, "y": 180}
            )
        ]
    ),
    WorkflowDefinition(
        id="wf_realtime_rag_llm",
        name="🧠 Semantic RAG & NanoLlama Synthetic Evaluation",
        description="Document chunking, vector embedding, hybrid reranking, and NanoLlama streaming generation with confidence gating.",
        tags=["LLM", "RAG", "Vector Search", "Evaluation"],
        nodes=[
            WorkflowNode(
                id="node_query_in",
                name="User Conversational Query",
                config=NodeConfig(
                    kind="trigger",
                    title="User Prompt Ingress",
                    description="Accepts technical AI/ML questions.",
                    parameters={"client": "React UI", "session_id": "sess-9923"}
                ),
                dependencies=[],
                position={"x": 50, "y": 150}
            ),
            WorkflowNode(
                id="node_vector_search",
                name="Dense Semantic Vector Retrieval",
                config=NodeConfig(
                    kind="transform",
                    title="HNSW Vector Index Search",
                    description="Finds top-5 relevant textbook chunks with cosine similarity > 0.82.",
                    parameters={"top_k": 5, "similarity_metric": "cosine", "ef_search": 64}
                ),
                dependencies=["node_query_in"],
                position={"x": 270, "y": 150}
            ),
            WorkflowNode(
                id="node_llm_generation",
                name="NanoLlama Auto-Regressive Streamer",
                config=NodeConfig(
                    kind="inference",
                    title="NanoLlama 3-Layer Decoder",
                    description="Generates grounded answers with RoPE attention and KV Cache.",
                    parameters={"temperature": 0.0, "max_tokens": 256, "repetition_penalty": 1.15}
                ),
                dependencies=["node_vector_search"],
                position={"x": 520, "y": 150}
            ),
            WorkflowNode(
                id="node_faithfulness_check",
                name="Hallucination & Faithfulness Guard",
                config=NodeConfig(
                    kind="condition",
                    title="Confidence Gate",
                    description="Verifies generated response against source context citations.",
                    parameters={"min_faithfulness_score": 0.90, "action_on_fail": "refuse_and_clarify"}
                ),
                dependencies=["node_llm_generation"],
                position={"x": 770, "y": 150}
            ),
            WorkflowNode(
                id="node_stream_client",
                name="Stream SSE to Web Client",
                config=NodeConfig(
                    kind="action",
                    title="SSE Stream Dispatcher",
                    description="Yields tokens, latency, and attention weights directly to browser.",
                    parameters={"protocol": "Server-Sent Events", "include_telemetry": True}
                ),
                dependencies=["node_faithfulness_check"],
                position={"x": 1020, "y": 150}
            )
        ]
    )
]

# ---------------------------------------------------------
# Graph Compilation & Cycle Detection (Kahn's Algorithm)
# ---------------------------------------------------------
def compile_workflow_dag(workflow: WorkflowDefinition) -> Dict[str, Any]:
    nodes_by_id = {node.id: node for node in workflow.nodes}
    in_degree = {node.id: 0 for node in workflow.nodes}
    adj_list = {node.id: [] for node in workflow.nodes}

    # Build adjacency and degree map
    for node in workflow.nodes:
        for dep in node.dependencies:
            if dep not in nodes_by_id:
                raise ValueError(f"Dependency '{dep}' referenced by node '{node.id}' does not exist in workflow.")
            adj_list[dep].append(node.id)
            in_degree[node.id] += 1

    # Kahn's Algorithm for Topological Sort
    queue = [node_id for node_id, deg in in_degree.items() if deg == 0]
    execution_order = []
    level_map = {node_id: 0 for node_id in queue}

    while queue:
        curr = queue.pop(0)
        execution_order.append(curr)
        curr_level = level_map[curr]

        for neighbor in adj_list[curr]:
            in_degree[neighbor] -= 1
            level_map[neighbor] = max(level_map.get(neighbor, 0), curr_level + 1)
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(execution_order) != len(workflow.nodes):
        cycle_nodes = [node_id for node_id, deg in in_degree.items() if deg > 0]
        raise ValueError(f"Cycle detected in workflow graph involving nodes: {cycle_nodes}")

    # Compute DAG properties
    max_depth = max(level_map.values()) if level_map else 0
    levels: Dict[int, List[str]] = {}
    for node_id, lvl in level_map.items():
        levels.setdefault(lvl, []).append(node_id)

    return {
        "valid": True,
        "total_nodes": len(workflow.nodes),
        "execution_order": execution_order,
        "max_depth": max_depth,
        "concurrency_levels": levels,
        "compiled_at": time.time(),
        "hash": str(uuid.uuid4())[:8]
    }

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "flowforge-dag-engine",
        "matt_pocock_patterns": [
            "Branded Types (WorkflowId, NodeId, RunId)",
            "Discriminated Unions (NodeKind -> TypedConfig)",
            "Finite State Machine Transitions (Idle -> Validating -> Running -> Completed)",
            "Result Pattern Result<T, E>",
            "Exhaustive Pattern Matching with assertNever()"
        ],
        "version": "1.0.0"
    }

@app.get("/api/workflow/templates")
def get_templates():
    return {"templates": TEMPLATES}

@app.post("/api/workflow/compile")
def compile_workflow(req: CompileRequest):
    try:
        result = compile_workflow_dag(req.workflow)
        return {"ok": True, "compilation": result}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/workflow/execute-stream")
async def execute_stream(req: ExecuteRequest):
    async def event_generator():
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        t_start = time.time()

        # Step 1: State Machine Transition: IDLE -> VALIDATING
        yield f"data: {json.dumps({'type': 'state_change', 'state': 'validating', 'run_id': run_id, 'message': 'Checking schema constraints and type integrity...'})}\n\n"
        await asyncio.sleep(0.15)

        # Step 2: State Machine Transition: VALIDATING -> COMPILING
        yield f"data: {json.dumps({'type': 'state_change', 'state': 'compiling', 'run_id': run_id, 'message': 'Constructing execution DAG and topological sort order...'})}\n\n"
        await asyncio.sleep(0.2)

        try:
            compilation = compile_workflow_dag(req.workflow)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'state_change', 'state': 'failed', 'run_id': run_id, 'error': str(e)})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'compilation_success', 'compilation': compilation})}\n\n"
        await asyncio.sleep(0.15)

        # Step 3: State Machine Transition: COMPILING -> RUNNING
        total_n = compilation["total_nodes"]
        max_d = compilation["max_depth"] + 1
        msg = f"Executing {total_n} nodes across {max_d} concurrency stages..."
        yield f"data: {json.dumps({'type': 'state_change', 'state': 'running', 'run_id': run_id, 'message': msg})}\n\n"

        node_outputs: Dict[str, Any] = {}
        node_latencies: Dict[str, float] = {}

        # Step 4: Execute nodes according to topological levels
        for level, node_ids in compilation["concurrency_levels"].items():
            yield f"data: {json.dumps({'type': 'stage_start', 'level': level, 'parallel_nodes': node_ids})}\n\n"

            # Simulate parallel level execution
            for node_id in node_ids:
                node = next(n for n in req.workflow.nodes if n.id == node_id)
                
                # Emit Node Started
                yield f"data: {json.dumps({'type': 'node_start', 'node_id': node_id, 'node_name': node.name, 'kind': node.config.kind})}\n\n"
                
                # Simulate compute latency
                sim_delay = (req.simulation_speed_ms / 1000.0) * (0.8 + 0.4 * (hash(node_id) % 10) / 10.0)
                await asyncio.sleep(sim_delay)

                # Generate synthetic typed payload based on discriminated kind
                output_payload: Dict[str, Any] = {}
                if node.config.kind == "trigger":
                    output_payload = {
                        "events_received": 1420,
                        "batch_id": f"batch_{uuid.uuid4().hex[:6]}",
                        "source_ip": "10.244.0.12",
                        "status": "INGRESS_OK"
                    }
                elif node.config.kind == "transform":
                    output_payload = {
                        "features_engineered": 48,
                        "nulls_imputed": 0,
                        "scaling_method": node.config.parameters.get("scaling", "StandardScaler"),
                        "variance_explained_ratio": 0.984
                    }
                elif node.config.kind == "inference":
                    output_payload = {
                        "model_score": round(0.88 + (hash(node_id) % 10) / 100.0, 4),
                        "latency_ms": round(sim_delay * 1000, 1),
                        "decision": "HIGH_CONFIDENCE_PREDICTION",
                        "top_features": ["cpu_rate_derivative", "memory_rss_bytes", "request_error_ratio"]
                    }
                elif node.config.kind == "condition":
                    output_payload = {
                        "condition_evaluated": "score >= 0.85",
                        "result": True,
                        "branch_taken": "P1-Critical-Remediation",
                        "threshold_delta": "+0.038"
                    }
                elif node.config.kind == "action":
                    output_payload = {
                        "action_status": "DISPATCHED_SUCCESSFULLY",
                        "target_endpoint": node.config.parameters.get("channel", "k8s-api-server"),
                        "http_code": 200,
                        "ack_token": f"ack_{uuid.uuid4().hex[:8]}"
                    }
                elif node.config.kind == "join":
                    output_payload = {
                        "merged_inputs": len(node.dependencies),
                        "synchronization_barrier": "PASSED",
                        "all_branches_succeeded": True
                    }

                node_outputs[node_id] = output_payload
                node_latencies[node_id] = round(sim_delay * 1000, 1)

                # Emit Node Complete
                yield f"data: {json.dumps({'type': 'node_complete', 'node_id': node_id, 'node_name': node.name, 'kind': node.config.kind, 'output': output_payload, 'latency_ms': node_latencies[node_id]})}\n\n"

        # Step 5: State Machine Transition: RUNNING -> COMPLETED
        total_time_ms = round((time.time() - t_start) * 1000, 1)
        yield f"data: {json.dumps({'type': 'state_change', 'state': 'completed', 'run_id': run_id, 'total_latency_ms': total_time_ms, 'summary': f'Successfully orchestrated {len(req.workflow.nodes)} nodes with 0 errors.'})}\n\n"
        yield f"data: {json.dumps({'type': 'workflow_finished', 'run_id': run_id, 'outputs': node_outputs, 'latencies': node_latencies, 'total_ms': total_time_ms})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ---------------------------------------------------------
# TypeScript Design Patterns & Type-Safety Documentation
# ---------------------------------------------------------
@app.get("/api/workflow/skills-matrix")
def get_skills_matrix():
    return {
        "skills": [
            {
                "name": "Branded Types Pattern",
                "pattern": "type WorkflowId = string & { readonly __brand: unique symbol }",
                "purpose": "Prevents accidental ID cross-assignment at compile time (e.g. passing NodeId to a function expecting WorkflowId).",
                "implemented_in": "src/types/domain.ts"
            },
            {
                "name": "Discriminated Unions & Exhaustive Matching",
                "pattern": "type NodeConfig = TriggerConfig | TransformConfig | InferenceConfig | ConditionConfig | ActionConfig | JoinConfig",
                "purpose": "Enables 100% type-safe pattern matching. Uses assertNever(x: never) so adding a new node kind without handling it causes a compile-time error.",
                "implemented_in": "src/types/domain.ts"
            },
            {
                "name": "Finite State Machine (FSM)",
                "pattern": "type StateTransition = { [K in EngineState]: readonly EngineEvent[] }",
                "purpose": "Restricts workflow lifecycle transitions strictly through validated actions, making invalid state combinations impossible.",
                "implemented_in": "src/machines/workflowMachine.ts"
            },
            {
                "name": "Result<T, E> Functional Error Handling",
                "pattern": "type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }",
                "purpose": "Eliminates unexpected runtime throws. Every failure mode is explicitly modeled in the return type.",
                "implemented_in": "src/utils/result.ts"
            },
            {
                "name": "Runtime Zod Schema Validation",
                "pattern": "z.discriminatedUnion('kind', [...]) & z.infer<typeof WorkflowSchema>",
                "purpose": "Single source of truth: TypeScript types automatically derive from validated Zod schemas at runtime boundaries.",
                "implemented_in": "src/schemas/workflow.schema.ts"
            }
        ]
    }
