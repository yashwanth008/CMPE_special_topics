import React from 'react';
import { AlertTriangle, ShieldAlert, Activity, GitBranch, Cpu, Sliders, FileText, CheckCircle2 } from 'lucide-react';

export const Header = ({
  activeTab,
  setActiveTab,
  onOpenCrispDm,
  onOpenRetrain,
  threatThreshold = 68.0
}) => {
  return (
    <header className="header">
      <div className="brand-container">
        <div className="logo-icon">
          <AlertTriangle size={20} />
        </div>
        <div>
          <div className="brand-title">Anomaly Detection & Threat Intelligence</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-rose)' }}></span>
            <span>Kaggle Cloud Telemetry • Multi-Backbone Ensemble • SOTA 0.958 AUC</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'scorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorer')}
          id="tab-threat-scorer"
        >
          <Activity size={15} />
          <span>Threat Scorer</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'manifold' ? 'active' : ''}`}
          onClick={() => setActiveTab('manifold')}
          id="tab-manifold"
        >
          <Cpu size={15} />
          <span>2D Manifold</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmarks')}
          id="tab-benchmarks"
        >
          <ShieldAlert size={15} />
          <span>Backbones & SOTA</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'autoresearch' ? 'active' : ''}`}
          onClick={() => setActiveTab('autoresearch')}
          id="tab-autoresearch"
        >
          <GitBranch size={15} />
          <span>AutoResearch</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
          id="tab-table"
        >
          <Sliders size={15} />
          <span>Top Anomalies</span>
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          className="btn-secondary"
          onClick={onOpenRetrain}
          id="btn-retrain-modal"
          style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan-bright)' }}
        >
          <Sliders size={14} />
          <span>Retrain Studio</span>
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenCrispDm}
          id="btn-crisp-dm-anomaly"
          style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose-bright)' }}
        >
          <FileText size={14} />
          <span>CRISP-DM Report</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(244, 63, 94, 0.12)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-active)', fontSize: '0.74rem', color: 'var(--accent-rose-bright)', fontWeight: 800 }}>
          <ShieldAlert size={14} />
          <span>Threat Threshold: {threatThreshold}</span>
        </div>
      </div>
    </header>
  );
};
