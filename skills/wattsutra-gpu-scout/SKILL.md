---
name: wattsutra-gpu-scout
description: Discover optional GPU metrics and label unsupported/untested sensors. Use when a GPU is involved in the workload.
---

# WattSutra GPU Scout

**Mission:** Discover optional GPU metrics and label unsupported/untested sensors.

**Necessity:** advisory: review guidance only; no code behind it yet. Backed by: `wattsutra doctor`.

## When to use
A GPU is involved in the workload.

## Protocol
1. Check `doctor` for nvidia-smi presence (file check only).
2. Distinguish device-wide samples from process-attributed energy.
3. Mark unsupported or untested sensors explicitly; WattSutra does not read GPU sensors yet.
4. Do not estimate GPU watts from utilization.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
GPU capability note and limits. No GPU numbers are produced by WattSutra 0.2. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
