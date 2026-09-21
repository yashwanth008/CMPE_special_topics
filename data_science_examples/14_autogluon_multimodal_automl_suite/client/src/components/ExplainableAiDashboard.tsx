import React, { useState, useEffect } from 'react';
import { Eye, Sliders, ArrowRight, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

export const ExplainableAiDashboard: React.FC = () => {
  const [globalXai, setGlobalXai] = useState<any>(null);
  const [shapWaterfall, setShapWaterfall] = useState<any>(null);
  const [whatIfResult, setWhatIfResult] = useState<any>(null);

  // What-if simulator states
  const [baseInput] = useState({
    contract_type: 'Month-to-Month',
    monthly_charges: 85.0,
    tenure_months: 8.0,
    num_support_tickets: 3,
    online_security: 'No'
  });

  const [modContract, setModContract] = useState('Two-Year');
  const [modTickets, setModTickets] = useState(0);
  const [modSecurity, setModSecurity] = useState('Yes');

  const fetchXai = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8014/api/xai/global');
      const data = await res.json();
      setGlobalXai(data);

      const shapRes = await fetch('http://127.0.0.1:8014/api/xai/local-shap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: baseInput })
      });
      const shapData = await shapRes.json();
      setShapWaterfall(shapData);

      runWhatIf();
    } catch (e) {
      console.error('XAI fetch error:', e);
    }
  };

  const runWhatIf = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8014/api/xai/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_inputs: baseInput,
          modifications: {
            contract_type: modContract,
            num_support_tickets: modTickets,
            online_security: modSecurity
          }
        })
      });
      const data = await res.json();
      setWhatIfResult(data);
    } catch (e) {
      console.error('What-if error:', e);
    }
  };

  useEffect(() => {
    fetchXai();
  }, []);

  useEffect(() => {
    runWhatIf();
  }, [modContract, modTickets, modSecurity]);

  if (!globalXai) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400">
        Loading Explainable AI & Game-Theoretic Shapley Attribution...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              AutoGluon Multimodal Explainability (XAI) Suite
            </h2>
            <p className="text-sm text-slate-400">
              Permutation feature importance drops, local TreeSHAP waterfall decomposition, and interactive counterfactual what-if sensitivity simulations.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono">
            <span className="text-slate-300">Base Expected Value:</span>
            <span className="font-bold text-cyan-300">E[f(x)] = {globalXai.shap_summary.base_expected_value}</span>
          </div>
        </div>
      </div>

      {/* Global Feature Importance & Local SHAP Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global Permutation Importance */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Global Permutation Feature Importance</h3>
          <p className="text-xs text-slate-400">
            Calculated as empirical validation score drop I(f) = Score(base) - Score(permuted):
          </p>

          <div className="space-y-2.5 pt-2">
            {globalXai.classification_feature_importance.map((item: any, idx: number) => {
              const maxDrop = globalXai.classification_feature_importance[0].importance_drop || 0.1;
              const pct = (item.importance_drop / maxDrop) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-slate-200">{item.feature}</span>
                    <span className="font-mono text-cyan-300 font-semibold">+{item.importance_drop}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Local TreeSHAP Waterfall Decomposition */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Local TreeSHAP Waterfall Decomposition</h3>
          <p className="text-xs text-slate-400">
            Decomposes individual inference f(x) = E[f(x)] + Σ φ_i into additive Shapley forces:
          </p>

          {shapWaterfall ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Base Prior Expectation E[f(x)]:</span>
                <span className="font-mono font-bold text-slate-200">{shapWaterfall.base_expected_value}</span>
              </div>

              {shapWaterfall.contributions.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-300">{c.feature}</span>
                  <span
                    className={`font-mono font-bold ${
                      c.value > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {c.value > 0 ? `+${c.value}` : `${c.value}`}
                  </span>
                </div>
              ))}

              <div className="p-3.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex justify-between items-center text-xs font-bold shadow-md">
                <span className="text-cyan-300">Final Predicted Probability f(x):</span>
                <span className="font-mono text-white text-sm font-black">
                  {(shapWaterfall.final_model_prediction * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Computing local Shapley attributions...
            </div>
          )}
        </div>
      </div>

      {/* Interactive What-If Counterfactual Sensitivity Playground */}
      <div className="glass-panel p-6 space-y-6">
        <div className="border-b border-slate-700/60 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Interactive Counterfactual What-If Sensitivity Playground
          </h3>
          <p className="text-xs text-slate-400">
            Simulate proactive retention interventions and measure real-time delta probability adjustments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Simulated Contract Policy:</span>
            <select
              id="select-whatif-contract"
              value={modContract}
              onChange={(e) => setModContract(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="Month-to-Month">Month-to-Month</option>
              <option value="One-Year">Upgrade to One-Year</option>
              <option value="Two-Year">Upgrade to Two-Year</option>
            </select>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Support Resolution (Tickets):</span>
            <select
              id="select-whatif-tickets"
              value={modTickets}
              onChange={(e) => setModTickets(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value={0}>0 (Fully Resolved Issues)</option>
              <option value={1}>1 Ticket</option>
              <option value={3}>3 Tickets (Current Baseline)</option>
              <option value={5}>5 Tickets (Escalated Frustration)</option>
            </select>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Complimentary Online Security:</span>
            <select
              id="select-whatif-security"
              value={modSecurity}
              onChange={(e) => setModSecurity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="Yes">Enable Free Online Security</option>
              <option value="No">No Security</option>
            </select>
          </div>
        </div>

        {whatIfResult && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Baseline Churn Risk vs Simulated Intervention:</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-mono font-bold text-rose-400">
                  {(whatIfResult.baseline.churn_probability * 100).toFixed(1)}%
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span className="text-2xl font-mono font-black text-emerald-400">
                  {(whatIfResult.modified.churn_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-cyan-300 mt-1 font-semibold">
                {whatIfResult.effect_interpretation}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Net Risk Reduction:</span>
              <div className="text-xl font-mono font-black text-emerald-300">
                {(Math.abs(whatIfResult.probability_delta) * 100).toFixed(1)}% Delta
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
