export interface Finding {
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface ModelCard {
  model_architecture?: string;
  parameters?: number;
  vocab_size?: number;
  training_samples?: number;
  features?: string[];
  target?: string;
  primary_metric?: string;
  inference_speed?: string;
  ethical_and_bias_notes?: string;
  [key: string]: any;
}

export interface ProjectAudit {
  id: string;
  title: string;
  folder: string;
  category: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'FAIL';
  compliance_score: number;
  ports: { backend: number; frontend: number };
  methodology: string;
  audit_dimensions: {
    data_quality_and_imputation: number;
    leakage_prevention: number;
    metric_alignment: number;
    algorithm_rigor: number;
    reproducibility: number;
    governance_and_docs: number;
  };
  key_findings: Finding[];
  model_card: ModelCard;
  math_proof: string;
}

export interface PortfolioSummary {
  portfolio_compliance_score: number;
  portfolio_grade: string;
  total_projects: number;
  passed_checks: number;
  warnings: number;
  failed_checks: number;
  dimension_radar: Record<string, number>;
  projects_overview: {
    id: string;
    title: string;
    grade: string;
    score: number;
    ports: { backend: number; frontend: number };
    category: string;
  }[];
}
