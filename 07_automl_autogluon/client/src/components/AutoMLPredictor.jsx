import React, { useState, useEffect } from 'react';
import { Layers, Activity, Zap, CheckCircle2, AlertTriangle, Sliders, TrendingUp, DollarSign, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api';

const CLS_PRESETS = {
  loyal: {
    label: "Loyal VIP Customer",
    values: {
      Age: 46,
      AnnualIncome: 145000,
      CreditScore: 780,
      AccountTenure: 8.5,
      TransactionFrequency: 45,
      AvgTransactionAmount: 320,
      BalanceToIncomeRatio: 0.18,
      SupportTickets: 0,
      DeviceRiskScore: 8,
      IsPremiumMember: 1
    }
  },
  churn_risk: {
    label: "High Churn Risk Customer",
    values: {
      Age: 32,
      AnnualIncome: 42000,
      CreditScore: 580,
      AccountTenure: 1.2,
      TransactionFrequency: 6,
      AvgTransactionAmount: 45,
      BalanceToIncomeRatio: 0.78,
      SupportTickets: 4,
      DeviceRiskScore: 74,
      IsPremiumMember: 0
    }
  }
};

const REG_PRESETS = {
  rare_diamond: {
    label: "Rare 2.5-Carat Ideal Diamond",
    values: {
      CaratWeight: 2.50,
      CutQualityScore: 5,
      ColorGrade: 7,
      ClarityGrade: 8,
      DepthPct: 61.8,
      TableWidth: 57.0,
      VolumeMm3: 395.0,
      CertificationRating: 4
    }
  },
  commercial_diamond: {
    label: "Commercial 0.7-Carat Diamond",
    values: {
      CaratWeight: 0.70,
      CutQualityScore: 3,
      ColorGrade: 4,
      ClarityGrade: 4,
      DepthPct: 62.5,
      TableWidth: 58.5,
      VolumeMm3: 112.0,
      CertificationRating: 2
    }
  }
};

export const AutoMLPredictor = () => {
  const [task, setTask] = useState('classification');
  const [clsFeatures, setClsFeatures] = useState(CLS_PRESETS.loyal.values);
  const [regFeatures, setRegFeatures] = useState(REG_PRESETS.rare_diamond.values);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const runPrediction = async (currentTask, feats) => {
    setIsPredicting(true);
    try {
      const res = await api.predict(currentTask, feats);
      if (res.success) {
        setPredictionResult(res.result);
      }
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    if (task === 'classification') {
      runPrediction('classification', clsFeatures);
    } else {
      runPrediction('regression', regFeatures);
    }
  }, [task]);

  const handleClsChange = (field, val) => {
    const next = { ...clsFeatures, [field]: parseFloat(val) };
    setClsFeatures(next);
    runPrediction('classification', next);
  };

  const handleRegChange = (field, val) => {
    const next = { ...regFeatures, [field]: parseFloat(val) };
    setRegFeatures(next);
    runPrediction('regression', next);
  };

  const applyClsPreset = (key) => {
    const preset = CLS_PRESETS[key].values;
    setClsFeatures(preset);
    runPrediction('classification', preset);
  };

  const applyRegPreset = (key) => {
    const preset = REG_PRESETS[key].values;
    setRegFeatures(preset);
    runPrediction('regression', preset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Problem Deep-Dive Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))', borderColor: 'var(--border-violet)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Layers size={18} style={{ color: 'var(--accent-violet-bright)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-violet-bright)' }}>
                AutoGluon Multi-Layer Stacking & Caruana Selection Architecture
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Automated Multi-Task Ensembling on Kaggle Benchmarks
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '850px' }}>
              Leverages 3-level model stacking where Level 1 base model Out-of-Fold (OOF) predictions are concatenated into Level 2 meta-features, and Level 3 applies Caruana greedy forward model selection to minimize validation loss.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(8, 9, 24, 0.8)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Champion ROC-AUC</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                0.9420
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Regression R²</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                0.9340
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Inference Speed</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-violet-bright)' }}>
                &lt; 0.045ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Mode Switcher & Presets */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`nav-tab-btn ${task === 'classification' ? 'active' : ''}`}
            onClick={() => setTask('classification')}
            id="btn-task-classification"
          >
            <UserCheck size={14} />
            <span>Tabular Classification (Customer Churn)</span>
          </button>
          <button
            className={`nav-tab-btn ${task === 'regression' ? 'active' : ''}`}
            onClick={() => setTask('regression')}
            id="btn-task-regression"
          >
            <DollarSign size={14} />
            <span>Tabular Regression (Diamond Valuation)</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Presets:</span>
          {task === 'classification' ? (
            <>
              <button onClick={() => applyClsPreset('loyal')} className="btn-secondary" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                🟢 Loyal VIP
              </button>
              <button onClick={() => applyClsPreset('churn_risk')} className="btn-secondary" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', color: 'var(--accent-rose)' }}>
                🔴 High Churn Risk
              </button>
            </>
          ) : (
            <>
              <button onClick={() => applyRegPreset('rare_diamond')} className="btn-secondary" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', color: 'var(--accent-cyan-bright)' }}>
                💎 Rare 2.5-Carat
              </button>
              <button onClick={() => applyRegPreset('commercial_diamond')} className="btn-secondary" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                💍 Commercial 0.7-Carat
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Predictor Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '1.5rem' }}>
        {/* Left: Interactive Feature Sliders */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
              {task === 'classification' ? 'Customer Profile Observation Vector' : 'Asset Specification Features'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Real-time In-Memory Scoring
            </span>
          </div>

          {task === 'classification' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Annual Income */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Annual Income ($)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-bright)', fontWeight: 700 }}>
                    ${clsFeatures.AnnualIncome.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="300000"
                  step="5000"
                  value={clsFeatures.AnnualIncome}
                  onChange={(e) => handleClsChange('AnnualIncome', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
                />
              </div>

              {/* Balance To Income Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Balance-to-Income Ratio</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 700 }}>
                    {(clsFeatures.BalanceToIncomeRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.01"
                  value={clsFeatures.BalanceToIncomeRatio}
                  onChange={(e) => handleClsChange('BalanceToIncomeRatio', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>

              {/* Support Tickets */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Support Tickets (Last 90 Days)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)', fontWeight: 700 }}>
                    {clsFeatures.SupportTickets} tickets
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={clsFeatures.SupportTickets}
                  onChange={(e) => handleClsChange('SupportTickets', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
                />
              </div>

              {/* Credit Score */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Credit Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet-bright)', fontWeight: 700 }}>
                    {clsFeatures.CreditScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="450"
                  max="850"
                  step="5"
                  value={clsFeatures.CreditScore}
                  onChange={(e) => handleClsChange('CreditScore', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-violet)' }}
                />
              </div>

              {/* Device Risk Score */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Device & Login Risk Score</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                    {clsFeatures.DeviceRiskScore} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={clsFeatures.DeviceRiskScore}
                  onChange={(e) => handleClsChange('DeviceRiskScore', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Carat Weight */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Carat Weight (ct)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 700 }}>
                    {regFeatures.CaratWeight.toFixed(2)} ct
                  </span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="4.00"
                  step="0.05"
                  value={regFeatures.CaratWeight}
                  onChange={(e) => handleRegChange('CaratWeight', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>

              {/* Cut Quality */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cut Quality Score (1=Fair ... 5=Ideal)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-violet-bright)', fontWeight: 700 }}>
                    {regFeatures.CutQualityScore} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={regFeatures.CutQualityScore}
                  onChange={(e) => handleRegChange('CutQualityScore', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-violet)' }}
                />
              </div>

              {/* Color Grade */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Color Grade (1=J ... 7=D Flawless)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-bright)', fontWeight: 700 }}>
                    Grade {regFeatures.ColorGrade} / 7
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  step="1"
                  value={regFeatures.ColorGrade}
                  onChange={(e) => handleRegChange('ColorGrade', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
                />
              </div>

              {/* Volume */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Volume (mm³)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                    {regFeatures.VolumeMm3} mm³
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="10"
                  value={regFeatures.VolumeMm3}
                  onChange={(e) => handleRegChange('VolumeMm3', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Multi-Level Inference Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Verdict Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(15, 18, 40, 0.95))', borderColor: 'var(--border-violet)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Level 3 Stacking Ensemble Output
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald-bright)', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                WeightedEnsemble_L3
              </span>
            </div>

            {task === 'classification' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 800, color: predictionResult?.is_churn ? 'var(--accent-rose)' : 'var(--accent-emerald-bright)' }}>
                    {((predictionResult?.probability || 0) * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Churn Probability
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: predictionResult?.is_churn ? 'var(--accent-rose)' : 'var(--accent-emerald-bright)', marginBottom: '0.75rem' }}>
                  Verdict: {predictionResult?.prediction_label || 'COMPUTING...'}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                    ${(predictionResult?.estimated_value || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Estimated Asset Value
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  95% Confidence Interval: <strong style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>${(predictionResult?.valuation_range_95?.lower || 0).toLocaleString()} — ${(predictionResult?.valuation_range_95?.upper || 0).toLocaleString()}</strong>
                </div>
              </>
            )}

            {/* Base Model Agreement Meter */}
            {predictionResult?.model_ensemble_breakdown?.Level_1_Base_Predictions && (() => {
              const vals = Object.values(predictionResult.model_ensemble_breakdown.Level_1_Base_Predictions);
              const spread = Math.max(...vals) - Math.min(...vals);
              const ref = task === 'classification' ? 1.0 : (predictionResult?.estimated_value || 1);
              const agreementPct = Math.max(0, Math.min(100, 100 - (spread / ref) * (task === 'classification' ? 100 : 400)));
              const agreementColor = agreementPct > 80 ? 'var(--accent-emerald-bright)' : agreementPct > 55 ? 'var(--accent-amber)' : 'var(--accent-rose)';
              return (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Base Model Agreement</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: agreementColor }}>{agreementPct.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${agreementPct}%`, height: '100%', background: agreementColor, borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Measures how tightly the 5 Level-1 base learners cluster around the ensemble output — low spread signals a stable, confident stack.
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Model Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Layers size={16} style={{ color: 'var(--accent-violet-bright)' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                Multi-Layer Prediction Stacking Breakdown
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
              {/* Level 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(139, 92, 246, 0.15)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-violet)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-violet-bright)' }}>Level 3 (Caruana Ensemble)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  {task === 'classification' ? `${((predictionResult?.model_ensemble_breakdown?.Level_3_Caruana_Final_Score || 0) * 100).toFixed(1)}%` : `$${(predictionResult?.model_ensemble_breakdown?.Level_3_Caruana_Final_Score || 0).toLocaleString()}`}
                </span>
              </div>

              {/* Level 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(6, 182, 212, 0.1)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan-bright)' }}>Level 2 (LightGBM Stack)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {task === 'classification' ? `${((predictionResult?.model_ensemble_breakdown?.Level_2_Stack_Prediction || 0) * 100).toFixed(1)}%` : `$${(predictionResult?.model_ensemble_breakdown?.Level_2_Stack_Prediction || 0).toLocaleString()}`}
                </span>
              </div>

              {/* Level 1 Base Models */}
              {predictionResult?.model_ensemble_breakdown?.Level_1_Base_Predictions && Object.entries(predictionResult.model_ensemble_breakdown.Level_1_Base_Predictions).map(([mName, val]) => (
                <div key={mName} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{mName} (Level 1)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {task === 'classification' ? `${(val * 100).toFixed(1)}%` : `$${val.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
