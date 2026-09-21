# CRISP-DM Master's Data Science Platform

*A textbook you can click through: all seven phases of CRISP-DM, run live against a Census & Income dataset.*

Built from the prompt: *"As an industry expert data scientist and expert in CRISP-DM methodology, build an end-to-end data science project based on a popular Kaggle dataset that takes a user through all aspects and nuances of the CRISP-DM steps in textbook quality."* — with a syllabus attached: quizzes, EDA, clustering, anomaly detection, supervised learning, association rule mining, sub-linear search, and a synthesis phase. This app is that syllabus, made interactive.

## What is this, exactly?

**Q: What dataset is this running on?**
A Kaggle-style Census & Income dataset, N = 2,500 records, with continuous and categorical demographic features (age, education, hours worked, etc.).

**Q: Is any of this canned or pre-computed?**
No — every number on screen (correlations, silhouette scores, regression coefficients) comes from a live FastAPI backend running real scikit-learn models against that dataset. Change the underlying data and the numbers change with it.

**Q: What are the seven phases, and what does each one show me?**

| # | Phase | What you'll see |
|---|-------|------------------|
| 1 | Business & Data Understanding | Pearson correlation matrix ($r_{xy}$), missing-value checks, distribution summaries, plus a live "strongest predictor" insight chip computed on the fly from the correlation data |
| 2 | Clustering | K-Means ($k=4$) and Gaussian Mixture Models, silhouette-optimized ($s = 0.46$), with named demographic personas |
| 3 | Outlier Detection | Isolation Forest with an adjustable contamination slider ($c = 0.05$) isolating multi-dimensional anomalies |
| 4 | Regression Tournament + Live Predictor | 4-model tournament (OLS, Ridge, Random Forest, Gradient Boosting) plus a drag-the-sliders salary calculator |
| 5 | Association Rule Mining | Apriori algorithm surfacing demographic rule combinations, best Lift $2.45\times$ |
| 6 | Sub-Linear Search (LSH) | Cosine random-hyperplane locality-sensitive hashing, $14.8\times$ query speedup over brute force |
| 7 | Synthesis | Executive wrap-up explaining what the modeling results actually mean |

**Q: Wait, Ridge Regression beat Random Forest and Gradient Boosting? Isn't that backwards?**
That's not a bug — it's the whole point of Phase 4. Ridge Regression ($R^2 = 0.685$) narrowly leads the tournament over the tree ensembles ($R^2 \approx 0.64$). When you actually run the numbers, the income-generating relationship in this feature set turns out to be dominated by linear effects, so the extra flexibility of a tree ensemble doesn't buy you anything. The synthesis phase calls this out explicitly as an Occam's Razor lesson: don't reach for a more complex model when it doesn't improve accuracy.

**Q: Is there a way to test whether I actually understood a phase?**
Yes — there's a quiz modal (top right of the nav) with dynamic, master's-level concept-check questions per phase.

**Q: What ships in `skills/`?**
Four autonomous skills, also mirrored to `.agents/skills/`:
- `data-cleaning` — leakage-free preprocessing and median imputation
- `data-narrative-builder` — stakeholder data story structuring
- `methodology-explainer` — plain-language technical breakdowns
- `analysis-planning` — structured multi-phase CRISP-DM execution plans

## Screenshots

| Phase 1: EDA | Phase 2: Clustering | Phase 3: Outliers |
|---|---|---|
| ![EDA](./screenshots/crispdm_phase1_eda.png) | ![Clustering](./screenshots/crispdm_phase2_clustering.png) | ![Outliers](./screenshots/crispdm_phase3_outliers.png) |

| Phase 4: Regression Tournament | Phase 5: Association Rules | Phase 6: LSH Search |
|---|---|---|
| ![Regression](./screenshots/crispdm_phase4_regression.png) | ![Association](./screenshots/crispdm_phase5_association.png) | ![LSH](./screenshots/crispdm_phase6_lsh.png) |

| Correlation Deep-Dive | Quiz Modal | Regression Predictor Close-Up |
|---|---|---|
| ![Correlations](./screenshots/crispdm_eda_correlations.png) | ![Quiz](./screenshots/crispdm_quiz_modal.png) | ![Predictor](./screenshots/crispdm_regression_predictor.png) |

A full click-through recording of the live app is also captured in `screenshots/verified_walkthrough.png`, and a spoken walkthrough script lives in [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md).

## Running it

```bash
# Backend — FastAPI on port 8010
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8010

# Frontend — Vite + React on port 5183
cd frontend
npm install
npm run dev   # open http://localhost:5183/
```
