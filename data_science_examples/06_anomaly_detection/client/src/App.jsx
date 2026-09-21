import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnomalyScorer } from './components/AnomalyScorer';
import { ManifoldScatter } from './components/ManifoldScatter';
import { BenchmarksDashboard } from './components/BenchmarksDashboard';
import { AutoResearchAnomaly } from './components/AutoResearchAnomaly';
import { AnomalyExplorerTable } from './components/AnomalyExplorerTable';
import { CrispDmReportModal } from './components/CrispDmReportModal';
import { RetrainModal } from './components/RetrainModal';
import { api } from './utils/api';

export function App() {
  const [activeTab, setActiveTab] = useState('scorer');
  const [isCrispDmOpen, setIsCrispDmOpen] = useState(false);
  const [isRetrainOpen, setIsRetrainOpen] = useState(false);

  const [benchmarksData, setBenchmarksData] = useState({});
  const [manifoldPoints, setManifoldPoints] = useState([]);
  const [featureCatalog, setFeatureCatalog] = useState([]);
  const [topAnomalies, setTopAnomalies] = useState([]);
  const [autoresearchData, setAutoresearchData] = useState({});
  const [threatThreshold, setThreatThreshold] = useState(68.0);

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, mRes, aRes, arRes] = await Promise.all([
          api.getBenchmarks(),
          api.getManifoldPoints(),
          api.getTopAnomalies(),
          api.getAutoResearchHistory()
        ]);

        if (bRes.success) {
          setBenchmarksData(bRes);
          if (bRes.threat_threshold) setThreatThreshold(bRes.threat_threshold);
        }
        if (mRes.success) {
          setManifoldPoints(mRes.manifold_points);
          setFeatureCatalog(mRes.feature_catalog);
        }
        if (aRes.success) {
          setTopAnomalies(aRes.top_anomalies);
        }
        if (arRes.success) {
          setAutoresearchData(arRes.data);
        }
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
        threatThreshold={threatThreshold}
      />

      <main className="main-content">
        {activeTab === 'scorer' && (
          <AnomalyScorer
            featureCatalog={featureCatalog}
            initialThreshold={threatThreshold}
          />
        )}
        {activeTab === 'manifold' && (
          <ManifoldScatter points={manifoldPoints} />
        )}
        {activeTab === 'benchmarks' && (
          <BenchmarksDashboard benchmarks={benchmarksData.benchmarks || []} />
        )}
        {activeTab === 'autoresearch' && (
          <AutoResearchAnomaly historyData={autoresearchData} />
        )}
        {activeTab === 'table' && (
          <AnomalyExplorerTable anomalies={topAnomalies} />
        )}
      </main>

      <CrispDmReportModal
        isOpen={isCrispDmOpen}
        onClose={() => setIsCrispDmOpen(false)}
      />

      <RetrainModal
        isOpen={isRetrainOpen}
        onClose={() => setIsRetrainOpen(false)}
        onRetrained={(newThresh) => setThreatThreshold(newThresh)}
      />
    </div>
  );
}

export default App;
