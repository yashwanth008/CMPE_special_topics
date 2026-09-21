# Phase 2: Enhanced Programmatic Exploratory Data Analysis Engine (CRISP-DM Standard)
# Skills engaged: exploratory-data-analysis, programmatic-eda, visualization-builder, segmentation-analysis

import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Any

class ProgrammaticEDAEngine:
    """
    Automated EDA engine extracting comprehensive statistical profiles,
    correlation heatmaps, bivariate regression slopes, temporal heatmaps,
    borough mobility dynamics, categorical breakdowns, and Tukey outlier diagnostics.
    """
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def get_summary_statistics(self) -> Dict[str, Any]:
        """Compute mean, std, quantiles, skewness, kurtosis, and IQR outlier boundaries."""
        num_cols = [
            "trip_distance_km", "haversine_distance_km", "trip_duration_min",
            "total_fare_usd", "temperature_c", "precipitation_mm", "wind_speed_kmh",
            "congestion_surcharge", "carbon_emissions_kg"
        ]
        
        summary = {}
        for col in num_cols:
            if col not in self.df.columns:
                continue
            s = self.df[col].dropna()
            q25 = float(s.quantile(0.25))
            q75 = float(s.quantile(0.75))
            iqr = q75 - q25
            lower_fence = q25 - 1.5 * iqr
            upper_fence = q75 + 1.5 * iqr
            outliers_count = int(((s < lower_fence) | (s > upper_fence)).sum())
            
            summary[col] = {
                "count": int(len(s)),
                "mean": round(float(s.mean()), 3),
                "std": round(float(s.std()), 3),
                "min": round(float(s.min()), 3),
                "p25": round(q25, 3),
                "median": round(float(s.median()), 3),
                "p75": round(q75, 3),
                "p95": round(float(s.quantile(0.95)), 3),
                "p99": round(float(s.quantile(0.99)), 3),
                "max": round(float(s.max()), 3),
                "iqr": round(iqr, 3),
                "lower_fence": round(lower_fence, 3),
                "upper_fence": round(upper_fence, 3),
                "outlier_count": outliers_count,
                "outlier_percentage": round((outliers_count / len(s)) * 100.0, 2),
                "skewness": round(float(stats.skew(s)), 3),
                "kurtosis": round(float(stats.kurtosis(s)), 3)
            }
        return summary

    def get_correlation_matrix(self) -> Dict[str, Any]:
        """Compute Pearson and Spearman correlation matrices across continuous variables."""
        num_cols = [
            "trip_distance_km", "haversine_distance_km", "trip_duration_min",
            "temperature_c", "precipitation_mm", "wind_speed_kmh",
            "congestion_surcharge", "total_fare_usd", "high_tip_indicator"
        ]
        
        corr = self.df[num_cols].corr(method="pearson")
        spearman_corr = self.df[num_cols].corr(method="spearman")
        return {
            "columns": num_cols,
            "matrix": [[round(float(val), 3) for val in row] for row in corr.values],
            "spearman_matrix": [[round(float(val), 3) for val in row] for row in spearman_corr.values]
        }

    def get_feature_distributions(self) -> Dict[str, Any]:
        """Generate 16-bin histograms and density estimates for continuous features."""
        dist_cols = [
            "total_fare_usd", "trip_distance_km", "trip_duration_min",
            "precipitation_mm", "temperature_c", "carbon_emissions_kg"
        ]
        
        distributions = {}
        for col in dist_cols:
            if col not in self.df.columns:
                continue
            s = self.df[col].dropna()
            hist, bin_edges = np.histogram(s, bins=14)
            distributions[col] = {
                "counts": [int(x) for x in hist],
                "bin_edges": [round(float(x), 2) for x in bin_edges],
                "bin_centers": [round(float((bin_edges[i] + bin_edges[i+1]) / 2.0), 2) for i in range(len(hist))],
                "mean": round(float(s.mean()), 2),
                "median": round(float(s.median()), 2),
                "std": round(float(s.std()), 2)
            }
        return distributions

    def get_bivariate_relationships(self) -> Dict[str, Any]:
        """Compute regression slopes, intercepts, and scatter samples for key covariate pairs."""
        pairs = [
            ("trip_distance_km", "total_fare_usd", "Trip Distance (km) vs Total Fare ($ USD)"),
            ("trip_duration_min", "total_fare_usd", "Trip Duration (min) vs Total Fare ($ USD)"),
            ("precipitation_mm", "total_fare_usd", "Precipitation (mm) vs Total Fare ($ USD)"),
            ("trip_distance_km", "carbon_emissions_kg", "Trip Distance (km) vs CO2 Emissions (kg)")
        ]
        
        results = []
        sample_df = self.df.sample(n=min(300, len(self.df)), random_state=42)
        
        for x_col, y_col, title in pairs:
            x = sample_df[x_col].values
            y = sample_df[y_col].values
            slope, intercept, r_value, p_value, std_err = stats.linregress(self.df[x_col], self.df[y_col])
            
            results.append({
                "x_col": x_col,
                "y_col": y_col,
                "title": title,
                "slope": round(float(slope), 4),
                "intercept": round(float(intercept), 4),
                "r_value": round(float(r_value), 4),
                "r_squared": round(float(r_value ** 2), 4),
                "p_value": float(f"{p_value:.2e}"),
                "points": [{"x": round(float(xi), 2), "y": round(float(yi), 2)} for xi, yi in zip(x, y)]
            })
            
        return {"relationships": results}

    def get_temporal_mobility_matrix(self) -> Dict[str, Any]:
        """Compute 2D hourly (0-23) by day-of-week (Mon-Sun) demand matrix."""
        grouped = self.df.groupby(["day_of_week", "hour_of_day"]).agg(
            trip_volume=("trip_id", "count"),
            avg_fare=("total_fare_usd", "mean"),
            avg_duration=("trip_duration_min", "mean"),
            high_tip_rate=("high_tip_indicator", "mean")
        ).reset_index()
        
        dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        matrix = []
        for d in range(7):
            row = []
            for h in range(24):
                match = grouped[(grouped["day_of_week"] == d) & (grouped["hour_of_day"] == h)]
                if len(match) > 0:
                    rec = match.iloc[0]
                    row.append({
                        "hour": h,
                        "day": dow_names[d],
                        "volume": int(rec["trip_volume"]),
                        "avg_fare": round(float(rec["avg_fare"]), 2),
                        "avg_duration": round(float(rec["avg_duration"]), 1),
                        "high_tip_rate": round(float(rec["high_tip_rate"]) * 100.0, 1)
                    })
                else:
                    row.append({"hour": h, "day": dow_names[d], "volume": 0, "avg_fare": 0, "avg_duration": 0, "high_tip_rate": 0})
            matrix.append({"day": dow_names[d], "hours": row})
            
        return {"temporal_matrix": matrix}

    def get_borough_zone_analytics(self) -> Dict[str, Any]:
        """Aggregate performance and mobility statistics across NYC zones."""
        zone_df = self.df.groupby("pickup_zone").agg(
            trip_volume=("trip_id", "count"),
            mean_fare=("total_fare_usd", "mean"),
            median_fare=("total_fare_usd", "median"),
            mean_distance=("trip_distance_km", "mean"),
            mean_duration=("trip_duration_min", "mean"),
            high_tip_rate=("high_tip_indicator", "mean"),
            mean_congestion=("congestion_surcharge", "mean")
        ).reset_index()
        
        total_trips = len(self.df)
        zones = []
        for _, row in zone_df.iterrows():
            zones.append({
                "zone_name": row["pickup_zone"],
                "trip_volume": int(row["trip_volume"]),
                "volume_share_pct": round((row["trip_volume"] / total_trips) * 100.0, 2),
                "mean_fare": round(float(row["mean_fare"]), 2),
                "median_fare": round(float(row["median_fare"]), 2),
                "mean_distance_km": round(float(row["mean_distance"]), 2),
                "mean_duration_min": round(float(row["mean_duration"]), 1),
                "high_tip_rate_pct": round(float(row["high_tip_rate"]) * 100.0, 1),
                "mean_congestion_usd": round(float(row["mean_congestion"]), 2)
            })
            
        zones.sort(key=lambda z: z["trip_volume"], reverse=True)
        return {"borough_zones": zones}

    def get_categorical_breakdowns(self) -> Dict[str, Any]:
        """Value counts and proportions for discrete categoricals."""
        cats = {}
        for col in ["rate_code", "payment_type", "vendor_id", "weather_condition", "passenger_count"]:
            if col in self.df.columns:
                vc = self.df[col].value_counts()
                total = len(self.df)
                cats[col] = [
                    {"category": str(k), "count": int(v), "percentage": round((v / total) * 100.0, 2)}
                    for k, v in vc.items()
                ]
        return {"categorical_distributions": cats}

    def generate_full_eda_dossier(self) -> Dict[str, Any]:
        return {
            "summary_statistics": self.get_summary_statistics(),
            "correlation_analysis": self.get_correlation_matrix(),
            "feature_distributions": self.get_feature_distributions(),
            "bivariate_relationships": self.get_bivariate_relationships(),
            "temporal_matrix": self.get_temporal_mobility_matrix(),
            "borough_zones": self.get_borough_zone_analytics(),
            "categorical_distributions": self.get_categorical_breakdowns()
        }
