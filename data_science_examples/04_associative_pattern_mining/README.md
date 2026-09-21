# The Problem

A shopper drops Organic Hass Avocados and Fresh Limes into a cart. Somewhere in ten thousand past grocery orders is the answer to "what goes with this" — but nobody manually wrote that rule down. It has to be mined out of the transaction history, scored for how strong the association actually is, and served back in real time, or it's useless at checkout.

# The Solution

Market Basket Intelligence is a frequent-itemset mining engine over the Kaggle Instacart-style dataset (10,000+ orders), running Apriori, FP-Growth, and ECLAT to extract association rules, then serving cross-sell recommendations through a sub-millisecond lookup. Built from the prompt: *"associative pattern mining using a popular Kaggle dataset — follow CRISP-DM, include a nice data science admin dashboard, implement autoresearch to do hill climbing, match the dashboard details with the research paper."*

## The math it's built on

| Metric | Formula |
|---|---|
| Support | $\text{Supp}(A \Rightarrow B) = P(A \cup B)$ |
| Confidence | $\text{Conf}(A \Rightarrow B) = \dfrac{P(A \cup B)}{P(A)}$ |
| Lift | $\text{Lift}(A \Rightarrow B) = \dfrac{P(A \cup B)}{P(A) \cdot P(B)}$ |
| Conviction | $\text{Conv}(A \Rightarrow B) = \dfrac{1 - P(B)}{1 - \text{Conf}(A \Rightarrow B)}$ |

The admin dashboard displays these as reference chips right next to the results, so a lift number is never presented without its definition nearby.

## Seeing it work

Drop items in the basket (there are quick presets like "Guacamole Fiesta," or pick manually from the catalog), and cross-sell recommendations appear instantly, ranked by lift. The example the project ships with: Fresh Limes → Fresh Organic Cilantro at 4.48× lift, 86% confidence — a real mined signal, not a random pairing. A "Add to Cart" button on any recommendation drops it straight into the basket and updates a live potential-GMV-uplift number. Next to the basket, a force-directed 2D network graph renders every catalog item as a node and every mined rule as an edge weighted by lift, so product "communities" are visible at a glance.

![Market Basket Graph](./screenshots/market_basket_graph.png)

An AutoResearch hill-climbing loop — the CRISP-DM Evaluation phase turned into an autonomous agent — sweeps minimum support and confidence thresholds across the three algorithms and only promotes a new rule set when quality metrics improve. Its full trial trajectory, plus rule-generation speed and lift-distribution benchmarks, lives in the admin dashboard: a comparison against a simulated Kaggle-grandmaster baseline (mean lift 4.85) versus the AutoResearch-evolved result (3.79).

![Market Basket Admin](./screenshots/market_basket_admin.png)

Underneath both of those sits the CRISP-DM dossier: item frequency distributions, support pruning rationale, confidence threshold selection, documented end to end.

![Market Basket CRISP-DM](./screenshots/market_basket_crisp_dm.png)

## Packaged skills

`skills/associative-pattern-mining` — Apriori and FP-Growth mining pipelines.
`skills/funnel-analysis` — conversion bottleneck and cart-affinity tracking.
(Also mirrored under `.agents/skills/`.)

## Running it

```bash
# Backend — FastAPI, port 8004
cd server
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8004

# Frontend — Vite + React, port 5177
cd client
npm install
npm run dev   # http://localhost:5177/
```

## Since the last pass

Two small UX fixes landed in the audit: a "Clear Basket" button (previously items could only be removed one at a time), and a confetti burst in the app's amber-and-emerald palette whenever a recommended cross-sell item is actually added to cart — marking the moment a mined rule turns into a real purchase decision. Full narration in `VIDEO_SCRIPT.md`; `screenshots/verified_walkthrough.png` confirms the recommender and graph render correctly end to end.
