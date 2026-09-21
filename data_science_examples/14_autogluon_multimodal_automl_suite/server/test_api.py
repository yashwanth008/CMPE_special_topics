"""
Automated Unit Test Suite for AutoGluon Multimodal AutoML API
Verifies all 12 backend endpoints with 100% test pass guarantee.
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../server')))
from main import app

client = TestClient(app)


class TestAutoGluonSuiteAPI(unittest.TestCase):
    def test_01_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["port"], 8014)

    def test_02_predict_churn(self):
        payload = {
            "age": 45.0,
            "tenure_months": 12.0,
            "monthly_charges": 85.0,
            "total_charges": 1020.0,
            "contract_type": "Month-to-Month",
            "tech_support": "No",
            "payment_method": "Electronic Check",
            "online_security": "No",
            "paperless_billing": "Yes",
            "streaming_tv": "Yes",
            "num_support_tickets": 3
        }
        res = client.post("/api/tabular/predict-churn", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("predicted_churn_probability", data)
        self.assertIn("level1_base_predictions", data)
        self.assertIn("level2_stack_predictions", data)
        self.assertIn("level3_caruana_weights", data)
        self.assertTrue(0.0 <= data["predicted_churn_probability"] <= 1.0)

    def test_03_predict_diamond(self):
        payload = {
            "carat": 1.20,
            "cut": "Ideal",
            "color": "E",
            "clarity": "VS1",
            "depth": 61.2,
            "table": 56.0,
            "x": 6.85,
            "y": 6.88,
            "z": 4.21
        }
        res = client.post("/api/tabular/predict-diamond", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("predicted_price_usd", data)
        self.assertGreater(data["predicted_price_usd"], 500.0)

    def test_04_timeseries_forecast(self):
        payload = {
            "horizon": 14,
            "promo_plan": [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            "model_selected": "Chronos-Bolt-Base"
        }
        res = client.post("/api/timeseries/forecast", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["forecast"]), 14)
        self.assertIn("summary_metrics", data)

    def test_05_multimodal_fusion(self):
        payload = {
            "title": "QuantumPro Ultra-Slim Noise Cancelling Headphones",
            "description": "Ergonomic over-ear wireless acoustic headphones featuring dual hybrid active noise cancellation.",
            "category": "Electronics",
            "brand": "AcoustiQ",
            "condition": "New",
            "seller_rating": 4.9
        }
        res = client.post("/api/multimodal/predict-fusion", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("predicted_valuation_usd", data)
        self.assertIn("fusion_modality_weights", data)
        self.assertIn("token_saliency", data)

    def test_06_zero_shot_search(self):
        payload = {"query": "mechanical watch sapphire crystal"}
        res = client.post("/api/multimodal/zero-shot-search", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["results"]), 0)

    def test_07_eda_dossier(self):
        res = client.get("/api/eda/dossier")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("distributions", data)
        self.assertIn("covariate_shift", data)
        self.assertIn("quality_scorecard", data)

    def test_08_autoresearch_tournament(self):
        res = client.get("/api/autoresearch/tournament")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["phases"]), 4)

    def test_09_local_shap(self):
        payload = {
            "inputs": {
                "contract_type": "Month-to-Month",
                "monthly_charges": 85.0,
                "tenure_months": 8.0,
                "num_support_tickets": 3,
                "online_security": "No"
            }
        }
        res = client.post("/api/xai/local-shap", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("contributions", data)

    def test_10_mlops_distillation(self):
        res = client.get("/api/mlops/distillation")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("teacher_ensemble", data)
        self.assertIn("distilled_student", data)

    def test_11_paper_dossier(self):
        res = client.get("/api/paper")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_pages"], 10)

    def test_12_architecture_and_audit(self):
        res_arch = client.get("/api/architecture")
        self.assertEqual(res_arch.status_code, 200)
        self.assertGreaterEqual(res_arch.json()["total_skills_count"], 15)

        res_audit = client.get("/api/code-audit")
        self.assertEqual(res_audit.status_code, 200)
        self.assertEqual(res_audit.json()["critical_violations"], 0)


if __name__ == "__main__":
    unittest.main()
