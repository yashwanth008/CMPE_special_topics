import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Phase1Understanding } from './components/Phase1Understanding';
import { Phase2Clustering } from './components/Phase2Clustering';
import { Phase3Outliers } from './components/Phase3Outliers';
import { Phase4Regression } from './components/Phase4Regression';
import { Phase5Association } from './components/Phase5Association';
import { Phase6LSH } from './components/Phase6LSH';
import { Phase7Synthesis } from './components/Phase7Synthesis';
import { QuizModal } from './components/QuizModal';

export const App: React.FC = () => {
  const [activePhase, setActivePhase] = useState<string>('p1');
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navbar */}
      <Navbar
        activePhase={activePhase}
        setActivePhase={setActivePhase}
        onOpenQuiz={() => setIsQuizOpen(true)}
      />

      {/* Main Content View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activePhase === 'p1' && <Phase1Understanding />}
        {activePhase === 'p2' && <Phase2Clustering />}
        {activePhase === 'p3' && <Phase3Outliers />}
        {activePhase === 'p4' && <Phase4Regression />}
        {activePhase === 'p5' && <Phase5Association />}
        {activePhase === 'p6' && <Phase6LSH />}
        {activePhase === 'p7' && <Phase7Synthesis />}
      </main>

      {/* Quiz Modal */}
      <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        CRISP-DM Master's Data Science Platform • Textbook Quality Analytics Curriculum • Port 8010 / 5183
      </footer>
    </div>
  );
};
