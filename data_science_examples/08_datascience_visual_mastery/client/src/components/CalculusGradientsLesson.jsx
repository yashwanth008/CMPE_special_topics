import React, { useState } from 'react';
import { TrendingDown, Activity, Sliders, CheckCircle2, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { api } from '../utils/api';

export const CalculusGradientsLesson = ({ moduleData = {}, onComplete }) => {
  const [eta, setEta] = useState(0.1);
  const [steps, setSteps] = useState(4);
  const [simResult, setSimResult] = useState({
    function: "f(x, y) = x^2 + 3y^2",
    eta: 0.1,
    is_diverging: false,
    trajectory: [
      { step: 0, x: 2.0, y: 1.0, loss: 7.0, grad: [4.0, 6.0] },
      { step: 1, x: 1.6, y: 0.4, loss: 3.04, grad: [3.2, 2.4] },
      { step: 2, x: 1.28, y: 0.16, loss: 1.715, grad: [2.56, 0.96] },
      { step: 3, x: 1.024, y: 0.064, loss: 1.061, grad: [2.048, 0.384] }
    ]
  });

  const handleEtaChange = async (val) => {
    const newEta = parseFloat(val);
    setEta(newEta);
    try {
      const res = await api.simulateDescent({
        eta: newEta,
        n_steps: steps,
        x0: 2.0,
        y0: 1.0
      });
      if (res.success) {
        setSimResult(res.result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isDiverging = simResult.is_diverging || eta >= 0.35;

  return (
    <div className="lesson-container">
      {/* Left: Comprehensive Textual Narrative */}
      <div className="lesson-article">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(99, 102, 241, 0.08))', borderColor: 'var(--border-indigo)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
            Mathematical Optimization & Loss Landscapes
          </span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
            {moduleData.title || "Differential Calculus & Gradient Descent"}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {moduleData.subtitle}
          </p>

          <div style={{ marginTop: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-amber)' }}>
            Update Rule: θ ← θ - η ∇L(θ)
          </div>
        </div>

        {moduleData.sections?.map((sec, i) => (
          <div key={i} className="lesson-section">
            <h3>
              <span style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>0{i+1}.</span>
              <span>{sec.heading}</span>
            </h3>
            <p>{sec.content}</p>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onComplete} id="btn-complete-calc">
            <CheckCircle2 size={15} />
            <span>Mark Module Complete & Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Right: Live Interactive Gradient Descent Bowl Simulator */}
      <div className="interactive-sidebar">
        <div className="card" style={{ borderColor: isDiverging ? 'var(--accent-rose)' : 'var(--border-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Activity size={16} style={{ color: isDiverging ? 'var(--accent-rose)' : 'var(--accent-amber)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              Loss Bowl Descent Simulator
            </h4>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Tune learning rate η on bowl f(x, y) = x² + 3y² starting from (2, 1).
          </p>

          {/* Learning Rate Slider */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Learning Rate (η)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: isDiverging ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 800 }}>η = {eta}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.45"
              step="0.02"
              value={eta}
              onChange={(e) => handleEtaChange(e.target.value)}
              style={{ width: '100%', accentColor: isDiverging ? 'var(--accent-rose)' : 'var(--accent-amber)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span>0.05 (Slow)</span>
              <span>0.1 (Optimal)</span>
              <span style={{ color: 'var(--accent-rose)' }}>0.4 (Overshoot & Explode)</span>
            </div>
          </div>

          {/* Divergence Warning */}
          {isDiverging ? (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.65rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose-bright)', fontSize: '0.74rem', fontWeight: 700 }}>
              <AlertTriangle size={15} />
              <span>Overshoot Divergence! Loss is exploding because η &gt; 1/3.</span>
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--accent-emerald)', padding: '0.65rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald-bright)', fontSize: '0.74rem', fontWeight: 700 }}>
              <CheckCircle2 size={15} />
              <span>Stable Descent: Loss converges smoothly toward zero.</span>
            </div>
          )}

          {/* Trajectory Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
            {simResult.trajectory?.map((pt) => (
              <div key={pt.step} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Step {pt.step}: ({pt.x}, {pt.y})</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: pt.loss > 10 ? 'var(--accent-rose)' : 'var(--accent-cyan-bright)' }}>
                  Loss = {pt.loss}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
