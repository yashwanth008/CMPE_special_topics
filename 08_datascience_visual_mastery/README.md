# 🎓 Data Science & Machine Learning Visual Foundations

An interactive visual curriculum and textbook teaching foundational ML and Data Science concepts with real-time mathematical simulators, interactive chapter quizzes, and interview flashcards.

---

## 📸 Comprehensive Visual Tour

### 1. Module 1: Probabilistic Classification & Live Napkin Bayes
*Explains the conditional independence assumption with an interactive Spam/Ham prior and likelihood slider simulator.*
![Probabilistic Bayes](./screenshots/mastery_probabilistic_bayes.png)

### 2. Module 2: Model Evaluation, Confusion Matrices & PR Curves
*Interactive classification threshold slider demonstrating the fundamental Trade-off between Precision and Recall.*
![Evaluation & PR Tradeoffs](./screenshots/mastery_evaluation_pr_tradeoffs.png)

### 3. Module 3: Differential Calculus, Derivatives & Gradient Descent
*Interactive tangent slope visualizer and gradient descent step simulator.*
![Calculus & Gradients](./screenshots/mastery_calculus_gradients.png)

### 4. Module 4: Chain Rule & Backpropagation Mechanics
*Forward and backward pass step simulator through computational graphs.*
![Chain Rule Backprop](./screenshots/mastery_chain_rule_backprop.png)

### 5. Interactive Master's Chapter Quiz Modal
*Multi-question conceptual quizzes reinforcing each module with immediate explanation feedback.*
![Chapter Quiz](./screenshots/mastery_chapter_quiz.png)

### 6. Interview Prep Flashcard Deck
*High-yield data science interview flashcards covering core theoretical concepts.*
![Interview Flashcards](./screenshots/mastery_interview_deck.png)

---

## 🧠 Autonomous Skills Included

Pre-packaged in `skills/` and `.agents/skills/`:
* `data-science-mastery`: Foundational curriculum builder.
* `visualization-builder`: Dynamic visual math simulator components.
* `reproducible-ml`: Deterministic mathematical proof implementations.

---

## 🚀 Quick Start

```bash
# Backend (FastAPI on Port 8008)
cd server
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8008

# Frontend (Vite React on Port 5181)
cd client
npm install
npm run dev # Open http://localhost:5181/
```
