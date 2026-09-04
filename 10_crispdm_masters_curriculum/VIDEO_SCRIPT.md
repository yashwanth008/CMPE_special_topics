# VIDEO_SCRIPT.md — CRISP-DM Master's Data Science Platform Walkthrough

**Target length:** ~3 minutes

---

Hey everyone. This one's a big one — I built a full master's-degree-level data science curriculum as an interactive web app, walking through all seven phases of CRISP-DM on a synthetic Census & Income dataset. Think of it as a textbook you can click through.

Here's the prompt I actually gave the AI assistant: "As an industry expert data scientist and expert in CRISP-DM methodology for data science projects, build an end-to-end data science project based on a popular Kaggle dataset that takes a user through all aspects and nuances of the CRISP-DM steps in textbook quality." And then I listed out exactly what had to be covered — quizzes, EDA, clustering, anomaly detection, supervised learning, association rule mining, sub-linear search with LSH, and a clean synthesis phase. That's basically a syllabus, and the app follows it phase by phase.

Let me walk you through it. Up top there's a navbar with seven phases plus a "Chapter Quizzes" button. Phase 1 is Business and Data Understanding — you get real summary statistics computed live from a 2,500-record income dataset, plus a full Pearson correlation matrix. And right above that matrix now, I added a little insight chip that's actually computed on the fly — it tells you the single strongest live predictor of income directly from the correlation data, no hardcoding, so if the underlying data ever changes, that callout updates with it.

Phase 2 is clustering — K-Means, GMM, hierarchical, your choice — with silhouette scores and named demographic personas. Phase 3 runs Isolation Forest anomaly detection with an adjustable contamination slider. Phase 4 is the fun one: a four-model regression tournament — OLS, Ridge, Random Forest, Gradient Boosting — plus a live salary calculator you can play with by dragging age, education, and hours sliders.

Now here's an interesting wrinkle, and I want to be upfront about it because it's a good CRISP-DM lesson in itself. When I actually ran the live benchmark numbers, Ridge Regression narrowly beat the tree ensembles — because the underlying income-generating relationship in the visible features turns out to be dominated by linear effects, so the extra flexibility of Random Forest and Gradient Boosting didn't pay off on this feature set. Rather than paper over that, I updated the synthesis phase to actually explain it — it's a genuine textbook moment about Occam's Razor: don't reach for a more complex model if it doesn't buy you real accuracy.

Phase 5 does Apriori association rule mining over demographic attributes, Phase 6 does locality-sensitive hashing for sub-linear nearest-neighbor search — that's the "find me similar people" feature — and Phase 7 wraps it all up in an executive synthesis report. There's also a quiz modal in the top right if you want to test your own understanding of each concept as you go.

Architecture-wise, worth calling out: this is a genuinely full CRISP-DM lifecycle implementation, not a slideshow — every phase's numbers come from a live FastAPI backend running real scikit-learn models against the same underlying dataset, so the whole app is internally consistent and reproducible.

That's the CRISP-DM Master's Platform. If you're trying to actually learn the methodology instead of just reading about it, this is basically a hands-on lab for it. See you next time.
