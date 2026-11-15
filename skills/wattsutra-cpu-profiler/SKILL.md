---
name: wattsutra-cpu-profiler
description: Inspect CPU time, utilization semantics, scheduling interference and attribution caveats. Use when reading process CPU time or utilization.
---

# WattSutra CPU Profiler

**Mission:** Inspect CPU time, utilization semantics, scheduling interference and attribution caveats.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra bench`.

## When to use
Reading process CPU time or utilization.

## Protocol
1. CPU ms is process cpuUsage (user+system), not joules.
2. Check scheduling interference: other load, throttling, shared cores.
3. Compare CPU ms with wall ms to spot waiting vs computing.
4. Refuse to convert CPU time into watts or CO2e.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
CPU interpretation with attribution caveats. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
