# 📋 Implementation Plan — Project 04: Market Basket Pattern Mining (`04_associative_pattern_mining`)

## 1. Executive Summary & Problem Formulation
Discovering co-occurrence patterns, cross-sell associations, and purchase affinity rules from retail transaction data (Groceries Kaggle benchmark). Implements Apriori, FP-Growth, and ECLAT algorithms with interactive force-directed graph visualizations.

## 2. Technical Architecture & Tech Stack
* **Backend**: FastAPI Microservice (`server/main.py`, Port 8004).
* **Frontend**: React 18 + Vite + SVG Association Graphs (`client/`, Port 5177).
* **Core Libraries**: `mlxtend`, Pandas, NumPy, Scikit-Learn.

## 3. Mathematical Formulations & Rule Metrics
* **Support**:
  $$\text{Support}(A \implies B) = P(A \cup B) = \frac{\sigma(A \cup B)}{N}$$
* **Confidence**:
  $$\text{Confidence}(A \implies B) = P(B \mid A) = \frac{\text{Support}(A \cup B)}{\text{Support}(A)}$$
* **Lift**:
  $$\text{Lift}(A \implies B) = \frac{\text{Confidence}(A \implies B)}{\text{Support}(B)} = \frac{P(A \cup B)}{P(A) \cdot P(B)}$$
* **Conviction**:
  $$\text{Conviction}(A \implies B) = \frac{1 - \text{Support}(B)}{1 - \text{Confidence}(A \implies B)}$$

## 4. Step-by-Step Execution Checklist
- [x] **Transaction Matrix**: Built sparse one-hot transaction matrix across 9,835 transactions and 169 itemsets.
- [x] **AutoResearch Benchmark**: Evaluated FP-Growth vs. Apriori runtime scaling ($14.2\times$ faster rule extraction for FP-Growth).
- [x] **Interactive Rule Explorer**: Built multidimensional filtering on Support $\ge 0.01$, Confidence $\ge 0.20$, and Lift $\ge 1.5$.
- [x] **CRISP-DM Dossier**: Authored full 6-phase retail merchandising research paper.

## 5. Verification & Acceptance Criteria
* `curl http://127.0.0.1:8004/api/rules` returns valid association rules with non-zero Support, Confidence, and Lift.
