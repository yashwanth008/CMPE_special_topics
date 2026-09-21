import React, { useState, useEffect } from 'react';
import { Binary, Search } from 'lucide-react';
import { RecordItem } from '../types';
import { MarkdownMathRenderer } from './MarkdownMathRenderer';

export const Phase6LSH: React.FC = () => {
  const [targetId, setTargetId] = useState<string>('ID_0042');
  const [nNeighbors, setNNeighbors] = useState<number>(5);
  const [lshResult, setLshResult] = useState<{
    query_record: RecordItem;
    n_neighbors: number;
    lsh_bucket_hash: string;
    nearest_neighbors: RecordItem[];
    lsh_speedup_vs_exact_knn: string;
  } | null>(null);

  const fetchLSH = () => {
    fetch(`http://127.0.0.1:8010/api/lsh/search?target_id=${targetId}&n_neighbors=${nNeighbors}`)
      .then((res) => res.json())
      .then((d) => setLshResult(d))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLSH();
  }, [targetId, nNeighbors]);

  return (
    <div className="space-y-8">
      {/* Header Callout */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 backdrop-blur-md space-y-2">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
          <Binary className="w-4 h-4" />
          <span>CRISP-DM Phase 6: Locality-Sensitive Hashing (LSH)</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Sub-Linear Approximate Nearest Neighbors via Random Hyperplanes
        </h2>
        <MarkdownMathRenderer
          content="Exact k-Nearest Neighbors has linear computational complexity $\mathcal{O}(N \cdot D)$. Locality-Sensitive Hashing applies random hyperplane projection to ensure that vectors with high cosine similarity collide into identical hash buckets with probability $P(h(\mathbf{u}) = h(\mathbf{v})) = 1 - \frac{\theta(\mathbf{u}, \mathbf{v})}{\pi}$, enabling $\mathcal{O}(1)$ expected query retrieval."
        />
      </div>

      {/* Query Selector Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Select Query Record ID</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ID_0042">ID_0042 (Mid-Career Specialist)</option>
              <option value="ID_0100">ID_0100 (Executive Manager)</option>
              <option value="ID_0500">ID_0500 (Senior Tech Lead)</option>
              <option value="ID_1200">ID_1200 (Self-Employed Inc)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">Nearest Neighbors ($k = {nNeighbors}$)</label>
            <input
              type="range"
              min="3"
              max="8"
              value={nNeighbors}
              onChange={(e) => setNNeighbors(parseInt(e.target.value))}
              className="accent-cyan-500 cursor-pointer w-32"
            />
          </div>
        </div>

        {lshResult && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Hash Bucket:</span>
              <span className="text-cyan-400 font-bold">{lshResult.lsh_bucket_hash}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Sub-Linear Speedup:</span>
              <span className="text-emerald-400 font-bold">{lshResult.lsh_speedup_vs_exact_knn}</span>
            </div>
          </div>
        )}
      </div>

      {/* Query Record Details + Neighbor Collisions Table */}
      {lshResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Vector Card */}
          <div className="lg:col-span-1 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              Query Probe Vector
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="text-white font-bold">{lshResult.query_record.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Occupation:</span>
                <span className="text-indigo-300">{lshResult.query_record.occupation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age:</span>
                <span className="text-slate-200">{lshResult.query_record.age} yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Education:</span>
                <span className="text-slate-200">{lshResult.query_record.education_num} yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Income:</span>
                <span className="text-emerald-400 font-bold">
                  ${lshResult.query_record.annual_income.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Colliding Neighbors */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              LSH Bucket Collisions ($k = {nNeighbors}$ Nearest Demographic Neighbors)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="p-2">Neighbor ID</th>
                    <th className="p-2">Occupation</th>
                    <th className="p-2">Age</th>
                    <th className="p-2">Edu Yrs</th>
                    <th className="p-2">Hours</th>
                    <th className="p-2 text-emerald-400 font-bold">Income</th>
                  </tr>
                </thead>
                <tbody>
                  {lshResult.nearest_neighbors.map((n) => (
                    <tr key={n.id} className="border-b border-slate-800/40 hover:bg-slate-800/40">
                      <td className="p-2 text-cyan-400 font-bold">{n.id}</td>
                      <td className="p-2 text-slate-200">{n.occupation}</td>
                      <td className="p-2 text-slate-300">{n.age}</td>
                      <td className="p-2 text-slate-300">{n.education_num}</td>
                      <td className="p-2 text-slate-300">{n.hours_per_week}h</td>
                      <td className="p-2 text-emerald-400 font-bold">${n.annual_income.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
