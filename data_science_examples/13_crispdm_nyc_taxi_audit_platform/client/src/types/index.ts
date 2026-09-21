// Matt Pocock Total TypeScript Architectural Patterns
// Discriminated Unions, Branded Types, and Zod Inferred Schemas

import { z } from 'zod';

// Pattern 1: Branded / Nominal Types
export type TripId = string & { readonly __brand: unique symbol };
export type ClusterId = number & { readonly __brand: unique symbol };
export type SnippetId = string & { readonly __brand: unique symbol };

// Pattern 2: Zod Inference Schema for Trip Input
export const TripInferenceSchema = z.object({
  pickup_latitude: z.number().min(40.48).max(40.95),
  pickup_longitude: z.number().min(-74.30).max(-73.65),
  dropoff_latitude: z.number().min(40.48).max(40.95),
  dropoff_longitude: z.number().min(-74.30).max(-73.65),
  passenger_count: z.number().int().min(1).max(6),
  vendor_id: z.enum(['CreativeMobile', 'VeriFone']),
  rate_code: z.enum(['Standard', 'JFK', 'Newark', 'Nassau', 'Negotiated']),
  payment_type: z.enum(['Credit Card', 'Cash', 'No Charge', 'Dispute']),
  hour_of_day: z.number().int().min(0).max(23),
  day_of_week: z.number().int().min(0).max(6),
  temperature_c: z.number(),
  precipitation_mm: z.number().min(0),
  wind_speed_kmh: z.number().min(0),
  congestion_surcharge: z.number()
});

export type TripInferenceInput = z.infer<typeof TripInferenceSchema>;

// Pattern 3: Discriminated Unions for Async State Machines
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Pattern 4: CRISP-DM Phase Discriminated Union
export type CrispDmPhase =
  | 'Phase 1: Business Understanding'
  | 'Phase 2: Data Understanding'
  | 'Phase 3: Data Preparation'
  | 'Phase 4: Modeling'
  | 'Phase 5: Evaluation & XAI'
  | 'Phase 6: Deployment & MLOps';

// Pattern 5: Admin Viewport Navigation Tab Union
export type AdminTab =
  | 'paper_dossier'
  | 'eda_catalog'
  | 'spatial_clustering'
  | 'model_tournament'
  | 'shap_xai'
  | 'code_auditor'
  | 'mlops_loadtest'
  | 'architecture_skills';

// Data Interfaces
export interface PredictionResponse {
  trip_metrics: {
    haversine_distance_km: number;
    manhattan_distance_km: number;
    trip_distance_km: number;
    estimated_duration_min: number;
    is_rush_hour: boolean;
  };
  predictions: {
    predicted_total_fare_usd: number;
    high_tip_probability: number;
    high_tip_prediction: boolean;
    surge_pricing_tier: string;
    estimated_carbon_emissions_kg: number;
  };
  explainability: {
    base_value_usd: number;
    predicted_total_fare_usd: number;
    shap_waterfall_contributions: Array<{
      feature: string;
      value: string;
      shap_value: number;
      impact: string;
    }>;
    explanation_summary: string;
  };
  telemetry: {
    inference_latency_ms: number;
    model_architecture: string;
  };
}

export interface PaperSection {
  page_number: number;
  phase: string;
  section_title: string;
  content: string;
  key_metrics?: Array<{ kpi: string; target: string; achieved: string; status: string }>;
  assumptions_table_ref?: string;
  quality_grade?: string;
  clustering_summary?: string;
}

export interface CrispDmPaper {
  title: string;
  authors: Array<{ name: string; affiliation: string }>;
  doi: string;
  pages_count: number;
  abstract: string;
  sections: PaperSection[];
}

export interface CodeSnippet {
  snippet_id: string;
  phase: string;
  title: string;
  language: string;
  code: string;
  pointer: string;
}
