# Video Walkthrough Script — Customer Intelligence & Segmentation Clustering Platform

**Runtime target: ~2.5 minutes**

---

Hey everyone, welcome back. Today I'm walking you through a project I built called the Customer Intelligence & Segmentation Platform — it's an unsupervised machine learning app that takes ten thousand anonymous retail customers and automatically discovers five natural behavioral personas, without ever being told what those personas should look like.

So here's the origin story. The exact prompt I gave my AI coding assistant was: "Now let's do another project — clustering using a popular Kaggle dataset — make sure you follow the CRISP-DM framework and also include a nice data science admin dashboard. You can research the papers and implement autoresearch to do hill climbing and match the dashboard details with the research paper. Include all the details a data scientist and AI engineer will care about." That one paragraph is basically the whole spec — CRISP-DM rigor, an admin dashboard, and an autonomous hill-climbing research loop. Everything you're about to see grew out of that.

Let's actually tour it. I'm on the Customer Segment Explorer tab. At the top you've got a banner framing this as a Kaggle benchmark challenge — it tells you the SOTA silhouette baseline was 0.385, and our AutoResearch hill-climber pushed it to 0.418, a 21% gain, landing on k=5 as the optimal cluster count. Below that are five persona cards — VIP Champions, Prudent Affluents, Young Trendsetters, Bargain Hunters, and Mainstream Loyalists — each with live population counts and average income and spend. Click any card and it filters the scatter plot on the left down to just that cluster.

That scatter plot is a real 2D PCA projection of all ten thousand customers, and I can toggle over to t-SNE for a non-linear view of the same manifold — watch how the cluster separation reshapes. Hovering over any dot pops up that customer's actual attributes.

On the right is the fun part — a live predictor. I can drag sliders for age, income, spending score, recency, annual spend, and web visits, hit "Classify & Recommend Strategy," and the model runs real inference through the trained K-Means pipeline and drops a glowing marker exactly where that hypothetical customer lands on the PCA plot, plus a tailored marketing recommendation.

Architecture-wise, the one thing worth calling out is the AutoResearch hill-climbing loop — it's a CRISP-DM "Evaluation" step turned into an actual autonomous agent. It systematically sweeps distance metrics, scaling transforms, and PCA pre-reduction, logs every trial, and only promotes a new champion model when it beats the current best silhouette score. You can see that full trajectory in the Data Science Admin Console.

For my creative addition this round, I added a confidence gauge ring around the prediction result — a small circular SVG that fills proportionally to the model's cluster assignment confidence — and when a prediction comes back with high confidence, it triggers a tasteful confetti burst in the persona's own color. Small touch, but it makes a strong classification feel like a little win.

That's the tour — an end-to-end unsupervised segmentation platform, from raw customer data to a live, explainable persona predictor. Thanks for watching, and I'll see you in the next one.
