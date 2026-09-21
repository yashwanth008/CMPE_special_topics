# TimePulse

Multi-horizon time series forecasting engine for compute-grid energy demand. CRISP-DM workflow, walk-forward backtesting, no peeking at the future.

Source prompt: `build a similar website ... for timeseries forecasting ... including detailed crisp-dm steps and admin and other dashboards`.

## Spec

| Property | Value |
|---|---|
| Forecast horizon | `h = 7 .. 60` days |
| Confidence interval | 95%, expanding with horizon |
| Decomposition model | Additive: $Y_t = \text{Trend}_t + \text{Seasonal}_t + \text{Residual}_t$ |
| Stationarity tests | ADF, KPSS |
| Autocorrelation | 40-lag ACF / PACF |
| Anomaly flag threshold | $> 3\sigma$ |
| Backend | FastAPI, port `8012` |
| Frontend | Vite + React, port `5185` |

## Model tournament (walk-forward backtest)

| Model | MAPE | MASE |
|---|---|---|
| **LightGBM Lag GBDT** (champion) | **2.84%** | **0.42** |
| Deep N-BEATS | 3.12% | — |
| Prophet | 3.65% | — |
| SARIMAX | 4.18% | — |

$$\text{MASE} = \frac{\sum_{t=1}^n |y_t - \hat{y}_t|}{\frac{n}{n-m} \sum_{t=m+1}^n |y_t - y_{t-m}|}$$

$$\rho_k = \frac{\sum_{t=k+1}^T (y_t - \bar{y})(y_{t-k} - \bar{y})}{\sum_{t=1}^T (y_t - \bar{y})^2}$$

## Modules

- **Forecast Studio** — pick a backbone (LightGBM / N-BEATS / Prophet / SARIMAX), drag the horizon slider, apply a 0–50% demand-surge multiplier, watch the confidence fan and anomaly markers update live.
- **CRISP-DM Guide** — six interactive phases, Business Understanding through Operational Telemetry.
- **Decomposition & ACF** — trend/seasonal/residual split, stationarity test results, full 40-lag ACF/PACF bars (fixed this session — the charts previously truncated to 28 of the 40 lags the backend actually computes) with an auto-detected callout for the strongest cyclical lag.
- **Tournament Leaderboard** — the walk-forward results table above, rendered live.
- **Admin / AutoResearch** — server telemetry stream, execution latency, and a hill-climbing log of the lag search that produced the winning config. Also includes a one-click CSV export of forecast values + bounds.

Full narrated tour: [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md).

## Screenshots

![Forecast Studio](./screenshots/timeseries_forecast_studio.png)
![CRISP-DM Steps](./screenshots/timeseries_crispdm_steps.png)
![Decomposition & ACF](./screenshots/timeseries_decomposition_acf.png)
![Tournament Leaderboard](./screenshots/timeseries_tournament_leaderboard.png)
![Admin & AutoResearch](./screenshots/timeseries_admin_autoresearch.png)

Verified end-to-end capture: `screenshots/verified_walkthrough.png`.

## Skills (`skills/`)

- `time-series-analysis` — decomposition, stationarity tests, lag modeling
- `business-metrics-calculator` — SaaS/operational KPI calculators
- `dashboard-specification` — real-time telemetry monitoring design

## Run

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8012
```

```bash
cd frontend
npm install
npm run dev   # http://localhost:5185/
```
