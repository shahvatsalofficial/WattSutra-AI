---
name: wattsutra-latency-lens
description: Interpret wall-clock time, percentiles, warmup, jitter and latency regressions. Use when interpreting wall-clock results, percentiles, jitter or regressions.
---

# WattSutra Latency Lens

**Mission:** Interpret wall-clock time, percentiles, warmup, jitter and latency regressions.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra bench`, `wattsutra compare`.

## When to use
Interpreting wall-clock results, percentiles, jitter or regressions.

## Protocol
1. Read n, mean, median, sample stddev, CV, p95 from the run.
2. Call p95 indicative when n is small; never call a tiny sample significant.
3. Use the compare 95% bootstrap interval; if it spans 1, report "not distinguishable".
4. Latency change is not an energy or cost change.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Latency summary, interval, verdict on noise vs signal. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
