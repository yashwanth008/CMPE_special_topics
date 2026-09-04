# VIDEO_SCRIPT.md — TimePulse Forecasting Engine (Project 12)

**Runtime target:** ~2.5 minutes

---

Hey everyone, welcome back. Today I'm walking you through TimePulse — it's a full multi-horizon time series forecasting platform I built out as part of my data science portfolio series. Think of it as a mini forecasting product you'd actually find inside a cloud infrastructure company: it predicts energy demand on a compute grid anywhere from 7 to 60 days out, and it wraps that prediction in a full CRISP-DM workflow, not just a single chart.

The original prompt I gave my AI coding assistant was pretty open-ended — I basically said: "build a similar website for timeseries forecasting similar to other projects you built — including detailed CRISP-DM steps and admin and other dashboards." So the brief was loose on purpose. I wanted to see what a complete forecasting product looks like when an agent has to fill in all the analytical gaps itself.

Let's jump into the app. I've got the backend running on port 8012 with FastAPI, and the React frontend on port 5185. The first tab is the Live Forecast Studio — this is the centerpiece. I can pick a model backbone from a dropdown — LightGBM, Deep N-BEATS, Prophet, or SARIMAX — drag the horizon slider anywhere from 7 to 60 days, and there's this fun "demand surge" slider that simulates a heatwave-style spike in usage. Watch the chart update live: you get the historical actuals as a solid gray line, the forecast as a dashed cyan line, and an expanding 95% confidence band that gets wider the further out we forecast — which is exactly what should happen mathematically as uncertainty compounds.

Next tab is the CRISP-DM workflow — six phases from business understanding all the way to operational telemetry, explaining the "why" behind every modeling decision, not just the "what."

Then there's Decomposition and ACF — this is the statistics-nerd tab. It splits the signal into trend, seasonal, and residual components, runs ADF and KPSS stationarity tests, and plots a full 40-lag autocorrelation and partial autocorrelation chart so you can visually spot the weekly seasonality — you'll see clear spikes at lag 7, 14, 21, and 28.

After that is the Model Tournament — a walk-forward backtesting leaderboard where LightGBM comes out on top with a 2.84% MAPE, beating N-BEATS, Prophet, and SARIMAX. And finally the Admin tab shows live telemetry and an auto-research hill-climbing log — basically a transparent record of how the winning model configuration was found.

One architecture detail worth calling out: everything here respects walk-forward validation — no peeking into the future when scoring models — and the confidence intervals actually expand with horizon length instead of staying flat, which a lot of toy forecasting demos get wrong.

For my creative addition this round, I did two things. First, I noticed the ACF/PACF charts were only rendering 28 of the 40 lags the backend computes and the README promises — so I fixed that to show the full 40-lag view. And then I added a little auto-detected insight callout right above those charts that scans the ACF array itself and calls out the single strongest cyclical lag with its correlation value — so instead of just staring at bars, the app tells you where to look. I also added a one-click CSV export button on the forecast table so you can grab the raw predictions and bounds for your own analysis.

That's TimePulse — a full-stack forecasting engine with proper statistical rigor under the hood. If you're building anything with seasonal demand data, this is a solid pattern to borrow from. Thanks for watching, and I'll see you in the next one.
