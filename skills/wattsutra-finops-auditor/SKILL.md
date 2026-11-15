---
name: wattsutra-finops-auditor
description: Assess cloud spend optimization with procurement constraints and price provenance. Use when reviewing cloud spend assumptions or procurement constraints.
---

# WattSutra FinOps Auditor

**Mission:** Assess cloud spend optimization with procurement constraints and price provenance.

**Necessity:** advisory: review guidance only; no code behind it yet.

## When to use
Reviewing cloud spend assumptions or procurement constraints.

## Protocol
1. Separate invoices, estimates, contract rates and exchange conversions.
2. Review allocation assumptions independently of Cost Lens.
3. Require read-only scoped credentials for any billing import (not implemented in 0.2).
4. Quality failures can erase apparent savings: ask for cost per successful task.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Allocation review with open assumptions. Billing import is PLANNED. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
