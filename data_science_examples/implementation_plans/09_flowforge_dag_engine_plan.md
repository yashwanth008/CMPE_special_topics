# 📋 Implementation Plan — Project 09: FlowForge Dynamic DAG Orchestrator (`09_flowforge_dag_engine`)

## 1. Executive Summary & Problem Formulation
Complex full-stack DAG workflow execution engine implementing **Matt Pocock Total TypeScript Architectural Patterns** (Discriminated Unions, Branded Types, Generic Type Narrowing, Zod Schema Validation, and Template Literal Types). Provides topological sort execution (Kahn's algorithm), cycle detection, and live step state streaming.

## 2. Technical Architecture & Tech Stack
* **Backend**: Express + TypeScript + SSE Streaming (`server/`, Port 8009).
* **Frontend**: React 18 + Vite + TypeScript + SVG Interactive DAG Canvas (`client/`, Port 5182).
* **Matt Pocock Patterns**: Zod runtime schema inference, branded `NodeId` / `EdgeId`, discriminated union state machines.

## 3. Mathematical Formulations & Graph Algorithms
* **Topological Sort (Kahn's Algorithm)**:
  $$L \leftarrow \emptyset, \quad S \leftarrow \{ u \in V \mid \text{in-degree}(u) = 0 \}$$
  $$\text{while } S \neq \emptyset \text{ do: remove } u \text{ from } S, \text{ append to } L; \forall (u, v) \in E \text{ decrement in-degree}(v)$$
* **Cycle Detection**: If $|L| \neq |V|$, graph contains cyclic dependency (Error thrown).

## 4. Step-by-Step Execution Checklist
- [x] **Type System**: Authored comprehensive `types.ts` with Discriminated Unions for `StepExecutionState`.
- [x] **DAG Engine**: Implemented topological sorting, parallel branch execution, and step dependency resolution.
- [x] **Interactive Canvas**: Built visual node graph with execution status indicators and live output logs.
- [x] **Documentation**: Authored design doc and technical specification.

## 5. Verification & Acceptance Criteria
* `curl http://127.0.0.1:8009/api/dag/validate` validates DAG topology and flags cycles with 100% accuracy.
