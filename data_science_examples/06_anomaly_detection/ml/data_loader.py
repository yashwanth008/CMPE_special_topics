# Kaggle High-Dimensional Anomaly Detection & Threat Benchmark Synthesizer
# Generates 10,000 multi-feature telemetry vectors with 3.5% ground truth contamination across 4 anomaly archetypes

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any

FEATURE_NAMES = [
    "NetworkBytesIn",
    "NetworkBytesOut",
    "CPUUtilization",
    "MemoryPressure",
    "LatencyMs",
    "ErrorRate",
    "RequestVelocity",
    "AuthFailures",
    "EntropyScore",
    "DiskIOPS"
]

def generate_anomaly_dataset(
    n_samples: int = 10000,
    contamination: float = 0.035,
    random_state: int = 42
) -> Tuple[pd.DataFrame, np.ndarray, List[Dict[str, Any]]]:
    """
    Synthesizes a realistic high-dimensional telemetry dataset with 4 distinct anomaly archetypes:
    1. Volumetric Spikes / DDoS (High RequestVelocity, High BytesIn)
    2. Stealth Infiltration (High AuthFailures, High Entropy)
    3. Resource Exhaustion / Memory Leak (High MemoryPressure, High Latency, High ErrorRate)
    4. Subspace Outliers (Non-linear DiskIOPS vs CPU correlation breakdown)
    """
    np.random.seed(random_state)
    n_anomalies = int(n_samples * contamination)
    n_normal = n_samples - n_anomalies

    # 1. Generate Normal System Telemetry (Multivariate Gaussian + Poisson baseline)
    bytes_in = np.clip(np.random.lognormal(mean=11.5, sigma=0.6, size=n_normal), 20000, 800000) # Bytes/sec
    bytes_out = np.clip(bytes_in * np.random.uniform(0.6, 1.4, size=n_normal), 15000, 1000000)
    cpu_util = np.clip(np.random.beta(a=2, b=5, size=n_normal) * 100.0, 5.0, 75.0) # %
    mem_press = np.clip(np.random.beta(a=3, b=3, size=n_normal) * 100.0, 20.0, 78.0) # %
    latency = np.clip(np.random.exponential(scale=35.0, size=n_normal) + 12.0, 8.0, 150.0) # ms
    error_rate = np.clip(np.random.exponential(scale=0.005, size=n_normal), 0.0, 0.04) # Ratio
    req_velocity = np.clip(np.random.poisson(lam=120, size=n_normal) + np.random.normal(0, 15, size=n_normal), 30, 250) # Req/s
    auth_failures = np.random.choice([0, 1, 2, 3], size=n_normal, p=[0.75, 0.18, 0.05, 0.02])
    entropy_score = np.clip(np.random.normal(0.45, 0.10, size=n_normal), 0.15, 0.70)
    disk_iops = np.clip(cpu_util * 8.5 + np.random.normal(50, 25, size=n_normal), 20, 800)

    normal_matrix = np.column_stack([
        bytes_in, bytes_out, cpu_util, mem_press, latency,
        error_rate, req_velocity, auth_failures, entropy_score, disk_iops
    ])
    normal_labels = np.zeros(n_normal, dtype=int)
    normal_archetypes = ["Normal Operations"] * n_normal

    # 2. Generate 4 Distinct Anomaly Archetypes
    n_per_arch = n_anomalies // 4
    remainder = n_anomalies - (n_per_arch * 3)

    # Archetype 1: Volumetric DDoS Attack
    a1_bytes_in = np.random.uniform(2500000, 8000000, n_per_arch)
    a1_bytes_out = np.random.uniform(500000, 2000000, n_per_arch)
    a1_cpu = np.random.uniform(85.0, 99.5, n_per_arch)
    a1_mem = np.random.uniform(70.0, 92.0, n_per_arch)
    a1_latency = np.random.uniform(450.0, 1800.0, n_per_arch)
    a1_error = np.random.uniform(0.08, 0.35, n_per_arch)
    a1_req_vel = np.random.uniform(1200, 4500, n_per_arch)
    a1_auth = np.random.poisson(lam=5, size=n_per_arch)
    a1_entropy = np.random.uniform(0.80, 0.98, n_per_arch)
    a1_disk = np.random.uniform(1500, 4000, n_per_arch)
    m_a1 = np.column_stack([a1_bytes_in, a1_bytes_out, a1_cpu, a1_mem, a1_latency, a1_error, a1_req_vel, a1_auth, a1_entropy, a1_disk])

    # Archetype 2: Stealth Infiltration / Credential Stuffing
    a2_bytes_in = np.random.uniform(50000, 200000, n_per_arch)
    a2_bytes_out = np.random.uniform(30000, 150000, n_per_arch)
    a2_cpu = np.random.uniform(20.0, 45.0, n_per_arch)
    a2_mem = np.random.uniform(40.0, 60.0, n_per_arch)
    a2_latency = np.random.uniform(25.0, 80.0, n_per_arch)
    a2_error = np.random.uniform(0.02, 0.08, n_per_arch)
    a2_req_vel = np.random.uniform(80, 200, n_per_arch)
    a2_auth = np.random.uniform(25, 95, n_per_arch) # Extreme Auth Failures
    a2_entropy = np.random.uniform(0.91, 0.99, n_per_arch) # High payload randomness
    a2_disk = np.random.uniform(50, 200, n_per_arch)
    m_a2 = np.column_stack([a2_bytes_in, a2_bytes_out, a2_cpu, a2_mem, a2_latency, a2_error, a2_req_vel, a2_auth, a2_entropy, a2_disk])

    # Archetype 3: Resource Exhaustion / Memory Leak
    a3_bytes_in = np.random.uniform(80000, 300000, n_per_arch)
    a3_bytes_out = np.random.uniform(60000, 250000, n_per_arch)
    a3_cpu = np.random.uniform(92.0, 100.0, n_per_arch)
    a3_mem = np.random.uniform(96.5, 99.9, n_per_arch) # Near 100% RAM saturation
    a3_latency = np.random.uniform(2800.0, 8500.0, n_per_arch) # Massive lag
    a3_error = np.random.uniform(0.25, 0.65, n_per_arch)
    a3_req_vel = np.random.uniform(40, 110, n_per_arch)
    a3_auth = np.random.choice([0, 1], size=n_per_arch)
    a3_entropy = np.random.uniform(0.40, 0.65, n_per_arch)
    a3_disk = np.random.uniform(2200, 5000, n_per_arch)
    m_a3 = np.column_stack([a3_bytes_in, a3_bytes_out, a3_cpu, a3_mem, a3_latency, a3_error, a3_req_vel, a3_auth, a3_entropy, a3_disk])

    # Archetype 4: Subspace Cluster Anomaly (Zero IOPS despite 90% CPU)
    a4_bytes_in = np.random.uniform(100000, 400000, remainder)
    a4_bytes_out = np.random.uniform(80000, 350000, remainder)
    a4_cpu = np.random.uniform(88.0, 98.0, remainder)
    a4_mem = np.random.uniform(30.0, 50.0, remainder)
    a4_latency = np.random.uniform(120.0, 350.0, remainder)
    a4_error = np.random.uniform(0.01, 0.05, remainder)
    a4_req_vel = np.random.uniform(150, 300, remainder)
    a4_auth = np.random.choice([0, 1, 2], size=remainder)
    a4_entropy = np.random.uniform(0.35, 0.55, remainder)
    a4_disk = np.random.uniform(0.0, 10.0, remainder) # Broken correlation
    m_a4 = np.column_stack([a4_bytes_in, a4_bytes_out, a4_cpu, a4_mem, a4_latency, a4_error, a4_req_vel, a4_auth, a4_entropy, a4_disk])

    anomaly_matrix = np.vstack([m_a1, m_a2, m_a3, m_a4])
    anomaly_labels = np.ones(n_anomalies, dtype=int)
    anomaly_archetypes = (
        ["Volumetric DDoS Attack"] * n_per_arch +
        ["Stealth Credential Infiltration"] * n_per_arch +
        ["Resource Exhaustion & Memory Leak"] * n_per_arch +
        ["Subspace Correlation Breakdown"] * remainder
    )

    # Combine & Shuffle
    X = np.vstack([normal_matrix, anomaly_matrix])
    y = np.concatenate([normal_labels, anomaly_labels])
    archetypes = normal_archetypes + anomaly_archetypes

    indices = np.arange(n_samples)
    np.random.shuffle(indices)

    X_shuffled = X[indices]
    y_shuffled = y[indices]
    archetypes_shuffled = [archetypes[i] for i in indices]

    df = pd.DataFrame(X_shuffled, columns=FEATURE_NAMES)
    df["is_anomaly"] = y_shuffled
    df["archetype"] = archetypes_shuffled

    # Metadata catalog
    catalog_meta = [
        {"feature": "NetworkBytesIn", "unit": "Bytes/sec", "normal_range": "20K - 800K", "description": "Inbound network throughput"},
        {"feature": "NetworkBytesOut", "unit": "Bytes/sec", "normal_range": "15K - 1M", "description": "Outbound egress bandwidth"},
        {"feature": "CPUUtilization", "unit": "%", "normal_range": "5% - 75%", "description": "Server compute core load"},
        {"feature": "MemoryPressure", "unit": "%", "normal_range": "20% - 78%", "description": "RAM allocation percentage"},
        {"feature": "LatencyMs", "unit": "ms", "normal_range": "8ms - 150ms", "description": "End-to-end API response latency"},
        {"feature": "ErrorRate", "unit": "Ratio", "normal_range": "0.0 - 0.04", "description": "HTTP 5xx server fault frequency"},
        {"feature": "RequestVelocity", "unit": "Req/sec", "normal_range": "30 - 250", "description": "Client traffic request volume"},
        {"feature": "AuthFailures", "unit": "Count", "normal_range": "0 - 3", "description": "Failed authentication handshakes"},
        {"feature": "EntropyScore", "unit": "0.0 - 1.0", "normal_range": "0.15 - 0.70", "description": "Payload bitstream randomness"},
        {"feature": "DiskIOPS", "unit": "IOPS", "normal_range": "20 - 800", "description": "Block device read/write throughput"}
    ]

    return df, y_shuffled, catalog_meta

if __name__ == '__main__':
    df, y, meta = generate_anomaly_dataset(10000)
    print("Synthesized Dataset Shape:", df.shape)
    print("Ground Truth Anomaly Count:", int(y.sum()), f"({round(y.mean() * 100, 2)}%)")
    print("Archetypes Breakdown:\n", df["archetype"].value_counts())
