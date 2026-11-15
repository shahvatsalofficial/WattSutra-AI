# Reports and data contracts

Run: schema `wattsutra.run.v1`, repeated timing/CPU/RSS statistical summaries, environment, quality checksum and integrity. Comparison: `wattsutra.comparison.v1` compares only matching work units and scopes. Estimate: `wattsutra.estimate.v1` models optional user-supplied power, energy, emissions factor, cost and SCI-like values; missing inputs must remain unknown.

Do not export raw prompts or secrets. JSON outputs are intended for automation; Markdown/HTML/CSV provide readable information; HTML escapes arbitrary text. APIs and external telemetry bindings are not yet implemented. Draft formal JSON schemas in `schemas/`, then add AJV validation in P1 with negative tests.
