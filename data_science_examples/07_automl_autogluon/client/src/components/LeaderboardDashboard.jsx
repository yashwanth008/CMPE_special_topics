import React, { useState } from 'react';
import { Award, CheckCircle2, Zap, Clock, ShieldCheck, Filter } from 'lucide-react';

export const LeaderboardDashboard = ({ leaderboard = [], presetsComparison = [] }) => {
  const [selectedPreset, setSelectedPreset] = useState('ALL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-violet)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Award size={18} style={{ color: 'var(--accent-violet-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-violet-bright)' }}>
                AutoGluon Stacking Leaderboard & Presets Evaluation
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Multi-Layer Model Hierarchy vs Kaggle SOTA Baseline
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Evaluates individual base learners, multi-layer stacked meta-features, and Caruana weighted combinations against an expert hand-tuned Kaggle 20-model ensemble.
            </p>
          </div>
        </div>
      </div>

      {/* AutoGluon Presets Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {presetsComparison.map((p) => (
          <div
            key={p.preset}
            className="card"
            style={{
              borderLeft: p.is_recommended ? '4px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
              background: p.is_recommended ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 18, 40, 0.95))' : 'var(--bg-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: p.is_recommended ? 'var(--accent-emerald-bright)' : '#fff' }}>
                {p.preset}
              </span>
              {p.is_recommended && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald-bright)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                  Champion
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem', minHeight: '32px' }}>
              {p.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ROC-AUC: <strong style={{ color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)' }}>{p.roc_auc}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>&lt; {p.time_limit_sec}s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Leaderboard Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>AutoGluon Model</th>
              <th>Stacking Level</th>
              <th>Validation Score</th>
              <th>Fit Time (s)</th>
              <th>Pred Time (ms)</th>
              <th>Model Status</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((m, idx) => {
              const isSota = m.is_sota_baseline;
              const isChamp = m.is_champion;

              return (
                <tr
                  key={m.model}
                  style={{
                    background: isSota ? 'rgba(244, 63, 94, 0.06)' : isChamp ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                    borderLeft: isSota ? '3px solid var(--accent-rose)' : isChamp ? '3px solid var(--accent-emerald)' : 'none'
                  }}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    {isSota ? '🏆 SOTA' : `#${idx + 1}`}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: isSota ? 'var(--accent-rose-bright)' : isChamp ? 'var(--accent-emerald-bright)' : '#fff' }}>
                      {m.model}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)' }}>
                    {m.level === 'SOTA' ? 'Hand-Tuned' : `Level ${m.level}`}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.val_score > 0.93 ? 'var(--accent-emerald-bright)' : 'var(--text-primary)' }}>
                    {m.val_score.toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {m.fit_time}s
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {(m.pred_time_val * 1000).toFixed(1)} ms
                  </td>
                  <td>
                    {isSota ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose-bright)', fontWeight: 800 }}>
                        Kaggle Top 1% SOTA
                      </span>
                    ) : isChamp ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald-bright)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={12} /> AutoGluon Champion
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Benchmarked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
