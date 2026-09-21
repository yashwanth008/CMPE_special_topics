# FlowForge Implementation Tickets
*Vertical Tracer-Bullet Decomposition as per Matt Pocock Skills Workflow*

## Ticket FF-01: Core Types, Branded Types & Exhaustive Helpers
- **Goal**: Implement `src/types/domain.ts`, `src/utils/assertNever.ts`, and `src/utils/result.ts`.
- **Criteria**: Complete nominal branding for `WorkflowId`, `NodeId`, `RunId`; discriminated unions for all 6 node kinds; generic `Result<T, E>` monad.

## Ticket FF-02: Runtime Zod Boundary Validation
- **Goal**: Implement `src/schemas/workflow.schema.ts`.
- **Criteria**: Validates JSON templates at network boundaries; exports inferred types identical to domain interfaces.

## Ticket FF-03: Finite State Machine Implementation
- **Goal**: Implement `src/machines/workflowMachine.ts`.
- **Criteria**: Pure deterministic state transition function with invariant enforcement.

## Ticket FF-04: FastAPI Server & SSE Execution Stream
- **Goal**: Build `backend/main.py` with Kahn's cycle detection and SSE event generator.
- **Criteria**: Validates acyclicity, yields concurrent stage events, returns latency metrics on Port 8009.

## Ticket FF-05: React 18 Canvas, Inspector & Live Terminal
- **Goal**: Build interactive SVG graph canvas, type-narrowed node inspector, live execution terminal, and Matt Pocock skills matrix.
- **Criteria**: 60fps animations, real-time node state badges, interactive state machine visualizer.

## Ticket FF-06: Verification & Automated Test Suite
- **Goal**: Run unit tests on Zod schemas, state transitions, branded types, and Kahn's algorithm.
- **Criteria**: All test assertions pass with 100% code coverage on domain core.
