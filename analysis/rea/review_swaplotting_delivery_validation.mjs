// Independent offline review. Docker, curl, fetch and output writes are synthetic.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {OPERATIONS,getPublicCatalog} from '../../webapp/private/operations.mjs';

const root=new URL('../../',import.meta.url),read=file=>fs.readFileSync(new URL(file,root)),sha=bytes=>createHash('sha256').update(bytes).digest('hex'),hash=file=>sha(read(file));
const writer='analysis/rea/review_swaplotting_delivery_validation.mjs',target='analysis/rea/verify_swaplotting_delivery.mjs';
const expectedTarget='2a6db7c6dc35ca88f174d3b9886ab4f33a3ad1e5a9135a6e840648d41176249d';
assert.equal(hash(target),expectedTarget);
const predecessorFile='analysis/webapp/swaplotting-delivery-writer-review-integrated.json',predecessor=JSON.parse(read(predecessorFile));
assert.equal(hash(predecessorFile),'2bee28d721189fcc9d57ee9108274174e3faa5f01d000f5ba6b79eba00c2f6a4');
const changedSincePredecessor=predecessor.inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>({file:row.file,before:row.sha256,after:hash(row.file)}));
assert.deepEqual(changedSincePredecessor.map(row=>row.file),['webapp/assets/swaplotting/host.js']);
assert.equal(changedSincePredecessor[0].before,'82c662136b1e0ed8a4ce5030ea1d9ecd663f015d08ed0eb819e66aa02c141de5');
assert.equal(changedSincePredecessor[0].after,'e6bf0ccc7c60b71b237853f37eb1d9d3f9a69a1eca4fc91286e38679f5e3ffd2');
const source=read(target).toString('utf8'),priorFile='analysis/webapp/guestbook-deployment.json',prior=JSON.parse(read(priorFile));
const publicNames=[...prior.files.map(row=>row.name),...['model','controller','view','map','host'].map(name=>'assets/swaplotting/'+name+'.js')];
const backendNames=[...prior.backendFiles.map(row=>row.name),'private/swaplotting-read-models.mjs'];
const all=[...publicNames,...backendNames].map(name=>({name,hash:hash('webapp/'+name)}));
assert.equal(all.length,70);assert.equal(publicNames.length,40);assert.equal(backendNames.length,30);
const inputs=[writer,predecessorFile,'analysis/rea/review_swaplotting_delivery_integrated.mjs','analysis/rea/review_swaplotting_delivery.mjs',target,priorFile,'environment/swaplotting-read/operations-before.json','environment/swaplotting-read/operations-before.mjs','webapp/private/operations.mjs',...all.map(row=>'webapp/'+row.name)].map(file=>({file,sha256:hash(file)}));
const checks=[];
const check=(name,evidence={})=>checks.push({name,status:'PASS',...evidence});
const prefix=source.slice(source.indexOf('const priorPath='),source.indexOf('const mode=process.argv[2]'));
assert.doesNotMatch(prefix,/execFile|fetch\(|writeFile/);
const preconditions=new Function('fs','assert','read','sha','OPERATIONS','root',prefix+'\nreturn {publicNames,backendNames,changed,enabledChanges,personalPlots};')(fs,assert,read,sha,OPERATIONS,root);
assert.deepEqual(preconditions.publicNames,publicNames);assert.deepEqual(preconditions.backendNames,backendNames);
assert.deepEqual(preconditions.changed,['get-legacy-kantah-d10364']);assert.deepEqual(preconditions.enabledChanges,[]);
assert.deepEqual(preconditions.personalPlots.map(op=>op.path),['/apis/SwaplottingTerdaftar','/apis/SwaplottingBelumTerdaftar']);
assert.ok(preconditions.personalPlots.every(op=>op.enabled===false));
check('Real current predecessor, source inventory and exact catalog preconditions pass',{
  trackedRuntimeFiles:70,publicFiles:40,backendFiles:30,catalogCount:176,enabled:84,changedRecordIds:preconditions.changed,enabledChanges:[],onlyRecordDelta:'tipeKantor.allowEmpty=true on existing legacy/Kantah GET',unrelatedRecordsUnchanged:175,
});

// Execute the unmodified writer body with synthetic system/transport boundaries.
const body=source.replace(/^import [^\n]+\n/gm,'').replace(/^const root=new URL\([^\n]+\n/m,'');
assert.doesNotMatch(body,/import\.meta/);
const captured={},calls={docker:0,curl:0,fetch:0},fakeImage='sha256:'+'2'.repeat(64),fakeContainer='1'.repeat(64);
for(const mode of ['image','deployment','public']){
 const writes=[],commands=[],logs=[];
 const facade={readFileSync:(...args)=>fs.readFileSync(...args),existsSync:path=>String(path)===String(new URL(`analysis/webapp/swaplotting-${mode}.json`,root))?false:fs.existsSync(path),writeFileSync:(path,bytes,options)=>{assert.equal(String(path),String(new URL(`analysis/webapp/swaplotting-${mode}.json`,root)));assert.equal(options.flag,'wx');writes.push(JSON.parse(bytes));}};
 const docker=(file,args,options)=>{
  calls.docker++;commands.push(args);assert.equal(file,'docker');assert.equal(options.windowsHide,true);
  if(args[0]==='image')return fakeImage+'\n';
  if(args[0]==='run'){assert.deepEqual(args.slice(0,7),['run','--rm','--read-only','--network','none','--entrypoint','node']);assert.equal(args[7],fakeImage);return JSON.stringify(all);}
  if(args[0]==='compose')return fakeContainer+'\n';
  if(args[0]==='inspect')return JSON.stringify({id:fakeContainer,readonly:true,ports:{'4173/tcp':[{HostIp:'127.0.0.1',HostPort:'4173'}]},image:fakeImage,health:'healthy',running:true,restarting:false,startedAt:new Date(Date.parse(prior.checkedAt)+1000).toISOString(),mounts:publicNames.map(name=>({Destination:'/app/webapp/'+name,Type:'bind',RW:false}))});
  if(args[0]==='exec')return JSON.stringify(all);
  assert.fail('Unexpected synthetic Docker command');
 };
 const curl=(file,args,options,callback)=>{
  calls.curl++;assert.equal(file,'curl.exe');assert.equal(options.windowsHide,true);assert.ok(args.includes('--disable'));assert.ok(args.includes('--proto'));assert.ok(args.includes('=https'));
  assert.equal(args.includes('--location'),false);assert.equal(args.includes('--cookie'),false);
  const url=new URL(args.at(-1));assert.equal(url.origin,'https://sentuh.davay.space');const name=url.pathname.slice(1);assert.ok(publicNames.includes(name));
  callback(null,Buffer.concat([read('webapp/'+name),Buffer.from('\nSTATIC_HTTP:200')]));
 };
 const fetch=async(input,options)=>{
  calls.fetch++;const url=new URL(input);assert.equal(url.origin,'http://localhost:4173');assert.equal(options.redirect,'error');
  if(url.pathname==='/health')return Response.json({status:'ok'});
  if(url.pathname==='/api/catalog')return Response.json({operations:getPublicCatalog()});
  const name=url.pathname.slice(1);assert.ok(publicNames.includes(name));return new Response(read('webapp/'+name));
 };
 // Use the same JS realm as imported registry rows so assert.deepEqual keeps
 // its production prototype semantics; every I/O boundary remains injected.
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction('fs','assert','createHash','execFileSync','execFile','fileURLToPath','OPERATIONS','getPublicCatalog','root','cwd','fetch','process','console',body)(facade,assert,createHash,docker,curl,fileURLToPath,OPERATIONS,getPublicCatalog,root,fileURLToPath(root),fetch,{argv:['node','review',mode]},{log:value=>logs.push(JSON.parse(value))});
 assert.equal(writes.length,1);const report=writes[0];captured[mode]=report;
 assert.equal(report.mode,mode);assert.equal(report.trackedRuntimeFiles,70);assert.equal(report.publicFileCount,40);assert.equal(report.backendFileCount,30);
 assert.equal(report.catalogCount,176);assert.equal(report.enabled,84);assert.equal(report.disabled,92);assert.equal(report.otherRecordsUnchanged,175);
 assert.deepEqual(report.enabledChanges,[]);assert.deepEqual(report.exactChangedRecordIds,['get-legacy-kantah-d10364']);
 for(const key of ['personalPlotPostEnabled','guestbookPostEnabled','geotagUploadEnabled','geotagWritesEnabled'])assert.equal(report[key],false);
 if(mode==='image'){
  assert.equal(report.imageId,fakeImage);assert.equal(report.matched,70);assert.equal(report.network,'none');assert.equal(report.bindMounts,0);
  assert.equal(report.files.length,70);assert.ok(report.files.every(row=>row.sourceHash===row.imageHash));
  check('Image mode accepts correct64hex SHA256 and compares all70 synthetic image/source rows',{matched:70,network:'none',synthetic:true});
 }else if(mode==='deployment'){
  assert.equal(report.matched,70);assert.equal(report.backendRestarted,true);assert.equal(report.files.length,40);assert.equal(report.backendFiles.length,30);
  assert.ok(report.files.every(row=>row.sourceHash===row.containerHash&&row.sourceHash===row.deployedHash));
  assert.ok(report.backendFiles.every(row=>!Object.hasOwn(row,'containerHash')&&row.sourceHash===row.deployedHash));
  assert.match(report.sessionPersistence,/previous in-memory account sessions are not preserved/);
  assert.equal(report.container.image,captured.image.imageId);
  check('Deployment mode uses40 public rows and30 backend deployedHash rows, replacement and new-login semantics',{matched:70,publicRows:40,backendRows:30,backendRowsWithContainerHash:0,synthetic:true});
 }else{
  assert.equal(report.matched,40);assert.equal(report.failed,0);assert.equal(report.backendBytesProbed,false);
  assert.ok(report.files.every(row=>row.sourceHash===row.publicHash&&row.status===200));
  check('Public mode checks exactly40 static assets and makes no backend/provider acceptance claim',{matched:40,backendBytesProbed:false,synthetic:true});
 }
}
assert.equal(calls.docker,5);assert.equal(calls.curl,40);assert.equal(calls.fetch,42);
check('All command and transport calls were injected offline fixtures',{syntheticDockerCalls:calls.docker,syntheticCurlCalls:calls.curl,syntheticFetchCalls:calls.fetch,realDockerCalls:0,realNetworkRequests:0,realDeliveryOutputsWritten:0});
assert.match(source,/\^sha256:\[0-9a-f\]\{64\}\$/);
assert.match(source,/personalPaths=\['\/apis\/SwaplottingTerdaftar','\/apis\/SwaplottingBelumTerdaftar'\]/);
check('Both pre-review blockers are corrected without changing70-file metrics or catalog enablement',{
 resolvedFindings:[{finding:'Image-ID guard required70hex instead of64.',resolution:'Only digest quantifier changed to64; tracked runtime count remains70.'},{finding:'Mutation-path prefix omitted the actual leading slash and matched zero records.',resolution:'Exact two leading-slash personal paths are matched; both stay disabled.'}],
});
for(const row of inputs)assert.equal(hash(row.file),row.sha256,'Changed during offline review: '+row.file);
const report={schemaVersion:1,predecessor:{file:predecessorFile,sha256:hash(predecessorFile)},changedSincePredecessor,successorReason:'Only host.patchSameScreen select ARIA synchronization changed after the prior frozen review. This current-source successor repeats the same scoped checks and preserves all prior evidence.',checkedAt:new Date().toISOString(),status:'PASS',reviewKind:'Independent offline actual-writer precondition and mocked mode/schema review',target:{file:target,sha256:hash(target)},writer:{file:writer,sha256:hash(writer)},inputs,checks,materialFindings:[],changedInputs:[],newActions:{realDockerCalls:0,networkRequests:0,providerOrAccountRequests:0,runtimeChanges:0,deliveryOutputsWritten:0},limits:['Synthetic mode success checks the actual writer logic and output schema, not the actual image, container, tunnel or server state. Root must run each real mode after build/deployment.','Deployment mode records container.image; the final integration summary should compare it to the separately recorded image-mode imageId.','A required backend recreation ends old in-memory sessions; static public probes cannot establish a new authenticated session or BPN acceptance.','Only tracked runtime files are verified; this review does not assert whole-image filesystem equivalence.']};
const output='analysis/webapp/swaplotting-delivery-writer-review-validation.json';
fs.writeFileSync(new URL(output,root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',checks:checks.length,targetSha256:hash(target),output,sha256:hash(output),realDockerCalls:0,networkRequests:0}));
