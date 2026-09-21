// REST API client for AutoGluon AutoML Platform

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getLeaderboard(task = 'classification') {
    const res = await fetch(`${BASE_URL}/automl/leaderboard?task=${task}`);
    return res.json();
  },

  async getStackingGraph(task = 'classification') {
    const res = await fetch(`${BASE_URL}/automl/stacking-graph?task=${task}`);
    return res.json();
  },

  async getAutoResearchHistory() {
    const res = await fetch(`${BASE_URL}/autoresearch/history`);
    return res.json();
  },

  async predict(task, features) {
    const res = await fetch(`${BASE_URL}/automl/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, features })
    });
    return res.json();
  },

  async retrain(params) {
    const res = await fetch(`${BASE_URL}/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  }
};
