import React, { useState } from 'react';
import { GitBranch, TrendingUp, Sparkles, CheckCircle2, ChevronRight, X, Code2, Sliders, MessageSquare } from 'lucide-react';

export const AutoResearchAutoML = ({ historyData = {} }) => {
  const [selectedStep, setSelectedStep] = useState(null);

  const {
    total_steps = 5,
    initial_roc_auc = 0.8920,
    final_roc_auc = 0.9450,
    net_gain_pct = 5.94,
    champion_model = "WeightedEnsemble_L3 (Caruana Stacking)",
    history = []
  } = historyData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-violet)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <GitBranch size={18} style={{ color: 'var(--accent-violet-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-violet-bright)' }}>
                Autonomous Tabular Hill-Climbing Engine
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              AutoGluon Pipeline Optimization Trajectory
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              4-Phase autonomous search loop optimizing base learner selection, Level 2 out-of-fold meta-features, Level 3 Caruana ensemble weights, and runtime latency pruning.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(8, 9, 24, 0.8)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Initial ROC-AUC</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                {initial_roc_auc.toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Optimized AUC</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                {final_roc_auc.toFixed(4)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Net Trajectory Gain</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                +{net_gain_pct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Timeline Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {history.map((step) => (
          <div
            key={step.step}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: '4px solid var(--accent-violet)'
            }}
            onClick={() => setSelectedStep(step)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                {step.step}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {step.phase}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                  {step.action}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {step.description}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ROC-AUC</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                  {step.metrics.roc_auc.toFixed(4)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet-bright)', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>Inspect Step</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step Inspector Modal */}
      {selectedStep && (
        <div className="modal-overlay" onClick={() => setSelectedStep(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(8, 9, 24, 0.95))' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                  AutoResearch Step Telemetry #{selectedStep.step} • {selectedStep.phase}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  {selectedStep.action}
                </h3>
              </div>
              <button onClick={() => setSelectedStep(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ROC-AUC</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                    {selectedStep.metrics.roc_auc}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accuracy</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                    {selectedStep.metrics.accuracy}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>F1-Score</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                    {selectedStep.metrics.f1_score}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Step Gain</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-violet-bright)' }}>
                    +{selectedStep.gain_pct}%
                  </div>
                </div>
              </div>

              {/* AST Code Diff */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <Code2 size={14} /> AST AutoGluon Pipeline Code Mutation
                </div>
                <pre style={{ background: '#000', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', color: 'var(--accent-emerald-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', overflowX: 'auto' }}>
                  {selectedStep.ast_code_diff}
                </pre>
              </div>

              {/* Parameters Diff */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <Sliders size={14} /> Hyperparameter & Stacking Configuration Diff
                </div>
                <pre style={{ background: '#000', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', overflowX: 'auto' }}>
                  {JSON.stringify(selectedStep.param_diff, null, 2)}
                </pre>
              </div>

              {/* Agent Reflection */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-violet-bright)', marginBottom: '0.25rem' }}>
                  <MessageSquare size={14} /> Autonomous Agent Diagnostic Reflection
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {selectedStep.reflection}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
              <button className="btn-secondary" onClick={() => setSelectedStep(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
