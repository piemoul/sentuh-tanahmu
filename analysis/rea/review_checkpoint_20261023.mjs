// Read-only publication review apart from local, non-published receipts.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {spawnSync}from'node:child_process';import {createHash}from'node:crypto';
const root=process.cwd(),cwd=path.resolve('environment/publish/sentuh-tanahmu');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=args=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});assert.equal(r.status,0,args[0]);return r.stdout;};
const changed=['.graphify/README.md','docs/SOURCE-MANIFEST.json'];
const added=['.graphify/FRESHNESS-2026-10-23.json','analysis/BERKAS-QUESTION-CODEC-20261023.md','analysis/GEOTAG-LEGITIMATE-WORKFLOW-GAP-20261023.md','docs/CHECKPOINT-2026-10-23.json'];
assert.equal(git(['remote','get-url','origin']).trim(),'https://github.com/piemoul/sentuh-tanahmu.git');
assert.deepEqual(git(['diff','--name-only','-z']).split('\0').filter(Boolean).sort(),[...changed].sort());
assert.deepEqual(git(['ls-files','--others','--exclude-standard','-z']).split('\0').filter(Boolean).sort(),[...added].sort());
assert.equal(git(['diff','--cached','--name-only']),'');
const files=[...git(['ls-files','-z']).split('\0').filter(Boolean),...added];
assert.equal(files.length,794);assert.equal(new Set(files).size,794);
for(const file of files){
 assert.ok(!/^(?:environment|tools|analysis\/(?:recovered|unpacked|runtime|connection-diagnostics|route-spoofer))\//.test(file),file);
 assert.ok(!/\.(?:xapk|apk|so|dex|p12|pfx|jks|pem|key|log)$/i.test(file),file);
 assert.ok(file==='.env.example'||!/(?:^|\/)\.env(?:\.|$)/.test(file),file);
 assert.ok(!/^\.graphify\/(?:branch\.json|worktree\.json|needs_update|cache\/|description-instructions\/|label-instructions\/)/.test(file),file);
 assert.ok(!fs.lstatSync(path.join(cwd,file)).isSymbolicLink());
}
for(const file of [...changed,...added]){
 const text=fs.readFileSync(path.join(cwd,file),'utf8');
 for(const pattern of [/AIza[0-9A-Za-z_-]{30,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,/gh[pousr]_[A-Za-z0-9]{24,}/,/[A-Za-z]:\\(?:Users|ai)\\/])assert.equal(pattern.test(text),false,'Possible private material in '+file);
}
const sourceManifest=JSON.parse(fs.readFileSync(path.join(cwd,'docs/SOURCE-MANIFEST.json')));
assert.equal(sourceManifest.files.length,760);
for(const row of sourceManifest.files){assert.equal(hash(path.join(root,row.file)),row.workspaceSha256,row.file);assert.equal(hash(path.join(cwd,row.file)),row.publishedSha256,row.file);}
const old=JSON.parse(git(['show','HEAD:docs/SOURCE-MANIFEST.json']));
const current=new Map(sourceManifest.files.map(row=>[row.file,row]));
for(const row of old.files)assert.deepEqual(current.get(row.file),row,'Existing manifest record changed: '+row.file);
const originalGraph=git(['show','HEAD:.graphify/graph.json']);
assert.equal(createHash('sha256').update(originalGraph).digest('hex'),hash(path.join(cwd,'.graphify/graph.json')));
const raw=path.resolve('analysis/graphify-checkpoint-20261023/precommit-portable-check.raw.json');
const prior=path.join(cwd,'.graphify/portable-check.json'),held=path.resolve('analysis/graphify-checkpoint-20261023/precommit-preserved-report.json');
assert.equal(fs.existsSync(raw),false);assert.equal(fs.existsSync(held),false);
assert.ok(held.startsWith(root+path.sep));const priorHash=hash(prior);let portableResult;
fs.renameSync(prior,held);
try{portableResult=spawnSync(process.execPath,[path.join(process.env.APPDATA??'', 'npm/node_modules/@sentropic/graphify/dist/cli.js'),'portable-check','.graphify','--json'],{cwd,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});fs.writeFileSync(raw,portableResult.stdout,{flag:'wx'});}
finally{fs.renameSync(held,prior);}
assert.equal(hash(prior),priorHash);assert.equal(portableResult.status,1);
const portable=JSON.parse(fs.readFileSync(raw));assert.equal(portable.issues.length,595);assert.ok(portable.issues.every(row=>row.jsonPath.endsWith('.quote')));assert.equal(portable.ok,false);
git(['diff','--check']);
const report={schemaVersion:1,checkedAt:new Date().toISOString(),passed:true,scope:'Incremental review of six documentation/checkpoint files against the existing published and reviewed source; all 794 paths screened and all 760 source manifest records reverified.',changedFiles:changed,addedFiles:added,applicationChanged:false,previousManifestRecordsUnchanged:old.files.length,sourceManifestFiles:760,publicationFiles:794,forbiddenArtifactFiles:0,privatePatternFindingsInDelta:0,liveAccountDataInDelta:false,graphBytesUnchanged:true,portableCheck:{passed:false,exitCode:1,issues:595,allCitationQuoteStrings:true,previousReportPreserved:true,rawReportSha256:hash(raw)},files:[...changed,...added].map(file=>({file,sha256:hash(path.join(cwd,file))})),sourceManifestSha256:hash(path.join(cwd,'docs/SOURCE-MANIFEST.json')),productionRequests:0,productionWrites:0};
fs.writeFileSync('environment/publish/checkpoint-20261023-publication-review.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,publicationFiles:794,changedFiles:2,addedFiles:4,privateFindings:0,forbiddenFiles:0,portableCheckPassed:false,portableFindings:595}));
