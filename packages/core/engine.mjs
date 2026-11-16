// WattSutra AI core engine. Pure Node.js standard library, no network, no child processes.
// Evidence taxonomy: measured | imported-meter-observation | modeled | inferred | not-run | missing | unsupported.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import os from 'node:os';

export const VERSION = '0.2.1';
export const SCHEMA = 'wattsutra.run.v1';
export const COMPARISON_SCHEMA = 'wattsutra.comparison.v1';
export const ESTIMATE_SCHEMA = 'wattsutra.estimate.v1';
export const VARIANTS = ['trial', 'sieve'];
export const MAX_SAMPLES = 60;
export const MAX_N = 100000;
const MIN_SAMPLES_FOR_GATE = 5;
const BOOTSTRAP_RESAMPLES = 2000;
const BOOTSTRAP_SEED = 0x57a77;

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const codeUnitCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Canonical JSON: keys sorted by UTF-16 code unit (locale independent) so hashes are identical on every host.
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort(codeUnitCompare).map(k => [k, canonical(v[k])]));
  }
  return v;
}
export function hashObject(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export function checkNumber(v, label, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) {
  if (!isNum(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw Error(`Invalid ${label}`);
  return v;
}

// Descriptive statistics. stddev is the SAMPLE standard deviation (n-1). Percentiles use linear interpolation
// and are only indicative for small n; no significance is claimed from this function.
export function summarize(samples) {
  if (!Array.isArray(samples) || !samples.length || samples.some(v => !isNum(v) || v < 0)) {
    throw Error('Non-empty nonnegative finite samples required');
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const at = q => { const pos = (n - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo); };
  const stddev = n > 1 ? Math.sqrt(sorted.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)) : 0;
  return { n, min: sorted[0], max: sorted[n - 1], mean, median: at(0.5), p95: at(0.95), stddev, stddevKind: 'sample (n-1)', cv: mean > 0 ? stddev / mean : null };
}

export function primes(n, method) {
  checkNumber(n, 'n', { min: 2, max: MAX_N, integer: true });
  let sum = 0, count = 0;
  if (method === 'sieve') {
    const flags = new Uint8Array(n + 1);
    for (let p = 2; p * p <= n; p++) if (!flags[p]) for (let k = p * p; k <= n; k += p) flags[k] = 1;
    for (let i = 2; i <= n; i++) if (!flags[i]) { sum += i; count++; }
  } else if (method === 'trial') {
    for (let x = 2; x <= n; x++) {
      let prime = true;
      for (let p = 2; p * p <= x; p++) if (x % p === 0) { prime = false; break; }
      if (prime) { sum += x; count++; }
    }
  } else throw Error('Unknown allowlisted workload variant');
  return { count, sum };
}

export function validateManifest(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw Error('Manifest must be a JSON object');
  if (config.workload !== 'prime-sum' || !VARIANTS.includes(config.variant)) throw Error('Only allowlisted prime-sum workload variants are supported');
  checkNumber(config.n, 'workload n', { min: 2, max: MAX_N, integer: true });
  checkNumber(config.samples, 'samples', { min: 2, max: MAX_SAMPLES, integer: true });
  const warmups = config.warmups ?? 1;
  checkNumber(warmups, 'warmups', { min: 0, max: 10, integer: true });
  return { ...config, warmups };
}

export function fingerprint(run) { const { integrity, ...body } = run; return hashObject(body); }
export function verifyRun(run) {
  if (!run || run.schema !== SCHEMA || !run.integrity || fingerprint(run) !== run.integrity) throw Error('Benchmark report integrity mismatch');
  return true;
}

function environment() {
  const load = os.loadavg();
  return {
    platform: process.platform, arch: process.arch, node: process.version,
    cpuModel: os.cpus()[0]?.model || 'unknown', logicalCores: os.cpus().length,
    osRelease: os.release(), totalMemBytes: os.totalmem(),
    loadAvg1m: process.platform === 'win32' ? null : load[0]
  };
}

export function benchmark(manifest) {
  const c = validateManifest(manifest);
  const baseline = primes(c.n, 'trial');
  const outcome = primes(c.n, c.variant);
  if (outcome.count !== baseline.count || outcome.sum !== baseline.sum) throw Error('Workload correctness verification failed');
  for (let i = 0; i < c.warmups; i++) primes(c.n, c.variant);
  const wall = [], cpu = [], rss = [];
  for (let i = 0; i < c.samples; i++) {
    const before = process.cpuUsage(), start = process.hrtime.bigint();
    const result = primes(c.n, c.variant);
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    const used = process.cpuUsage(before);
    if (result.sum !== baseline.sum || result.count !== baseline.count) throw Error('Workload quality regression');
    wall.push(elapsed); cpu.push((used.user + used.system) / 1000); rss.push(process.memoryUsage().rss);
  }
  const measure = (samples, unit) => ({ kind: 'measured', ...summarize(samples), unit, samples });
  const body = {
    schema: SCHEMA, product: 'WattSutra AI', toolVersion: VERSION, workloadId: 'prime-sum',
    manifestHash: hashObject({ workload: c.workload, variant: c.variant, n: c.n, samples: c.samples, warmups: c.warmups }),
    workload: { n: c.n, variant: c.variant, functionalUnit: 'one complete prime-sum job', checksum: hashObject(outcome) },
    environment: environment(),
    methodology: {
      version: 'offline-probe-v1', warmups: c.warmups, qualityCheck: 'reference trial prime count and sum',
      sampleScope: 'single process, sequential', rssScope: 'whole Node.js process (not incremental workload bytes)',
      cpuScope: 'process cpuUsage for measured interval (not system energy)', equipment: 'no power meter',
      clock: 'process.hrtime.bigint (monotonic)', confidence: 'timing and process CPU sampled; memory process-wide'
    },
    measurements: { wallMs: measure(wall, 'ms'), cpuMs: measure(cpu, 'ms'), rssBytes: measure(rss, 'bytes') },
    unmeasured: ['GPU energy', 'CPU electrical power', 'electricity kWh', 'CO2e', 'cloud billing cost', 'end-to-end inference quality'],
    energyKWh: null, carbonGCO2e: null, cost: null,
    quality: { kind: 'verified', reference: baseline, actual: outcome },
    recordedAt: new Date().toISOString()
  };
  const withId = { ...body, runId: 'run-' + hashObject(body).slice(0, 16) };
  return { ...withId, integrity: hashObject(withId) };
}

const STAT_KEYS = ['n', 'min', 'max', 'mean', 'median', 'p95', 'stddev', 'cv'];
// Structural validation of a run. verifyRun proves the file was not edited after creation; this proves the
// content is internally consistent (summaries recomputed from raw samples, no energy/carbon/cost claims).
export function validateRunShape(run) {
  const fail = why => { throw Error('Unsupported benchmark schema: ' + why); };
  if (run.workloadId !== 'prime-sum') fail('workloadId');
  if (!run.workload || !VARIANTS.includes(run.workload.variant) || !Number.isInteger(run.workload.n) || run.workload.n < 2 || run.workload.n > MAX_N) fail('workload');
  if (!run.workload.functionalUnit) fail('functionalUnit');
  if (!run.methodology?.sampleScope) fail('methodology.sampleScope');
  if (!run.environment || typeof run.environment !== 'object') fail('environment');
  if (run.energyKWh !== null || run.carbonGCO2e !== null || run.cost !== null) fail('a measured run must not contain energy, carbon or cost values');
  for (const [name, unit] of [['wallMs', 'ms'], ['cpuMs', 'ms'], ['rssBytes', 'bytes']]) {
    const m = run.measurements?.[name];
    if (!m || m.kind !== 'measured' || m.unit !== unit || !Array.isArray(m.samples)) fail('measurements.' + name);
    let again;
    try { again = summarize(m.samples); } catch { fail('measurements.' + name + ' samples'); }
    for (const k of STAT_KEYS) if (m[k] !== again[k]) fail(`measurements.${name}.${k} does not match its raw samples`);
  }
  if (run.measurements.wallMs.mean <= 0) fail('wallMs mean must be positive');
  const q = run.quality;
  if (!q?.reference || !q?.actual || q.reference.sum !== q.actual.sum || q.reference.count !== q.actual.count) fail('quality reference differs from actual');
  return run;
}
export function validateExternal(run) { verifyRun(run); return validateRunShape(run); }

// mulberry32: tiny seeded PRNG so bootstrap intervals are reproducible.
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const medianOf = xs => { const v = [...xs].sort((a, b) => a - b), h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
function bootstrapRatio(base, cand) {
  const rnd = prng(BOOTSTRAP_SEED), ratios = [];
  const draw = xs => { const out = new Array(xs.length); for (let i = 0; i < xs.length; i++) out[i] = xs[Math.floor(rnd() * xs.length)]; return medianOf(out); };
  for (let i = 0; i < BOOTSTRAP_RESAMPLES; i++) { const c = draw(cand); if (c > 0) ratios.push(draw(base) / c); }
  ratios.sort((a, b) => a - b);
  const q = p => ratios[Math.min(ratios.length - 1, Math.max(0, Math.floor(p * ratios.length)))];
  return { low: q(0.025), high: q(0.975), resamples: ratios.length, seed: BOOTSTRAP_SEED, method: 'percentile bootstrap of median(baseline)/median(candidate); medians resist outliers such as GC pauses' };
}

const ENV_KEYS = ['platform', 'arch', 'node', 'cpuModel', 'logicalCores'];
// Compare two runs. Throws on incomparable workloads. Returns per-scope gates:
// PASS (scoped latency evidence complete) | FAIL (quality or policy violation) | REVIEW_REQUIRED | NOT_RUN.
export function compare(a, b) {
  validateExternal(a); validateExternal(b);
  const same = a.workloadId === b.workloadId && a.workload.n === b.workload.n && a.workload.functionalUnit === b.workload.functionalUnit && a.methodology.sampleScope === b.methodology.sampleScope;
  if (!same) throw Error('Incomparable workloads: workload ID, n, unit and scope must match');
  const bm = a.measurements.wallMs.mean, cm = b.measurements.wallMs.mean;
  const qualityEquivalent = a.quality.actual.sum === b.quality.actual.sum && a.quality.actual.count === b.quality.actual.count;
  const envMismatch = ENV_KEYS.filter(k => a.environment[k] !== b.environment[k]);
  const ci = bootstrapRatio(a.measurements.wallMs.samples, b.measurements.wallMs.samples);
  const enoughSamples = a.measurements.wallMs.n >= MIN_SAMPLES_FOR_GATE && b.measurements.wallMs.n >= MIN_SAMPLES_FOR_GATE;
  const ciExcludesNoChange = ci.low > 1 || ci.high < 1;
  const reasons = [];
  let latencyGate;
  if (!qualityEquivalent) { latencyGate = 'FAIL'; reasons.push('Quality mismatch: results differ, so no performance claim is allowed'); }
  else if (envMismatch.length) { latencyGate = 'REVIEW_REQUIRED'; reasons.push('Environment differs (' + envMismatch.join(', ') + '): comparison is exploratory only'); }
  else if (!enoughSamples) { latencyGate = 'REVIEW_REQUIRED'; reasons.push(`Fewer than ${MIN_SAMPLES_FOR_GATE} samples per run: too few to support a conclusion`); }
  else if (!ciExcludesNoChange) { latencyGate = 'REVIEW_REQUIRED'; reasons.push('95% bootstrap interval includes no change: difference not distinguishable from noise'); }
  else if (ci.high < 1) { latencyGate = 'FAIL'; reasons.push('Candidate is slower than baseline beyond the 95% bootstrap interval (latency regression)'); }
  else { latencyGate = 'PASS'; reasons.push('Candidate faster with equal quality, matched environment and an interval that excludes no change'); }
  return {
    schema: COMPARISON_SCHEMA, toolVersion: VERSION,
    baseline: { runId: a.runId, variant: a.workload.variant, hash: a.integrity, meanMs: bm, samples: a.measurements.wallMs.n },
    candidate: { runId: b.runId, variant: b.workload.variant, hash: b.integrity, meanMs: cm, samples: b.measurements.wallMs.n },
    sameWorkload: true, qualityEquivalent,
    environmentParity: { matched: envMismatch.length === 0, mismatchedFields: envMismatch },
    latencyRatio: bm / cm,
    latencyRatioMedian: medianOf(a.measurements.wallMs.samples) / medianOf(b.measurements.wallMs.samples), latencyChangePercent: (cm / bm - 1) * 100,
    latencyRatioInterval95: ci,
    gates: { latency: latencyGate, energy: 'NOT_RUN', carbon: 'NOT_RUN', cost: 'NOT_RUN' },
    gateReasons: reasons,
    measurementOnly: true, energySaving: null, carbonSaving: null, costSaving: null,
    notes: [
      'Differences reflect these local benchmark runs, not guaranteed future performance',
      'No electrical power, carbon, or cost saving is inferred from latency alone',
      'Energy, carbon and cost gates are NOT_RUN: no meter or user-supplied model was provided to this comparison'
    ]
  };
}

const ESTIMATE_KEYS = ['averagePowerW', 'measuredEnergyKWh', 'energySource', 'carbonIntensityGPerKWh', 'ratePerJob', 'currency', 'embodiedGCO2e', 'workUnits'];
// Explicit-inputs-only estimates. Nothing is defaulted. Unknown stays unknown.
export function estimate(run, assumptions) {
  validateExternal(run);
  if (!assumptions || typeof assumptions !== 'object' || Array.isArray(assumptions)) throw Error('Explicit assumption file required');
  const extra = Object.keys(assumptions).filter(k => !ESTIMATE_KEYS.includes(k));
  if (extra.length) throw Error('Unknown assumption fields: ' + extra.join(', '));
  const out = {
    schema: ESTIMATE_SCHEMA, toolVersion: VERSION, sourceHash: run.integrity, method: 'explicit-inputs-only',
    estimated: {}, observed: {}, unknown: [], assumptions: {},
    caveats: [
      'No default electricity, carbon or pricing rates are applied',
      'Process elapsed time cannot directly measure electrical energy',
      'SCI score not claimed without full boundary, functional unit and embodied methodology'
    ]
  };
  const { averagePowerW, measuredEnergyKWh, energySource, carbonIntensityGPerKWh, ratePerJob, currency, embodiedGCO2e, workUnits } = assumptions;
  if (measuredEnergyKWh !== undefined && averagePowerW !== undefined) throw Error('Supply either measuredEnergyKWh or averagePowerW, not both');
  if (currency !== undefined && !/^[A-Z]{3}$/.test(currency)) throw Error('3-letter currency required with cost rate');
  let energy = null;
  if (measuredEnergyKWh !== undefined) {
    checkNumber(measuredEnergyKWh, 'meter energy kWh');
    if (typeof energySource !== 'string' || energySource.length < 8) throw Error('Measured energy needs a declared independent meter/source');
    energy = measuredEnergyKWh;
    out.observed.importedEnergyKWh = { value: energy, kind: 'imported-meter-observation', source: energySource, attributionUnverified: true };
  } else if (averagePowerW !== undefined) {
    checkNumber(averagePowerW, 'average power W', { max: 1000000 });
    energy = averagePowerW * (run.measurements.wallMs.mean / 3600000) / 1000;
    out.estimated.energyKWh = { value: energy, kind: 'modeled', formula: 'user-supplied averagePowerW × observed wall-hours / 1000', boundary: 'declared power scope; may not equal process energy' };
    out.assumptions.averagePowerW = averagePowerW;
  } else out.unknown.push('energyKWh: no meter observation or explicitly supplied average power');
  if (carbonIntensityGPerKWh !== undefined) {
    checkNumber(carbonIntensityGPerKWh, 'gCO2e/kWh', { max: 100000 });
    out.assumptions.carbonIntensityGPerKWh = carbonIntensityGPerKWh;
    if (energy !== null) out.estimated.operationalGCO2e = { value: energy * carbonIntensityGPerKWh, kind: 'modeled', formula: 'energyKWh × user-provided carbonIntensityGPerKWh' };
    else out.unknown.push('operationalGCO2e: energy unavailable');
  } else out.unknown.push('operationalGCO2e: carbon intensity not provided');
  if (embodiedGCO2e !== undefined) { checkNumber(embodiedGCO2e, 'embodied gCO2e'); out.assumptions.embodiedGCO2e = embodiedGCO2e; }
  if (workUnits !== undefined) { checkNumber(workUnits, 'work units', { min: 1, max: 1e9 }); out.assumptions.workUnits = workUnits; }
  if (energy !== null && carbonIntensityGPerKWh !== undefined && embodiedGCO2e !== undefined && workUnits !== undefined) {
    out.estimated.sciLikeGPerUnit = { value: (energy * carbonIntensityGPerKWh + embodiedGCO2e) / workUnits, kind: 'modeled-sci-like', note: 'Not a standards-conformance claim; independent boundary/allocation review required' };
  }
  if (ratePerJob !== undefined) {
    checkNumber(ratePerJob, 'rate per job', { max: 1e9 });
    if (!currency) throw Error('3-letter currency required with cost rate');
    out.estimated.cost = { value: ratePerJob, kind: 'modeled', unit: currency + '/job', source: 'user-supplied price; not observed billing' };
    out.assumptions.ratePerJob = ratePerJob; out.assumptions.currency = currency;
  } else out.unknown.push('cost: rate not supplied');
  return out;
}

export function safeReadJson(path, limit = 4 * 1024 * 1024) {
  if (!path) throw Error('Input file path required');
  const file = resolve(path);
  let st;
  try { st = lstatSync(file); } catch (e) { if (e.code === 'ENOENT') throw Error('File not found: ' + path); throw e; }
  if (!st.isFile() || st.isSymbolicLink() || st.size > limit) throw Error('Input must be a regular file within size limit');
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { throw Error('Input is not valid JSON: ' + path); }
}
export function writeJson(path, body) {
  const p = resolve(path); mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(body, null, 2) + '\n', { flag: 'w', mode: 0o600 });
  return p;
}
export function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function reportMarkdown(run) {
  verifyRun(run);
  const w = run.measurements.wallMs;
  return `# WattSutra AI — Measured Benchmark\n\n- Workload: ${run.workloadId} / ${run.workload.variant} (${run.workload.n})\n- Actual mean latency: ${w.mean.toFixed(4)} ms, p95 ${w.p95.toFixed(4)} ms; ${w.n} samples\n- Process CPU mean: ${run.measurements.cpuMs.mean.toFixed(4)} ms\n- Process RSS mean: ${Math.round(run.measurements.rssBytes.mean)} bytes; **not incremental workload memory**\n- Energy: **not measured**\n- Carbon: **not measured**\n- Cost: **not measured**\n- Quality: reference result verified\n- Evidence SHA-256: ${run.integrity}\n\nSource note: CPU time and RSS cannot be converted to energy without measured power or explicitly stated modeling assumptions.\n`;
}
export function reportCsv(run) {
  verifyRun(run);
  const rows = [['metric', 'value', 'unit', 'kind'], ['wall_time_mean', run.measurements.wallMs.mean, 'ms', 'measured'], ['wall_time_p95', run.measurements.wallMs.p95, 'ms', 'measured'], ['cpu_process_time_mean', run.measurements.cpuMs.mean, 'ms', 'measured'], ['rss_process_mean', run.measurements.rssBytes.mean, 'bytes', 'measured-process-wide'], ['electrical_energy', '', 'kWh', 'not-measured'], ['carbon', '', 'gCO2e', 'not-measured'], ['actual_cost', '', 'currency', 'not-measured']];
  return rows.map(row => row.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
}

export const REPORT_CSS = `:root{--bg:#f6f8fb;--fg:#0f172a;--mut:#475569;--card:#fff;--bd:#d9e1ec;--ac:#0f766e;--ok:#166534;--okbg:#dcfce7;--warn:#854d0e;--warnbg:#fef9c3;--bad:#991b1b;--badbg:#fee2e2;--code:#eef2f7}@media(prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#e6edf7;--mut:#9fb0c7;--card:#121b2e;--bd:#25324a;--ac:#5eead4;--ok:#86efac;--okbg:#14532d;--warn:#fde68a;--warnbg:#422006;--bad:#fca5a5;--badbg:#450a0a;--code:#1a2540}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:980px;margin:0 auto;padding:32px 20px 72px}h1{font-size:1.9rem;line-height:1.2;margin:.2em 0}h2{margin-top:2em;border-bottom:1px solid var(--bd);padding-bottom:.25em}.sub{color:var(--mut);margin:0 0 1.2em}.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card);font-size:.93rem}th,td{border:1px solid var(--bd);padding:8px 10px;text-align:left;vertical-align:top}th{background:var(--code)}code,pre{background:var(--code);border-radius:6px;font:.88em ui-monospace,Consolas,monospace}code{padding:.1em .35em;word-break:break-all}pre{padding:12px;overflow:auto}.badge{display:inline-block;padding:.1em .6em;border-radius:999px;font-weight:600;font-size:.82rem;border:1px solid currentColor}.ok{color:var(--ok);background:var(--okbg)}.warn{color:var(--warn);background:var(--warnbg)}.bad{color:var(--bad);background:var(--badbg)}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px}.card b{display:block;font-size:1.5rem}.card span{color:var(--mut);font-size:.85rem}footer{color:var(--mut);font-size:.85rem;margin-top:40px}@media print{body{background:#fff}}`;
export const htmlShell = (title, body) => '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>' + escapeHtml(title) + '</title><style>' + REPORT_CSS + '</style></head><body><main>' + body + '</main></body></html>\n';

export function reportHtml(run) {
  verifyRun(run);
  const w = run.measurements.wallMs, c = run.measurements.cpuMs, r = run.measurements.rssBytes;
  const row = (m, v, u, kind) => `<tr><td>${escapeHtml(m)}</td><td>${escapeHtml(v)}</td><td>${escapeHtml(u)}</td><td><span class="badge ${kind === 'measured' ? 'ok' : 'warn'}">${escapeHtml(kind)}</span></td></tr>`;
  const body = `<h1>WattSutra AI — Measured Benchmark</h1><p class="sub">Run <code>${escapeHtml(run.runId || 'n/a')}</code> · ${escapeHtml(run.recordedAt)} · tool ${escapeHtml(run.toolVersion || 'n/a')}</p>
<div class="cards"><div class="card"><b>${w.mean.toFixed(3)} ms</b><span>mean wall time (n=${w.n})</span></div><div class="card"><b>${w.p95.toFixed(3)} ms</b><span>p95 (indicative only at small n)</span></div><div class="card"><b>${c.mean.toFixed(3)} ms</b><span>mean process CPU time</span></div><div class="card"><b>not measured</b><span>electrical energy, carbon, cost</span></div></div>
<h2>Metrics</h2><div class="tw"><table><thead><tr><th>Metric</th><th>Value</th><th>Unit</th><th>Evidence kind</th></tr></thead><tbody>${row('Wall time, mean', w.mean.toFixed(4), 'ms', 'measured')}${row('Wall time, sample std dev', w.stddev.toFixed(4), 'ms', 'measured')}${row('Process CPU time, mean', c.mean.toFixed(4), 'ms', 'measured')}${row('Process RSS, mean (whole process)', String(Math.round(r.mean)), 'bytes', 'measured')}${row('Electrical energy', 'n/a', 'kWh', 'not-measured')}${row('Carbon', 'n/a', 'gCO2e', 'not-measured')}${row('Cost', 'n/a', 'currency', 'not-measured')}</tbody></table></div>
<h2>Workload</h2><p><code>${escapeHtml(run.workloadId)}</code> / <code>${escapeHtml(run.workload.variant)}</code>, n=${escapeHtml(run.workload.n)}. Functional unit: ${escapeHtml(run.workload.functionalUnit)}. Quality: reference result verified (<span class="badge ok">verified</span>).</p>
<h2>Environment</h2><p>${escapeHtml(run.environment.platform)}/${escapeHtml(run.environment.arch)}, Node ${escapeHtml(run.environment.node)}, ${escapeHtml(run.environment.logicalCores)} logical cores, ${escapeHtml(run.environment.cpuModel)}.</p>
<h2>Evidence</h2><p>SHA-256 integrity: <code>${escapeHtml(run.integrity)}</code></p><p>CPU time and RSS cannot be converted to energy without measured power or explicitly stated modeling assumptions. The hash detects edits; it is not a signature.</p>
<footer>Generated by WattSutra AI · Apache-2.0 · Created by Vatsal Shah</footer>`;
  return htmlShell('WattSutra Report', body);
}
