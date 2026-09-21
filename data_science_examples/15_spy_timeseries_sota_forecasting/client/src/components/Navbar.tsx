import React from 'react';
import { Activity, ShieldCheck, Layers, TrendingUp, BarChart2, Award, Zap, BookOpen, Compass, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy: boolean;
  onOpenSkillsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendHealthy,
  onOpenSkillsModal
}) => {
  const tabs = [
    { id: 'forecast', label: 'Multi-Quantile Forecast', icon: TrendingUp },
    { id: 'candlestick', label: 'SPY Technical Studio', icon: BarChart2 },
    { id: 'tournament', label: 'SOTA Tournament', icon: Award },
    { id: 'backtest', label: 'Quantitative Backtest', icon: Activity },
    { id: 'xai', label: 'TreeSHAP & Stress Test', icon: Zap },
    { id: 'paper', label: '10-Page CRISP-DM Paper', icon: BookOpen },
    { id: 'skills', label: '30-Skills Catalog', icon: Compass },
    { id: 'auditor', label: 'AST Code Auditor', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-base tracking-tight text-white">SPY SOTA TimeSeries</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CRISP-DM v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multi-Horizon S&amp;P 500 ETF Alpha &amp; Zero-Leakage Forecaster</p>
            </div>
          </div>

          {/* Microservice Health Pill */}
          <div className="flex items-center gap-2 md:hidden">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              isBackendHealthy ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              Port 8015
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions & Health Pill */}
        <div className="hidden md:flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
            isBackendHealthy ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            {isBackendHealthy ? 'FastAPI :8015 Healthy' : 'Microservice Offline'}
          </span>

          <button
            onClick={onOpenSkillsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            30-Skills Matrix
          </button>
        </div>

      </div>
    </header>
  );
};
