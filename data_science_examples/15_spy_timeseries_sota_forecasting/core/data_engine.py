"""
SPY Historical Market Data Engine & Multi-Modal Exogenous Pipeline
Generates/loads 6-month daily trading bars for SPY with realistic micro-structure:
- OHLCV (Open, High, Low, Close, Adj Close, Volume)
- Macro Covariates: CBOE VIX (^VIX), 10-Year US Treasury Yield (^TNX), Dollar Index (DXY)
- Sector Momentum Ratios: Tech (XLK / SPY), Financials (XLF / SPY), SOXX / SPY
- FOMC Sentiment & Economic Policy Signals
- Strict In-Sample (5 months) vs Out-of-Sample (1 month) Chronological Splitting (Zero Lookahead)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List


class SPYMarketDataEngine:
    def __init__(self, seed: int = 42):
        self.seed = seed
        np.random.seed(seed)
        self.raw_df = self._generate_spy_market_data()
        self.train_df, self.test_df = self._split_train_test(self.raw_df)

    def _generate_spy_market_data(self) -> pd.DataFrame:
        """Generates realistic 126 trading days (approx. 6 months) of daily SPY market data."""
        num_days = 126
        start_date = datetime(2026, 3, 1)
        
        dates = []
        cur_date = start_date
        while len(dates) < num_days:
            # Skip weekends (Saturday=5, Sunday=6)
            if cur_date.weekday() < 5:
                dates.append(cur_date.strftime("%Y-%m-%d"))
            cur_date += timedelta(days=1)
            
        # Starting SPY Price around $510.00
        initial_price = 510.00
        
        # Drift and volatility parameters (annualized 12% drift, 16% vol)
        daily_drift = 0.12 / 252.0
        daily_vol = 0.16 / np.sqrt(252.0)
        
        # Macro shock dynamics (simulating market regimes: mild bull, sharp pullback, recovery)
        macro_regimes = np.sin(np.linspace(0, 3 * np.pi, num_days)) * 0.003
        daily_innovations = np.random.normal(daily_drift + macro_regimes, daily_vol, num_days)
        
        # Price path reconstruction
        log_prices = np.log(initial_price) + np.cumsum(daily_innovations)
        close_prices = np.exp(log_prices)
        
        data_rows = []
        vix_base = 14.5
        tnx_base = 4.25
        dxy_base = 104.2
        
        for i in range(num_days):
            date_str = dates[i]
            c_price = close_prices[i]
            prev_c = close_prices[i-1] if i > 0 else c_price * (1 - daily_drift)
            
            # Intraday high, low, open
            intraday_vol = daily_vol * np.random.uniform(0.6, 1.4)
            o_price = prev_c * (1 + np.random.normal(0, intraday_vol * 0.4))
            h_price = max(o_price, c_price) * (1 + abs(np.random.normal(0, intraday_vol * 0.7)))
            l_price = min(o_price, c_price) * (1 - abs(np.random.normal(0, intraday_vol * 0.7)))
            adj_c = c_price  # dividend adjusted
            
            # Realistic Volume (50M to 95M shares daily with spikes on high volatility)
            vol_multiplier = 1.0 + 15.0 * abs(c_price - prev_c) / prev_c
            volume = int(np.random.uniform(55_000_000, 85_000_000) * vol_multiplier)
            
            # Macro Covariates
            # VIX inversely correlated with SPY returns
            ret = (c_price - prev_c) / prev_c
            vix = max(11.0, min(38.0, vix_base - 120.0 * ret + np.random.normal(0, 0.4)))
            vix_base = 0.95 * vix_base + 0.05 * vix  # mean reverting
            
            tnx = max(3.5, min(5.2, tnx_base + np.random.normal(0, 0.02)))
            tnx_base = tnx
            
            dxy = max(98.0, min(108.0, dxy_base + np.random.normal(0, 0.15)))
            dxy_base = dxy
            
            # Sector ETF momentum ratios
            xlk_ratio = 0.38 + 0.04 * np.sin(i / 15.0) + np.random.normal(0, 0.003)
            xlf_ratio = 0.13 - 0.01 * np.cos(i / 20.0) + np.random.normal(0, 0.002)
            soxx_ratio = 0.45 + 0.06 * np.sin(i / 12.0) + np.random.normal(0, 0.005)
            
            # FOMC Sentiment score (-1.0 to +1.0)
            fomc_sentiment = float(np.tanh(np.sin(i / 10.0) + np.random.normal(0, 0.2)))
            
            data_rows.append({
                "timestamp": date_str,
                "open": round(float(o_price), 2),
                "high": round(float(h_price), 2),
                "low": round(float(l_price), 2),
                "close": round(float(c_price), 2),
                "adj_close": round(float(adj_c), 2),
                "volume": volume,
                "vix_close": round(float(vix), 2),
                "tnx_yield": round(float(tnx), 3),
                "dxy_index": round(float(dxy), 2),
                "xlk_spy_ratio": round(float(xlk_ratio), 4),
                "xlf_spy_ratio": round(float(xlf_ratio), 4),
                "soxx_spy_ratio": round(float(soxx_ratio), 4),
                "fomc_sentiment_score": round(fomc_sentiment, 3)
            })
            
        df = pd.DataFrame(data_rows)
        return df

    def _split_train_test(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Chronological Sequential Split:
        - In-sample Training: First 5 months (105 days, approx. 83.3%)
        - Out-of-sample Testing / Backtesting: Last 1 month (21 days, approx. 16.7%)
        Guarantees zero future lookahead or temporal shuffling.
        """
        train_len = 105
        train_df = df.iloc[:train_len].copy().reset_index(drop=True)
        test_df = df.iloc[train_len:].copy().reset_index(drop=True)
        return train_df, test_df

    def get_full_data(self) -> pd.DataFrame:
        return self.raw_df.copy()

    def get_train_data(self) -> pd.DataFrame:
        return self.train_df.copy()

    def get_test_data(self) -> pd.DataFrame:
        return self.test_df.copy()
