---
name: wattsutra-quality-gate
description: Ensure baseline and candidate satisfy identical correctness/quality criteria. Use when deciding whether a candidate is equivalent to a baseline.
---

# WattSutra Quality Gate

**Mission:** Ensure baseline and candidate satisfy identical correctness/quality criteria.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra compare`, `wattsutra verify`.

## When to use
Deciding whether a candidate is equivalent to a baseline.

## Protocol
1. Check quality.actual equals the baseline result (count and sum).
2. Mismatch means gate FAIL, regardless of speed.
3. A quality check must be deterministic and shared.
4. Completion rate is not correctness.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Quality verdict with the compared values. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
