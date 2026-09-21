---
name: matt-pocock-grill-me
description: Interrogate requirements, expose hidden assumptions, and clarify edge cases before writing code. Use during requirements gathering, architecture planning, and feature design.
---

# Matt Pocock Grill-Me Skill: Requirements Interrogation & Assumption Exposer

This skill implements Matt Pocock's signature `/grill-me` workflow for AI-assisted software engineering.

---

## 1. Core Workflow

1. **Do Not Rush to Code**: When presented with a task, pause and critically examine what is ambiguous, missing, or implicitly assumed.
2. **Expose Hidden Assumptions**:
   - What are the data scale expectations (throughput, latency, payload size)?
   - What are the error modes and fallback behaviors?
   - What is the authentication/authorization and security model?
   - What is the exact state management and persistence lifecycle?
3. **Structured Questions**:
   - Ask precise, focused multiple-choice questions or structured trade-off decisions.
   - Present concrete alternatives with trade-offs rather than open-ended queries.
4. **Sign-off**: Ensure clarity before advancing to `/to-spec`.
