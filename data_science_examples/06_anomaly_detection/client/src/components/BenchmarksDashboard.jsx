import React from 'react';
import { ShieldAlert, Award, Zap, CheckCircle2, Clock, Activity } from 'lucide-react';

export const BenchmarksDashboard = ({ benchmarks = [] }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(99, 102, 241, 0.08))', borderColor: 'var(--border-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Award size={18} style={{ color: 'var(--accent-cyan-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan-bright)' }}>
                Multi-Backbone Model Evaluation Matrix
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Algorithm Backbones vs Kaggle Grandmaster SOTA Baseline
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Standardized benchmark across 10,000 multi-feature telemetry vectors evaluating geometric tree partitioning, neural reconstruction, and kernel boundary formulations.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Leaderboard Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Detection Backbone</th>
              <th>Mathematical Paradigm</th>
              <th>ROC-AUC</th>
              <th>PR-AUC</th>
              <th>F1-Score</th>
              <th>Inference Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b, idx) => {
              const isSota = b.is_sota_baseline;
              const isChamp = b.is_champion;

              return (
                <tr
                  key={b.name}
                  style={{
                    background: isSota ? 'rgba(244, 63, 94, 0.06)' : isChamp ? 'rgba(6, 182, 212, 0.06)' : 'transparent',
                    borderLeft: isSota ? '3px solid var(--accent-rose)' : isChamp ? '3px solid var(--accent-cyan)' : 'none'
                  }}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                    {isSota ? '🏆 SOTA' : `#${idx + 1}`}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: isSota ? 'var(--accent-rose-bright)' : isChamp ? 'var(--accent-cyan-bright)' : '#fff' }}>
                      {b.name}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {b.paradigm}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: b.roc_auc > 0.94 ? 'var(--accent-emerald-bright)' : 'var(--text-primary)' }}>
                    {b.roc_auc.toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)' }}>
                    {b.pr_auc.toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {b.f1_score.toFixed(4)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {b.inf_latency_ms} ms
                  </td>
                  <td>
                    {isSota ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose-bright)', fontWeight: 800 }}>
                        Kaggle Top 1% SOTA
                      </span>
                    ) : isChamp ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan-bright)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={12} /> Champion Backbone
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
