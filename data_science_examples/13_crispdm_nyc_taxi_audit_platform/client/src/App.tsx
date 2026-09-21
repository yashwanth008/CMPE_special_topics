import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TripEstimator } from './components/TripEstimator';
import { CrispDmPaperDossier } from './components/CrispDmPaperDossier';
import { EdaDashboard } from './components/EdaDashboard';
import { SpatialClusteringMap } from './components/SpatialClusteringMap';
import { AutoResearchTournament } from './components/AutoResearchTournament';
import { ShapExplainability } from './components/ShapExplainability';
import { CodeAuditorWorkbench } from './components/CodeAuditorWorkbench';
import { MlopsConsole } from './components/MlopsConsole';
import { ArchitectureSkillsTab } from './components/ArchitectureSkillsTab';
import { ArchitectureSkillsModal } from './components/ArchitectureSkillsModal';
import { AdminTab } from './types';
import { 
  FileText, BarChart3, Compass, Trophy, Sparkles, Code2, Activity, ShieldCheck, Layers 
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'estimator' | 'admin'>('estimator');
  const [adminTab, setAdminTab] = useState<AdminTab>('paper_dossier');
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);

  const adminTabsConfig: Array<{ id: AdminTab; label: string; icon: any }> = [
    { id: 'paper_dossier', label: '10-Page CRISP-DM Paper', icon: FileText },
    { id: 'eda_catalog', label: 'EDA & Quality Scorecard', icon: BarChart3 },
    { id: 'spatial_clustering', label: 'Geospatial Mobility Clusters', icon: Compass },
    { id: 'model_tournament', label: 'AutoResearch Tournament & HPO', icon: Trophy },
    { id: 'shap_xai', label: 'TreeSHAP & Peer Review QA', icon: Sparkles },
    { id: 'code_auditor', label: 'Code Auditor Workbench', icon: Code2 },
    { id: 'mlops_loadtest', label: 'MLOps Drift & Load Tester', icon: Activity },
    { id: 'architecture_skills', label: 'Architecture & 23 Skills', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-300">
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'estimator' ? (
          <TripEstimator />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Admin Header Banner */}
            <div className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" /> Enterprise Algorithmic Governance
                </div>
                <h2 className="text-2xl font-bold text-white">Data Science & Code Auditor Portal</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete audit trail covering 6 CRISP-DM phases, XAI explainability, and MLOps compliance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsArchModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-md"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>How App Is Built (23 Skills)</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                  Audit Status: Certified Grade A+ (99.85%)
                </div>
              </div>
            </div>

            {/* Admin Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
              {adminTabsConfig.map((t) => {
                const Icon = t.icon;
                const active = adminTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setAdminTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Active Admin Tab Content */}
            <div className="pt-2">
              {adminTab === 'paper_dossier' && <CrispDmPaperDossier />}
              {adminTab === 'eda_catalog' && <EdaDashboard />}
              {adminTab === 'spatial_clustering' && <SpatialClusteringMap />}
              {adminTab === 'model_tournament' && <AutoResearchTournament />}
              {adminTab === 'shap_xai' && <ShapExplainability />}
              {adminTab === 'code_auditor' && <CodeAuditorWorkbench />}
              {adminTab === 'mlops_loadtest' && <MlopsConsole />}
              {adminTab === 'architecture_skills' && <ArchitectureSkillsTab />}
            </div>
          </div>
        )}
      </main>

      {/* Architecture & Skills Matrix Modal */}
      <ArchitectureSkillsModal isOpen={isArchModalOpen} onClose={() => setIsArchModalOpen(false)} />

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800/80 py-6 px-6 mt-12 text-center text-xs text-slate-500 font-mono">
        NYC TLC Mobility & Dynamic Surge Pricing Intelligence Platform • Project 13 (Enterprise CRISP-DM Standard)
      </footer>
    </div>
  );
};
export default App;
