// New, bounded review receipt. This never executes the finalizer's write phase.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root=new URL('../../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root));
const json=file=>JSON.parse(read(file));
const hash=file=>createHash('sha256').update(read(file)).digest('hex');
const bind=file=>({file,sha256:hash(file)});
const writer='analysis/rea/review_guestbook_evidence.mjs';
const finalizer='analysis/rea/finalize_guestbook.mjs';
const expectedFinalizer='0ae4c51be2b36696b481322a4c668e27a18be96176fe957abd7bc79da225e05a';
assert.equal(hash(finalizer),expectedFinalizer);
const source=read(finalizer).toString('utf8');
const checks=[];
const check=(name,fn)=>{const evidence=fn();checks.push({name,status:'PASS',...evidence});};
const baselineFile='analysis/webapp/plot-read-baseline.json';
const baseline=json(baselineFile);
const receiptFiles={
  node:'analysis/webapp/guestbook-node-tests-integrated.json',
  vm:'analysis/webapp/guestbook-regressions-integrated.json',
  browser:'analysis/webapp/guestbook-browser-final.json',
  client:'analysis/webapp/guestbook-client-verification.json',
  integrationReview:'analysis/webapp/guestbook-integration-review.json',
  frontend:'analysis/webapp/guestbook-frontend-verification-integrated.json',
  frontendReview:'analysis/webapp/guestbook-frontend-review-integrated.json',
  plot:'analysis/webapp/plot-read-backend-verification.json',
  legacySuccessors:'analysis/webapp/guestbook-legacy-successors.json',
  image:'analysis/webapp/guestbook-image.json',
  deployment:'analysis/webapp/guestbook-deployment.json',
  public:'analysis/webapp/guestbook-public.json',
  publicUi:'analysis/webapp/guestbook-public-ui.json',
  coverage:'analysis/webapp/function-coverage-guestbook.json',
};
const reports=Object.fromEntries(Object.entries(receiptFiles).map(([key,file])=>[key,json(file)]));
const outputs=['analysis/webapp/guestbook-summary.json','analysis/GUESTBOOK-WEBAPP-VALIDATION.md'];
const watched=new Map();
const watch=file=>{if(!watched.has(file))watched.set(file,hash(file));};
for(const file of [finalizer,writer,baselineFile,...Object.values(receiptFiles),
  'analysis/GUESTBOOK-IMPLEMENTATION-BOUNDARY.md','analysis/SWAPLOTTING-IMPLEMENTATION-BOUNDARY.md',
  'analysis/PLOT-NUMBER-FOLLOWUP.md','analysis/WEBAPP-FUNCTION-COVERAGE-GUESTBOOK.md',
  'analysis/webapp/guestbook-frontend-review.json',
  'analysis/recovered/plot-number-followup/flow.json','analysis/recovered/plot-number-followup/verification.json'])watch(file);

check('All finalizer pre-write assertions pass without executing report construction or writes',()=>{
  const start=source.indexOf('const baselineFile=');
  const end=source.indexOf('const report={');
  assert.ok(start>0&&end>start);
  const prefix=source.slice(start,end);
  assert.doesNotMatch(prefix,/writeFile|appendFile|spawn|fetch\(|https?\.request|execSync/);
  const readOnlyFs=Object.freeze({existsSync:path=>fs.existsSync(path)});
  // Only the reviewed assertion prefix receives a read-only filesystem facade.
  new Function('fs','assert','hash','json','bind','root',prefix)(readOnlyFs,assert,hash,json,bind,root);
  for(const file of outputs)assert.equal(fs.existsSync(new URL(file,root)),false,file);
  return {writePhaseExecuted:false,finalizerOutputsCreated:false};
});

check('Protected baseline and exact seven runtime changes match the finalizer',()=>{
  assert.equal(baseline.runtime.length,63);assert.equal(baseline.native.length,37);
  assert.equal(baseline.historical.length,409);assert.equal(baseline.documents.length,6);
  const protectedRows=[baseline.requestCorpus,...baseline.native,...baseline.historical,...baseline.documents];
  for(const row of protectedRows){assert.equal(hash(row.file),row.sha256,row.file);watch(row.file);}
  const changed=baseline.runtime.filter(row=>hash(row.file)!==row.sha256).map(row=>row.file);
  assert.deepEqual(changed,['webapp/app.js','webapp/private/api-client.mjs','webapp/private/build-operations.py','webapp/private/http-api.mjs','webapp/private/operations-runtime.mjs','webapp/private/operations.mjs','webapp/styles.css']);
  for(const row of baseline.runtime)watch(row.file);
  return {runtimeFiles:63,protectedNativeLedgers:37,protectedHistoricalReceipts:409,protectedDocuments:6,changedRuntime:changed,requestCorpus:baseline.requestCorpus};
});

check('Current Node, VM, browser and independent reviews bind the same final app',()=>{
  const current=hash('webapp/app.js');
  assert.equal(current,'28fa710bfee14fe46fdabae45003994f0eae1892e6721691b76650e40af7b25c');
  const counts={};
  for(const key of ['node','vm','browser','client','integrationReview','frontend','frontendReview','publicUi']){
    const inputs=reports[key].inputs??[];counts[key]=inputs.length;
    for(const row of inputs){const file=row.file??row.path;assert.equal(hash(file),row.sha256,file);watch(file);}
    if(['node','vm','browser','frontend','frontendReview','publicUi'].includes(key)){
      const row=inputs.find(row=>(row.file??row.path)==='webapp/app.js');
      assert.ok(row,key+' must bind actual app');assert.equal(row.sha256,current,key);
    }
  }
  assert.equal(reports.node.tests,1437);assert.equal(reports.node.pass,1437);assert.equal(reports.node.fail,0);
  assert.equal(reports.vm.passed,1190);assert.equal(reports.vm.suites.length,23);
  assert.equal(reports.browser.passed,15);assert.equal(reports.browser.failed,0);
  return {currentApp:bind('webapp/app.js'),receiptInputCounts:counts,nodeTests:1437,vmChecks:1190,vmSuites:23,browserChecks:15,testSuitesRerun:false};
});

check('Plot author receipt is explicitly historical only for its old app context',()=>{
  const old=json('analysis/webapp/guestbook-frontend-review.json').inputs.find(row=>row.path==='webapp/app.js').sha256;
  assert.equal(old,'e9e7296c1262c70fb6fef6f766b9be026f45c00ede0da39036584adb35ae3ea9');
  const drift=[];
  for(const row of reports.plot.inputFiles){
    if(hash(row.file)!==row.sha256)drift.push(row.file);
    if(row.file==='webapp/app.js')assert.equal(row.sha256,old);
    else {assert.equal(hash(row.file),row.sha256,row.file);watch(row.file);}
  }
  assert.deepEqual(drift,['webapp/app.js']);
  assert.equal(reports.plot.tests.pass,148);assert.equal(reports.plot.tests.newBackendTests,30);
  assert.match(source,/historicalContextOnly:plotContext/);
  assert.match(source,/Historical frontend context, not a current whole-app source claim/);
  return {inputFiles:reports.plot.inputFiles.length,currentMatching:reports.plot.inputFiles.length-1,historicalAppSha256:old,currentAppSha256:hash('webapp/app.js'),scopedBackendTests:148,newPlotTests:30};
});

check('JPEG dimensions and unchanged capture bytes are independently parsed',()=>{
  const screenshot=reports.browser.screenshot;
  const bytes=read(screenshot.file);
  assert.equal(hash(screenshot.file),screenshot.sha256);assert.equal(screenshot.mimeType,'image/jpeg');
  assert.equal(bytes.readUInt16BE(0),0xffd8);
  const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  let offset=2,dimensions=null;
  while(offset<bytes.length){
    assert.equal(bytes[offset++],0xff);
    while(bytes[offset]===0xff)offset++;
    const marker=bytes[offset++];
    if(marker===0xd9||marker===0xda)break;
    if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
    const size=bytes.readUInt16BE(offset);assert.ok(size>=2&&offset+size<=bytes.length);
    if(sof.has(marker)){dimensions={width:bytes.readUInt16BE(offset+5),height:bytes.readUInt16BE(offset+3),marker};break;}
    offset+=size;
  }
  assert.deepEqual(dimensions,{width:1265,height:712,marker:0xc0});
  assert.equal(screenshot.imagePixelsEdited,false);
  const retainedCapture='analysis/webapp/guestbook-desktop-final.png';
  assert.ok(read(retainedCapture).equals(bytes));watch(retainedCapture);watch(screenshot.file);
  return {screenshot:bind(screenshot.file),retainedMislabeledCapture:bind(retainedCapture),dimensions,imagePixelsEdited:false,independentImageInspection:'JPEG SOF parser; no pixel alteration or browser capture rerun.'};
});

check('Sixteen combined probe/final fixture calls are not represented as production requests',()=>{
  const file=reports.browser.transport.file,traffic=json(file);watch(file);
  assert.equal(hash(file),reports.browser.transport.sha256);
  assert.equal(traffic.calls.length,16);assert.equal(traffic.pending,0);assert.deepEqual(traffic.unexpected,[]);
  assert.ok(traffic.calls.every(row=>row.completed));
  assert.equal(traffic.calls.filter(row=>row.path==='/bukutamu').length,12);
  assert.equal(traffic.calls.filter(row=>row.path==='/account/account_summary').length,4);
  const zeroKeys=['productionRequests','providerRequests','cameraActions','geolocationActions','identitySubmissions','arrivalSubmissions','geotagSubmissions'];
  for(const key of zeroKeys)assert.equal(traffic[key],0,key);
  assert.equal(reports.browser.transport.fixtureStopped,true);
  assert.equal(reports.browser.transport.stopEvidence.loopbackPortClosed,true);
  assert.equal(reports.browser.transport.stopEvidence.exitCode,1);
  assert.equal(traffic.stopped,false);
  assert.match(source,/16panggilan browser adalah sintetis:4profile dan12metadata/);
  return {transport:bind(file),scope:'Combined preliminary probe and final browser fixture run, not 16 production calls or 16 final-only cases.',syntheticCalls:16,profileReads:4,guestbookReads:12,allCallsComplete:true,pending:0,zeroCounterKeys:zeroKeys,stopEvidence:'External exit code 1 and closed loopback port; persisted traffic.stopped is false and is not substituted for the external stop observation.'};
});

check('Image and deployed frontend/backend hash contracts use their actual row schemas',()=>{
  const image=reports.image,deployment=reports.deployment;
  assert.equal(image.files.length,64);assert.equal(image.matched,64);assert.equal(image.network,'none');
  assert.equal(deployment.files.length,35);assert.equal(deployment.backendFiles.length,29);
  assert.equal(deployment.backendFiles.filter(row=>Object.hasOwn(row,'containerHash')).length,0);
  for(const row of image.files){const file='webapp/'+row.name;assert.equal(hash(file),row.sourceHash);assert.equal(row.imageHash,row.sourceHash);watch(file);}
  for(const row of [...deployment.files,...deployment.backendFiles]){
    const file='webapp/'+row.name;assert.equal(hash(file),row.sourceHash);assert.equal(row.deployedHash,row.sourceHash);watch(file);
    if(Object.hasOwn(row,'containerHash'))assert.equal(row.containerHash,row.sourceHash);
  }
  assert.equal(deployment.container.image,image.imageId);
  assert.equal(deployment.container.health,'healthy');assert.equal(deployment.container.readonly,true);
  assert.deepEqual(deployment.container.ports['4173/tcp'],[{HostIp:'127.0.0.1',HostPort:'4173'}]);
  return {imageFiles:64,frontendFiles:35,backendFiles:29,backendRowsWithContainerHash:0,backendEvidenceField:'deployedHash',imageId:image.imageId,containerId:deployment.container.id,recordedLoopbackPort:4173,recordedHealthy:true,recordedReadonly:true};
});

check('Backend replacement and public anonymous gate require a new user login',()=>{
  const deployment=reports.deployment;
  assert.equal(deployment.backendRestarted,true);assert.notEqual(deployment.previousContainerId,deployment.container.id);
  assert.match(deployment.sessionPersistence,/previous in-memory account sessions are not preserved/);
  assert.equal(reports.publicUi.routeRendered,true);assert.equal(reports.publicUi.loginGateRendered,true);
  assert.equal(reports.publicUi.sessionChecking,false);assert.equal(reports.publicUi.guestbookMetadataRequests,0);
  assert.match(source,/old in-memory sessions ended/);
  assert.match(source,/old user session ended with the required backend recreation/);
  return {previousContainerId:deployment.previousContainerId,currentContainerId:deployment.container.id,oldInMemorySessionsPreserved:false,publicUiScope:'Anonymous route and login gate only; authenticated provider acceptance was not tested.',newLoginRequired:true};
});

check('Catalog delta and disabled arrival/geotag are consistent across coverage and deployment',()=>{
  const coverage=reports.coverage,deployment=reports.deployment;
  assert.equal(coverage.counts.catalogOperations,176);assert.equal(coverage.counts.enabledOperations,84);
  assert.equal(coverage.catalogDelta.unrelatedFullRecordsUnchanged,175);
  assert.deepEqual(coverage.catalogDelta.exactChangedRecordIds,['get-bukutamu-d28bf4']);
  assert.deepEqual(deployment.exactChangedRecordIds,coverage.catalogDelta.exactChangedRecordIds);
  assert.equal(deployment.guestbookPostEnabled,false);assert.equal(deployment.geotagWritesEnabled,false);
  for(const row of coverage.source.runtimeFiles){assert.equal(hash(row.file),row.sha256,row.file);watch(row.file);}
  assert.ok(Object.values(coverage.completion).every(value=>value===false));
  for(const row of [coverage.catalogDelta.baseline,coverage.catalogDelta.capturedModule]){assert.equal(hash(row.file),row.sha256);watch(row.file);}
  return {catalog:176,enabled:84,unrelatedRecordsUnchanged:175,arrivalPostEnabled:false,geotagWriteEnabled:false,allParityAndAcceptanceCompletionFlags:false,coverageJson:bind(receiptFiles.coverage),coverageDocument:bind('analysis/WEBAPP-FUNCTION-COVERAGE-GUESTBOOK.md')};
});

check('Retained failures and successor corrections remain preserved, not overwritten',()=>{
  const retained=['analysis/webapp/guestbook-node-tests.json','analysis/webapp/guestbook-regressions.json','analysis/webapp/guestbook-frontend-verification.json','analysis/webapp/guestbook-frontend-verification-final.json','analysis/webapp/guestbook-frontend-review.json','analysis/webapp/guestbook-browser-probe.json','analysis/webapp/guestbook-browser-observations.json',...reports.plot.tests.previousAttempts.map(row=>row.file)];
  for(const file of retained)watch(file);
  for(const row of reports.plot.tests.previousAttempts)assert.equal(hash(row.file),row.sha256,row.file);
  assert.equal(reports.legacySuccessors.passed,104);
  assert.match(source,/retainedAttempts:retained\.map\(bind\)/);
  assert.match(source,/original incorrectly labelled capture\/receipt retained, bytes unchanged/);
  return {retainedFiles:retained.length,legacyDependencyOnlySuccessorAssertions:104,oldFilesRewritten:false};
});

check('Report and Markdown preserve incomplete-parity and live-service boundaries',()=>{
  for(const fragment of [
    'all-function parity remains incomplete',
    'No genuine office QR, current BPN guestbook response, standard-TLS provider acceptance or arrival registration has been tested.',
    'Real camera permission, hardware and mobile viewport remain unverified.',
    'Measured coordinates do not establish required physical presence; geotag upload remains disabled.',
    'No new GitHub commit/push in this batch.',
    'Simpan is disabled; no arrival POST',
    'bukan kesetaraan seluruh aplikasi',
    'sumber SDK3.12.2 hanya corroboration',
    'tidak dijumlahkan menjadi total baru',
  ])assert.ok(source.includes(fragment),fragment);
  return {scopeClaims:'Progress and synthetic/static validation only; no live BPN response, arrival, provider TLS acceptance, hardware/mobile or full native parity is asserted.',testCountsOverlapDisclosed:true,originalApkParityClaimed:false,newCommitOrPushClaimed:false};
});

for(const [file,sha256] of watched)assert.equal(hash(file),sha256,'Changed during evidence review: '+file);
for(const file of outputs)assert.equal(fs.existsSync(new URL(file,root)),false,file);
assert.equal(hash(finalizer),expectedFinalizer);
const report={
  schemaVersion:1,checkedAt:new Date().toISOString(),status:'PASS',reviewKind:'Read-only finalizer source and recorded-evidence review before finalizer execution',
  reviewerRole:'Native audit and guestbook private client author; independent reviewer of root finalizer/integration/deployment receipt binding. This is not independent authorship of all referenced implementation.',
  finalizer:bind(finalizer),writer:bind(writer),baseline:bind(baselineFile),
  receiptBindings:Object.fromEntries(Object.entries(receiptFiles).map(([key,file])=>[key,bind(file)])),
  checks,materialFindings:[],changedInputs:[],inputs:[...watched].map(([file,sha256])=>({file,sha256})),
  newActions:{fullNodeRerun:false,legacyVmRerun:false,browserRerun:false,networkRequests:0,dockerChanges:0,runtimeChanges:0,existingEvidenceRewritten:0,finalizerWritePhaseExecuted:false},
  conclusion:'The frozen finalizer may produce its new progress summary/document with the reviewed source and receipts. The report must retain the old-app context exception, corrected JPEG provenance, combined synthetic transport scope, backend deployedHash schema and required new login after backend replacement.',
  limits:['Recorded hash/counter evidence was reviewed, not independently recaptured from Docker or the public server.','No user credentials, live QR, account/provider requests, identity, arrival, GPS/geotag or original APK interaction occurred.','This approval concerns evidence consistency and scoped claims; it does not establish all-function parity or production acceptance.'],
};
const output='analysis/webapp/guestbook-evidence-review.json';
fs.writeFileSync(new URL(output,root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,checks:checks.length,materialFindings:0,finalizerSha256:hash(finalizer),output,sha256:hash(output),inputs:watched.size}));
