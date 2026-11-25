// Dependency-free documentation website builder: documents/WattSutra-AI/*.md -> documents/html/.
// Light theme by default, dark by toggle. `--check` fails if the committed site is stale.
// In Markdown, `<!-- fig:name -->` draws a figure (the following mermaid fence is for GitHub only and is skipped)
// and `<!-- term:s1 -->` shows real CLI output captured by `npm run docs:scenarios`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { esc, icon, logo, FAVICON, flow, decision, bars, layers, kinds, dotPlot, interval, terminal } from '../documents/site/diagrams.mjs';

const root = path.resolve(import.meta.dirname, '..');
const MD = path.join(root, 'documents/WattSutra-AI');
const SITE_SRC = path.join(root, 'documents/site');
const FINAL = path.join(root, 'documents/html');
const check = process.argv.includes('--check');
const OUT = check ? fs.mkdtempSync(path.join(os.tmpdir(), 'watt-site-')) : FINAL;
const SITE = 'https://shahvatsalofficial.github.io/WattSutra-AI/';
const REPO = 'https://github.com/shahvatsalofficial/WattSutra-AI';
const NPM = 'https://www.npmjs.com/package/wattsutra';
const text = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const json = p => JSON.parse(text(path.join(root, p)));

const VERSION = json('package.json').version;
const audit = json('documents/WattSutra-AI/evidence/samples/audit.json');
const tests = json('documents/WattSutra-AI/evidence/test-results.json');
const scn = json('documents/WattSutra-AI/evidence/scenarios.json');
const base = audit.sample.baseline.measurements.wallMs, cand = audit.sample.candidate.measurements.wallMs, cmp = audit.sample.comparison;
const SKILLS = fs.readdirSync(path.join(root, 'skills')).length;

// ---------- figures ----------
const ci95 = cmp.latencyRatioInterval95;
const FIG = {
  pipeline: () => flow([{ t: 'Manifest', s: 'job, size, repeats', k: 'brand' }, { t: 'bench', s: 'time real runs' }, { t: 'verify', s: 'recompute stats' }, { t: 'compare', s: 'fairness gates', k: 'warn' }, { t: 'report', s: 'HTML · MD · JSON', k: 'ok' }], 'From one manifest to a report anyone can check'),
  gate: () => decision([
    { q: 'Same answer?', s: 'result count and sum', on: 'no', out: 'FAIL', k: 'bad' },
    { q: 'Same machine and Node?', s: 'platform, CPU, cores', on: 'no', out: 'REVIEW', k: 'warn' },
    { q: '5 or more samples each?', s: 'too few cannot decide', on: 'no', out: 'REVIEW', k: 'warn' },
    { q: 'Interval includes 1x?', s: 'difference is noise', on: 'yes', out: 'REVIEW', k: 'warn' },
    { q: 'Candidate slower?', s: 'whole interval below 1x', on: 'yes', out: 'FAIL', k: 'bad' }], 'PASS', 'How the latency gate decides, checked top to bottom'),
  kinds: () => kinds(),
  layers: () => layers(),
  trust: () => flow([{ t: 'Your files', s: 'treated as hostile', k: 'warn' }, { t: 'Checks', s: 'size, type, shape' }, { t: 'Core', s: 'no network, no spawn', k: 'brand' }, { t: 'Reports', s: 'escaped, CSP', k: 'ok' }], 'Trust boundaries'),
  quickstart: () => flow([{ t: 'doctor', s: 'what can run', k: 'brand' }, { t: 'bench ×2', s: 'baseline, candidate' }, { t: 'compare', s: 'read the gate', k: 'warn' }, { t: 'report', s: 'share it', k: 'ok' }], 'Your first ten minutes'),
  context: () => flow([{ t: 'You / CI / agent', s: 'run a command', k: 'brand' }, { t: 'wattsutra CLI', s: 'parse, exit code' }, { t: 'core engine', s: 'measure, check', k: 'warn' }, { t: 'Reports', s: 'JSON · MD · HTML', k: 'ok' }], 'System context: everything stays on your machine'),
  dataflow: () => flow([{ t: 'Two runs', s: 'same manifest job', k: 'brand' }, { t: 'verify', s: 'hash and shape' }, { t: 'compare', s: 'gates', k: 'warn' }, { t: 'estimate', s: 'your inputs only' }, { t: 'report / audit', s: 'labelled', k: 'ok' }], 'Data flow for a fair comparison'),
  ci: () => flow([{ t: 'Pull request', s: 'code changes', k: 'brand' }, { t: 'bench', s: 'same runner type' }, { t: 'compare', s: 'exit 0 or 1', k: 'warn' }, { t: 'Merge / block', s: 'evidence kept', k: 'ok' }], 'A regression gate in CI'),
  audit: () => bars([
    { label: 'Audit checks verified', value: audit.totals.verified, total: audit.totals.checks, k: 'ok' },
    { label: 'Not run (no power meter)', value: audit.totals.notRun, total: audit.totals.checks, k: 'warn' },
    { label: 'Failed', value: audit.totals.failed, total: audit.totals.checks, k: 'bad' }], `Committed sample audit: verdict ${audit.verdict}, Node ${audit.environment.node}, ${audit.environment.platform}`),
  tests: () => bars([
    { label: 'Tests passing', value: tests.pass, total: tests.total, k: 'ok' },
    { label: 'Skipped (symlink privilege)', value: tests.skipped, total: tests.total, k: 'warn' },
    { label: 'Failing', value: tests.fail, total: tests.total, k: 'bad' }], `Machine-written test run, Node ${tests.environment.node} on ${tests.environment.platform}`),
  samples: () => dotPlot([{ label: `Baseline (${cmp.baseline.variant})`, samples: base.samples, k: 'warn' }, { label: `Candidate (${cmp.candidate.variant})`, samples: cand.samples, k: 'ok' }], `Every raw sample of the committed audit run (${base.n} + ${cand.n}). Dot = one repeat, bar = median. Further left is faster.`)
    + interval({ low: ci95.low, high: ci95.high, point: cmp.latencyRatioMedian }, `Speed ratio (baseline ÷ candidate) of medians with its 95% bootstrap interval. The interval is clear of 1x, so the gate is ${cmp.gates.latency}.`),
};
const figure = n => { if (!FIG[n]) throw Error('unknown figure ' + n); return FIG[n](); };
const term = n => { if (!scn.scenarios[n]) throw Error('unknown scenario ' + n); return terminal(scn.scenarios[n], `bash: real output, WattSutra ${scn.toolVersion}`); };

// ---------- markdown ----------
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function href(u, rel) {
  if (/^(https?:|mailto:|#)/.test(u)) return u;
  if (u.startsWith('../')) return `${REPO}/blob/main/${u.replace(/^(\.\.\/)+/, '')}`;
  if (u === 'evidence/') return `${REPO}/tree/main/documents/WattSutra-AI/evidence`;
  return rel + (/^[\w-]+\.md(#|$)/.test(u) ? u.replace('.md', '.html') : u);
}
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${esc(href(u.replace(/&amp;/g, '&'), ''))}">${t}</a>`)
    .replace(/&lt;(https:\/\/[^\s]+?)&gt;/g, '<a href="$1">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${esc(codes[i])}</code>`);
}
const sev = c => { const m = { verified: 'ok', PASS: 'ok', refused: 'ok', failed: 'bad', FAIL: 'bad', REVIEW_REQUIRED: 'warn', 'not-run': 'warn', NOT_RUN: 'warn' }; const k = c.replace(/<[^>]+>/g, '').replace(/\*/g, ''); return m[k] ? `<span class="sev ${m[k]}">${k}</span>` : c; };
export function render(md) {
  const lines = md.split('\n'), out = [], toc = [];
  let i = 0, h1 = false;
  const BREAK = /^(#{1,4} |```|\||\s*[-*] |\s*\d+\. |> |<!--)/;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const lang = l.slice(3).trim(), buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      if (lang !== 'mermaid') out.push(`<div class="codewrap"${lang && lang !== 'text' ? ` data-lang="${esc(lang)}"` : ''}><pre><code>${esc(buf.join('\n'))}</code></pre></div>`);
      continue;
    }
    const d = l.match(/^<!-- (fig|term):(\w+) -->$/);
    if (d) { out.push(d[1] === 'fig' ? figure(d[2]) : term(d[2])); i++; continue; }
    const h = l.match(/^(#{1,4}) (.*)/);
    if (h) {
      const n = h[1].length, id = slug(h[2]);
      if (n === 1 && !h1) { h1 = true; out.push(`<h1>${inline(h[2])}</h1>`); }
      else { if (n === 2) toc.push([id, h[2].replace(/`/g, '')]); out.push(`<h${n} id="${id}">${inline(h[2])}${n < 4 ? `<a class="anc" href="#${id}" aria-label="Link to this section">#</a>` : ''}</h${n}>`); }
      i++; continue;
    }
    if (l.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? '')) {
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      out.push(`<div class="tw"><table><thead><tr>${cells(rows[0]).map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(r => `<tr>${cells(r).map(c => `<td${/^[A-Z0-9-]{2,12}$/.test(c) ? ' class="id"' : ''}>${sev(inline(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const li = l.match(/^([-*]|\d+\.) /);
    if (li) {
      const ordered = /\d/.test(li[1]), re = ordered ? /^\d+\. / : /^[-*] /, items = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, ''));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(x => `<li>${inline(x.replace(/^\[ \] /, '☐ '))}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (l.startsWith('> ')) { const b = []; while (i < lines.length && lines[i].startsWith('>')) b.push(lines[i++].replace(/^> ?/, '')); out.push(`<blockquote><p>${inline(b.join(' '))}</p></blockquote>`); continue; }
    if (!l.trim()) { i++; continue; }
    const p = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !BREAK.test(lines[i])) p.push(lines[i++]);
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

// ---------- site ----------
const GROUPS = [
  ['Start here', ['05-user-guide', '08-real-world-scenarios', '01-executive-summary', '09-faq-glossary']],
  ['Reference', ['02-functional-spec', '03-technical-spec', '04-architecture']],
  ['Trust and proof', ['07-independent-audit', 'test-results', '06-security-privacy-legal', 'README']],
];
const ORDER = GROUPS.flatMap(g => g[1]);
const found = fs.readdirSync(MD).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
for (const k of found) if (!ORDER.includes(k)) throw Error('page missing from navigation: ' + k);
const docs = Object.fromEntries(ORDER.map(k => {
  const raw = text(path.join(MD, k + '.md'));
  return [k, { raw, out: k + '.html', title: k === 'README' ? 'Documentation index' : raw.match(/^# (.*)/)[1].replace(/`/g, '') }];
}));
const lede = raw => (raw.split('\n').find(l => l && !/^(#|\||`|-|>|<|\d\.)/.test(l)) ?? '').replace(/[*`]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');

const NAV = [['index.html', 'Home'], ['05-user-guide.html', 'Guide'], ['08-real-world-scenarios.html', 'Scenarios'], ['04-architecture.html', 'Architecture'], ['07-independent-audit.html', 'Proof']];
const themeJs = text(path.join(SITE_SRC, 'theme.js')).replace(/\/\/.*\n/g, '\n');
const LD = (title, desc, url) => JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'SoftwareApplication', name: 'WattSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux (Node.js 22+)', softwareVersion: VERSION, license: 'https://www.apache.org/licenses/LICENSE-2.0', url: SITE, codeRepository: REPO, author: { '@type': 'Person', name: 'Vatsal Shah', url: 'https://github.com/shahvatsalofficial' }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Offline performance-evidence CLI that keeps measured, imported, modeled and unmeasured values apart and never presents CPU time as energy.' }, { '@type': 'TechArticle', headline: title, description: desc, url, author: { '@type': 'Person', name: 'Vatsal Shah' } }] }).replace(/</g, '\\u003c');
const FOOT_NOTE = 'Version ' + VERSION + ' reads no power sensor. Energy, carbon and cost are never measured by this tool; modeled values come from your inputs. Not a certification.';

function shell({ file, title, desc, body, toc = [], landing = false }) {
  const url = SITE + (file === 'index.html' ? '' : file);
  const swap = (n, cls) => icon(n, 20).replace('class="ic"', `class="ic ${cls}"`);
  const nav = `<header class="nav"><div class="nav-in"><button class="icon-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="side">${swap('menu', 'i-menu')}${swap('close', 'i-close')}</button><a class="brand" href="index.html">${logo(30)}<span class="wm">Watt<b>Sutra</b> AI</span><small>v${VERSION}</small></a><nav class="nav-links" aria-label="Primary">${NAV.map(([h, t]) => `<a href="${h}"${file === h ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav><span class="sp"></span><a class="icon-btn" href="${REPO}" rel="noopener" aria-label="GitHub repository">${icon('github', 20)}</a><button class="icon-btn" id="theme-btn" aria-label="Switch to dark theme" aria-pressed="false">${swap('moon', 'i-moon')}${swap('sun', 'i-sun')}</button></div></header><div class="scrim"></div>`;
  const side = `<aside class="side" id="side" aria-label="Documentation"><div class="side-top">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>${GROUPS.map(([g, ks]) => `<h4>${g}</h4>${ks.map(k => `<a href="${docs[k].out}"${file === docs[k].out ? ' aria-current="page"' : ''}>${esc(docs[k].title)}</a>`).join('')}`).join('')}<h4>Sample reports</h4><a href="evidence/samples/audit.html">Self-audit (HTML)</a><a href="evidence/samples/measurement.html">Measured run (HTML)</a><a href="llms.txt">llms.txt</a></aside>`;
  const foot = `<footer class="site"><div class="container"><div class="foot"><div><a class="brand" href="index.html">${logo(28)}<span class="wm">Watt<b>Sutra</b> AI</span></a><p>Measure what runs. Model what you know. Never invent savings.</p></div><div><h5>Learn</h5><a href="05-user-guide.html">User guide</a><a href="08-real-world-scenarios.html">Real-world scenarios</a><a href="09-faq-glossary.html">FAQ and glossary</a></div><div><h5>Trust</h5><a href="07-independent-audit.html">Audit</a><a href="test-results.html">Test results</a><a href="06-security-privacy-legal.html">Security and legal</a></div><div><h5>Project</h5><a href="${REPO}" rel="noopener">GitHub</a><a href="${NPM}" rel="noopener">npm</a><a href="${REPO}/releases" rel="noopener">Releases</a><a href="${REPO}/issues" rel="noopener">Issues</a></div></div><p class="legal">Apache-2.0 &middot; Created by Vatsal Shah &middot; ${esc(FOOT_NOTE)}</p></div></footer>`;
  const tocHtml = toc.length ? `<nav class="toc-r" aria-label="On this page"><strong>On this page</strong>${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>` : '<div></div>';
  const main = landing ? `<div class="doc">${side}</div><main id="main">${body}</main>` : `<div class="doc">${side}<main class="prose" id="main">${body}</main>${tocHtml}</div>`;
  const full = title.includes('WattSutra') ? title : `${title} | WattSutra AI`;
  return `<!doctype html>\n<html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(full)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#ffffff"><meta property="og:type" content="website"><meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary"><meta name="author" content="Vatsal Shah"><meta name="keywords" content="benchmark, performance evidence, energy measurement, carbon estimate, green software, SCI, FinOps, regression gate, agent skills"><script>${themeJs}</script><link rel="icon" type="image/svg+xml" href="${FAVICON}"><link rel="stylesheet" href="assets/site.css"><script type="application/ld+json">${LD(title, desc, url)}</script></head><body${landing ? ' class="landing"' : ''}><a class="skip" href="#main">Skip to content</a>${nav}${main}${foot}<script src="assets/site.js" defer></script></body></html>\n`;
}

function landing() {
  const ic = (n, c = '') => `<div class="ico ${c}">${icon(n, 24)}</div>`;
  const card = (h, n, t, p, c = '') => `<a class="card" href="${h}">${ic(n, c)}<h3>${t}</h3><p>${p}</p><span class="more">Read more ${icon('arrow', 16)}</span></a>`;
  const sc = id => '08-real-world-scenarios.html#' + id;
  const ids = render(docs['08-real-world-scenarios'].raw).toc.map(t => t[0]);
  const section = (alt, eyebrow, title, sub, inner) => `<section class="section${alt ? ' alt' : ''}"><div class="container"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p class="sub">${sub}</p>${inner}</div></section>`;
  const cmd = 'npx wattsutra audit --out wattsutra-audit';
  const faq = [['Does it measure watts?', 'No. Version ' + VERSION + ' reads no power sensor. You can import your own meter reading, and it is labelled as imported.'], ['Can it benchmark my app?', 'Not yet. It ships one fixed workload with two algorithms. Arbitrary code needs a sandbox, which is on the roadmap.'], ['Does it need an API key or network?', 'No key, no telemetry, no network client. npx downloads the package from npm.'], ['Is the audit a certificate?', 'No. It is a self-audit you can rerun, not third-party certification.']];
  return `<section class="hero"><div class="container hero-in"><div><span class="badge"><b>v${VERSION}</b> Apache-2.0 &middot; zero dependencies &middot; offline</span><h1>Faster is not <span class="grad">greener</span> until you can prove it.</h1><p class="lead">WattSutra AI benchmarks, checks the answer stayed correct, and labels every number as measured, imported, modeled or not measured. CPU time is never passed off as energy.</p><div class="cta"><a class="btn primary" href="05-user-guide.html">Get started ${icon('arrow', 18)}</a><a class="btn" href="08-real-world-scenarios.html">See real scenarios</a></div><div class="install"><code>${cmd}</code><button class="copy" type="button" data-copy="${cmd}" aria-label="Copy command">${icon('copy', 16)}<span class="lbl">Copy</span></button></div></div><div class="hero-term">${term('s1')}</div></div></section>`
    + `<section class="container"><div class="stats"><div class="stat"><b>${tests.pass}/${tests.total}</b><span>tests passing (${tests.skipped} skipped)</span></div><div class="stat"><b>${audit.totals.verified}/${audit.totals.checks}</b><span>audit checks verified</span></div><div class="stat"><b>${SKILLS}</b><span>agent skills</span></div><div class="stat"><b>0</b><span>runtime dependencies</span></div></div></section>`
    + section(false, 'The one rule', 'Four kinds of number, never mixed', 'Every figure says where it came from. When there is no data, the field stays empty.', FIG.kinds())
    + section(true, 'How it works', 'From a manifest to a report anyone can check', 'Five steps, all local. The same files can be re-verified by someone who does not trust you.', FIG.pipeline())
    + section(false, 'Fair comparisons', 'The gate says no when the evidence is thin', 'A speed claim passes only when the answer matches, the machine matches, there are enough samples and the difference is larger than noise.', FIG.gate())
    + section(true, 'Real data', 'See the samples, not just a headline', 'These dots are the raw repeats from the committed self-audit run. Your machine will give different timings.', FIG.samples())
    + section(false, 'Real-world scenarios', 'Situations you will recognise', 'Each one shows real CLI output.', `<div class="grid g3">${card(sc(ids[0]), 'flag', '"4x faster, so greener"', 'The speed claim passes. The energy claim does not.', 'warn')}${card(sc(ids[1]), 'alert', 'Fast but wrong', 'A different answer fails the gate and exits 1.', 'bad')}${card(sc(ids[2]), 'eye', 'Different machine', 'Cross-hardware results are held for review.', 'warn')}${card(sc(ids[3]), 'shield', 'Edited report', 'Hand-edited numbers are rejected, even re-hashed.', 'ok')}${card(sc(ids[4]), 'file', 'Carbon request', 'Nothing is defaulted. Your inputs are labelled modeled.')}${card(sc(ids[5]), 'gate', 'Real meter reading', 'Imported with its source and marked unverified.')}</div>`)
    + section(true, 'Proof', 'Evidence you can reproduce', 'Run <code>npm test</code> and <code>npx wattsutra audit</code> yourself.', `${FIG.tests()}${FIG.audit()}<p><a class="btn" href="evidence/samples/audit.html">Open the sample audit report ${icon('arrow', 18)}</a></p><div class="honest"><h3>${icon('alert', 22)} What it does not do</h3><ul><li>No power sensor is read. No kWh or CO2e is measured.</li><li>One built-in workload; it is not a representative AI inference benchmark.</li><li>A hash detects edits. It is not a signature and cannot stop a complete forgery.</li><li>Skills are copied into IDE folders; activation in each IDE is not verified.</li></ul></div>`)
    + section(false, 'FAQ', 'Quick answers', 'More in the FAQ and glossary.', `<div class="grid g2">${faq.map(([q, a]) => `<div class="card"><h3>${q}</h3><p>${a}</p></div>`).join('')}</div>`)
    + section(true, 'Documentation', 'Everything in one place', 'Executive, functional, technical, architecture, user, security and audit.', `<div class="grid g4">${ORDER.map(k => `<a class="card" href="${docs[k].out}"><h3>${esc(docs[k].title)}</h3><p>${esc(clip(lede(docs[k].raw), 100))}</p></a>`).join('')}</div>`)
    + `<section class="section"><div class="container"><div class="band"><h2>Check your first claim in two minutes</h2><p>Node.js 22+ is all you need. No account, no API key.</p><a class="btn" href="05-user-guide.html">Open the user guide</a></div></div></section>`;
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  const put = (n, c) => fs.writeFileSync(path.join(OUT, n), c);
  for (const f of ['site.css', 'site.js']) put('assets/' + f, text(path.join(SITE_SRC, f)));
  ORDER.forEach((k, n) => {
    const d = docs[k], { html, toc } = render(d.raw), prev = docs[ORDER[n - 1]], next = docs[ORDER[n + 1]];
    const group = GROUPS.find(g => g[1].includes(k))[0];
    const body = `<div class="crumbs"><a href="index.html">Home</a> / ${esc(group)}</div>${k === 'test-results' ? html.replace('</h1>', '</h1>' + FIG.tests()) : html}<div class="pager">${prev ? `<a href="${prev.out}"><small>Previous</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="nx" href="${next.out}"><small>Next</small>${esc(next.title)}</a>` : '<span></span>'}</div><div class="edit"><a href="${REPO}/edit/main/documents/WattSutra-AI/${k}.md" rel="noopener">Edit this page on GitHub</a><a href="${REPO}/issues/new" rel="noopener">Report a problem</a></div>`;
    put(d.out, shell({ file: d.out, title: d.title, desc: clip(lede(d.raw) || d.title, 160), body, toc }));
  });
  put('index.html', shell({ file: 'index.html', title: 'WattSutra AI: honest performance, energy and cost evidence', desc: 'Offline CLI that benchmarks code, checks correctness and labels every number measured, imported, modeled or not measured.', body: landing(), landing: true }));
  // evidence copied beside the pages (text files normalised so checks match on every OS)
  const copy = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); if (e.isDirectory()) copy(a, b); else fs.writeFileSync(b, text(a)); } };
  copy(path.join(MD, 'evidence'), path.join(OUT, 'evidence'));
  put('llms.txt', text(path.join(root, 'llms.txt')));
  put('.nojekyll', '');
  put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...ORDER.map(k => docs[k].out)].map(u => `<url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  put('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
}

const walk = (d, base = d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name)).replaceAll('\\', '/')])) : []).sort();

build();
if (check) {
  const want = walk(OUT), have = walk(FINAL);
  const stale = [...new Set([...want, ...have])].filter(f => !want.includes(f) || !have.includes(f) || text(path.join(OUT, f)) !== text(path.join(FINAL, f)));
  fs.rmSync(OUT, { recursive: true, force: true });
  if (stale.length) { console.error('Stale documentation site (run npm run build:docs): ' + stale.join(', ')); process.exit(1); }
}
console.log(`${check ? 'checked' : 'built'} ${ORDER.length} documents + home`);
