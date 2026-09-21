import React, { useState, useEffect } from 'react';
import { Zap, Activity, Sliders, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { ShapContribution } from '../types/spy';

export const FinancialExplainabilityStudio: React.FC = () => {
  const [shapList, setShapList] = useState<ShapContribution[]>([]);
  const [baseExpected, setBaseExpected] = useState<number>(0.0012);
  const [predictedRet, setPredictedRet] = useState<number>(0.0105);
  const [stressExample, setStressExample] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8015/api/xai/shap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.shap_waterfall) {
          setShapList(data.shap_waterfall.shap_waterfall || []);
          setBaseExpected(data.shap_waterfall.base_expected_value || 0.0012);
          setPredictedRet(data.shap_waterfall.predicted_log_return || 0.0105);
        }
        if (data.macro_stress_example) {
          setStressExample(data.macro_stress_example);
        }
      })
      .catch((err) => console.error('SHAP fetch error:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-extrabold text-white">Financial TreeSHAP &amp; Macro Sensitivity Studio</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Game-Theoretic XAI
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Exact additive feature attributions $f(x) = \mathbb&#123;E&#125;[f(x)] + \sum \phi_i$ and macroeconomic shock sensitivity derivatives.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: TreeSHAP Waterfall Decomposition */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Local TreeSHAP Waterfall Attribution</h3>
              <p className="text-xs text-slate-400 font-mono">Single-Day Forecast Return Decomposition</p>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="text-slate-400">Base Return: <span className="text-slate-200">{(baseExpected * 100).toFixed(2)}%</span></div>
              <div className="text-emerald-400 font-bold">Predicted: {(predictedRet * 100).toFixed(2)}%</div>
            </div>
          </div>

          {/* Waterfall Items */}
          <div className="space-y-3 pt-2">
            {shapList.map((item, i) => {
              const isPositive = item.shap_value >= 0;
              const barWidthPct = Math.min(100, Math.abs(item.shap_value) * 15000);

              return (
                <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{item.feature}</span>
                    <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{(item.shap_value * 100).toFixed(3)}%
                    </span>
                  </div>

                  {/* Horizontal Attribution Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPositive ? 'bg-emerald-400' : 'bg-rose-500'}`}
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400">{item.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Macroeconomic Stress Simulation */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-6 space-y-4 border-amber-500/30">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Macroeconomic Shock Scenario
            </h3>
            <p className="text-xs text-slate-300">
              Evaluates instantaneous portfolio risk sensitivity across simultaneous market disruptions.
            </p>

            {stressExample && (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-300">VIX Volatility Shock (+5.0 pts)</span>
                  <span className="font-mono font-bold text-rose-400">{stressExample.sensitivity_breakdown.vix_impact_pct.toFixed(2)}%</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-300">10Y US Treasury Yield Surge (+50 bps)</span>
                  <span className="font-mono font-bold text-rose-400">{stressExample.sensitivity_breakdown.tnx_impact_pct.toFixed(2)}%</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-300">US Dollar Index (DXY) Rally (+2.0%)</span>
                  <span className="font-mono font-bold text-rose-400">{stressExample.sensitivity_breakdown.dxy_impact_pct.toFixed(2)}%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-200">Total Net Stressed Alpha Impact</span>
                  <span className="font-mono text-sm font-extrabold text-rose-300">{stressExample.net_impact_pct.toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 space-y-2 border-slate-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Interpretability Rigor</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every multi-horizon price target is strictly explainable down to the single feature level. TreeSHAP guarantees game-theoretic symmetry, efficiency, and dummy player axioms across all 40+ market signals.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
