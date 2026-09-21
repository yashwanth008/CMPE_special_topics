export interface OHLCVBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  volume: number;
  vix_close: number;
  tnx_yield: number;
  dxy_index: number;
  xlk_spy_ratio: number;
  xlf_spy_ratio: number;
  soxx_spy_ratio: number;
  fomc_sentiment_score: number;
  rsi_14?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  ema_21?: number;
  ema_50?: number;
  atr_14?: number;
}

export interface ForecastTrajectoryPoint {
  day_ahead: number;
  p10_price: number;
  p50_price: number;
  p90_price: number;
  expected_return_pct: number;
}

export interface ForecastResponse {
  model_selected: string;
  current_price: number;
  target_1d_price: number;
  target_5d_price: number;
  expected_return_1d_pct: number;
  expected_return_5d_pct: number;
  directional_signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  signal_confidence: number;
  forecast_trajectory: ForecastTrajectoryPoint[];
  ensemble_weights: Record<string, number>;
  all_model_p50_5d: Record<string, number>;
  macro_stress_applied?: any;
}

export interface LeaderboardItem {
  rank: number;
  model_id: string;
  model_name: string;
  family: string;
  rmse_dollars: number;
  mae_dollars: number;
  mape_pct: number;
  directional_accuracy_pct: number;
  wql_pinball_loss: number;
  annualized_sharpe: number;
  max_drawdown_pct: number;
  inference_latency_ms: number;
  status: string;
}

export interface EquityCurvePoint {
  date: string;
  strategy_equity: number;
  benchmark_equity: number;
  drawdown_pct: number;
}

export interface BacktestResponse {
  initial_capital: number;
  final_equity: number;
  benchmark_final_equity: number;
  strategy_total_return_pct: number;
  benchmark_total_return_pct: number;
  alpha_excess_return_pct: number;
  annualized_sharpe_ratio: number;
  annualized_sortino_ratio: number;
  max_drawdown_pct: number;
  value_at_risk_95_pct: number;
  value_at_risk_99_pct: number;
  expected_shortfall_cvar_95_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  daily_equity_curve: EquityCurvePoint[];
  recent_trade_signals: any[];
}

export interface ShapContribution {
  feature: string;
  value: number;
  shap_value: number;
  description: string;
}

export interface AuditRule {
  rule_id: string;
  rule_name: string;
  category: string;
  status: string;
  severity: string;
  finding: string;
  evidence_line: string;
  certified_compliant: boolean;
}

export interface CodeAuditResponse {
  auditor_name: string;
  overall_grade: string;
  compliance_rate_pct: number;
  rules_passed: number;
  rules_total: number;
  critical_violations_detected: number;
  audit_rules: AuditRule[];
  certification_statement: string;
}

export interface SkillItem {
  skill_id: string;
  skill_name: string;
  crisp_dm_phase: string;
  category: string;
  latex_formula: string;
  file_location: string;
  description: string;
}
