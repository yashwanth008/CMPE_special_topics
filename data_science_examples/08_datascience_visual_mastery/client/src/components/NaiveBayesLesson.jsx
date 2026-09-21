import React, { useState } from 'react';
import { BookOpen, Sparkles, Sliders, CheckCircle2, ShieldAlert, Cpu, Award } from 'lucide-react';
import { api } from '../utils/api';

export const NaiveBayesLesson = ({ moduleData = {}, onComplete }) => {
  const [words, setWords] = useState([
    { word: "free", p_spam: 0.7, p_ham: 0.1 },
    { word: "money", p_spam: 0.5, p_ham: 0.2 },
    { word: "lunch", p_spam: 0.1, p_ham: 0.4 }
  ]);
  const [priorSpam, setPriorSpam] = useState(0.4);
  const [simResult, setSimResult] = useState({
    unnormalized_spam_score: 0.014,
    unnormalized_ham_score: 0.0048,
    posterior_spam_pct: 74.5,
    winner: "SPAM"
  });

  const handleWordChange = async (idx, field, val) => {
    const updated = [...words];
    updated[idx][field] = parseFloat(val);
    setWords(updated);

    try {
      const res = await api.simulateBayes({
        words: updated,
        prior_spam: priorSpam,
        prior_ham: 1.0 - priorSpam
      });
      if (res.success) {
        setSimResult(res.result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePriorChange = async (val) => {
    const p = parseFloat(val);
    setPriorSpam(p);
    try {
      const res = await api.simulateBayes({
        words,
        prior_spam: p,
        prior_ham: 1.0 - p
      });
      if (res.success) {
        setSimResult(res.result);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="lesson-container">
      {/* Left: Comprehensive Textual Narrative */}
      <div className="lesson-article">
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-indigo)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo-bright)', textTransform: 'uppercase' }}>
            Probabilistic Machine Learning & Bayesian Inference
          </span>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>
            {moduleData.title || "The Foundations of Probabilistic Classification"}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {moduleData.subtitle}
          </p>

          <div style={{ marginTop: '0.85rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan-bright)' }}>
            Core Rule: P(c | x₁ ... xₙ) ∝ P(c) · ∏ P(xᵢ | c)
          </div>
        </div>

        {moduleData.sections?.map((sec, i) => (
          <div key={i} className="lesson-section">
            <h3>
              <span style={{ color: 'var(--accent-indigo-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>0{i+1}.</span>
              <span>{sec.heading}</span>
            </h3>
            <p>{sec.content}</p>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onComplete} id="btn-complete-nb">
            <CheckCircle2 size={15} />
            <span>Mark Module Complete & Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Right: Live Interactive Napkin Bayes Simulator */}
      <div className="interactive-sidebar">
        <div className="card" style={{ borderColor: 'var(--border-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Sliders size={16} style={{ color: 'var(--accent-indigo-bright)' }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
              Live Napkin Bayes Calculator
            </h4>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Adjust word likelihoods and see the Bayesian posterior update in real time.
          </p>

          {/* Prior Slider */}
          <div style={{ marginBottom: '1rem', background: 'var(--bg-tertiary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Base Rate Prior P(Spam)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo-bright)', fontWeight: 800 }}>{(priorSpam * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={priorSpam}
              onChange={(e) => handlePriorChange(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
            />
          </div>

          {/* Word Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {words.map((w, idx) => (
              <div key={w.word} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem' }}>
                  Word: "{w.word}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.15rem' }}>
                  <span style={{ color: 'var(--accent-rose)' }}>P("{w.word}" | Spam)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{w.p_spam}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={w.p_spam}
                  onChange={(e) => handleWordChange(idx, 'p_spam', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-rose)', marginBottom: '0.35rem' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.15rem' }}>
                  <span style={{ color: 'var(--accent-cyan-bright)' }}>P("{w.word}" | Ham)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{w.p_ham}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={w.p_ham}
                  onChange={(e) => handleWordChange(idx, 'p_ham', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
            ))}
          </div>

          {/* Real-time Verdict */}
          <div style={{ marginTop: '1rem', background: simResult.winner === 'SPAM' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(6, 182, 212, 0.15)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: `1px solid ${simResult.winner === 'SPAM' ? 'var(--accent-rose)' : 'var(--accent-cyan)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: simResult.winner === 'SPAM' ? 'var(--accent-rose)' : 'var(--accent-cyan-bright)' }}>
                Classification Verdict
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                {simResult.winner}
              </span>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: simResult.winner === 'SPAM' ? 'var(--accent-rose)' : 'var(--accent-cyan-bright)', marginTop: '0.25rem' }}>
              {simResult.posterior_spam_pct}% Spam
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Unnormalized: Spam={simResult.unnormalized_spam_score} • Ham={simResult.unnormalized_ham_score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
