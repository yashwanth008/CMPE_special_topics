import React, { useState, useEffect } from 'react';
import { HelpCircle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { CurriculumChapter } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose }) => {
  const [chapters, setChapters] = useState<CurriculumChapter[]>([]);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8010/api/curriculum/chapters')
      .then((res) => res.json())
      .then((d) => setChapters(d.chapters || []))
      .catch((err) => console.error(err));
  }, []);

  if (!isOpen || chapters.length === 0) return null;

  const current = chapters[activeChapterIdx];
  const quiz = current.quiz;

  const handleSelect = (idx: number) => {
    if (!isSubmitted) {
      setSelectedAnswer(idx);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      setIsSubmitted(true);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setActiveChapterIdx((prev) => (prev + 1) % chapters.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Master's Chapter Quiz ({activeChapterIdx + 1}/{chapters.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase & Question */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold text-indigo-400 uppercase">
            {current.phase}
          </span>
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {quiz.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {quiz.options.map((opt, idx) => {
            let optionStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700';

            if (selectedAnswer === idx) {
              optionStyle = 'border-indigo-500 bg-indigo-950/30 text-indigo-200 font-semibold';
            }

            if (isSubmitted) {
              if (idx === quiz.correct_idx) {
                optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold';
              } else if (selectedAnswer === idx && idx !== quiz.correct_idx) {
                optionStyle = 'border-rose-500 bg-rose-950/40 text-rose-200';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 ${optionStyle}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation when submitted */}
        {isSubmitted && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              {selectedAnswer === quiz.correct_idx ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{selectedAnswer === quiz.correct_idx ? 'Correct!' : 'Incorrect'}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{quiz.explanation}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-500">
            Chapter: {current.title}
          </span>

          <div className="flex items-center gap-3">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Next Chapter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
