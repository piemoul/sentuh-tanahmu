import test from 'node:test';
import assert from 'node:assert/strict';
import {SWAPLOTTING_MERCATOR_LATITUDE as limit,parseSwaplottingCoordinateEntry as parse,swaplottingSessionCoordinate as session,swaplottingCoordinateCandidates as candidates,swaplottingCoordinateSignature as signature,swaplottingCoordinateProvenance as provenance,swaplottingCoordinateText as text,swaplottingCoordinateProvenanceFacts as facts} from '../assets/swaplotting/coordinate-entry.js';
import {swaplottingPointText,SWAPLOTTING_COPY} from '../assets/swaplotting/model.js';
const manual=(longitude='106.12345678901235',latitude='-6.123456789012345')=>({longitude,latitude,declaredWgs84:true});
const point=(extra={})=>({id:'session-survey-1',name:'Patok A',latitude:-6.123456789012345,longitude:106.12345678901235,source:'survey',crs:'EPSG:4326',accuracy:0.02,measuredAt:'2026-10-20T08:00:00+07:00',warnings:['Datum perlu diperiksa'],original:{longitude:'106.1234567890123450',latitude:'-6.1234567890123450'},...extra});
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

test('manual entry requires an explicit boolean WGS84 declaration, not a CRS guess',()=>{
 for(const declaredWgs84 of [undefined,null,false,'true',1])assert.throws(()=>parse({...manual(),declaredWgs84}),{code:'SWAPLOTTING_COORDINATE_DECLARATION'});
 assert.deepEqual(parse(manual()).camera,{lng:106.12345678901235,lat:-6.123456789012345});
});
test('named axes retain raw decimal strings independently from binary64 values',()=>{
 const raw=manual(' +1.0612345678901235e2 ',' -.6123456789012345e1 '),value=parse(raw);
 assert.deepEqual(value.provenance.raw,{longitude:raw.longitude,latitude:raw.latitude});
 assert.equal(value.camera.lng,106.12345678901235);assert.equal(value.camera.lat,-6.123456789012345);
 assert.equal(value.provenance.kind,'manual-coordinate');assert.equal(value.provenance.declaredCrs,'browser-wgs84-decimal');
});
test('negative zero is preserved for both axes, raw text and point display',()=>{
 const value=parse(manual('-0.00e20','-0'));
 assert.ok(Object.is(value.camera.lat,-0));assert.ok(Object.is(value.camera.lng,-0));
 assert.equal(text(value.camera.lng),'-0');assert.equal(text(0),'0');
 assert.equal(swaplottingPointText({screen:'map',cameraTarget:{lat:-0,lng:-0}}),'Titik tengah peta: -0, -0');
 assert.equal(SWAPLOTTING_COPY.point.includes('belum diverifikasi'),true);
});
test('invalid browser decimal formats fail rather than coerce or normalize',()=>{
 for(const invalid of ['', ' ', '0x10', '106,5', '106°30', 'NaN','Infinity','1e309',null,10,'1'.repeat(101)])assert.throws(()=>parse(manual(invalid)));
 for(const valid of ['.5','1.','+0','1E-3','0e999'])assert.ok(Number.isFinite(parse(manual(valid,'0')).camera.lng));
});
test('browser underflow guard rejects a nonzero input that becomes zero',()=>{
 for(const value of ['1e-999','-1e-999','0.0001e-999'])assert.throws(()=>parse(manual(value,'0')),{code:'SWAPLOTTING_COORDINATE_UNDERFLOW'});
 assert.equal(parse(manual('5e-324','0')).camera.lng,Number.MIN_VALUE);
 assert.ok(Object.is(parse(manual('-0e-999','0')).camera.lng,-0));
});
test('geographic endpoints and Mercator capability are checked without wrapping or clamping',()=>{
 for(const lng of ['-180','180'])assert.equal(parse(manual(lng,String(limit))).camera.lng,Number(lng));
 assert.equal(parse(manual('0',String(-limit))).camera.lat,-limit);
 for(const [lng,lat] of [['180.0000001','0'],['-180.0000001','0'],['0','90.1']])assert.throws(()=>parse(manual(lng,lat)),{code:'SWAPLOTTING_COORDINATE_RANGE'});
 for(const lat of ['90','-90',String(limit+0.0000000001)])assert.throws(()=>parse(manual('0',lat)),{code:'SWAPLOTTING_COORDINATE_MERCATOR'});
});
test('session source labels never supply the explicit user declaration',()=>{
 assert.throws(()=>session(point()),{code:'SWAPLOTTING_COORDINATE_DECLARATION'});
 for(const extra of [{source:'browser'},{source:null},{crs:undefined},{crs:'WGS84'},{crs:'EPSG:3857'},{id:''},{latitude:'-6'},{longitude:181},{latitude:90}])assert.throws(()=>session(point(extra),{declaredWgs84:true}));
});
test('session projection retains reported metadata but not original precision or unrelated private fields',()=>{
 const source=freeze(point({source:'external_gnss',secret:'excluded',note:'excluded'})),value=session(source,{declaredWgs84:true});
 assert.deepEqual(value.camera,{lat:source.latitude,lng:source.longitude});
 assert.deepEqual(value.provenance,{kind:'session-point',declaredCrs:'browser-wgs84-decimal',raw:{longitude:String(source.longitude),latitude:String(source.latitude)},recordId:source.id,measurementSource:'external_gnss',sourceCrsLabel:'EPSG:4326',metadata:{name:source.name,accuracy:source.accuracy,measuredAt:source.measuredAt,warnings:source.warnings}});
 assert.equal('original' in value.provenance,false);assert.equal('secret' in value.provenance,false);
 assert.notEqual(value.provenance.metadata.warnings,source.warnings);
});
test('malformed session metadata is not silently presented as a valid measured point',()=>{
 for(const extra of [{name:10},{accuracy:-1},{accuracy:'1'},{accuracy:Infinity},{measuredAt:100},{warnings:'text'},{warnings:[null]},{warnings:Array(21).fill('x')},{original:{longitude:1,latitude:'0'}}])assert.equal(signature(point(extra)),null);
 const value=session(point({name:undefined,accuracy:null,measuredAt:null,warnings:undefined,original:undefined}),{declaredWgs84:true});
 assert.deepEqual(value.provenance.metadata,{name:'',accuracy:null,measuredAt:null,warnings:[]});
});
test('candidate projection keeps current source references and original indexes without mutation',()=>{
 const a=freeze(point()),b=freeze(point({id:'gnss-2',source:'external_gnss',name:'',longitude:-0,latitude:0})),rows=freeze([a,point({id:'excluded',source:'browser'}),b]);
 const result=candidates(rows);assert.equal(result.length,2);assert.equal(result[0].record,a);assert.equal(result[1].record,b);assert.equal(result[1].index,2);assert.equal(result[1].raw.longitude,'-0');assert.equal(result[1].label,'gnss-2');
 result[0].metadata.warnings.push('local');assert.equal(a.warnings.length,1);assert.equal('selection' in result[0],false);
});
test('ambiguous duplicate IDs and unsupported source arrays produce no selectable record',()=>{
 assert.deepEqual(candidates(null),[]);assert.deepEqual(candidates(Array(501).fill(point())),[]);
 assert.deepEqual(candidates([point(),point({source:'browser'})]),[]);
 assert.deepEqual(candidates([point(),point({longitude:107})]),[]);
});
test('fingerprint notices exact zero sign, coordinates and metadata while ignoring unrelated fields',()=>{
 const source=point({longitude:-0}),before=signature(source);assert.equal(before,signature({...source,secret:'ignored'}));
 for(const extra of [{longitude:0},{latitude:source.latitude+0.00001},{accuracy:1},{name:'B'},{measuredAt:'other'},{warnings:[]},{original:{longitude:'different',latitude:'text'}}])assert.notEqual(signature({...source,...extra}),before);
});
test('controller provenance validation is atomic, projected and camera-bound including zero sign',()=>{
 for(const value of [parse(manual()),session(point(),{declaredWgs84:true})]){
  const clone=provenance(value.provenance,value.camera);assert.deepEqual(clone,value.provenance);assert.notEqual(clone,value.provenance);
  assert.throws(()=>provenance(value.provenance,{...value.camera,lng:107}));
 }
 const zero=parse(manual('-0','0'));assert.throws(()=>provenance(zero.provenance,{lat:0,lng:0}));
 const sessionValue=session(point(),{declaredWgs84:true});sessionValue.provenance.raw.longitude='1';assert.throws(()=>provenance(sessionValue.provenance,sessionValue.camera));
});
test('provenance cannot use extra metadata keys to change its record identity or target',()=>{
 const value=session(point(),{declaredWgs84:true});Object.assign(value.provenance.metadata,{id:'forged',source:'browser',longitude:1,latitude:2,secret:'excluded'});
 const projected=provenance(value.provenance,value.camera);assert.equal(projected.recordId,'session-survey-1');assert.equal(projected.measurementSource,'survey');assert.equal('secret' in projected.metadata,false);
 assert.throws(()=>provenance({...value.provenance,declaredCrs:'EPSG:4326'},value.camera));
 assert.throws(()=>provenance({...value.provenance,kind:'gps-attestation'},value.camera));
});
test('display facts are plain text with explicit reported and unverified source semantics',()=>{
 const value=session(point({name:'<img onerror=alert(1)>',warnings:['<script>raw</script>']}),{declaredWgs84:true}),display=facts(value.provenance);
 assert.ok(display.some(([label,text])=>label==='Nama titik'&&text==='<img onerror=alert(1)>'));
 assert.ok(display.some(([label,text])=>label==='Deklarasi pengguna'&&text.includes('belum diverifikasi')));
 assert.deepEqual(facts({kind:'initial-viewport'}),[['Asal titik','Tampilan awal peta']]);assert.deepEqual(facts({kind:'unknown'}),[]);assert.deepEqual(facts(null),[]);
});
