"""
Financial Feature Engineering Pipeline for SPY Time Series Forecasting
Strict Data Science Principles:
1. Zero Temporal Leakage: All indicators at time t use information <= t only.
2. Fit-on-Train Only: All scalers and normalizations are fitted solely on training splits.
3. Multi-Horizon Target Alignment: y_{t+1} (1-Day Return) and y_{t+5} (5-Day Cumulative Return).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.preprocessing import StandardScaler, RobustScaler


class SPYFeaturePipeline:
    def __init__(self):
        self.scaler = RobustScaler()
        self.fitted = False
        self.feature_names = []

    def compute_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Computes 35+ technical and econometric signals strictly using past and current prices.
        No future lookahead allowed.
        """
        data = df.copy()
        
        # 1. Log Returns & Volatilities
        data["log_return"] = np.log(data["close"] / data["close"].shift(1)).fillna(0.0)
        data["parkinson_vol"] = np.sqrt(
            (np.log(data["high"] / data["low"]) ** 2) / (4.0 * np.log(2.0))
        ).fillna(0.0)
        
        # 2. Moving Averages (EMA 9, 21, 50, 200)
        data["ema_9"] = data["close"].ewm(span=9, adjust=False).mean()
        data["ema_21"] = data["close"].ewm(span=21, adjust=False).mean()
        data["ema_50"] = data["close"].ewm(span=50, adjust=False).mean()
        data["ema_200"] = data["close"].ewm(span=200, adjust=False).mean()
        
        # Relative moving average distances
        data["dist_ema_9"] = (data["close"] - data["ema_9"]) / data["ema_9"]
        data["dist_ema_21"] = (data["close"] - data["ema_21"]) / data["ema_21"]
        data["dist_ema_50"] = (data["close"] - data["ema_50"]) / data["ema_50"]
        
        # 3. Relative Strength Index (RSI 14)
        delta = data["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
        rs = gain / (loss + 1e-9)
        data["rsi_14"] = (100 - (100 / (1 + rs))).fillna(50.0)
        
        # 4. Moving Average Convergence Divergence (MACD 12, 26, 9)
        ema_12 = data["close"].ewm(span=12, adjust=False).mean()
        ema_26 = data["close"].ewm(span=26, adjust=False).mean()
        data["macd_line"] = ema_12 - ema_26
        data["macd_signal"] = data["macd_line"].ewm(span=9, adjust=False).mean()
        data["macd_hist"] = data["macd_line"] - data["macd_signal"]
        
        # 5. Bollinger Bands (20, 2 std)
        rolling_mean = data["close"].rolling(window=20, min_periods=1).mean()
        rolling_std = data["close"].rolling(window=20, min_periods=1).std().fillna(1.0)
        data["bb_upper"] = rolling_mean + 2.0 * rolling_std
        data["bb_middle"] = rolling_mean
        data["bb_lower"] = rolling_mean - 2.0 * rolling_std
        data["bb_pct_b"] = (data["close"] - data["bb_lower"]) / (data["bb_upper"] - data["bb_lower"] + 1e-9)
        data["bb_bandwidth"] = (data["bb_upper"] - data["bb_lower"]) / data["bb_middle"]
        
        # 6. Average True Range (ATR 14)
        prev_close = data["close"].shift(1).fillna(data["open"])
        tr1 = data["high"] - data["low"]
        tr2 = (data["high"] - prev_close).abs()
        tr3 = (data["low"] - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        data["atr_14"] = tr.rolling(window=14, min_periods=1).mean()
        
        # 7. Stochastic Oscillator (%K, %D 14, 3)
        low_14 = data["low"].rolling(window=14, min_periods=1).min()
        high_14 = data["high"].rolling(window=14, min_periods=1).max()
        data["stoch_k"] = (100.0 * (data["close"] - low_14) / (high_14 - low_14 + 1e-9)).fillna(50.0)
        data["stoch_d"] = data["stoch_k"].rolling(window=3, min_periods=1).mean()
        
        # 8. On-Balance Volume (OBV)
        obv = [0]
        for i in range(1, len(data)):
            if data["close"].iloc[i] > data["close"].iloc[i-1]:
                obv.append(obv[-1] + data["volume"].iloc[i])
            elif data["close"].iloc[i] < data["close"].iloc[i-1]:
                obv.append(obv[-1] - data["volume"].iloc[i])
            else:
                obv.append(obv[-1])
        data["obv"] = obv
        data["obv_ema"] = data["obv"].ewm(span=20, adjust=False).mean()
        
        # 9. Autoregressive Return Lags (t-1, t-2, t-3, t-5)
        data["lag_ret_1"] = data["log_return"].shift(1).fillna(0.0)
        data["lag_ret_2"] = data["log_return"].shift(2).fillna(0.0)
        data["lag_ret_3"] = data["log_return"].shift(3).fillna(0.0)
        data["lag_ret_5"] = data["log_return"].shift(5).fillna(0.0)
        
        # 10. Macro Changes (VIX change, TNX change, DXY change)
        data["vix_ret"] = data["vix_close"].pct_change().fillna(0.0)
        data["tnx_diff"] = data["tnx_yield"].diff().fillna(0.0)
        data["dxy_ret"] = data["dxy_index"].pct_change().fillna(0.0)
        
        # 11. Target Formulations (Forward-Looking Target Variables)
        # 1-Day Forward Log Return: ln(Close_{t+1} / Close_t)
        data["target_ret_1d"] = np.log(data["close"].shift(-1) / data["close"])
        # 5-Day Forward Cumulative Log Return: ln(Close_{t+5} / Close_t)
        data["target_ret_5d"] = np.log(data["close"].shift(-5) / data["close"])
        
        # Forward Target Prices
        data["target_price_1d"] = data["close"].shift(-1)
        data["target_price_5d"] = data["close"].shift(-5)
        
        return data

    def get_feature_matrix(self, df_with_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
        """
        Extracts feature matrix X and targets y_1d, y_5d.
        Excludes target columns from X to eliminate any leakage.
        """
        feature_cols = [
            "log_return", "parkinson_vol", "dist_ema_9", "dist_ema_21", "dist_ema_50",
            "rsi_14", "macd_line", "macd_signal", "macd_hist", "bb_pct_b", "bb_bandwidth",
            "atr_14", "stoch_k", "stoch_d", "lag_ret_1", "lag_ret_2", "lag_ret_3", "lag_ret_5",
            "vix_close", "vix_ret", "tnx_yield", "tnx_diff", "dxy_index", "dxy_ret",
            "xlk_spy_ratio", "xlf_spy_ratio", "soxx_spy_ratio", "fomc_sentiment_score"
        ]
        self.feature_names = feature_cols
        
        X = df_with_features[feature_cols].values
        y_1d = df_with_features["target_ret_1d"].values
        y_5d = df_with_features["target_ret_5d"].values
        
        return X, y_1d, y_5d, feature_cols

    def fit_transform_train(self, X_train: np.ndarray) -> np.ndarray:
        """Fits scaler on training data only and transforms it."""
        self.fitted = True
        return self.scaler.fit_transform(X_train)

    def transform_test(self, X_test: np.ndarray) -> np.ndarray:
        """Transforms test data using scaler fitted strictly on training data."""
        if not self.fitted:
            raise RuntimeError("Pipeline must be fitted on training data before transforming test data.")
        return self.scaler.transform(X_test)
