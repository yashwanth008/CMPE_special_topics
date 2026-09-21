export interface TimeSeriesRecord {
  date: string;
  day_idx: number;
  demand_mw: number;
  trend: number;
  weekly_seasonal: number;
  annual_seasonal: number;
  residual: number;
  is_anomaly: boolean;
}

export interface StationarityInfo {
  adf_statistic: number;
  adf_p_value: number;
  is_stationary_after_differencing: boolean;
  kpss_statistic: number;
  conclusion: string;
}

export interface ModelTournamentItem {
  rank: number;
  model_name: string;
  type: string;
  mape: number;
  mase: number;
  rmse: number;
  smape: number;
  coverage_95_pct: number;
  training_time_sec: number;
}

export interface ForecastPoint {
  step: number;
  date: string;
  forecast_mw: number;
  lower_bound_95: number;
  upper_bound_95: number;
  trend_component: number;
  seasonal_component: number;
}

export interface ForecastResponse {
  success: boolean;
  horizon_days: number;
  model_used: string;
  scenario_surge_pct: number;
  forecast: ForecastPoint[];
  summary: {
    mean_forecast_mw: number;
    peak_forecast_mw: number;
    peak_date: string;
    trough_forecast_mw: number;
  };
}

export interface AutoResearchTrial {
  iteration: number;
  config: string;
  mape: number;
  rmse: number;
  status: string;
}
