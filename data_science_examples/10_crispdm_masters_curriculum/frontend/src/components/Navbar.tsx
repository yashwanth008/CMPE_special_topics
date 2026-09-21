import React from 'react';
import { GraduationCap, Database, BarChart3, Binary, Compass, Network, Award, HelpCircle } from 'lucide-react';

interface NavbarProps {
  activePhase: string;
  setActivePhase: (p: string) => void;
  onOpenQuiz: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePhase,
  setActivePhase,
  onOpenQuiz,
}) => {
  const phases = [
    { id: 'p1', label: '1. Understanding & EDA', icon: Database },
    { id: 'p2', label: '2. Clustering Topology', icon: Compass },
    { id: 'p3', label: '3. Outlier Isolation', icon: Binary },
    { id: 'p4', label: '4. Income Regression', icon: BarChart3 },
    { id: 'p5', label: '5. Association Rules', icon: Network },
    { id: 'p6', label: '6. Sub-Linear LSH', icon: Binary },
    { id: 'p7', label: '7. Master\'s Synthesis', icon: Award },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Persona */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">CRISP-DM Master's Lab</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Textbook Edition
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Prof. Data Science Curriculum & Kaggle Benchmark
            </p>
          </div>
        </div>

        {/* Phase Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {phases.map((p) => {
            const Icon = p.icon;
            const isActive = activePhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </nav>

        {/* Quiz Button */}
        <button
          onClick={onOpenQuiz}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Chapter Quizzes</span>
        </button>
      </div>
    </header>
  );
};
