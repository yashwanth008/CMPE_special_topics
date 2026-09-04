# VIDEO_SCRIPT.md — Enterprise Data Science Audit & Governance Platform Walkthrough

**Target length:** ~2.5 minutes

---

Hey everyone. This project is a bit different from the others in this series — instead of building a new data science app, I built an auditor. This one's job is to go back and grade every other project in the portfolio.

The prompt was refreshingly short: "do an advanced data science audit for all the projects and provide a detailed report in the website." So the assistant had to design its own audit rubric, apply it consistently across ten different projects, and then build a governance dashboard to present the findings — which is honestly a pretty meta exercise for an AI coding assistant to pull off.

Let's take the tour. You land on the Executive Scorecard — a Portfolio Compliance Grade of A+ at 98.9%, ten total audits, twenty-eight passed checks, zero critical failures. Below that is the six-dimension governance scorecard: data quality and imputation, leakage prevention, metric alignment, algorithm and mathematical rigor, software architecture, and reproducibility — each one scored independently. And right above those six bars, I added a small live insight: it automatically calls out which dimension is currently strongest across the portfolio and which one needs the most attention, computed directly from the scorecard data instead of being a hardcoded label.

Scroll down and you get the full project-by-project table — every single workspace project, its category, its score, its grade, and the ports it runs on — and you can click "View Deep Audit" to jump into a full compliance breakdown with a Mitchell et al.-style model card for that specific project.

Now flip over to the Leakage Sandbox tab — this is my favorite part. It's an interactive simulator that lets you toggle between a leaky global-scaling pipeline and a proper leakage-free pipeline, and it shows you side by side what happens to your error metrics. The leaky version looks great on paper — low training and test RMSE — but the moment you check what happens in production, the error explodes by over two hundred percent. That's the entire "data leakage" lesson taught in thirty seconds of clicking.

One thing worth calling out architecturally: this audit platform doesn't touch or modify any of the other ten projects it's grading — it just reads a static, curated audit dataset and renders it. That separation is exactly right for a governance tool: the auditor should never be able to quietly rewrite the thing it's auditing.

Last tab is the Full Audit Dossier — a printable, formal sign-off document if you need to hand this to a compliance reviewer.

That's the Enterprise Data Science Audit Platform — a governance layer sitting on top of the rest of this whole portfolio. Thanks for watching, and I'll catch you in the next one.
