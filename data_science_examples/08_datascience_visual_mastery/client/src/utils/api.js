// REST API client for Data Science Visual Mastery Platform

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getModules() {
    const res = await fetch(`${BASE_URL}/modules`);
    return res.json();
  },

  async getModule(moduleId) {
    const res = await fetch(`${BASE_URL}/module/${moduleId}`);
    return res.json();
  },

  async getQuizzes() {
    const res = await fetch(`${BASE_URL}/quizzes`);
    return res.json();
  },

  async simulateBayes(params) {
    const res = await fetch(`${BASE_URL}/simulate/bayes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async simulateConfusion(threshold) {
    const res = await fetch(`${BASE_URL}/simulate/confusion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold })
    });
    return res.json();
  },

  async simulateDescent(params) {
    const res = await fetch(`${BASE_URL}/simulate/descent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async simulateBackprop(params) {
    const res = await fetch(`${BASE_URL}/simulate/backprop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  async getGhPagesManifest() {
    const res = await fetch(`${BASE_URL}/gh-pages-manifest`);
    return res.json();
  }
};
