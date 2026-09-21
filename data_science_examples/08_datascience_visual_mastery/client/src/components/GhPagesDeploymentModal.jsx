import React from 'react';
import { X, Globe, ExternalLink, CheckCircle2, Copy, Sparkles, Folder } from 'lucide-react';

export const GhPagesDeploymentModal = ({ isOpen, onClose, manifest = {} }) => {
  if (!isOpen) return null;

  const projects = manifest.projects || [];
  const rootUrl = manifest.gh_pages_root || "https://dlmastery.github.io/data_science_examples/";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Globe size={20} style={{ color: 'var(--accent-emerald-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                GitHub Pages Live Deployment Directory
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Static github.io Web Dashboards & Textbook Hub
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Directory List */}
        <div style={{ padding: '1.5rem', maxHeight: '68vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            All 8 machine learning and data science projects have been bundled as zero-dependency static production builds ready for GitHub Pages hosting on <strong>{rootUrl}</strong>.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald-bright)', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    Project {p.id}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {rootUrl}{p.path}
                    </div>
                  </div>
                </div>

                <a
                  href={`${rootUrl}${p.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '0.35rem 0.75rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald-bright)' }}
                >
                  <ExternalLink size={13} />
                  <span>Open github.io</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <button className="btn-primary" onClick={onClose}>
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
