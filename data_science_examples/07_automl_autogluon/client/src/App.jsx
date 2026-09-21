import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AutoMLPredictor } from './components/AutoMLPredictor';
import { StackingGraph } from './components/StackingGraph';
import { LeaderboardDashboard } from './components/LeaderboardDashboard';
import { AutoResearchAutoML } from './components/AutoResearchAutoML';
import { FeatureImportanceView } from './components/FeatureImportanceView';
import { CrispDmReportModal } from './components/CrispDmReportModal';
import { RetrainModal } from './components/RetrainModal';
import { api } from './utils/api';

export function App() {
  const [activeTab, setActiveTab] = useState('predictor');
  const [isCrispDmOpen, setIsCrispDmOpen] = useState(false);
  const [isRetrainOpen, setIsRetrainOpen] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState({});
  const [stackingDagData, setStackingDagData] = useState({});
  const [autoresearchData, setAutoresearchData] = useState({});
  const [activePreset, setActivePreset] = useState('best_quality');

  useEffect(() => {
    async function loadData() {
      try {
        const [lRes, sRes, arRes] = await Promise.all([
          api.getLeaderboard('classification'),
          api.getStackingGraph('classification'),
          api.getAutoResearchHistory()
        ]);

        if (lRes.success) setLeaderboardData(lRes);
        if (sRes.success) setStackingDagData(sRes);
        if (arRes.success) setAutoresearchData(arRes.data);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCrispDm={() => setIsCrispDmOpen(true)}
        onOpenRetrain={() => setIsRetrainOpen(true)}
        activePreset={activePreset}
        championScore={leaderboardData.champion_score || 0.9420}
      />

      <main className="main-content">
        {activeTab === 'predictor' && (
          <AutoMLPredictor />
        )}
        {activeTab === 'stacking_dag' && (
          <StackingGraph
            stackingDag={stackingDagData.stacking_dag || {}}
            caruanaWeights={stackingDagData.caruana_weights || {}}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardDashboard
            leaderboard={leaderboardData.leaderboard || []}
            presetsComparison={leaderboardData.presets_comparison || []}
          />
        )}
        {activeTab === 'autoresearch' && (
          <AutoResearchAutoML historyData={autoresearchData} />
        )}
        {activeTab === 'importance' && (
          <FeatureImportanceView featureImportance={leaderboardData.feature_importance || []} />
        )}
      </main>

      <CrispDmReportModal
        isOpen={isCrispDmOpen}
        onClose={() => setIsCrispDmOpen(false)}
      />

      <RetrainModal
        isOpen={isRetrainOpen}
        onClose={() => setIsRetrainOpen(false)}
        onRetrained={(newPreset) => setActivePreset(newPreset)}
      />
    </div>
  );
}

export default App;
