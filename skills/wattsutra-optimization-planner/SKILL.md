---
name: wattsutra-optimization-planner
description: Propose low-risk experiments without asserting unmeasured savings. Use when proposing what to try next.
---

# WattSutra Optimization Planner

**Mission:** Propose low-risk experiments without asserting unmeasured savings.

**Necessity:** advisory: review guidance only; no code behind it yet.

## When to use
Proposing what to try next.

## Protocol
1. Propose low-risk experiments (batching, caching, algorithm swap) with trade-offs.
2. Each needs a quality bound and a re-measurement plan.
3. Never claim a saving before it is measured.
4. Never auto-deploy.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Experiment list with hypotheses and measurement plan. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
