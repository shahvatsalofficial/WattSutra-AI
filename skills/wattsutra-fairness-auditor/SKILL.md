---
name: wattsutra-fairness-auditor
description: Audit workload parity, environment parity, confounders and benchmark comparability. Use when checking whether two runs are comparable.
---

# WattSutra Fairness Auditor

**Mission:** Audit workload parity, environment parity, confounders and benchmark comparability.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra compare`.

## When to use
Checking whether two runs are comparable.

## Protocol
1. Workload ID, n, functional unit and scope must match or compare refuses.
2. Check environmentParity: platform, arch, Node, CPU, cores.
3. A mismatch downgrades the gate to REVIEW_REQUIRED (exploratory).
4. List confounders: background load, thermal state, run order.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Parity table and confounder list. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
