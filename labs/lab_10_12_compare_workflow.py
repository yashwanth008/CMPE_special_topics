"""Lab 10.12 - Compare workflow adaptation: RSIFlow (meta-agent re-routing) vs Self-HPO (harness/policy alternation).

Fills the course's comparison with measured evidence from labs 10.13 and 10.14.
"""
from _common import *  # noqa
w, h = load("lab_10_13.json"), load("lab_10_14.json")
assert w and h, "run lab_10_13 and lab_10_14 first"
d1 = w["6000"]["diff_adapt_static"]; d2 = w["6000"]["diff_adapt_allon"]
hp = h["12000"]; lo = h["6000"]
md = f"""# 10.12 RSIFlow-style vs Self-HPO-style adaptation (measured on the ingredient-parser testbed)

RSIFlow mechanism: course summary of arXiv:2610.21791 (not the paper). Self-HPO: arXiv:2610.22791 (abstract verified).
Our implementations are miniatures: numbers describe *this testbed only*.

| Aspect | RSIFlow style | Self-HPO style |
|---|---|---|
| What adapts | the workflow's stage routing (dedup / guard / diagnose) | the harness (guard + search set) AND the policy's edit preferences |
| Trigger | measured waste in the last 8 cycles | every round (H-step then P-step) |
| What learns | nothing numerical: rule-based meta-agent | the policy by REINFORCE; the harness proposer by a bandit |
| **Measured benefit** | beat the static pipeline by {d1[0]:+.3f} [{d1[1]:+.3f}, {d1[2]:+.3f}] at budget 6000 | at budget 12000: joint vs no-adaptation {hp['joint_vs_none'][0]:+.3f} [{hp['joint_vs_none'][1]:+.3f}, {hp['joint_vs_none'][2]:+.3f}] (not distinguishable from 0) |
| **Measured cost / limit** | lost to simply turning every stage on from the start ({d2[0]:+.3f} [{d2[1]:+.3f}, {d2[2]:+.3f}]) because of detection latency (stages switched on at cycles {w['6000']['latency_cycles']['dedup']:.0f}/{w['6000']['latency_cycles']['guard']:.0f}/{w['6000']['latency_cycles']['diagnose']:.0f}) | the H-step is a fixed overhead: at budget 6000 it took {100*lo['hstep_share']:.0f}% of the budget and the joint method scored {lo['test']['self_hpo'][0]:.3f} vs {lo['test']['none'][0]:.3f} for no adaptation |
| Paper claim 'joint > sum of parts' | n/a | NOT reproduced here: synergy at 12000 = {hp['synergy'][0]:+.3f} [{hp['synergy'][1]:+.3f}, {hp['synergy'][2]:+.3f}] |
| Prefer when | stages are costly to run all the time and the bottleneck really changes | there is a learnable policy AND a harness worth searching, and budget is large enough to amortise the H-step |

**Takeaway.** Both ideas hinge on an overhead-versus-benefit trade that the headline numbers hide. The honest comparison for adaptive routing is
'always on', and for harness search it is 'spend that budget on more policy updates'.
"""
open(os.path.join(DOCS, "10.12_compare_workflow.md"), "w").write(md)
print(md)
