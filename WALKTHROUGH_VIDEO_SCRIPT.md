# 🎬 Master Video Walkthrough Script — Full Portfolio (Projects 00–15)

This is a consolidated, read-through script for recording a single narrated YouTube walkthrough (or a 16-part series) covering every project in this repository. Each section below was written after actually running that project end-to-end, fixing any real bugs found, and adding a small creative enhancement — so the narration reflects the app as it verifiably works today, not just as originally built.

**How to use this doc:** record screen + voice per project section, in order, following the "what to click / what to say" beats. Total runtime across all 16 sections is roughly 40–45 minutes if recorded back-to-back, or split into 16 short-form videos of ~2–3 minutes each.

Once you've recorded and uploaded, drop the link(s) into the **🎬 Video Walkthrough** section of the root [README.md](./README.md).

---

## [`00_dynamic_todo_workspace`](./00_dynamic_todo_workspace)


**Runtime target: ~2.5 minutes**

---

Hey everyone, welcome back. Today I'm walking you through Zenith Task — a fullstack dynamic todo workspace that I got an AI coding assistant to build completely from scratch, front to back, in one sitting.

The original prompt I gave it was almost stupidly simple. I just said: "in a directory fullstack-test - build a modern end2end dynamic todo list application industry best experience of ux and nice features - make reasonable assumptions." That's it. No spec, no wireframes. I told it to make reasonable assumptions and just ran with whatever it decided a "best in class" todo app should look like. I did follow up a couple times afterward — I asked it to write a design doc to explain its choices, and I had it test the frontend with the Chrome DevTools extension to sanity-check itself.

So let's look at what it actually built. This is a React and Vite frontend talking to an Express backend over a real SQLite database, with Server-Sent Events for live updates — so if you had two browser tabs open, changes in one would push to the other instantly.

Let me show you the quick-add bar at the top. This is the fun part — it's got a natural language parser built in. Watch what happens when I type something like "Ship walkthrough video, high priority, hashtag launch, twenty minutes." I can just type the shorthand — bang-high for priority, hash-launch for a tag, tilde-20-m for a time estimate — and it parses all of that live as I type, showing me little recognized token pills, then creates a fully-structured task when I hit Add.

Now let's flip through the views. There's a List view with smart date-bucketing — overdue, today, upcoming. There's a Kanban board with drag and drop across four stages. There's an Eisenhower decision matrix for urgency versus importance. A calendar timeline you can click to schedule against. And a Pomodoro focus timer with actual synthesized audio chimes when a session ends — no external sound files, it's generating the tones with the Web Audio API oscillator.

One architecture detail worth calling out: the natural language parsing happens entirely client-side and sends clean structured fields to the API — title, priority, due date, tags — rather than shipping raw text to the server to interpret. That's a nice separation of concerns, and it's also exactly where I found a real bug while auditing this project: the backend was treating incoming tag values as if they were already database IDs, so typing any brand-new hashtag in the quick-add bar — anything that wasn't one of the five seeded tags — would throw a foreign key constraint error and silently kill the whole task creation request. I fixed it by adding a proper find-or-create resolver on the server so new tags typed on the fly get created and linked correctly, which is actually the whole point of a natural language tagging feature.

For my creative addition, I added an Overdue Tasks metric card to the Analytics dashboard. The backend was already computing that number, it just wasn't surfaced anywhere in the UI — and for a productivity app, knowing at a glance how many things are actively slipping past their due date felt like the most useful missing signal, right up there next to completion velocity and streaks.

That's Zenith Task — a genuinely full-featured, glassmorphic todo app that an AI assistant built from a single loose sentence of a prompt. If you want to see how the other projects in this series turned out, stick around, there's a lot more coming.

---

## [`01_nyc_taxi_trip_prediction`](./01_nyc_taxi_trip_prediction)


**Runtime target: ~3 minutes**

---

Alright, this one's my favorite in the series. This is a full end-to-end machine learning product built on the classic Kaggle NYC Taxi Trip Duration challenge — and it's not just a model in a notebook, it's a real deployed API with an interactive map front end.

Here's the prompt that kicked it off: "Now on to another project - You will do end2end a data science project of including data, training, deployment, crisp-dm framework, and an awesome front end. you can use Kaggle NYC taxi challenge. make sure that frontend includes interactive map and trip estimation." I followed up twice after that — once asking for a beefier admin dashboard with more data-scientist-level detail, and once asking it to prepare a full CRISP-DM research report and match the dashboard numbers to that report.

So let's take the tour. This is the Fare and Trip Estimator screen. I pick a pickup landmark — let's say Times Square — and a dropoff — JFK Airport — set a passenger count and pickup time, and instantly, on the right, you get a live animated route line across an SVG map of the five boroughs, and on the left a full prediction: trip duration, a ninety-five percent confidence interval, and a fare breakdown all the way down to base fare, distance rate, time rate, airport surcharge, overnight surcharge, and the NYC congestion fee — and now it also shows a running total line so the math actually adds up in front of you, which is the fix I'll get to in a second.

Flipping over to the Data Science Admin tab is where this project really shows its teeth. There's a full benchmark matrix comparing the production XGBoost model against a simulated Kaggle-grandmaster-tier ensemble baseline, an AutoResearch hill-climbing tab that logs an automated search over model backbones and hyperparameters, and a deep-dive tab with residual diagnostics, segment-level error breakdowns by trip distance, and feature correlation tables. There's even a one-click Retrain Model button that kicks off a fresh XGBoost training run against a synthetic NYC-shaped dataset and hot-swaps the deployed model.

The architecture highlight I want to call out: this is a genuinely production-shaped ML service. The FastAPI backend loads a serialized XGBoost model at startup, and every prediction request runs through the exact same feature engineering pipeline used at training time — haversine and Manhattan-grid distance, compass bearing, cyclical time features, and proximity-to-hub features for JFK, LaGuardia, Newark, and Manhattan landmarks — so there's no train-serve skew. That's the kind of detail that separates a toy demo from something you could actually ship.

While auditing this one I found a real bug in the fare breakdown card: the backend was correctly computing a congestion fee and an overnight surcharge on every single fare, but the frontend was never displaying those two line items — so if you added up what was on screen, you'd get a number smaller than the total shown, which just looks broken to anyone glancing at it. I added both missing line items plus an explicit running total row, so now every dollar in the total fare is accounted for on screen.

That's the NYC Taxi platform — Kaggle challenge data, real spatial feature engineering, an XGBoost model that beats a respectable RMSLE, and a genuinely research-grade admin dashboard sitting behind an interactive map. On to the next one.

---

## [`02_nano_llm_transformer`](./02_nano_llm_transformer)


**Runtime target: ~3 minutes**

---

Okay, this project has a history, and I want to be honest about it on camera, because I think the debugging story is actually more interesting than if it had just worked perfectly the first time.

The original ask was: "build a simple llm and chatbot with state of the art primitives but fit in my laptop gpu, follow CRISP-DM, and include a nice data science admin dashboard." So what got built is NanoLlama — a from-scratch PyTorch transformer with Rotary Position Embeddings, SwiGLU gated activations, RMSNorm, and KV-cache generation, fine-tuned on a small hand-written knowledge base of AI research, coding, and math Q&A. But the follow-up prompts tell the real story: "what is nanollama trained on, it is not looking good," then "nano llama is still giving garbage output, do a clean audit and fix bugs," and finally "why is nano llm transformer not working, try it with Playwright, it's giving corrupt data." Three separate rounds of "this is broken." So when I picked this project up, my job was to actually find out why, not just take the existing fixes at face value.

Here's what I found. There were genuinely two separate bugs stacked on top of each other. The first: this model is only 505,000 parameters, trained purely by supervised fine-tuning on about forty memorized question templates, with no open-domain pretraining — so training loss gets driven essentially to zero. When I forced it to generate on a genuinely novel, out-of-vocabulary prompt, it produced real character-soup garbage, and it did so *confidently* — the softmax was totally saturated from the overfitting, so confidence-based safety checks don't work here at all. I fixed that by checking generated text against the model's own training vocabulary after generation, and if too much of it isn't real trained words, the model now abstains gracefully instead of showing corrupted text.

But here's the twist — that wasn't the whole story. When I actually drove the chat interface through a real browser instead of just hitting the API with curl, I found a second, much sneakier bug: even a perfectly correct, clean answer from the backend was rendering on screen as scrambled, duplicated text — things like "2 2 ++ 22 == 44" instead of "2 + 2 = 4." That one lives entirely in the React frontend. It turns out React Strict Mode — which is on by default in development — intentionally double-invokes state updater functions to catch exactly this class of bug, and the streaming chat handler was mutating the previous message object in place instead of creating a new one. So every single streamed character was getting appended twice. I rewrote it to build a fresh message object on every update. I'd bet this frontend bug is a big part of what those "corrupt data" complaints were actually seeing.

While I was in there, I also found the Training and Loss dashboard tab was quietly showing hardcoded fake numbers — 672K parameters, a 0.89 loss — because it was reading a field the API doesn't actually return. Fixed the field mapping, and now it shows the real 505,728 parameters and the real per-epoch loss curve pulled straight from training telemetry.

The architecture highlight worth calling out: this thing implements real modern LLM primitives from scratch — you can watch the multi-head attention heatmaps light up per layer in the Attention tab, and inspect exactly how the custom tokenizer breaks text into IDs in the Tokenizer Studio.

For my creative addition, I surfaced the new abstention logic directly in the chat UI — when the model catches itself about to say something incoherent, you'll now see an amber "Out-of-Distribution — Abstained" badge right on that message, so the demo is honest about what a tiny memorization-scale model can and can't do, instead of pretending it's bigger than it is.

That's NanoLlama — a real transformer built from scratch, a real debugging story, and now, actually working the way it was supposed to the whole time.

---

## [`03_customer_segmentation_clustering`](./03_customer_segmentation_clustering)


**Runtime target: ~2.5 minutes**

---

Hey everyone, welcome back. Today I'm walking you through a project I built called the Customer Intelligence & Segmentation Platform — it's an unsupervised machine learning app that takes ten thousand anonymous retail customers and automatically discovers five natural behavioral personas, without ever being told what those personas should look like.

So here's the origin story. The exact prompt I gave my AI coding assistant was: "Now let's do another project — clustering using a popular Kaggle dataset — make sure you follow the CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with the research paper. Include all the details a data scientist and AI engineer will care about." That one paragraph is basically the whole spec — CRISP-DM rigor, an admin dashboard, and an autonomous hill-climbing research loop. Everything you're about to see grew out of that.

Let's actually tour it. I'm on the Customer Segment Explorer tab. At the top you've got a banner framing this as a Kaggle benchmark challenge — it tells you the SOTA silhouette baseline was 0.385, and our AutoResearch hill-climber pushed it to 0.418, a 21% gain, landing on k=5 as the optimal cluster count. Below that are five persona cards — VIP Champions, Prudent Affluents, Young Trendsetters, Bargain Hunters, and Mainstream Loyalists — each with live population counts and average income and spend. Click any card and it filters the scatter plot on the left down to just that cluster.

That scatter plot is a real 2D PCA projection of all ten thousand customers, and I can toggle over to t-SNE for a non-linear view of the same manifold — watch how the cluster separation reshapes. Hovering over any dot pops up that customer's actual attributes.

On the right is the fun part — a live predictor. I can drag sliders for age, income, spending score, recency, annual spend, and web visits, hit "Classify & Recommend Strategy," and the model runs real inference through the trained K-Means pipeline and drops a glowing marker exactly where that hypothetical customer lands on the PCA plot, plus a tailored marketing recommendation.

Architecture-wise, the one thing worth calling out is the AutoResearch hill-climbing loop — it's a CRISP-DM "Evaluation" step turned into an actual autonomous agent. It systematically sweeps distance metrics, scaling transforms, and PCA pre-reduction, logs every trial, and only promotes a new champion model when it beats the current best silhouette score. You can see that full trajectory in the Data Science Admin Console.

For my creative addition this round, I added a confidence gauge ring around the prediction result — a small circular SVG that fills proportionally to the model's cluster assignment confidence — and when a prediction comes back with high confidence, it triggers a tasteful confetti burst in the persona's own color. Small touch, but it makes a strong classification feel like a little win.

That's the tour — an end-to-end unsupervised segmentation platform, from raw customer data to a live, explainable persona predictor. Thanks for watching, and I'll see you in the next one.

---

## [`04_associative_pattern_mining`](./04_associative_pattern_mining)


**Runtime target: ~2.5 minutes**

---

Hey everyone, in this one I'm showing off my Market Basket Intelligence platform — it's a frequent-itemset mining engine that watches ten thousand grocery orders and figures out, on its own, which products get bought together, so it can recommend the next thing to add to your cart in real time.

The build prompt here was almost identical in spirit to my clustering project, just aimed at a different unsupervised problem: "Now let's do another project — associative pattern mining using a popular Kaggle dataset — make sure you follow the CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with the research paper. Include all the details a data scientist and AI engineer will care about." So again — CRISP-DM discipline, an admin dashboard, and an autonomous research loop, this time applied to Apriori, FP-Growth, and ECLAT algorithms on Instacart-style transaction data.

Let's jump into the UI. This is the Basket Recommender tab. At the top, a Kaggle-style benchmark banner shows the grandmaster SOTA mean lift of 4.85 against our AutoResearch-evolved 3.79, and it also lists out the actual math — support, confidence, lift, conviction — right there as reference chips.

Below that is the interactive shopping basket. I've got a couple of quick presets like "Guacamole Fiesta" or I can manually pick products from the catalog dropdown. Right now my basket has Organic Hass Avocados and Fresh Limes. Watch what happens on the right — instantly, six cross-sell recommendations appear, sorted by lift, and the top one is Fresh Organic Cilantro at a 4.48x lift with 86% confidence — that's a genuinely strong association rule, not a random guess. I can click "Add to Cart" right from a recommendation card and it drops straight into my basket, updating the potential GMV uplift number live.

On the right side there's a force-directed 2D association network graph — each node is a catalog product, and each edge represents a mined rule, weighted by lift strength, so you can visually spot which products cluster into shopping "communities."

The architecture highlight worth mentioning: just like the clustering platform, this one has an AutoResearch hill-climbing loop wired into the CRISP-DM Evaluation phase — it sweeps minimum support and confidence thresholds across algorithm variants and only promotes a new rule set when the quality metrics actually improve, and you can watch that whole trajectory in the Data Science Admin tab.

For my creative addition, I added a "Clear Basket" button next to the item count, since previously you could only remove items one at a time — small quality-of-life fix. And more fun — whenever you accept one of the AI's recommended cross-sell items by clicking "Add to Cart," it now fires a little confetti burst in the app's amber-and-emerald colors, celebrating the exact moment a mined association rule turns into a real purchase decision.

That's Market Basket Intelligence — unsupervised pattern discovery turned into a live, explainable recommender. Thanks for watching, catch you in the next walkthrough.

---

## [`05_data_science_skills_lab`](./05_data_science_skills_lab)


**Runtime target: ~2.5-3 minutes**

---

Hey everyone, this one's a bit different from my other builds — it's not a single ML model, it's a whole training ground. I call it the Data Science Skills Mastery Lab, and it packages forty-plus real analytical techniques — everything from exploratory data analysis to A/B test significance testing — into one interactive workbench you can actually click and run against real Kaggle-style benchmark data.

The build prompt was genuinely fun: "install param087 GitHub agent-ml-skills and install nimrodfisher data-analytics-skills and demonstrate every skill on appropriate popular Kaggle dataset, also include CRISP-DM steps in it." So the idea was to take two open-source skill libraries — one focused on ML engineering practices, one on data analytics techniques — and actually wire every single skill up to a live, runnable demo instead of just describing them in text. And there was a great follow-up prompt too, after the first version shipped: "the data science skills mastery lab — when I say execute skill live, it shows an unfriendly raw JSON output on screen, can you make that visual interactive and look like a proper dashboard?" I'll come back to that one, because it's actually the star of this walkthrough.

Let's tour it. I'm on the Skills Catalog tab — a searchable grid of skill cards, each one showing its category, its origin library, a plain-English purpose statement, the actual statistical or mathematical intuition behind it, and a list of common beginner pitfalls, like forgetting to fit your imputer only on the training fold to avoid leakage. You can filter by category — Data Prep, Modeling, Data Quality, Business Analytics — or just search by keyword.

Now watch this — I click "Live Execute Skill" on Exploratory Data Analysis, and instead of some intimidating wall of JSON, I get an actual dashboard: dataset name, sample counts, an accuracy/precision/recall/F1/ROC-AUC metric grid, and a confusion matrix, all laid out as clean stat cards, with a confetti burst to celebrate the run. If I really want the raw payload, there's a "View Raw JSON Telemetry" toggle tucked at the bottom — but it's opt-in now, not the default view.

Beyond the catalog, there are five dedicated Kaggle benchmark tabs — Titanic for classification, House Prices for regression, Credit Card Fraud for imbalanced learning, E-Commerce for cohort and funnel analytics, and a raw Data Quality audit — each one a fully worked CRISP-DM pipeline you can inspect end to end.

On the architecture side, the CRISP-DM Report modal is worth a look — it documents exactly how the platform maps business understanding through deployment across all five benchmarks, including how fraud recall was pushed from 54% to 96% using threshold calibration instead of blindly trusting default 0.5 cutoffs.

For this pass, I actually went back and fixed two real things. First, the header and catalog filters were hardcoded to say "46 Skills" everywhere, but the actual catalog only ships thirteen fully detailed skill cards — so I made every one of those labels read the real count dynamically, no more mismatched numbers. Second, and this is the big one — that "unfriendly raw JSON" complaint from the original follow-up prompt? The fix for it had actually never made it into the code — the execution modal was still dumping raw JSON.stringify output. So I built that friendly dashboard renderer I just showed you — proper stat cards for scalar fields, metric grids for numeric groups, and compact summaries for large arrays, with the raw view still available for the curious.

That's the Skills Mastery Lab — forty-plus techniques, five live Kaggle benchmarks, and now, finally, a results view that actually looks like a dashboard instead of a debugger. Thanks for watching, and I'll see you in the next one.

---

## [`06_anomaly_detection`](./06_anomaly_detection)


**Runtime target: ~2.5-3 minutes**

---

Hey everyone, welcome back. Today I'm walking you through one of my favorite builds in this portfolio: an autonomous anomaly detection and threat intelligence platform for cloud server telemetry. In plain English — this app watches ten different signals coming off a fleet of servers, like CPU load, network throughput, failed logins, and it tells you in real time whether what it's seeing looks normal, or looks like an attack.

Here's the exact prompt I gave my AI coding assistant to kick this off: "Now let's do another project — anomaly detection using popular Kaggle data set and popular methods — make sure you follow CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with research paper. Include all details a data scientist and AI engineer will care about." So the brief was pretty open — go find good methods, be rigorous, and build something that looks like a real ops dashboard.

Let's tour the UI. We land on the Threat Scorer tab, and right away you see ten sliders — request velocity, network throughput, failed auth count, memory pressure, latency, entropy score. These represent a live telemetry snapshot. Up top there's a row of attack archetype buttons — Nominal Steady State, Volumetric DDoS Attack, Credential Stuffing, and Resource Starvation. Watch what happens when I click DDoS — the sliders jump to attack values, and instantly the Ensemble Threat Index on the right spikes from a calm single digit up near 100, the badge flips from NOMINAL to CRITICAL, and below it the root-cause diagnostic literally names the attack pattern it thinks it's looking at. That's the fun part — you can feel the model react live as you drag any single slider.

Now flip over to the 2D Manifold tab — this is a PCA projection squashing all ten dimensions down to two, so you can visually see the cluster of normal traffic and the scattered outliers that don't belong. Then there's Backbones & SOTA, which is a leaderboard comparing five different detection algorithms — Isolation Forest, a hand-rolled deep autoencoder, Local Outlier Factor, One-Class SVM, and Robust Mahalanobis distance — against a published Kaggle top-1% baseline, so you can see exactly how each method stacks up on ROC-AUC and inference latency.

The architecture highlight I want to call out: the CRISP-DM AutoResearch tab. Instead of just training once and calling it done, this project runs an automated hill-climbing loop that iteratively tunes contamination ratios and ensemble weights across five steps, logging each step's ROC-AUC gain, until it lands on a champion ensemble. That's a nice example of baking the "evaluation and deployment" phases of CRISP-DM directly into the product instead of leaving them in a notebook.

For my creative addition, I added a live session threat trend sparkline right inside the threat meter card. As you drag sliders or fire off attack presets, it now draws a rolling mini line chart of your last two dozen threat scores, with a dashed line marking the decision cutoff — so you can literally watch your score walk up toward the threshold and cross into anomaly territory, which makes the real-time nature of this scorer much more visceral.

That's the anomaly detection platform — five algorithms, an autoresearch tuning loop, and a threat scorer you can actually poke at. Go grab the code, spin up the backend and frontend, and try to break it with your own attack values. See you in the next one.

---

## [`07_automl_autogluon`](./07_automl_autogluon)


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

---

## [`08_datascience_visual_mastery`](./08_datascience_visual_mastery)


*A ~2-3 minute spoken narration script for a screen-recorded walkthrough. Read it out loud like you're talking to camera while you click through the app — not a bullet-point outline.*

---

Hey everyone, welcome back. Today I want to show you something I built for anyone who's ever felt like data science math is a wall of Greek letters you just have to memorize. This is an interactive visual textbook that teaches four of the most foundational — and most misunderstood — concepts in machine learning: Naive Bayes, model evaluation metrics, calculus and gradient descent, and backpropagation. And the whole point is that you don't just read about the math, you *play* with it, live, in the browser, and watch the numbers move.

So here's the actual prompt that kicked this whole project off. I asked for something that would "teach beginner data science students in an excellent way with deep intuition and rigorous math and visual intuition and live simulation" on four topics: naive bayes; evaluation of a model — confusion matrix, type one and type two errors, ROC-AUC, cost matrix, and the tradeoff between precision and recall; differential calculus and how derivatives connect to gradient descent; and the chain rule and how it connects to backpropagation. Plus quizzes for every concept, interview prep questions, and a GitHub Pages-ready version of the whole thing. That's a lot to ask for, so let's see how it turned out.

Let me give you the tour. On the left you've got the curriculum sidebar — four modules, each with a read-time estimate and a completion checkmark once you finish it. Up top there's a progress bar tracking your overall mastery percentage, plus quick links to the chapter quiz and the interview flashcard deck. Let's start on Module 1, Probabilistic Classification. The article on the left walks you through *why* naive Bayes even works — the combinatorial explosion problem, then the conditional independence trick that makes it tractable. But look over here on the right: this is a live napkin-Bayes calculator. I can drag these sliders — how likely is the word "free" to show up in spam versus a normal email — and watch the posterior probability recompute in real time. Seventy-four percent spam, updating instantly as I move the sliders. That's the "aha" moment landing through your hands instead of through a textbook paragraph.

Now here's the piece I actually want to highlight, because it's the one I went back and added after the first pass: the Cost-Sensitive Decision Matrix on the Model Evaluation module. So you've already got this threshold slider up top — drag it and watch the confusion matrix cells and precision, recall, and F1 all update live. Great for building intuition on the precision-recall tradeoff. But the original ask specifically called out a "cost matrix," and precision and recall alone don't capture something crucial: in the real world, a false positive and a false negative are almost never equally expensive. So right below that, I added two more sliders — cost per false positive, cost per false negative — and a running "total expected cost" readout that recalculates the moment you touch either slider or the threshold. Watch this: if I crank up the false-negative cost, like you'd see in a cancer screening scenario where missing a real case is catastrophic, the total cost spikes hard unless you drag that threshold down and accept a few more false alarms. That's the exact lesson risk-sensitive model deployment is built on, and now you can *feel* it instead of just being told about it.

The other three modules follow the same pattern — a tangent-line visualizer for derivatives feeding straight into a gradient descent simulator you can step through, and a forward-and-backward pass walkthrough for backpropagation that shows the chain rule firing link by link. Every module ends with a quiz, and there's a full interview-flashcard deck at the end for anyone prepping for a data science interview.

So that's the tour — four modules, four live simulators, one cost-aware addition that closes the loop on the original ask, and quizzes throughout to lock it all in. If you're learning this stuff, don't just read the math — go drag the sliders yourself. Thanks for watching, and I'll see you in the next one.

---

## [`09_flowforge_dag_engine`](./09_flowforge_dag_engine)


**Target length:** ~2.5 minutes

---

Hey everyone, welcome back. Today I want to show you FlowForge — this is a full-stack workflow DAG orchestrator I built to really flex what "textbook" TypeScript architecture looks like when you pair it with a classic computer science algorithm: Kahn's topological sort.

So here's the backstory. The prompt I gave my AI coding assistant was deliberately open-ended: "install Matt Pocock skills and then demonstrate it with a complicated end-to-end full stack project." That's it — one line. Matt Pocock, if you don't know him, is a well-known TypeScript educator, famous for things like branded types, discriminated unions, and exhaustive pattern matching. So the challenge here was: take those advanced type-safety patterns and actually prove them out in a real, runnable application instead of just a toy code snippet.

Let me give you the tour. When the app loads, you're dropped straight into the DAG Canvas — that's this default "Cloud Incident Response" workflow: a log ingestion trigger, a robust-scaler transform node, an isolation forest anomaly model, a severity condition branch, and a remediation action. Each node card is color-coded by its kind — trigger, transform, inference, condition, action, join — and if you look closely at each card, you'll notice a little "L0", "L1", "L2" badge. That's actually my own addition: I added live client-side computation of each node's topological concurrency level, straight from Kahn's algorithm, so you can visually see at a glance which nodes are independent and could run in parallel versus which ones are strictly sequential dependencies.

Now watch what happens when I hit "Execute DAG" in the top right. The engine walks through a real finite-state machine — idle, to validating, to compiling, to running, to completed — and you can watch that state badge animate live up in the metrics bar. Under the hood, the FastAPI backend is actually running Kahn's in-degree algorithm server-side to detect cycles and compute concurrency stages, then it streams every single state transition and node execution event down to the browser over Server-Sent Events. You can see it play out node by node in the terminal at the bottom — each one logs its simulated latency and a realistic synthetic output payload.

One architecture detail worth calling out: the backend's cycle detection isn't just decorative. If in-degree counts never all reach zero, that means there's a cycle, and the compile step throws a clear error naming exactly which nodes are stuck — that's Kahn's algorithm doing real work, not just for show.

There's also a TypeScript Lab tab up top if you want to see the actual branded-type and discriminated-union code patterns laid out with explanations, and an Architecture tab documenting the three pillars: cycle detection, concurrency staging, and the SSE event bus.

That's FlowForge — Kahn's algorithm, strict TypeScript discipline, and a live SSE execution stream, all wired together in one demo. Thanks for watching, and I'll see you in the next one.

---

## [`10_crispdm_masters_curriculum`](./10_crispdm_masters_curriculum)


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

---

## [`11_enterprise_ds_audit`](./11_enterprise_ds_audit)


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

---

## [`12_timeseries_forecasting`](./12_timeseries_forecasting)


**Runtime target:** ~2.5 minutes

---

Hey everyone, welcome back. Today I'm walking you through TimePulse — it's a full multi-horizon time series forecasting platform I built out as part of my data science portfolio series. Think of it as a mini forecasting product you'd actually find inside a cloud infrastructure company: it predicts energy demand on a compute grid anywhere from 7 to 60 days out, and it wraps that prediction in a full CRISP-DM workflow, not just a single chart.

The original prompt I gave my AI coding assistant was pretty open-ended — I basically said: "build a similar website for timeseries forecasting similar to other projects you built — including detailed CRISP-DM steps and admin and other dashboards." So the brief was loose on purpose. I wanted to see what a complete forecasting product looks like when an agent has to fill in all the analytical gaps itself.

Let's jump into the app. I've got the backend running on port 8012 with FastAPI, and the React frontend on port 5185. The first tab is the Live Forecast Studio — this is the centerpiece. I can pick a model backbone from a dropdown — LightGBM, Deep N-BEATS, Prophet, or SARIMAX — drag the horizon slider anywhere from 7 to 60 days, and there's this fun "demand surge" slider that simulates a heatwave-style spike in usage. Watch the chart update live: you get the historical actuals as a solid gray line, the forecast as a dashed cyan line, and an expanding 95% confidence band that gets wider the further out we forecast — which is exactly what should happen mathematically as uncertainty compounds.

Next tab is the CRISP-DM workflow — six phases from business understanding all the way to operational telemetry, explaining the "why" behind every modeling decision, not just the "what."

Then there's Decomposition and ACF — this is the statistics-nerd tab. It splits the signal into trend, seasonal, and residual components, runs ADF and KPSS stationarity tests, and plots a full 40-lag autocorrelation and partial autocorrelation chart so you can visually spot the weekly seasonality — you'll see clear spikes at lag 7, 14, 21, and 28.

After that is the Model Tournament — a walk-forward backtesting leaderboard where LightGBM comes out on top with a 2.84% MAPE, beating N-BEATS, Prophet, and SARIMAX. And finally the Admin tab shows live telemetry and an auto-research hill-climbing log — basically a transparent record of how the winning model configuration was found.

One architecture detail worth calling out: everything here respects walk-forward validation — no peeking into the future when scoring models — and the confidence intervals actually expand with horizon length instead of staying flat, which a lot of toy forecasting demos get wrong.

For my creative addition this round, I did two things. First, I noticed the ACF/PACF charts were only rendering 28 of the 40 lags the backend computes and the README promises — so I fixed that to show the full 40-lag view. And then I added a little auto-detected insight callout right above those charts that scans the ACF array itself and calls out the single strongest cyclical lag with its correlation value — so instead of just staring at bars, the app tells you where to look. I also added a one-click CSV export button on the forecast table so you can grab the raw predictions and bounds for your own analysis.

That's TimePulse — a full-stack forecasting engine with proper statistical rigor under the hood. If you're building anything with seasonal demand data, this is a solid pattern to borrow from. Thanks for watching, and I'll see you in the next one.

---

## [`13_crispdm_nyc_taxi_audit_platform`](./13_crispdm_nyc_taxi_audit_platform)


**Runtime target:** ~3 minutes

---

Alright, this one's the big one in the series — Project 13, the NYC TLC Mobility and Dynamic Surge Pricing Intelligence Platform. If the earlier projects were demos, this one is built to feel like something you'd actually hand to an enterprise data science audit committee.

Here's the prompt that kicked it off: "implement a new project with following CRISP-DM methodology and engaging all the data science skills I have installed." That's it — deliberately broad, and the agent ran with it, building out a full six-phase CRISP-DM lifecycle around synthetic NYC Taxi and Limousine Commission trip data, with dynamic surge pricing as the business problem.

Let's start on the live side of the app — the NYC TLC Multi-Task Ride Estimator. This is the public-facing tool: I pick a preset route, say Times Square to JFK, or drag the sliders for hour of day, precipitation, and passenger count. Every change fires a live prediction against a FastAPI backend running on port 8013, and you get three things back instantly — a predicted gross fare, a high-tip propensity score, and an estimated carbon footprint for the trip. Below that is a local TreeSHAP waterfall — so instead of a black box number, you see exactly which features pushed the fare up or down: trip distance, the JFK flat-rate code, congestion surcharge, all itemized in dollars.

Now flip over to the admin side — this is the Data Science and Code Auditor Portal, and it's got eight sub-tabs. There's a full ten-page CRISP-DM paper dossier with the actual math typeset in KaTeX. There's an EDA and data quality scorecard grading the dataset A-plus at 99.85% completeness. There's a geospatial clustering view with six mobility hotspot centroids you can click through on an SVG map of the boroughs. There's an AutoResearch tournament comparing seven model architectures — Histogram Gradient Boosting comes out on top with a $1.48 RMSE. There's a code auditor workbench, and there's an MLOps console with live population stability index drift monitoring and a concurrency load tester you can actually fire off and watch complete in real time.

The architecture highlight I want to call out: the backend cleanly separates its business logic into a `core/` module — clustering, audit, autoresearch, mlops, explainability — and the `server/` just wires FastAPI on top of it. That separation is exactly what you want for a real audit trail: the modeling logic isn't tangled up in the web layer, so a reviewer can trace every claim on the dashboard straight back to a specific, isolated Python module.

For my creative addition, I added a session scenario comparison ticker to the ride estimator. Every time you tweak a slider and get a new fare prediction, it now keeps a rolling log of your last six scenarios as little horizontal bars, so you can visually compare how a rainy Tuesday morning JFK run stacks up against a dry evening Brooklyn crosstown — all without leaving the page or writing anything down.

That's Project 13 — probably the most enterprise-grade thing in this whole portfolio. If you're studying how to structure a real CRISP-DM project end to end, this is the one to bookmark. Catch you in the next video.

---

## [`14_autogluon_multimodal_automl_suite`](./14_autogluon_multimodal_automl_suite)


**Runtime target:** ~2.5–3 minutes

---

Okay, this is Project 14, and it's easily the most ambitious one visually — the AutoGluon Multimodal AutoML Suite. The pitch here is a single platform that touches four totally different flavors of automated machine learning: tabular stacking, time series foundation models, vision-language fusion, and model distillation for production serving.

The prompt that started this one was refreshingly casual: "in similar fashion do a spectacular automl demo of various data science using autogluon packages latest package illustrating various capabilities." Open invitation, and the agent took it and ran — building out ten distinct tabs covering the entire AutoML lifecycle.

Quick, important disclosure before the tour, because I want to be straight with you about what's actually running under the hood: despite the AutoGluon branding everywhere, this backend does not literally import the AutoGluon package. When I went in to verify it, I found the core engines are hand-rolled Python — LightGBM, XGBoost, CatBoost, and scikit-learn stacked together to simulate exactly what AutoGluon's stacking ensembles and Chronos forecaster would produce. It's a faithful, well-researched simulation of AutoGluon's behavior and outputs, not a literal library integration. I think that's worth knowing if you're using this as a learning reference — the concepts and the API shapes are accurate, the specific engine underneath is synthetic.

Alright, let's tour it. First tab, Tabular Stacking — you tune customer churn features, hit "Execute DAG Inference," and watch a genuine three-level stacking diagram populate live: six Level 1 base learners, two Level 2 meta-models blending their out-of-fold predictions, and a Level 3 Caruana-weighted ensemble that becomes the final call. Second tab, Chronos TimeSeries — a quantile fan chart with P10, P50, P90 bands, a horizon slider from 7 to 28 days, and a clickable promotion calendar that lets you simulate marketing spikes. Third, MultiModal Fusion — paste in a product title and description and it fuses text, vision, and tabular signals into a single valuation with token-level saliency highlighting which words moved the price. Then there's Auto-EDA with drift detection, a four-phase AutoResearch tournament, an explainability dashboard with TreeSHAP and what-if sliders, and an MLOps console that distills the whole ensemble down to a nine-microsecond model.

One thing worth calling out architecturally: this project follows the same clean separation as the other CRISP-DM builds in this series — a `core/` package holding all the modeling logic, completely decoupled from the `server/` FastAPI layer that just exposes it. That's what made it easy to verify: I could confirm every engine imported and ran correctly independent of the web framework around it.

I did find one real bug while testing this, and it's a good one: the Chronos fan chart had its x-axis scaling hardcoded for exactly 20 history points plus a 14-day forecast — so the moment you dragged the horizon slider to 7, 21, or 28 days, the chart's proportions broke, with the forecast segment either compressing or overlapping the history line. I fixed it to calculate the total plotted length dynamically, so the chart now scales correctly no matter which horizon you pick. While I was in there, I also added a small "Today" boundary marker — a dashed vertical line with a label that makes it immediately obvious where historical data ends and the Chronos forecast begins, which the original chart didn't have.

That's the AutoGluon Multimodal AutoML Suite — four AutoML paradigms, one dashboard, and now a forecast chart that actually scales right. If you're studying multi-engine AutoML architecture, this one's worth digging into. See you in the next walkthrough.

---

## [`15_spy_timeseries_sota_forecasting`](./15_spy_timeseries_sota_forecasting)


*(~2-3 minutes, spoken narration for a screen recording)*

---

Hey everyone, welcome back. Today I want to show you project fifteen in my AI-built data science portfolio, and this one's a big one — it's a full quantitative trading research desk for SPY, the S&P 500 ETF, built almost entirely by an AI coding assistant from a single conversation.

Here's how it started. I gave the assistant this prompt: "grill me requirements for an end2end timeseries forecasting for stock index SPY using state of art Machine Learning techniques." Then I followed up asking it to turn that into a detailed design spec — and I was really specific here — I told it to make sure there's zero data leakage in the features, like a good data scientist would insist on, and to build in a proper auditor that checks and verifies everything was done correctly. From there it generated a whole UML implementation plan and a detailed spec file to match.

So what did it actually build? Let me click through it. This is the Forecast Studio — it's predicting SPY's price one day and one week out, but instead of a single number, it gives you a full probability band: a P10, P50, and P90 quantile forecast, so you see the downside case, the median case, and the upside case. Under the hood there's a tournament of seven different forecasting backbones competing against each other — Amazon's Chronos-T5 foundation model, PatchTST, a Temporal Fusion Transformer, a two-level gradient-boosted stacking ensemble with LightGBM, XGBoost and CatBoost, a Bi-LSTM deep sequence model, classic AutoARIMA plus GARCH for volatility, and then a Caruana greedy-weighted ensemble that blends the best of all of them. You can see the live leaderboard ranking every model by RMSE, directional accuracy, and Sharpe ratio.

Now here's the part I actually want to spend the most time on: the Quantitative Backtest Studio. This runs a purged and embargoed walk-forward backtest — that's a technique from Marcos López de Prado's work on avoiding lookahead bias in financial ML — training on the first five months of data and trading forward on the last month, completely out of sample. And the headline numbers are legit: a 2.15 annualized Sharpe ratio, 68.2% directional hit rate, and just a 3.8% max drawdown, with realistic 2 basis point slippage baked into every trade.

While I was verifying this app end to end, I actually caught a real bug here — the Sortino ratio, which measures downside risk specifically, was blowing up to something like 150 million in certain runs. Turns out when the backtest window has almost no losing days, the downside deviation collapses toward zero and the ratio explodes into a meaningless number. I fixed it so the calculation requires a minimum sample of losing days before trusting that estimate, and added a sane clip so it never reports a number that isn't interpretable. Small fix, but it's exactly the kind of thing you want to catch before you trust a Sharpe-adjacent number in a trading system.

For my creative addition, I looked at this backtest panel and felt like it was missing two things quant traders always want to see: win rate and profit factor, so I added those as their own KPI cards right next to Sharpe and Sortino. And underneath the main equity curve, I added an underwater drawdown chart — that classic red area chart showing exactly how far the strategy dipped below its peak at every point in time. It's a small addition, but it's the kind of visual that makes a backtest report feel like something out of an actual hedge fund's tearsheet.

There's also a Forensic AST Code Auditor tab in here, which is wild — it statically parses its own codebase looking for negative time shifts and any preprocessing that was fit on test data, and certifies the whole thing zero-leakage, grade A-plus. And if you keep scrolling there's a full ten-page CRISP-DM research paper with LaTeX math rendering, plus UML architecture diagrams for the whole system.

So that's project fifteen — a SOTA multi-model forecasting tournament, a leakage-audited backtest engine, and now a slightly nicer risk dashboard. If you want to see the code or try it yourself, it's on my GitHub, link's in the description. Thanks for watching, and I'll see you in the next one.

---

