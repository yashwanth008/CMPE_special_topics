import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MultiQuantileForecastStudio } from './components/MultiQuantileForecastStudio';
import { CandlestickChart } from './components/CandlestickChart';
import { ModelTournamentLeaderboard } from './components/ModelTournamentLeaderboard';
import { QuantitativeBacktestStudio } from './components/QuantitativeBacktestStudio';
import { FinancialExplainabilityStudio } from './components/FinancialExplainabilityStudio';
import { CrispDmPaperDossier } from './components/CrispDmPaperDossier';
import { ArchitectureSkillsTab } from './components/ArchitectureSkillsTab';
import { ArchitectureSkillsModal } from './components/ArchitectureSkillsModal';
import { CodeAuditorWorkbench } from './components/CodeAuditorWorkbench';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('forecast');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);

  const checkHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8015/api/health');
      setIsBackendHealthy(res.ok);
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendHealthy={isBackendHealthy}
        onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'forecast' && <MultiQuantileForecastStudio />}
        {activeTab === 'candlestick' && <CandlestickChart />}
        {activeTab === 'tournament' && <ModelTournamentLeaderboard />}
        {activeTab === 'backtest' && <QuantitativeBacktestStudio />}
        {activeTab === 'xai' && <FinancialExplainabilityStudio />}
        {activeTab === 'paper' && <CrispDmPaperDossier />}
        {activeTab === 'skills' && <ArchitectureSkillsTab />}
        {activeTab === 'auditor' && <CodeAuditorWorkbench />}
      </main>

      {/* 30-Skills Architecture Modal */}
      <ArchitectureSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        SPY SOTA Time Series Forecasting &amp; Quantitative Alpha Platform • FastAPI :8015 • Vite :5188 • CRISP-DM Standard
      </footer>
    </div>
  );
};

export default App;
