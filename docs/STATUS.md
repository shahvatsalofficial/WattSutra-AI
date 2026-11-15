# Implementation status — 0.2.0 (2026-11-11)

| Capability | Truthful status |
|---|---|
| Built-in allowlisted prime-sum benchmark (2 algorithms) | Implemented, tested |
| Wall-clock latency, process CPU time, process RSS, raw samples | Implemented; Node.js process scope |
| Sample statistics (sample stddev, CV, median, p95) | Implemented; p95 indicative at small n |
| Quality parity (same answer) | Implemented; mismatch is gate FAIL |
| Comparison gates PASS/FAIL/REVIEW_REQUIRED/NOT_RUN | Implemented |
| Environment parity check | Implemented |
| Seeded 95% bootstrap interval of speed ratio | Implemented; not a significance test |
| SHA-256 integrity + recomputed-statistics validation | Implemented; not a signature |
| Explicit-input modeling of energy, carbon, cost | Implemented; labelled modeled |
| Meter observation import | Implemented; attribution unverified |
| JSON / Markdown / HTML / CSV reports | Implemented |
| `audit` command (MD, HTML, JSON) | Implemented, 18 checks |
| JSON Schemas (run, comparison, estimate) | Shipped; validated in tests |
| 20 specialist skills (17 core, 3 advisory) | Role instructions; not 20 processes |
| Project-local copy to 5 IDE paths, `--dry-run` | Implemented; IDE activation NOT tested |
| Passive instrument probe in `doctor` | Implemented; reads no sensor |
| Local read-only bearer-token server | Implemented; not production-grade |
| RAPL / NVML / powermetrics / Scaphandre sensor reads | Not implemented (roadmap) |
| Arbitrary workload or live inference benchmarking | Not implemented; needs sandbox |
| SCI conformance, carbon accounting | Not implemented; modeled-sci-like only |
| Cloud billing import, GPU profiling, Kubernetes | Not implemented |
| Signing / attestation | Not implemented |
| Dashboard, multi-user server | Not implemented |
| Cross-IDE activation tests | Not tested |

CI results are in GitHub Actions; observed local results are in `documents/WattSutra-AI/test-results.md`.
