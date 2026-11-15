import { readdirSync, mkdirSync, copyFileSync, lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
export const HOSTS = { claude: '.claude/skills', cursor: '.cursor/skills', codex: '.agents/skills', gemini: '.gemini/skills', copilot: '.github/skills' };
const lstatOrNull = p => { try { return lstatSync(p); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
// Copies SKILL.md files into project-local host directories. Refuses symlinks and never overwrites edited files.
// dryRun=true validates everything and reports what would be written without touching the disk.
export function install(root, target, ide = 'all', { dryRun = false } = {}) {
  if (!target) throw Error('Explicit --target project directory required');
  const to = resolve(target);
  const st = lstatOrNull(to);
  if (!st) throw Error('Target directory not found: ' + target);
  if (!st.isDirectory() || st.isSymbolicLink()) throw Error('Target must exist and not be a symlink');
  const hosts = ide === 'all' ? Object.keys(HOSTS) : [ide];
  if (hosts.some(h => !HOSTS[h])) throw Error('Unsupported IDE');
  const source = join(root, 'skills');
  const skills = readdirSync(source).filter(n => /^wattsutra-[a-z0-9-]+$/.test(n) && !lstatSync(join(source, n)).isSymbolicLink());
  const plan = [];
  for (const h of hosts) {
    let cursor = to;
    for (const part of HOSTS[h].split('/')) {
      cursor = join(cursor, part);
      const s = lstatOrNull(cursor);
      if (s && (!s.isDirectory() || s.isSymbolicLink())) throw Error('Unsafe install directory: ' + cursor);
    }
    const dest = join(to, HOSTS[h]);
    for (const name of skills) {
      const skillDir = join(dest, name), dst = join(skillDir, 'SKILL.md'), src = join(source, name, 'SKILL.md');
      const sd = lstatOrNull(skillDir);
      if (sd && (sd.isSymbolicLink() || !sd.isDirectory())) throw Error('Unsafe skill directory');
      const f = lstatOrNull(dst);
      let action = 'create';
      if (f) {
        if (f.isSymbolicLink() || !f.isFile()) throw Error('Unsafe skill file');
        if (readFileSync(dst, 'utf8') !== readFileSync(src, 'utf8')) throw Error(`Refusing to overwrite customized skill: ${dst}`);
        action = 'unchanged';
      }
      plan.push({ host: h, skill: name, action, skillDir, dst, src });
    }
  }
  if (!dryRun) {
    for (const p of plan) {
      if (p.action !== 'create') continue;
      mkdirSync(p.skillDir, { recursive: true });
      copyFileSync(p.src, p.dst);
    }
  }
  return {
    hosts, dryRun, target: to,
    skillFilesInstalledOrVerified: plan.length,
    created: plan.filter(p => p.action === 'create').length,
    unchanged: plan.filter(p => p.action === 'unchanged').length
  };
}
