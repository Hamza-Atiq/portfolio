---
title: "If one power line fails, does anything overload?"
subtitle: "N-1 contingency screening with a graph neural network (IEEE 57-bus)"
slug: p013-grid-contingency
kind: research
status: draft
date: 2026-10
tags: [Power systems, Graph neural networks]
team: solo
my_role: "Built everything: data generation, model, solver check, tests, live page"
summary: "An AI ranks all 80 possible line failures; a real power-flow solver confirms only the risky ones."
result: "Caught at least 99.91% of dangerous cases in all 50 tests (8,750 unseen days); 2.25× faster (median)."
cover: { src: images/p013/cover.png, alt: "IEEE 57-bus grid map showing the lines checked by the solver" }
links:
  code: https://github.com/Hamza-Atiq/p013-grid-contingency-screening
  demo: https://hamza-atiq.github.io/p013-grid-contingency-screening/
proofs: []
pin: 1
---
## The problem

Grid operators must always know: if any one line or transformer trips right now, will another line overload, or will some voltage fall too low? This check is called **N-1 contingency analysis** ("N minus one": the grid with one part missing).

The exact way is to solve the full AC power flow again for every possible failure. On this grid that is 80 solves for every snapshot of the grid. When conditions change quickly, that is slow.

A common idea is to replace the solver with a fast AI model. But a model that is wrong about even one dangerous case is not safe to trust. So here the AI is only allowed to **sort**. It ranks the 80 cases by danger, and the real solver checks every case that could be dangerous. The solver always has the final word.

## Why I built it

During my degree I spent a month at Tarbela power station and a week inside a grid station with a double busbar and bus coupler. I watched operators take a bus out of service while the load moved across to the other bus. This project asks the same question, "what happens if this part goes out?", and tries to answer it fast enough to ask it about every part, all the time.

## The method

1. **The grid.** The IEEE 57-bus test grid (57 nodes, 80 lines and transformers), from the PGLib-OPF library. With pandapower I generated 20,000 training snapshots, plus 750 separate days of load and generation for testing.
2. **The AI.** A graph neural network, written by hand in PyTorch, that passes messages along the lines. A line that is off carries no message, so one trained model covers all 80 failures. It predicts the voltage at every bus, and line flows are computed from those voltages.
3. **A danger score.** A case is dangerous if any line carries more than 100% of its rating, or any bus voltage ends up more than 0.05 per unit further outside the 0.95 to 1.05 range than it was before the failure. The same check on the AI's predictions gives each case a danger score.
4. **The screening rule.** On heavy-load days, all 80 cases go to the solver. On normal days, every case at or above a learned cutoff goes to the solver. Both are learned only from "practice" days and graded on unseen "exam" days.
5. **Safety checks in code.** A failure that would split the grid apart always goes to the solver. So do the 7 cases that could not be solved on any practice day.
6. **The solver decides.** pandapower's Newton-Raphson AC power flow solves every case that was sent. Its answer is the one that counts.

The model is not new, and I do not claim it is. What I built is the pipeline around it: the exact grid-splitting check, the solver-has-the-final-word setup, and an honest measurement of how often it misses.

## Results, and how they were measured

Measured on 8,750 unseen days (50 random tests of 175 days each). All 50 tests one by one, and every missed case, are on the [full results page](https://hamza-atiq.github.io/p013-grid-contingency-screening/results.html).

- **Dangerous cases caught:** 99.91% or more in every one of the 50 tests.
- **Speed:** 2.25× faster than solving all 80 cases (median over the 50 tests); about 5× on a normal-load day.
- **Cases sent to the solver:** 32.7 of 80 per day on average (median test).
- **Days where a dangerous case slipped through:** 14 of 8,750, about 1 day in 625. Those 14 are only 4 different days.
- **Tests with zero misses:** 39 of 50.
- **Software tests:** 330 automated tests, passing on a fresh download.

**I set a pass mark in advance, and it was not reached.** I wanted zero misses on at least 48 of 50 tests and got 39. With the selection rule exactly as I first wrote it down, it was 31 of 50. So this tool cannot promise that it never misses. What it can state is the measured miss rate above.

## Limits

- **Heavy days gain nothing.** About 3 in 10 days are heavy, and on those all 80 cases go to the solver, so they are slightly slower than solving directly. The speed comes from normal days.
- One grid (IEEE 57-bus), all synthetic days. Not tested on a bigger grid or on real operating data.
- Only line and transformer failures. Generator, load and busbar failures are out of scope.
- Every miss is a voltage drop the model predicts too small on a few specific lines, on normal-load days. That is what I would study next.
- The 50 tests are reshuffles of the same 750 days, so they overlap.
- Timings come from one dual-core laptop with no GPU: one AC solve takes about 0.051 s, so all 80 take about 4.1 s.

Try it: the [live page](https://hamza-atiq.github.io/p013-grid-contingency-screening/) opens instantly, and the [Colab notebook](https://colab.research.google.com/github/Hamza-Atiq/p013-grid-contingency-screening/blob/main/notebooks/p013_live.ipynb) runs the real model and solver on a new day.
