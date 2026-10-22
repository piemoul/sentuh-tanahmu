// Independent narrow copy review. Actual host/view with reused test DOM only;
// no delivery execution, full-suite rerun, browser, provider or device action.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {harness} from '../../webapp/tests/support/account-verification-ui-harness.mjs';
import {createSwaplottingHost} from '../../webapp/assets/swaplotting/host.js';
const output='analysis/webapp/coordinate-preview-label-review.json';assert.ok(!fs.existsSync(output),'Preserve review');
const read=file=>fs.readFileSync(file),hash=file=>createHash('sha256').update(read(file)).digest('hex'),pin=file=>({file,sha256:hash(file)}),json=file=>JSON.parse(read(file));
const baselineFile='analysis/webapp/coordinate-preview-label-baseline.json',baseline=json(baselineFile),predecessor=json(baseline.predecessor.file);
assert.equal(hash(baselineFile),'311e16ce984f1731c0880704bdf84a4d0938217c03d84d70e99b80df61e75cc4');
assert.equal(hash(baseline.predecessor.file),baseline.predecessor.sha256);assert.equal(baseline.runtime.length,80);assert.deepEqual(baseline.runtime,predecessor.runtime);
const files=[baselineFile,baseline.predecessor.file,'analysis/webapp/personal-coordinate-entry-baseline.json','analysis/rea/review_coordinate_preview_label.mjs',...baseline.snapshots.flatMap(row=>[row.original.file,row.snapshot.file]),baseline.deliveryWriter.predecessor.file,baseline.deliveryWriter.successor.file,...['coordinate-entry','model','controller','host','map'].map(n=>'webapp/assets/swaplotting/'+n+'.js'),'webapp/tests/support/account-verification-ui-harness.mjs','analysis/rea/review_swaplotting_frontend_validation.mjs'];
const inputs=files.map(pin),checks=[];const check=(name,fn)=>{fn();checks.push({name,passed:true});},probe=async(name,fn)=>{await fn();checks.push({name,passed:true});};
const changed=baseline.runtime.filter(row=>hash(row.file)!==row.sha256).map(row=>({file:row.file,before:row.sha256,after:hash(row.file)}));
check('exact80-runtime predecessor chain with only view changed and79 other files identical',()=>{
 assert.deepEqual(changed.map(row=>row.file),['webapp/assets/swaplotting/view.js']);assert.equal(predecessor.runtime.length,80);
});
check('view contains only3 exact copy substitutions and host test only1 literal expectation substitution',()=>{
 for(const row of baseline.snapshots){assert.equal(hash(row.snapshot.file),row.snapshot.sha256);assert.equal(row.snapshot.sha256,row.original.sha256);}
 const before=read(baseline.snapshots[0].snapshot.file).toString(),after=read(baseline.snapshots[0].original.file).toString();
 const expected=before.replace('An uncommitted source snapshot','A candidate source snapshot').replace('Pilihan titik sesi — belum diterapkan','Pilihan titik sesi').replace('Metadata berasal dari titik sesi. Periksa format sumber dan konfirmasikan WGS84 sebelum menerapkan.','Metadata pilihan titik sesi. Asal koordinat titik peta yang sedang dipakai ditampilkan di bawah. Periksa format sumber dan konfirmasikan WGS84 sebelum menerapkan.');
 assert.equal(after,expected);
 const oldTest=read(baseline.snapshots[1].snapshot.file).toString(),newTest=read(baseline.snapshots[1].original.file).toString();assert.equal(newTest,oldTest.replace("['belum diterapkan','GNSS eksternal'","['Pilihan titik sesi','GNSS eksternal'"));
});
check('delivery successor changes only writer identity and exclusive receipt dependency paths',()=>{
 const row=baseline.deliveryWriter;for(const r of [row.predecessor,row.successor])assert.equal(hash(r.file),r.sha256);
 const parent=read(row.predecessor.file).toString(),successor=read(row.successor.file).toString();
 const expected=parent.replaceAll('verify_personal_coordinate_entry_delivery','verify_coordinate_preview_label_delivery').replaceAll('analysis/webapp/personal-coordinate-entry-${mode}.json','analysis/webapp/coordinate-preview-label-${mode}.json').replaceAll('analysis/webapp/personal-coordinate-entry-image.json','analysis/webapp/coordinate-preview-label-image.json').replaceAll('analysis/webapp/personal-coordinate-entry-deployment.json','analysis/webapp/coordinate-preview-label-deployment.json');
 assert.equal(successor,expected);
});
const oldBaseline=json('analysis/webapp/personal-coordinate-entry-baseline.json');
check('44 native ledgers1014 historical files27 baseline documents and request/catalog bytes remain unchanged',()=>{
 for(const [key,count]of [['native',44],['historical',1014],['documents',27]]){assert.equal(oldBaseline[key].length,count);for(const row of oldBaseline[key])assert.equal(hash(row.file),row.sha256,row.file);}
 for(const row of [oldBaseline.requestCorpus,oldBaseline.catalog])assert.equal(hash(row.file),row.sha256,row.file);
});
// Extract only the existing fake DOM/Leaflet setup declarations, never test()
// bodies or author assertions. Independent lifecycle assertions follow below.
const testSource=read('webapp/tests/swaplotting-coordinate-host.test.mjs').toString();
let fixture=testSource.slice(testSource.indexOf('// Reuse only'),testSource.indexOf("test('map loading"));
fixture=fixture.replace("new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url)","'analysis/rea/review_swaplotting_frontend_validation.mjs'");
assert.ok(!fixture.includes('import.meta'));
const {setup,point}=new Function('assert','fs','vm','harness','createSwaplottingHost',fixture+';return {setup,point};')(assert,fs,vm,harness,createSwaplottingHost);
const neutral=h=>{
 const details=h.main.querySelector('[data-swaplotting-coordinate-candidate-details]');assert.ok(details);assert.equal(details.querySelector('h3').textContent,'Pilihan titik sesi');assert.doesNotMatch(details.textContent,/belum diterapkan/);
 assert.match(details.textContent,/Asal koordinat titik peta yang sedang dipakai ditampilkan di bawah/);assert.doesNotMatch(details.textContent,/Deklarasi pengguna/);return details;
};
await probe('before Apply neutral candidate preview makes no active-source or map mutation',async()=>{
 const h=await setup({points:[point()]}).ready();try{
  const before=h.host.controller.snapshot(),views=h.leaflet.maps[0].views.length,reads=h.reads.length;assert.equal(h.main.querySelector('[data-swaplotting-coordinate-candidate-details]').textContent,'');await h.select(0);neutral(h);
  const after=h.host.controller.snapshot();assert.deepEqual(after.cameraTarget,before.cameraTarget);assert.deepEqual(after.targetProvenance,before.targetProvenance);assert.equal(h.leaflet.maps[0].views.length,views);assert.equal(h.reads.length,reads);
 }finally{h.dispose();}
});
await probe('successful Apply keeps neutral preview and separates accurate active session-point source',async()=>{
 const h=await setup({points:[point({latitude:-0,longitude:180})]}).ready();try{
  await h.select(0);const details=neutral(h);await h.declare();await h.action('swaplotting-coordinate-apply');assert.equal(neutral(h),details);const state=h.host.controller.snapshot();assert.equal(state.targetProvenance.kind,'session-point');assert.ok(Object.is(state.cameraTarget.lat,-0));assert.equal(state.cameraTarget.lng,180);
  assert.match(h.main.querySelector('[data-swaplotting-coordinate-source]').textContent,/GNSS eksternal/);assert.equal(h.host.controller.submit,undefined);
 }finally{h.dispose();}
});
await probe('pan retains only neutral candidate preview while active source becomes map center',async()=>{
 const h=await setup({points:[point()]}).ready();try{
  await h.select(0);await h.declare();await h.action('swaplotting-coordinate-apply');const before=h.host.controller.snapshot().cameraTarget;await h.fire(h.slot().querySelector('[data-control="right"]'));neutral(h);const state=h.host.controller.snapshot();assert.equal(state.targetProvenance,null);assert.notDeepEqual(state.cameraTarget,before);
  assert.match(h.main.querySelector('[data-swaplotting-coordinate-source]').textContent,/Pusat peta/);assert.equal(h.host.controller.submit,undefined);
 }finally{h.dispose();}
});
await probe('failed Apply retains neutral preview and prior active coordinates/provenance without request or submit',async()=>{
 const h=await setup({points:[point()]}).ready();try{
  await h.type('longitude','100');await h.type('latitude','-2');await h.declare();await h.action('swaplotting-coordinate-apply');const before=h.host.controller.snapshot();await h.select(0);await h.declare();const reads=h.reads.length;h.leaflet.fail(true);await h.action('swaplotting-coordinate-apply');neutral(h);
  const state=h.host.controller.snapshot();assert.deepEqual(state.cameraTarget,before.cameraTarget);assert.deepEqual(state.targetProvenance,before.targetProvenance);assert.match(state.coordinateError,/\S/);assert.equal(h.reads.length,reads);assert.equal(h.host.controller.submit,undefined);
 }finally{h.dispose();}
});
for(const row of inputs)assert.equal(hash(row.file),row.sha256,row.file);
for(const row of baseline.runtime.filter(row=>row.file!=='webapp/assets/swaplotting/view.js'))assert.equal(hash(row.file),row.sha256,row.file);
const reuse={};
for(const key of ['node','vm','core','map','host','independent','browser']){
 const row=predecessor.receipts[key],value=json(row.file),pins=Array.isArray(value.inputs)?value.inputs:Array.isArray(value.source)?value.source:[];assert.equal(hash(row.file),row.sha256);
 reuse[key]={receipt:row,rerun:false,changedSourcePins:pins.filter(r=>hash(r.file)!==r.sha256).map(r=>r.file),claim:'Historical result, not a new rerun. Exact copy-only delta and unchanged state/map/controller sources support scoped behavioral reuse; root successor tests/browser/delivery are separate.'};
}
const report={schemaVersion:1,checkedAt:new Date().toISOString(),status:'PASS',inputs,baseline:pin(baselineFile),predecessor:baseline.predecessor,checks,passed:checks.length,failed:0,materialFindings:[],delta:{runtimeFiles:80,changedRuntime:changed,unchangedRuntime:79,testChanges:[{file:baseline.snapshots[1].original.file,before:baseline.snapshots[1].original.sha256,after:hash(baseline.snapshots[1].original.file),only:'One literal heading expectation'}],stateMapOrSubmitChanges:false},protectedUnchanged:{native:44,historical:1014,documents:27,requestRecords:170,catalogByteIdentical:true},delivery:{successor:baseline.deliveryWriter.successor,executed:false,logicByteEquivalentAfterIdentityAndPaths:true,scope:'Keeps original feature79→80 baseline/7 changed plus1 new inventory descriptors. This80→80 copy-only patch is established by the separate label baseline; no new asset or backend capability is claimed for this patch.'},reuse,knownLimitationResolution:{priorHeading:'Pilihan titik sesi — belum diterapkan',currentHeading:'Pilihan titik sesi',hint:'Distinguishes candidate metadata from active source shown below.',result:'Neutral before/after successful Apply, pan and failed Apply; current source remains the authoritative active-point display.'},authorDisclosure:'Reviewer previously authored map/model/controller/view photo work and prior evidence finalizer, not this root-authored heading/hint change or delivery derivative. Independent assertions use existing test DOM setup and actual current host/view/controller modules.',effects:{runtimeOrTestEditsByReviewer:0,fullSuiteReruns:0,deliveryExecutions:0,networkRequests:0,browserActions:0,deviceCameraGpsActions:0,providerAccountOrSubmitActions:0},limits:['Fake DOM/Leaflet lifecycle probes only; actual browser rendering and new delivery observations are root-owned separate evidence.','No claim of production coordinates, real hardware, physical presence, upload acceptance or full native parity.']};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,passed:report.passed,output,sha256:hash(output),viewSha256:hash('webapp/assets/swaplotting/view.js')}));
