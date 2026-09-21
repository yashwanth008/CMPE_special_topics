# 📋 Implementation Plan — Project 06: Autonomous Anomaly Detection Platform (`06_anomaly_detection`)

## 1. Executive Summary & Problem Formulation
High-dimensional cloud infrastructure telemetry and cybersecurity threat detection platform on Kaggle server metrics. Implements a multi-backbone consensus tournament combining Isolation Forest, Autoencoders, LOF, One-Class SVM, and Robust Mahalanobis Distance.

## 2. Technical Architecture & Tech Stack
* **Backend**: FastAPI Microservice (`server/main.py`, Port 8006).
* **Frontend**: React 18 + Vite + 2D Manifold Scatter Visualizer (`client/`, Port 5179).
* **Models**: Isolation Forest, Local Outlier Factor (LOF), One-Class SVM, PyTorch Deep Autoencoder, Robust Minimum Covariance Determinant (MCD) Mahalanobis Distance.

## 3. Mathematical Formulations & Consensus Scoring
* **Robust Mahalanobis Distance**:
  $$D_M(\mathbf{x}) = \sqrt{(\mathbf{x} - \hat{\boldsymbol{\mu}}_{\text{MCD}})^T \hat{\boldsymbol{\Sigma}}_{\text{MCD}}^{-1} (\mathbf{x} - \hat{\boldsymbol{\mu}}_{\text{MCD}})}$$
* **Autoencoder Reconstruction Error**:
  $$\mathcal{L}_{\text{recon}}(\mathbf{x}) = \|\mathbf{x} - g_{\theta}(f_{\phi}(\mathbf{x}))\|_2^2$$
* **Consensus Anomaly Score**:
  $$S_{\text{consensus}}(\mathbf{x}) = \sum_{m=1}^M w_m \cdot \text{RankScore}_m(\mathbf{x})$$

## 4. Step-by-Step Execution Checklist
- [x] **Telemetry Dataset**: Ingested 15,000 server telemetry instances (CPU, memory, IOPS, network egress).
- [x] **Multi-Backbone Tournament**: Benchmarked 5 anomaly detectors. Isolation Forest achieved champion PR-AUC (0.942).
- [x] **2D PCA/t-SNE Manifold**: Mapped multi-sensor telemetry into 2D projections with live threshold sliders.
- [x] **CRISP-DM Research Paper**: Authored formal 6-phase publication.

## 5. Verification & Acceptance Criteria
* `curl http://127.0.0.1:8006/api/anomalies` detects anomalies with False Alarm Rate (FAR) $< 1.5\%$.
