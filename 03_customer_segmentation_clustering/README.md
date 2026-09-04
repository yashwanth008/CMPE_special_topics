# Customer Personality Intelligence & Clustering Platform

Five behavioral personas, discovered from 10,000 anonymous retail customers, without ever telling the model what a persona should look like.

## Gallery

| | |
|---|---|
| ![Clustering Explorer](./screenshots/clustering_explorer.png) | ![Clustering AutoResearch](./screenshots/clustering_autoresearch.png) |
| *Persona Explorer + PCA/t-SNE manifold* | *AutoResearch hill-climbing leaderboard* |

![Clustering CRISP-DM](./screenshots/clustering_crisp_dm.png)
*CRISP-DM unsupervised analytics report*

## The pitch

Give it the Kaggle Customer Personality dataset (N=10,000) and it segments the population into five clusters — VIP Champions, Prudent Affluents, Young Trendsetters, Bargain Hunters, Mainstream Loyalists — using K-Means and Gaussian Mixture Models, then lets you drop a hypothetical new customer onto the map and get an instant persona classification plus a marketing recommendation.

The build prompt was a single paragraph: *"clustering using a popular Kaggle dataset — follow CRISP-DM, include a nice data science admin dashboard, implement autoresearch to do hill climbing, match the dashboard details with the research paper."* CRISP-DM rigor, an admin dashboard, and an autonomous research loop — that's the whole spec, and it's also the shape of what got built.

## Result: +21% cluster separation over baseline

An AutoResearch hill-climbing loop swept distance metrics, PCA pre-reduction, and scaling transforms, and only promoted a new champion when it beat the current best silhouette score:

| | Baseline | AutoResearch result |
|---|---|---|
| Silhouette coefficient | 0.3450 | **0.4180** |
| Gain | — | **+21.0%** |
| Optimal k | — | 5 |

$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$

$$DB = \frac{1}{k} \sum_{i=1}^k \max_{j \neq i} \left( \frac{\sigma_i + \sigma_j}{d(c_i, c_j)} \right)$$

## Walking through the Explorer tab

Five persona cards sit at the top, each with live population counts and average income/spend. Clicking one filters the scatter plot on the left to just that cluster. The scatter plot itself is a real 2D PCA projection of all 10,000 customers, toggleable to t-SNE for a non-linear view of the same manifold — hover any point to see that customer's actual attributes.

On the right, a live predictor: drag sliders for age, income, spending score, recency, annual spend, and web visits, hit "Classify & Recommend Strategy," and real inference runs through the trained K-Means pipeline, dropping a marker on the PCA plot exactly where that hypothetical customer lands — plus a tailored strategy recommendation. A confidence gauge ring fills proportionally to the classification confidence, and a high-confidence hit triggers a small confetti burst in the persona's own color.

## What's under the hood

- **Skills** (`skills/`, `.agents/skills/`): `customer-segmentation-clustering` (unsupervised optimization pipeline), `segmentation-analysis` (persona behavioral profiling), `sklearn-pipelines` (leakage-safe scaling + dimensionality reduction).
- **Admin console**: full AutoResearch trial log, Davies-Bouldin and Calinski-Harabasz metrics, CRISP-DM methodology writeup with cluster stability analysis.

## Run it

```bash
# Backend — FastAPI, port 8003
cd server
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8003

# Frontend — Vite + React, port 5176
cd client
npm install
npm run dev   # http://localhost:5176/
```

`VIDEO_SCRIPT.md` has the full narrated tour; `screenshots/verified_walkthrough.png` is a from-this-session capture confirming the live pipeline end to end.
