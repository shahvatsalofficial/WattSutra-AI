---
name: wattsutra-regression-watch
description: Compare versioned baselines and flag supported performance regressions. Use when comparing a new run to a stored baseline.
---

# WattSutra Regression Watch

**Mission:** Compare versioned baselines and flag supported performance regressions.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra compare`.

## When to use
Comparing a new run to a stored baseline.

## Protocol
1. Verify both runs first (`verify`).
2. Run `compare`; a gate FAIL exits with code 1 so CI can block.
3. Flag stale baselines: different environment means REVIEW_REQUIRED.
4. Keep original runs immutable.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Regression verdict and the two evidence hashes. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
