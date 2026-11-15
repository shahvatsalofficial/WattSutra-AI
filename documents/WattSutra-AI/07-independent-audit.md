# Independent-style audit and evidence

> **Read this first.** This audit was produced by the tool's own author and by the tool itself. It is reproducible evidence, **not a third-party certificate**. The way to make it independent is to run it yourself and read the source. Every result below can be regenerated with one command.

## How to reproduce

```bash
npx wattsutra audit --out my-audit
npm test
npm run test:report
```

Compare your `my-audit/audit.md` with [the committed sample](evidence/samples/audit.md). Statuses should match; timings will differ.

## Method

1. **Adversarial inputs.** The audit mutates real runs (edited mean, injected `energyKWh`, forged re-hash, different CPU, different answer, tiny samples) and requires the tool to refuse or downgrade.
2. **Claim hygiene.** It checks that no measured run holds energy, carbon or cost values, and that the estimator invents no rates.
3. **Repository checks.** 20 skills with valid frontmatter, manifest agreement, secret regex scan, installer overwrite protection.
4. **Statistics disclosure.** It prints sample size, variation and the bootstrap interval of the live run.
5. **Scope statement.** Energy, carbon and cost gates are reported `NOT_RUN`, never silently passed.

Severity scale: info, low, medium, high, critical. Status: verified, failed, unknown, not-run. Missing data produces `unknown` or `not-run`, never `verified`.

## Results (sample run, Node 24, Windows x64)

Source: [`evidence/samples/audit.json`](evidence/samples/audit.json). Totals: **18 checks, 17 verified, 0 failed, 0 unknown, 1 not-run**. Verdict **PASS** (scoped).

| ID | What was attacked | Result |
| --- | --- | --- |
| A01 | Benchmarks verify; both algorithms give the same prime count and sum | verified |
| A02 | Edited mean without re-hash | refused (integrity) |
| A03 | Edited mean **with** recomputed hash | refused (statistics do not match raw samples) |
| A04 | Run carrying `energyKWh=0.5` | refused |
| A05 | `n=20000` vs `n=3000` | refused as incomparable |
| A06 | Candidate with a different answer | gate `FAIL` |
| A07 | Candidate from a different CPU | gate `REVIEW_REQUIRED` |
| A08 | Two samples per run | gate `REVIEW_REQUIRED` |
| A09 | Empty assumptions | all three outputs `unknown`, no defaults |
| A10 | Typo key; both energy inputs | refused |
| A11 | Modeled vs imported labels | correct kinds, `attributionUnverified: true` |
| A12 | `<script>` in a report field | escaped, CSP present |
| A13 | Key order and locale | same hash |
| A14 | Skills and manifest | 20 skills consistent |
| A15 | Secret scan | no matches |
| A16 | Second install over an edited skill | refused |
| A17 | Hardware energy instrument | **not-run** (no sensor is read in 0.2) |
| A18 | Statistical confidence | see below |

### Live sample numbers (from that run)

| Item | Value |
| --- | --- |
| Baseline `trial`, n=20000, 5 samples | mean 1.629 ms |
| Candidate `sieve`, n=20000, 5 samples | mean 0.254 ms |
| Ratio (baseline / candidate) | 6.42x |
| 95% bootstrap interval of ratio | 3.09 to 14.05 |
| Baseline coefficient of variation | 18.9% |
| Latency gate | PASS |
| Energy, carbon, cost gates | NOT_RUN |

Reading this honestly: the interval is wide because there are only 5 short samples on a shared laptop and the CV is high. The result supports "sieve is clearly faster than trial division for this n on this machine". It supports **nothing** about energy.

### Modeled estimate in the same run

With the fabricated fixture inputs (65 W, 380 gCO2e/kWh, 0.002 USD/job) the tool printed energy 4.58e-9 kWh, 1.74e-6 gCO2e, cost 0.002 USD/job, each labelled `modeled`. These illustrate formatting only; they are not measurements.

## Test evidence

[Observed test results](test-results.md) are machine-written by running the real suite. The count, pass, fail and skip numbers there are produced by `scripts/test-report.mjs`, not typed by hand. CI runs the suite on Ubuntu (Node 20, 22, 24), Windows (22, 24) and macOS (24); see the Actions tab for the live status.

## What this audit cannot show (open limits)

| Limit | Why it matters |
| --- | --- |
| Self-authored | Same author wrote tool and checks; a blind spot in one is a blind spot in both |
| Forgery by full regeneration | Hashes are not signatures |
| No hardware validation | No power meter was used; no sensor accuracy is claimed |
| Single fixed workload | Results do not generalise to real inference workloads |
| Small samples | Intervals are wide; bootstrap is not a significance test |
| Host variability | Laptop thermals, background load and CPU frequency scaling were not controlled |
| IDE activation unverified | Skill files are copied; no host was observed using them |
| Name not cleared | No trademark search |

## Findings log

| Finding | Severity | Status |
| --- | --- | --- |
| Original `stddev` was population deviation, unlabelled | low | fixed: sample (n-1), labelled |
| Hash key sort used `localeCompare` (locale-dependent) | medium | fixed: code-unit order |
| `compare` accepted mismatched environments silently | high | fixed: parity check, `REVIEW_REQUIRED` |
| `compare` had no gate or uncertainty | high | fixed: gates plus bootstrap interval |
| Re-hashed forged runs passed `verify` | high | fixed: statistics recomputed from raw samples |
| Estimator ignored unknown keys | medium | fixed: refused |
| Skills were 20 near-identical templates | medium | fixed: role-specific, necessity-tagged |
| HTML report was a `<pre>` dump | low | fixed: accessible report with CSP |
| `doctor` said "not probed" | low | fixed: passive probe |
| No energy sensor support | info | open, roadmap |
| No signing | medium | open, roadmap |
| Server single shared token | low | open, localhost only |

## Reviewer checklist

- [ ] Ran `npx wattsutra audit` and compared with the sample
- [ ] Read `packages/core/engine.mjs` (about 300 lines)
- [ ] Confirmed `package.json` has no `dependencies`
- [ ] Confirmed no network use: `grep -rn "fetch\|http\.request\|net\." packages` finds only the server
- [ ] Read the open limits above
