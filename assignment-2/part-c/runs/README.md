# Committed run artifacts

Real output, produced by the commands below. Nothing here is hand-edited.

| File | What it is |
|---|---|
| `breast_cancer-0-report.md` | the headline 40-experiment study |
| `breast_cancer-0-trace.png` | its search trace and the validation-vs-reality panel |
| `breast_cancer-0-ledger.jsonl` | every experiment, verdict and reason |
| `agent-breast_cancer-*` | the same loop driven by the Part A agent |
| `compare-wine-30seeds.log` | selection-rule comparison, p=0.037 (extended from 10 seeds — optional stopping) |
| `compare-iris-30seeds-preregistered.log` | the pre-registered confirmation that **did not replicate**, p=0.44 |
| `PREREGISTRATION.txt` | written before the iris run |
| `transcripts/` | Part A agent session logs |

Reproduce:

```bash
python3 study.py --dataset breast_cancer --budget 40
python3 study.py --dataset wine  --budget 22 --compare 30
python3 study.py --dataset iris  --budget 22 --compare 30
python3 agent_research.py
```
