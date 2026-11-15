import { mkdirSync } from 'node:fs';import { spawnSync } from 'node:child_process';import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));mkdirSync(resolve(root,'examples/reports'),{recursive:true});
for(const args of [
['bench','--manifest','fixtures/baseline.json','--out','examples/reports/baseline.json'],
['bench','--manifest','fixtures/candidate.json','--out','examples/reports/candidate.json'],
['compare','--baseline','examples/reports/baseline.json','--candidate','examples/reports/candidate.json','--out','examples/reports/comparison.json'],
['estimate','--run','examples/reports/candidate.json','--assumptions','fixtures/assumptions.json','--out','examples/reports/estimate.json'],
['report','--run','examples/reports/candidate.json','--format','html','--out','examples/reports/measurement.html']]) {
 const r=spawnSync(process.execPath,['packages/cli/index.mjs',...args],{cwd:root,encoding:'utf8',timeout:15000});if(r.status!==0)throw Error(args[0]+': '+r.stderr);console.log(r.stdout.trim());
}
