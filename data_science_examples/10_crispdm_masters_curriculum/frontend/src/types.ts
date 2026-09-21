export interface RecordItem {
  id: string;
  age: number;
  education_num: number;
  hours_per_week: number;
  capital_gain: number;
  capital_loss: number;
  occupation: string;
  education: string;
  workclass: string;
  relationship: string;
  annual_income: number;
  pca_x?: number;
  pca_y?: number;
  cluster?: number;
}

export interface ClusterPersona {
  cluster_id: number;
  size: number;
  pct: number;
  avg_age: number;
  avg_edu_num: number;
  avg_hours: number;
  avg_capital_gain: number;
  avg_income: number;
  top_occupation: string;
}

export interface RegressionBenchmark {
  model_name: string;
  r2_score: number;
  rmse: number;
  mae: number;
  mape_pct: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface AssociationRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  insight: string;
}

export interface CurriculumChapter {
  id: string;
  phase: string;
  title: string;
  objectives: string[];
  math_formula: string;
  quiz: {
    question: string;
    options: string[];
    correct_idx: number;
    explanation: string;
  };
}
