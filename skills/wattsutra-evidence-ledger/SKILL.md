---
name: wattsutra-evidence-ledger
description: Create hashed, reproducible measurements and provenance references. Use when checking provenance or tamper evidence.
---

# WattSutra Evidence Ledger

**Mission:** Create hashed, reproducible measurements and provenance references.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra verify`, `wattsutra audit`.

## When to use
Checking provenance or tamper evidence.

## Protocol
1. Run `wattsutra verify --input run.json`.
2. Integrity hash detects edits; shape check recomputes stats from raw samples.
3. A hash is not a signature: a forger who recomputes everything is not detected.
4. Record runId, integrity, manifestHash for every claim.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Provenance table and tamper verdict. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
