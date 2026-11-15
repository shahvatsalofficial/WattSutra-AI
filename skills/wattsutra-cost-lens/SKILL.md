---
name: wattsutra-cost-lens
description: Track independently supplied price assumptions, currency and billing evidence. Use when attaching a price to a job.
---

# WattSutra Cost Lens

**Mission:** Track independently supplied price assumptions, currency and billing evidence.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra estimate`.

## When to use
Attaching a price to a job.

## Protocol
1. Require rate, 3-letter currency, unit and effective date from the user.
2. Output is modeled cost per job, never billing.
3. Separate input, cached, output tokens and retries for inference.
4. Never invent prices or taxes.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Modeled cost with price provenance. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
