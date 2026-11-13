# Part 5 - Scaling and coordination (Labs 10.09, 10.10, 10.11) - ~9 min

Mechanisms from the course summaries of arXiv:2610.18083 (AReaL-RSI) and arXiv:2610.20431 (SwarmRSI) - **unverified papers**.

## 0:00 Idea (45 s)
Two ways to scale RSI: a leader directing researchers with a shared conditional memory, or a swarm that mutates and recombines.

## 0:45 Lab 10.10 - leader/researchers (3.5 min)  `python labs/lab_10_10_areal_leader_follower.py`  (~4 s)
Open `rsi_lab/methods/coordination.py::run_areal`. Show: orientation, findings tagged supported/refuted/unresolved, the shared board that prevents duplicate work, and the leader integrating every distinct supported finding.
Output: shared memory beats independent researchers at tight budgets and converges when budget is generous; repeats go to zero.
Tell the debugging story briefly: my first version silently *lost* supported-but-unintegrated findings and made shared memory look worse - the integration step fixed it. (Honest, and instructive.)

## 4:15 Lab 10.11 - swarm (2.5 min)  `python labs/lab_10_11_swarm.py`  (~10 s)
Open `run_swarm`: feedback-guided mutation and complementary recombination. Output: both beat random; **recombination adds nothing over mutation alone and collapses diversity**.

## 6:45 Lab 10.09 - comparison table (1.5 min)  open `docs/10.09_compare_scaling.md`

## 8:15 Close (30 s)

### Say this honestly
* These are my reading of summaries, simplified to a few dozen lines. The numbers say something about this miniature only.
