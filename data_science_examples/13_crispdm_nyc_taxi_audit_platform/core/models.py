# Phase 4: Modeling Architectures & Multi-Task Estimators (CRISP-DM Standard)
# Skills engaged: automl-autogluon, hyperparameter-tuning, pytorch-training-loop, reproducible-ml

import numpy as np
import torch
import torch.nn as nn
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, HistGradientBoostingClassifier
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.pipeline import Pipeline
from typing import Dict, Any

class PyTorchMultiTaskMLP(nn.Module):
    """
    Deep PyTorch Multi-Task MLP simultaneously predicting:
    1. Continuous Trip Fare (Regression Output with Huber Loss)
    2. High-Tip Probability (Binary Classification Output with BCE Loss)
    """
    def __init__(self, in_features: int, hidden_dim: int = 64):
        super().__init__()
        self.shared_backbone = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.SiLU(),
            nn.Dropout(0.15),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.SiLU()
        )
        # Head 1: Fare Regressor
        self.fare_head = nn.Sequential(
            nn.Linear(hidden_dim // 2, 16),
            nn.SiLU(),
            nn.Linear(16, 1)
        )
        # Head 2: High-Tip Classifier
        self.tip_head = nn.Sequential(
            nn.Linear(hidden_dim // 2, 16),
            nn.SiLU(),
            nn.Linear(16, 1)
        )

    def forward(self, x: torch.Tensor):
        feat = self.shared_backbone(x)
        fare_pred = self.fare_head(feat)
        tip_logits = self.tip_head(feat)
        return fare_pred, tip_logits

def get_candidate_models(preprocessor) -> Dict[str, Any]:
    """Returns candidate multi-backbone models wrapped with preprocessor."""
    models = {
        "LightGBM Gradient Booster": Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=5, random_state=42))
        ]),
        "Histogram Gradient Boosting (LGBM Equivalent)": Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", GradientBoostingRegressor(n_estimators=120, learning_rate=0.06, max_depth=6, random_state=42))
        ]),
        "Random Forest Ensemble": Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", RandomForestRegressor(n_estimators=80, max_depth=12, n_jobs=-1, random_state=42))
        ]),
        "ElasticNet (L1/L2 Regularized)": Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", ElasticNet(alpha=0.01, l1_ratio=0.5, random_state=42))
        ]),
        "Ridge Regression Baseline": Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", Ridge(alpha=1.0, random_state=42))
        ])
    }
    return models
