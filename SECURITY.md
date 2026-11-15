# Security and privacy

## Reporting a vulnerability

Do not open a public issue. Use GitHub private vulnerability reporting: <https://github.com/shahvatsalofficial/WattSutra-AI/security/advisories/new>. This is a volunteer project with no SLA; reports are acknowledged on a best-effort basis.

## What the software does and does not do

- **Offline.** No network access, no telemetry, no API key. The only network listener is the optional `server` command, bound to `127.0.0.1`, read-only, bearer-token protected, JSON files only.
- **Fixed workload.** Benchmarking runs one allowlisted built-in function (`prime-sum`). No arbitrary command, code or model execution exists in 0.2.
- **No child processes** in the shipped CLI. The instrument probe checks file existence only; it never runs a tool and never reads a sensor.
- **File safety.** JSON inputs must be regular files (symlinks refused) up to 4 MiB. The installer refuses symlinked or unsafe directories and never overwrites an edited skill. Output files are written with mode 0600.
- **Integrity, not authenticity.** SHA-256 hashes detect edits. A forger who recomputes samples and hash is not detected. Signing (Sigstore) is roadmap.
- **Reports contain environment details** (CPU model, OS release, core count, memory). Review before publishing.

## Threat model

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md). Open items before any hosted or multi-tenant use: sandboxed execution of user workloads, quotas, RBAC, signed requests, audit logs, key lifecycle.

## Supported versions

Only the latest published minor version receives fixes.
