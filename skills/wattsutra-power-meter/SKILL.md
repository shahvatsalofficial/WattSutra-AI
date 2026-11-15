---
name: wattsutra-power-meter
description: Verify actual hardware meter inputs and distinguish measured from modeled energy. Use when a real meter reading (wall meter, RAPL export, smart plug) is available.
---

# WattSutra Power Meter

**Mission:** Verify actual hardware meter inputs and distinguish measured from modeled energy.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra estimate`.

## When to use
A real meter reading (wall meter, RAPL export, smart plug) is available.

## Protocol
1. Require a named independent source (8+ chars) with the reading.
2. Import via `estimate` as measuredEnergyKWh: labelled imported-meter-observation, attribution unverified.
3. Check boundary: wall outlet vs CPU package differ materially.
4. Never present modeled power as a meter reading.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Imported observation with source, boundary and unverified-attribution flag. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
