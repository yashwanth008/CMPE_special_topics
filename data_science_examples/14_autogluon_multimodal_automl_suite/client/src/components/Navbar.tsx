import React from 'react';
import { 
  Layers, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  Trophy, 
  Eye, 
  Zap, 
  BookOpen, 
  ShieldCheck,
  Cpu,
  Server
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSkillsModal: () => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSkillsModal,
  backendOnline
}) => {
  const tabs = [
    { id: 'tabular', label: 'Tabular Stacking', icon: Layers },
    { id: 'timeseries', label: 'Chronos TimeSeries', icon: TrendingUp },
    { id: 'multimodal', label: 'MultiModal Fusion', icon: Sparkles },
    { id: 'eda', label: 'Auto-EDA & Drift', icon: BarChart3 },
    { id: 'tournament', label: 'AutoResearch', icon: Trophy },
    { id: 'xai', label: 'Explainable AI', icon: Eye },
    { id: 'mlops', label: 'MLOps & Distill', icon: Zap },
    { id: 'paper', label: 'CRISP-DM Paper', icon: BookOpen },
    { id: 'skills', label: '30-Skills Matrix', icon: Cpu },
    { id: 'audit', label: 'Code Auditor', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c1020]/90 backdrop-blur-md border-b border-indigo-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1226] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">AutoGluon AutoML Suite</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v2.0 SOTA</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                3-Level Stacking DAG • Chronos TimeSeries • Vision-Language-Tabular Fusion
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Backend status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 hidden md:inline">FastAPI:8014</span>
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>

            {/* Architecture Modal Button */}
            <button
              id="btn-architecture-modal"
              onClick={onOpenSkillsModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-semibold">30 Skills Matrix</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs bar */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
