# WattSutra AI — Independent self-audit

Verdict: **PASS** · WattSutra 0.2.0 · Node v24.15.0 · win32/x64 · 2026-11-15T18:56:56.903Z

Scope: Evidence integrity, claim hygiene, comparison fairness and packaging. Energy, carbon and cost gates are NOT_RUN: no hardware meter was used.

| Checks | Verified | Failed | Unknown | Not run |
| --- | --- | --- | --- | --- |
| 18 | 17 | 0 | 0 | 1 |

## Live sample (generated during this audit)

Baseline `trial` mean 0.527 ms vs candidate `sieve` mean 0.076 ms. Ratio 6.96x, 95% bootstrap interval [6.50, 7.93]. Latency gate **PASS**; energy, carbon, cost gates NOT_RUN.

These timings come from the machine that ran the audit. They are not a benchmark of your hardware and not an energy claim.

## Findings

| ID | Check | Status | Severity | Evidence |
| --- | --- | --- | --- | --- |
| A01 | Benchmark runs verify and keep quality parity | verified | info | baseline c096034d731bdae65dc75480c1e4f4dd417df2f59d5812e8ce7fd344ea5f83da candidate b9c580c612990ad1a14b7ba8adefa598328e608c28e71018b6a6a88a079e8de7; prime count 2262, sum 21171191 |
| A02 | Edited reports are rejected (integrity hash) | verified | info | mutated wallMs.mean; verifyRun threw integrity mismatch |
| A03 | Internally inconsistent reports are rejected even with a recomputed hash | verified | info | mean edited, hash recomputed; validateRunShape recomputed stats from samples and refused |
| A04 | Measured runs contain no energy, carbon or cost values | verified | info | energyKWh/carbonGCO2e/cost are null; injected energyKWh=0.5 was refused |
| A05 | Incomparable workloads are refused | verified | info | n=20000 vs n=3000 refused |
| A06 | Quality mismatch yields a FAIL gate | verified | info | gate=FAIL |
| A07 | Environment mismatch downgrades the gate to REVIEW_REQUIRED | verified | info | mismatched: cpuModel |
| A08 | Too few samples never earns PASS | verified | info | n=2 per run, gate=REVIEW_REQUIRED |
| A09 | Estimator applies no default rates | verified | info | unknown: energyKWh, operationalGCO2e, cost |
| A10 | Estimator rejects unknown fields and ambiguous energy input | verified | info | typo key and dual energy inputs refused |
| A11 | Modeled and imported values are labelled | verified | info | kinds: modeled, imported-meter-observation (attributionUnverified=true) |
| A12 | HTML report escapes hostile content | verified | info | payload escaped; CSP meta present: true |
| A13 | Hashing is deterministic regardless of key order | verified | info | canonical JSON, code-unit key order |
| A14 | Skills and agent manifest are consistent | verified | info | 20 skills, 20 manifest entries |
| A15 | No credentials in shipped files | verified | info | regex scan for GitHub, npm, AWS, OpenAI-style keys and private keys: no matches |
| A16 | Installer refuses to overwrite customised skills | verified | info | second install refused to clobber edited SKILL.md |
| A17 | Hardware energy instrument | not-run | info | RAPL unavailable; tools: nvidia-smi=unavailable, powermetrics=unavailable, scaphandre=unavailable; measuredEnergyAvailable=false |
| A18 | Statistical confidence | verified | low | latency gate PASS; n=12/12; ratio 6.96x; 95% bootstrap interval [6.50, 7.93]; CV baseline 7.0% |

## Detail

### A01 Benchmark runs verify and keep quality parity

- Status: verified (info)
- Reproduce: `wattsutra bench --manifest fixtures/baseline.json`
- Risk: A faster variant that computes a different answer would be reported as an improvement
- Corrective action: None
- Owner: maintainer

### A02 Edited reports are rejected (integrity hash)

- Status: verified (info)
- Reproduce: `node --test tests/`
- Risk: Silent result tampering
- Corrective action: None
- Owner: maintainer

### A03 Internally inconsistent reports are rejected even with a recomputed hash

- Status: verified (info)
- Reproduce: `node --test tests/`
- Risk: Hash alone proves only no later edits, not honest content. A fully re-derived forgery (samples and hash) is NOT detectable without signing
- Corrective action: Optional Sigstore signing is on the roadmap
- Owner: maintainer

### A04 Measured runs contain no energy, carbon or cost values

- Status: verified (info)
- Reproduce: `wattsutra bench`
- Risk: CPU time presented as joules or CO2e
- Corrective action: None
- Owner: maintainer

### A05 Incomparable workloads are refused

- Status: verified (info)
- Reproduce: `wattsutra compare`
- Risk: Apples-to-oranges speedup claims
- Corrective action: None
- Owner: maintainer

### A06 Quality mismatch yields a FAIL gate

- Status: verified (info)
- Reproduce: `wattsutra compare`
- Risk: Speedup accepted although answers differ
- Corrective action: None
- Owner: maintainer

### A07 Environment mismatch downgrades the gate to REVIEW_REQUIRED

- Status: verified (info)
- Reproduce: `wattsutra compare`
- Risk: Cross-machine numbers shown as a like-for-like result
- Corrective action: None
- Owner: maintainer

### A08 Too few samples never earns PASS

- Status: verified (info)
- Reproduce: `wattsutra compare`
- Risk: Tiny samples described as conclusive
- Corrective action: None
- Owner: maintainer

### A09 Estimator applies no default rates

- Status: verified (info)
- Reproduce: `wattsutra estimate (empty assumptions)`
- Risk: Invented watts, carbon intensity or prices
- Corrective action: None
- Owner: maintainer

### A10 Estimator rejects unknown fields and ambiguous energy input

- Status: verified (info)
- Reproduce: `wattsutra estimate`
- Risk: Misspelled assumption silently ignored
- Corrective action: None
- Owner: maintainer

### A11 Modeled and imported values are labelled

- Status: verified (info)
- Reproduce: `wattsutra estimate`
- Risk: Measured vs modeled confusion
- Corrective action: None
- Owner: maintainer

### A12 HTML report escapes hostile content

- Status: verified (info)
- Reproduce: `wattsutra report --format html`
- Risk: Script injection through report fields
- Corrective action: None
- Owner: maintainer

### A13 Hashing is deterministic regardless of key order

- Status: verified (info)
- Reproduce: `node --test tests/`
- Risk: Hash differs across machines or locales
- Corrective action: None
- Owner: maintainer

### A14 Skills and agent manifest are consistent

- Status: verified (info)
- Reproduce: `wattsutra audit`
- Risk: Skill discovery fails silently in IDEs
- Corrective action: None
- Owner: maintainer

### A15 No credentials in shipped files

- Status: verified (info)
- Reproduce: `wattsutra audit`
- Risk: Leaked secrets in a public package
- Corrective action: None
- Owner: security

### A16 Installer refuses to overwrite customised skills

- Status: verified (info)
- Reproduce: `wattsutra install`
- Risk: User edits destroyed
- Corrective action: None
- Owner: maintainer

### A17 Hardware energy instrument

- Status: not-run (info)
- Reproduce: `wattsutra doctor`
- Risk: Without a meter, energy and carbon stay unmeasured. This is deliberate and correct.
- Corrective action: Import an external meter reading via estimate --assumptions to get an imported-meter-observation
- Owner: maintainer

### A18 Statistical confidence

- Status: verified (low)
- Reproduce: `wattsutra compare`
- Risk: Small samples on a shared machine; interval is bootstrap, not a significance test
- Corrective action: Repeat on a quiet, pinned machine for publication-grade claims
- Owner: user

## Honest limits

- A hash detects edits; it does not prove a number is honest. A forger who rebuilds samples and hash is not detected without signatures.
- No hardware meter was used. Nothing here is a measurement of electricity or CO2e.
- This is a self-audit by the tool. Treat it as reproducible evidence, not third-party certification. Re-run it yourself: `npx wattsutra audit`.
