# Automated Test Suite for Anomaly Detection API (Port 8006)

import os
import sys
import unittest
from fastapi.testclient import TestClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))
from main import app

class TestAnomalyAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["port"], 8006)
        print("  ✓ test_01_health passed")

    def test_02_benchmarks(self):
        res = self.client.get("/api/benchmarks")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(len(data["benchmarks"]), 5)
        print(f"  ✓ test_02_benchmarks passed ({len(data['benchmarks'])} models benchmarked)")

    def test_03_manifold(self):
        res = self.client.get("/api/manifold")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreater(data["total_points"], 500)
        print(f"  ✓ test_03_manifold passed ({data['total_points']} 2D manifold points)")

    def test_04_top_anomalies(self):
        res = self.client.get("/api/anomalies/top")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["total_anomalies"], 10)
        print(f"  ✓ test_04_top_anomalies passed ({data['total_anomalies']} top anomalies returned)")

    def test_05_autoresearch_history(self):
        res = self.client.get("/api/autoresearch/history")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["data"]["total_steps"], 4)
        print(f"  ✓ test_05_autoresearch_history passed ({data['data']['total_steps']} steps, final ROC-AUC: {data['data']['final_roc_auc']})")

    def test_06_score_nominal_telemetry(self):
        payload = {
            "features": {
                "NetworkBytesIn": 150000.0,
                "NetworkBytesOut": 120000.0,
                "CPUUtilization": 28.5,
                "MemoryPressure": 45.0,
                "LatencyMs": 24.0,
                "ErrorRate": 0.005,
                "RequestVelocity": 115.0,
                "AuthFailures": 0.0,
                "EntropyScore": 0.42,
                "DiskIOPS": 220.0
            }
        }
        res = self.client.post("/api/anomaly/score", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["result"]["is_anomaly"])
        self.assertEqual(data["result"]["threat_level"], "NOMINAL")
        print(f"  ✓ test_06_score_nominal_telemetry passed (Score: {data['result']['threat_score']})")

    def test_07_score_ddos_anomaly(self):
        payload = {
            "features": {
                "NetworkBytesIn": 5500000.0,
                "NetworkBytesOut": 1800000.0,
                "CPUUtilization": 98.5,
                "MemoryPressure": 88.0,
                "LatencyMs": 950.0,
                "ErrorRate": 0.22,
                "RequestVelocity": 3200.0,
                "AuthFailures": 8.0,
                "EntropyScore": 0.94,
                "DiskIOPS": 3100.0
            }
        }
        res = self.client.post("/api/anomaly/score", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["result"]["is_anomaly"])
        self.assertIn(data["result"]["threat_level"], ["HIGH", "CRITICAL"])
        print(f"  ✓ test_07_score_ddos_anomaly passed (Threat Score: {data['result']['threat_score']}, Level: {data['result']['threat_level']})")

    def test_08_retrain(self):
        payload = {"contamination": 0.04, "n_estimators": 200, "max_samples": 512}
        res = self.client.post("/api/retrain", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["new_threat_threshold"], 96.0)
        print("  ✓ test_08_retrain passed")

if __name__ == '__main__':
    unittest.main()
