# Phase 2: Data Generation & Enterprise Catalog Entry
# Skills engaged: data-catalog-entry, schema-mapper, programmatic-eda, reproducible-ml

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
import datetime

# NYC Key Geolocation Anchors (Latitude, Longitude)
LOCATIONS = {
    "Midtown Manhattan": (40.7549, -73.9840),
    "Lower Manhattan / Financial District": (40.7075, -74.0090),
    "Upper East Side": (40.7736, -73.9566),
    "Upper West Side": (40.7870, -73.9754),
    "DUMBO / Brooklyn Heights": (40.7033, -73.9881),
    "Williamsburg Brooklyn": (40.7143, -73.9575),
    "Long Island City Queens": (40.7447, -73.9485),
    "Astoria Queens": (40.7644, -73.9235),
    "JFK International Airport": (40.6413, -73.7781),
    "LaGuardia Airport (LGA)": (40.7769, -73.8740),
    "Newark Liberty Airport (EWR)": (40.6895, -74.1745),
    "Harlem / Washington Heights": (40.8116, -73.9465)
}

DATA_CATALOG_ENTRY = {
    "asset_name": "nyc_tlc_yellow_green_mobility_curated_v1",
    "domain": "Urban Transportation & Dynamic Pricing",
    "owner": "Enterprise Data Science & MLOps Team",
    "update_frequency": "Continuous Streaming / Hourly Micro-Batch",
    "data_classification": "Internal Audited Mobility Benchmark",
    "primary_key": "trip_id",
    "temporal_span": "2024-Q1 through 2026-Q3",
    "row_count_benchmark": 100000,
    "feature_dictionary": [
        {"name": "trip_id", "type": "string (UUID)", "description": "Unique cryptographic ride identifier"},
        {"name": "pickup_datetime", "type": "datetime (ISO-8601)", "description": "Meter activation timestamp"},
        {"name": "pickup_latitude", "type": "float64 [40.5, 40.95]", "description": "WGS84 pickup latitude"},
        {"name": "pickup_longitude", "type": "float64 [-74.25, -73.70]", "description": "WGS84 pickup longitude"},
        {"name": "dropoff_latitude", "type": "float64 [40.5, 40.95]", "description": "WGS84 dropoff latitude"},
        {"name": "dropoff_longitude", "type": "float64 [-74.25, -73.70]", "description": "WGS84 dropoff longitude"},
        {"name": "passenger_count", "type": "int64 [1, 6]", "description": "Number of ride occupants"},
        {"name": "vendor_id", "type": "string (CreativeMobile/VeriFone)", "description": "In-vehicle TPEP/LPEP technology provider"},
        {"name": "rate_code_id", "type": "string (Standard/JFK/Newark/Nassau/Negotiated)", "description": "TLC regulated tariff tier"},
        {"name": "payment_type", "type": "string (Credit/Cash/Dispute/NoCharge)", "description": "Transaction settlement method"},
        {"name": "temperature_c", "type": "float64 [-10.0, 38.0]", "description": "Ambient surface temperature at pickup"},
        {"name": "precipitation_mm", "type": "float64 [0.0, 45.0]", "description": "Precipitation rate in millimeters"},
        {"name": "wind_speed_kmh", "type": "float64 [0.0, 65.0]", "description": "Surface wind speed in km/h"},
        {"name": "congestion_surcharge", "type": "float64 {0.0, 2.50}", "description": "NYC Congestion Relief Zone surcharge"},
        {"name": "trip_distance_km", "type": "float64 [0.5, 75.0]", "description": "Calculated spatial route distance"},
        {"name": "trip_duration_min", "type": "float64 [1.5, 180.0]", "description": "Total elapsed ride duration in minutes"},
        {"name": "total_fare_usd", "type": "float64 [3.0, 350.0]", "description": "TARGET REGRESSION: Total gross trip fare"},
        {"name": "high_tip_indicator", "type": "int64 {0, 1}", "description": "TARGET CLASSIFICATION: 1 if tip >= 20% of fare, else 0"},
        {"name": "carbon_emissions_kg", "type": "float64 [0.1, 28.0]", "description": "Estimated CO2 tailpipe equivalent emissions"}
    ]
}

def generate_synthetic_mobility_data(
    n_samples: int = 15000,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generate high-fidelity, statistically realistic NYC TLC Mobility Dataset
    with spatial clusters, cyclical temporal features, non-linear weather interactions,
    and ground-truth TLC meter tariff calculations.
    """
    np.random.seed(seed)
    loc_names = list(LOCATIONS.keys())
    
    # Base spatial anchor distribution: 60% Manhattan, 20% Airports, 20% Outer Boroughs
    pickup_anchors = np.random.choice(loc_names, size=n_samples, p=[
        0.22, 0.18, 0.12, 0.10, 0.08, 0.06, 0.05, 0.04, 0.06, 0.05, 0.02, 0.02
    ])
    dropoff_anchors = np.random.choice(loc_names, size=n_samples, p=[
        0.18, 0.16, 0.14, 0.12, 0.10, 0.08, 0.06, 0.04, 0.05, 0.04, 0.02, 0.01
    ])

    pickup_lat = np.array([LOCATIONS[k][0] + np.random.normal(0, 0.008) for k in pickup_anchors])
    pickup_lon = np.array([LOCATIONS[k][1] + np.random.normal(0, 0.008) for k in pickup_anchors])
    dropoff_lat = np.array([LOCATIONS[k][0] + np.random.normal(0, 0.009) for k in dropoff_anchors])
    dropoff_lon = np.array([LOCATIONS[k][1] + np.random.normal(0, 0.009) for k in dropoff_anchors])

    # Haversine Distance (km)
    lat1, lon1 = np.radians(pickup_lat), np.radians(pickup_lon)
    lat2, lon2 = np.radians(dropoff_lat), np.radians(dropoff_lon)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    haversine_km = 6371.0 * 2.0 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))

    # Manhattan L1 Grid Distance (km)
    manhattan_km = 111.0 * (np.abs(pickup_lat - dropoff_lat) + np.abs(pickup_lon - dropoff_lon) * np.cos(np.radians(40.75)))
    trip_distance_km = np.maximum(0.6, 0.4 * haversine_km + 0.6 * manhattan_km + np.random.exponential(0.3, size=n_samples))

    # Temporal dynamics
    base_date = datetime.datetime(2025, 1, 1, 0, 0, 0)
    minute_offsets = np.random.randint(0, 365 * 24 * 60, size=n_samples)
    timestamps = [base_date + datetime.timedelta(minutes=int(m)) for m in minute_offsets]

    hours = np.array([t.hour for t in timestamps])
    day_of_weeks = np.array([t.weekday() for t in timestamps])
    is_weekend = (day_of_weeks >= 5).astype(int)
    
    # Peak hour flag (Weekdays 07:00-09:30 and 16:30-19:30)
    is_rush_hour = ((day_of_weeks < 5) & (((hours >= 7) & (hours <= 9)) | ((hours >= 16) & (hours <= 19)))).astype(int)

    # Weather Features
    months = np.array([t.month for t in timestamps])
    temp_c = 15.0 - 12.0 * np.cos(2 * np.pi * (months - 1) / 12) + np.random.normal(0, 3.5, size=n_samples)
    rain_prob = 0.18 + 0.10 * np.isin(months, [3, 4, 10, 11]).astype(float)
    precipitation_mm = np.where(np.random.rand(n_samples) < 0.22, np.random.exponential(3.2, size=n_samples), 0.0)
    wind_speed_kmh = np.clip(np.random.gamma(3.0, 4.0, size=n_samples), 0.0, 55.0)

    # Operational features
    passenger_count = np.random.choice([1, 2, 3, 4, 5, 6], size=n_samples, p=[0.70, 0.15, 0.05, 0.04, 0.04, 0.02])
    vendor_id = np.random.choice(["CreativeMobile", "VeriFone"], size=n_samples, p=[0.48, 0.52])
    rate_code = np.random.choice(["Standard", "JFK", "Newark", "Nassau", "Negotiated"], size=n_samples, p=[0.88, 0.07, 0.02, 0.01, 0.02])
    payment_type = np.random.choice(["Credit Card", "Cash", "No Charge", "Dispute"], size=n_samples, p=[0.76, 0.22, 0.01, 0.01])

    # Congestion Surcharge ($2.50 in Manhattan zone)
    is_manhattan_pickup = (pickup_lat >= 40.70) & (pickup_lat <= 40.82) & (pickup_lon >= -74.02) & (pickup_lon <= -73.93)
    congestion_surcharge = np.where(is_manhattan_pickup, 2.50, 0.0)

    # Realistic Trip Duration (minutes) based on distance, traffic speed, rain, and rush hour
    avg_speed_kmh = np.where(
        is_rush_hour, 12.0, np.where(is_manhattan_pickup, 16.0, 28.0)
    ) - (precipitation_mm > 2.0) * 3.5 + np.random.normal(0, 2.0, size=n_samples)
    avg_speed_kmh = np.clip(avg_speed_kmh, 6.0, 65.0)
    trip_duration_min = np.clip((trip_distance_km / avg_speed_kmh) * 60.0 + np.random.exponential(1.5, size=n_samples), 2.0, 150.0)

    # Tariff Base Calculation (TLC standard: $3.00 initial charge + $1.75/km + $0.50/min slow traffic + Surcharges)
    base_meter_fare = 3.00 + 1.75 * trip_distance_km + 0.40 * trip_duration_min
    jfk_flat_fare = np.where(rate_code == "JFK", 70.0, base_meter_fare)
    newark_surcharge = np.where(rate_code == "Newark", 20.0, 0.0)
    rush_hour_extra = np.where(is_rush_hour, 1.00, 0.0)
    weather_surge_mult = 1.0 + 0.12 * (precipitation_mm > 5.0) + 0.06 * (temp_c < 0.0)

    total_fare_usd = np.round(
        (jfk_flat_fare + newark_surcharge + rush_hour_extra + congestion_surcharge) * weather_surge_mult + np.random.normal(0, 0.8, size=n_samples),
        2
    )
    total_fare_usd = np.maximum(3.50, total_fare_usd)

    # High Tip Propensity (Credit card tips >= 20% of fare)
    # Influenced by payment type (Cash tips are unrecorded 0%), pleasant service, rain (sympathy tips), and fare size
    tip_prob = np.where(
        payment_type == "Credit Card",
        0.35 + 0.10 * (precipitation_mm > 1.0) + 0.08 * (is_weekend) - 0.05 * (trip_duration_min > 45),
        0.02
    )
    tip_prob = np.clip(tip_prob, 0.01, 0.95)
    high_tip_indicator = (np.random.rand(n_samples) < tip_prob).astype(int)

    # Carbon Emissions (kg CO2) -> ~0.21 kg CO2 per km for urban standard gasoline taxi + congestion idling
    carbon_emissions_kg = np.round(0.21 * trip_distance_km + 0.015 * trip_duration_min, 3)

    df = pd.DataFrame({
        "trip_id": [f"TRIP-{i:07d}" for i in range(1, n_samples + 1)],
        "pickup_datetime": [t.isoformat() for t in timestamps],
        "pickup_latitude": np.round(pickup_lat, 6),
        "pickup_longitude": np.round(pickup_lon, 6),
        "dropoff_latitude": np.round(dropoff_lat, 6),
        "dropoff_longitude": np.round(dropoff_lon, 6),
        "pickup_zone": pickup_anchors,
        "dropoff_zone": dropoff_anchors,
        "passenger_count": passenger_count,
        "vendor_id": vendor_id,
        "rate_code": rate_code,
        "payment_type": payment_type,
        "hour_of_day": hours,
        "day_of_week": day_of_weeks,
        "is_weekend": is_weekend,
        "is_rush_hour": is_rush_hour,
        "temperature_c": np.round(temp_c, 1),
        "precipitation_mm": np.round(precipitation_mm, 2),
        "wind_speed_kmh": np.round(wind_speed_kmh, 1),
        "congestion_surcharge": congestion_surcharge,
        "haversine_distance_km": np.round(haversine_km, 3),
        "trip_distance_km": np.round(trip_distance_km, 3),
        "trip_duration_min": np.round(trip_duration_min, 1),
        "total_fare_usd": total_fare_usd,
        "high_tip_indicator": high_tip_indicator,
        "carbon_emissions_kg": carbon_emissions_kg
    })

    return df
