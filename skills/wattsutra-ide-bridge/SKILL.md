---
name: wattsutra-ide-bridge
description: Map portable SKILL.md contracts to supported hosts and document actual verification. Use when installing skills into an IDE project.
---

# WattSutra IDE Bridge

**Mission:** Map portable SKILL.md contracts to supported hosts and document actual verification.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra install`.

## When to use
Installing skills into an IDE project.

## Protocol
1. Use `wattsutra install --target <dir> --ide <host> --dry-run` first.
2. Installer refuses symlinks and never overwrites edited skills.
3. Copying a skill is not proof the host activates it; say "installed, activation untested".
4. Fall back to AGENTS.md when a host lacks skill discovery.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Dry-run plan, then install result and honest activation status. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
