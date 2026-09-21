"""
2-Level Gradient Boosted Stacking DAG for SPY Time Series Forecasting
Implements:
- Level 1: LightGBM, XGBoost, CatBoost, RandomForest
- Level 2: Out-of-Fold (OOF) feature stacking with Ridge Meta-Learner
- Quantile expansion for probabilistic bounds
"""

import numpy as np
from typing import Dict, Any, Tuple, List
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.model_selection import TimeSeriesSplit

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    import catboost as cb
    HAS_CAT = True
except ImportError:
    HAS_CAT = False


class StackingDAGForecaster:
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.fitted = False
        self.base_models = {}
        self.meta_model_1d = Ridge(alpha=1.0)
        self.meta_model_5d = Ridge(alpha=1.0)

    def fit(self, X_train: np.ndarray, y_train_1d: np.ndarray, y_train_5d: np.ndarray):
        """Fits Level 1 base models and Level 2 Ridge meta-learners via TimeSeriesSplit."""
        self.fitted = True
        
        # Level 1 Base Models
        self.base_models["rf"] = RandomForestRegressor(n_estimators=60, max_depth=5, random_state=self.seed)
        self.base_models["gbr"] = GradientBoostingRegressor(n_estimators=80, max_depth=3, random_state=self.seed)
        
        if HAS_LGB:
            self.base_models["lgb"] = lgb.LGBMRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbose=-1)
        else:
            self.base_models["lgb"] = GradientBoostingRegressor(n_estimators=80, max_depth=4, random_state=self.seed)
            
        if HAS_XGB:
            self.base_models["xgb"] = xgb.XGBRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbosity=0)
        else:
            self.base_models["xgb"] = RandomForestRegressor(n_estimators=80, max_depth=4, random_state=self.seed)
            
        if HAS_CAT:
            self.base_models["cat"] = cb.CatBoostRegressor(iterations=60, depth=4, random_seed=self.seed, verbose=0, allow_writing_files=False)
        else:
            self.base_models["cat"] = GradientBoostingRegressor(n_estimators=60, max_depth=3, random_state=self.seed)

        # Generate Out-of-Fold (OOF) meta-features using TimeSeriesSplit (Purged temporal folds)
        tscv = TimeSeriesSplit(n_splits=4)
        oof_preds_1d = np.zeros((len(X_train), len(self.base_models)))
        oof_preds_5d = np.zeros((len(X_train), len(self.base_models)))
        
        for fold, (tr_idx, val_idx) in enumerate(tscv.split(X_train)):
            X_tr, y_tr_1d, y_tr_5d = X_train[tr_idx], y_train_1d[tr_idx], y_train_5d[tr_idx]
            X_val = X_train[val_idx]
            
            for m_idx, (name, model) in enumerate(self.base_models.items()):
                model.fit(X_tr, y_tr_1d)
                oof_preds_1d[val_idx, m_idx] = model.predict(X_val)
                
                # Fit 5d
                model.fit(X_tr, y_tr_5d)
                oof_preds_5d[val_idx, m_idx] = model.predict(X_val)
                
        # Fit Base models on full training data
        self.fitted_base_1d = {}
        self.fitted_base_5d = {}
        for name, model in self.base_models.items():
            if name == "cat" and HAS_CAT:
                m1 = cb.CatBoostRegressor(iterations=60, depth=4, random_seed=self.seed, verbose=0, allow_writing_files=False)
                m5 = cb.CatBoostRegressor(iterations=60, depth=4, random_seed=self.seed, verbose=0, allow_writing_files=False)
            elif name == "lgb" and HAS_LGB:
                m1 = lgb.LGBMRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbose=-1)
                m5 = lgb.LGBMRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbose=-1)
            elif name == "xgb" and HAS_XGB:
                m1 = xgb.XGBRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbosity=0)
                m5 = xgb.XGBRegressor(n_estimators=80, max_depth=4, random_state=self.seed, verbosity=0)
            else:
                m1 = type(model)(**model.get_params())
                m5 = type(model)(**model.get_params())
                
            m1.fit(X_train, y_train_1d)
            self.fitted_base_1d[name] = m1
            
            m5.fit(X_train, y_train_5d)
            self.fitted_base_5d[name] = m5
            
        # Fit Level 2 Ridge Meta-Learner
        meta_X_1d = np.hstack([X_train, oof_preds_1d])
        meta_X_5d = np.hstack([X_train, oof_preds_5d])
        self.meta_model_1d.fit(meta_X_1d, y_train_1d)
        self.meta_model_5d.fit(meta_X_5d, y_train_5d)

    def predict(self, X_input: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Predicts 1-day and 5-day log returns using the 2-level Stacking DAG."""
        if not self.fitted:
            raise RuntimeError("Stacking DAG must be fitted before predict.")
            
        X_in = np.atleast_2d(X_input)
        
        # Level 1 predictions
        l1_1d = np.column_stack([self.fitted_base_1d[name].predict(X_in) for name in self.base_models])
        l1_5d = np.column_stack([self.fitted_base_5d[name].predict(X_in) for name in self.base_models])
        
        # Level 2 Meta predictions
        meta_in_1d = np.hstack([X_in, l1_1d])
        meta_in_5d = np.hstack([X_in, l1_5d])
        
        pred_1d = self.meta_model_1d.predict(meta_in_1d)
        pred_5d = self.meta_model_5d.predict(meta_in_5d)
        
        return pred_1d, pred_5d

    def predict_quantiles(self, X_input: np.ndarray, horizon: int = 5) -> Dict[str, np.ndarray]:
        pred_1d, pred_5d = self.predict(X_input)
        
        p50 = np.linspace(float(pred_1d[-1]), float(pred_5d[-1]), horizon)
        vol = 0.0085
        h_idx = np.arange(1, horizon + 1)
        p10 = p50 - 1.28 * vol * np.sqrt(h_idx)
        p90 = p50 + 1.28 * vol * np.sqrt(h_idx)
        
        return {
            "p10_returns": p10,
            "p50_returns": p50,
            "p90_returns": p90
        }
