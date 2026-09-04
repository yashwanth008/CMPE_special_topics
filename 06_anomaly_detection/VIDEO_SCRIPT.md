# Video Walkthrough Script — Autonomous Anomaly Detection & Threat Intelligence Platform

**Runtime target: ~2.5-3 minutes**

---

Hey everyone, welcome back. Today I'm walking you through one of my favorite builds in this portfolio: an autonomous anomaly detection and threat intelligence platform for cloud server telemetry. In plain English — this app watches ten different signals coming off a fleet of servers, like CPU load, network throughput, failed logins, and it tells you in real time whether what it's seeing looks normal, or looks like an attack.

Here's the exact prompt I gave my AI coding assistant to kick this off: "Now let's do another project — anomaly detection using popular Kaggle data set and popular methods — make sure you follow CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with research paper. Include all details a data scientist and AI engineer will care about." So the brief was pretty open — go find good methods, be rigorous, and build something that looks like a real ops dashboard.

Let's tour the UI. We land on the Threat Scorer tab, and right away you see ten sliders — request velocity, network throughput, failed auth count, memory pressure, latency, entropy score. These represent a live telemetry snapshot. Up top there's a row of attack archetype buttons — Nominal Steady State, Volumetric DDoS Attack, Credential Stuffing, and Resource Starvation. Watch what happens when I click DDoS — the sliders jump to attack values, and instantly the Ensemble Threat Index on the right spikes from a calm single digit up near 100, the badge flips from NOMINAL to CRITICAL, and below it the root-cause diagnostic literally names the attack pattern it thinks it's looking at. That's the fun part — you can feel the model react live as you drag any single slider.

Now flip over to the 2D Manifold tab — this is a PCA projection squashing all ten dimensions down to two, so you can visually see the cluster of normal traffic and the scattered outliers that don't belong. Then there's Backbones & SOTA, which is a leaderboard comparing five different detection algorithms — Isolation Forest, a hand-rolled deep autoencoder, Local Outlier Factor, One-Class SVM, and Robust Mahalanobis distance — against a published Kaggle top-1% baseline, so you can see exactly how each method stacks up on ROC-AUC and inference latency.

The architecture highlight I want to call out: the CRISP-DM AutoResearch tab. Instead of just training once and calling it done, this project runs an automated hill-climbing loop that iteratively tunes contamination ratios and ensemble weights across five steps, logging each step's ROC-AUC gain, until it lands on a champion ensemble. That's a nice example of baking the "evaluation and deployment" phases of CRISP-DM directly into the product instead of leaving them in a notebook.

For my creative addition, I added a live session threat trend sparkline right inside the threat meter card. As you drag sliders or fire off attack presets, it now draws a rolling mini line chart of your last two dozen threat scores, with a dashed line marking the decision cutoff — so you can literally watch your score walk up toward the threshold and cross into anomaly territory, which makes the real-time nature of this scorer much more visceral.

That's the anomaly detection platform — five algorithms, an autoresearch tuning loop, and a threat scorer you can actually poke at. Go grab the code, spin up the backend and frontend, and try to break it with your own attack values. See you in the next one.
