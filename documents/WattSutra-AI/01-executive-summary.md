# Executive summary

## The problem

Teams claim "40% more efficient" or "greener" after a stopwatch test. Energy tools measure watts, profilers measure time, cost tools measure bills, and nothing stops the three being blended into one confident sentence. The result is claims that cannot be reproduced, defended or audited.

## What WattSutra AI is

An offline command-line tool plus 20 portable AI-agent skills that make performance claims **honest by construction**:

- It measures what a process can truly observe: wall time, process CPU time, process memory.
- It proves the optimised version still produces the **same answer**.
- It refuses to compare runs that are not like-for-like and downgrades weak evidence to `REVIEW_REQUIRED`.
- It labels every number: `measured`, `imported-meter-observation`, `modeled` or `not measured`.
- It writes the result as JSON, Markdown and HTML that a non-engineer can read.

## What it is not

It is **not** an energy meter, a carbon accounting product, an SCI-certified calculator or a cloud billing tool. Version 0.2.0 reads no hardware sensor. Energy, carbon and cost remain empty until you import a real meter reading or give explicit model inputs, and then they are labelled as imported or modeled.

## Why trust it

| Claim | How you can check it yourself |
| --- | --- |
| Tests pass | `npm test`; see [observed results](test-results.md) (machine-written) |
| It rejects doctored reports | `wattsutra audit` checks A02, A03, A04 |
| It rejects unfair comparisons | audit checks A05 to A08 |
| It invents no rates | audit check A09, A10 |
| No secrets shipped | audit check A15 |
| Zero runtime dependencies | `npm ls --all`, `package.json` |

The audit is a **self-audit**: reproducible evidence, not a third-party certificate. See [independent audit](07-independent-audit.md) for method, results and open limits.

## Who benefits

| Role | Value |
| --- | --- |
| AI / platform engineers | A regression gate (`compare` exits 1 on `FAIL`) that cannot be fooled by a faster-but-wrong change |
| FinOps | Cost per job with price provenance; absent price stays unknown |
| Sustainability leads | Carbon only from stated intensity; no invented regional defaults; no false SCI claims |
| Reviewers and auditors | Hash-linked evidence and one command that re-verifies it |

## Status at a glance

| Area | State |
| --- | --- |
| CLI and engine | Shipped, 0.2.0 |
| Reports (JSON, MD, HTML, CSV) | Shipped |
| Self-audit (18 checks) | Shipped |
| 20 skills (17 core, 3 advisory) | Shipped as role instructions |
| Hardware sensors (RAPL, NVML, etc.) | Roadmap |
| Arbitrary workload and live inference benchmarks | Roadmap, needs sandbox |
| Signing and attestation | Roadmap |
| Hosted dashboard | Roadmap |

## Decisions needed from a sponsor

None for 0.2.0. For the roadmap: approve a sandbox design before any arbitrary-code benchmark, and approve a trademark search before any marketing use of the name.

## Cost and risk

Free, Apache-2.0, no accounts, no network. The main risk is misuse of a number out of context; the tool limits that by labelling and by gates, but cannot stop a human from deleting the caveats.
