import React from 'react';
import { BookOpen, CheckCircle2, Clock, Award, HelpCircle } from 'lucide-react';

export const SidebarNav = ({ modules = [], activeModule, setActiveModule, completedModules = [] }) => {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        Foundations Curriculum
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {modules.map((m, idx) => {
          const isActive = activeModule === m.id;
          const isDone = completedModules.includes(m.id);

          return (
            <div
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              style={{
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))' : 'var(--bg-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-indigo-bright)' : 'var(--border-subtle)'}`,
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: isActive ? 'var(--accent-cyan-bright)' : 'var(--text-muted)', fontWeight: 800 }}>
                  MODULE 0{idx + 1}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', marginTop: '0.15rem' }}>
                  {m.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  <Clock size={11} />
                  <span>{m.read_time || '12 min read'}</span>
                </div>
              </div>

              {isDone ? (
                <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald-bright)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px dashed var(--text-muted)', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
