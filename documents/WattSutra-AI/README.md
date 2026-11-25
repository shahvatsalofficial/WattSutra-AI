# WattSutra AI documentation

Everything a new reader, an auditor or a future maintainer needs, so nobody has to ask. The Markdown here is the source. `npm run build:docs` turns it into the responsive website in `documents/html/` (light theme by default, dark toggle); CI fails if the site is stale. Live: <https://shahvatsalofficial.github.io/WattSutra-AI/>.

## Reading order

| Audience | Start here |
| --- | --- |
| Executive, buyer, reviewer | [Executive summary](01-executive-summary.md) |
| Product owner, tester | [Functional specification](02-functional-spec.md) |
| Engineer, contributor | [Technical specification](03-technical-spec.md), then [Architecture](04-architecture.md) |
| User, CI owner | [User guide](05-user-guide.md) |
| Security, legal, procurement | [Security, privacy and legal](06-security-privacy-legal.md) |
| Anyone who learns by example | [Real-world scenarios](08-real-world-scenarios.md), [FAQ and glossary](09-faq-glossary.md) |
| Auditor, skeptic | [Independent audit and evidence](07-independent-audit.md), [Observed test results](test-results.md) |

## One-paragraph summary

WattSutra AI benchmarks a fixed workload, verifies the answer stayed correct, compares a baseline and a candidate with fairness gates and writes JSON, Markdown and HTML reports. Every figure carries an evidence kind: measured, imported meter observation, modeled or not measured. It never converts CPU time into energy, carbon or money. Version 0.2 reads no hardware sensor.

## Evidence files

Under [`evidence/`](evidence/): `test-results.json` (machine-written test run), `samples/audit.{json,md,html}` (a real self-audit), `samples/measurement.{md,html}` (a real run report), `samples/comparison.json` and `samples/estimate.json`.

## How to keep these docs true

1. Change code, then run `npm test`, `npm run test:report`, `npm run audit`.
2. Copy the new audit into `evidence/samples/` (`node packages/cli/index.mjs audit --out documents/WattSutra-AI/evidence/samples`).
3. If CLI behaviour changed, run `npm run docs:scenarios`.
4. Edit the Markdown, run `npm run build:docs`, commit `documents/html/` too.

Created by Vatsal Shah. Apache-2.0.
