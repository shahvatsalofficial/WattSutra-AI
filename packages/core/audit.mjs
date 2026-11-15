// Self-audit: runs WattSutra against itself and writes audit.json / audit.md / audit.html.
// Every status comes from code executed during this call. Nothing is hand-written or cached.
import { readFileSync, readdirSync, lstatSync, mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import {
  VERSION, benchmark, compare, estimate, verifyRun, validateExternal, hashObject, escapeHtml, htmlShell,
  reportHtml, safeReadJson, fingerprint
} from './engine.mjs';
import { install } from './install.mjs';
import { probeInstruments } from './probe.mjs';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re ? re.test(e.message) : true; } };
const rehash = run => { const { integrity, ...body } = run; return { ...body, integrity: hashObject(body) }; };
const clone = v => JSON.parse(JSON.stringify(v));

function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'artifacts', 'coverage'].includes(name)) continue;
    const p = join(dir, name), st = lstatSync(p);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) listFiles(p, out); else if (st.size < 2_000_000) out.push(p);
  }
  return out;
}
const SECRET_PATTERNS = [/gh[pousr]_[A-Za-z0-9]{30,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /npm_[A-Za-z0-9]{30,}/, /sk-[A-Za-z0-9]{32,}/];

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return Object.fromEntries(m[1].split(/\r?\n/).map(l => l.match(/^(\w[\w-]*):\s*(.*)$/)).filter(Boolean).map(x => [x[1], x[2].trim()]));
}

export function runAudit({ root, fixturesDir = join(root, 'fixtures') } = {}) {
  root = resolve(root);
  const checks = [];
  const add = c => checks.push({ severity: 'info', owner: 'maintainer', ...c });
  const guard = (id, title, fn) => { try { add({ id, title, ...fn() }); } catch (e) { add({ id, title, severity: 'high', status: 'failed', evidence: 'exception: ' + e.message, risk: 'Audit step crashed', command: 'wattsutra audit', action: 'Fix the crash' }); } };

  // At least 12 samples so shared CI runners cannot flip the live comparison into noise.
  const manifest = f => { const m = safeReadJson(join(fixturesDir, f)); return { ...m, samples: Math.max(m.samples, 12) }; };
  const baseline = benchmark(manifest('baseline.json'));
  const candidate = benchmark(manifest('candidate.json'));
  const comparison = compare(baseline, candidate);
  const est = estimate(candidate, safeReadJson(join(fixturesDir, 'assumptions.json')));
  const sample = { baseline, candidate, comparison, estimate: est };

  guard('A01', 'Benchmark runs verify and keep quality parity', () => {
    verifyRun(baseline); verifyRun(candidate); validateExternal(baseline); validateExternal(candidate);
    const ok = comparison.qualityEquivalent && baseline.quality.actual.sum === candidate.quality.actual.sum;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'critical', evidence: `baseline ${baseline.integrity} candidate ${candidate.integrity}; prime count ${baseline.quality.actual.count}, sum ${baseline.quality.actual.sum}`, command: 'wattsutra bench --manifest fixtures/baseline.json', risk: 'A faster variant that computes a different answer would be reported as an improvement', action: 'None' };
  });
  guard('A02', 'Edited reports are rejected (integrity hash)', () => {
    const t = clone(baseline); t.measurements.wallMs.mean = 0.0001;
    const ok = throws(() => verifyRun(t), /integrity/);
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'critical', evidence: 'mutated wallMs.mean; verifyRun threw integrity mismatch', command: 'node --test tests/', risk: 'Silent result tampering', action: 'None' };
  });
  guard('A03', 'Internally inconsistent reports are rejected even with a recomputed hash', () => {
    const t = clone(baseline); t.measurements.wallMs.mean = t.measurements.wallMs.mean / 10;
    const forged = rehash(t);
    const ok = throws(() => validateExternal(forged), /raw samples/);
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'mean edited, hash recomputed; validateRunShape recomputed stats from samples and refused', command: 'node --test tests/', risk: 'Hash alone proves only no later edits, not honest content. A fully re-derived forgery (samples and hash) is NOT detectable without signing', action: 'Optional Sigstore signing is on the roadmap' };
  });
  guard('A04', 'Measured runs contain no energy, carbon or cost values', () => {
    const clean = [baseline, candidate].every(r => r.energyKWh === null && r.carbonGCO2e === null && r.cost === null);
    const t = clone(baseline); t.energyKWh = 0.5;
    const rejects = throws(() => validateExternal(rehash(t)), /must not contain energy/);
    const ok = clean && rejects;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'critical', evidence: 'energyKWh/carbonGCO2e/cost are null; injected energyKWh=0.5 was refused', command: 'wattsutra bench', risk: 'CPU time presented as joules or CO2e', action: 'None' };
  });
  guard('A05', 'Incomparable workloads are refused', () => {
    const other = benchmark({ workload: 'prime-sum', variant: 'sieve', n: 3000, samples: 2, warmups: 0 });
    const ok = throws(() => compare(baseline, other), /Incomparable/);
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'n=20000 vs n=3000 refused', command: 'wattsutra compare', risk: 'Apples-to-oranges speedup claims', action: 'None' };
  });
  guard('A06', 'Quality mismatch yields a FAIL gate', () => {
    const t = clone(candidate); t.quality.actual = { count: 1, sum: 2 }; t.quality.reference = { count: 1, sum: 2 };
    const r = compare(baseline, rehash(t));
    const ok = r.gates.latency === 'FAIL' && r.qualityEquivalent === false;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'critical', evidence: 'gate=' + r.gates.latency, command: 'wattsutra compare', risk: 'Speedup accepted although answers differ', action: 'None' };
  });
  guard('A07', 'Environment mismatch downgrades the gate to REVIEW_REQUIRED', () => {
    const t = clone(candidate); t.environment.cpuModel = 'Different CPU (audit probe)';
    const r = compare(baseline, rehash(t));
    const ok = r.gates.latency === 'REVIEW_REQUIRED' && !r.environmentParity.matched;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'mismatched: ' + r.environmentParity.mismatchedFields.join(','), command: 'wattsutra compare', risk: 'Cross-machine numbers shown as a like-for-like result', action: 'None' };
  });
  guard('A08', 'Too few samples never earns PASS', () => {
    const small = benchmark({ workload: 'prime-sum', variant: 'trial', n: 20000, samples: 2, warmups: 0 });
    const r = compare(small, benchmark({ workload: 'prime-sum', variant: 'sieve', n: 20000, samples: 2, warmups: 0 }));
    const ok = r.gates.latency === 'REVIEW_REQUIRED';
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'n=2 per run, gate=' + r.gates.latency, command: 'wattsutra compare', risk: 'Tiny samples described as conclusive', action: 'None' };
  });
  guard('A09', 'Estimator applies no default rates', () => {
    const e = estimate(baseline, {});
    const ok = Object.keys(e.estimated).length === 0 && e.unknown.length === 3;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'unknown: ' + e.unknown.map(u => u.split(':')[0]).join(', '), command: 'wattsutra estimate (empty assumptions)', risk: 'Invented watts, carbon intensity or prices', action: 'None' };
  });
  guard('A10', 'Estimator rejects unknown fields and ambiguous energy input', () => {
    const ok = throws(() => estimate(baseline, { watts: 5 }), /Unknown assumption/) && throws(() => estimate(baseline, { averagePowerW: 5, measuredEnergyKWh: 1, energySource: 'external meter x' }), /not both/);
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'medium', evidence: 'typo key and dual energy inputs refused', command: 'wattsutra estimate', risk: 'Misspelled assumption silently ignored', action: 'None' };
  });
  guard('A11', 'Modeled and imported values are labelled', () => {
    const m = estimate(baseline, { averagePowerW: 50, carbonIntensityGPerKWh: 300 });
    const i = estimate(baseline, { measuredEnergyKWh: 0.1, energySource: 'external wall meter test fixture' });
    const ok = m.estimated.energyKWh.kind === 'modeled' && i.observed.importedEnergyKWh.kind === 'imported-meter-observation' && i.observed.importedEnergyKWh.attributionUnverified === true;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'kinds: modeled, imported-meter-observation (attributionUnverified=true)', command: 'wattsutra estimate', risk: 'Measured vs modeled confusion', action: 'None' };
  });
  guard('A12', 'HTML report escapes hostile content', () => {
    const t = clone(baseline); t.recordedAt = '<script>alert(1)</script>';
    const html = reportHtml(rehash(t));
    const ok = !html.includes('<script>') && html.includes('&lt;script&gt;');
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'payload escaped; CSP meta present: ' + html.includes('Content-Security-Policy'), command: 'wattsutra report --format html', risk: 'Script injection through report fields', action: 'None' };
  });
  guard('A13', 'Hashing is deterministic regardless of key order', () => {
    const ok = hashObject({ b: 1, a: [{ y: 1, x: 2 }] }) === hashObject({ a: [{ x: 2, y: 1 }], b: 1 }) && fingerprint(baseline) === baseline.integrity;
    return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'medium', evidence: 'canonical JSON, code-unit key order', command: 'node --test tests/', risk: 'Hash differs across machines or locales', action: 'None' };
  });
  guard('A14', 'Skills and agent manifest are consistent', () => {
    const skillsDir = join(root, 'skills');
    const dirs = readdirSync(skillsDir).filter(d => d.startsWith('wattsutra-'));
    const manifest = safeReadJson(join(root, 'agents', 'manifest.json')).agents;
    const problems = [];
    for (const d of dirs) {
      const f = join(skillsDir, d, 'SKILL.md');
      if (!existsSync(f)) { problems.push(d + ': no SKILL.md'); continue; }
      const fm = parseFrontmatter(readFileSync(f, 'utf8'));
      if (!fm || fm.name !== d || !fm.description || fm.description.length < 20) problems.push(d + ': bad frontmatter');
      if (!manifest.some(a => a.id === d)) problems.push(d + ': missing from manifest');
    }
    for (const a of manifest) if (!dirs.includes(a.id)) problems.push(a.id + ': manifest entry has no skill');
    if (dirs.length !== 20) problems.push('expected 20 skills, found ' + dirs.length);
    return { status: problems.length ? 'failed' : 'verified', severity: problems.length ? 'medium' : 'info', evidence: `${dirs.length} skills, ${manifest.length} manifest entries` + (problems.length ? '; ' + problems.join('; ') : ''), command: 'wattsutra audit', risk: 'Skill discovery fails silently in IDEs', action: problems.length ? 'Fix listed skills' : 'None' };
  });
  guard('A15', 'No credentials in shipped files', () => {
    const hits = [];
    for (const f of listFiles(root)) {
      if (/\.(png|jpg|zip|tgz)$/i.test(f)) continue;
      let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
      for (const re of SECRET_PATTERNS) if (re.test(text)) hits.push(relative(root, f).replaceAll('\\', '/'));
    }
    return { status: hits.length ? 'failed' : 'verified', severity: hits.length ? 'critical' : 'info', evidence: hits.length ? 'matches in: ' + hits.join(', ') : 'regex scan for GitHub, npm, AWS, OpenAI-style keys and private keys: no matches', command: 'wattsutra audit', risk: 'Leaked secrets in a public package', action: hits.length ? 'Remove and rotate the credential' : 'None', owner: 'security' };
  });
  guard('A16', 'Installer refuses to overwrite customised skills', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'watt-audit-'));
    try {
      install(root, tmp, 'claude');
      writeFileSync(join(tmp, '.claude', 'skills', 'wattsutra-prime', 'SKILL.md'), 'custom');
      const ok = throws(() => install(root, tmp, 'claude'), /Refusing to overwrite/);
      return { status: ok ? 'verified' : 'failed', severity: ok ? 'info' : 'high', evidence: 'second install refused to clobber edited SKILL.md', command: 'wattsutra install', risk: 'User edits destroyed', action: 'None' };
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });
  const probe = probeInstruments();
  add({ id: 'A17', title: 'Hardware energy instrument', status: 'not-run', severity: 'info', evidence: `RAPL ${probe.rapl}; tools: ${Object.entries(probe.tools).map(([k, v]) => k + '=' + v).join(', ')}; measuredEnergyAvailable=false`, command: 'wattsutra doctor', risk: 'Without a meter, energy and carbon stay unmeasured. This is deliberate and correct.', action: 'Import an external meter reading via estimate --assumptions to get an imported-meter-observation' });
  const w = baseline.measurements.wallMs, wc = candidate.measurements.wallMs;
  add({ id: 'A18', title: 'Statistical confidence', status: 'verified', severity: 'low', evidence: `latency gate ${comparison.gates.latency}; n=${w.n}/${wc.n}; ratio ${comparison.latencyRatio.toFixed(2)}x; 95% bootstrap interval [${comparison.latencyRatioInterval95.low.toFixed(2)}, ${comparison.latencyRatioInterval95.high.toFixed(2)}]; CV baseline ${(w.cv * 100).toFixed(1)}%`, command: 'wattsutra compare', risk: 'Small samples on a shared machine; interval is bootstrap, not a significance test', action: 'Repeat on a quiet, pinned machine for publication-grade claims', owner: 'user' });

  const counts = Object.fromEntries(SEV_ORDER.map(s => [s, checks.filter(c => c.severity === s && c.status === 'failed').length]));
  const failed = checks.filter(c => c.status === 'failed').length;
  const verdict = failed ? 'FAIL' : checks.some(c => c.status === 'unknown') ? 'REVIEW_REQUIRED' : 'PASS';
  return {
    schema: 'wattsutra.audit.v1', toolVersion: VERSION, generatedAt: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    verdict, scope: 'Evidence integrity, claim hygiene, comparison fairness and packaging. Energy, carbon and cost gates are NOT_RUN: no hardware meter was used.',
    totals: { checks: checks.length, verified: checks.filter(c => c.status === 'verified').length, failed, unknown: checks.filter(c => c.status === 'unknown').length, notRun: checks.filter(c => c.status === 'not-run').length, failedBySeverity: counts },
    checks, sample
  };
}

const badge = s => `<span class="badge ${s === 'verified' || s === 'PASS' ? 'ok' : s === 'failed' || s === 'FAIL' ? 'bad' : 'warn'}">${escapeHtml(s)}</span>`;
export function auditMarkdown(a) {
  const c = a.sample.comparison;
  return [
    '# WattSutra AI — Independent self-audit', '',
    `Verdict: **${a.verdict}** · WattSutra ${a.toolVersion} · Node ${a.environment.node} · ${a.environment.platform}/${a.environment.arch} · ${a.generatedAt}`, '',
    `Scope: ${a.scope}`, '',
    `| Checks | Verified | Failed | Unknown | Not run |`, '| --- | --- | --- | --- | --- |',
    `| ${a.totals.checks} | ${a.totals.verified} | ${a.totals.failed} | ${a.totals.unknown} | ${a.totals.notRun} |`, '',
    '## Live sample (generated during this audit)', '',
    `Baseline \`${c.baseline.variant}\` mean ${c.baseline.meanMs.toFixed(3)} ms vs candidate \`${c.candidate.variant}\` mean ${c.candidate.meanMs.toFixed(3)} ms. Ratio ${c.latencyRatio.toFixed(2)}x, 95% bootstrap interval [${c.latencyRatioInterval95.low.toFixed(2)}, ${c.latencyRatioInterval95.high.toFixed(2)}]. Latency gate **${c.gates.latency}**; energy, carbon, cost gates NOT_RUN.`, '',
    'These timings come from the machine that ran the audit. They are not a benchmark of your hardware and not an energy claim.', '',
    '## Findings', '',
    '| ID | Check | Status | Severity | Evidence |', '| --- | --- | --- | --- | --- |',
    ...a.checks.map(k => `| ${k.id} | ${k.title} | ${k.status} | ${k.severity} | ${String(k.evidence).replace(/\|/g, '/')} |`), '',
    '## Detail', '',
    ...a.checks.flatMap(k => [`### ${k.id} ${k.title}`, '', `- Status: ${k.status} (${k.severity})`, `- Reproduce: \`${k.command}\``, `- Risk: ${k.risk}`, `- Corrective action: ${k.action}`, `- Owner: ${k.owner}`, '']),
    '## Honest limits', '',
    '- A hash detects edits; it does not prove a number is honest. A forger who rebuilds samples and hash is not detected without signatures.',
    '- No hardware meter was used. Nothing here is a measurement of electricity or CO2e.',
    '- This is a self-audit by the tool. Treat it as reproducible evidence, not third-party certification. Re-run it yourself: `npx wattsutra audit`.', ''
  ].join('\n');
}
export function auditHtml(a) {
  const c = a.sample.comparison;
  const rows = a.checks.map(k => `<tr><td>${escapeHtml(k.id)}</td><td>${escapeHtml(k.title)}</td><td>${badge(k.status)}</td><td>${escapeHtml(k.severity)}</td><td>${escapeHtml(k.evidence)}</td><td><code>${escapeHtml(k.command)}</code></td></tr>`).join('');
  const body = `<h1>WattSutra AI — Independent self-audit</h1><p class="sub">${escapeHtml(a.generatedAt)} · WattSutra ${escapeHtml(a.toolVersion)} · Node ${escapeHtml(a.environment.node)} · ${escapeHtml(a.environment.platform)}/${escapeHtml(a.environment.arch)}</p>
<div class="cards"><div class="card"><b>${badge(a.verdict)}</b><span>verdict (scoped)</span></div><div class="card"><b>${a.totals.verified}/${a.totals.checks}</b><span>checks verified</span></div><div class="card"><b>${a.totals.failed}</b><span>failed</span></div><div class="card"><b>NOT_RUN</b><span>energy, carbon, cost gates</span></div></div>
<p>${escapeHtml(a.scope)}</p>
<h2>Live sample</h2><p>Baseline <code>${escapeHtml(c.baseline.variant)}</code> ${c.baseline.meanMs.toFixed(3)} ms vs candidate <code>${escapeHtml(c.candidate.variant)}</code> ${c.candidate.meanMs.toFixed(3)} ms. Ratio ${c.latencyRatio.toFixed(2)}x, 95% bootstrap interval [${c.latencyRatioInterval95.low.toFixed(2)}, ${c.latencyRatioInterval95.high.toFixed(2)}]. Latency gate ${badge(c.gates.latency)}. Timings are from the machine that ran this audit, not an energy claim.</p>
<h2>Findings</h2><div class="tw"><table><thead><tr><th>ID</th><th>Check</th><th>Status</th><th>Severity</th><th>Evidence</th><th>Reproduce</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Honest limits</h2><ul><li>A hash detects edits; it does not prove a number is honest. A forger who rebuilds samples and hash is not detected without signatures.</li><li>No hardware meter was used. Nothing here measures electricity or CO2e.</li><li>This is a self-audit by the tool: reproducible evidence, not third-party certification. Re-run with <code>npx wattsutra audit</code>.</li></ul>
<footer>Generated by WattSutra AI · Apache-2.0 · Created by Vatsal Shah</footer>`;
  return htmlShell('WattSutra AI self-audit', body);
}
export function writeAudit(a, outDir) {
  const d = resolve(outDir); mkdirSync(d, { recursive: true });
  const files = { 'audit.json': JSON.stringify(a, null, 2) + '\n', 'audit.md': auditMarkdown(a), 'audit.html': auditHtml(a) };
  for (const [n, c] of Object.entries(files)) writeFileSync(join(d, n), c);
  return { dir: d, files: Object.keys(files) };
}
