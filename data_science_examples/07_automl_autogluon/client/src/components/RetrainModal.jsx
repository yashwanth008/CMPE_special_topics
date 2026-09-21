import React, { useState } from 'react';
import { X, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export const RetrainModal = ({ isOpen, onClose, onRetrained }) => {
  const [task, setTask] = useState('classification');
  const [preset, setPreset] = useState('best_quality');
  const [timeLimit, setTimeLimit] = useState(120);
  const [isRetraining, setIsRetraining] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await api.retrain({
        task,
        preset,
        time_limit_sec: timeLimit
      });
      if (res.success) {
        setResult(res);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        if (onRetrained) onRetrained(preset, res.new_champion_score);
      }
    } catch (err) {
      console.error('Retrain failed:', err);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(8, 9, 24, 0.95))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: 'var(--accent-violet-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-violet-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                Online AutoGluon Calibrator
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Stacking Presets & Training Budget Studio
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Target Kaggle Task
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setTask('classification')}
                className={`nav-tab-btn ${task === 'classification' ? 'active' : ''}`}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                Customer Churn (Classification)
              </button>
              <button
                onClick={() => setTask('regression')}
                className={`nav-tab-btn ${task === 'regression' ? 'active' : ''}`}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                Diamond Valuation (Regression)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              AutoGluon Quality Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {['best_quality', 'high_quality', 'medium_quality', 'fast_training'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`btn-secondary ${preset === p ? 'active' : ''}`}
                  style={{
                    padding: '0.6rem',
                    fontSize: '0.75rem',
                    justifyContent: 'center',
                    border: preset === p ? '1px solid var(--accent-violet-bright)' : '1px solid var(--border-subtle)',
                    background: preset === p ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-tertiary)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Training Budget Time Limit (sec)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 800 }}>{timeLimit}s</span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {result && (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald-bright)', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleRetrain} disabled={isRetraining}>
            <Sparkles size={14} />
            <span>{isRetraining ? 'Training AutoGluon Stack...' : 'Fit AutoGluon Stack'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
