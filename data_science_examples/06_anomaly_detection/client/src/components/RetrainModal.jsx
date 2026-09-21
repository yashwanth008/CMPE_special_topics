import React, { useState } from 'react';
import { X, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

export const RetrainModal = ({ isOpen, onClose, onRetrained }) => {
  const [contamination, setContamination] = useState(0.035);
  const [nEstimators, setNEstimators] = useState(250);
  const [maxSamples, setMaxSamples] = useState(512);
  const [isRetraining, setIsRetraining] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await api.retrainModel({
        contamination,
        n_estimators: nEstimators,
        max_samples: maxSamples
      });
      if (res.success) {
        setResult(res);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        if (onRetrained) onRetrained(res.new_threat_threshold);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 8, 19, 0.95))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: 'var(--accent-cyan-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                Online Retraining Studio
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Isolation Forest & Threshold Calibrator
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Sliders */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Expected Contamination Rate (nu)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 800 }}>{(contamination * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.10"
              step="0.005"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Number of Isolation Trees (n_estimators)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo-bright)', fontWeight: 800 }}>{nEstimators} Trees</span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="25"
              value={nEstimators}
              onChange={(e) => setNEstimators(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Subsample Size per Tree (max_samples)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose-bright)', fontWeight: 800 }}>{maxSamples} Samples</span>
            </div>
            <input
              type="range"
              min="128"
              max="1024"
              step="64"
              value={maxSamples}
              onChange={(e) => setMaxSamples(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
            />
          </div>

          {result && (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald-bright)', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>{result.message} (New Threshold: {result.new_threat_threshold})</span>
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
            <span>{isRetraining ? 'Calibrating...' : 'Trigger Model Retrain'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
