import React, { useState, useEffect } from 'react';
import { TripInferenceInput, PredictionResponse, AsyncState } from '../types';
import {
  DollarSign, Sparkles, TrendingUp, Leaf, Zap, CloudRain, Clock,
  MapPin, Users, CreditCard, Compass, ChevronRight, BarChart2, History
} from 'lucide-react';

const PRESET_ROUTES = [
  {
    name: 'Times Square to JFK Airport',
    pickup: { lat: 40.7580, lon: -73.9855 },
    dropoff: { lat: 40.6413, lon: -73.7781 },
    rate_code: 'JFK',
    congestion: 2.50
  },
  {
    name: 'Wall St to LaGuardia Airport (LGA)',
    pickup: { lat: 40.7075, lon: -74.0090 },
    dropoff: { lat: 40.7769, lon: -73.8740 },
    rate_code: 'Standard',
    congestion: 2.50
  },
  {
    name: 'Williamsburg Brooklyn to Midtown',
    pickup: { lat: 40.7143, lon: -73.9575 },
    dropoff: { lat: 40.7549, lon: -73.9840 },
    rate_code: 'Standard',
    congestion: 2.50
  },
  {
    name: 'Upper West Side to Newark Airport',
    pickup: { lat: 40.7870, lon: -73.9754 },
    dropoff: { lat: 40.6895, lon: -74.1745 },
    rate_code: 'Newark',
    congestion: 0.0
  }
];

export const TripEstimator: React.FC = () => {
  const [formData, setFormData] = useState<TripInferenceInput>({
    pickup_latitude: 40.7580,
    pickup_longitude: -73.9855,
    dropoff_latitude: 40.6413,
    dropoff_longitude: -73.7781,
    passenger_count: 2,
    vendor_id: 'CreativeMobile',
    rate_code: 'JFK',
    payment_type: 'Credit Card',
    hour_of_day: 17,
    day_of_week: 4,
    temperature_c: 18.0,
    precipitation_mm: 3.5,
    wind_speed_kmh: 12.0,
    congestion_surcharge: 2.50
  });

  const [state, setState] = useState<AsyncState<PredictionResponse>>({ status: 'idle' });
  const [history, setHistory] = useState<Array<{ id: number; fare: number; surge: string; rate: string; hour: number }>>([]);

  const runPrediction = async () => {
    setState({ status: 'loading' });
    try {
      const resp = await fetch('http://127.0.0.1:8013/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: PredictionResponse = await resp.json();
      setState({ status: 'success', data });
      setHistory((prev) => [
        {
          id: Date.now(),
          fare: data.predictions.predicted_total_fare_usd,
          surge: data.predictions.surge_pricing_tier,
          rate: formData.rate_code,
          hour: formData.hour_of_day
        },
        ...prev
      ].slice(0, 6));
    } catch (err: any) {
      setState({ status: 'error', error: err.message || 'Inference Error' });
    }
  };

  useEffect(() => {
    runPrediction();
  }, [formData]);

  const applyPreset = (preset: typeof PRESET_ROUTES[0]) => {
    setFormData(prev => ({
      ...prev,
      pickup_latitude: preset.pickup.lat,
      pickup_longitude: preset.pickup.lon,
      dropoff_latitude: preset.dropoff.lat,
      dropoff_longitude: preset.dropoff.lon,
      rate_code: preset.rate_code as any,
      congestion_surcharge: preset.congestion
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" /> Production Tabular Inference Engine
          </div>
          <h2 className="text-2xl font-bold text-white">NYC TLC Multi-Task Ride Estimator</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time gradient-boosted regression, dynamic surge elasticity, and local TreeSHAP attribution.
          </p>
        </div>

        {/* Preset Route Pills */}
        <div className="flex flex-wrap gap-2">
          {PRESET_ROUTES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-xs text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Parameters Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" /> Geospatial & Route Parameters
            </h3>

            {/* Pickup & Dropoff Presets */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Pickup GPS (WGS84)</span>
                <div className="text-amber-400 font-bold">{formData.pickup_latitude.toFixed(4)}, {formData.pickup_longitude.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Dropoff GPS (WGS84)</span>
                <div className="text-cyan-400 font-bold">{formData.dropoff_latitude.toFixed(4)}, {formData.dropoff_longitude.toFixed(4)}</div>
              </div>
            </div>

            {/* Operational Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">TLC Rate Code</label>
                <select
                  value={formData.rate_code}
                  onChange={e => setFormData({ ...formData, rate_code: e.target.value as any })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Standard">Standard (Metered)</option>
                  <option value="JFK">JFK Airport ($70 Flat)</option>
                  <option value="Newark">Newark Airport (+$20)</option>
                  <option value="Nassau">Nassau / Westchester</option>
                  <option value="Negotiated">Negotiated Fare</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Payment Method</label>
                <select
                  value={formData.payment_type}
                  onChange={e => setFormData({ ...formData, payment_type: e.target.value as any })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash (0% recorded tip)</option>
                  <option value="No Charge">No Charge</option>
                  <option value="Dispute">Dispute</option>
                </select>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2 border-t border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Hour of Day</span>
                  <span className="font-mono text-amber-400">{formData.hour_of_day}:00</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={formData.hour_of_day}
                  onChange={e => setFormData({ ...formData, hour_of_day: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Precipitation (mm Rain/Snow)</span>
                  <span className="font-mono text-cyan-400">{formData.precipitation_mm} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={formData.precipitation_mm}
                  onChange={e => setFormData({ ...formData, precipitation_mm: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Passenger Count</span>
                  <span className="font-mono text-indigo-400">{formData.passenger_count} Riders</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={formData.passenger_count}
                  onChange={e => setFormData({ ...formData, passenger_count: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Predictions & SHAP Decomposition */}
        <div className="lg:col-span-7 space-y-6">
          {state.status === 'loading' && (
            <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
              <span className="text-sm text-slate-400 font-mono">Executing gradient-boosted inference...</span>
            </div>
          )}

          {state.status === 'success' && (
            <div className="space-y-6">
              {/* Primary Scorecard Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Predicted Fare */}
                <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent relative overflow-hidden">
                  <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Predicted Gross Fare</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    ${state.data.predictions.predicted_total_fare_usd.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {state.data.predictions.surge_pricing_tier}
                  </div>
                </div>

                {/* High Tip Propensity */}
                <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-transparent relative overflow-hidden">
                  <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>High-Tip (≥20%) Propensity</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {(state.data.predictions.high_tip_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {state.data.predictions.high_tip_prediction ? 'High-Tip Likely' : 'Standard Gratuity'}
                  </div>
                </div>

                {/* Carbon Emissions */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent relative overflow-hidden">
                  <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Carbon Footprint</span>
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {state.data.predictions.estimated_carbon_emissions_kg} <span className="text-sm font-normal text-slate-400">kg CO₂</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">
                    {state.data.trip_metrics.trip_distance_km} km • {state.data.trip_metrics.estimated_duration_min} min
                  </div>
                </div>
              </div>

              {/* Local TreeSHAP Force Plot Decomposition */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" /> Local TreeSHAP Waterfall Attribution
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Base Value: ${state.data.explainability.base_value_usd.toFixed(2)} USD
                  </span>
                </div>

                <div className="space-y-3">
                  {state.data.explainability.shap_waterfall_contributions.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${c.shap_value >= 0 ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
                        <span className="font-mono text-slate-300 font-semibold">{c.feature}</span>
                        <span className="text-slate-500">({c.value})</span>
                      </div>
                      <div className={`font-mono font-bold ${c.shap_value >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {c.shap_value >= 0 ? `+${c.shap_value.toFixed(2)}` : c.shap_value.toFixed(2)} USD
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200">
                  {state.data.explainability.explanation_summary}
                </div>
              </div>

              {/* Telemetry Badge */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                <span>Model: {state.data.telemetry.model_architecture}</span>
                <span className="text-emerald-400">⚡ Latency: {state.data.telemetry.inference_latency_ms} ms</span>
              </div>

              {/* Session Scenario History Ticker */}
              {history.length > 1 && (
                <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-amber-400" /> Session Scenario Comparison (Last {history.length})
                  </h3>
                  <div className="space-y-1.5">
                    {history.map((h, idx) => {
                      const maxFare = Math.max(...history.map((x) => x.fare));
                      const widthPct = maxFare > 0 ? (h.fare / maxFare) * 100 : 0;
                      return (
                        <div key={h.id} className="flex items-center gap-3 text-[11px] font-mono">
                          <span className={`w-10 text-slate-500 ${idx === 0 ? 'text-amber-400 font-bold' : ''}`}>
                            {idx === 0 ? 'NOW' : `-${idx}`}
                          </span>
                          <div className="flex-1 h-4 bg-slate-950/60 rounded-md overflow-hidden border border-slate-800">
                            <div
                              className={`h-full ${idx === 0 ? 'bg-amber-500/70' : 'bg-cyan-500/40'} transition-all`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-slate-200 font-bold">${h.fare.toFixed(2)}</span>
                          <span className="w-16 text-slate-500">{h.rate} @{h.hour}h</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
