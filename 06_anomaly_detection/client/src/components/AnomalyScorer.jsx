import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Flame, Sliders, Zap, Activity, Info, BarChart2 } from 'lucide-react';
import { api } from '../utils/api';

const PRESETS = {
  nominal: {
    label: "Nominal Steady State",
    color: "var(--accent-emerald-bright)",
    values: {
      NetworkBytesIn: 120000,
      NetworkBytesOut: 110000,
      CPUUtilization: 28.0,
      MemoryPressure: 45.0,
      LatencyMs: 25.0,
      ErrorRate: 0.005,
      RequestVelocity: 110,
      AuthFailures: 0,
      EntropyScore: 0.42,
      DiskIOPS: 240
    }
  },
  ddos: {
    label: "Volumetric DDoS Attack",
    color: "var(--accent-rose)",
    values: {
      NetworkBytesIn: 6200000,
      NetworkBytesOut: 1900000,
      CPUUtilization: 98.0,
      MemoryPressure: 88.0,
      LatencyMs: 1200.0,
      ErrorRate: 0.24,
      RequestVelocity: 3800,
      AuthFailures: 6,
      EntropyScore: 0.95,
      DiskIOPS: 3400
    }
  },
  stealth: {
    label: "Credential Stuffing & Infiltration",
    color: "var(--accent-indigo-bright)",
    values: {
      NetworkBytesIn: 110000,
      NetworkBytesOut: 95000,
      CPUUtilization: 35.0,
      MemoryPressure: 52.0,
      LatencyMs: 45.0,
      ErrorRate: 0.05,
      RequestVelocity: 140,
      AuthFailures: 68,
      EntropyScore: 0.98,
      DiskIOPS: 110
    }
  },
  memory_leak: {
    label: "Resource Starvation & Memory Leak",
    color: "var(--accent-amber)",
    values: {
      NetworkBytesIn: 180000,
      NetworkBytesOut: 140000,
      CPUUtilization: 95.0,
      MemoryPressure: 99.4,
      LatencyMs: 5400.0,
      ErrorRate: 0.48,
      RequestVelocity: 65,
      AuthFailures: 1,
      EntropyScore: 0.52,
      DiskIOPS: 3900
    }
  }
};

export const AnomalyScorer = ({ featureCatalog = [], initialThreshold = 68.0 }) => {
  const [features, setFeatures] = useState(PRESETS.nominal.values);
  const [scoreResult, setScoreResult] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);

  const handleScore = async (currentFeats) => {
    setIsScoring(true);
    try {
      const res = await api.scoreTelemetry(currentFeats);
      if (res.success) {
        setScoreResult(res.result);
        setScoreHistory((prev) => [...prev, res.result.threat_score].slice(-24));
      }
    } catch (err) {
      console.error('Scoring failed:', err);
    } finally {
      setIsScoring(false);
    }
  };

  useEffect(() => {
    handleScore(features);
  }, []);

  const handleSliderChange = (featName, val) => {
    const next = { ...features, [featName]: parseFloat(val) };
    setFeatures(next);
    handleScore(next);
  };

  const applyPreset = (key) => {
    const preset = PRESETS[key].values;
    setFeatures(preset);
    handleScore(preset);
  };

  const threatScore = scoreResult?.threat_score || 0;
  const isAnomaly = scoreResult?.is_anomaly || false;
  const threatLevel = scoreResult?.threat_level || 'NOMINAL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Problem Deep-Dive Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(99, 102, 241, 0.08))', borderColor: 'var(--border-active)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--accent-rose)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-rose)' }}>
                Kaggle High-Dimensional Anomaly Detection & Threat Intelligence
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Multi-Backbone Unsupervised Telemetry Threat Scoring
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '850px' }}>
              Evaluates 10-dimensional network and server metric streams using <strong>Isolation Forest</strong> path length partition scoring, <strong>Autoencoder Bottleneck</strong> reconstruction error, and <strong>LOF Density Ratios</strong>.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(6, 8, 19, 0.8)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Champion ROC-AUC</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan-bright)' }}>
                0.9580
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Inference Latency</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald-bright)' }}>
                &lt; 0.28ms
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Top SOTA Baseline</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose-bright)' }}>
                0.9620
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Archetype Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.3rem' }}>
          Simulate Attack Archetype:
        </span>
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderColor: preset.color }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: preset.color }}></span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Main Scorer Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '1.5rem' }}>
        {/* Left: 10 Telemetry Sliders */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
              Live Telemetry Feature Vectors
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              10-Dimensional Observation Vector
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Request Velocity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Request Velocity (Req/sec)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 700 }}>
                  {features.RequestVelocity} req/s
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="5000"
                step="25"
                value={features.RequestVelocity}
                onChange={(e) => handleSliderChange('RequestVelocity', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            {/* Network Bytes In */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Network Throughput In (Bytes/sec)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)', fontWeight: 700 }}>
                  {(features.NetworkBytesIn / 1000).toFixed(0)} KB/s
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="8000000"
                step="50000"
                value={features.NetworkBytesIn}
                onChange={(e) => handleSliderChange('NetworkBytesIn', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            {/* Auth Failures */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Failed Authentication Count</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo-bright)', fontWeight: 700 }}>
                  {features.AuthFailures} failures
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={features.AuthFailures}
                onChange={(e) => handleSliderChange('AuthFailures', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
              />
            </div>

            {/* Memory Pressure */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Memory Pressure (%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                  {features.MemoryPressure}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="0.5"
                value={features.MemoryPressure}
                onChange={(e) => handleSliderChange('MemoryPressure', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>

            {/* Latency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API Latency (ms)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)', fontWeight: 700 }}>
                  {features.LatencyMs} ms
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="6000"
                step="25"
                value={features.LatencyMs}
                onChange={(e) => handleSliderChange('LatencyMs', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
              />
            </div>

            {/* Entropy Score */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payload Entropy Score (0.0 - 1.0)</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo-bright)', fontWeight: 700 }}>
                  {features.EntropyScore}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.0"
                step="0.02"
                value={features.EntropyScore}
                onChange={(e) => handleSliderChange('EntropyScore', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Threat Score & Anomaly Verdict */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Threat Meter Card */}
          <div className="card" style={{ borderColor: isAnomaly ? 'var(--accent-rose)' : 'var(--border-subtle)', background: isAnomaly ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(12, 16, 36, 0.95))' : 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Ensemble Threat Index
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isAnomaly ? 'var(--accent-rose-bright)' : 'var(--accent-emerald-bright)', background: isAnomaly ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                {threatLevel} THREAT
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 800, color: isAnomaly ? 'var(--accent-rose-bright)' : 'var(--accent-emerald-bright)' }}>
                {threatScore}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                / 100
              </div>
            </div>

            {/* Threshold Progress Bar */}
            <div style={{ width: '100%', height: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: `${threatScore}%`,
                  height: '100%',
                  background: isAnomaly ? 'linear-gradient(to right, var(--accent-amber), var(--accent-rose))' : 'linear-gradient(to right, var(--accent-cyan), var(--accent-emerald))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Decision Cutoff: <strong>{scoreResult?.threat_threshold || initialThreshold}</strong> • Classification: <strong style={{ color: isAnomaly ? 'var(--accent-rose-bright)' : 'var(--accent-emerald-bright)' }}>{isAnomaly ? 'MALICIOUS ANOMALY' : 'NOMINAL BENIGN'}</strong>
            </div>

            {/* Live Threat Score Sparkline */}
            {scoreHistory.length > 1 && (
              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.3rem' }}>
                  Live Session Threat Trend
                </div>
                <svg width="100%" height="34" viewBox="0 0 240 34" preserveAspectRatio="none" style={{ display: 'block' }}>
                  {(() => {
                    const max = 100;
                    const w = 240, h = 34, n = scoreHistory.length;
                    const pts = scoreHistory.map((s, i) => {
                      const x = n === 1 ? 0 : (i / (n - 1)) * w;
                      const y = h - (Math.min(s, max) / max) * h;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ');
                    const cutoffY = h - (Math.min(scoreResult?.threat_threshold || initialThreshold, max) / max) * h;
                    return (
                      <>
                        <line x1="0" y1={cutoffY} x2={w} y2={cutoffY} stroke="var(--accent-amber)" strokeDasharray="3,3" strokeWidth="1" opacity="0.6" />
                        <polyline points={pts} fill="none" stroke={isAnomaly ? 'var(--accent-rose)' : 'var(--accent-cyan)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* Diagnosed Archetype */}
            <div style={{ marginTop: '1rem', background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                Automated Root-Cause Diagnostic
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                {scoreResult?.diagnosed_archetype || 'Analyzing telemetry signals...'}
              </div>
            </div>
          </div>

          {/* Top Feature Attributions */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <BarChart2 size={16} style={{ color: 'var(--accent-cyan-bright)' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                Top Anomaly Attribution Deviations (IQR Distances)
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {scoreResult?.top_contributing_features?.map((f) => (
                <div key={f.feature}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: f.is_anomalous ? 'var(--accent-rose-bright)' : 'var(--text-secondary)', fontWeight: f.is_anomalous ? 700 : 500 }}>
                      {f.feature} (+{f.deviation_sigma}σ)
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan-bright)' }}>
                      {f.contribution_pct}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, f.contribution_pct)}%`,
                        height: '100%',
                        background: f.is_anomalous ? 'var(--accent-rose)' : 'var(--accent-indigo)',
                        borderRadius: 'var(--radius-full)'
                      }}
                    ></div>
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
