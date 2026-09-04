# VIDEO_SCRIPT.md — FlowForge DAG Engine Walkthrough

**Target length:** ~2.5 minutes

---

Hey everyone, welcome back. Today I want to show you FlowForge — this is a full-stack workflow DAG orchestrator I built to really flex what "textbook" TypeScript architecture looks like when you pair it with a classic computer science algorithm: Kahn's topological sort.

So here's the backstory. The prompt I gave my AI coding assistant was deliberately open-ended: "install Matt Pocock skills and then demonstrate it with a complicated end-to-end full stack project." That's it — one line. Matt Pocock, if you don't know him, is a well-known TypeScript educator, famous for things like branded types, discriminated unions, and exhaustive pattern matching. So the challenge here was: take those advanced type-safety patterns and actually prove them out in a real, runnable application instead of just a toy code snippet.

Let me give you the tour. When the app loads, you're dropped straight into the DAG Canvas — that's this default "Cloud Incident Response" workflow: a log ingestion trigger, a robust-scaler transform node, an isolation forest anomaly model, a severity condition branch, and a remediation action. Each node card is color-coded by its kind — trigger, transform, inference, condition, action, join — and if you look closely at each card, you'll notice a little "L0", "L1", "L2" badge. That's actually my own addition: I added live client-side computation of each node's topological concurrency level, straight from Kahn's algorithm, so you can visually see at a glance which nodes are independent and could run in parallel versus which ones are strictly sequential dependencies.

Now watch what happens when I hit "Execute DAG" in the top right. The engine walks through a real finite-state machine — idle, to validating, to compiling, to running, to completed — and you can watch that state badge animate live up in the metrics bar. Under the hood, the FastAPI backend is actually running Kahn's in-degree algorithm server-side to detect cycles and compute concurrency stages, then it streams every single state transition and node execution event down to the browser over Server-Sent Events. You can see it play out node by node in the terminal at the bottom — each one logs its simulated latency and a realistic synthetic output payload.

One architecture detail worth calling out: the backend's cycle detection isn't just decorative. If in-degree counts never all reach zero, that means there's a cycle, and the compile step throws a clear error naming exactly which nodes are stuck — that's Kahn's algorithm doing real work, not just for show.

There's also a TypeScript Lab tab up top if you want to see the actual branded-type and discriminated-union code patterns laid out with explanations, and an Architecture tab documenting the three pillars: cycle detection, concurrency staging, and the SSE event bus.

That's FlowForge — Kahn's algorithm, strict TypeScript discipline, and a live SSE execution stream, all wired together in one demo. Thanks for watching, and I'll see you in the next one.
