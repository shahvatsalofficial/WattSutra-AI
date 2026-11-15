# WattSutra Architecture

## Enterprise level
Users: AI developers, FinOps teams, sustainable software advocates and infra operators. No cost, electricity or environmental claim without provenance.

## System level
Offline CLI + deterministic benchmark kernel; optional server and future plugin connectors. Default trust boundary excludes arbitrary shell, network and cloud credentials.

## Component level
`packages/core/engine.mjs`: bounded workload, time/CPU/RSS recorder, semantic comparability, assumptions-based estimator and reporting. `packages/core/install.mjs`: safe local skills installer. `packages/cli/index.mjs`: argument parsing and artifacts. `packages/server/index.mjs`: localhost read-only bearer server.

## Data level
`wattsutra.run.v1`: workload identity/functional unit, quality checksum, environment, measurement boundary and repeat samples with SHA-256 integrity. `wattsutra.comparison.v1`: ratios plus quality comparability. `wattsutra.estimate.v1`: explicit assumptions, imported meter observations, modeled outputs and unknowns. Hashes only establish accidental/tampering detection when independently trusted; not signed attestations.

## Evidence taxonomy
- `measured`: instrument from the bounded Node process (elapsed time / CPU microseconds / process-wide RSS).
- `imported-meter-observation`: user-provided sensor reading with stated source; verification/attribution not established.
- `modeled`: a transformation of explicit wattage, price or emissions assumptions.
- `unknown`: required input missing.
- `not-run`: stage or connector was not invoked.

## Operational and security levels
Explicit target/output paths, restricted in-process workload, safe report read; no automatic cloud or public server access. Server is not an authorization substrate for production. Future hosted runners need RBAC, isolation, rate limits, quotas, verified sensor access, TLS and auditable approvals.

## Risks
Benchmark contamination and JIT effects; process-wide RSS; single-CPU-only algorithm; OS timer variation; average wattage assumption has undefined attribution until user supplies sensor boundary; no quality-of-output inference assessment; hidden resource utilization on shared hardware.
