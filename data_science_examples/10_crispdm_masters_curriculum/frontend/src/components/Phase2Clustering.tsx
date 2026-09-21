import React, { useState, useEffect } from 'react';
import { Compass, Users } from 'lucide-react';
import { ClusterPersona } from '../types';

export const Phase2Clustering: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<string>('kmeans');
  const [k, setK] = useState<number>(4);
  const [result, setResult] = useState<{
    metrics: {
      silhouette_score: number;
      calinski_harabasz_score: number;
      davies_bouldin_score: number;
    };
    personas: ClusterPersona[];
    points_2d: any[];
  } | null>(null);

  const fetchClustering = () => {
    fetch(`http://127.0.0.1:8010/api/clustering/run?algorithm=${algorithm}&k=${k}`)
      .then((res) => res.json())
      .then((d) => {
        setResult(d);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchClustering();
  }, [algorithm, k]);

  const clusterColors = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e'];

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <Compass className="w-4 h-4" />
          <span>CRISP-DM Phase 2: Data Clustering Analysis</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Unsupervised Topology & Multidimensional Persona Segmentation
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Clustering enables the unsupervised discovery of demographic archetype personas without relying on class labels.
          Compare deterministic spherical partitions (K-Means), Gaussian density distributions (GMM), and agglomerative trees.
        </p>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Clustering Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="kmeans">K-Means (Voronoi Spherical)</option>
              <option value="gmm">Gaussian Mixture Model (EM Density)</option>
              <option value="hierarchical">Agglomerative Hierarchical</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Number of Clusters (k = {k})</label>
            <input
              type="range"
              min="2"
              max="8"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              className="accent-blue-500 cursor-pointer w-32"
            />
          </div>
        </div>

        {/* Real-time Quality Metrics */}
        {result && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Silhouette Score:</span>
              <span className="text-blue-400 font-bold">{result.metrics.silhouette_score}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Calinski-Harabasz:</span>
              <span className="text-emerald-400 font-bold">{result.metrics.calinski_harabasz_score}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Davies-Bouldin:</span>
              <span className="text-purple-400 font-bold">{result.metrics.davies_bouldin_score}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2D PCA Projection & Cluster Persona Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2D PCA Scatter Canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              2D Principal Component Projection ($PCA_1$ vs $PCA_2$)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">300 Point Sample</span>
          </div>

          <div className="relative w-full h-[360px] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {result?.points_2d ? (
              <svg className="w-full h-full p-4" viewBox="-4 -4 8 8">
                {/* Axis lines */}
                <line x1="-4" y1="0" x2="4" y2="0" stroke="#1e293b" strokeWidth="0.05" />
                <line x1="0" y1="-4" x2="0" y2="4" stroke="#1e293b" strokeWidth="0.05" />

                {result.points_2d.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.pca_x}
                    cy={pt.pca_y}
                    r="0.12"
                    fill={clusterColors[pt.cluster % clusterColors.length]}
                    opacity="0.85"
                    className="hover:r-3 transition-all cursor-pointer"
                  >
                    <title>{`${pt.id} | Income: $${pt.annual_income.toLocaleString()} | Occ: ${pt.occupation}`}</title>
                  </circle>
                ))}
              </svg>
            ) : (
              <span className="text-xs text-slate-500 font-mono">Computing topological projection...</span>
            )}
          </div>
        </div>

        {/* Personas Breakdown */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 overflow-y-auto max-h-[460px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Archetype Personas ($k={k}$)
          </h3>

          {result?.personas.map((p) => (
            <div
              key={p.cluster_id}
              style={{ borderLeftColor: clusterColors[p.cluster_id % clusterColors.length] }}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 border-l-4 space-y-1.5 text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Cluster {p.cluster_id + 1}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {p.size} records ({p.pct}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Avg Income:</span>
                <span className="font-mono font-semibold text-emerald-400">${p.avg_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Avg Age / Edu:</span>
                <span className="font-mono">{p.avg_age} yrs / {p.avg_edu_num} yrs</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Top Occupation:</span>
                <span className="font-mono text-indigo-300">{p.top_occupation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
