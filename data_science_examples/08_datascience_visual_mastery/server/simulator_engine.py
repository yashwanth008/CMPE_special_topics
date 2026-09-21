# Mathematical Interactive Simulator Engine for Visual Mastery Platform

import numpy as np
from typing import Dict, Any, List

class MathSimulatorEngine:
    def simulate_bayes_napkin(self, words: List[Dict[str, Any]], prior_spam: float = 0.4, prior_ham: float = 0.6) -> Dict[str, Any]:
        """Calculates live posterior probabilities for words."""
        unnorm_spam = prior_spam
        unnorm_ham = prior_ham

        log_spam = np.log(prior_spam)
        log_ham = np.log(prior_ham)

        for w in words:
            p_s = max(0.001, float(w.get("p_spam", 0.5)))
            p_h = max(0.001, float(w.get("p_ham", 0.5)))
            unnorm_spam *= p_s
            unnorm_ham *= p_h
            log_spam += np.log(p_s)
            log_ham += np.log(p_h)

        total_unnorm = unnorm_spam + unnorm_ham
        posterior_spam = unnorm_spam / total_unnorm if total_unnorm > 0 else 0.5
        posterior_ham = unnorm_ham / total_unnorm if total_unnorm > 0 else 0.5

        return {
            "unnormalized_spam_score": round(unnorm_spam, 6),
            "unnormalized_ham_score": round(unnorm_ham, 6),
            "log_space_spam_score": round(log_spam, 4),
            "log_space_ham_score": round(log_ham, 4),
            "posterior_spam_pct": round(posterior_spam * 100.0, 1),
            "posterior_ham_pct": round(posterior_ham * 100.0, 1),
            "winner": "SPAM" if unnorm_spam > unnorm_ham else "HAM"
        }

    def simulate_confusion_matrix(self, threshold: float = 0.5, total_patients: int = 100) -> Dict[str, Any]:
        """Simulates cancer screening confusion matrix across decision thresholds."""
        # Simulated continuous prediction probabilities for 10 cancer patients and 90 healthy patients
        np.random.seed(42)
        cancer_probs = np.clip(np.random.beta(5, 2, size=10), 0.15, 0.98) # Mostly high
        healthy_probs = np.clip(np.random.beta(1.5, 6, size=90), 0.02, 0.75) # Mostly low

        tp = int(np.sum(cancer_probs >= threshold))
        fn = int(10 - tp)

        fp = int(np.sum(healthy_probs >= threshold))
        tn = int(90 - fp)

        accuracy = (tp + tn) / total_patients
        precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "threshold": round(threshold, 2),
            "tp": tp,
            "fn": fn,
            "fp": fp,
            "tn": tn,
            "accuracy_pct": round(accuracy * 100.0, 1),
            "precision_pct": round(precision * 100.0, 1),
            "recall_pct": round(recall * 100.0, 1),
            "f1_pct": round(f1 * 100.0, 1)
        }

    def simulate_gradient_descent(self, eta: float = 0.1, n_steps: int = 6, x0: float = 2.0, y0: float = 1.0) -> Dict[str, Any]:
        """Simulates 2D bowl gradient descent f(x, y) = x^2 + 3y^2."""
        trajectory = []
        x, y = float(x0), float(y0)

        is_diverging = False

        for step in range(n_steps + 1):
            loss = float(x**2 + 3 * y**2)
            grad_x = float(2 * x)
            grad_y = float(6 * y)

            trajectory.append({
                "step": step,
                "x": round(x, 4),
                "y": round(y, 4),
                "loss": round(loss, 4),
                "grad": [round(grad_x, 4), round(grad_y, 4)],
                "grad_norm": round(float(np.sqrt(grad_x**2 + grad_y**2)), 4)
            })

            if loss > 1000.0 or np.isnan(loss):
                is_diverging = True
                break

            # Update step
            x = x - eta * grad_x
            y = y - eta * grad_y

        return {
            "function": "f(x, y) = x^2 + 3y^2",
            "eta": eta,
            "is_diverging": is_diverging,
            "trajectory": trajectory
        }

    def simulate_backpropagation(self, w: float = 2.0, x: float = 1.5, target: float = 1.0) -> Dict[str, Any]:
        """Simulates single-neuron forward cache and backward gradient propagation."""
        b = 0.5
        z = float(w * x + b) # Pre-activation
        a = float(1.0 / (1.0 + np.exp(-z))) # Sigmoid activation
        loss = float(0.5 * (a - target)**2) # MSE Loss

        # Backward pass
        dL_da = float(a - target)
        da_dz = float(a * (1.0 - a)) # Sigmoid derivative
        dz_dw = float(x)
        dz_db = 1.0

        delta = dL_da * da_dz
        dL_dw = delta * dz_dw
        dL_db = delta * dz_db

        return {
            "forward": {
                "input_x": x,
                "weight_w": w,
                "bias_b": b,
                "pre_activation_z": round(z, 4),
                "activation_a": round(a, 4),
                "loss": round(loss, 6)
            },
            "backward": {
                "upstream_dL_da": round(dL_da, 6),
                "local_da_dz": round(da_dz, 6),
                "local_dz_dw": round(dz_dw, 6),
                "delta": round(delta, 6),
                "weight_gradient_dL_dw": round(dL_dw, 6),
                "bias_gradient_dL_db": round(dL_db, 6)
            }
        }

simulator = MathSimulatorEngine()
