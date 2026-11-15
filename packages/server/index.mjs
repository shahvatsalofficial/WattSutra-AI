import { createServer } from 'node:http';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
const eq=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&x.length>0&&timingSafeEqual(x,y)};
export async function startServer({dir,port=8787,token}={}){
 if(!token||token.length<24)throw Error('WATTSUTRA_TOKEN must be set to a random secret at least 24 characters long');if(!dir)throw Error('--dir explicitly required');if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');const base=resolve(dir);if(!lstatSync(base).isDirectory())throw Error('Report directory not found');
 const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none'");const fail=(code,text)=>{res.writeHead(code,{'Content-Type':'text/plain'});res.end(text)};
  if(!eq(req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'',token))return fail(401,'Unauthorized');if(req.method!=='GET')return fail(405,'Method not allowed');
  let url;try{url=new URL(req.url,'http://127.0.0.1')}catch{return fail(400,'Bad URL')};if(url.pathname==='/health')return fail(200,'OK');if(!/^\/reports\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(url.pathname)||url.pathname.includes('..'))return fail(404,'Not found');
  const full=resolve(join(base,url.pathname.split('/').at(-1)));if(relative(base,full).startsWith('..'))return fail(404,'Not found');try{const st=lstatSync(full);if(!st.isFile()||st.isSymbolicLink()||st.size>2_000_000)return fail(404,'Not found');const data=readFileSync(full);JSON.parse(data);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(data)}catch{return fail(404,'Not found')}
 });return new Promise((resolveStart,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolveStart(server))});
}
