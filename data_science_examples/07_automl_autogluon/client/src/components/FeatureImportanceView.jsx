import React from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

export const FeatureImportanceView = ({ featureImportance = [] }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-violet)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <BarChart3 size={18} style={{ color: 'var(--accent-violet-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-violet-bright)' }}>
                AutoGluon Permutation & Out-of-Fold Feature Importance
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Global Feature Attribution Across Ensemble Stack
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Computes post-hoc permutation score drop ($\Delta \text{Metric}$) when individual features are shuffled across validation folds.
            </p>
          </div>
        </div>
      </div>

      {/* Importance Bar Chart */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {featureImportance.map((f, idx) => (
            <div key={f.feature}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  #{idx + 1} {f.feature}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 800 }}>
                  {f.percentage}% ({f.importance})
                </span>
              </div>
              <div style={{ width: '100%', height: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, f.percentage * 3.2)}%`,
                    height: '100%',
                    background: 'linear-gradient(to right, var(--accent-violet), var(--accent-cyan))',
                    borderRadius: 'var(--radius-full)'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
