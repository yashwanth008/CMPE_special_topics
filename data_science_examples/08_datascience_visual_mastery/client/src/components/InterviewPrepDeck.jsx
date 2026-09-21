import React, { useState } from 'react';
import { X, HelpCircle, Eye, EyeOff, Sparkles, BookOpen } from 'lucide-react';

export const InterviewPrepDeck = ({ isOpen, onClose, flashcards = [] }) => {
  const [revealed, setRevealed] = useState({});

  if (!isOpen) return null;

  const toggleReveal = (idx) => {
    setRevealed({ ...revealed, [idx]: !revealed[idx] });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.12))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={20} style={{ color: 'var(--accent-cyan-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                Technical Interview Preparation
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Data Science & ML Foundations Flashcards
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Cards List */}
        <div style={{ padding: '1.5rem', maxHeight: '68vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {flashcards.map((card, idx) => {
            const isShown = revealed[idx];

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-cyan-bright)', background: 'rgba(6, 182, 212, 0.15)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                    {card.category}
                  </span>
                  <button
                    onClick={() => toggleReveal(idx)}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                  >
                    {isShown ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{isShown ? 'Hide Answer' : 'Reveal Answer'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                  {card.question}
                </div>

                {isShown && (
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '3px solid var(--accent-indigo)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-indigo-bright)', marginBottom: '0.25rem' }}>
                      Model Answer & Core Intuition:
                    </div>
                    <div>{card.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <button className="btn-primary" onClick={onClose}>
            Close Flashcards
          </button>
        </div>
      </div>
    </div>
  );
};
