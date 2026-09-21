import React, { useState, useEffect } from 'react';
import { Layers, Sliders, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const TabularStackingPredictor: React.FC = () => {
  const [task, setTask] = useState<'churn' | 'diamond'>('churn');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [threshold, setThreshold] = useState<number>(0.42);

  // Form states for Churn
  const [churnForm, setChurnForm] = useState({
    age: 45.0,
    tenure_months: 8.0,
    monthly_charges: 85.50,
    total_charges: 684.0,
    contract_type: 'Month-to-Month',
    tech_support: 'No',
    payment_method: 'Electronic Check',
    online_security: 'No',
    paperless_billing: 'Yes',
    streaming_tv: 'Yes',
    num_support_tickets: 3
  });

  // Form states for Diamond
  const [diamondForm, setDiamondForm] = useState({
    carat: 1.25,
    cut: 'Ideal',
    color: 'E',
    clarity: 'VS1',
    depth: 61.5,
    table: 57.0,
    x: 6.92,
    y: 6.95,
    z: 4.27
  });

  const runInference = async () => {
    setLoading(true);
    try {
      if (task === 'churn') {
        const res = await fetch('http://127.0.0.1:8014/api/tabular/predict-churn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(churnForm)
        });
        const data = await res.json();
        setResult(data);
      } else {
        const res = await fetch('http://127.0.0.1:8014/api/tabular/predict-diamond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diamondForm)
        });
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error('Inference error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runInference();
  }, [task]);

  const loadChurnPreset = (type: 'high_risk' | 'loyal') => {
    if (type === 'high_risk') {
      setChurnForm({
        age: 38.0,
        tenure_months: 3.0,
        monthly_charges: 95.0,
        total_charges: 285.0,
        contract_type: 'Month-to-Month',
        tech_support: 'No',
        payment_method: 'Electronic Check',
        online_security: 'No',
        paperless_billing: 'Yes',
        streaming_tv: 'Yes',
        num_support_tickets: 4
      });
    } else {
      setChurnForm({
        age: 52.0,
        tenure_months: 48.0,
        monthly_charges: 55.0,
        total_charges: 2640.0,
        contract_type: 'Two-Year',
        tech_support: 'Yes',
        payment_method: 'Credit Card',
        online_security: 'Yes',
        paperless_billing: 'No',
        streaming_tv: 'No',
        num_support_tickets: 0
      });
    }
  };

  const loadDiamondPreset = (type: 'luxury' | 'budget') => {
    if (type === 'luxury') {
      setDiamondForm({
        carat: 2.10,
        cut: 'Ideal',
        color: 'D',
        clarity: 'IF',
        depth: 61.8,
        table: 56.5,
        x: 8.20,
        y: 8.24,
        z: 5.08
      });
    } else {
      setDiamondForm({
        carat: 0.50,
        cut: 'Good',
        color: 'H',
        clarity: 'SI2',
        depth: 62.5,
        table: 58.0,
        x: 5.10,
        y: 5.12,
        z: 3.19
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Task Switcher */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              AutoGluon Multi-Layer Stacking DAG Predictor
            </h2>
            <p className="text-sm text-slate-400">
              Orchestrates Level 1 base learners, Level 2 out-of-fold meta-features, and Level 3 Caruana ensemble weights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 flex">
              <button
                id="btn-task-churn"
                onClick={() => setTask('churn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  task === 'churn' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Customer Churn (Binary Clf)
              </button>
              <button
                id="btn-task-diamond"
                onClick={() => setTask('diamond')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  task === 'diamond' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diamond Valuation (Regression)
              </button>
            </div>

            <button
              id="btn-run-tabular-inference"
              onClick={runInference}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Execute DAG Inference</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form & 3-Level Stacking DAG Live Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Feature Ingestion Vector
            </h3>
            {task === 'churn' ? (
              <div className="flex gap-2">
                <button
                  id="preset-high-risk"
                  onClick={() => loadChurnPreset('high_risk')}
                  className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] rounded hover:bg-rose-500/30 font-medium cursor-pointer"
                >
                  Preset: High Risk
                </button>
                <button
                  id="preset-loyal"
                  onClick={() => loadChurnPreset('loyal')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] rounded hover:bg-emerald-500/30 font-medium cursor-pointer"
                >
                  Preset: Loyal
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  id="preset-luxury"
                  onClick={() => loadDiamondPreset('luxury')}
                  className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] rounded hover:bg-amber-500/30 font-medium cursor-pointer"
                >
                  Preset: 2.10ct Luxury
                </button>
                <button
                  id="preset-budget"
                  onClick={() => loadDiamondPreset('budget')}
                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] rounded hover:bg-cyan-500/30 font-medium cursor-pointer"
                >
                  Preset: 0.50ct Budget
                </button>
              </div>
            )}
          </div>

          {task === 'churn' ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Contract Type:</span>
                  <span className="font-semibold text-indigo-300">{churnForm.contract_type}</span>
                </div>
                <select
                  id="select-contract-type"
                  value={churnForm.contract_type}
                  onChange={(e) => setChurnForm({ ...churnForm, contract_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="Month-to-Month">Month-to-Month</option>
                  <option value="One-Year">One-Year</option>
                  <option value="Two-Year">Two-Year</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Tenure (Months):</span>
                  <span className="font-semibold text-indigo-300">{churnForm.tenure_months} mo</span>
                </div>
                <input
                  id="slider-tenure"
                  type="range"
                  min="1"
                  max="72"
                  step="1"
                  value={churnForm.tenure_months}
                  onChange={(e) => setChurnForm({ ...churnForm, tenure_months: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Monthly Charges ($):</span>
                  <span className="font-semibold text-indigo-300">${churnForm.monthly_charges.toFixed(2)}</span>
                </div>
                <input
                  id="slider-monthly-charges"
                  type="range"
                  min="18.0"
                  max="130.0"
                  step="0.5"
                  value={churnForm.monthly_charges}
                  onChange={(e) => setChurnForm({ ...churnForm, monthly_charges: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Support Tickets Logged:</span>
                  <span className="font-semibold text-indigo-300">{churnForm.num_support_tickets} tickets</span>
                </div>
                <input
                  id="slider-support-tickets"
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={churnForm.num_support_tickets}
                  onChange={(e) => setChurnForm({ ...churnForm, num_support_tickets: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-400 block mb-1">Payment Method:</span>
                  <select
                    id="select-payment-method"
                    value={churnForm.payment_method}
                    onChange={(e) => setChurnForm({ ...churnForm, payment_method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="Electronic Check">Electronic Check</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mailed Check">Mailed Check</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Online Security:</span>
                  <select
                    id="select-online-security"
                    value={churnForm.online_security}
                    onChange={(e) => setChurnForm({ ...churnForm, online_security: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Diamond Carat Weight:</span>
                  <span className="font-semibold text-indigo-300">{diamondForm.carat.toFixed(2)} Carats</span>
                </div>
                <input
                  id="slider-diamond-carat"
                  type="range"
                  min="0.2"
                  max="3.5"
                  step="0.05"
                  value={diamondForm.carat}
                  onChange={(e) => setDiamondForm({ ...diamondForm, carat: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block mb-1">Cut:</span>
                  <select
                    id="select-diamond-cut"
                    value={diamondForm.cut}
                    onChange={(e) => setDiamondForm({ ...diamondForm, cut: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="Ideal">Ideal</option>
                    <option value="Premium">Premium</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Color:</span>
                  <select
                    id="select-diamond-color"
                    value={diamondForm.color}
                    onChange={(e) => setDiamondForm({ ...diamondForm, color: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="D">D (Colorless)</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                    <option value="I">I</option>
                    <option value="J">J</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Clarity:</span>
                  <select
                    id="select-diamond-clarity"
                    value={diamondForm.clarity}
                    onChange={(e) => setDiamondForm({ ...diamondForm, clarity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="IF">IF (Flawless)</option>
                    <option value="VVS1">VVS1</option>
                    <option value="VVS2">VVS2</option>
                    <option value="VS1">VS1</option>
                    <option value="VS2">VS2</option>
                    <option value="SI1">SI1</option>
                    <option value="SI2">SI2</option>
                    <option value="I1">I1</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 3-Level Stacking DAG Live View */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Live 3-Level Stacking DAG Flowchart & Ensemble Inference
            </h3>
            {result && (
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                Latency: {result.inference_latency_ms} ms
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-6">
              {/* Level 1 Base Learners */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Level 1: Base Learner Ensembles
                  </span>
                  <span className="text-[11px] text-slate-400">Trained on Raw Feats</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(result.level1_base_predictions || {}).map(([name, val]: [string, any]) => (
                    <div key={name} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <div className="text-slate-400 truncate font-mono text-[11px]">{name}</div>
                      <div className="font-bold text-slate-200 mt-1">
                        {task === 'churn' ? `${(val * 100).toFixed(1)}%` : `$${val.toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stacking Vector Arrow */}
              <div className="flex justify-center -my-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
                  <span>Out-of-Fold (OOF) Vector Concatenation: X_L2 = [X_raw, Preds_L1]</span>
                  <ArrowRight className="w-3 h-3 animate-pulse" />
                </div>
              </div>

              {/* Level 2 Meta-Models */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Level 2: Stacking Meta-Models
                  </span>
                  <span className="text-[11px] text-slate-400">OOF Non-Linear Blending</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.level2_stack_predictions || {}).map(([name, val]: [string, any]) => (
                    <div key={name} className="bg-slate-900/80 p-3 rounded-lg border border-violet-500/30 text-xs shadow-md">
                      <div className="text-violet-300 font-mono text-[11px] font-semibold">{name}</div>
                      <div className="font-extrabold text-white text-sm mt-1">
                        {task === 'churn' ? `${(val * 100).toFixed(1)}%` : `$${val.toLocaleString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 3: Weighted Ensemble Champion */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-violet-950/60 to-slate-900/80 border border-indigo-500/40 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Level 3: WeightedEnsemble_L3 (Caruana Greedy Selection)
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                    🏆 Champion SOTA
                  </span>
                </div>

                {task === 'churn' ? (
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {(result.predicted_churn_probability * 100).toFixed(1)}%
                        <span className="text-xs text-slate-400 font-normal ml-2">Churn Risk Probability</span>
                      </div>
                      <div className="text-xs font-medium text-slate-300 mt-1">
                        Status: <span className={result.predicted_churn_probability > 0.42 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {result.predicted_churn_probability > 0.42 ? 'PREDICTED CHURN (Risk Action Required)' : 'PREDICTED RETAINED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-300 mt-1">
                        Policy: {result.recommended_action}
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-700/60 sm:pl-4">
                      <div className="text-xs text-slate-400">Decision Cutoff:</div>
                      <div className="text-sm font-mono font-bold text-amber-300">θ = {result.decision_threshold}</div>
                      <div className="text-[10px] text-slate-400">Profit Maximized</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-2xl font-black text-white">
                        ${result.predicted_price_usd.toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal ml-2">Valuation (USD)</span>
                      </div>
                      <div className="text-xs font-medium text-slate-300 mt-1">
                        95% Confidence Interval: <span className="text-cyan-300 font-mono">${result.prediction_interval_95.lower.toLocaleString()} - ${result.prediction_interval_95.upper.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-700/60 sm:pl-4">
                      <div className="text-xs text-slate-400">Ensemble Level:</div>
                      <div className="text-sm font-mono font-bold text-cyan-300">Level 3 Convex</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Ingesting tabular vectors and calculating multi-layer stack...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
