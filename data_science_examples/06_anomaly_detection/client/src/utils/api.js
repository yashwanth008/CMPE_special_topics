// REST API client for Anomaly Detection & Threat Intelligence Platform

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getBenchmarks() {
    const res = await fetch(`${BASE_URL}/benchmarks`);
    return res.json();
  },

  async getManifoldPoints() {
    const res = await fetch(`${BASE_URL}/manifold`);
    return res.json();
  },

  async getTopAnomalies() {
    const res = await fetch(`${BASE_URL}/anomalies/top`);
    return res.json();
  },

  async getAutoResearchHistory() {
    const res = await fetch(`${BASE_URL}/autoresearch/history`);
    return res.json();
  },

  async scoreTelemetry(features) {
    const res = await fetch(`${BASE_URL}/anomaly/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    return res.json();
  },

  async retrainModel(params) {
    const res = await fetch(`${BASE_URL}/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  }
};
