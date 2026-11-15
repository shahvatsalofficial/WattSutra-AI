---
name: wattsutra-privacy-guard
description: Redact credentials and prohibit unauthorized telemetry exports. Use when before sharing reports or enabling any integration.
---

# WattSutra Privacy Guard

**Mission:** Redact credentials and prohibit unauthorized telemetry exports.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra audit`.

## When to use
Before sharing reports or enabling any integration.

## Protocol
1. Reports hold hashes and environment info, never prompts or secrets.
2. The audit secret scan must be clean.
3. No network call or telemetry without explicit opt-in.
4. Redact hostnames or paths if the user asks.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Privacy checklist result and redactions. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
