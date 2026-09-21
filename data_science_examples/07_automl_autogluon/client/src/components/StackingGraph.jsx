import React, { useState } from 'react';
import { Layers, Info, Sparkles, ChevronRight, Zap } from 'lucide-react';

export const StackingGraph = ({ stackingDag = {}, caruanaWeights = {} }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  // Default fallback nodes if loading
  const nodes = stackingDag.nodes || [
    { id: "LightGBM_L1", label: "LightGBM", level: 1, score: 0.9180, type: "base_learner" },
    { id: "CatBoost_L1", label: "CatBoost", level: 1, score: 0.9210, type: "base_learner" },
    { id: "XGBoost_L1", label: "XGBoost", level: 1, score: 0.9150, type: "base_learner" },
    { id: "NeuralNetFastAI_L1", label: "NeuralNet FastAI", level: 1, score: 0.8980, type: "base_learner" },
    { id: "RandomForest_L1", label: "Random Forest", level: 1, score: 0.8870, type: "base_learner" },
    { id: "ExtraTrees_L1", label: "Extra Trees", level: 1, score: 0.8810, type: "base_learner" },
    { id: "LightGBM_L2_Stack", label: "LightGBM (L2 Stack)", level: 2, score: 0.9340, type: "stacker" },
    { id: "WeightedEnsemble_L3", label: "WeightedEnsemble_L3 (Caruana)", level: 3, score: 0.9420, type: "meta_ensemble" }
  ];

  const l1Nodes = nodes.filter(n => n.level === 1);
  const l2Nodes = nodes.filter(n => n.level === 2);
  const l3Nodes = nodes.filter(n => n.level === 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08))', borderColor: 'var(--border-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Layers size={18} style={{ color: 'var(--accent-cyan-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan-bright)' }}>
                Multi-Layer Stacking Directed Acyclic Graph (DAG)
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              AutoGluon Multi-Level Stacking & OOF Meta-Feature Flow
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Shows how Level 1 Out-of-Fold (OOF) cross-validation predictions feed into Level 2 meta-stackers and culminate in Level 3 Caruana greedy weighted selection.
            </p>
          </div>
        </div>
      </div>

      {/* SVG Interactive Architecture Canvas */}
      <div className="card" style={{ background: 'rgba(8, 9, 24, 0.95)', padding: '1.5rem', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '2rem', minHeight: '380px' }}>
          {/* Level 1 Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan-bright)', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }}></span>
              <span>Level 1: Base Learners (6 Models)</span>
            </div>

            {l1Nodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                style={{
                  background: selectedNode?.id === n.id ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedNode?.id === n.id ? 'var(--accent-cyan-bright)' : 'var(--border-subtle)'}`,
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#fff' }}>{n.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Level 1 Prototype</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                  {n.score}
                </div>
              </div>
            ))}
          </div>

          {/* Level 2 Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-violet-bright)', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-violet)' }}></span>
              <span>Level 2: OOF Stacking</span>
            </div>

            {l2Nodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                style={{
                  background: selectedNode?.id === n.id ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-secondary)',
                  border: `1px solid ${selectedNode?.id === n.id ? 'var(--accent-violet-bright)' : 'var(--border-violet)'}`,
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-glow-violet)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>{n.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Trained on [X_raw + 6 OOF Probabilities]
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Validation Metric</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--accent-violet-bright)' }}>
                    {n.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Level 3 Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald-bright)', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
              <span>Level 3: Caruana Ensemble</span>
            </div>

            {l3Nodes.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNode(n)}
                style={{
                  background: selectedNode?.id === n.id ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 18, 40, 0.95))',
                  border: '1px solid var(--accent-emerald-bright)',
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-emerald-bright)' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{n.label}</div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                  Greedy forward selection with replacement
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald-bright)', marginBottom: '0.2rem' }}>Caruana Weights:</div>
                  <div>• LightGBM_L2: 42%</div>
                  <div>• CatBoost_L1: 25%</div>
                  <div>• NeuralNet_L1: 18%</div>
                  <div>• XGBoost_L1: 15%</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Champion Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                    {n.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
