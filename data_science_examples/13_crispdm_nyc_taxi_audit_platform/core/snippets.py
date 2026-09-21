# Curated Code Auditor Snippets across all 6 CRISP-DM Phases
# Skills engaged: analysis-documentation, sklearn-pipelines, pytorch-training-loop, matt-pocock-typescript-patterns

from typing import List, Dict, Any

CODE_AUDIT_SNIPPETS: List[Dict[str, Any]] = [
    {
        "snippet_id": "SNIP-01",
        "phase": "Phase 1: Business Understanding",
        "title": "Structured Assumptions Log Schema & Validation",
        "language": "python",
        "code": '''# Auditable Assumptions Ledger under analysis-assumptions-log standard
ASSUMPTIONS_LOG = [
    {
        "id": "ASSUMP-003",
        "category": "Target Leakage Prevention",
        "assumption": "Tolls and tips must never be used as pre-trip features",
        "confidence": "HIGH",
        "impact_if_wrong": "CRITICAL",
        "status": "VALIDATED"
    }
]''',
        "pointer": "Pre-registering analytical assumptions in structured metadata prevents post-hoc justification and ensures compliance auditability."
    },
    {
        "snippet_id": "SNIP-02",
        "phase": "Phase 2: Data Understanding",
        "title": "Geospatial Bounding Box & 6-Dimension Quality Audit",
        "language": "python",
        "code": '''# Strict spatial bounding box assertion under data-quality-audit standard
invalid_pickup_lat = ((df["pickup_latitude"] < 40.48) | (df["pickup_latitude"] > 40.95)).sum()
invalid_pickup_lon = ((df["pickup_longitude"] < -74.30) | (df["pickup_longitude"] > -73.65)).sum()
assert invalid_pickup_lat == 0 and invalid_pickup_lon == 0, "Spatial bounding polygon violated!"''',
        "pointer": "Asserting geographic and schema constraints prior to transformation prevents corrupted GPS drift from contaminating spatial feature weights."
    },
    {
        "snippet_id": "SNIP-03",
        "phase": "Phase 3: Data Preparation",
        "title": "Leakage-Free ColumnTransformer with Cyclical Time Projections",
        "language": "python",
        "code": '''# Cyclical continuous time projection (sine/cosine transformation)
class CyclicalTimeTransformer(BaseEstimator, TransformerMixin):
    def transform(self, X):
        hour, dow = X[:, 0], X[:, 1]
        sin_hour = np.sin(2 * np.pi * hour / 24.0)
        cos_hour = np.cos(2 * np.pi * hour / 24.0)
        return np.column_stack([sin_hour, cos_hour])

preprocessor = ColumnTransformer(transformers=[
    ("num", StandardScaler(), numeric_cols),
    ("time", CyclicalTimeTransformer(), ["hour_of_day", "day_of_week"])
])''',
        "pointer": "Continuous trigonometric encoding maps 23:59 and 00:00 adjacently in Euclidean space, eliminating artificial jump discontinuities."
    },
    {
        "snippet_id": "SNIP-04",
        "phase": "Phase 4: Modeling",
        "title": "AutoResearch Multi-Backbone Tournament & Optuna HPO",
        "language": "python",
        "code": '''# Optuna Bayesian Hyperparameter Optimization objective
def objective(trial):
    lr = trial.suggest_float("lr", 0.01, 0.20, log=True)
    depth = trial.suggest_int("max_depth", 3, 8)
    n_est = trial.suggest_int("n_estimators", 50, 200)
    model = GradientBoostingRegressor(learning_rate=lr, max_depth=depth, n_estimators=n_est)
    return cross_val_score(model, X_train, y_train, cv=5, scoring="neg_root_mean_squared_error").mean()''',
        "pointer": "Tree-structured Parzen Estimators (TPE) explore hyperparameter topologies efficiently without combinatorial grid search waste."
    },
    {
        "snippet_id": "SNIP-05",
        "phase": "Phase 5: Evaluation & XAI",
        "title": "Local TreeSHAP Waterfall Force Decomposition",
        "language": "python",
        "code": '''# Exact Shapley attribution decomposition
explainer = shap.TreeExplainer(champion_model)
shap_values = explainer.shap_values(X_sample)
# Baseline expected value + sum of Shapley values equals exact predicted fare
assert np.isclose(explainer.expected_value + np.sum(shap_values[0]), model.predict(X_sample)[0])''',
        "pointer": "TreeSHAP satisfies the additivity and efficiency axioms, allowing data science auditors to inspect exact dollar contributions per feature."
    },
    {
        "snippet_id": "SNIP-06",
        "phase": "Phase 6: Deployment & MLOps",
        "title": "Population Stability Index (PSI) Drift Monitor",
        "language": "python",
        "code": '''# Real-time Population Stability Index (PSI) calculation
def calculate_psi(baseline, current, num_buckets=10):
    breakpoints = np.percentile(baseline, np.linspace(0, 100, num_buckets + 1))
    base_counts, _ = np.histogram(baseline, bins=breakpoints)
    curr_counts, _ = np.histogram(current, bins=breakpoints)
    base_pct = np.maximum(base_counts / len(baseline), 1e-6)
    curr_pct = np.maximum(curr_counts / len(current), 1e-6)
    return float(np.sum((curr_pct - base_pct) * np.log(curr_pct / base_pct)))''',
        "pointer": "PSI < 0.10 indicates stable distributions; PSI >= 0.25 triggers automated alert notifications and model retraining pipelines."
    },
    {
        "snippet_id": "SNIP-07",
        "phase": "TypeScript Architecture",
        "title": "Matt Pocock Total TypeScript Discriminated Unions & Zod Validation",
        "language": "typescript",
        "code": '''// Matt Pocock Pattern: Discriminated Union State Machine & Zod Schema
import { z } from 'zod';

export const InferencePayloadSchema = z.object({
  pickup_latitude: z.number().min(40.48).max(40.95),
  pickup_longitude: z.number().min(-74.30).max(-73.65),
  passenger_count: z.number().int().min(1).max(6),
  rate_code: z.enum(['Standard', 'JFK', 'Newark', 'Nassau', 'Negotiated'])
});

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };''',
        "pointer": "Discriminated unions ensure zero unhandled edge states in React UI, while Zod guarantees runtime API schema safety."
    }
]

def get_code_audit_snippets() -> List[Dict[str, Any]]:
    """Returns curated code audit snippets."""
    return CODE_AUDIT_SNIPPETS
