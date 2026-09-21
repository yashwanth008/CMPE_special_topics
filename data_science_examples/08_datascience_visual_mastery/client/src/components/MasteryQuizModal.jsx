import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MasteryQuizModal = ({ isOpen, onClose, quizzes = {}, activeModule = 'naive_bayes' }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentQuestions = quizzes[activeModule] || [];

  const handleSelect = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qId]: optionIdx });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let correctCount = 0;
    currentQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_index) {
        correctCount++;
      }
    });

    if (correctCount >= currentQuestions.length * 0.75) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = currentQuestions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correct_index ? 1 : 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={20} style={{ color: 'var(--accent-violet-bright)' }} />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-violet-bright)', fontWeight: 800, textTransform: 'uppercase' }}>
                Module Mastery Evaluation
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Foundational Concept Knowledge Check
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Questions List */}
        <div style={{ padding: '1.5rem', maxHeight: '68vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentQuestions.map((q, idx) => {
            const chosen = selectedAnswers[q.id];
            const isCorrect = chosen === q.correct_index;

            return (
              <div key={q.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '0.85rem' }}>
                  <span style={{ color: 'var(--accent-indigo-bright)', marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                  {q.question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    let borderStyle = '1px solid var(--border-subtle)';
                    let bgStyle = 'rgba(255, 255, 255, 0.02)';

                    if (submitted) {
                      if (optIdx === q.correct_index) {
                        borderStyle = '1px solid var(--accent-emerald)';
                        bgStyle = 'rgba(16, 185, 129, 0.15)';
                      } else if (isSelected && !isCorrect) {
                        borderStyle = '1px solid var(--accent-rose)';
                        bgStyle = 'rgba(244, 63, 94, 0.15)';
                      }
                    } else if (isSelected) {
                      borderStyle = '1px solid var(--accent-indigo-bright)';
                      bgStyle = 'rgba(99, 102, 241, 0.15)';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: borderStyle,
                          background: bgStyle,
                          fontSize: '0.8rem',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          cursor: submitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem'
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {['A', 'B', 'C', 'D'][optIdx]}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {submitted && (
                  <div style={{ marginTop: '0.85rem', background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)', borderLeft: `3px solid ${isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`, padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 800, color: isCorrect ? 'var(--accent-emerald-bright)' : 'var(--accent-rose-bright)', marginBottom: '0.2rem' }}>
                      {isCorrect ? '✓ Correct Answer' : '✗ Explanation'}
                    </div>
                    <div>{q.explanation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          {submitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: score >= currentQuestions.length * 0.75 ? 'var(--accent-emerald-bright)' : 'var(--accent-amber)' }}>
              <Sparkles size={16} />
              <span>Score: {score} / {currentQuestions.length} ({Math.round((score / currentQuestions.length) * 100)}%)</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Answer all questions before submitting.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {submitted ? (
              <button className="btn-secondary" onClick={handleReset}>
                <RotateCcw size={14} />
                <span>Retry Quiz</span>
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length < currentQuestions.length}>
                <span>Submit Answers</span>
              </button>
            )}
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
