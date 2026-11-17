# WattSutra AI

> **Measure what runs. Model what you know. Never invent savings.**

[![CI](https://github.com/shahvatsalofficial/WattSutra-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/WattSutra-AI/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Node >=22](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![Dependencies: 0](https://img.shields.io/badge/runtime%20dependencies-0-success)

WattSutra AI is an **offline, deterministic performance-evidence CLI** with **20 portable AI-agent skills** for Claude Code, Cursor, Codex, Gemini CLI and GitHub Copilot. It benchmarks a workload, proves the answer stayed correct, compares a baseline and a candidate with fairness gates, and writes **JSON, Markdown and HTML** reports in which every number is labelled **measured**, **imported**, **modeled** or **not measured**.

Its one rule: **CPU time is not energy.** WattSutra never turns wall time, CPU time or memory into watts, kWh, CO2e or money. Those fields stay empty until you import a real meter reading or supply explicit model inputs, and then they are labelled as such. No API key, no account, no network, zero runtime dependencies. Created by [Vatsal Shah](https://github.com/shahvatsalofficial). Apache-2.0.

## 60-second demo

```bash
npx wattsutra audit --out wattsutra-audit
```

or from a clone:

```bash
git clone https://github.com/shahvatsalofficial/WattSutra-AI.git
cd WattSutra-AI
node packages/cli/index.mjs audit --out artifacts/audit
```

Open `artifacts/audit/audit.html`. Expected output (timings vary by machine):

```text
audit completed: artifacts/audit (audit.json, audit.md, audit.html)
Verdict: PASS (17/18 verified, 0 failed, 1 not-run)
```

The one `not-run` check is the hardware energy instrument. That is correct: no meter is read in 0.2.

Real generated reports: [audit HTML](documents/WattSutra-AI/evidence/samples/audit.html) · [audit Markdown](documents/WattSutra-AI/evidence/samples/audit.md) · [measured run HTML](documents/WattSutra-AI/evidence/samples/measurement.html).

## Why it exists

Energy tools measure watts. Profilers measure time. Cost tools measure bills. Teams then publish "40% greener" from a stopwatch. WattSutra is the layer that refuses that leap: it keeps measured, imported, modeled and unknown values apart, rejects comparisons that are not like-for-like, and says `REVIEW_REQUIRED` when the evidence is thin.

## Evidence kinds

| Kind | Meaning | Example in 0.2 |
| --- | --- | --- |
| `measured` | Directly instrumented in this process | wall time, process CPU time, process RSS |
| `imported-meter-observation` | A reading you supply from a named meter; attribution unverified | `measuredEnergyKWh` + `energySource` |
| `modeled` | Computed from your stated assumptions | energy = your average watts × measured hours |
| `modeled-sci-like` | SCI-shaped formula, **not** a conformance claim | needs energy, intensity, embodied, units |
| `not-run` / `unknown` | No data. Stays empty | energy, carbon, cost without inputs |

## Commands

```bash
wattsutra audit    [--out dir]                                  # self-audit: audit.json, audit.md, audit.html
wattsutra bench    --manifest fixtures/baseline.json --out run.json
wattsutra verify   --input run.json                              # integrity + sample statistics recomputed
wattsutra compare  --baseline a.json --candidate b.json [--out cmp.json]
wattsutra estimate --run run.json --assumptions fixtures/assumptions.json [--out est.json]
wattsutra report   --run run.json --format md|html|csv|json [--out file]
wattsutra install  --target ./my-project --ide claude|cursor|codex|gemini|copilot|all [--dry-run]
wattsutra doctor | agents | --version
WATTSUTRA_TOKEN=<24+ random chars> wattsutra server --dir reports --port 8787   # localhost, read-only
```

Exit codes: `0` ok, `1` gate `FAIL` or verification failed, `2` usage or validation error. Use `compare` in CI to block regressions.

## Comparison gates

`compare` returns a gate per scope:

| Gate | When |
| --- | --- |
| `FAIL` | Results differ (quality mismatch), or candidate is slower beyond the 95% interval |
| `REVIEW_REQUIRED` | Different environment, fewer than 5 samples, or interval includes "no change" |
| `PASS` | Same quality, same environment, enough samples, interval excludes "no change" |
| `NOT_RUN` | Energy, carbon, cost: no meter or model given |

The interval is a seeded percentile bootstrap of median(baseline)/median(candidate): reproducible, but not a significance test.

## Proof, not promises

- **Tests:** [observed results](documents/WattSutra-AI/test-results.md), machine-written by `npm run test:report`. Windows hosts without symlink privilege skip 2 symlink tests; Linux and macOS CI run them.
- **Self-audit:** 18 checks run live on every CI job and upload the report as an artifact. [Method and limits](documents/WattSutra-AI/07-independent-audit.md).
- **Tamper tests:** edited reports fail; so do forged reports with a recomputed hash, because every statistic is recomputed from the raw samples and any energy/carbon/cost value is refused.
- **Honest scope:** the audit is a self-audit by the tool. It is reproducible evidence, not a third-party certificate.

## Honest limits

- **No sensor is read in 0.2.** RAPL, NVML, powermetrics, Scaphandre and Kepler are listed as roadmap. `doctor` only reports whether a candidate instrument exists (`detected-not-used`).
- The built-in workload is a fixed educational function (`prime-sum`, two algorithms). Arbitrary code and live inference benchmarks are **planned, not shipped**.
- A hash proves a file was not edited afterwards. It does not prove the numbers were honest. Signing is roadmap.
- Process RSS is whole-process memory, not per-workload allocation.
- Skills are copied into IDE folders. Live activation in each IDE has **not** been verified.
- Carbon uses only the intensity you supply. No regional defaults. No SCI conformance is claimed.

## The 20 skills

`wattsutra-prime` orchestrates. 17 are **core** (backed by tested CLI behaviour) and 3 are **advisory** (guidance only: `gpu-scout`, `finops-auditor`, `optimization-planner`). Full table: [docs/AGENT_CATALOG.md](docs/AGENT_CATALOG.md). Install into a project:

```bash
npx wattsutra install --target . --ide claude --dry-run
npx wattsutra install --target . --ide claude
```

## Documentation

Live site: <https://shahvatsalofficial.github.io/WattSutra-AI/>. Markdown and responsive HTML in [`documents/WattSutra-AI/`](documents/WattSutra-AI/README.md): executive summary, functional spec, technical spec, architecture, user guide, security and legal, independent audit, observed test results.

## Security and legal

Report vulnerabilities privately ([SECURITY.md](SECURITY.md)). Licensed Apache-2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)). No warranty. Third-party tool and standard names belong to their owners; no affiliation or endorsement is claimed. Trademark clearance for the name has not been performed.

## Related projects by the same author

ArchSutra AI, VigilSutra AI, RachnaSutra AI, PramanaSutra AI, EvalSutra AI, ProtocolSutra AI, ContextSutra AI, DocSutra AI and MigraSutra AI. Each is independently useful.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run `npm test`, `npm run check:docs` and `npm run check:skills` before a pull request.

<!-- keywords: benchmark honesty, energy vs CPU time, green software, SCI methodology, carbon estimate, FinOps evidence, performance regression gate, Claude Code skills, Cursor skills, Codex skills, offline CLI, measurement provenance -->
