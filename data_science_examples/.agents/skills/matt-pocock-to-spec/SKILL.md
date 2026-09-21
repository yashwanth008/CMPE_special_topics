---
name: matt-pocock-to-spec
description: Synthesizes requirements, edge cases, and design discussions into formal, type-driven technical specifications. Use when transitioning from requirements gathering to architecture.
---

# Matt Pocock To-Spec Skill: Formal Technical Specifications

This skill converts requirements and design discussions into a complete, type-first technical specification document.

---

## 1. Specification Template

Every spec must contain:
1. **Executive Summary & Scope**: What problem is being solved, non-goals, and boundary constraints.
2. **Domain Type Definitions (TypeScript / Zod)**:
   ```typescript
   export const UserSchema = z.object({
     id: z.string().uuid(),
     role: z.enum(['admin', 'member', 'guest']),
     metadata: z.record(z.unknown())
   });
   export type User = z.infer<typeof UserSchema>;
   ```
3. **Data Flow & State Machine**: Sequence of state transitions with state machine diagram.
4. **API Interface & RPC Signatures**: Strict input/output contracts.
5. **Failure & Error Matrices**: Catalog of error codes, HTTP statuses, and recovery paths.
