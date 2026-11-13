"""Lab 10.09 - Compare scaling approaches: AReaL-RSI (leader + conditional memory) vs SwarmRSI (swarm evolution).

Fills the course's comparison table with ONE advantage, ONE limitation and a 'when to choose' for each,
each backed by the numbers measured in labs 10.10 and 10.11 (run those first; run_all.sh does).
"""
from _common import *  # noqa
a, s = load("lab_10_10.json"), load("lab_10_11.json")
assert a and s, "run lab_10_10 and lab_10_11 first"
adv_a = a["1500"]["diff"]; adv_b = a["2500"]["diff"]
md = f"""# 10.09 Comparing AReaL-RSI-style and SwarmRSI-style scaling (measured on the ingredient-parser testbed)

Mechanisms are from the course's summaries of arXiv:2610.18083 and arXiv:2610.20431 (not the papers); our
simulations are small, so every number below is a statement about *our miniature*, not about the papers.

| Aspect | AReaL-RSI style (leader + researchers) | SwarmRSI style (peer swarm) |
|---|---|---|
| Coordination | leader chooses an orientation; researchers test edits | 5 peer genomes mutate and recombine |
| Memory | conditional: supported / refuted / unresolved findings, shared | the population itself; recombination imports peers' patches |
| Selection | leader integrates supported findings | mu+lambda survival on steering accuracy |
| **Measured advantage** | shared memory beat independent researchers by {adv_a[0]:+.3f} [{adv_a[1]:+.3f}, {adv_a[2]:+.3f}] at budget 1500 and {adv_b[0]:+.3f} [{adv_b[1]:+.3f}, {adv_b[2]:+.3f}] at 2500 (it removes wasted repeats: {a['1500']['repeats'][1]:.1f} repeats/run without sharing, 0 with) | beat random search by a wide margin ({s['6000']['test']['swarm'][0]:.3f} vs {s['6000']['test']['random'][0]:.3f} at budget 6000) |
| **Measured limitation** | the advantage vanishes once budget is generous ({a['4000']['diff'][0]:+.3f} at 4000, CI [{a['4000']['diff'][1]:+.3f}, {a['4000']['diff'][2]:+.3f}]) | recombination added nothing over mutation alone ({s['6000']['test']['swarm'][0]:.3f} vs {s['6000']['test']['mutation_only'][0]:.3f}) and collapsed diversity ({s['6000']['diversity_final']['swarm']:.2f} vs {s['6000']['diversity_final']['mutation_only']:.2f} Jaccard) |
| Choose when | budget is tight and several workers could duplicate each other | the search space is broad and you want many independent starting points; check that recombination is actually pulling its weight |

**One-sentence takeaway.** Coordination (shared memory) helps most when work is scarce and duplication is the main waste; population
mechanisms need a measurement of whether their *recombination* step earns its keep, because here it did not.
"""
open(os.path.join(DOCS, "10.09_compare_scaling.md"), "w").write(md)
print(md)
