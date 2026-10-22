// Bounded read-only finalizer/evidence review. Never executes finalizer writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS,getPublicCatalog} from '../../webapp/private/operations.mjs';

const root=new URL('../../',import.meta.url),read=file=>fs.readFileSync(new URL(file,root)),json=file=>JSON.parse(read(file)),hash=file=>createHash('sha256').update(read(file)).digest('hex'),bind=file=>({file,sha256:hash(file)});
const writer='analysis/rea/review_swaplotting_runtime_evidence.mjs',finalizer='analysis/rea/finalize_swaplotting_runtime.mjs';
const EXPECTED='aba25a2c6a49ab4db845f9da9b533b4c8cd6894f601db21dc96c34f29e49959c';
assert.equal(hash(finalizer),EXPECTED);
const source=read(finalizer).toString('utf8');
const start=source.indexOf('const outputs='),end=source.indexOf('const summary={');assert.ok(start>0&&end>start);
const prefix=source.slice(start,end);assert.doesNotMatch(prefix,/writeFile|appendFile|execFile|spawn|fetch\(|\.createConnection/);
const facade=Object.freeze({existsSync:path=>fs.existsSync(path)});
const checked=new Function('fs','assert','read','json','hash','bind','root','OPERATIONS','getPublicCatalog',prefix+'\nreturn {outputs,baselineFile,baseline,runtime,files,reports,traffic,screenshots,stableInputs,retained,browserCorrectionFile,browserCorrection,historicalContextOnly};')(facade,assert,read,json,hash,bind,root,OPERATIONS,getPublicCatalog);
const {reports,baseline,traffic}=checked;
const watched=new Map();
const watch=(file,sha256=hash(file))=>{assert.equal(hash(file),sha256,file);if(watched.has(file))assert.equal(watched.get(file),sha256,file);watched.set(file,sha256);};
for(const row of checked.stableInputs)watch(row.file??row.path,row.sha256);
watch(writer);watch(checked.baselineFile);watch('analysis/WEBAPP-FUNCTION-COVERAGE-SWAPLOTTING.md','1561a9d598045dd8a599b3899055e9354a945622a6399e9f45ad143722dcc233');
// nodeInitial is deliberately retained history; its old host/test pins are not
// a current-source acceptance claim. Its immutable JSON is already watched.
for(const [key,report] of Object.entries(reports))if(key!=='nodeInitial')for(const row of report.inputs??[])watch(row.file??row.path,row.sha256);
for(const row of reports.backend.inputFiles)if(row.file!=='webapp/app.js'||row.sha256===hash(row.file))watch(row.file,row.sha256);
const checks=[];
const check=(name,fn)=>{const evidence=fn();checks.push({name,status:'PASS',...evidence});};

check('All actual finalizer pre-write assertions pass with no write or network capability',()=>{
 for(const file of Object.values(checked.outputs))assert.equal(fs.existsSync(new URL(file,root)),false,file);
 return {finalizer:bind(finalizer),reportConstructionExecuted:false,outputWritesExecuted:false};
});
check('Baseline and exact runtime change/new-file accounting remain distinct from delivery inventory',()=>{
 assert.equal(baseline.runtime.length,69);assert.equal(baseline.native.length,38);assert.equal(baseline.historical.length,442);assert.equal(baseline.documents.length,11);
 assert.equal(checked.runtime.length,75);assert.equal(reports.image.files.length,70);
 const imageFiles=new Set(reports.image.files.map(row=>'webapp/'+row.name));
 const runtimeNames=new Set(checked.runtime.map(row=>row.file));
 const notTrackedByDelivery=[...runtimeNames].filter(file=>!imageFiles.has(file));assert.equal(notTrackedByDelivery.length,8);
 const deliveryNotInBaselineInventory=[...imageFiles].filter(file=>!runtimeNames.has(file));assert.deepEqual(deliveryNotInBaselineInventory,['webapp/assets/vendor/leaflet/leaflet.js','webapp/assets/vendor/leaflet/leaflet.css','webapp/assets/vendor/leaflet/LICENSE']);
 return {baselineRuntime:69,changedRuntime:5,newRuntime:6,currentBaselineInventory:75,deliveryInventory:70,notTrackedByDelivery,deliveryNotInBaselineInventory,scope:'Two overlapping inventories: baseline includes build/config and other unchanged files; delivery adds three inherited Leaflet vendor files.70 is not asserted to be a subset of75.',protectedNative:38,protectedHistorical:442,protectedDocuments:11,originalContracts:170};
});
check('Current acceptance receipts bind final app and final ARIA-corrected host',()=>{
 const app=hash('webapp/app.js'),host=hash('webapp/assets/swaplotting/host.js');
 assert.equal(app,'8690f5c6b49e4155723c5be85470483d7e346e3ca043e3487927523657ee11c7');
 assert.equal(host,'e6bf0ccc7c60b71b237853f37eb1d9d3f9a69a1eca4fc91286e38679f5e3ffd2');
 for(const key of ['node','vm','frontendReview','ownerReview','deliveryWriterReview','browser']){
  for(const file of ['webapp/app.js','webapp/assets/swaplotting/host.js']){
   const row=reports[key].inputs.find(row=>(row.file??row.path)===file);assert.ok(row,key+' missing '+file);assert.equal(row.sha256,hash(file));
  }
 }
 return {app:bind('webapp/app.js'),host:bind('webapp/assets/swaplotting/host.js'),currentReceipts:['node','vm','frontendReview','ownerReview','deliveryWriterReview','browser'],changedInputs:[]};
});
check('Recorded metrics are read from actual reports and overlapping suites are not added together',()=>{
 const metrics={node:reports.node.pass,vm:reports.vm.passed,vmSuites:reports.vm.suites.length,authorFrontend:reports.frontend.tests.pass,backendScoped:reports.backend.tests.pass,frontendIndependent:reports.frontendReview.passed,ownerIndependent:reports.ownerReview.checks.length,deliveryWriterIndependent:reports.deliveryWriterReview.checks.length,browser:reports.browser.passed,actualDisclaimerReads:reports.liveDisclaimer.requestedOperations.length};
 assert.deepEqual(metrics,{node:1493,vm:1190,vmSuites:23,authorFrontend:63,backendScoped:141,frontendIndependent:15,ownerIndependent:13,deliveryWriterIndependent:6,browser:29,actualDisclaimerReads:1});
 assert.match(source,/not added into a new combined total/);assert.match(source,/tidak dijumlahkan menjadi total baru/);
 return {metrics,fullTestsRerunByReviewer:false};
});
check('Own-contact source proof and old native files remain pinned without authorization inference',()=>{
 const nativeFile='analysis/recovered/swaplotting-owner-followup/flow.json',proof=json(nativeFile);
 assert.equal(hash(nativeFile),'02ecc3c52cf9ee22c73dfe40b0e9a5cbd2327d5c5779285ed1d4ecd71c8ccf22');
 for(const row of proof.protected_old_files)watch(row.path,row.sha256);
 assert.equal(proof.protected_old_files.length,208);
 assert.match(source,/minimal three-contact own-profile projection, not the full eight-field lCb/);
 assert.match(source,/managed-user storage\/import\/selection\/enrollment and its authorization remain incomplete/);
 return {nativeLedger:bind(nativeFile),protectedOldFiles:208,subset:'Trusted current-session account_summary contacts only; level2/3 and exactfalse isIkd, no fabricated full lCb/NIK/DOB or authority.'};
});
check('Latest browser means29 current-source desktop checks, including a390×844 CSS iframe',()=>{
 assert.equal(reports.browser.inputs.length,9);assert.equal(reports.browser.checks.length,29);assert.ok(reports.browser.checks.every(row=>row.passed));
 assert.deepEqual(reports.browser.responsiveFrame,{height:844,width:390});
 assert.match(reports.browser.scope,/desktop.*390by844same-origin responsive iframe/i);
 assert.ok(reports.browser.limits.some(text=>text.includes('not Android hardware')));
 assert.equal(reports.coverage.completion.mobileCertified,false);assert.equal(reports.coverage.completion.officialPostLoginEmulatorComparison,false);
 return {checks:29,sourcePins:9,responsiveFrame:{width:390,height:844},scope:'Desktop browser same-origin CSS iframe only; not Android, mobile user-agent, touch, GPS, camera or hardware acceptance.',horizontalOverflowMeasurementClaimed:false};
});
check('Four unchanged JPEG captures independently decode to recorded1265×712 dimensions',()=>{
 const jpegDimensions=bytes=>{
  assert.equal(bytes.readUInt16BE(0),0xffd8);let at=2;
  const markers=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while(at<bytes.length){assert.equal(bytes[at++],0xff);while(bytes[at]===0xff)at++;const marker=bytes[at++];if(marker===0xda||marker===0xd9)break;if(marker===1||(marker>=0xd0&&marker<=0xd7))continue;const size=bytes.readUInt16BE(at);assert.ok(size>=2&&at+size<=bytes.length);if(markers.has(marker))return{width:bytes.readUInt16BE(at+5),height:bytes.readUInt16BE(at+3)};at+=size;}
  assert.fail('JPEG SOF missing');
 };
 const captures=[];assert.equal(checked.screenshots.length,4);
 for(const row of checked.screenshots){assert.equal(row.mimeType,'image/jpeg');assert.equal(row.imagePixelsEdited,false);assert.deepEqual(jpegDimensions(read(row.file)),{width:row.width,height:row.height});assert.equal(row.width,1265);assert.equal(row.height,712);captures.push({...bind(row.file),width:row.width,height:row.height});}
 const previous=json('analysis/webapp/swaplotting-browser-final.json');
 assert.ok(captures.every(row=>previous.screenshots.some(old=>old.sha256===row.sha256)));
 return {captures,pixelEdits:0,byteIdenticalToRepresentativePreAriaCaptures:true,dimensionsScope:'Representative screenshots capture the desktop browser surface and do not visually distinguish the nonvisual ARIA correction. Fresh current-source interaction assertions establish ARIA; iframe viewport dimensions are separate evidence.'};
});
check('Fourteen synthetic contract calls completed and the4202fixture terminated cleanly',()=>{
 assert.equal(traffic.calls.length,14);assert.equal(traffic.executeRequests,14);assert.equal(traffic.pending,0);assert.deepEqual(traffic.unexpected,[]);assert.ok(traffic.calls.every(row=>row.completed));
 const paths={};for(const call of traffic.calls)paths[call.path]=(paths[call.path]??0)+1;
 assert.ok(Object.keys(paths).every(path=>['/account/account_summary','/Map/GetDisclaimer','/legacy/Kantah','/legacy/Wilayah'].includes(path)));
 for(const key of ['bpnProductionRequests','cameraActions','geolocationActions','identitySubmissions','otpSubmissions','plotSubmissions','geotagSubmissions'])assert.equal(traffic[key],0,key);
 assert.equal(traffic.stopped,true);assert.equal(reports.browser.transport.stopEvidence.exitCode,0);assert.equal(reports.browser.transport.stopEvidence.loopbackPortClosed,true);
 return {transport:bind(reports.browser.transport.file),syntheticCalls:14,paths,pending:0,stopped:true,stopEvidence:reports.browser.transport.stopEvidence,bpnProductionRequests:0,externalImages:'Public OSM images are permitted; these contract-call counters are not a zero-total-network claim.'};
});
check('Browser finalizer TCP-address correction remains disclosed and source-bound',()=>{
 const correction=checked.browserCorrection;
 watch(checked.browserCorrectionFile);watch(correction.initial.file,correction.initial.sha256);watch(correction.correction.file,correction.correction.sha256);
 const initial=read(correction.initial.file).toString('utf8'),fixed=read(correction.correction.file).toString('utf8');
 assert.equal(fixed,initial.replace("host:'129.0.0.1',port:4202","host:'127.0.0.1',port:4202"));
 assert.match(correction.initial.networkProbe,/TCP connection attempt to129\.0\.0\.1:4202 timed out; no application payload, credentials or BPN request/);
 assert.match(source,/129\.0\.0\.1/);assert.match(source,/no application payload, credentials or BPN request/);
 return {correctionReceipt:bind(checked.browserCorrectionFile),initial:bind(correction.initial.file),corrected:bind(correction.correction.file),scope:'A TCP probe to129.0.0.1:4202 timed out before application output; the corrected127 loopback probe confirmed closure. No application payload, credential or BPN request was recorded. This is not zero tool-network activity.'};
});
check('One actual anonymous application-authorized disclaimer read is distinct from synthetic browser traffic',()=>{
 const live=reports.liveDisclaimer;
 assert.equal(live.status,'PASS');assert.equal(live.inputs.length,4);assert.deepEqual(live.requestedOperations,['get-map-getdisclaimer-d29ef0']);
 assert.equal(live.localHttpStatus,200);assert.equal(live.upstreamHttpStatus,200);assert.equal(live.typedFourFieldModel,true);assert.equal(live.nonemptyMessage,true);
 for(const key of ['credentialsRecorded','accountLogin','legalAgreementAccepted'])assert.equal(live[key],false);
 for(const key of ['identitySubmissions','otpSubmissions','plotSubmissions','geotagSubmissions'])assert.equal(live[key],0);
 assert.deepEqual(Object.keys(live.fieldLengths),['message','message2','message3','url']);assert.ok(live.fieldLengths.message>0);assert.match(live.responseModelSha256,/^[0-9a-f]{64}$/);
 assert.match(source,/actualDisclaimerProviderReads:1/);assert.match(source,/One genuine Map\/GetDisclaimer read returned local\/upstream HTTP200/);
 return {receipt:bind(checked.files.liveDisclaimer),actualProviderReads:1,localHttpStatus:200,upstreamHttpStatus:200,authenticationScope:'Existing application authorization through deployed API with a newly created anonymous local session; no account login/token.',stored:'Four field lengths and model hash only, no copied legal body or credentials.',limits:'One disclaimer GET response, not office/region/profile-account acceptance, legal agreement, identity verification, ownership or submission success.'};
});
check('Image, deployed source and public static rows agree with the same current70-file delivery inventory',()=>{
 const image=reports.image,deployment=reports.deployment,pub=reports.public;
 assert.equal(image.files.length,70);assert.equal(image.network,'none');assert.equal(image.bindMounts,0);assert.equal(deployment.container.image,image.imageId);
 assert.equal(deployment.files.length,40);assert.equal(deployment.backendFiles.length,30);assert.equal(deployment.backendFiles.filter(row=>Object.hasOwn(row,'containerHash')).length,0);
 assert.equal(pub.files.length,40);assert.equal(pub.failed,0);assert.equal(pub.backendBytesProbed,false);
 const names=new Set(image.files.map(row=>row.name));assert.equal(names.size,70);
 for(const row of [...deployment.files,...deployment.backendFiles]){assert.ok(names.has(row.name));assert.equal(row.deployedHash,hash('webapp/'+row.name));}
 return {imageId:image.imageId,containerId:deployment.container.id,imageFiles:70,publicFiles:40,backendFiles:30,backendHashField:'deployedHash',backendContainerHashInvented:false,publicBackendProbeClaimed:false};
});
check('Backend replacement ends previous sessions; public UI evidence is anonymous only',()=>{
 const deployment=reports.deployment,ui=reports.publicUi;
 assert.equal(deployment.backendRestarted,true);assert.notEqual(deployment.previousContainerId,deployment.container.id);assert.match(deployment.sessionPersistence,/previous in-memory account sessions are not preserved/);
 assert.equal(ui.routeRendered,true);assert.equal(ui.loginGateRendered,true);assert.equal(ui.sessionChecking,false);assert.equal(ui.credentialsEntered,false);assert.equal(ui.accountReadsPerformedByAgent,0);assert.equal(ui.plotSubmissions,0);assert.equal(ui.geotagSubmissions,0);
 return {publicUi:bind(checked.files.publicUi),previousContainerId:deployment.previousContainerId,currentContainerId:deployment.container.id,oldInMemorySessionsPreserved:false,newLoginRequired:true,publicAcceptance:'Static route and anonymous login gate, not a logged-in live provider session.'};
});
check('Coverage and finalizer retain disabled writes and incomplete-parity boundaries',()=>{
 const coverage=reports.coverage;
 assert.equal(coverage.source.runtimeFiles.length,70);assert.ok(Object.values(coverage.completion).every(value=>value===false));
 for(const key of ['personalPlotPostEnabled','guestbookPostEnabled','geotagWritesEnabled'])assert.equal(reports.deployment[key],false);
 const document=source.slice(source.indexOf('const document='));
 for(const file of ['swaplotting-browser-validation-final.json','swaplotting-frontend-aria-final.json','swaplotting-owner-projection-review-validation.json'])assert.ok(document.includes(file),file);
 assert.doesNotMatch(document,/\]\(webapp\/swaplotting-owner-projection-review\.json\)/);
 assert.match(source,/No new GitHub commit or push is performed by this finalizer/);
 assert.match(source,/full native parity remains incomplete/);
 return {coverage:bind(checked.files.coverage),nativeMenus:29,browserRoutes:38,operations:176,enabled:84,disabled:92,enablementChanges:0,unrelatedRecordsUnchanged:175,fullParity:false,liveAcceptance:false,arrivalAndPlotAndGeotagWritesEnabled:false};
});
check('Initial failures, previous27-pass browser and old source reviews remain history, not current acceptance',()=>{
 const initial=json('analysis/webapp/swaplotting-browser-initial.json'),previous=json('analysis/webapp/swaplotting-browser-final.json'),aria=json('analysis/webapp/swaplotting-select-aria-initial.json');
 assert.equal(initial.passed,7);assert.equal(initial.failed,1);assert.equal(previous.passed,27);assert.equal(previous.failed,0);assert.equal(aria.passed,13);assert.equal(aria.failed,1);
 assert.equal(reports.nodeInitial.pass,1492);assert.equal(reports.nodeInitial.fail,1);
 assert.ok(checked.retained.includes('analysis/webapp/swaplotting-owner-projection-review-integrated.json'));
 return {retainedFiles:checked.retained.length,initialBrowser:{pass:7,fail:1},previousBrowser:{pass:27,fail:0},ariaProbe:{pass:13,fail:1},initialNode:{pass:1492,fail:1},historicalBackendContextExceptions:checked.historicalContextOnly};
});

for(const [file,sha256] of watched)assert.equal(hash(file),sha256,'Changed during final evidence review: '+file);
for(const file of Object.values(checked.outputs))assert.equal(fs.existsSync(new URL(file,root)),false,file);
assert.equal(hash(finalizer),EXPECTED);
const report={schemaVersion:1,checkedAt:new Date().toISOString(),status:'PASS',reviewKind:'Read-only current-source finalizer and recorded-evidence review before its exclusive output phase',reviewerRole:'Native owner-source proof and private guestbook client author; independent reviewer of this root finalizer/evidence binding and own-contact implementation. Not independent author of all referenced code.',finalizer:bind(finalizer),writer:bind(writer),checks,materialFindings:[],changedInputs:[],inputs:[...watched].map(([file,sha256])=>({file,sha256})),receiptBindings:Object.fromEntries(Object.entries(checked.files).map(([key,file])=>[key,bind(file)])),preReviewResolution:'Generated document links now identify the current frontend15 and owner13 receipts; earlier source reviews remain retained history.',newActions:{fullNodeRerun:false,legacyVmRerun:false,browserActions:0,dockerActions:0,networkRequests:0,runtimeEdits:0,existingEvidenceRewritten:0,finalizerOutputPhaseExecuted:false},limits:['Evidence and source consistency were checked; Docker/public/browser/provider observations were not recaptured by this reviewer.','Desktop390×844iframe checks are responsive CSS evidence and do not certify Android/mobile hardware or native parity.','The batch includes public OSM images, a retained failed129 TCP probe and one genuine application-authorized disclaimer GET; synthetic browser BPN requests remain zero. No account login, legal acceptance, identity/OTP/upload/GPS/geotag action follows.','The reviewed finalizer produces a progress summary, not completed all-function parity or production acceptance.']};
const output='analysis/webapp/swaplotting-runtime-evidence-review.json';fs.writeFileSync(new URL(output,root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',checks:checks.length,materialFindings:0,inputs:watched.size,finalizerSha256:hash(finalizer),output,sha256:hash(output)}));
