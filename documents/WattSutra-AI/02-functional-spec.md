# Functional specification

## Feature map

| ID | Feature | Status in 0.2.0 |
| --- | --- | --- |
| AI-012-F01 | Benchmark recorder: elapsed time, process CPU, process RSS, sample count, scope, environment | Implemented |
| AI-012-F02 | Baseline comparator: matching workload and unit enforced, measured difference | Implemented with gates and bootstrap interval |
| AI-012-F03 | Cost estimator: supplied rate only, absent price stays unknown | Implemented |
| AI-012-F04 | Energy method: measured vs modeled, no watt-hours from CPU time | Implemented |
| AI-012-F05 | Optimization experiment planning and tracking | Partly: skill guidance only, no automation |
| AI-012-F06 | Metric export JSON / Markdown / HTML / CSV | Implemented |

## Evidence kinds

| Kind | Where it appears | Rule |
| --- | --- | --- |
| `measured` | `measurements.*` in a run | Direct observation by this process |
| `imported-meter-observation` | `observed.importedEnergyKWh` | Needs `energySource` of 8+ characters; `attributionUnverified: true` |
| `modeled` | `estimated.*` | Only from user-supplied numbers; formula is printed |
| `modeled-sci-like` | `estimated.sciLikeGPerUnit` | Needs energy, intensity, embodied and work units; **not** a conformance claim |
| `not-run` / unknown | `gates.*`, `unknown[]` | Stays empty |

## Commands

### `bench`
Input: manifest `{workload:"prime-sum", variant:"trial"|"sieve", n:2..100000, samples:2..60, warmups:0..10}`. Runs the reference algorithm, then the chosen one, checks identical prime count and sum, performs warmups, records `samples` timed runs. Output: a run with raw samples, summary statistics, environment, `runId`, `manifestHash`, `integrity`.

### `verify`
Re-hashes the file (detects edits) and recomputes every statistic from the raw samples; refuses a run holding any energy, carbon or cost value; checks quality reference equals actual. Exit 0 pass, 1 fail.

### `compare`
Refuses runs with different workload, `n`, functional unit or scope (exit 2). Otherwise returns gates:

| Gate | Condition |
| --- | --- |
| `FAIL` | Quality differs, or candidate slower and the 95% interval lies fully below 1 |
| `REVIEW_REQUIRED` | Platform, arch, Node, CPU model or core count differ; fewer than 5 samples in either run; interval includes 1 |
| `PASS` | Quality equal, environment equal, 5+ samples each, interval fully above 1 |
| `NOT_RUN` | Always for energy, carbon, cost in `compare` |

Exit 1 when the latency gate is `FAIL`.

### `estimate`
Allowed keys: `averagePowerW`, `measuredEnergyKWh`, `energySource`, `carbonIntensityGPerKWh`, `ratePerJob`, `currency`, `embodiedGCO2e`, `workUnits`. Unknown keys, both energy inputs together, bad currency, negative or non-finite numbers are refused. Missing inputs go to `unknown[]`.

### `report`
`--format md|html|csv|json`. HTML is accessible (landmarks, dark mode, print styles) with a strict Content-Security-Policy and escaped fields. Unmeasured fields read "not measured".

### `audit`
Runs 18 checks against live runs and the repository, writes `audit.json`, `audit.md`, `audit.html`. Verdict `PASS`, `REVIEW_REQUIRED` or `FAIL` (exit 1). Scope is evidence integrity and claim hygiene; energy, carbon, cost are `NOT_RUN`.

### `install`
Copies skills into `.claude/skills`, `.cursor/skills`, `.agents/skills`, `.gemini/skills`, `.github/skills` of an **existing** target. `--dry-run` shows the plan. Refuses symlinks, refuses to overwrite an edited skill, idempotent.

### `doctor`, `agents`, `--version`, `server`
`doctor` reports Node, platform and a passive instrument probe. `agents` prints the manifest. `server` serves JSON files read-only on `127.0.0.1` with a bearer token.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | Gate `FAIL`, verification failed, or audit `FAIL` |
| 2 | Usage or validation error, incomparable workloads |

## Acceptance criteria and where they are tested

| Criterion | Test |
| --- | --- |
| Repeats show count and dispersion | `sample counts`, `stddev is the sample standard deviation` |
| Measured and estimated cannot be confused | `cost remains modeled`, `imported metered observation labeled`, audit A11 |
| No sensor means no measured energy | `measured timing only`, `probe ... no measured energy` |
| Baseline and candidate equivalence enforced | `mismatched workload refused`, `compare: quality mismatch is FAIL` |

## Non-goals (explicit)

Running arbitrary code, calling model APIs, reading billing accounts, reading GPU or CPU power counters, certifying SCI, uploading anything. Each is roadmap and needs its own design review.
