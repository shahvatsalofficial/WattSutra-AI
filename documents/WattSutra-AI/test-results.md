# Test results (observed)

Command: `node --test tests/*.test.mjs`

| Total | Pass | Fail | Skipped | Exit code |
| --- | --- | --- | --- | --- |
| 96 | 94 | 0 | 2 | 0 |

Environment: Node v24.15.0, win32/x64, commit `f4e55e2`.

Skips: Symlink tests skip when the host forbids symlink creation (Windows without Developer Mode); they run on Linux and macOS CI.

Regenerate with `npm run test:report`. This file is machine-written from the real run; it is not edited by hand.

## Cases

- PASS — doctor works without api key
- PASS — help prints documented CLI
- PASS — agents manifest valid
- PASS — bench creates measured artifact
- PASS — CLI disallows arbitrary executable payload
- PASS — CLI rejects missing flags
- PASS — CLI invalid report format fails
- PASS — install cannot choose unsupported ide
- PASS — install requires explicit target
- PASS — install copies skills into Claude project
- PASS — install refuses overwrite of customized skill
- SKIP — install refuses symlink target
- PASS — install all hosts project-local
- PASS — prime variants agree 2
- PASS — prime variants agree 3
- PASS — prime variants agree 10
- PASS — prime variants agree 97
- PASS — prime variants agree 250
- PASS — prime variants agree 1000
- PASS — reject unknown workload
- PASS — reject unknown variant
- PASS — reject too few samples
- PASS — reject excess samples
- PASS — reject infinite n
- PASS — reject fractional n
- PASS — reject huge n
- PASS — reject negative warmups
- PASS — sample counts
- PASS — measured timing only
- PASS — cpu units and samples
- PASS — memory labeled whole process
- PASS — referenced quality verified
- PASS — report integrity verified
- PASS — tampering detected
- PASS — nested hashing is order stable
- PASS — summary median and p95
- PASS — summary excludes infinity
- PASS — summary excludes empty
- PASS — comparison same workload
- PASS — mismatched workload refused
- PASS — tampered candidate refused
- PASS — estimator missing everything stays unknown
- PASS — model power and carbon with explicit rates
- PASS — imported meter observation needs provenance
- PASS — imported metered observation labeled
- PASS — negative watt assumptions rejected
- PASS — invalid carbon rate rejected
- PASS — currency required with cost
- PASS — cost remains modeled
- PASS — SCI-like not automatic
- PASS — SCI-like explicitly includes embodied and unit
- PASS — html escaping includes markdown text
- PASS — markdown labels energy not measured
- PASS — safe JSON read of normal file
- SKIP — safe JSON read rejects symlink
- PASS — csv export does not invent kWh
- PASS — run validates against shipped JSON Schema
- PASS — comparison validates against shipped JSON Schema
- PASS — estimate validates against shipped JSON Schema
- PASS — schema rejects a run carrying energy
- PASS — run has stable id, raw samples and manifest hash
- PASS — stddev is the sample standard deviation
- PASS — forged run with recomputed hash but edited mean is rejected
- PASS — run with injected energy is rejected even if rehashed
- PASS — run with mismatched quality is rejected
- PASS — canonical hash ignores locale-sensitive ordering
- PASS — compare: quality mismatch is FAIL
- PASS — compare: environment mismatch is REVIEW_REQUIRED
- PASS — compare: three samples never PASS
- PASS — compare: clear speedup with enough samples PASSes and energy gates stay NOT_RUN
- PASS — compare: slower candidate beyond interval is FAIL
- PASS — compare: bootstrap interval is deterministic for the same inputs
- PASS — estimate rejects unknown fields
- PASS — estimate rejects both meter and modeled power
- PASS — estimate rejects bad currency even without a rate
- PASS — estimate rejects non-object assumptions
- PASS — html report escapes injected fields and carries CSP
- PASS — safeReadJson gives readable errors
- PASS — probe finds nothing on an empty PATH and reports no measured energy
- PASS — probe detects a fake instrument on PATH without executing it
- PASS — install --dry-run writes nothing and reports the plan
- PASS — install is idempotent
- PASS — install reports a missing target clearly
- PASS — skills: 20 skills, frontmatter matches directory, manifest agrees
- PASS — audit: all checks verified or not-run, verdict PASS, outputs MD/HTML/JSON
- PASS — cli --version and unknown command
- PASS — cli verify exits 1 on tamper and 0 on good file
- PASS — cli compare exits 1 on quality FAIL
- PASS — cli audit writes three files and exits 0
- PASS — cli doctor reports instruments and no measured energy
- PASS — cli install --dry-run leaves the target empty
- PASS — shipped example reports verify
- PASS — version is identical in package.json, engine, plugin manifest and CITATION.cff
- PASS — server rejects missing token
- PASS — server refuses invalid port
- PASS — server read-only, authenticated, constrained
