# Automated Unit Test Suite for AutoGluon AutoML API (Port 8007)

import os
import sys
import unittest
from fastapi.testclient import TestClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))
from main import app

class TestAutoMLAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["port"], 8007)
        print("  ✓ test_01_health passed")

    def test_02_classification_leaderboard(self):
        res = self.client.get("/api/automl/leaderboard?task=classification")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["leaderboard"]), 6)
        self.assertGreaterEqual(data["champion_score"], 0.90)
        print(f"  ✓ test_02_classification_leaderboard passed (Champion AUC: {data['champion_score']})")

    def test_03_regression_leaderboard(self):
        res = self.client.get("/api/automl/leaderboard?task=regression")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["leaderboard"]), 6)
        self.assertGreaterEqual(data["champion_score"], 0.85)
        print(f"  ✓ test_03_regression_leaderboard passed (Champion R2: {data['champion_score']})")

    def test_04_stacking_graph(self):
        res = self.client.get("/api/automl/stacking-graph?task=classification")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("nodes", data["stacking_dag"])
        self.assertIn("edges", data["stacking_dag"])
        print(f"  ✓ test_04_stacking_graph passed ({len(data['stacking_dag']['nodes'])} nodes, {len(data['stacking_dag']['edges'])} edges)")

    def test_05_autoresearch_history(self):
        res = self.client.get("/api/autoresearch/history")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["data"]["total_steps"], 4)
        print(f"  ✓ test_05_autoresearch_history passed ({data['data']['total_steps']} steps, final AUC: {data['data']['final_roc_auc']})")

    def test_06_predict_classification(self):
        payload = {
            "task": "classification",
            "features": {
                "Age": 38,
                "AnnualIncome": 95000,
                "CreditScore": 740,
                "AccountTenure": 6.5,
                "TransactionFrequency": 32,
                "AvgTransactionAmount": 280,
                "BalanceToIncomeRatio": 0.22,
                "SupportTickets": 0,
                "DeviceRiskScore": 12,
                "IsPremiumMember": 1
            }
        }
        res = self.client.post("/api/automl/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["result"]["task"], "classification")
        self.assertIn("probability", data["result"])
        print(f"  ✓ test_06_predict_classification passed (Prediction: {data['result']['prediction_label']}, Prob: {data['result']['probability']})")

    def test_07_predict_regression(self):
        payload = {
            "task": "regression",
            "features": {
                "CaratWeight": 1.50,
                "CutQualityScore": 5,
                "ColorGrade": 6,
                "ClarityGrade": 7,
                "DepthPct": 61.8,
                "TableWidth": 57.0,
                "VolumeMm3": 240.0,
                "CertificationRating": 4
            }
        }
        res = self.client.post("/api/automl/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["result"]["task"], "regression")
        self.assertGreater(data["result"]["estimated_value"], 5000)
        print(f"  ✓ test_07_predict_regression passed (Estimated Value: ${data['result']['estimated_value']:,})")

    def test_08_retrain(self):
        payload = {"task": "classification", "preset": "best_quality", "time_limit_sec": 60}
        res = self.client.post("/api/retrain", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["preset"], "best_quality")
        print("  ✓ test_08_retrain passed")

if __name__ == '__main__':
    unittest.main()
