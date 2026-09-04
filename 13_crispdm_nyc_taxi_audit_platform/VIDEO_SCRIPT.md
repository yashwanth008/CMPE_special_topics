# VIDEO_SCRIPT.md — NYC TLC Mobility & Dynamic Surge Pricing Intelligence Platform (Project 13)

**Runtime target:** ~3 minutes

---

Alright, this one's the big one in the series — Project 13, the NYC TLC Mobility and Dynamic Surge Pricing Intelligence Platform. If the earlier projects were demos, this one is built to feel like something you'd actually hand to an enterprise data science audit committee.

Here's the prompt that kicked it off: "implement a new project with following CRISP-DM methodology and engaging all the data science skills I have installed." That's it — deliberately broad, and the agent ran with it, building out a full six-phase CRISP-DM lifecycle around synthetic NYC Taxi and Limousine Commission trip data, with dynamic surge pricing as the business problem.

Let's start on the live side of the app — the NYC TLC Multi-Task Ride Estimator. This is the public-facing tool: I pick a preset route, say Times Square to JFK, or drag the sliders for hour of day, precipitation, and passenger count. Every change fires a live prediction against a FastAPI backend running on port 8013, and you get three things back instantly — a predicted gross fare, a high-tip propensity score, and an estimated carbon footprint for the trip. Below that is a local TreeSHAP waterfall — so instead of a black box number, you see exactly which features pushed the fare up or down: trip distance, the JFK flat-rate code, congestion surcharge, all itemized in dollars.

Now flip over to the admin side — this is the Data Science and Code Auditor Portal, and it's got eight sub-tabs. There's a full ten-page CRISP-DM paper dossier with the actual math typeset in KaTeX. There's an EDA and data quality scorecard grading the dataset A-plus at 99.85% completeness. There's a geospatial clustering view with six mobility hotspot centroids you can click through on an SVG map of the boroughs. There's an AutoResearch tournament comparing seven model architectures — Histogram Gradient Boosting comes out on top with a $1.48 RMSE. There's a code auditor workbench, and there's an MLOps console with live population stability index drift monitoring and a concurrency load tester you can actually fire off and watch complete in real time.

The architecture highlight I want to call out: the backend cleanly separates its business logic into a `core/` module — clustering, audit, autoresearch, mlops, explainability — and the `server/` just wires FastAPI on top of it. That separation is exactly what you want for a real audit trail: the modeling logic isn't tangled up in the web layer, so a reviewer can trace every claim on the dashboard straight back to a specific, isolated Python module.

For my creative addition, I added a session scenario comparison ticker to the ride estimator. Every time you tweak a slider and get a new fare prediction, it now keeps a rolling log of your last six scenarios as little horizontal bars, so you can visually compare how a rainy Tuesday morning JFK run stacks up against a dry evening Brooklyn crosstown — all without leaving the page or writing anything down.

That's Project 13 — probably the most enterprise-grade thing in this whole portfolio. If you're studying how to structure a real CRISP-DM project end to end, this is the one to bookmark. Catch you in the next video.
