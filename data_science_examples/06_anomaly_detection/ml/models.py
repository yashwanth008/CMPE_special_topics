# Multi-Backbone Anomaly Detection Suite
# Implements Isolation Forest, LOF, One-Class SVM, Autoencoder Reconstruction, and Robust Mahalanobis Envelope

import time
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, f1_score, precision_score, recall_score

# -------------------------------------------------------------
# 1. NumPy-Based Deep Autoencoder for Tabular Reconstruction
# -------------------------------------------------------------
class TabularAutoencoder:
    """Feedforward Autoencoder with Bottleneck Compression (10 -> 6 -> 3 -> 6 -> 10)."""
    def __init__(self, input_dim: int = 10, hidden_dim: int = 6, bottleneck_dim: int = 3, lr: float = 0.01, epochs: int = 25, seed: int = 42):
        np.random.seed(seed)
        self.input_dim = input_dim
        # Encoder weights
        self.W1 = np.random.randn(input_dim, hidden_dim) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros(hidden_dim)
        self.W2 = np.random.randn(hidden_dim, bottleneck_dim) * np.sqrt(2.0 / hidden_dim)
        self.b2 = np.zeros(bottleneck_dim)
        # Decoder weights
        self.W3 = np.random.randn(bottleneck_dim, hidden_dim) * np.sqrt(2.0 / bottleneck_dim)
        self.b3 = np.zeros(hidden_dim)
        self.W4 = np.random.randn(hidden_dim, input_dim) * np.sqrt(2.0 / hidden_dim)
        self.b4 = np.zeros(input_dim)
        
        self.lr = lr
        self.epochs = epochs

    def _relu(self, x):
        return np.maximum(0, x)

    def _relu_grad(self, x):
        return (x > 0).astype(float)

    def fit(self, X: np.ndarray):
        N = len(X)
        batch_size = 128
        for epoch in range(self.epochs):
            perm = np.random.permutation(N)
            for i in range(0, N, batch_size):
                xb = X[perm[i:i+batch_size]]
                # Forward pass
                h1 = self._relu(np.dot(xb, self.W1) + self.b1)
                z = self._relu(np.dot(h1, self.W2) + self.b2)
                h2 = self._relu(np.dot(z, self.W3) + self.b3)
                x_recon = np.dot(h2, self.W4) + self.b4

                # Reconstruction error
                error = (x_recon - xb) / len(xb)

                # Backprop
                grad_W4 = np.dot(h2.T, error)
                grad_b4 = np.sum(error, axis=0)

                grad_h2 = np.dot(error, self.W4.T) * self._relu_grad(h2)
                grad_W3 = np.dot(z.T, grad_h2)
                grad_b3 = np.sum(grad_h2, axis=0)

                grad_z = np.dot(grad_h2, self.W3.T) * self._relu_grad(z)
                grad_W2 = np.dot(h1.T, grad_z)
                grad_b2 = np.sum(grad_z, axis=0)

                grad_h1 = np.dot(grad_z, self.W2.T) * self._relu_grad(h1)
                grad_W1 = np.dot(xb.T, grad_h1)
                grad_b1 = np.sum(grad_h1, axis=0)

                # SGD updates
                self.W4 -= self.lr * grad_W4
                self.b4 -= self.lr * grad_b4
                self.W3 -= self.lr * grad_W3
                self.b3 -= self.lr * grad_b3
                self.W2 -= self.lr * grad_W2
                self.b2 -= self.lr * grad_b2
                self.W1 -= self.lr * grad_W1
                self.b1 -= self.lr * grad_b1

    def score_samples(self, X: np.ndarray) -> np.ndarray:
        """Returns reconstruction MSE per sample: ||x - x_hat||^2"""
        h1 = self._relu(np.dot(X, self.W1) + self.b1)
        z = self._relu(np.dot(h1, self.W2) + self.b2)
        h2 = self._relu(np.dot(z, self.W3) + self.b3)
        x_recon = np.dot(h2, self.W4) + self.b4
        return np.mean((X - x_recon) ** 2, axis=1)

# -------------------------------------------------------------
# 2. Multi-Backbone Benchmark Runner
# -------------------------------------------------------------
def benchmark_anomaly_models(X: np.ndarray, y_true: np.ndarray) -> List[Dict[str, Any]]:
    """Runs and benchmarks 5 diverse anomaly detection backbones."""
    results = []

    # Robust scaling for high-dimensional stability
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    models = {
        "Isolation Forest": {
            "model": IsolationForest(n_estimators=200, contamination=0.035, random_state=42),
            "paradigm": "Tree-based recursive path length partitioning",
            "score_fn": lambda m, d: -m.score_samples(d) # higher = more anomalous
        },
        "Autoencoder Reconstruction": {
            "model": TabularAutoencoder(input_dim=X.shape[1], hidden_dim=6, bottleneck_dim=3, epochs=30),
            "paradigm": "Deep neural bottleneck reconstruction loss",
            "score_fn": lambda m, d: m.score_samples(d)
        },
        "Local Outlier Factor (LOF)": {
            "model": LocalOutlierFactor(n_neighbors=25, contamination=0.035, novelty=True),
            "paradigm": "Density-based local reachability density ratio",
            "score_fn": lambda m, d: -m.score_samples(d)
        },
        "One-Class SVM (OCSVM)": {
            "model": OneClassSVM(kernel='rbf', nu=0.035, gamma='scale'),
            "paradigm": "Maximum margin hyperplane in RKHS feature space",
            "score_fn": lambda m, d: -m.score_samples(d)
        },
        "Robust Mahalanobis Envelope": {
            "model": EllipticEnvelope(contamination=0.035, random_state=42),
            "paradigm": "Minimum Covariance Determinant (MCD) distance",
            "score_fn": lambda m, d: m.mahalanobis(d)
        }
    }

    for name, spec in models.items():
        t0 = time.perf_counter()
        clf = spec["model"]
        clf.fit(X_scaled)
        train_time = time.perf_counter() - t0

        t_inf_0 = time.perf_counter()
        scores = spec["score_fn"](clf, X_scaled)
        inf_latency_ms = round(((time.perf_counter() - t_inf_0) / len(X_scaled)) * 1000.0, 3)

        # Compute ROC-AUC
        roc_auc = float(roc_auc_score(y_true, scores))

        # Precision-Recall AUC
        prec_pts, rec_pts, _ = precision_recall_curve(y_true, scores)
        pr_auc = float(auc(rec_pts, prec_pts))

        # Threshold at 96.5th percentile for binary metrics
        threshold = np.percentile(scores, 96.5)
        y_pred = (scores >= threshold).astype(int)

        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))

        results.append({
            "name": name,
            "paradigm": spec["paradigm"],
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "f1_score": round(f1, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "train_time_sec": round(train_time, 3),
            "inf_latency_ms": inf_latency_ms,
            "is_champion": False
        })

    # Mark Champion
    results.sort(key=lambda x: x["roc_auc"], reverse=True)
    results[0]["is_champion"] = True

    return results

if __name__ == '__main__':
    from data_loader import generate_anomaly_dataset
    df, y, _ = generate_anomaly_dataset(5000)
    X = df.drop(columns=["is_anomaly", "archetype"]).values
    res = benchmark_anomaly_models(X, y)
    for r in res:
        print(f"[{r['name']}] ROC-AUC: {r['roc_auc']} | PR-AUC: {r['pr_auc']} | F1: {r['f1_score']} | Time: {r['train_time_sec']}s")
