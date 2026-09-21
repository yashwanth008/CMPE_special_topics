import React from 'react';
import { Layers, Activity, GitBranch, ShieldCheck, Sliders, FileText, BarChart3, Award } from 'lucide-react';

export const Header = ({
  activeTab,
  setActiveTab,
  onOpenCrispDm,
  onOpenRetrain,
  activePreset = "best_quality",
  championScore = 0.9420
}) => {
  return (
    <header className="header">
      <div className="brand-container">
        <div className="logo-icon">
          <Layers size={20} />
        </div>
        <div>
          <div className="brand-title">AutoGluon AutoML & Stacking Platform</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-violet)' }}></span>
            <span>Multi-Task Kaggle Benchmarks • 3-Level Stacking DAG • Caruana Ensembles</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictor')}
          id="tab-automl-predictor"
        >
          <Activity size={15} />
          <span>Multi-Task Predictor</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'stacking_dag' ? 'active' : ''}`}
          onClick={() => setActiveTab('stacking_dag')}
          id="tab-stacking-dag"
        >
          <Layers size={15} />
          <span>3-Level Stacking DAG</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
          id="tab-leaderboard"
        >
          <Award size={15} />
          <span>Leaderboard & SOTA</span>
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
          className={`nav-tab-btn ${activeTab === 'importance' ? 'active' : ''}`}
          onClick={() => setActiveTab('importance')}
          id="tab-importance"
        >
          <BarChart3 size={15} />
          <span>Feature Importance</span>
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
          <span>Presets Studio</span>
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenCrispDm}
          id="btn-crisp-dm-automl"
          style={{ borderColor: 'var(--accent-violet)', color: 'var(--accent-violet-bright)' }}
        >
          <FileText size={14} />
          <span>CRISP-DM Report</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(139, 92, 246, 0.12)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-violet)', fontSize: '0.74rem', color: 'var(--accent-violet-bright)', fontWeight: 800 }}>
          <ShieldCheck size={14} />
          <span>Preset: {activePreset}</span>
        </div>
      </div>
    </header>
  );
};
