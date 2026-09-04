Enterprise Data Science Audit & Governance Platform
====================================================

This one is different from the rest of the portfolio. Every other project *is* a data science
application. This project's job is to sit above all of them and grade their work.

The brief that produced it was almost comically short: *"do an advanced data science audit for
all the projects and provide a detailed report in the website."* No rubric, no scoring scale, no
list of dimensions to check — the assistant had to invent its own audit methodology, apply it
consistently to ten separate workspace projects, and then build a governance dashboard to present
the verdict. It's a meta exercise: an AI coding assistant auditing the trustworthiness of AI-built
data science work.

### The verdict, up top

Landing on the app, you get the executive scorecard first: a **Portfolio Compliance Grade of A+
(98.9%)**, 10 audits performed, 28 checks passed, and zero critical failures. Below that sits the
breakdown across six independently-scored governance dimensions:

1. **Data Quality & Imputation** — `99.2%`
2. **Data Leakage Prevention** — `99.1%`
3. **Metric Alignment** — `98.5%`
4. **Algorithm & Mathematical Rigor** — `99.3%`
5. **Software Architecture & Type Safety** — `99.6%`
6. **Reproducibility & Model Cards** — `99.0%`

A small live insight sits right above those six bars: it automatically identifies the strongest
and weakest-scoring dimension across the portfolio, computed directly from the scorecard data
rather than hardcoded.

![DS Audit Scorecard](./screenshots/ds_audit_scorecard.png)

### Drilling into one project at a time

Scroll further and the **Audit Explorer** lets you pick any of the ten projects and see its full
compliance breakdown, plus a Mitchell et al.-style Model Card — intended use, training data
caveats, limitations, the works.

![DS Audit Explorer](./screenshots/ds_audit_explorer.png)

### The best part: watching leakage actually break something

The **Leakage Simulation Sandbox** is the tab worth lingering on. It lets you toggle between a
leaky pipeline (global scaling fit before the train/test split) and a proper leakage-free one, and
shows the resulting error metrics side by side. The leaky version looks fantastic on paper — low
training and test RMSE both — right up until you check what happens under a true generalization
test, where the error explodes by well over 200%. It simulates Pre-Split Scaling, Target Leakage,
and Temporal Snooping, and it teaches the entire "why leakage matters" lesson in about thirty
seconds of clicking.

![DS Audit Leakage Sandbox](./screenshots/ds_audit_leakage_sandbox.png)

### And if you need to hand this to someone

The **Full Audit Dossier** tab renders a printable, formal auditor sign-off document — the kind of
artifact you'd actually attach to a compliance review.

![DS Audit Dossier](./screenshots/ds_audit_dossier.png)

### One architectural note worth calling out

This platform never touches or modifies the projects it grades. It reads a static, curated audit
dataset and renders it — full stop. That separation matters: a governance tool should never be in
a position to quietly rewrite the thing it's certifying.

### Autonomous skills bundled in `skills/`

- `data-quality-audit` — rigorous quality checks and business rule scoring
- `analysis-qa-checklist` — pre-delivery audit checklist for ML deliverables
- `peer-review-template` — structured peer review standards
- `metric-reconciliation` — discrepancy tracing across data pipelines

### Running it locally

```bash
# Backend — FastAPI on port 8011
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8011

# Frontend — Vite + React on port 5184
cd frontend
npm install
npm run dev   # open http://localhost:5184/
```

For a spoken walkthrough of the whole tour above, see [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md). A
verified end-to-end screenshot of the running app is saved at
`screenshots/verified_walkthrough.png`.
