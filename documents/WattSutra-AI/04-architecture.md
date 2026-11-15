# Architecture

## Design pillars

1. Measurement honesty: every value carries a kind.
2. Comparability: refuse or downgrade unfair comparisons.
3. Offline first: no network, no key, no account.
4. Provenance: hashes, run IDs, raw samples.
5. Human control: nothing installs, spends or deploys by itself.
6. Portable skills: plain `SKILL.md` for any host.
7. Small trusted core: standard library only.

## System context

```text
User / CI / IDE agent
        |
        v
  wattsutra CLI  ---->  core engine  ---->  reports (JSON / MD / HTML / CSV)
        |                  |  ^
        |                  |  +-- fixtures, manifests (user files, read-only)
        |                  v
        |             audit module  ---->  audit.json / audit.md / audit.html
        |
        +--> install  ---->  .claude/ .cursor/ .agents/ .gemini/ .github/ skills (project-local copies)
        +--> server   ---->  127.0.0.1, bearer token, read-only JSON
```

Dependencies point inward. The core never imports the CLI, server or any vendor SDK.

## Components

| Component | Responsibility | Trust |
| --- | --- | --- |
| Workload (`primes`) | Fixed allowlisted computation | Trusted code, untrusted parameters (bounded) |
| Recorder (`benchmark`) | Warmup, sampling, environment capture | Trusted |
| Validator (`verifyRun`, `validateRunShape`) | Integrity and consistency | Trusted; treats files as hostile |
| Comparator (`compare`) | Parity, quality, gates, interval | Trusted |
| Estimator (`estimate`) | Explicit-input modeling | Trusted; refuses defaults |
| Reporter | Escaped, labelled output | Trusted |
| Auditor (`runAudit`) | Re-proves invariants live | Trusted |
| Installer | Project-local skill copy | Trusted; refuses unsafe paths |
| Probe | File-existence instrument scan | Trusted; executes nothing |
| Server | Read-only localhost API | Hardened but not production |
| Skills | Instructions for AI hosts | Advisory text |

## Agent model

Twenty roles are **instructions**, not processes. The Chief Orchestrator (`wattsutra-prime`) sequences them: scope, comparability (Workload Architect, Fairness Auditor), privacy check, collection (Probe Pilot and instrument roles), quality gate, variance review, bounded modeling (Carbon, Cost), evidence check (Ledger), then report. Evidence and privacy roles may block a claim. The sequence is deterministic and works without any multi-agent runtime.

17 roles are **core** because tested CLI behaviour backs them; 3 are **advisory** (GPU scout, FinOps auditor, optimization planner) because no code backs them yet. The distinction is recorded in `agents/manifest.json` and `docs/AGENT_CATALOG.md`, generated from one table by `scripts/gen-skills.mjs` so files cannot drift (`npm run check:skills`).

## Data flow for a fair comparison

```text
manifest.json --bench--> run A (samples, hash)   manifest.json --bench--> run B
        run A, run B --verify--> shape + hash OK
        --compare--> quality equal? env equal? n>=5? interval excludes 1?
        --> gates {latency, energy NOT_RUN, carbon NOT_RUN, cost NOT_RUN}
        assumptions.json --estimate--> modeled energy/carbon/cost (labelled)
        --report/audit--> JSON + Markdown + HTML
```

## Trust boundaries

| Boundary | Control |
| --- | --- |
| User file into engine | size cap 4 MiB, regular file only, symlink refused, JSON parse errors surfaced |
| Manifest into workload | allowlist of workload and variant, numeric bounds |
| Engine into disk | explicit paths, mode 0600, parent dirs created |
| Network into server | loopback bind, bearer token, GET only, fixed path pattern |
| Skills into IDE project | project-local only, no overwrite of edits, no symlinks |
| Report into browser | HTML escaping and CSP meta |

## Key decisions (ADR summary)

| # | Decision | Reason | Cost |
| --- | --- | --- | --- |
| 1 | No energy value without a meter or explicit model | Core honesty rule | Reports look sparse |
| 2 | Zero runtime dependencies | Supply-chain and audit simplicity | Hand-written stats and validators |
| 3 | Store raw samples in the run | Allows recomputation and bootstrap | Larger files (max 60 samples per metric) |
| 4 | Bootstrap interval, not p-values | Few assumptions, deterministic with seed | Not a significance test |
| 5 | Gate `REVIEW_REQUIRED` as the default for weak evidence | Missing data must not pass | More manual review |
| 6 | Skills generated from one table | No drift between skills, agents, manifest | Edit the generator, not the files |
| 7 | Passive probe, no execution | No privilege, no side effects | Cannot confirm a tool works |
| 8 | Fixed workload in 0.2 | Safe without a sandbox | Not representative of real AI workloads |

## Future architecture (not built)

Instrument adapter interface, sandboxed runner (container, no network, CPU/memory/time caps), billing and trace importers, Sigstore signing, authenticated multi-tenant service, accessible dashboard. Each needs its own threat model update first; see [security and legal](06-security-privacy-legal.md).
