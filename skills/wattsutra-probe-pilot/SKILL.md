---
name: wattsutra-probe-pilot
description: Audit measurement instruments, collection boundaries, sampling and overhead. Use when checking which instruments exist and what they can legitimately claim.
---

# WattSutra Probe Pilot

**Mission:** Audit measurement instruments, collection boundaries, sampling and overhead.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra doctor`.

## When to use
Checking which instruments exist and what they can legitimately claim.

## Protocol
1. Run `wattsutra doctor`; read the instruments block.
2. Treat "detected-not-used" as present but unread, "unavailable" as absent.
3. State sampling scope, clock and overhead for every instrument used.
4. Never ask for root just to support a demo.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Instrument inventory with scope, privilege need and coverage gaps. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
