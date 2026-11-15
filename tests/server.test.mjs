import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {startServer} from '../packages/server/index.mjs';
const token='0123456789abcdefghijklmnopqrstuvw';
const get=(port,path,secret)=>fetch(`http://127.0.0.1:${port}${path}`,{headers:secret?{Authorization:`Bearer ${secret}`}:{}});
test('server rejects missing token',async()=>await assert.rejects(startServer({dir:'.',token:'short',port:0})));
test('server refuses invalid port',async()=>await assert.rejects(startServer({dir:'.',token,port:-1})));
test('server read-only, authenticated, constrained',async(t)=>{
 const dir=mkdtempSync(join(tmpdir(),'watt-server-'));writeFileSync(join(dir,'ok.json'),'{}');writeFileSync(join(dir,'bad.txt'),'SECRET');let symlinkAvailable=true;try{symlinkSync(join(dir,'ok.json'),join(dir,'link.json'))}catch(e){if(['EPERM','EACCES'].includes(e.code))symlinkAvailable=false;else throw e};
 const server=await startServer({dir,token,port:0});const port=server.address().port;
 try{assert.equal((await get(port,'/reports/ok.json')).status,401);assert.equal((await get(port,'/reports/ok.json',token)).status,200);if(symlinkAvailable)assert.equal((await get(port,'/reports/link.json',token)).status,404);assert.equal((await get(port,'/reports/bad.txt',token)).status,404);assert.equal((await get(port,'/reports/../bad.txt',token)).status,404);assert.equal((await get(port,'/health',token)).status,200);assert.equal((await fetch(`http://127.0.0.1:${port}/reports/ok.json`,{method:'POST',headers:{Authorization:`Bearer ${token}`}})).status,405)}finally{server.close();rmSync(dir,{recursive:true,force:true})}
});
