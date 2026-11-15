# Technical specification

## Runtime and layout

Node.js 20 or newer, ES modules, standard library only (`node:fs`, `node:path`, `node:os`, `node:crypto`, `node:http`, `node:test`). No build step, no `node_modules` at runtime.

| Path | Purpose |
| --- | --- |
| `packages/core/engine.mjs` | Benchmark, statistics, hashing, validation, compare, estimate, reports |
| `packages/core/audit.mjs` | 18-check self-audit and MD/HTML/JSON writers |
| `packages/core/install.mjs` | Project-local skill installer with dry-run |
| `packages/core/probe.mjs` | Passive instrument probe (file existence only) |
| `packages/cli/index.mjs` | Argument parsing, exit codes |
| `packages/server/index.mjs` | Optional localhost read-only API |
| `skills/`, `agents/` | 20 generated skill and role definitions, `manifest.json` |
| `schemas/` | JSON Schema 2020-12 for run, comparison, estimate |
| `scripts/` | demo, docs builder, test reporter, skill generator, installers |
| `tests/` | `node --test` suites |

## Data model

### Run (`wattsutra.run.v1`)

```text
schema, product, toolVersion, runId, workloadId, manifestHash,
workload{n, variant, functionalUnit, checksum},
environment{platform, arch, node, cpuModel, logicalCores, osRelease, totalMemBytes, loadAvg1m},
methodology{version, warmups, qualityCheck, sampleScope, rssScope, cpuScope, equipment, clock, confidence},
measurements{wallMs, cpuMs, rssBytes}   each {kind:"measured", n, min, max, mean, median, p95, stddev, stddevKind, cv, unit, samples[]},
unmeasured[], energyKWh:null, carbonGCO2e:null, cost:null,
quality{kind, reference{count,sum}, actual{count,sum}}, recordedAt, integrity
```

`runId` = `run-` + first 16 hex of the body hash. `integrity` = SHA-256 of the canonical JSON of everything else.

### Canonical hashing

Keys are sorted by UTF-16 code unit (not `localeCompare`), recursively, then `JSON.stringify`. The hash is therefore identical on every OS, locale and Node version. Test: `canonical hash ignores locale-sensitive ordering`.

### Validation layers

1. `verifyRun`: schema tag present and hash matches (detects edits).
2. `validateRunShape`: workload allowlist, units, `kind === "measured"`, **every statistic recomputed from `samples` and compared exactly**, quality reference equals actual, `energyKWh/carbonGCO2e/cost` must be `null`.
3. `compare` and `estimate` call both before use.

Layer 2 catches a forger who edits a number and recomputes the hash. It does not catch one who rebuilds consistent samples and hash. That needs signatures (roadmap).

## Statistics

| Item | Definition |
| --- | --- |
| mean, min, max, median | Standard |
| p95 | Linear interpolation; indicative only for small n |
| stddev | Sample (n-1), labelled `stddevKind` |
| cv | stddev / mean |
| Bootstrap interval | 2000 resamples of each run's wall samples, ratio of resampled means (baseline/candidate), 2.5th to 97.5th percentile, PRNG mulberry32 seeded `0x57A77` (deterministic) |

The interval is not a hypothesis test. No significance is claimed anywhere.

## Gate logic (order matters)

1. Quality differs: `FAIL`.
2. Environment fields differ: `REVIEW_REQUIRED`.
3. Either run has fewer than 5 wall samples: `REVIEW_REQUIRED`.
4. Interval includes 1: `REVIEW_REQUIRED`.
5. Interval entirely below 1: `FAIL` (regression).
6. Otherwise `PASS`.

Energy, carbon and cost gates are always `NOT_RUN` in `compare`.

## Workload

`prime-sum`, n up to 100000. Variants `trial` (trial division) and `sieve` (Eratosthenes). Both must equal the reference `{count, sum}` before and during measurement. This is an educational fixed workload, not a representative AI inference benchmark.

## Measurement details

| Metric | Source | Scope |
| --- | --- | --- |
| wall ms | `process.hrtime.bigint()` (monotonic) | one call of the workload |
| cpu ms | `process.cpuUsage()` delta, user+system | this process, interval only; not joules |
| rss bytes | `process.memoryUsage().rss` after each sample | whole process, not workload allocation |

## Estimator formulas

- `energyKWh = averagePowerW × (meanWallMs / 3_600_000) / 1000` (modeled).
- `operationalGCO2e = energyKWh × carbonIntensityGPerKWh`.
- `sciLikeGPerUnit = (energyKWh × intensity + embodiedGCO2e) / workUnits`.
- Cost = supplied `ratePerJob` in the supplied currency, unchanged.

## Server

`GET /health` and `GET /reports/<name>.json` only. Binds `127.0.0.1`. Requires `Authorization: Bearer <token>` (24+ chars, timing-safe compare). Rejects symlinks, non-JSON, files over 2 MB, traversal. Headers: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, CSP `default-src 'none'`. Not for public exposure.

## Testing

`node --test tests/*.test.mjs`. Suites: `engine`, `cli`, `server`, `hardening` (schemas, forgery, gates, probe, installer, audit, CLI exit codes). See [observed results](test-results.md). Symlink tests skip where the OS forbids creating symlinks.

## CI

`.github/workflows/ci.yml`: Ubuntu Node 20/22/24, Windows Node 22/24, macOS Node 24. Steps: tests, doctor, demo, audit (artifact upload), docs check, skills check, `npm pack --dry-run`. `release.yml` publishes on a `v*.*.*` tag with npm provenance.

## Extension points (planned)

Instrument adapters (capability negotiation, timeout, cancellation, permission metadata), sandboxed workload runner, billing importers, signing. None exists in 0.2.0; do not document them as working.
