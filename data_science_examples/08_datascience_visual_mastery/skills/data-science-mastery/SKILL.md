---
name: data-science-mastery
description: Interactive visual curriculum teaching foundational Machine Learning & Data Science concepts (Naive-Bayes, Confusion Matrix & PR trade-offs, Differential Calculus & Gradients, Chain Rule & Backpropagation) with live math simulators, chapter quizzes, interview flashcards, and GitHub Pages deployment.
---

# Data Science & ML Visual Foundations Skill

This skill documents the automated reproduction, educational curriculum, live mathematical simulators, and static GitHub Pages build of the **Data Science & ML Visual Mastery Platform** (`eighthtest-datascience-mastery`).

---

## 1. Quickstart & Service Architecture

- **FastAPI Microservice (Port 8008)**: `python -m uvicorn main:app --host 127.0.0.1 --port 8008`
- **React 18 + Vite Interactive Textbook (Port 5181)**: `npm run dev`
- **GitHub Pages Static Build**: Standalone zero-dependency single-page build in `static_gh_pages/index.html` and `docs/index.html`.

```
scratch/eighthtest-datascience-mastery/
├── content/                            # Rewritten curriculum modules & interactive lesson specifications
│   ├── naive_bayes_module.json         # Bayesian inference, naive factorizations, napkin arithmetic, Laplace & log-space
│   ├── evaluation_metrics_module.json  # Imbalance trap, Confusion matrix, Precision vs Recall, F1 harmonic mean, Thresholds
│   ├── calculus_gradients_module.json  # Derivatives, tangent lines, partials, ∇f steepest ascent, 1D/2D Gradient Descent, η overshoot
│   ├── backprop_chainrule_module.json  # Composite functions, chain rule, fan-out accumulation, forward cache & backward pass, δ matrix
│   └── quizzes_and_interviews.json     # 16-question quiz bank & technical interview flashcards
├── server/
│   ├── main.py                         # REST API (Port 8008)
│   ├── simulator_engine.py             # Live mathematical simulator engine
│   └── test_api.py                     # 8-test unit verification suite (100% pass)
└── client/
    ├── src/
    │   ├── components/                 # NaiveBayesLesson, EvaluationMetricsLesson, CalculusGradientsLesson, BackpropagationLesson, MasteryQuizModal, InterviewPrepDeck, GhPagesDeploymentModal
    │   └── index.css                   # Editorial Slate & Glassmorphism Design System
    └── vite.config.js                  # Port 5181
```

---

## 2. Core Curriculum Modules

1. **Module 1: Probabilistic Classification & Bayesian Inference**:
   - Bayes' Theorem: $P(c|\text{evidence}) = \frac{P(\text{evidence}|c)P(c)}{P(\text{evidence})}$.
   - Naive conditional independence factorization: $P(x_1, \dots, x_n|c) = \prod P(x_i|c)$.
   - Laplace smoothing: $\frac{\text{count}(w, c) + 1}{\text{count}(c) + V}$.
   - Log-space computation: $\operatorname{argmax}_c [\log P(c) + \sum \log P(x_i|c)]$.

2. **Module 2: Model Evaluation, Confusion Matrices & Threshold Dynamics**:
   - The 99% accuracy trap in class-imbalanced domains.
   - 2x2 Contingency Matrix ($TP, TN, FP, FN$).
   - Precision ($\frac{TP}{TP+FP}$) vs Recall ($\frac{TP}{TP+FN}$).
   - $F_1$ Harmonic Mean: $F_1 = 2 \cdot \frac{P \cdot R}{P + R}$.

3. **Module 3: Differential Calculus, Derivatives & Gradient Descent**:
   - The local tangent slope: $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$.
   - The Gradient Vector $\nabla f = [\frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n}]$ pointing in the direction of steepest ascent.
   - Gradient descent update rule: $\theta \leftarrow \theta - \eta \nabla L(\theta)$.
   - Learning rate overshoot and divergence when $\eta > \frac{1}{3}$.

4. **Module 4: The Chain Rule & Backpropagation Mechanics**:
   - Nested composite functions $L(y(h(w)))$.
   - Chain rule: $\frac{dL}{dw} = \frac{dL}{dy} \cdot \frac{dy}{dh} \cdot \frac{dh}{dw}$.
   - Multivariable fan-out rule (summing gradients across branching downstream paths).
   - Single-neuron forward activation caching ($x, z, a$) and backward error routing ($\delta$).

---

## 3. Automated Verification

Run automated test suite:
```powershell
python server/test_api.py
```
*(8 / 8 tests pass in < 0.10s)*.
