import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AnomalyExplorerTable = ({ anomalies = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('ALL');

  const archetypes = ['ALL', ...new Set(anomalies.map(a => a.archetype))];

  const filtered = anomalies.filter((a) => {
    if (selectedArchetype !== 'ALL' && a.archetype !== selectedArchetype) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.archetype.toLowerCase().includes(term) || a.id.toString().includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search & Filter Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search anomaly by ID or attack archetype..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              padding: '0.55rem 1rem 0.55rem 2.2rem',
              fontSize: '0.84rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {archetypes.map((arch) => (
            <button
              key={arch}
              onClick={() => setSelectedArchetype(arch)}
              className={`nav-tab-btn ${selectedArchetype === arch ? 'active' : ''}`}
              style={{ fontSize: '0.74rem', padding: '0.35rem 0.7rem' }}
            >
              {arch === 'ALL' ? 'All Anomalies' : arch}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Threat Score</th>
              <th>Diagnosed Archetype</th>
              <th>Request Velocity</th>
              <th>Latency</th>
              <th>CPU Load</th>
              <th>Auth Failures</th>
              <th>Ground Truth</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>#{a.id}</td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: a.threat_score > 85 ? 'var(--accent-rose-bright)' : 'var(--accent-amber)' }}>
                    {a.threat_score} / 100
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff', background: 'rgba(244, 63, 94, 0.12)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                    {a.archetype}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{a.features.RequestVelocity} req/s</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: a.features.LatencyMs > 500 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                  {a.features.LatencyMs} ms
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{a.features.CPUUtilization}%</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: a.features.AuthFailures > 10 ? 'var(--accent-indigo-bright)' : 'var(--text-secondary)' }}>
                  {a.features.AuthFailures}
                </td>
                <td>
                  {a.is_ground_truth ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose-bright)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700 }}>
                      <AlertTriangle size={12} /> True Anomaly
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald-bright)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 size={12} /> Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
