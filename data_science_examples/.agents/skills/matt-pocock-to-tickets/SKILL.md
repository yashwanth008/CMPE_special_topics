---
name: matt-pocock-to-tickets
description: Decomposes technical specifications into tracer-bullet, independently verifiable engineering tickets. Use after creating a technical specification before implementation begins.
---

# Matt Pocock To-Tickets Skill: Tracer-Bullet Ticket Decomposition

Breaks down specifications into sequential, vertical tracer-bullet tickets where each ticket is independently testable.

---

## 1. Ticket Decomposition Rules

1. **Vertical Slices (Tracer Bullets)**: Prefer end-to-end vertical slices (DB -> API -> UI) over horizontal layers.
2. **Acceptance Criteria**: Every ticket must have clear, automated acceptance criteria (unit/integration test).
3. **Dependency Ordering**: Order tickets so each ticket builds upon green tests from the prior ticket.
