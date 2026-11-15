// Passive capability probe. Looks for files only: never executes a tool, never reads a sensor value,
// never needs root. "detected-not-used" means a candidate instrument exists; WattSutra does not read it yet.
import { existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';

const TOOLS = ['nvidia-smi', 'powermetrics', 'scaphandre'];
function onPath(name, env = process.env) {
  const exts = process.platform === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';').concat('') : [''];
  for (const dir of (env.PATH || env.Path || '').split(delimiter).filter(Boolean)) {
    for (const ext of exts) if (existsSync(join(dir, name + ext))) return true;
  }
  return false;
}
export function probeInstruments({ env = process.env, raplPath = '/sys/class/powercap/intel-rapl' } = {}) {
  const rapl = process.platform === 'linux' && existsSync(raplPath);
  return {
    rapl: rapl ? 'detected-not-used' : 'unavailable',
    tools: Object.fromEntries(TOOLS.map(t => [t, onPath(t, env) ? 'detected-not-used' : 'unavailable'])),
    measuredEnergyAvailable: false,
    note: 'Passive file-existence probe only. No sensor is read, so all energy and carbon values remain unmeasured.'
  };
}
