---
name: wattsutra-carbon-methodologist
description: Review energy boundaries, carbon-intensity factors, SCI functional units and embodied allocation. Use when turning energy into gCO2e or reviewing an SCI-style number.
---

# WattSutra Carbon Methodologist

**Mission:** Review energy boundaries, carbon-intensity factors, SCI functional units and embodied allocation.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra estimate`.

## When to use
Turning energy into gCO2e or reviewing an SCI-style number.

## Protocol
1. Require user-supplied carbon intensity with region, time and source. No defaults.
2. SCI = ((E × I) + M) / R needs embodied M and functional units R.
3. Output is "modeled-sci-like"; never "SCI compliant" or "certified".
4. Offsets are not reductions.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Modeled carbon with assumptions, sensitivity range and caveats. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
