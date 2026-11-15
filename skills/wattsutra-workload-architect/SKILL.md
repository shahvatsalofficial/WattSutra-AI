---
name: wattsutra-workload-architect
description: Define comparable functional units, exact dataset, quality checks and repeatable workloads. Use when defining or reviewing a benchmark manifest or functional unit.
---

# WattSutra Workload Architect

**Mission:** Define comparable functional units, exact dataset, quality checks and repeatable workloads.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra bench`.

## When to use
Defining or reviewing a benchmark manifest or functional unit.

## Protocol
1. State the functional unit (one complete job) and the input size.
2. Require a deterministic correctness check shared by baseline and candidate.
3. Pin warmups and sample count; reject manifests outside the allowlist.
4. Never propose running arbitrary user code without a sandbox and explicit approval.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Manifest JSON, functional unit, quality check, limits. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
