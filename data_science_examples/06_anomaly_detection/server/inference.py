# High-Speed In-Memory Inference & Threat Scoring Engine

import os
import json
import numpy as np
from typing import Dict, Any, List

ARTIFACTS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models/anomaly_artifacts.json'))

class AnomalyInferenceEngine:
    def __init__(self):
        self.artifacts = None
        self.feature_stats = {}
        self.threshold = 68.0
        self.load_artifacts()

    def load_artifacts(self):
        if os.path.exists(ARTIFACTS_PATH):
            with open(ARTIFACTS_PATH, 'r', encoding='utf-8') as f:
                self.artifacts = json.load(f)
                self.feature_stats = self.artifacts.get("feature_stats", {})
                self.threshold = self.artifacts.get("threat_threshold", 68.0)

    def score_single_telemetry(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Calculates real-time anomaly threat score and feature attribution."""
        if not self.feature_stats:
            self.load_artifacts()

        z_scores = []
        feature_contributions = []

        for feat_name, stats in self.feature_stats.items():
            val = float(features.get(feat_name, stats["median"]))
            med = stats["median"]
            iqr = max(0.001, stats["iqr"])

            # Robust deviation score: |val - med| / (iqr * 1.35)
            dev = abs(val - med) / (iqr * 1.35)
            z_scores.append(dev)

            contrib_pct = min(100.0, round(dev * 18.0, 1))
            feature_contributions.append({
                "feature": feat_name,
                "current_value": val,
                "median_value": med,
                "deviation_sigma": round(dev, 2),
                "contribution_pct": contrib_pct,
                "is_anomalous": bool(dev > 2.5)
            })

        # Sort feature contributions by highest deviation
        feature_contributions.sort(key=lambda x: x["deviation_sigma"], reverse=True)

        # Composite multi-variate score
        top_3_dev = np.mean(sorted(z_scores, reverse=True)[:3])
        mean_dev = np.mean(z_scores)
        composite_metric = 0.65 * top_3_dev + 0.35 * mean_dev

        # Scale into [0, 100] threat index
        threat_score = min(99.9, max(1.0, round(100.0 / (1.0 + np.exp(-1.4 * (composite_metric - 2.0))), 1)))
        is_anomaly = bool(threat_score >= self.threshold)

        if threat_score >= 85:
            threat_level = "CRITICAL"
        elif threat_score >= self.threshold:
            threat_level = "HIGH"
        elif threat_score >= 45:
            threat_level = "ELEVATED"
        else:
            threat_level = "NOMINAL"

        # Diagnose primary archetype
        if features.get("RequestVelocity", 0) > 800 or features.get("NetworkBytesIn", 0) > 2000000:
            archetype_diag = "Volumetric DDoS Attack Pattern"
        elif features.get("AuthFailures", 0) >= 15:
            archetype_diag = "Credential Stuffing / Brute Force Infiltration"
        elif features.get("MemoryPressure", 0) > 92 and features.get("LatencyMs", 0) > 1500:
            archetype_diag = "Resource Starvation / Memory Leak"
        elif is_anomaly:
            archetype_diag = "Subspace Manifold Anomaly"
        else:
            archetype_diag = "Normal Operational Profile"

        return {
            "threat_score": threat_score,
            "threat_threshold": self.threshold,
            "is_anomaly": is_anomaly,
            "threat_level": threat_level,
            "diagnosed_archetype": archetype_diag,
            "top_contributing_features": feature_contributions[:5],
            "all_features_analyzed": feature_contributions
        }

engine = AnomalyInferenceEngine()
