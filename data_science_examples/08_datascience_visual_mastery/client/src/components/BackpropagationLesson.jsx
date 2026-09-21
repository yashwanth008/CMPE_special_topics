import React, { useState } from 'react';
import { GitBranch, Layers, CheckCircle2, Sliders, Play, Cpu, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

export const BackpropagationLesson = ({ moduleData = {}, onComplete }) => {
  const [weightW, setWeightW] = useState(2.0);
  const [inputX, setInputX] = useState(1.5);
  const [simResult, setSimResult] = useState({
    forward: { input_x: 1.5, weight_w: 2.0, bias_b: 0.5, pre_activation_z: 3.5, activation_a: 0.9707, loss: 0.00043 },
    backward: { upstream_dL_da: -0.0293, local_da_dz: 0.0284, local_dz_dw: 1.5, delta: -0.000833, weight_gradient_dL_dw: -0.00125, bias_gradient_dL_db: -0.000833 }
  });

  const handleWeightChange = async (val) => {
    const w = parseFloat(val);
    setWeightW(w);
    try {
      const res = await api.simulateBackprop({ w, x: inputX, target: 1.0 });
      if (res.success) setSimResult(res.result);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = async (val) => {
    const x = parseFloat(val);
    setInputX(x);
    try {
      const res = await api.simulateBackprop({ w: weightW, x, target: 1.0 });
      if (res.success) setSimResult(res.result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="lesson-container">
      {/* Left: Comprehensive Textual Narrative */}
      <div className="lesson-article">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(244, 63, 94, 0.08))', borderColor: 'var(--border-indigo)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-violet-bright)', textTransform: 'uppercase' }}>
            Deep Learning Core & Automatic Differentiation
          </span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
            {moduleData.title || "The Chain Rule & Backpropagation Mechanics"}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {moduleData.subtitle}
          </p>

          <div style={{ marginTop: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-violet-bright)' }}>
            Chain Rule: dL/dw = (dL/dy) · (dy/dh) · (dh/dw)
          </div>
        </div>

        {moduleData.sections?.map((sec, i) => (
          <div key={i} className="lesson-section">
            <h3>
              <span style={{ color: 'var(--accent-violet-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>0{i+1}.</span>
              <span>{sec.heading}</span>
            </h3>
            <p>{sec.content}</p>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onComplete} id="btn-complete-bp">
            <CheckCircle2 size={15} />
            <span>Mark Module Complete & Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Right: Live Interactive Single-Neuron Forward & Backward Simulator */}
      <div className="interactive-sidebar">
        <div className="card" style={{ borderColor: 'var(--border-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Cpu size={16} style={{ color: 'var(--accent-violet-bright)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              Neuron Forward & Backward Flow
            </h4>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Modify neuron weight and input; observe forward activation caching and backward δ gradient routing.
          </p>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Neuron Weight (w)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet-bright)', fontWeight: 800 }}>{weightW}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={weightW}
                onChange={(e) => handleWeightChange(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-violet)' }}
              />
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Input Signal (x)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 800 }}>{inputX}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={inputX}
                onChange={(e) => handleInputChange(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* Forward Pass Cache */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid var(--border-cyan)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', fontSize: '0.72rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-cyan-bright)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              1. Forward Pass (Cached Activations)
            </div>
            <div>• Pre-activation z = w·x + b = <strong style={{ fontFamily: 'var(--font-mono)' }}>{simResult.forward?.pre_activation_z}</strong></div>
            <div>• Output a = σ(z) = <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)' }}>{simResult.forward?.activation_a}</strong></div>
            <div>• Loss L = 0.5(a - 1)² = <strong style={{ fontFamily: 'var(--font-mono)' }}>{simResult.forward?.loss}</strong></div>
          </div>

          {/* Backward Pass Routing */}
          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid var(--border-indigo)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.72rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-violet-bright)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              2. Backward Pass (Chain Rule Gradients)
            </div>
            <div>• Upstream dL/da = <strong style={{ fontFamily: 'var(--font-mono)' }}>{simResult.backward?.upstream_dL_da}</strong></div>
            <div>• Local slope da/dz = <strong style={{ fontFamily: 'var(--font-mono)' }}>{simResult.backward?.local_da_dz}</strong></div>
            <div>• Delta δ = dL/dz = <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-bright)' }}>{simResult.backward?.delta}</strong></div>
            <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
              • Weight Gradient dL/dw = δ·x = <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet-bright)' }}>{simResult.backward?.weight_gradient_dL_dw}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
