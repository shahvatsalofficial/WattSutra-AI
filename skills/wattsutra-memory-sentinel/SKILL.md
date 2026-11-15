---
name: wattsutra-memory-sentinel
description: Detect peak RSS, heap use and memory attribution limitations. Use when reading RSS or memory behavior.
---

# WattSutra Memory Sentinel

**Mission:** Detect peak RSS, heap use and memory attribution limitations.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra bench`.

## When to use
Reading RSS or memory behavior.

## Protocol
1. RSS is whole-process resident bytes at sample time.
2. It is not per-function allocation and not peak unless sampled as peak.
3. Report heap vs RSS separately when both exist.
4. Flag growth across samples as a leak suspicion, not a finding.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Memory summary with scope labels. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
