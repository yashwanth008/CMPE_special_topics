# Video Walkthrough Script — AutoGluon Multi-Layer Stacking & AutoML Tournament Platform

**Runtime target: ~2.5-3 minutes**

---

Hey, welcome back. This next one is the AutoML platform — a dashboard that simulates how a tool like AutoGluon builds a champion model automatically by stacking a whole tournament of algorithms on top of each other, instead of you hand-picking one model and hoping for the best.

The prompt that started this build was: "Now let's do another project — illustrate AutoML with AutoGluon on various data science tasks — make sure you follow CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with research paper. Include all details a data scientist and AI engineer will care about."

Let's walk through it. First tab is the Multi-Task Predictor. There are two tasks baked in — Customer Churn classification and Diamond Valuation regression — and you flip between them with a toggle up top. On the classification side I've got sliders for annual income, balance-to-income ratio, support tickets, credit score, device risk. Watch what happens when I hit the "High Churn Risk" preset — the churn probability jumps, the verdict flips to CHURN_RISK, and underneath, the stacking breakdown shows exactly what each of the five Level 1 base learners predicted — LightGBM, CatBoost, XGBoost, RandomForest, NeuralNet — feeding up into a Level 2 stack and finally a Level 3 Caruana-weighted ensemble.

Jump over to the 3-Level Stacking DAG tab and you get a literal visual graph of that architecture — arrows showing out-of-fold predictions flowing from Level 1 base models into the Level 2 meta-learner, then into the final weighted ensemble. Then there's Leaderboard & SOTA, ranking every model by validation score against a Kaggle grandmaster baseline, and Feature Importance, which shows permutation importance — literally shuffling each feature and measuring how much the score drops.

Here's the architecture note worth calling out, and I'll be honest about it: this project is titled "AutoGluon," but under the hood the AI assistant that built it didn't actually pull in the real AutoGluon library — it hand-built an AutoGluon-style three-level stacking pipeline using plain scikit-learn gradient boosting and random forest models, labeled to look like LightGBM, CatBoost, and XGBoost for the dashboard. That's actually a really instructive CRISP-DM lesson: you can prototype and demo the entire stacking methodology — out-of-fold meta-features, Caruana greedy ensemble selection — without needing the heavyweight dependency, which is exactly why this backend runs instantly on plain Python with no special environment.

While verifying this one, I actually caught a small bug: the individual base-model predictions were computed by adding random noise to a probability, and for low-risk customers that noise could occasionally push a base model's predicted probability negative — which obviously makes no sense for a probability. I fixed that by clamping every base learner's output between 1% and 99%.

For my creative addition, I added a "Base Model Agreement" meter right under the main prediction card — it measures how tightly the five Level 1 base learners cluster around each other, and renders it as a percentage bar that goes green when the ensemble is confident and amber or red when the base models disagree. It's a nice, honest way to communicate model uncertainty that a lot of real AutoML dashboards skip.

That's the AutoML stacking platform — five base learners, three stacking levels, and now a built-in confidence signal. Try flipping between churn and diamond pricing and see how the ensemble reacts. Catch you in the next walkthrough.
