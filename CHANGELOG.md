# Changelog

## 0.2.1 — 2026-11-16
- **Changed** minimum Node.js is now 22 (Node 20 is end-of-life). CI matrix: Ubuntu, Windows Node 22/24, macOS Node 24.
- **Changed** GitHub Actions bumped to `checkout`, `setup-node`, `upload-artifact` v7; Dependabot added for Actions.
- **Changed** release workflow now also runs `check:skills` and the self-audit before publishing.
- **Fixed** comparison bootstrap now uses the median ratio, so a single GC pause or noisy runner cannot flip a clear speedup into `REVIEW_REQUIRED`. Added `latencyRatioMedian`.
- **Fixed** the audit's live comparison uses at least 12 samples.
- **Changed** documentation website rebuilt: light theme by default with dark toggle, phone and desktop layouts, flow diagrams and charts, seven real-world scenarios with captured CLI output, FAQ and glossary. Site now lives in `documents/html/`.
- **Added** a test that keeps the version identical in `package.json`, engine, plugin manifest, `CITATION.cff` and this changelog.

## 0.2.0 — 2026-11-11
First public release.
- **Added** `wattsutra audit`: 18 self-checks, writes `audit.json`, `audit.md`, `audit.html`.
- **Added** raw samples, `runId`, `manifestHash`, `toolVersion` and richer environment fingerprint in every run.
- **Added** deep validation: summaries recomputed from raw samples; runs carrying energy, carbon or cost values are refused even if re-hashed.
- **Added** comparison gates (`PASS`, `FAIL`, `REVIEW_REQUIRED`, `NOT_RUN`), environment parity, and a seeded 95% bootstrap interval for the speed ratio. Quality mismatch is `FAIL`; fewer than 5 samples or different environments are `REVIEW_REQUIRED`.
- **Added** exit code 1 for a failed gate or failed verification; `--version`; `install --dry-run`; JSON Schemas for run, comparison and estimate; passive instrument probe in `doctor`; accessible HTML report with CSP.
- **Changed** standard deviation is now the sample (n-1) deviation and is labelled. Canonical hashing no longer depends on locale.
- **Changed** estimator rejects unknown assumption fields, dual energy inputs and malformed currency.
- **Changed** the 20 skills are now role-specific, each marked `core` (backed by tested code) or `advisory`; generated from one table (`npm run gen:skills`).
- **Added** documentation set in `documents/WattSutra-AI/` (MD and HTML), observed test results, sample audit evidence, CI matrix, release workflow.

## 0.1.0 — 2026-11-11
Internal offline starter (not published).
