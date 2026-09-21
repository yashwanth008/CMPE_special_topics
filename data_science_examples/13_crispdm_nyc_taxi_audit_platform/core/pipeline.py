# Phase 3: Leakage-Free Preprocessing Pipeline (CRISP-DM Standard)
# Skills engaged: sklearn-pipelines, feature-engineering, data-cleaning, pandas-patterns

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from typing import List, Tuple, Dict, Any

class CyclicalTimeTransformer(BaseEstimator, TransformerMixin):
    """
    Transforms hour_of_day (0-23) and day_of_week (0-6) into continuous sine/cosine
    projections to preserve 24-hour and 7-day cyclical continuity without artificial jump discontinuities.
    """
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        df = pd.DataFrame(X)
        hour = df.iloc[:, 0].astype(float)
        dow = df.iloc[:, 1].astype(float)
        
        sin_hour = np.sin(2 * np.pi * hour / 24.0)
        cos_hour = np.cos(2 * np.pi * hour / 24.0)
        sin_dow = np.sin(2 * np.pi * dow / 7.0)
        cos_dow = np.cos(2 * np.pi * dow / 7.0)
        
        return np.column_stack([sin_hour, cos_hour, sin_dow, cos_dow])

class SpatialGeomTransformer(BaseEstimator, TransformerMixin):
    """
    Computes exact Vectorized Haversine Distance (km), Manhattan L1 Distance (km),
    and spatial coordinate bearing angle between pickup and dropoff points.
    """
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        # Expects: [pickup_lat, pickup_lon, dropoff_lat, dropoff_lon]
        arr = np.asarray(X, dtype=float)
        p_lat, p_lon = arr[:, 0], arr[:, 1]
        d_lat, d_lon = arr[:, 2], arr[:, 3]

        lat1, lon1 = np.radians(p_lat), np.radians(p_lon)
        lat2, lon2 = np.radians(d_lat), np.radians(d_lon)
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        # Haversine
        a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
        haversine = 6371.0 * 2.0 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))

        # Manhattan L1
        manhattan = 111.0 * (np.abs(p_lat - d_lat) + np.abs(p_lon - d_lon) * np.cos(np.radians(40.75)))

        # Bearing Angle
        y_bear = np.sin(dlon) * np.cos(lat2)
        x_bear = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        bearing = np.degrees(np.arctan2(y_bear, x_bear))

        return np.column_stack([haversine, manhattan, bearing])

def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Builds strict leakage-free Scikit-Learn ColumnTransformer.
    Ensures all scalers, imputers, and encoders are fit strictly on training splits.
    """
    # 1. Numeric weather & environmental features
    numeric_features = [
        "temperature_c", "precipitation_mm", "wind_speed_kmh",
        "passenger_count", "congestion_surcharge", "is_rush_hour", "is_weekend"
    ]
    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    # 2. Spatial coordinates
    spatial_features = ["pickup_latitude", "pickup_longitude", "dropoff_latitude", "dropoff_longitude"]
    spatial_pipe = Pipeline([
        ("geom", SpatialGeomTransformer()),
        ("scaler", StandardScaler())
    ])

    # 3. Cyclical time
    cyclical_features = ["hour_of_day", "day_of_week"]
    cyclical_pipe = Pipeline([
        ("cyclical", CyclicalTimeTransformer()),
        ("scaler", StandardScaler())
    ])

    # 4. Categorical metadata
    categorical_features = ["vendor_id", "rate_code", "payment_type"]
    categorical_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, numeric_features),
            ("spatial", spatial_pipe, spatial_features),
            ("time", cyclical_pipe, cyclical_features),
            ("cat", categorical_pipe, categorical_features)
        ],
        remainder="drop"
    )

    return preprocessor
