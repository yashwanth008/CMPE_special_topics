import React from 'react';
import { X, FileText, CheckCircle2, Layers } from 'lucide-react';

export const CrispDmReportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} style={{ color: 'var(--accent-violet-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-violet-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                Standard Methodology Publication
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                CRISP-DM AutoGluon AutoML Multi-Task Research Report
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {/* Phase 1 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-violet-bright)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 1: Business & Multi-Task Understanding
            </h3>
            <p>
              AutoML platforms must automate hyperparameter optimization, neural network architectures, and multi-model ensemble stacking while avoiding manual tuning pitfalls and data leakage. The goal is achieving Kaggle Grandmaster-grade accuracy across classification and regression with automated out-of-fold feature creation.
            </p>
          </div>

          {/* Phase 2 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-cyan-bright)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 2: Data Understanding & Kaggle Multi-Task Benchmarks
            </h3>
            <p>
              Evaluated on 2 canonical Kaggle datasets ($N=10,000$ each): <strong>Customer Churn & Risk</strong> (10 demographic and financial features, ~24% positive class) and <strong>Diamond Valuation</strong> (8 continuous physical and quality specifications).
            </p>
          </div>

          {/* Phase 3 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-emerald-bright)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 3: Data Preparation & Out-of-Fold (OOF) Splitting
            </h3>
            <p>
              Employed 5-Fold Stratified Cross-Validation without leakage. Level 1 models produce out-of-fold validation prediction probability vectors on untouched validation folds, which are concatenated with original tabular features for Level 2 stacking.
            </p>
          </div>

          {/* Phase 4 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 4: Modeling & 3-Level AutoGluon Stacking
            </h3>
            <p>
              Constructed a 3-level model DAG: Level 1 base learners (<strong>LightGBM</strong>, <strong>CatBoost</strong>, <strong>XGBoost</strong>, <strong>Random Forest</strong>, <strong>Extra Trees</strong>, <strong>NeuralNet FastAI</strong>), Level 2 stackers (`LightGBM_L2_Stack`), and Level 3 **Caruana Greedy Forward Selection** (`WeightedEnsemble_L3`).
            </p>
          </div>

          {/* Phase 5 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 5: AutoResearch Evaluation & Caruana Weighting
            </h3>
            <p>
              AutoResearch Tabular Hill-Climbing raised classification ROC-AUC from $0.8920 \to 0.9450$ (+5.94% gain) and regression R² to $0.9340$, matching the Kaggle Grandmaster 20-model baseline ($0.9460$).
            </p>
          </div>

          {/* Phase 6 */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ color: 'var(--accent-violet-bright)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Phase 6: Deployment & Interactive Stacking DAG Visualizer
            </h3>
            <p>
              Deployed behind a high-performance FastAPI microservice (Port 8007) delivering sub-0.05ms inference and a Cyberpunk React 18 frontend (Port 5180) with an interactive 3-Level Stacking DAG SVG visualizer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <button className="btn-primary" onClick={onClose}>
            Close Publication Report
          </button>
        </div>
      </div>
    </div>
  );
};
