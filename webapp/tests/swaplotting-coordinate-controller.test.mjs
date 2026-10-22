import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplotting} from '../assets/swaplotting/controller.js';
import {parseSwaplottingCoordinateEntry as parse,swaplottingSessionCoordinate as session} from '../assets/swaplotting/coordinate-entry.js';
const manual=(longitude='106.12345678901235',latitude='-6.123456789012345')=>parse({longitude,latitude,declaredWgs84:true});
const survey=()=>session({id:'current-session-1',source:'survey',crs:'EPSG:4326',latitude:-0,longitude:106.12345678901235,name:'Patok',accuracy:0.02,measuredAt:'local string',warnings:['Reported only']},{declaredWgs84:true});
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve};};
function fixture(read=async kind=>kind==='disclaimer'?{}:[]){let active=true;const calls=[],changes=[];const c=createSwaplotting({read:(kind,values)=>{calls.push({kind,values});return read(kind,values);},changed:value=>changes.push(value),isCurrent:()=>active});return {c,calls,changes,retire:()=>active=false};}
const apply=(c,value=manual(),zoom)=>c.applyCoordinateTarget({...value.camera,...(zoom===undefined?{}:{zoom})},value.provenance);

test('coordinate controls start inert with no new reads or device/write methods',()=>{
 const h=fixture(),s=h.c.snapshot();assert.deepEqual(s.coordinateDraft,{longitude:'',latitude:'',declaredWgs84:false});assert.equal(s.coordinateError,'');assert.equal(s.targetProvenance,null);assert.equal(s.pointProvenance,null);assert.deepEqual(h.calls,[]);
 for(const method of ['submit','save','upload','sendOtp','getCurrentPosition','toGeotagFields'])assert.equal(h.c[method],undefined);
});
test('draft and error edits preserve active point and exact raw text without accepting a disclaimer',()=>{
 const h=fixture();assert.equal(apply(h.c),true);const before=h.c.snapshot();
 h.c.setCoordinateError('Invalid entry');assert.equal(h.c.setCoordinateDraft('longitude',' invalid raw input '),true);assert.equal(h.c.setCoordinateDraft('latitude','1'.repeat(101)),true);assert.equal(h.c.setCoordinateDraft('declaredWgs84',true),true);
 const s=h.c.snapshot();assert.equal(s.coordinateDraft.longitude,' invalid raw input ');assert.equal(s.coordinateDraft.latitude.length,101);assert.equal(s.coordinateError,'');assert.deepEqual(s.cameraTarget,before.cameraTarget);assert.deepEqual(s.targetProvenance,before.targetProvenance);assert.equal(s.disclaimerAcknowledged,false);assert.equal(s.canOpenForm,false);assert.deepEqual(h.calls,[]);
 for(const [key,value] of [['unknown','a'],['longitude',1],['declaredWgs84','true']])assert.equal(h.c.setCoordinateDraft(key,value),false);
 assert.equal(h.c.setCoordinateError(null),false);
});
test('apply validates camera, provenance and projection before changing state',()=>{
 const h=fixture(),good=manual('-0','-0');assert.equal(apply(h.c,good,14.25),true);const before=h.c.snapshot(),emits=h.changes.length;
 for(const [camera,source] of [[{lat:0,lng:0},good.provenance],[{lat:90,lng:0},manual('0','0').provenance],[{...good.camera,zoom:22},good.provenance],[good.camera,null],[good.camera,{...good.provenance,raw:{longitude:'-1',latitude:'-0'}}]])assert.equal(h.c.applyCoordinateTarget(camera,source),false);
 assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,emits);assert.ok(Object.is(before.cameraTarget.lat,-0));assert.ok(Object.is(before.cameraTarget.lng,-0));assert.equal(before.cameraTarget.zoom,14.25);
});
test('apply and snapshot clone provenance without rounding or adding wire fields',()=>{
 const h=fixture(),value=survey();assert.equal(apply(h.c,value),true);value.provenance.metadata.warnings.push('late');value.provenance.raw.longitude='changed';
 const s=h.c.snapshot();assert.equal(s.targetProvenance.metadata.warnings.length,1);assert.equal(s.targetProvenance.raw.longitude,'106.12345678901235');assert.ok(Object.is(s.cameraTarget.lat,-0));
 s.targetProvenance.metadata.warnings.push('snapshot');s.cameraTarget.lng=1;assert.equal(h.c.snapshot().targetProvenance.metadata.warnings.length,1);assert.equal(h.c.snapshot().cameraTarget.lng,106.12345678901235);
 assert.deepEqual(Object.keys(h.c.snapshot().cameraTarget).sort(),['lat','lng','zoom']);
});
test('zoom retains measured association only for Object.is-identical current coordinates',()=>{
 const h=fixture(),value=manual('-0','-0');apply(h.c,value,13.5);
 assert.equal(h.c.setCameraTarget({...value.camera,zoom:15.25},{eventKind:'zoom'}),true);assert.deepEqual(h.c.snapshot().targetProvenance,value.provenance);
 h.c.setCameraTarget({lat:-0,lng:0,zoom:16},{eventKind:'zoom'});assert.equal(h.c.snapshot().targetProvenance,null);
 apply(h.c,value);h.c.setCameraTarget({...value.camera,zoom:17},{eventKind:'pan'});assert.equal(h.c.snapshot().targetProvenance,null);
 apply(h.c,value);h.c.setCameraTarget(value.camera,{eventKind:'reset'});assert.equal(h.c.snapshot().targetProvenance,null);
 apply(h.c,value);h.c.setCameraTarget(value.camera);assert.equal(h.c.snapshot().targetProvenance,null);
});
test('invalid map events preserve source atomically; later successful apply replaces it',()=>{
 const h=fixture();apply(h.c,survey());const before=h.c.snapshot();assert.equal(h.c.setCameraTarget({lat:NaN,lng:0},{eventKind:'pan'}),false);assert.deepEqual(h.c.snapshot(),before);
 const value=manual('107','-7');assert.equal(apply(h.c,value),true);assert.deepEqual(h.c.snapshot().targetProvenance,value.provenance);
});
for(const kind of ['registered','unregistered'])test(`${kind} captures an isolated provenance snapshot and keeps legacy point.source`,async()=>{
 const h=fixture();await h.c.loadDisclaimer();const value=survey();apply(h.c,value);h.c.setCoordinateDraft('longitude','draft remains');assert.equal(await h.c.openForm(kind),true);
 const s=h.c.snapshot();assert.deepEqual(s.point,{lat:-0,lng:value.camera.lng,source:'map-camera'});assert.deepEqual(s.pointProvenance,value.provenance);assert.notEqual(s.pointProvenance,s.targetProvenance);
 assert.equal(h.c.applyCoordinateTarget(manual().camera,manual().provenance),false);assert.equal(h.c.setCoordinateDraft('longitude','late'),false);assert.equal(h.c.setCoordinateError('late'),false);assert.equal(h.c.setCameraTarget({lat:1,lng:2},{eventKind:'pan'}),false);
 assert.deepEqual(h.c.snapshot().point,s.point);assert.deepEqual(h.c.snapshot().pointProvenance,s.pointProvenance);assert.equal(h.c.snapshot().coordinateDraft.longitude,'draft remains');
 assert.deepEqual(h.calls.map(row=>row.kind),['disclaimer','offices']);
});
test('unmeasured initial/map points receive clear separate fallback provenance',async()=>{
 const h=fixture();await h.c.loadDisclaimer();await h.c.openForm('registered');assert.deepEqual(h.c.snapshot().pointProvenance,{kind:'initial-viewport'});
 h.c.backToMap();h.c.setCameraTarget({lat:1,lng:2});await h.c.openForm('unregistered');assert.deepEqual(h.c.snapshot().pointProvenance,{kind:'map-camera'});
});
test('back clears form point/photos while retaining target, draft and declared source',async()=>{
 const h=fixture();await h.c.loadDisclaimer();apply(h.c,manual('180','-0'));h.c.setCoordinateDraft('longitude','180');h.c.setCoordinateDraft('latitude','-0');h.c.setCoordinateDraft('declaredWgs84',true);const before=h.c.snapshot();await h.c.openForm('registered');assert.equal(h.c.backToMap(),true);
 const s=h.c.snapshot();assert.equal(s.point,null);assert.equal(s.pointProvenance,null);assert.equal(s.photos,null);assert.deepEqual(s.cameraTarget,before.cameraTarget);assert.deepEqual(s.targetProvenance,before.targetProvenance);assert.deepEqual(s.coordinateDraft,before.coordinateDraft);
});
test('pending reference reads cannot reassign a captured form source or revive a disposed target',async()=>{
 const pending=deferred(),h=fixture(async kind=>kind==='disclaimer'?{}:pending.promise);await h.c.loadDisclaimer();apply(h.c,survey());const opening=h.c.openForm('registered'),before=h.c.snapshot();assert.equal(before.pending.offices,true);
 assert.equal(h.c.applyCoordinateTarget(manual().camera,manual().provenance),false);h.c.dispose();pending.resolve([{KantorId:'late',Nama:'Late'}]);assert.equal(await opening,false);
 const s=h.c.snapshot();assert.equal(s.screen,'disposed');assert.equal(s.cameraTarget,null);assert.equal(s.targetProvenance,null);assert.equal(s.pointProvenance,null);assert.deepEqual(s.coordinateDraft,{longitude:'',latitude:'',declaredWgs84:false});assert.equal(s.coordinateError,'');assert.deepEqual(s.offices,[]);
});
test('route/session retirement rejects every coordinate mutation even before disposal',()=>{
 const h=fixture();apply(h.c);h.c.setCoordinateDraft('longitude','private draft');h.retire();const before=h.c.snapshot();assert.equal(apply(h.c,survey()),false);assert.equal(h.c.setCoordinateDraft('latitude','0'),false);assert.equal(h.c.setCoordinateError('late'),false);assert.equal(h.c.setCameraTarget({lat:0,lng:0},{eventKind:'zoom'}),false);assert.deepEqual(h.c.snapshot(),before);h.c.dispose();assert.equal(h.c.snapshot().coordinateDraft.longitude,'');assert.equal(h.c.snapshot().targetProvenance,null);
});
