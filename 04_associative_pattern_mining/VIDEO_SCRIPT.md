# Video Walkthrough Script — Market Basket Intelligence & Association Pattern Mining

**Runtime target: ~2.5 minutes**

---

Hey everyone, in this one I'm showing off my Market Basket Intelligence platform — it's a frequent-itemset mining engine that watches ten thousand grocery orders and figures out, on its own, which products get bought together, so it can recommend the next thing to add to your cart in real time.

The build prompt here was almost identical in spirit to my clustering project, just aimed at a different unsupervised problem: "Now let's do another project — associative pattern mining using a popular Kaggle dataset — make sure you follow the CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with the research paper. Include all the details a data scientist and AI engineer will care about." So again — CRISP-DM discipline, an admin dashboard, and an autonomous research loop, this time applied to Apriori, FP-Growth, and ECLAT algorithms on Instacart-style transaction data.

Let's jump into the UI. This is the Basket Recommender tab. At the top, a Kaggle-style benchmark banner shows the grandmaster SOTA mean lift of 4.85 against our AutoResearch-evolved 3.79, and it also lists out the actual math — support, confidence, lift, conviction — right there as reference chips.

Below that is the interactive shopping basket. I've got a couple of quick presets like "Guacamole Fiesta" or I can manually pick products from the catalog dropdown. Right now my basket has Organic Hass Avocados and Fresh Limes. Watch what happens on the right — instantly, six cross-sell recommendations appear, sorted by lift, and the top one is Fresh Organic Cilantro at a 4.48x lift with 86% confidence — that's a genuinely strong association rule, not a random guess. I can click "Add to Cart" right from a recommendation card and it drops straight into my basket, updating the potential GMV uplift number live.

On the right side there's a force-directed 2D association network graph — each node is a catalog product, and each edge represents a mined rule, weighted by lift strength, so you can visually spot which products cluster into shopping "communities."

The architecture highlight worth mentioning: just like the clustering platform, this one has an AutoResearch hill-climbing loop wired into the CRISP-DM Evaluation phase — it sweeps minimum support and confidence thresholds across algorithm variants and only promotes a new rule set when the quality metrics actually improve, and you can watch that whole trajectory in the Data Science Admin tab.

For my creative addition, I added a "Clear Basket" button next to the item count, since previously you could only remove items one at a time — small quality-of-life fix. And more fun — whenever you accept one of the AI's recommended cross-sell items by clicking "Add to Cart," it now fires a little confetti burst in the app's amber-and-emerald colors, celebrating the exact moment a mined association rule turns into a real purchase decision.

That's Market Basket Intelligence — unsupervised pattern discovery turned into a live, explainable recommender. Thanks for watching, catch you in the next walkthrough.
