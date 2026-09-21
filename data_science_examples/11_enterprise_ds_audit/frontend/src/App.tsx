import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PortfolioScorecard } from './components/PortfolioScorecard';
import { ProjectAuditExplorer } from './components/ProjectAuditExplorer';
import { LeakageSandbox } from './components/LeakageSandbox';
import { FullAuditDossier } from './components/FullAuditDossier';
import { PortfolioSummary, ProjectAudit } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'explorer' | 'sandbox' | 'dossier'>('portfolio');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectAudit[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('proj_01_nyc');

  useEffect(() => {
    fetch('http://127.0.0.1:8011/api/audit/summary')
      .then((res) => res.json())
      .then((d) => setSummary(d))
      .catch((err) => console.error(err));

    fetch('http://127.0.0.1:8011/api/audit/projects')
      .then((res) => res.json())
      .then((d) => setProjects(d.projects || []))
      .catch((err) => console.error(err));
  }, []);

  const handleSelectProjectAndExplore = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'portfolio' && summary && (
          <PortfolioScorecard
            summary={summary}
            onSelectProject={handleSelectProjectAndExplore}
          />
        )}

        {activeTab === 'explorer' && (
          <ProjectAuditExplorer
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
        )}

        {activeTab === 'sandbox' && <LeakageSandbox />}

        {activeTab === 'dossier' && (
          <FullAuditDossier projects={projects} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        Enterprise Data Science Audit & Governance Platform • Port 8011 / 5184 • 10 Systems Certified
      </footer>
    </div>
  );
};
