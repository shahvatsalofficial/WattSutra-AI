// Runs the real CLI for every documented scenario and saves the output to evidence/scenarios.json.
// Timings differ per machine, so the output is captured once and committed; the site build only reads it.
// Run: npm run docs:scenarios
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { VERSION, hashObject } from '../../packages/core/engine.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'watt-scn-'));
const f = n => path.join(tmp, n);
const read = n => JSON.parse(fs.readFileSync(f(n), 'utf8'));
const write = (n, v) => fs.writeFileSync(f(n), JSON.stringify(v));
function cli(...args) {
  const r = spawnSync(process.execPath, [path.join(root, 'packages/cli/index.mjs'), ...args], { cwd: tmp, encoding: 'utf8' });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}
const cmd = a => '$ wattsutra ' + a;
const rehash = run => { const { integrity, ...b } = run; return { ...b, integrity: hashObject(b) }; };
const run = (name, variant, samples = 12) => {
  write(name + '.manifest.json', { workload: 'prime-sum', variant, n: 20000, warmups: 2, samples });
  const r = cli('bench', '--manifest', name + '.manifest.json', '--out', name + '.json');
  if (r.code !== 0) throw Error(r.err);
};
const compare = (a, b) => {
  const r = cli('compare', '--baseline', a, '--candidate', b);
  const j = JSON.parse(r.out);
  return {
    code: r.code,
    lines: [cmd(`compare --baseline ${a} --candidate ${b}`),
      `baseline  ${j.baseline.meanMs.toFixed(3)} ms   candidate ${j.candidate.meanMs.toFixed(3)} ms`,
      `ratio     ${j.latencyRatio.toFixed(2)}x  (95% interval ${j.latencyRatioInterval95.low.toFixed(2)} to ${j.latencyRatioInterval95.high.toFixed(2)})`,
      `latency gate: ${j.gates.latency}`, `energy gate:  ${j.gates.energy}`, `carbon gate:  ${j.gates.carbon}`, `cost gate:    ${j.gates.cost}`,
      'reason: ' + j.gateReasons[0], 'exit code: ' + r.code]
  };
};
const expect = (cond, what) => { if (!cond) throw Error('scenario no longer behaves as documented: ' + what); };

run('main', 'trial'); run('branch', 'sieve');
const s = {};
const c1 = compare('main.json', 'branch.json'); expect(c1.lines.includes('latency gate: PASS'), 's1'); s.s1 = c1.lines;

const wrong = read('branch.json'); wrong.quality.actual = { count: 2261, sum: 21171000 }; wrong.quality.reference = { ...wrong.quality.actual }; write('wrong.json', rehash(wrong));
const c2 = compare('main.json', 'wrong.json'); expect(c2.code === 1, 's2');
s.s2 = ['# simulated: a candidate whose result differs by one prime', ...c2.lines];

const other = read('branch.json'); other.environment.cpuModel = 'Shared CI runner CPU'; other.environment.logicalCores = 4; write('runner.json', rehash(other));
const c3 = compare('main.json', 'runner.json'); expect(c3.lines.includes('latency gate: REVIEW_REQUIRED'), 's3');
s.s3 = ['# simulated: candidate recorded on a different machine', ...c3.lines];

const edited = read('branch.json'); edited.measurements.wallMs.mean = 0.001; write('edited.json', edited); write('forged.json', rehash(edited));
const v1 = cli('verify', '--input', 'edited.json'), v2 = cli('verify', '--input', 'forged.json'); expect(v1.code === 1 && v2.code === 1, 's4');
s.s4 = ['# 1) someone edits the mean in the file', cmd('verify --input edited.json'), v1.err, 'exit code: ' + v1.code, '', '# 2) they also recompute the hash', cmd('verify --input forged.json'), v2.err, 'exit code: ' + v2.code];

const est = (name, assumptions) => {
  write(name, assumptions);
  const r = cli('estimate', '--run', 'branch.json', '--assumptions', name); expect(r.code === 0, name);
  return { r, j: JSON.parse(r.out) };
};
const empty = est('empty.json', {});
const model = est('model.json', { averagePowerW: 65, carbonIntensityGPerKWh: 380 });
s.s5 = ['# nothing supplied: nothing invented', cmd('estimate --run branch.json --assumptions empty.json'), ...empty.j.unknown.map(u => 'unknown: ' + u), '', '# your assumptions (illustrative values)', cmd('estimate --run branch.json --assumptions model.json'),
  `energyKWh:        ${model.j.estimated.energyKWh.value.toExponential(3)}  (${model.j.estimated.energyKWh.kind})`,
  `operationalGCO2e: ${model.j.estimated.operationalGCO2e.value.toExponential(3)}  (${model.j.estimated.operationalGCO2e.kind})`,
  ...model.j.unknown.map(u => 'unknown: ' + u)];

const meter = est('meter.json', { measuredEnergyKWh: 0.0004, energySource: 'wall plug meter, 60 s window (example)' });
const o = meter.j.observed.importedEnergyKWh;
s.s6 = [cmd('estimate --run branch.json --assumptions meter.json'), `value:  ${o.value} kWh`, `kind:   ${o.kind}`, `source: ${o.source}`, `attributionUnverified: ${o.attributionUnverified}`];

const project = f('my-project'); fs.mkdirSync(project);
const i = cli('install', '--target', 'my-project', '--ide', 'claude', '--dry-run'); expect(i.code === 0, 's7');
const ij = JSON.parse(i.out);
s.s7 = [cmd('install --target my-project --ide claude --dry-run'), `dryRun: ${ij.dryRun}`, `skill files planned: ${ij.skillFilesInstalledOrVerified}`, `would create: ${ij.created}`, 'files written: none'];

const out = { schema: 'wattsutra.scenarios/v1', toolVersion: VERSION, recordedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform }, scenarios: s };
fs.writeFileSync(path.join(root, 'documents/WattSutra-AI/evidence/scenarios.json'), JSON.stringify(out, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log('captured', Object.keys(s).length, 'scenarios');
