import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TabularStackingPredictor } from './components/TabularStackingPredictor';
import { ChronosTimeSeriesForecaster } from './components/ChronosTimeSeriesForecaster';
import { MultimodalFusionWorkbench } from './components/MultimodalFusionWorkbench';
import { AutoGluonEdaDashboard } from './components/AutoGluonEdaDashboard';
import { AutoResearchTournament } from './components/AutoResearchTournament';
import { ExplainableAiDashboard } from './components/ExplainableAiDashboard';
import { MlopsDistillationConsole } from './components/MlopsDistillationConsole';
import { CrispDmPaperDossier } from './components/CrispDmPaperDossier';
import { ArchitectureSkillsTab } from './components/ArchitectureSkillsTab';
import { CodeAuditorWorkbench } from './components/CodeAuditorWorkbench';
import { ArchitectureSkillsModal } from './components/ArchitectureSkillsModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('tabular');
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  const checkHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8014/api/health');
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d18] text-slate-100 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
        backendOnline={backendOnline}
      />

      {/* Main Container Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tabular' && <TabularStackingPredictor />}
        {activeTab === 'timeseries' && <ChronosTimeSeriesForecaster />}
        {activeTab === 'multimodal' && <MultimodalFusionWorkbench />}
        {activeTab === 'eda' && <AutoGluonEdaDashboard />}
        {activeTab === 'tournament' && <AutoResearchTournament />}
        {activeTab === 'xai' && <ExplainableAiDashboard />}
        {activeTab === 'mlops' && <MlopsDistillationConsole />}
        {activeTab === 'paper' && <CrispDmPaperDossier />}
        {activeTab === 'skills' && <ArchitectureSkillsTab />}
        {activeTab === 'audit' && <CodeAuditorWorkbench />}
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-500/20 bg-[#090c16]/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-semibold text-slate-300">AutoGluon Multimodal AutoML Suite</span>
            <span>•</span>
            <span>CRISP-DM Standard Compliance</span>
          </div>
          <div className="font-mono text-slate-500">
            FastAPI :8014 • React + Vite :5187 • KaTeX Mathematical Typography
          </div>
        </div>
      </footer>

      {/* Architecture & 30-Skills Modal */}
      <ArchitectureSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
      />
    </div>
  );
};

export default App;
