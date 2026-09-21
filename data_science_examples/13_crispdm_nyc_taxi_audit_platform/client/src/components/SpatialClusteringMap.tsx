import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Trophy } from 'lucide-react';

export const SpatialClusteringMap: React.FC = () => {
  const [clusteringData, setClusteringData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCluster, setSelectedCluster] = useState<number>(0);

  useEffect(() => {
    fetch('http://127.0.0.1:8013/api/clustering/spatial')
      .then((r) => r.json())
      .then((d) => {
        setClusteringData(d);
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400 font-mono">Computing spatial density clusters...</p>
      </div>
    );
  }

  const best = clusteringData?.best_clustering;
  const centroids = best?.centroids || [];

  return (
    <div className="space-y-8">
      {/* Tournament Leaderboard */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Unsupervised Clustering Tournament Leaderboard
          </h3>
          <span className="text-xs font-mono text-emerald-400">Champion: Spatial K-Means (k=6)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clusteringData?.leaderboard?.map((m: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                m.rank === 1
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white">Rank #{m.rank}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {m.clusters} Clusters
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mb-2">{m.model}</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">Silhouette</span>
                  <span className="text-amber-400 font-bold">{m.silhouette_score}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Davies-Bouldin</span>
                  <span className="text-cyan-400 font-bold">{m.davies_bouldin}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Spatial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: SVG Map Centroids */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              NYC Metropolitan Mobility Centroid Map (WGS84)
            </h3>
            <span className="text-xs font-mono text-slate-500">6 Hotspot Density Hubs</span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[360px] bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 600 400" className="w-full h-full">
              {/* NYC Borough Outlines Background */}
              <path
                d="M 180 80 Q 220 180 250 240 L 230 310 L 190 320 L 160 260 L 170 140 Z"
                fill="rgba(51, 65, 85, 0.25)"
                stroke="rgba(100, 116, 139, 0.4)"
                strokeWidth="1.5"
              />
              <path
                d="M 250 240 Q 340 230 420 280 L 400 350 L 300 370 L 230 310 Z"
                fill="rgba(51, 65, 85, 0.2)"
                stroke="rgba(100, 116, 139, 0.3)"
                strokeWidth="1.5"
              />
              <path
                d="M 280 120 Q 380 110 460 160 L 440 250 L 340 230 L 250 180 Z"
                fill="rgba(51, 65, 85, 0.2)"
                stroke="rgba(100, 116, 139, 0.3)"
                strokeWidth="1.5"
              />

              {/* Geographic Labels */}
              <text x="185" y="190" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">Manhattan</text>
              <text x="310" y="310" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">Brooklyn</text>
              <text x="360" y="180" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">Queens</text>
              <text x="470" y="320" fill="#64748b" fontSize="10" fontFamily="sans-serif">JFK Airport</text>
              <text x="370" y="90" fill="#64748b" fontSize="10" fontFamily="sans-serif">LaGuardia LGA</text>

              {/* Centroid Nodes */}
              {centroids.map((c: any, idx: number) => {
                // Map Lat [40.64, 40.82] -> Y [330, 80]
                // Map Lon [-74.02, -73.75] -> X [140, 500]
                const x = 140 + ((c.center_longitude + 74.02) / 0.27) * 360;
                const y = 330 - ((c.center_latitude - 40.64) / 0.18) * 250;
                const isSelected = selectedCluster === c.cluster_id;

                return (
                  <g key={idx} onClick={() => setSelectedCluster(c.cluster_id)} className="cursor-pointer">
                    {/* Radius Aura */}
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.max(14, c.share_percent * 1.5)}
                      fill={isSelected ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.20)'}
                      stroke={isSelected ? '#f59e0b' : '#06b6d4'}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill={isSelected ? '#f59e0b' : '#06b6d4'}
                    />
                    <text
                      x={x + 8}
                      y={y + 4}
                      fill={isSelected ? '#fde68a' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="sans-serif"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      C{c.cluster_id + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Selected Centroid Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Spatial Centroid Attributes
            </h3>

            <div className="space-y-2.5">
              {centroids.map((c: any) => (
                <div
                  key={c.cluster_id}
                  onClick={() => setSelectedCluster(c.cluster_id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedCluster === c.cluster_id
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">{c.label}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {c.share_percent}% Vol
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 mt-2">
                    <div>
                      <span>Avg Fare:</span> <strong className="text-slate-200">${c.average_fare_usd}</strong>
                    </div>
                    <div>
                      <span>Radius:</span> <strong className="text-cyan-300">{c.radius_km} km</strong>
                    </div>
                    <div>
                      <span>Trips:</span> <strong className="text-slate-200">{c.trip_count}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
