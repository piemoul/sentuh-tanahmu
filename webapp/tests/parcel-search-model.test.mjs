import test from 'node:test';
import assert from 'node:assert/strict';
import {parcelSearchRights,parcelSearchRight,parcelSearchNeedsRegion,parcelSearchOffices,parcelSearchRegions,parcelSearchValidation,parcelSearchLookup,parcelSearchBoundary,parcelSearchUsableId,parcelSearchNibel} from '../assets/parcel/search-model.js';
import {prepareParcelCamera} from '../parcel-map.js';
const geometry=()=>({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.1,-6],[106.1,-5.9],[106,-6]]]},properties:{NIB:'SINTETIS',LUAS:10}}]});
const valid=()=>({tab:0,right:1,office:{KantorId:'main-office'},region:{code:'region-id'},number:'00001',nibel:null});
test('native fixed rights codes preserve Wakaf8 rather than array ordinal',()=>{
 assert.deepEqual(parcelSearchRights.map(row=>row.code),[1,2,3,4,5,8]);assert.equal(parcelSearchRight('8'),8);
 for(const invalid of [6,7,'01',' 1',NaN,null,{},true])assert.equal(parcelSearchRight(invalid),null);
 assert.equal(parcelSearchNeedsRegion(2),false);assert.equal(parcelSearchNeedsRegion(5),false);assert.equal(parcelSearchNeedsRegion(8),true);
});
test('office reference uses exact case-sensitive main identity and preserves source order',()=>{
 const raw=[{KantorId:'main-B',Nama:'B',id:'directus-wrong',kantor_id:'alias-wrong'},{KantorId:'main-A',Nama:'A'}],before=structuredClone(raw),rows=parcelSearchOffices(raw);
 assert.deepEqual(rows,[{KantorId:'main-B',Nama:'B'},{KantorId:'main-A',Nama:'A'}]);assert.deepEqual(raw,before);
 rows[0].KantorId='changed';assert.equal(raw[0].KantorId,'main-B');assert.deepEqual(parcelSearchOffices([{id:'unusable'}]),[{KantorId:null,Nama:null}]);
});
test('region projection uses WilayahId and never raw Kode even when the two differ',()=>{
 const raw=[{Kode:'wrong-code',Nama:'Desa SINTETIS',TipeWilayah:'5',WilayahId:'exact-region-id'}],before=structuredClone(raw);
 assert.deepEqual(parcelSearchRegions(raw),[{code:'exact-region-id',name:'Desa SINTETIS'}]);assert.deepEqual(raw,before);
 assert.deepEqual(parcelSearchRegions([{Kode:'must-not-substitute'}]),[{code:null,name:null}]);
});
test('malformed reference rows fail the whole list rather than skipping rows or coercing identifiers',()=>{
 for(const parser of [parcelSearchOffices,parcelSearchRegions])for(const raw of [null,{},'[]',[null],[[]],[new Date()],Array(1)])assert.throws(()=>parser(raw));
 assert.throws(()=>parcelSearchOffices([{KantorId:'valid'},{KantorId:3}]));
 for(const key of ['Kode','Nama','TipeWilayah','WilayahId'])assert.throws(()=>parcelSearchRegions([{[key]:3}]));
 assert.deepEqual(parcelSearchOffices([]),[]);assert.deepEqual(parcelSearchRegions([]),[]);
});
test('aggregate requires nonnull analog fields but accepts raw empty number and preserves exceptional region rules',()=>{
 assert.deepEqual(parcelSearchValidation(valid()),{ok:true,missing:[]});
 assert.deepEqual(parcelSearchValidation({...valid(),number:''}),{ok:true,missing:[]});
 assert.deepEqual(parcelSearchValidation({...valid(),number:'  A%&? '}),{ok:true,missing:[]});
 for(const right of [2,5])assert.equal(parcelSearchValidation({...valid(),right,region:null}).ok,true);
 for(const region of [null,{code:null},{code:''}])assert.equal(parcelSearchValidation({...valid(),region}).ok,false);
 assert.equal(parcelSearchValidation({...valid(),region:{code:' '}}).ok,true);
 assert.deepEqual(parcelSearchValidation({tab:0,right:null,office:null,region:null,number:null}).missing,['jenisHak','kantor','kelurahan','nomorSertipikat']);
});
test('electronic validation checks stored length14 and adds no guessed digits/truncation/normalization',()=>{
 for(const nibel of [null,'','a'.repeat(13)])assert.equal(parcelSearchValidation({tab:1,nibel}).ok,false);
 for(const nibel of ['a'.repeat(14),' '.repeat(14),'1'.repeat(500),'😀'.repeat(7)])assert.equal(parcelSearchValidation({tab:1,nibel}).ok,true);
 assert.equal(parcelSearchValidation({tab:2,nibel:'1'.repeat(14)}).ok,false);
});
test('frozen NIBEL callback removes every ASCII dot while retaining all other raw characters',()=>{
 for(const [raw,stored]of [['12.34..56','123456'],[' . ','  '],['A．B.C','A．BC'],['\u0085A.B\u0085','\u0085AB\u0085'],['...',''],['A'.repeat(30),'A'.repeat(30)]])assert.equal(parcelSearchNibel(raw),stored);
 for(const invalid of [null,3,{},undefined])assert.throws(()=>parcelSearchNibel(invalid));
 assert.equal(parcelSearchValidation({tab:1,nibel:parcelSearchNibel('1.2.3.4.5.6.7.8.9.0.1.2.3')}).ok,false);
});
test('lookup consumes only exact returned PersilId and does not reinterpret numeric metadata as coordinates',()=>{
 assert.deepEqual(parcelSearchLookup({PersilId:' exact-ID ',Luas:'9223372036854775807',BatasPersil:20}),{PersilId:' exact-ID '});
 assert.deepEqual(parcelSearchLookup({persilid:'wrong-case',data:{PersilId:'nested'}}),{PersilId:null});
 for(const raw of [null,[],{},'{}',{PersilId:1}]){if(raw&&Object.getPrototypeOf(raw)===Object.prototype&&!Object.hasOwn(raw,'PersilId'))continue;assert.throws(()=>parcelSearchLookup(raw));}
});
test('native ID emptiness checks include U+0085 but preserve original nonempty text',()=>{
 const whitespace='\u0009\u000a\u000b\u000c\u000d\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
 for(const char of whitespace)assert.equal(parcelSearchUsableId(char),false,char.codePointAt(0));
 for(const value of [null,undefined,'',3,false])assert.equal(parcelSearchUsableId(value),false);
 assert.equal(parcelSearchUsableId(' original-ID '),true);assert.equal(parcelSearchUsableId('\u200b'),true);
});
test('boundary validation preserves exact server collection, holes, multipolygon, properties and order',()=>{
 const raw=geometry();raw.features.push({type:'Feature',geometry:{type:'MultiPolygon',coordinates:[[raw.features[0].geometry.coordinates[0]],[[[107,-6],[107.1,-6],[107.1,-5.9],[107,-6]]]]},properties:{note:'<img src=x onerror=bad>'}});const before=structuredClone(raw),parsed=parcelSearchBoundary(raw);
 assert.equal(parsed.data,raw);assert.equal(parsed.status,'ready');assert.deepEqual(raw,before);assert.equal(prepareParcelCamera(raw).pointCount,12);
 assert.equal(parcelSearchBoundary({type:'FeatureCollection',features:[]}).status,'empty');
});
test('geometry browser guards agree with existing parcel camera for malformed/projected/unclosed data',()=>{
 const bad=[];for(const crs of ['EPSG:3857','unknown'])bad.push({...geometry(),crs:{properties:{name:crs}}});
 for(const point of [[181,-6],[106,91],['106',-6],[106,NaN],[106,Infinity],null]){const raw=geometry();raw.features[0].geometry.coordinates[0][1]=point;bad.push(raw);}
 const open=geometry();open.features[0].geometry.coordinates[0].pop();bad.push(open);
 bad.push({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[106,-6]}}]},null);
 for(const raw of bad){assert.throws(()=>parcelSearchBoundary(raw));assert.throws(()=>prepareParcelCamera(raw));}
});
