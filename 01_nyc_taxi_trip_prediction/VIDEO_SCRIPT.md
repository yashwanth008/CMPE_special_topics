# Video Walkthrough Script — NYC Taxi Trip Duration & Fare Prediction Platform

**Runtime target: ~3 minutes**

---

Alright, this one's my favorite in the series. This is a full end-to-end machine learning product built on the classic Kaggle NYC Taxi Trip Duration challenge — and it's not just a model in a notebook, it's a real deployed API with an interactive map front end.

Here's the prompt that kicked it off: "Now on to another project - You will do end2end a data science project of including data, training, deployment, crisp-dm framework, and an awesome front end. you can use Kaggle NYC taxi challenge. make sure that frontend includes interactive map and trip estimation." I followed up twice after that — once asking for a beefier admin dashboard with more data-scientist-level detail, and once asking it to prepare a full CRISP-DM research report and match the dashboard numbers to that report.

So let's take the tour. This is the Fare and Trip Estimator screen. I pick a pickup landmark — let's say Times Square — and a dropoff — JFK Airport — set a passenger count and pickup time, and instantly, on the right, you get a live animated route line across an SVG map of the five boroughs, and on the left a full prediction: trip duration, a ninety-five percent confidence interval, and a fare breakdown all the way down to base fare, distance rate, time rate, airport surcharge, overnight surcharge, and the NYC congestion fee — and now it also shows a running total line so the math actually adds up in front of you, which is the fix I'll get to in a second.

Flipping over to the Data Science Admin tab is where this project really shows its teeth. There's a full benchmark matrix comparing the production XGBoost model against a simulated Kaggle-grandmaster-tier ensemble baseline, an AutoResearch hill-climbing tab that logs an automated search over model backbones and hyperparameters, and a deep-dive tab with residual diagnostics, segment-level error breakdowns by trip distance, and feature correlation tables. There's even a one-click Retrain Model button that kicks off a fresh XGBoost training run against a synthetic NYC-shaped dataset and hot-swaps the deployed model.

The architecture highlight I want to call out: this is a genuinely production-shaped ML service. The FastAPI backend loads a serialized XGBoost model at startup, and every prediction request runs through the exact same feature engineering pipeline used at training time — haversine and Manhattan-grid distance, compass bearing, cyclical time features, and proximity-to-hub features for JFK, LaGuardia, Newark, and Manhattan landmarks — so there's no train-serve skew. That's the kind of detail that separates a toy demo from something you could actually ship.

While auditing this one I found a real bug in the fare breakdown card: the backend was correctly computing a congestion fee and an overnight surcharge on every single fare, but the frontend was never displaying those two line items — so if you added up what was on screen, you'd get a number smaller than the total shown, which just looks broken to anyone glancing at it. I added both missing line items plus an explicit running total row, so now every dollar in the total fare is accounted for on screen.

That's the NYC Taxi platform — Kaggle challenge data, real spatial feature engineering, an XGBoost model that beats a respectable RMSLE, and a genuinely research-grade admin dashboard sitting behind an interactive map. On to the next one.
