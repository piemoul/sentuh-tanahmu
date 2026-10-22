// Independent static review only. Do not execute the delivery writer, Docker,
// curl, fetch, subprocesses or production/runtime actions from this review.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS,getPublicCatalog} from '../../webapp/private/operations.mjs';
const read=file=>fs.readFileSync(file),sha=file=>createHash('sha256').update(read(file)).digest('hex');
const writer='analysis/rea/verify_swaplotting_capture_delivery.mjs',output='analysis/webapp/swaplotting-capture-delivery-writer-review.json';
assert.ok(!fs.existsSync(output),'Preserve existing review');
assert.equal(sha(writer),'333fc4a19ffdbf1779faf093f3bbb8afb793cda049c79eef24544a874fbe605c');
const source=read(writer).toString('utf8'),baselinePath='analysis/webapp/swaplotting-capture-runtime-baseline.json',priorPath='analysis/webapp/swaplotting-deployment.json';
const baseline=JSON.parse(read(baselinePath)),prior=JSON.parse(read(priorPath));
const publicNames=[...prior.files.map(row=>row.name),'assets/swaplotting/camera.js','assets/swaplotting/capture-dialog.js','assets/swaplotting/photo-store.js','assets/swaplotting/photo-removal.js'];
const backendNames=prior.backendFiles.map(row=>row.name),names=[...publicNames,...backendNames];
const writerInputFiles=[...new Set([writer,baselinePath,priorPath,...baseline.runtime.map(row=>row.file),...names.map(name=>'webapp/'+name)])];
const files=[...new Set([...writerInputFiles,'webapp/server.mjs','webapp/private/http-api.mjs','Dockerfile','compose.yaml','.dockerignore','analysis/rea/review_swaplotting_capture_delivery_writer.mjs'])];
const capture=()=>files.map(file=>({file,sha256:sha(file)})),inputs=capture(),checks=[];
function check(name,fn){fn();checks.push({name,status:'PASS',kind:'STATIC_SOURCE_AND_LOCAL_FILE_REVIEW'});}
const has=text=>assert.ok(source.includes(text),text);
check('Frozen predecessor and derived inventory bind 74 sources,44 public,30 backend,85 input paths',()=>{
 assert.equal(sha(baselinePath),'08f503bf45054aeb0de13247c0104b21e296d5554fceb9f91502ad3cbdbbed00');
 assert.equal(sha(priorPath),'397e3c0a4154b798c55dd955b6427f8d57d14e66f2b2a923dfe4d74b2a9cc5ae');
 assert.equal(publicNames.length,44);assert.equal(backendNames.length,30);assert.equal(new Set(names).size,74);assert.equal(writerInputFiles.length,85);
 assert.equal(baseline.runtime.length,75);assert.equal(baseline.native.length,42);assert.equal(baseline.historical.length,517);assert.equal(baseline.documents.length,19);
 for(const name of names)assert.ok(/^[A-Za-z0-9_./-]+$/.test(name)&&!name.startsWith('/')&&!name.split('/').includes('..'));
 const changed=baseline.runtime.filter(row=>sha(row.file)!==row.sha256).map(row=>row.file).sort();
 assert.deepEqual(changed,['webapp/app.js','webapp/assets/queue/preread-controller.js','webapp/assets/swaplotting/controller.js','webapp/assets/swaplotting/host.js','webapp/assets/swaplotting/model.js','webapp/assets/swaplotting/view.js','webapp/styles.css'].sort());
 for(const row of prior.backendFiles){assert.equal(sha('webapp/'+row.name),row.sourceHash);assert.equal(row.deployedHash,row.sourceHash);}
 has("const stable=()=>{for(const row of inputs)assert.equal(sha(read(row.file)),row.sha256");has('stable();assert.ok(all.every');
});
check('Full catalog remains byte-identical176/84/92 with relevant mutation gates disabled',()=>{
 assert.equal(sha(baseline.catalog.file),baseline.catalog.sha256);assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,84);assert.equal(getPublicCatalog().length,176);
 for(const id of ['post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-geotag-uploadgeotag-d96b98','post-api-booking-d8b640','post-api-booking-limit-d8bf80']){const op=OPERATIONS.find(op=>op.id===id);assert.equal(op?.method,'POST');assert.equal(op.effect,'write');assert.equal(op.enabled,false);}
 for(const op of OPERATIONS.filter(op=>op.effect==='write'&&/bukutamu|geotag/i.test(op.path??op.endpoint)))assert.equal(op.enabled,false);
 has("assert.deepEqual(catalog.operations,expectedCatalog,'Complete deployed catalog unchanged')");
});
check('Fresh image command pins immutable imageID and requests read-only/network-none execution without bind args',()=>{
 has("['image','inspect','--format','{{.Id}}',image]");has("['run','--rm','--read-only','--network','none','--entrypoint','node',imageId,'-e',imageSource]");
 has("row.imageHash=rows.find(item=>item.name===row.name).hash");has('contentMatches(rows)');
 const dockerfile=read('Dockerfile').toString('utf8');assert.match(dockerfile,/^FROM node:24-bookworm-slim@sha256:[0-9a-f]{64}/m);assert.doesNotMatch(dockerfile,/^\s*VOLUME\b/m);
 assert.doesNotMatch(source,/execFile(?:Sync)?\('docker',\[(?:'build'|'restart'|'stop'|'rm'|'create')/);
});
check('Existing deployment checks same container,image,StartedAt,read-only loopback mounts before and after byte reads',()=>{
 for(const text of ["assert.equal(info.id,prior.container.id","assert.equal(info.image,prior.container.image","assert.equal(info.startedAt,prior.container.startedAt","assert.equal(info.readonly,true)","assert.equal(info.running,true)","assert.equal(info.restarting,false)","assert.equal(info.health,'healthy')","binding.HostPort==='4173'&&['127.0.0.1','::1'].includes(binding.HostIp)","info.mounts.every(mount=>mount.Type==='bind'&&mount.RW===false)","for(const name of publicNames)","for(const name of backendNames)assert.ok(!info.mounts.some",'const after=inspect(id);sameRunningProcess(after)'])has(text);
 has("['exec',id,'node','-e',imageSource]");has('contentMatches(remote)');has('all.slice(0,44)');has('all.slice(44)');has('row.deployedHash,row.sourceHash');
});
check('Public probes are fixed HTTPS paths with normal TLS,disabled curl config,no auth/cookies/redirect following',()=>{
 const line=source.split(/\r?\n/).find(line=>line.includes("execFile('curl.exe'"));assert.ok(line);
 for(const flag of ["['--disable','--silent','--show-error'","'--proto','=https'","'https://sentuh.davay.space/'+row.name","'--max-time','20'"])assert.ok(line.includes(flag),flag);
 assert.doesNotMatch(line,/['"](?:-k|--insecure|-L|--location|--location-trusted|--cookie|--cookie-jar|--netrc|--user|--header|--resolve|--connect-to)['"]/);
 has("if(attempts[0].errorCode===28)attempts.push(await probe(row))");has('row.status!==200||row.publicHash!==row.sourceHash');
 has("credentials:'omit',redirect:'error',cache:'no-store'");
});
check('Only metadata/static reads are selected; neither session bootstrap nor credentials/account payloads are inspected',()=>{
 has("await local('health')");has("await local('api/catalog')");
 assert.doesNotMatch(source,/local\(['"](?:api\/state|api\/execute|api\/login|api\/logout|api\/download|api\/preview)/);
 assert.doesNotMatch(source,/\.Config\.Env|\.State\.Pid|process\.env|Set-Cookie|\.headers\.get\(['"]set-cookie/i);
 for(const name of publicNames)assert.ok(!name.startsWith('private/')&&!name.startsWith('api/'));
 has("no login/session validity was inspected.");
 const api=read('webapp/private/http-api.mjs').toString('utf8');assert.ok(api.includes("if (requestPath === '/api/catalog' && req.method === 'GET')"));
 assert.ok(api.indexOf("if (requestPath === '/api/state' && req.method === 'GET')")<api.indexOf("if (requestPath === '/api/catalog' && req.method === 'GET')"));
});
check('Three unique mode receipts are guarded; no predecessor overwrite or raw fetched response body is persisted',()=>{
 has('const output=`analysis/webapp/swaplotting-capture-${mode}.json`');has("assert.equal(fs.existsSync(new URL(output,root)),false");has("fs.writeFileSync(new URL(output,root),JSON.stringify(report,null,2)+'\\n',{flag:'wx'})");
 assert.equal((source.match(/fs\.writeFileSync\(/g)??[]).length,1);
 has("publicHash:sha(stdout.subarray(0,at))");has('row.deployedHash=sha(Buffer.from(await response.arrayBuffer()))');
 has('report.changedInputs=[]');has("assert.equal(report.failed??0,0)");
});
assert.deepEqual(capture(),inputs);
const report={schemaVersion:1,status:'PASS',scope:'Short independent static/local-file review of the delivery verifier only. The writer was not executed and no Docker, subprocess, server, HTTP, browser, credential, session or runtime action was performed by this reviewer.',reviewer:'/root/verification_methods_audit',writer:{file:writer,sha256:sha(writer)},inputs,changedInputs:[],checks,staticCheckCount:checks.length,findings:[],inventory:{deliveryFiles:74,frontend:44,backend:30,writerSourceInputPaths:85,baselineRuntime:75,currentRuntime:79},conclusions:['The curated44frontend/30backend inventory is reconstructed from the frozen40/30 predecessor plus four new public assets; the writer hashes every named file and binds all85 deduplicated source/metadata paths through completion. It is not a claim that every possible public resource is in this curated inventory.','Image mode commands an immutable inspected imageID with read-only filesystem, network none and no explicit mounts. Current pinned Dockerfile introduces no VOLUME; actual image configuration and bytes remain for root execution, not independent observation here.','Deployment separately compares74 running-container hashes and44 served public hashes, retains predecessor containerID/image/StartedAt before and after, requires loopback4173 and read-only binds, covers44 frontend sources and forbids overlays on30 backend paths. Native evidence mounts and other existing readonly frontend mounts are not falsely treated as backend updates.','Public mode probes only fixed static HTTPS paths, disables curl configuration, adds no authentication/cookie/redirect/insecure flags, hashes bodies without persisting them, and bounds retries to one extra timeout28 attempt.','Health/catalog static read paths do not request api/state or inspect authenticated session validity. Docker inspect intentionally omits environment values; persisted operational metadata may contain container IDs and mount paths, not account credentials/PII payloads.','Existing evidence is read and preserved. Only the unique requested mode receipt is written with wx; public failures are retained as a failed receipt before assertion, rather than accepted as success.'],actions:{deliveryWriterExecuted:false,dockerCalls:0,subprocessCalls:0,networkRequests:0,sessionOrCredentialReads:0,runtimeEdits:0,productionOrBookingWrites:0},limits:['This is static source/file review, not independent observation of root Docker image, running container, served files, TLS exchange or public reachability. Root delivery receipts must supply those execution observations.','Matching containerID/image/StartedAt supports container continuity; it does not establish validity of any retained user login/session or a comprehensive forensic process-lifetime claim.','No new tests, runtime, predecessor writer or old receipt were changed. Source hashes were compared before and after this review.']};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({file:output,sha256:sha(output),checks:checks.length,writerSourcePins:85}));
