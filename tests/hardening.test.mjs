import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { benchmark, compare, estimate, validateExternal, hashObject, summarize, reportHtml, verifyRun, safeReadJson } from '../packages/core/engine.mjs';
import { install } from '../packages/core/install.mjs';
import { probeInstruments } from '../packages/core/probe.mjs';
import { runAudit, auditMarkdown, auditHtml, writeAudit } from '../packages/core/audit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const cli = (...a) => spawnSync(process.execPath, ['packages/cli/index.mjs', ...a], { cwd: root, encoding: 'utf8', timeout: 60000 });
const clone = v => JSON.parse(JSON.stringify(v));
const rehash = r => { const { integrity, ...b } = r; return { ...b, integrity: hashObject(b) }; };
const m = { workload: 'prime-sum', variant: 'trial', n: 4000, samples: 6, warmups: 0 };
const a = benchmark(m), b = benchmark({ ...m, variant: 'sieve' });

// minimal JSON Schema subset checker for the shipped schemas
function check(schema, v, path = '$') {
  const err = [];
  if (schema.const !== undefined && v !== schema.const) err.push(`${path}: expected const ${schema.const}`);
  if (schema.enum && !schema.enum.includes(v)) err.push(`${path}: not in enum`);
  if (schema.type) {
    const t = v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) && schema.type === 'integer' ? 'integer' : typeof v;
    const ok = schema.type === 'number' ? typeof v === 'number' : t === schema.type;
    if (!ok) { err.push(`${path}: expected ${schema.type}`); return err; }
  }
  if (typeof v === 'string' && schema.pattern && !new RegExp(schema.pattern).test(v)) err.push(`${path}: pattern`);
  if (typeof v === 'number') { if (schema.minimum !== undefined && v < schema.minimum) err.push(`${path}: < min`); if (schema.maximum !== undefined && v > schema.maximum) err.push(`${path}: > max`); }
  if (Array.isArray(v)) { if (schema.minItems && v.length < schema.minItems) err.push(`${path}: minItems`); if (schema.items) v.forEach((x, i) => err.push(...check(schema.items, x, `${path}[${i}]`))); }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const k of schema.required || []) if (!(k in v)) err.push(`${path}: missing ${k}`);
    for (const [k, s] of Object.entries(schema.properties || {})) if (k in v) err.push(...check(s, v[k], `${path}.${k}`));
  }
  return err;
}
const schema = n => JSON.parse(readFileSync(join(root, 'schemas', n + '.schema.json'), 'utf8'));

test('run validates against shipped JSON Schema', () => assert.deepEqual(check(schema('wattsutra.run.v1'), a), []));
test('comparison validates against shipped JSON Schema', () => assert.deepEqual(check(schema('wattsutra.comparison.v1'), compare(a, b)), []));
test('estimate validates against shipped JSON Schema', () => assert.deepEqual(check(schema('wattsutra.estimate.v1'), estimate(a, { averagePowerW: 10 })), []));
test('schema rejects a run carrying energy', () => assert.ok(check(schema('wattsutra.run.v1'), { ...a, energyKWh: 1 }).length > 0));

test('run has stable id, raw samples and manifest hash', () => {
  assert.match(a.runId, /^run-[0-9a-f]{16}$/);
  assert.equal(a.measurements.wallMs.samples.length, 6);
  assert.match(a.manifestHash, /^[0-9a-f]{64}$/);
});
test('stddev is the sample standard deviation', () => assert.ok(Math.abs(summarize([1, 3]).stddev - Math.SQRT2) < 1e-12));
test('forged run with recomputed hash but edited mean is rejected', () => {
  const t = clone(a); t.measurements.wallMs.mean /= 10;
  assert.throws(() => validateExternal(rehash(t)), /raw samples/);
});
test('run with injected energy is rejected even if rehashed', () => {
  const t = clone(a); t.energyKWh = 1;
  assert.throws(() => validateExternal(rehash(t)), /must not contain energy/);
});
test('run with mismatched quality is rejected', () => {
  const t = clone(a); t.quality.actual = { count: 0, sum: 0 };
  assert.throws(() => validateExternal(rehash(t)), /quality/);
});
test('canonical hash ignores locale-sensitive ordering', () => assert.equal(hashObject({ a: 1, B: 2, ä: 3 }), hashObject({ ä: 3, B: 2, a: 1 })));

test('compare: quality mismatch is FAIL', () => {
  const t = clone(b); t.quality = { kind: 'verified', reference: { count: 1, sum: 1 }, actual: { count: 1, sum: 1 } };
  const r = compare(a, rehash(t));
  assert.equal(r.gates.latency, 'FAIL'); assert.equal(r.qualityEquivalent, false);
});
test('compare: environment mismatch is REVIEW_REQUIRED', () => {
  const t = clone(b); t.environment.cpuModel = 'other';
  const r = compare(a, rehash(t));
  assert.equal(r.gates.latency, 'REVIEW_REQUIRED'); assert.deepEqual(r.environmentParity.mismatchedFields, ['cpuModel']);
});
test('compare: three samples never PASS', () => {
  const x = benchmark({ ...m, samples: 3 }), y = benchmark({ ...m, variant: 'sieve', samples: 3 });
  assert.equal(compare(x, y).gates.latency, 'REVIEW_REQUIRED');
});
test('compare: clear speedup with enough samples PASSes and energy gates stay NOT_RUN', () => {
  const x = benchmark({ ...m, n: 30000, samples: 12 }), y = benchmark({ ...m, n: 30000, variant: 'sieve', samples: 12 });
  const r = compare(x, y);
  assert.equal(r.gates.latency, 'PASS'); assert.ok(r.latencyRatio > 1);
  assert.deepEqual([r.gates.energy, r.gates.carbon, r.gates.cost], ['NOT_RUN', 'NOT_RUN', 'NOT_RUN']);
});
test('compare: slower candidate beyond interval is FAIL', () => {
  const x = benchmark({ ...m, n: 30000, variant: 'sieve', samples: 12 }), y = benchmark({ ...m, n: 30000, samples: 12 });
  assert.equal(compare(x, y).gates.latency, 'FAIL');
});
test('compare: bootstrap interval is deterministic for the same inputs', () => assert.deepEqual(compare(a, b).latencyRatioInterval95, compare(a, b).latencyRatioInterval95));

test('estimate rejects unknown fields', () => assert.throws(() => estimate(a, { watts: 3 }), /Unknown assumption/));
test('estimate rejects both meter and modeled power', () => assert.throws(() => estimate(a, { averagePowerW: 5, measuredEnergyKWh: 1, energySource: 'external wall meter' }), /not both/));
test('estimate rejects bad currency even without a rate', () => assert.throws(() => estimate(a, { currency: 'usd' }), /currency/));
test('estimate rejects non-object assumptions', () => assert.throws(() => estimate(a, [1])));

test('html report escapes injected fields and carries CSP', () => {
  const t = clone(a); t.recordedAt = '<img src=x onerror=alert(1)>';
  const h = reportHtml(rehash(t));
  assert.doesNotMatch(h, /<img src=x/); assert.match(h, /Content-Security-Policy/);
});
test('safeReadJson gives readable errors', () => {
  assert.throws(() => safeReadJson(''), /required/);
  assert.throws(() => safeReadJson(join(tmpdir(), 'nope-' + Date.now() + '.json')), /not found/);
  const d = mkdtempSync(join(tmpdir(), 'watt-bad-')); writeFileSync(join(d, 'x.json'), '{oops');
  try { assert.throws(() => safeReadJson(join(d, 'x.json')), /not valid JSON/); } finally { rmSync(d, { recursive: true, force: true }); }
});

test('probe finds nothing on an empty PATH and reports no measured energy', () => {
  const p = probeInstruments({ env: { PATH: '' }, raplPath: join(tmpdir(), 'no-rapl-here') });
  assert.equal(p.measuredEnergyAvailable, false); assert.equal(p.tools['nvidia-smi'], 'unavailable'); assert.equal(p.rapl, 'unavailable');
});
test('probe detects a fake instrument on PATH without executing it', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-probe-'));
  try {
    writeFileSync(join(d, process.platform === 'win32' ? 'nvidia-smi.exe' : 'nvidia-smi'), 'not executed');
    const p = probeInstruments({ env: { PATH: d, PATHEXT: '.EXE' }, raplPath: join(d, 'none') });
    assert.equal(p.tools['nvidia-smi'], 'detected-not-used'); assert.equal(p.measuredEnergyAvailable, false);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('install --dry-run writes nothing and reports the plan', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-dry-'));
  try {
    const r = install(root, d, 'all', { dryRun: true });
    assert.equal(r.dryRun, true); assert.equal(r.created, 100); assert.equal(readdirSync(d).length, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
test('install is idempotent', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-idem-'));
  try { install(root, d, 'codex'); const r = install(root, d, 'codex'); assert.equal(r.created, 0); assert.equal(r.unchanged, 20); } finally { rmSync(d, { recursive: true, force: true }); }
});
test('install reports a missing target clearly', () => assert.throws(() => install(root, join(tmpdir(), 'no-such-dir-' + Date.now()), 'claude'), /not found/));

test('skills: 20 skills, frontmatter matches directory, manifest agrees', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'agents/manifest.json'), 'utf8')).agents;
  const dirs = readdirSync(join(root, 'skills'));
  assert.equal(dirs.length, 20); assert.equal(manifest.length, 20);
  for (const d of dirs) {
    const text = readFileSync(join(root, 'skills', d, 'SKILL.md'), 'utf8');
    assert.match(text, new RegExp(`^---\\nname: ${d}\\ndescription: .{20,}\\n---`));
    assert.ok(manifest.some(x => x.id === d)); assert.ok(existsSync(join(root, 'agents', d + '.md')));
  }
  assert.ok(manifest.every(x => ['core', 'advisory'].includes(x.necessity)));
});

test('audit: all checks verified or not-run, verdict PASS, outputs MD/HTML/JSON', () => {
  const a2 = runAudit({ root });
  assert.equal(a2.totals.failed, 0, JSON.stringify(a2.checks.filter(c => c.status === 'failed')));
  assert.equal(a2.verdict, 'PASS'); assert.ok(a2.checks.length >= 18);
  const d = mkdtempSync(join(tmpdir(), 'watt-audit-out-'));
  try {
    const w = writeAudit(a2, d);
    assert.deepEqual(w.files.sort(), ['audit.html', 'audit.json', 'audit.md']);
    assert.match(auditMarkdown(a2), /Honest limits/); assert.match(auditHtml(a2), /<!doctype html>/);
    assert.doesNotMatch(auditHtml(a2), /<script/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('cli --version and unknown command', () => {
  assert.match(cli('--version').stdout, /^\d+\.\d+\.\d+/);
  const r = cli('frobnicate'); assert.equal(r.status, 2); assert.match(r.stderr, /unknown command/);
});
test('cli verify exits 1 on tamper and 0 on good file', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-ver-'));
  try {
    writeFileSync(join(d, 'ok.json'), JSON.stringify(a)); const t = clone(a); t.measurements.wallMs.mean = 1e-6; writeFileSync(join(d, 'bad.json'), JSON.stringify(t));
    assert.equal(cli('verify', '--input', join(d, 'ok.json')).status, 0);
    assert.equal(cli('verify', '--input', join(d, 'bad.json')).status, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
test('cli compare exits 1 on quality FAIL', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-cmp-'));
  try {
    const t = clone(b); t.quality = { kind: 'verified', reference: { count: 1, sum: 1 }, actual: { count: 1, sum: 1 } };
    writeFileSync(join(d, 'a.json'), JSON.stringify(a)); writeFileSync(join(d, 'b.json'), JSON.stringify(rehash(t)));
    assert.equal(cli('compare', '--baseline', join(d, 'a.json'), '--candidate', join(d, 'b.json')).status, 1);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
test('cli audit writes three files and exits 0', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-cliaudit-'));
  try { const r = cli('audit', '--out', d); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /Verdict: PASS/); assert.ok(existsSync(join(d, 'audit.html'))); } finally { rmSync(d, { recursive: true, force: true }); }
});
test('cli doctor reports instruments and no measured energy', () => assert.equal(JSON.parse(cli('doctor').stdout).instruments.measuredEnergyAvailable, false));
test('cli install --dry-run leaves the target empty', () => {
  const d = mkdtempSync(join(tmpdir(), 'watt-clidry-'));
  try { const r = cli('install', '--target', d, '--ide', 'claude', '--dry-run'); assert.equal(r.status, 0, r.stderr); assert.equal(readdirSync(d).length, 0); } finally { rmSync(d, { recursive: true, force: true }); }
});
test('shipped example reports verify', () => {
  for (const f of ['baseline', 'candidate']) { const p = join(root, 'examples/reports', f + '.json'); if (existsSync(p)) assert.equal(verifyRun(safeReadJson(p)), true); }
});
