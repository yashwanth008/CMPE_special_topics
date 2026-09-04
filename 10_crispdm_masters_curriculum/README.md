# 📜 CRISP-DM Master's Data Science Platform

A comprehensive 7-phase master's degree level curriculum and interactive analysis platform conducting an end-to-end CRISP-DM workflow on the **Kaggle Census & Income ($N=2,500$) dataset**.

---

## 📸 Comprehensive Visual Tour

### 1. Phase 1: Business & Data Understanding (EDA)
*Multivariate Pearson correlation matrix ($r_{xy}$), missing value checks, and continuous feature distribution summaries.*
![CRISP-DM Phase 1 EDA](./screenshots/crispdm_phase1_eda.png)

### 2. Phase 2: Clustering Topology
*K-Means ($k=4$) and Gaussian Mixture Models with silhouette optimization ($s=0.46$).*
![CRISP-DM Phase 2 Clustering](./screenshots/crispdm_phase2_clustering.png)

### 3. Phase 3: Outlier Isolation
*Isolation Forest contamination tuning ($c=0.05$) isolating multi-dimensional demographic anomalies.*
![CRISP-DM Phase 3 Outliers](./screenshots/crispdm_phase3_outliers.png)

### 4. Phase 4: Income Regression Tournament & Live Salary Predictor
*Ridge Regression ($R^2 = 0.685$) narrowly leads a 4-model tournament over Random Forest and Gradient Boosting ($R^2 \approx 0.64$), illustrating Occam's Razor when a linear generative process dominates — with a live salary estimation calculator.*
![CRISP-DM Phase 4 Regression](./screenshots/crispdm_phase4_regression.png)

### 5. Phase 5: Association Pattern Mining
*Apriori rule discovery identifying demographic rule combinations with Lift $2.45\times$.*
![CRISP-DM Phase 5 Association](./screenshots/crispdm_phase5_association.png)

### 6. Phase 6: Sub-Linear Locality-Sensitive Hashing (LSH)
*Cosine Random Hyperplane nearest neighbor search achieving a $14.8\times$ query speedup.*
![CRISP-DM Phase 6 LSH](./screenshots/crispdm_phase6_lsh.png)

### 7. Interactive CRISP-DM Master's Quiz Modal
*Dynamic master's level concept verification quizzes.*
![CRISP-DM Quiz Modal](./screenshots/crispdm_quiz_modal.png)

---

## 🧠 Autonomous Skills Included

Pre-packaged in `skills/` and `.agents/skills/`:
* `data-cleaning`: Leakage-free preprocessing and median imputation.
* `data-narrative-builder`: Stakeholder data story and insight structuring.
* `methodology-explainer`: Plain language technical breakdowns.
* `analysis-planning`: Structured multi-phase CRISP-DM execution plans.

---

## 🚀 Quick Start

```bash
# Backend (FastAPI on Port 8010)
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8010

# Frontend (Vite React on Port 5183)
cd frontend
npm install
npm run dev # Open http://localhost:5183/
```
