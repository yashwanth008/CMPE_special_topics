import React, { useState } from 'react';
import { Header } from './components/Header';
import { ForecastStudio } from './components/ForecastStudio';
import { CrispDmWorkflow } from './components/CrispDmWorkflow';
import { DecompositionView } from './components/DecompositionView';
import { TournamentLeaderboard } from './components/TournamentLeaderboard';
import { AdminTelemetryDashboard } from './components/AdminTelemetryDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'crispdm' | 'decomp' | 'tournament' | 'admin'>('forecast');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'forecast' && <ForecastStudio />}
        {activeTab === 'crispdm' && <CrispDmWorkflow />}
        {activeTab === 'decomp' && <DecompositionView />}
        {activeTab === 'tournament' && <TournamentLeaderboard />}
        {activeTab === 'admin' && <AdminTelemetryDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        TimePulse Forecasting Engine • CRISP-DM Time Series Analytics • Port 8012 / 5185
      </footer>
    </div>
  );
};
