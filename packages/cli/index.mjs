#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { benchmark, compare, estimate, verifyRun, validateExternal, safeReadJson, writeJson, reportMarkdown, reportHtml, reportCsv, VERSION } from '../core/engine.mjs';
import { install } from '../core/install.mjs';
import { probeInstruments } from '../core/probe.mjs';
import { runAudit, writeAudit } from '../core/audit.mjs';
import { startServer } from '../server/index.mjs';

const argv = process.argv.slice(2);
const cmd = argv.shift() || 'help';
const get = flag => { const i = argv.indexOf(flag); return i < 0 ? null : argv[i + 1] || null; };
const has = flag => argv.includes(flag);
const need = flag => { const v = get(flag); if (!v) throw Error(flag + ' required'); return v; };
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const output = v => process.stdout.write(typeof v === 'string' ? v + '\n' : JSON.stringify(v, null, 2) + '\n');
const HELP = `WattSutra AI ${VERSION} — honest performance and resource evidence (offline, no API key)

Usage:
  wattsutra doctor
  wattsutra agents
  wattsutra audit [--out dir]                       self-audit; writes audit.json, audit.md, audit.html
  wattsutra bench --manifest file --out run.json
  wattsutra verify --input run.json
  wattsutra compare --baseline a.json --candidate b.json [--out file]
  wattsutra estimate --run run.json --assumptions file [--out file]
  wattsutra report --run run.json --format md|html|csv|json [--out file]
  wattsutra install --target project --ide claude|cursor|codex|gemini|copilot|all [--dry-run]
  wattsutra server --dir reports --port 8787        needs WATTSUTRA_TOKEN (24+ chars); localhost, read-only
  wattsutra --version

Exit codes: 0 ok, 1 gate FAIL or verification failed, 2 usage or validation error.
Energy, carbon and cost are never measured unless a real meter reading is imported.`;

try {
  if (cmd === '--version' || cmd === '-v' || cmd === 'version') output(VERSION);
  else if (cmd === 'help' || cmd === '--help' || cmd === '-h') output(HELP);
  else if (cmd === 'doctor') output({ product: 'WattSutra AI', version: VERSION, node: process.version, platform: process.platform, offline: true, cliReady: true, apiKeyRequired: false, instruments: probeInstruments() });
  else if (cmd === 'agents') output(safeReadJson(join(root, 'agents', 'manifest.json')).agents);
  else if (cmd === 'audit') {
    const a = runAudit({ root });
    const out = get('--out') || 'wattsutra-audit';
    const w = writeAudit(a, out);
    output(`audit completed: ${w.dir} (${w.files.join(', ')})\nVerdict: ${a.verdict} (${a.totals.verified}/${a.totals.checks} verified, ${a.totals.failed} failed, ${a.totals.notRun} not-run)`);
    if (a.verdict === 'FAIL') process.exitCode = 1;
  } else if (cmd === 'bench') {
    const run = benchmark(safeReadJson(need('--manifest')));
    const out = get('--out');
    if (out) writeJson(out, run);
    output({ file: out ? resolve(out) : null, runId: run.runId, integrity: run.integrity, meanMs: run.measurements.wallMs.mean, samples: run.measurements.wallMs.n, energyKWh: run.energyKWh });
  } else if (cmd === 'verify') {
    const run = safeReadJson(need('--input'));
    try { validateExternal(run); output('PASS: benchmark integrity, schema and sample statistics verified'); }
    catch (e) { process.stderr.write('FAIL: ' + e.message + '\n'); process.exitCode = 1; }
  } else if (cmd === 'compare') {
    const r = compare(safeReadJson(need('--baseline')), safeReadJson(need('--candidate')));
    if (get('--out')) writeJson(get('--out'), r);
    output(r);
    if (r.gates.latency === 'FAIL') process.exitCode = 1;
  } else if (cmd === 'estimate') {
    const r = estimate(safeReadJson(need('--run')), safeReadJson(need('--assumptions')));
    if (get('--out')) writeJson(get('--out'), r);
    output(r);
  } else if (cmd === 'report') {
    const run = safeReadJson(need('--run'));
    const fmt = get('--format') || 'md';
    if (!['md', 'html', 'json', 'csv'].includes(fmt)) throw Error('format must be md, html, csv or json');
    const content = fmt === 'md' ? reportMarkdown(run) : fmt === 'html' ? reportHtml(run) : fmt === 'csv' ? reportCsv(run) : (verifyRun(run), JSON.stringify(run, null, 2));
    if (get('--out')) { const p = resolve(get('--out')); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content + '\n', { mode: 0o600 }); output({ report: p }); }
    else output(content);
  } else if (cmd === 'install') output(install(root, get('--target') || '', get('--ide') || 'all', { dryRun: has('--dry-run') }));
  else if (cmd === 'server') {
    const server = await startServer({ dir: get('--dir'), port: Number(get('--port') || 8787), token: process.env.WATTSUTRA_TOKEN });
    process.stderr.write(`WattSutra API listening on http://127.0.0.1:${server.address().port} (read-only, bearer token required). Ctrl+C to stop.\n`);
  } else { process.stderr.write(`WattSutra: unknown command "${cmd}"\n\n${HELP}\n`); process.exitCode = 2; }
} catch (e) { process.stderr.write('WattSutra: ' + e.message + '\n'); process.exitCode = 2; }
