// Independent root-writer/static-fixture review. Never execute delivery/Docker/network.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const output='analysis/webapp/personal-coordinate-delivery-writer-review.json';assert.ok(!fs.existsSync(output),'Preserve earlier review');
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=['analysis/rea/review_personal_coordinate_delivery_writer.mjs','analysis/rea/verify_personal_coordinate_entry_delivery.mjs','analysis/rea/prepare_personal_coordinate_entry_verifiers.mjs','analysis/webapp/personal-coordinate-entry-baseline.json','analysis/webapp/swaplotting-capture-deployment.json','webapp/private/operations.mjs'];
const inputs=paths.map(file=>({file,sha256:hash(fs.readFileSync(file))}));
const source=fs.readFileSync(paths[1],'utf8'),preparer=fs.readFileSync(paths[2],'utf8'),baseline=JSON.parse(fs.readFileSync(paths[3])),prior=JSON.parse(fs.readFileSync(paths[4]));
assert.equal(inputs[1].sha256,'44b79daa84eee33aedd63020600f74b7bebbc0478157a3d57cf3fc95f28ce60e');
const probes=[];const check=(id,fn)=>{fn();probes.push({id,status:'PASS'});};
check('baseline-and-predecessor-counts-and-hashes',()=>{
 assert.equal(inputs[3].sha256,'d92d1c19e45fe94467f3825606b968d18ba94c2b06bac6fa9a728ca7414af182');assert.equal(inputs[4].sha256,'23331e0e3250242eb03066ef3517782af18e3311d6e19f8912363ecff360dc6c');
 assert.deepEqual(['runtime','native','historical','documents'].map(k=>baseline[k].length),[79,44,1014,27]);assert.deepEqual([prior.files.length,prior.backendFiles.length,prior.trackedRuntimeFiles],[44,30,74]);
 assert.match(source,/baseline\.historical\.length,1014/);assert.match(source,/prior\.trackedRuntimeFiles,74/);
});
check('successor-inventory-and-only-seven-frontend-paths',()=>{
 const changed=source.match(/const expectedChanged=(\[[^\n]+\]);/)[1].replaceAll("'",'"');
 assert.deepEqual(JSON.parse(changed).sort(),['webapp/app.js','webapp/styles.css',...['model','controller','map','view','host'].map(n=>'webapp/assets/swaplotting/'+n+'.js')].sort());
 assert.match(source,/const addedPublic=\['assets\/swaplotting\/coordinate-entry\.js'\]/);assert.match(source,/publicNames\.length,45/);assert.match(source,/new Set\(names\)\.size,75/);
 assert.match(source,/currentRuntimeFiles:80/);assert.match(source,/all\.length,75/);assert.match(source,/All75 delivery sources stable/);assert.doesNotMatch(source,/queue\/preread-controller/);
 assert.match(source,/all\.slice\(0,45\)/);assert.match(source,/all\.slice\(45\)/);assert.match(source,/localGetRequests:47/);
});
check('only-readonly-container-commands-no-running-service-restart',()=>{
 assert.doesNotMatch(source,/\['(?:restart|stop|start|kill|rm|update|build|pull)'/);assert.doesNotMatch(source,/\['compose','(?:up|down|restart|build)'/);
 assert.match(source,/\['compose','ps','-q','webapp'\]/);assert.match(source,/\['exec',id,'node','-e',imageSource\]/);
 assert.match(source,/\['run','--rm','--read-only','--network','none','--entrypoint','node',imageId,'-e',imageSource\]/);
 assert.match(source,/const imageSource=`const fs=require\('node:fs'\),c=require\('node:crypto'\)/);
 assert.match(source,/Container ID, image and StartedAt unchanged/);assert.match(source,/no login\/session validity was inspected/);
});
check('prior-running-image-vs-fresh-image-and-readonly-frontend-overlay',()=>{
 for(const marker of ['info.id,prior.container.id','info.image,prior.container.image','info.startedAt,prior.container.startedAt','info.readonly,true','info.running,true','info.restarting,false',"info.health,'healthy'"])assert.ok(source.includes(marker),marker);
 assert.match(source,/binding\.port==='4173\/tcp'.*\['127\.0\.0\.1','::1'\]/);
 assert.match(source,/All observed mounts readonly binds/);assert.match(source,/Readonly frontend overlay/);assert.match(source,/Backend must remain from unchanged prior running image/);
 assert.match(source,/runningUsesFreshVerificationImage:info\.image===image\.imageId/);assert.match(source,/freshImageContent:true,runningContainerInspected:false/);
 assert.match(source,/Object\.assign\(report,\{url:'http:\/\/localhost:4173'/);
});
check('byte-identical-catalog-with-disabled-writes-and-backend-inventory',()=>{
 assert.equal(inputs[5].sha256,baseline.catalog.sha256);assert.equal(baseline.catalog.file,'webapp/private/operations.mjs');
 for(const marker of ['OPERATIONS.length,176','OPERATIONS.filter(op=>op.enabled).length,84','getPublicCatalog()','allRecordsUnchanged:176','enabledChanges:[]','exactChangedRecordIds:[]'])assert.ok(source.includes(marker),marker);
 for(const id of ['post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-geotag-uploadgeotag-d96b98','post-api-booking-d8b640','post-api-booking-limit-d8bf80'])assert.ok(source.includes(id));
 assert.match(source,/assert\.equal\(op\.enabled,false,id\)/);assert.match(source,/guestbookWrites\.every\(op=>op\.enabled===false\)/);
 for(const row of prior.backendFiles)assert.equal(row.deployedHash,row.sourceHash,row.name);
});
check('fixed-anonymous-static-get-scope-normal-tls-no-redirect-or-cookie-flags',()=>{
 assert.match(source,/fetch\('http:\/\/localhost:4173\/'.*method:'GET',credentials:'omit',redirect:'error'/);
 assert.ok(source.includes("'https://sentuh.davay.space/'+row.name"));
 assert.match(source,/\['--disable','--silent','--show-error','--max-time','20','--proto','=https'/);
 assert.doesNotMatch(source,/'--(?:insecure|location|cookie|user|header|resolve)'/);assert.match(source,/publicHash!==row\.sourceHash/);assert.match(source,/row\.status!==200/);
 assert.match(source,/if\(attempts\[0\]\.errorCode===28\)/);assert.match(source,/changedInputs=\[\]/);assert.match(source,/flag:'wx'/);
});
const fixtureFiles=['webapp/tests/personal-coordinate-browser-fixture.mjs','webapp/tests/personal-coordinate-browser-page.mjs'];
const fixtureSources=fixtureFiles.map(file=>fs.readFileSync(file,'utf8'));
const fixtureReviewed=fixtureFiles.map((file,index)=>({file,sha256:hash(Buffer.from(fixtureSources[index]))}));
check('synthetic-fixture-boundaries-and-ready-resize-control',()=>{
 const [server,page]=fixtureSources;
 assert.match(server,/transport:blocked,queueTransport:blocked,bhumiTransport:blocked/);assert.match(server,/hardwareCameraCalls,0/);assert.match(server,/camera=\(\), microphone=\(\), geolocation=\(\)/);
 assert.match(server,/server\.listen\(4208,'127\.0\.0\.1'/);assert.match(server,/frame-ancestors 'none'.*frame-ancestors 'self'/);
 assert.match(server,/No other API allowed/);assert.match(server,/tileRequests\+\+/);assert.match(server,/res\.end\(png\)/);
 assert.match(page,/photoCaptureFactory:options=>/);assert.match(page,/canvas\.captureStream\(5\)/);assert.match(page,/getCoordinatePoints:\(\)=>points/);
 assert.match(page,/dataset\.fixtureAction='resize'/);assert.match(page,/action==='resize'/);assert.match(page,/main\.style\.maxWidth/);
});
check('writer-modes-and-retained-evidence-guarded-against-source-changes',()=>{
 assert.match(source,/\['image','deployment','public'\]\.includes\(mode\)/);assert.match(source,/--verify-inputs-only/);assert.match(source,/const stable=\(\)=>/);
 assert.match(source,/Preserve all prior delivery evidence/);assert.match(source,/imageEvidence\(\)/);assert.match(source,/assert\.deepEqual\(deployment\.changedInputs,\[\]\)/);
 assert.match(preparer,/Create successor verifiers; never rewrite/);assert.match(preparer,/Preserve /);assert.match(preparer,/created:2,executed:0,oldFilesChanged:0/);
});
for(const row of inputs)assert.equal(hash(fs.readFileSync(row.file)),row.sha256,row.file);
for(const row of fixtureReviewed)assert.equal(hash(fs.readFileSync(row.file)),row.sha256,row.file);
const report={checkedAt:new Date().toISOString(),status:'PASS',inputs,probes,passed:probes.length,failed:0,reviewedFixtureFiles:fixtureReviewed,resolvedFindings:[{finding:'Stale final assertion message All74 while guard checked75.',resolution:'Root changed message toAll75; guard remains all75.'},{finding:'Resize button absent from earlier serverHTML static snapshot.',resolution:'Current page creates an explicit resize button dynamically before open; no serverHTML duplicate needed.'}],materialFindings:[],authorDisclosure:'Reviewer authored personal map implementation/tests, not the root delivery writer/preparer/browser fixture. This receipt reviews root static delivery and fixture boundaries; author map tests/independent host review/actual browser QA are separate.',volatileRuntimeHashesPinned:false,writerExecuted:false,dockerActions:0,networkRequests:0,browserActions:0,deviceActions:0,limits:'Source/static metadata review only. Does not claim image/container/current public content, real session continuity, real camera/GNSS/Android or provider/server acceptance; root must run delivery modes after all source is stable.'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,passed:report.passed,output,sha256:hash(fs.readFileSync(output))}));
