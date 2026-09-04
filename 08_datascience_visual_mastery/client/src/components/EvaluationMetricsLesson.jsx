import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Sliders, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import { api } from '../utils/api';

export const EvaluationMetricsLesson = ({ moduleData = {}, onComplete }) => {
  const [threshold, setThreshold] = useState(0.5);
  const [simResult, setSimResult] = useState({
    threshold: 0.5,
    tp: 8,
    fn: 2,
    fp: 5,
    tn: 85,
    accuracy_pct: 93.0,
    precision_pct: 61.5,
    recall_pct: 80.0,
    f1_pct: 69.6
  });
  const [costFP, setCostFP] = useState(50);
  const [costFN, setCostFN] = useState(500);

  const handleThresholdChange = async (val) => {
    const t = parseFloat(val);
    setThreshold(t);
    try {
      const res = await api.simulateConfusion(t);
      if (res.success) {
        setSimResult(res.result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="lesson-container">
      {/* Left: Comprehensive Textual Narrative */}
      <div className="lesson-article">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.08))', borderColor: 'var(--border-cyan)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan-bright)', textTransform: 'uppercase' }}>
            Model Evaluation & Performance Diagnostics
          </span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
            {moduleData.title || "Evaluation Metrics That Never Lie"}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {moduleData.subtitle}
          </p>

          <div style={{ marginTop: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-emerald-bright)' }}>
            Harmonic Mean: F₁ = 2 · (Precision · Recall) / (Precision + Recall)
          </div>
        </div>

        {moduleData.sections?.map((sec, i) => (
          <div key={i} className="lesson-section">
            <h3>
              <span style={{ color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>0{i+1}.</span>
              <span>{sec.heading}</span>
            </h3>
            <p>{sec.content}</p>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onComplete} id="btn-complete-eval">
            <CheckCircle2 size={15} />
            <span>Mark Module Complete & Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Right: Live Interactive Confusion Matrix & Threshold Simulator */}
      <div className="interactive-sidebar">
        <div className="card" style={{ borderColor: 'var(--border-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Sliders size={16} style={{ color: 'var(--accent-cyan-bright)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              Decision Threshold Simulator
            </h4>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Slide the decision cutoff T to trade off Precision vs Recall dynamically.
          </p>

          {/* Threshold Slider */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Cutoff Threshold (T)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 800 }}>T = {threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span>0.1 (Aggressive)</span>
              <span>0.5 (Standard)</span>
              <span>0.9 (Conservative)</span>
            </div>
          </div>

          {/* 2x2 Contingency Matrix Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-emerald-bright)', fontWeight: 800 }}>TRUE POSITIVE (TP)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{simResult.tp}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Real Hit</div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-rose-bright)', fontWeight: 800 }}>FALSE NEGATIVE (FN)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{simResult.fn}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Missed Cancer</div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--accent-amber)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', fontWeight: 800 }}>FALSE POSITIVE (FP)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{simResult.fp}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>False Alarm</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-emerald-bright)', fontWeight: 800 }}>TRUE NEGATIVE (TN)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{simResult.tn}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Correct Clear</div>
            </div>
          </div>

          {/* Metric Outputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span>Precision (TP / Alarms):</span>
              <strong style={{ color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)' }}>{simResult.precision_pct}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span>Recall (TP / Real Cancers):</span>
              <strong style={{ color: 'var(--accent-emerald-bright)', fontFamily: 'var(--font-mono)' }}>{simResult.recall_pct}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span>F1 Score (Harmonic Mean):</span>
              <strong style={{ color: 'var(--accent-violet-bright)', fontFamily: 'var(--font-mono)' }}>{simResult.f1_pct}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span>Accuracy (TP+TN / 100):</span>
              <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{simResult.accuracy_pct}%</strong>
            </div>
          </div>
        </div>

        {/* Cost-Sensitive Decision Matrix */}
        <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              Cost-Sensitive Decision Matrix
            </h4>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            In the real world, errors are not equal. Assign a business/clinical cost to each error type and see how the "optimal" threshold shifts.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cost per False Positive</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 700 }}>${costFP}</span>
              </div>
              <input
                type="range" min="1" max="1000" step="1"
                value={costFP}
                onChange={(e) => setCostFP(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cost per False Negative</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)', fontWeight: 700 }}>${costFN}</span>
              </div>
              <input
                type="range" min="1" max="2000" step="1"
                value={costFN}
                onChange={(e) => setCostFN(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Expected Cost at T = {threshold.toFixed(2)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                ${(simResult.fp * costFP + simResult.fn * costFN).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              = ({simResult.fp} FP × ${costFP}) + ({simResult.fn} FN × ${costFN}). Drag the cutoff threshold above and watch this total move — notice how a cheap-FP / expensive-FN cost structure (e.g. cancer screening) always pushes the optimal cutoff lower than a standard 0.5.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
