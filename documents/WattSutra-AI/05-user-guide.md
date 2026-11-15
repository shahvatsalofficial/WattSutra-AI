# User guide

## Install

Requires Node.js 20 or newer. No account, no key.

```bash
npx wattsutra --version
npx wattsutra doctor
```

Or from source:

```bash
git clone https://github.com/shahvatsalofficial/WattSutra-AI.git
cd WattSutra-AI
npm test
```

## 10-minute offline walkthrough

### 1. Run the self-audit

```bash
npx wattsutra audit --out wattsutra-audit
```

Open `wattsutra-audit/audit.html`. You should see `Verdict: PASS` and one `not-run` check (hardware energy instrument). That is expected.

### 2. Benchmark two algorithms

Manifests live in `fixtures/` (npm package includes them). Copy them first when using `npx`:

```bash
wattsutra bench --manifest fixtures/baseline.json  --out baseline.json
wattsutra bench --manifest fixtures/candidate.json --out candidate.json
```

A manifest is:

```json
{"workload":"prime-sum","variant":"trial","n":20000,"warmups":1,"samples":5}
```

Use at least 5 samples (up to 60), more for noisy machines.

### 3. Verify, then compare

```bash
wattsutra verify  --input baseline.json
wattsutra compare --baseline baseline.json --candidate candidate.json --out comparison.json
```

Read `gates.latency`. `PASS` means same answer, same environment, enough samples and an interval that excludes "no change". `REVIEW_REQUIRED` means collect more or fix the environment. `FAIL` means a wrong answer or a slowdown. The command exits 1 on `FAIL`, so it works as a CI gate.

### 4. Add your own assumptions (optional)

```json
{"averagePowerW":65,"carbonIntensityGPerKWh":380,"ratePerJob":0.002,"currency":"USD"}
```

```bash
wattsutra estimate --run candidate.json --assumptions assumptions.json --out estimate.json
```

Everything in the output is `modeled` and derived only from numbers **you** typed. The sample values in `fixtures/assumptions.json` are fabricated illustrations; do not reuse them as facts.

### 5. If you have a real meter

```json
{"measuredEnergyKWh":0.0004,"energySource":"Shelly Plug S, wall outlet, 60 s window"}
```

It is imported as `imported-meter-observation` with `attributionUnverified: true`. WattSutra does not validate your meter; it records your claim and its source.

### 6. Make a report

```bash
wattsutra report --run candidate.json --format html --out candidate.html
wattsutra report --run candidate.json --format md
```

## Using the skills in an IDE

```bash
wattsutra install --target ./my-project --ide claude --dry-run
wattsutra install --target ./my-project --ide claude
```

Hosts: `claude` (`.claude/skills`), `cursor`, `codex` (`.agents/skills`), `gemini`, `copilot` (`.github/skills`), or `all`. Installing copies files; it does **not** prove the host activates them. If a host has no skill discovery, point it at `AGENTS.md`.

Ask your agent, for example: "Use wattsutra-prime to compare these two runs and tell me what can and cannot be claimed."

## CI example

```yaml
- run: npx wattsutra compare --baseline baseline.json --candidate candidate.json
```

Commit a baseline produced on the **same runner type**. A different CPU model gives `REVIEW_REQUIRED`, never `PASS`.

## Reading a result correctly

| You see | It means | It does not mean |
| --- | --- | --- |
| `meanMs` lower | Faster on this machine, these samples | Less energy, lower bill, lower carbon |
| `cpuMs` | Process CPU time | Joules |
| `rssBytes` | Whole-process memory | Memory used by the workload |
| `PASS` | Latency evidence is complete and scoped | An energy or cost saving |
| `modeled` | Your assumptions times measured time | A measurement |
| `NOT_RUN` | No data supplied | A pass |

## Troubleshooting

| Message | Fix |
| --- | --- |
| `--manifest required` | Pass the flag; exit code 2 |
| `Input must be a regular file within size limit` | Symlink, directory or file over 4 MiB |
| `Benchmark report integrity mismatch` | File was edited after creation; regenerate |
| `Unsupported benchmark schema: ... does not match its raw samples` | Numbers edited and re-hashed; regenerate |
| `Incomparable workloads` | Baseline and candidate must share `n`, workload and unit |
| `Unknown assumption fields` | Typo in assumptions; allowed keys listed in the [functional spec](02-functional-spec.md) |
| `REVIEW_REQUIRED` always | Use 5+ samples, same machine, close other programs |
| Symlink tests skipped on Windows | Normal without Developer Mode |
| `WATTSUTRA_TOKEN must be set` | Provide 24+ random characters for `server` |

## FAQ

**Can it tell me my carbon footprint?** Only a modeled estimate from the intensity you provide. It does not look up regional grids.

**Is the audit independent?** No. It is a self-audit; re-run it yourself or have a third party review the source.

**Does it send data anywhere?** No. There is no telemetry and no network client.
