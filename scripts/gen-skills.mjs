// Regenerates skills/*/SKILL.md, agents/*.md and agents/manifest.json from one table, so they cannot drift.
// Run: node scripts/gen-skills.mjs   (then `npm test` verifies consistency)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const check = process.argv.includes('--check');
const stale = [];
const put = (file, text) => {
  let old = null; try { old = readFileSync(file, 'utf8'); } catch {}
  if (old !== text) { if (check) stale.push(file); else { mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, text); } }
};
const manifest = JSON.parse(readFileSync(join(root, 'agents/manifest.json'), 'utf8'));

// necessity: core = backed by deterministic code and tests; advisory = review guidance only (no code behind it yet).
const T = {
  'wattsutra-prime': { necessity: 'core', backed: ['audit', 'compare', 'verify'], when: 'any request to measure, compare or report performance, energy, carbon or cost', steps: ['Fix scope: one workload, one functional unit, one environment.', 'Route to Workload Architect and Fairness Auditor before any number is produced.', 'Run `wattsutra bench`, `verify`, `compare`; run `wattsutra audit` before publishing claims.', 'Let Evidence Ledger and Privacy Guard block unsupported claims; list missing evidence.'], out: 'Scope, evidence table (kind per metric), gates (PASS/FAIL/REVIEW_REQUIRED/NOT_RUN), unknowns, next experiments.' },
  'wattsutra-workload-architect': { necessity: 'core', backed: ['bench'], when: 'defining or reviewing a benchmark manifest or functional unit', steps: ['State the functional unit (one complete job) and the input size.', 'Require a deterministic correctness check shared by baseline and candidate.', 'Pin warmups and sample count; reject manifests outside the allowlist.', 'Never propose running arbitrary user code without a sandbox and explicit approval.'], out: 'Manifest JSON, functional unit, quality check, limits.' },
  'wattsutra-probe-pilot': { necessity: 'core', backed: ['doctor'], when: 'checking which instruments exist and what they can legitimately claim', steps: ['Run `wattsutra doctor`; read the instruments block.', 'Treat "detected-not-used" as present but unread, "unavailable" as absent.', 'State sampling scope, clock and overhead for every instrument used.', 'Never ask for root just to support a demo.'], out: 'Instrument inventory with scope, privilege need and coverage gaps.' },
  'wattsutra-latency-lens': { necessity: 'core', backed: ['bench', 'compare'], when: 'interpreting wall-clock results, percentiles, jitter or regressions', steps: ['Read n, mean, median, sample stddev, CV, p95 from the run.', 'Call p95 indicative when n is small; never call a tiny sample significant.', 'Use the compare 95% bootstrap interval; if it spans 1, report "not distinguishable".', 'Latency change is not an energy or cost change.'], out: 'Latency summary, interval, verdict on noise vs signal.' },
  'wattsutra-cpu-profiler': { necessity: 'core', backed: ['bench'], when: 'reading process CPU time or utilization', steps: ['CPU ms is process cpuUsage (user+system), not joules.', 'Check scheduling interference: other load, throttling, shared cores.', 'Compare CPU ms with wall ms to spot waiting vs computing.', 'Refuse to convert CPU time into watts or CO2e.'], out: 'CPU interpretation with attribution caveats.' },
  'wattsutra-memory-sentinel': { necessity: 'core', backed: ['bench'], when: 'reading RSS or memory behavior', steps: ['RSS is whole-process resident bytes at sample time.', 'It is not per-function allocation and not peak unless sampled as peak.', 'Report heap vs RSS separately when both exist.', 'Flag growth across samples as a leak suspicion, not a finding.'], out: 'Memory summary with scope labels.' },
  'wattsutra-gpu-scout': { necessity: 'advisory', backed: ['doctor'], when: 'a GPU is involved in the workload', steps: ['Check `doctor` for nvidia-smi presence (file check only).', 'Distinguish device-wide samples from process-attributed energy.', 'Mark unsupported or untested sensors explicitly; WattSutra does not read GPU sensors yet.', 'Do not estimate GPU watts from utilization.'], out: 'GPU capability note and limits. No GPU numbers are produced by WattSutra 0.2.' },
  'wattsutra-power-meter': { necessity: 'core', backed: ['estimate'], when: 'a real meter reading (wall meter, RAPL export, smart plug) is available', steps: ['Require a named independent source (8+ chars) with the reading.', 'Import via `estimate` as measuredEnergyKWh: labelled imported-meter-observation, attribution unverified.', 'Check boundary: wall outlet vs CPU package differ materially.', 'Never present modeled power as a meter reading.'], out: 'Imported observation with source, boundary and unverified-attribution flag.' },
  'wattsutra-carbon-methodologist': { necessity: 'core', backed: ['estimate'], when: 'turning energy into gCO2e or reviewing an SCI-style number', steps: ['Require user-supplied carbon intensity with region, time and source. No defaults.', 'SCI = ((E × I) + M) / R needs embodied M and functional units R.', 'Output is "modeled-sci-like"; never "SCI compliant" or "certified".', 'Offsets are not reductions.'], out: 'Modeled carbon with assumptions, sensitivity range and caveats.' },
  'wattsutra-cost-lens': { necessity: 'core', backed: ['estimate'], when: 'attaching a price to a job', steps: ['Require rate, 3-letter currency, unit and effective date from the user.', 'Output is modeled cost per job, never billing.', 'Separate input, cached, output tokens and retries for inference.', 'Never invent prices or taxes.'], out: 'Modeled cost with price provenance.' },
  'wattsutra-finops-auditor': { necessity: 'advisory', backed: [], when: 'reviewing cloud spend assumptions or procurement constraints', steps: ['Separate invoices, estimates, contract rates and exchange conversions.', 'Review allocation assumptions independently of Cost Lens.', 'Require read-only scoped credentials for any billing import (not implemented in 0.2).', 'Quality failures can erase apparent savings: ask for cost per successful task.'], out: 'Allocation review with open assumptions. Billing import is PLANNED.' },
  'wattsutra-quality-gate': { necessity: 'core', backed: ['compare', 'verify'], when: 'deciding whether a candidate is equivalent to a baseline', steps: ['Check quality.actual equals the baseline result (count and sum).', 'Mismatch means gate FAIL, regardless of speed.', 'A quality check must be deterministic and shared.', 'Completion rate is not correctness.'], out: 'Quality verdict with the compared values.' },
  'wattsutra-fairness-auditor': { necessity: 'core', backed: ['compare'], when: 'checking whether two runs are comparable', steps: ['Workload ID, n, functional unit and scope must match or compare refuses.', 'Check environmentParity: platform, arch, Node, CPU, cores.', 'A mismatch downgrades the gate to REVIEW_REQUIRED (exploratory).', 'List confounders: background load, thermal state, run order.'], out: 'Parity table and confounder list.' },
  'wattsutra-variance-analyst': { necessity: 'core', backed: ['compare'], when: 'judging sample size, spread or confidence', steps: ['Need n >= 5 per run for any gate above REVIEW_REQUIRED.', 'Read CV and the bootstrap interval of the mean ratio.', 'Interval includes 1 means no detectable difference.', 'Bootstrap is not a significance test; say so.'], out: 'Variance verdict with interval and sample-size advice.' },
  'wattsutra-optimization-planner': { necessity: 'advisory', backed: [], when: 'proposing what to try next', steps: ['Propose low-risk experiments (batching, caching, algorithm swap) with trade-offs.', 'Each needs a quality bound and a re-measurement plan.', 'Never claim a saving before it is measured.', 'Never auto-deploy.'], out: 'Experiment list with hypotheses and measurement plan.' },
  'wattsutra-regression-watch': { necessity: 'core', backed: ['compare'], when: 'comparing a new run to a stored baseline', steps: ['Verify both runs first (`verify`).', 'Run `compare`; a gate FAIL exits with code 1 so CI can block.', 'Flag stale baselines: different environment means REVIEW_REQUIRED.', 'Keep original runs immutable.'], out: 'Regression verdict and the two evidence hashes.' },
  'wattsutra-evidence-ledger': { necessity: 'core', backed: ['verify', 'audit'], when: 'checking provenance or tamper evidence', steps: ['Run `wattsutra verify --input run.json`.', 'Integrity hash detects edits; shape check recomputes stats from raw samples.', 'A hash is not a signature: a forger who recomputes everything is not detected.', 'Record runId, integrity, manifestHash for every claim.'], out: 'Provenance table and tamper verdict.' },
  'wattsutra-privacy-guard': { necessity: 'core', backed: ['audit'], when: 'before sharing reports or enabling any integration', steps: ['Reports hold hashes and environment info, never prompts or secrets.', 'The audit secret scan must be clean.', 'No network call or telemetry without explicit opt-in.', 'Redact hostnames or paths if the user asks.'], out: 'Privacy checklist result and redactions.' },
  'wattsutra-ide-bridge': { necessity: 'core', backed: ['install'], when: 'installing skills into an IDE project', steps: ['Use `wattsutra install --target <dir> --ide <host> --dry-run` first.', 'Installer refuses symlinks and never overwrites edited skills.', 'Copying a skill is not proof the host activates it; say "installed, activation untested".', 'Fall back to AGENTS.md when a host lacks skill discovery.'], out: 'Dry-run plan, then install result and honest activation status.' },
  'wattsutra-report-composer': { necessity: 'core', backed: ['report', 'audit'], when: 'producing a shareable report', steps: ['Use `wattsutra report --format md|html|csv|json` or `audit`.', 'Every metric shows its kind; unmeasured fields say "not measured".', 'Include caveats, missing evidence and the reproduce command.', 'No sensational percentages or extrapolated electricity.'], out: 'Markdown and HTML report with caveats.' }
};

for (const a of manifest.agents) {
  const t = T[a.id];
  if (!t) throw Error('no table entry for ' + a.id);
  const skill = `---
name: ${a.id}
description: ${a.objective} Use when ${t.when}.
---

# ${a.name}

**Mission:** ${a.objective}

**Necessity:** ${t.necessity === 'core' ? 'core: backed by deterministic code and tests.' : 'advisory: review guidance only; no code behind it yet.'}${t.backed.length ? ' Backed by: ' + t.backed.map(b => '`wattsutra ' + b + '`').join(', ') + '.' : ''}

## When to use
${t.when[0].toUpperCase() + t.when.slice(1)}.

## Protocol
${t.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Evidence taxonomy
\`measured\` (direct instrument) · \`imported-meter-observation\` (user-supplied reading, attribution unverified) · \`modeled\` (assumptions) · \`inferred\` · \`not-run\` · \`missing\` · \`unsupported\`.

## Output
${t.out} Attach evidence hashes (\`integrity\`, \`runId\`). Sections: Observations, Assumptions, Risks, Verification status.

## Constraints
Never label CPU time, wall time or RSS as electrical energy, watts, kWh or CO2e. Never invent rates, prices, carbon intensity or savings. Never install global tools, call paid APIs, read secrets or run uncontrolled code without explicit user approval. Missing data stays unknown.
`;
  put(join(root, 'skills', a.id, 'SKILL.md'), skill);
  put(join(root, 'agents', a.id + '.md'), `# ${a.name} — Claude subagent role\n\nAdopt specialist persona: **${a.role}**. ${a.objective}\n\nLoad \`skills/${a.id}/SKILL.md\` and follow its protocol and constraints. Return a compact structured result. This is a role definition, not a separate runtime process; delegate to a real subagent only if the host supports it and the user authorizes it.\n`);
  a.necessity = t.necessity;
  a.backedBy = t.backed.map(b => 'wattsutra ' + b);
  a.status = t.necessity === 'core' ? 'role-instructions-backed-by-cli' : 'role-instructions-only';
}
manifest.schema = 'wattsutra.agents.v1';
const cell = s => String(s).replace(/\|/g, '/');
put(join(root, 'docs/AGENT_CATALOG.md'), [
  '# Agent catalog', '',
  'Generated by `npm run gen:skills`. **core** = backed by deterministic, tested CLI behaviour. **advisory** = review guidance only; no code behind it yet. None is a separate runtime process.', '',
  '| Skill | Role | Necessity | Backed by | Objective |', '| --- | --- | --- | --- | --- |',
  ...manifest.agents.map(a => `| \`${a.id}\` | ${a.role} | ${a.necessity} | ${a.backedBy.map(b => '`' + b + '`').join(', ') || 'none'} | ${cell(a.objective)} |`), ''
].join('\n'));
put(join(root, 'agents/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
if (stale.length) { console.error('Stale generated files (run npm run gen:skills): ' + stale.map(f => f.replaceAll('\\', '/').split('/').slice(-2).join('/')).join(', ')); process.exit(1); }
console.log('generated', manifest.agents.length, 'skills;', manifest.agents.filter(a => a.necessity === 'core').length, 'core,', manifest.agents.filter(a => a.necessity === 'advisory').length, 'advisory');
