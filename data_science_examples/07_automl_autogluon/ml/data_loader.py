# Kaggle Multi-Task Benchmark Dataset Synthesizer for AutoGluon AutoML
# Generates Tabular Classification (Customer Churn) & Tabular Regression (Diamond Valuation)

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any

CLASSIFICATION_FEATURES = [
    "Age",
    "AnnualIncome",
    "CreditScore",
    "AccountTenure",
    "TransactionFrequency",
    "AvgTransactionAmount",
    "BalanceToIncomeRatio",
    "SupportTickets",
    "DeviceRiskScore",
    "IsPremiumMember"
]

REGRESSION_FEATURES = [
    "CaratWeight",
    "CutQualityScore",
    "ColorGrade",
    "ClarityGrade",
    "DepthPct",
    "TableWidth",
    "VolumeMm3",
    "CertificationRating"
]

def generate_classification_dataset(n_samples: int = 10000, random_state: int = 42) -> Tuple[pd.DataFrame, np.ndarray]:
    """Kaggle Customer Churn & Default Risk Benchmark (Binary Classification)."""
    np.random.seed(random_state)

    age = np.clip(np.random.normal(41, 13, size=n_samples), 18, 80).astype(int)
    annual_income = np.clip(np.random.lognormal(10.8, 0.55, size=n_samples), 18000, 350000)
    credit_score = np.clip(np.random.normal(680, 75, size=n_samples), 450, 850).astype(int)
    tenure = np.clip(np.random.exponential(4.2, size=n_samples) + 0.5, 0.5, 20.0)
    tx_freq = np.clip(np.random.poisson(22, size=n_samples) + np.random.normal(0, 5, size=n_samples), 2, 70).astype(int)
    avg_tx = np.clip(annual_income * 0.0018 + np.random.normal(40, 25, size=n_samples), 10, 800)
    balance_ratio = np.clip(np.random.beta(2, 4, size=n_samples) * 0.85, 0.02, 0.95)
    support_tickets = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.45, 0.28, 0.15, 0.07, 0.03, 0.02])
    device_risk = np.clip(np.random.beta(1.5, 5, size=n_samples) * 100.0, 2.0, 95.0)
    is_premium = np.random.choice([0, 1], size=n_samples, p=[0.72, 0.28])

    # True non-linear logit function
    logit = (
        -1.8
        + 0.035 * (age - 35)
        - 0.000015 * (annual_income - 60000)
        - 0.006 * (credit_score - 650)
        - 0.12 * tenure
        - 0.03 * tx_freq
        + 0.002 * avg_tx
        + 1.8 * (balance_ratio - 0.3)
        + 0.65 * support_tickets
        + 0.025 * (device_risk - 25)
        - 0.85 * is_premium
        + 0.00008 * (age * (support_tickets ** 2)) # Non-linear interaction
    )
    churn_prob = 1.0 / (1.0 + np.exp(-logit))
    is_churn = (np.random.rand(n_samples) < churn_prob).astype(int)

    df = pd.DataFrame({
        "Age": age,
        "AnnualIncome": np.round(annual_income, -2),
        "CreditScore": credit_score,
        "AccountTenure": np.round(tenure, 1),
        "TransactionFrequency": tx_freq,
        "AvgTransactionAmount": np.round(avg_tx, 2),
        "BalanceToIncomeRatio": np.round(balance_ratio, 3),
        "SupportTickets": support_tickets,
        "DeviceRiskScore": np.round(device_risk, 1),
        "IsPremiumMember": is_premium,
        "IsChurn": is_churn
    })
    return df, is_churn

def generate_regression_dataset(n_samples: int = 10000, random_state: int = 42) -> Tuple[pd.DataFrame, np.ndarray]:
    """Kaggle Diamond & Luxury Asset Valuation Benchmark (Continuous Regression)."""
    np.random.seed(random_state)

    carat = np.clip(np.random.exponential(0.65, size=n_samples) + 0.25, 0.20, 4.50)
    cut_score = np.clip(np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.05, 0.15, 0.30, 0.35, 0.15]), 1, 5) # 1=Fair, 5=Ideal
    color_grade = np.clip(np.random.choice([1, 2, 3, 4, 5, 6, 7], size=n_samples, p=[0.08, 0.12, 0.18, 0.24, 0.20, 0.12, 0.06]), 1, 7) # 1=J, 7=D
    clarity_grade = np.clip(np.random.choice([1, 2, 3, 4, 5, 6, 7, 8], size=n_samples, p=[0.04, 0.08, 0.14, 0.22, 0.24, 0.16, 0.08, 0.04]), 1, 8) # 1=I1, 8=IF
    depth_pct = np.clip(np.random.normal(61.8, 1.4, size=n_samples), 55.0, 69.0)
    table_width = np.clip(np.random.normal(57.5, 2.2, size=n_samples), 50.0, 68.0)
    volume_mm3 = np.clip(carat * 160.0 + np.random.normal(0, 12, size=n_samples), 30.0, 750.0)
    cert_rating = np.clip(np.random.choice([1, 2, 3, 4], size=n_samples, p=[0.10, 0.25, 0.45, 0.20]), 1, 4) # 1=Local, 4=GIA Elite

    # Valuation Power Law Formula
    log_price = (
        6.85
        + 1.78 * np.log(carat)
        + 0.085 * cut_score
        + 0.095 * color_grade
        + 0.115 * clarity_grade
        - 0.015 * abs(depth_pct - 61.8)
        - 0.012 * abs(table_width - 57.5)
        + 0.0008 * volume_mm3
        + 0.075 * cert_rating
        + 0.12 * (np.log(carat) * (color_grade / 7.0)) # Multiplicative interaction
        + np.random.normal(0, 0.085, size=n_samples)
    )
    price = np.round(np.exp(log_price), -1)

    df = pd.DataFrame({
        "CaratWeight": np.round(carat, 2),
        "CutQualityScore": cut_score,
        "ColorGrade": color_grade,
        "ClarityGrade": clarity_grade,
        "DepthPct": np.round(depth_pct, 1),
        "TableWidth": np.round(table_width, 1),
        "VolumeMm3": np.round(volume_mm3, 1),
        "CertificationRating": cert_rating,
        "EstimatedValue": price
    })
    return df, price

if __name__ == '__main__':
    df_c, y_c = generate_classification_dataset(1000)
    print("Classification Dataset:", df_c.shape, "Churn Rate:", round(y_c.mean() * 100, 1), "%")
    df_r, y_r = generate_regression_dataset(1000)
    print("Regression Dataset:", df_r.shape, "Mean Price: $", round(y_r.mean(), 2))
