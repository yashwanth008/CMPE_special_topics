import React from 'react';
import { BookOpen, Award, Sparkles, Globe, HelpCircle, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

export const Header = ({
  activeModule,
  setActiveModule,
  onOpenQuiz,
  onOpenInterview,
  onOpenGhPages,
  completedModules = []
}) => {
  const modules = [
    { id: 'naive_bayes', label: '1. Naive-Bayes & Probability' },
    { id: 'evaluation_metrics', label: '2. Metrics & Precision-Recall' },
    { id: 'calculus_gradients', label: '3. Derivatives & Gradients' },
    { id: 'backprop_chainrule', label: '4. Chain Rule & Backprop' }
  ];

  const progressPct = Math.round((completedModules.length / modules.length) * 100);

  return (
    <header className="header">
      <div className="brand-container">
        <div className="logo-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <div className="brand-title">Data Science & ML Visual Foundations</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
            <span>Interactive Visual Textbook • Live Math Simulators • Interview Prep</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        {modules.map((m) => {
          const isDone = completedModules.includes(m.id);
          const isActive = activeModule === m.id;

          return (
            <button
              key={m.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveModule(m.id)}
              id={`tab-${m.id}`}
            >
              {isDone && <CheckCircle2 size={13} style={{ color: 'var(--accent-emerald-bright)' }} />}
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          className="btn-secondary"
          onClick={onOpenQuiz}
          id="btn-mastery-quiz"
          style={{ borderColor: 'var(--accent-violet)', color: 'var(--accent-violet-bright)' }}
        >
          <Award size={14} />
          <span>Chapter Quiz</span>
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenInterview}
          id="btn-interview-prep"
          style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan-bright)' }}
        >
          <HelpCircle size={14} />
          <span>Interview Prep</span>
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenGhPages}
          id="btn-gh-pages"
          style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald-bright)' }}
        >
          <Globe size={14} />
          <span>github.io Sites</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.12)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-emerald)', fontSize: '0.74rem', color: 'var(--accent-emerald-bright)', fontWeight: 800 }}>
          <Sparkles size={13} />
          <span>{progressPct}% Mastery</span>
        </div>
      </div>
    </header>
  );
};
