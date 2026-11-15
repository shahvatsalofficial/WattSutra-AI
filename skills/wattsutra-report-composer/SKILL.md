---
name: wattsutra-report-composer
description: Publish accessible, source-linked JSON/Markdown/HTML reports and caveats. Use when producing a shareable report.
---

# WattSutra Report Composer

**Mission:** Publish accessible, source-linked JSON/Markdown/HTML reports and caveats.

**Necessity:** core: backed by deterministic code and tests. Backed by: `wattsutra report`, `wattsutra audit`.

## When to use
Producing a shareable report.

## Protocol
1. Use `wattsutra report --format md|html|csv|json` or `audit`.
2. Every metric shows its kind; unmeasured fields say "not measured".
3. Include caveats, missing evidence and the reproduce command.
4. No sensational percentages or extrapolated electricity.

## Evidence taxonomy
`measured` (direct instrument) · `imported-meter-observation` (user-supplied reading, attribution unverified) · `modeled` (assumptions) · `inferred` · `not-run` · `missing` · `unsupported`.

## Output
Markdown and HTML report with caveats. Attach evidence hashes (`integrity`, `runId`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
