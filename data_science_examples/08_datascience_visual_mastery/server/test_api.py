# Automated Unit Test Suite for Data Science Visual Mastery Platform (Port 8008)

import os
import sys
import unittest
from fastapi.testclient import TestClient

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))
from main import app

class TestVisualMasteryAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["port"], 8008)
        print("  ✓ test_01_health passed")

    def test_02_get_all_modules(self):
        res = self.client.get("/api/modules")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["modules"]), 4)
        print(f"  ✓ test_02_get_all_modules passed ({len(data['modules'])} modules loaded)")

    def test_03_get_single_module(self):
        res = self.client.get("/api/module/naive_bayes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["module"]["id"], "naive_bayes")
        self.assertGreaterEqual(len(data["module"]["sections"]), 5)
        print("  ✓ test_03_get_single_module passed")

    def test_04_get_quizzes_and_interviews(self):
        res = self.client.get("/api/quizzes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("quizzes", data["data"])
        self.assertIn("interview_flashcards", data["data"])
        print(f"  ✓ test_04_get_quizzes_and_interviews passed ({len(data['data']['quizzes'])} module quiz sets)")

    def test_05_simulate_bayes(self):
        payload = {
            "prior_spam": 0.4,
            "prior_ham": 0.6,
            "words": [
                { "word": "free", "p_spam": 0.7, "p_ham": 0.1 },
                { "word": "money", "p_spam": 0.5, "p_ham": 0.2 },
                { "word": "lunch", "p_spam": 0.1, "p_ham": 0.4 }
            ]
        }
        res = self.client.post("/api/simulate/bayes", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["result"]["winner"], "SPAM")
        self.assertGreater(data["result"]["posterior_spam_pct"], 70.0)
        print(f"  ✓ test_05_simulate_bayes passed (Posterior Spam: {data['result']['posterior_spam_pct']}%)")

    def test_06_simulate_confusion(self):
        payload = { "threshold": 0.5 }
        res = self.client.post("/api/simulate/confusion", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("accuracy_pct", data["result"])
        self.assertIn("f1_pct", data["result"])
        print(f"  ✓ test_06_simulate_confusion passed (F1: {data['result']['f1_pct']}%)")

    def test_07_simulate_descent(self):
        payload = { "eta": 0.1, "n_steps": 4, "x0": 2.0, "y0": 1.0 }
        res = self.client.post("/api/simulate/descent", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["result"]["is_diverging"])
        self.assertEqual(len(data["result"]["trajectory"]), 5)
        print(f"  ✓ test_07_simulate_descent passed (Final Loss: {data['result']['trajectory'][-1]['loss']})")

    def test_08_simulate_backprop_and_manifest(self):
        payload = { "w": 2.0, "x": 1.5, "target": 1.0 }
        res = self.client.post("/api/simulate/backprop", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("delta", data["result"]["backward"])

        res2 = self.client.get("/api/gh-pages-manifest")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(len(data2["projects"]), 8)
        print("  ✓ test_08_simulate_backprop_and_manifest passed (8 projects indexed)")

if __name__ == '__main__':
    unittest.main()
