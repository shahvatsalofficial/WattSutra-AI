# Security, privacy and legal

This is engineering documentation, not legal advice. Have counsel review before commercial or regulatory use.

## Security model

### Assets
Benchmark results, environment inventory (CPU model, OS release, memory), assumption files (prices, power figures), skill files in user projects.

### Threats and controls (version 0.2.0)

| Threat | Control | Test |
| --- | --- | --- |
| Malicious manifest runs code | Fixed allowlist: one workload, two variants; bounded `n`, `samples`, `warmups`; no spawn, no `eval` | `reject unknown workload`, `CLI disallows arbitrary executable payload` |
| Path traversal / symlink swap on input | `lstat`, regular file only, 4 MiB cap | `safe JSON read rejects symlink` |
| Doctored report | SHA-256 + recomputed statistics + refusal of energy/carbon/cost values | audit A02 to A04 |
| Skill install overwrites user edits | Pre-flight plan, refuses edited file | `install refuses overwrite`, audit A16 |
| Install into symlinked dir | Every path component checked | `install refuses symlink target` |
| Script injection in HTML report | Escaping on every field, CSP meta, no scripts | audit A12 |
| Server abuse | Loopback only, GET only, bearer token (timing-safe), JSON-only fixed pattern, size cap | `server read-only, authenticated, constrained` |
| Secret leakage in the package | Audit regex scan for GitHub, npm, AWS, OpenAI-style keys and private keys | audit A15 |
| Supply chain | Zero runtime dependencies; Actions pinned to major versions; npm provenance on release | `npm ls --all` |
| Timing side channels | Not in scope; benchmark is local | n/a |

### Known gaps (honest)

- A forger who rebuilds samples and hash is not detected. No signatures yet.
- Server uses one shared token and no rate limit. Do not expose it beyond localhost.
- Symlink checks are `lstat`-then-read; a local attacker with write access to the directory can race it.
- GitHub Actions are pinned by major tag, not by commit SHA.
- No sandbox exists because no arbitrary code runner exists. Do not add one without the design in the [threat model](../../docs/THREAT_MODEL.md).
- Skills are text instructions; a host model may misread them. Humans must review production-affecting advice.

### Vulnerability reporting
Private GitHub advisory: <https://github.com/shahvatsalofficial/WattSutra-AI/security/advisories/new>. Best effort, no SLA.

## Privacy

| Question | Answer |
| --- | --- |
| Telemetry? | None. No network client in the CLI. |
| What is written? | Only files at paths you pass, mode 0600, plus skill copies for `install`. |
| What is in a report? | Hashes, timings, workload parameters, platform, arch, Node version, CPU model, core count, OS release, total memory, 1-minute load (non-Windows), timestamp. No hostname, username, path or prompt. |
| Personal data? | None collected by design. Review before publishing; CPU model and OS release can fingerprint a machine. |
| Repository sample evidence | `evidence/samples/` contains a run from the author's development machine, included deliberately as proof. It holds a CPU model string, nothing personal. |
| Prompts and model output | Not handled in 0.2. Future inference benchmarks must keep prompts local and store hashes. |

## Legal

### License
Apache License 2.0 (`LICENSE`). Copyright 2026 Vatsal Shah. Keep `NOTICE` when redistributing. Contributions are accepted under the same license; contributors retain credit.

### Warranty and liability
Provided "as is", without warranty. No guarantee that a number reflects any other machine, workload or time. Do not rely on output for regulated emissions reporting, procurement guarantees or safety decisions.

### Claims the project does not make
- Not a certified or conformant implementation of the Green Software Foundation SCI specification, ISO standards or any regulatory scheme (CSRD, GHG Protocol, SEC).
- Not an energy meter. No kWh or CO2e is ever measured by 0.2.0.
- Not a cloud billing authority. Costs are modeled from user prices.
- Not independently audited by a third party.

### Trademarks and names
"WattSutra" was found unpublished on the npm registry on 2026-11-11. **No trademark search or clearance has been done.** Registry availability is not trademark clearance. Third-party names (OpenTelemetry, k6, CodeCarbon, Scaphandre, Kepler, NVIDIA, Intel, Anthropic, Cursor, OpenAI, Google, GitHub and others) belong to their owners and are used only to describe compatibility or roadmap; no affiliation or endorsement is implied. Compatibility statements for IDEs mean "files are copied to the documented skill path", not "verified working".

### Environmental and marketing claims
Using WattSutra output in marketing may fall under green-claims rules (for example EU and UK consumer law, FTC Green Guides). Rule of thumb enforced by the tool: say what was measured, on what machine, over what scope. Never write "saves X kWh" or "reduces CO2" from a latency result.

### Dependencies and data
No runtime dependencies (see `THIRD_PARTY_NOTICES.md`). No training data, no model weights, no third-party datasets are included. Fixture assumption values (65 W, 380 gCO2e/kWh, 0.002 USD/job) are fabricated illustrations.

### Export and privacy law
No personal data is processed, so GDPR/CCPA obligations are not triggered by the software itself. If you add hostnames, usernames or prompts to reports, your own obligations apply.

## Responsible-use checklist before publishing numbers

1. Run `wattsutra verify` on every run.
2. State machine, Node version, sample count and scope.
3. Quote the gate (`PASS`/`REVIEW_REQUIRED`/`FAIL`), not just the speedup.
4. Label modeled values as modeled and show the assumptions.
5. Do not call anything energy or carbon unless a real meter reading or your own explicit model produced it.
