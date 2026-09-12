import { readFile, writeFile, readdir, mkdir, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute=promisify(execFile);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
try { process.loadEnvFile('.env.local'); } catch { /* Hosted runners may use their environment. */ }
const source=process.env.INTERNSHIP_DATA_DIR || '/Users/slimane/Documents/Internship-Search';
const cli=resolve(root,'node_modules/convex/bin/main.js');
const deployment=process.env.CONVEX_DEPLOYMENT?.replace(/^(dev|prod):/,'');
if(!deployment)throw new Error('CONVEX_DEPLOYMENT must identify the target deployment.');
async function run(name,args){
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const {stdout}=await execute(process.execPath,[cli,'run',name,JSON.stringify(args),'--deployment',deployment,'--codegen','disable'],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024,timeout:90000});
   return stdout.trim()?JSON.parse(stdout):null;
  }catch(error){
   const message=String(error.stderr||'CLI connection failed').slice(-2000);
   if(attempt===3||!/(fetch failed|timed? ?out|ECONN|ENOTFOUND|socket|502|503|504|connection)/i.test(message))throw new Error('Convex '+name+' failed: '+message);
   console.log(`Retrying ${name} after a connection failure (${attempt}/3).`);
   await delay(attempt*2000);
  }
 }
}
async function checkpoint(state){
 await writeFile('.sync/state.tmp',JSON.stringify(state,null,2)+'\n');
 await rename('.sync/state.tmp','.sync/state.json');
}
const hash=data=>createHash('sha256').update(data).digest('hex');
await mkdir('.sync',{recursive:true});
const lock=await import('node:fs/promises').then(fs=>fs.open('.sync/lock','wx')).catch(()=>{throw new Error('A sync is already running (.sync/lock). Remove a stale lock only after confirming no sync process exists.');});
try {
 const csv=await readFile(resolve(source,'opportunities.csv'),'utf8');
 const records=parse(csv,{columns:true,bom:true,skip_empty_lines:true});
 if(!records.length)throw new Error('Refusing to import an empty CSV.');
 const ids=new Set();
 for(const r of records){if(!/^PFE-\d+$/.test(r.id)||!r.company||!r.role||ids.has(r.id))throw new Error('Invalid or duplicate opportunity ID.');ids.add(r.id);const url=new URL(r.url);if(!['https:','http:'].includes(url.protocol))throw new Error('Invalid source URL.');}
 const previous=await readFile('.sync/state.json','utf8').then(JSON.parse).catch(()=>({}));
 const state=previous.deployment===deployment?previous:{deployment,reports:{}};
 let changed=0;
 if(state.csvHash!==hash(csv)||process.argv.includes('--force')){for(let start=0;start<records.length;start+=100)await run('workspace:importOpportunities',{records:records.slice(start,start+100)});state.csvHash=hash(csv);changed=records.length;await checkpoint(state);}
 let uploaded=0;
 for(const date of (await readdir(resolve(source,'reports'))).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)).sort()){
  const file=resolve(source,'reports',date,'internship-report.pdf');
  const pdf=await readFile(file).catch(()=>null);if(!pdf)continue;
  const digest=hash(pdf);if(state.reports?.[date]===digest)continue;
  const summary=(await readFile(resolve(source,'reports',date,'changes.md'),'utf8').catch(()=>`Daily internship research for ${date}.`)).replace(/^#[^\n]*\n+/,'').trim();
  const uploadUrl=await run('workspace:uploadUrl',{});
  const response=await fetch(uploadUrl,{method:'POST',headers:{'Content-Type':'application/pdf'},body:pdf});
  if(!response.ok)throw new Error(`PDF upload failed for ${date}: ${response.status}`);
  const {storageId}=await response.json();await run('workspace:importReport',{date,summary,hash:digest,storageId});
  state.reports={...state.reports,[date]:digest};uploaded++;await checkpoint(state);console.log(`Uploaded report ${date}.`);
 }
 state.lastSuccess=new Date().toISOString();state.opportunities=records.length;
 await checkpoint(state);
 const result={at:state.lastSuccess,deployment,opportunities:records.length,upserted:changed,reportsUploaded:uploaded,reportCount:Object.keys(state.reports||{}).length};
 await writeFile(resolve(source,'internal/convex-sync-latest.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}finally{await lock.close();await import('node:fs/promises').then(fs=>fs.unlink('.sync/lock'));}
