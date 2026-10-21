import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Fail before Wrangler can auto-detect this compiled checkout as a static-only site.
// An intentional API change must update this reviewed module hash and its checks.
const apiHash='4d1369b4386f729a5a2dc81eca24429cb402ca167282cede9f4fa2ffd6a73016';
const namespace='8ce65ef4580449ee9f19c94544dca769';
const root=new URL('../',import.meta.url);
const files=new Map(await Promise.all(['wrangler.toml','worker/index.js','.assetsignore'].map(async name=>[name,(await readFile(new URL(name,root),'utf8')).replaceAll('\r\n','\n')])));

function value(section,key){const match=section.match(new RegExp('^'+key+'\\s*=\\s*(.+)$','m'));assert.ok(match,'Missing '+key);return JSON.parse(match[1].trim());}
function verify(candidate){
 const config=candidate.get('wrangler.toml');assert.ok(config,'Missing Worker configuration');
 const top=config.split(/^\[/m)[0];
 assert.equal(value(top,'name'),'games');assert.equal(value(top,'main'),'worker/index.js');
 assert.equal(value(top,'compatibility_date'),'2026-10-09');assert.equal(value(top,'workers_dev'),true);assert.equal(value(top,'keep_vars'),true);
 const assets=config.match(/^\[assets\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/m)?.[1];assert.ok(assets,'Missing ASSETS configuration');
 assert.equal(value(assets,'directory'),'.');assert.equal(value(assets,'binding'),'ASSETS');
 assert.equal(value(assets,'not_found_handling'),'single-page-application');assert.deepEqual(value(assets,'run_worker_first'),['/api/*']);
 const kv=[...config.matchAll(/^\[\[kv_namespaces\]\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/gm)];assert.equal(kv.length,1,'Expected existing RELEASES binding only');
 assert.equal(value(kv[0][1],'binding'),'RELEASES');assert.equal(value(kv[0][1],'id'),namespace);
 const code=candidate.get('worker/index.js');assert.ok(code,'Missing API module');
 assert.equal(createHash('sha256').update(code.replaceAll('\r\n','\n')).digest('hex'),apiHash,'API module changed; review handler/auth behavior before updating this guard');
 const ignored=new Set((candidate.get('.assetsignore')||'').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#')));
 for(const entry of ['worker/','scripts/','wrangler.toml','.assetsignore','.git/','.github/','.wrangler/','node_modules/'])assert.ok(ignored.has(entry),'Deployment source must be excluded from assets: '+entry);
}
verify(files);

let negativeChecks=0;
if(process.argv.includes('--self-test')){
 const changes=[
  ['missing config',m=>m.delete('wrangler.toml')],['missing module',m=>m.delete('worker/index.js')],
  ['changed module',m=>m.set('worker/index.js',m.get('worker/index.js')+'\n// unexpected change')],
  ['missing main',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace(/^main = .+\n/m,''))],
  ['missing assets binding',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace('binding = "ASSETS"','binding = "OTHER"'))],
  ['missing KV binding',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace('binding = "RELEASES"','binding = "OTHER"'))],
  ['wrong namespace',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace(namespace,'wrong-namespace'))],
  ['missing API routing',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace('run_worker_first = ["/api/*"]','run_worker_first = []'))],
  ['wrong asset root',m=>m.set('wrangler.toml',m.get('wrangler.toml').replace('directory = "."','directory = "./dist"'))],
  ...['worker/','scripts/','wrangler.toml'].map(entry=>['unprotected '+entry,m=>m.set('.assetsignore',m.get('.assetsignore').split(/\r?\n/).filter(line=>line!==entry).join('\n'))]),
 ];
 for(const [label,mutate]of changes){const candidate=new Map(files);mutate(candidate);assert.throws(()=>verify(candidate),undefined,'Guard accepted '+label);negativeChecks++;}
}

// All requests below use in-memory KV and ASSETS; no network or real data writes.
const worker=(await import('data:text/javascript;base64,'+Buffer.from(files.get('worker/index.js')).toString('base64'))).default;
const catalog={games:{example:{downloadLabel:'Synthetic fixture'}},apps:{},experimental:{}};
let kvWrites=0,assetReads=0;
const env={RELEASES:{get:async key=>{assert.equal(key,'catalog');return catalog;},put:async()=>{kvWrites++;}},ASSETS:{fetch:async()=>{assetReads++;return new Response('<main>Synthetic SPA</main>',{headers:{'content-type':'text/html'}});}}};
let response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/releases',{headers:{Origin:'https://yienstudio.net'}}),env);
assert.equal(response.status,200);assert.deepEqual(await response.json(),catalog);assert.equal(response.headers.get('access-control-allow-origin'),'https://yienstudio.net');
response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/releases',{method:'OPTIONS',headers:{Origin:'https://games.yienstudio.workers.dev'}}),env);
assert.equal(response.status,204);assert.equal(response.headers.get('access-control-allow-origin'),'https://games.yienstudio.workers.dev');
response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/releases',{method:'PUT',body:'{}'}),env);assert.equal(response.status,503);
response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/releases',{method:'PUT',headers:{Authorization:'Bearer invalid-synthetic'},body:'{}'}),{...env,ADMIN_PASSWORD:'synthetic-expected'});assert.equal(response.status,401);
response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/releases',{method:'POST'}),env);assert.equal(response.status,405);
response=await worker.fetch(new Request('https://games.yienstudio.workers.dev/api/unknown'),env);assert.equal(response.status,200);assert.equal(await response.text(),'<main>Synthetic SPA</main>');
assert.equal(kvWrites,0);assert.equal(assetReads,1);
console.log(JSON.stringify({deploymentGuard:'passed',negativeChecks,syntheticApiChecks:6,kvWrites,root:fileURLToPath(root)},null,2));
