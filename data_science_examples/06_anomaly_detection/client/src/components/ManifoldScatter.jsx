import React, { useState } from 'react';
import { Cpu, Eye, Filter, Sparkles, Layers } from 'lucide-react';

export const ManifoldScatter = ({ points = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'ANOMALIES_ONLY', 'NORMAL_ONLY'

  const filteredPoints = points.filter((p) => {
    if (filterMode === 'ANOMALIES_ONLY') return p.is_anomaly;
    if (filterMode === 'NORMAL_ONLY') return !p.is_anomaly;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={18} style={{ color: 'var(--accent-cyan-bright)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              2D PCA Latent Manifold Projection
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Visualizing high-dimensional density boundaries and anomaly separation ({filteredPoints.length} points rendered).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`nav-tab-btn ${filterMode === 'ALL' ? 'active' : ''}`}
            style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem' }}
          >
            All Samples
          </button>
          <button
            onClick={() => setFilterMode('ANOMALIES_ONLY')}
            className={`nav-tab-btn ${filterMode === 'ANOMALIES_ONLY' ? 'active' : ''}`}
            style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', color: 'var(--accent-rose-bright)' }}
          >
            Anomalies Only (Glowing)
          </button>
          <button
            onClick={() => setFilterMode('NORMAL_ONLY')}
            className={`nav-tab-btn ${filterMode === 'NORMAL_ONLY' ? 'active' : ''}`}
            style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', color: 'var(--accent-cyan-bright)' }}
          >
            Nominal Only
          </button>
        </div>
      </div>

      {/* 2D SVG Scatter Plot Canvas */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '1rem', background: 'rgba(6, 8, 19, 0.95)' }}>
        <div style={{ width: '100%', height: 480, position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="-15 -15 30 30" style={{ transform: 'scale(1, -1)' }}>
            {/* Grid crosshairs */}
            <line x1="-15" y1="0" x2="15" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="0.1" />
            <line x1="0" y1="-15" x2="0" y2="15" stroke="rgba(255,255,255,0.06)" strokeWidth="0.1" />

            {/* Points */}
            {filteredPoints.map((p) => {
              const isAnom = p.is_anomaly;
              const isHovered = hoveredPoint?.id === p.id;
              const radius = isHovered ? 0.6 : isAnom ? 0.35 : 0.18;
              const fillColor = isAnom ? 'var(--accent-rose)' : 'var(--accent-cyan)';
              const opacity = isAnom ? 0.95 : 0.45;

              return (
                <g key={p.id} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                  {isAnom && (
                    <circle
                      cx={p.pca_x}
                      cy={p.pca_y}
                      r={radius * 2.2}
                      fill="none"
                      stroke="var(--accent-rose)"
                      strokeWidth="0.08"
                      opacity={0.6}
                    />
                  )}
                  <circle
                    cx={p.pca_x}
                    cy={p.pca_y}
                    r={radius}
                    fill={fillColor}
                    opacity={opacity}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(12, 16, 36, 0.95)',
                border: `1px solid ${hoveredPoint.is_anomaly ? 'var(--accent-rose)' : 'var(--accent-cyan)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                width: 240,
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: hoveredPoint.is_anomaly ? 'var(--accent-rose-bright)' : 'var(--accent-cyan-bright)' }}>
                  {hoveredPoint.is_anomaly ? 'Malicious Anomaly' : 'Nominal Observation'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  #{hoveredPoint.id}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', marginBottom: '0.4rem' }}>
                {hoveredPoint.archetype}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div>Threat Score: <strong style={{ color: hoveredPoint.is_anomaly ? 'var(--accent-rose-bright)' : 'var(--accent-emerald-bright)', fontFamily: 'var(--font-mono)' }}>{hoveredPoint.threat_score}/100</strong></div>
                <div>Request Velocity: <strong style={{ fontFamily: 'var(--font-mono)' }}>{hoveredPoint.request_velocity} req/s</strong></div>
                <div>Latency: <strong style={{ fontFamily: 'var(--font-mono)' }}>{hoveredPoint.latency_ms} ms</strong></div>
                <div>CPU Load: <strong style={{ fontFamily: 'var(--font-mono)' }}>{hoveredPoint.cpu_util}%</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
