import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplotting} from '../assets/swaplotting/controller.js';
import {createSwaplottingPhotoStore} from '../assets/swaplotting/photo-store.js';
import {buildSwaplottingReview,swaplottingNativeTrim} from '../assets/swaplotting/review.js';
import {swaplottingReviewView} from '../assets/swaplotting/review-view.js';
const origin='https://synthetic.invalid';
const url=n=>`blob:${origin}/00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
async function setup(kind='registered'){
 const calls=[],revoked=[],store=createSwaplottingPhotoStore({revoke:path=>revoked.push(path)});
 const c=createSwaplotting({photoOrigin:origin,profile:{userLevel:2,isIkd:false,nama:'\u0085 Owner \u0085',nomorHp:' 00 raw ',email:' synthetic@example.invalid '},read:async(type,values)=>{calls.push({type,values});return type==='disclaimer'?{}:type==='offices'?[{KantorId:' raw-office ',Nama:' Raw Office '}]:[{WilayahId:' raw-region ',Nama:' Raw Region '}];}});
 c.setCameraTarget({lat:-0,lng:106.1234567890123,zoom:17});await c.loadDisclaimer();await c.openForm(kind);await c.selectOffice(0);c.selectRegion(0);
 if(kind==='registered'){c.selectRight('8');c.setField('number','\u0085 00001 \u0085');}
 else{c.selectBasis(7);c.selectTax(2);for(const [key,value] of Object.entries({address:'\u0085 Alamat \u0085',basisNumber:'\u0085 RAW ALAS \u0085',basisDescription:'\u0085 Uraian alas \u0085',taxNumber:' 00 RAW PAJAK ',taxDescription:'\u0085 Uraian pajak \u0085'}))c.setField(key,value);}
 c.setField('review','\u0085 Review <>& \u0085');
 for(let n=1;n<=2;n++){const blob=new Blob(['synthetic '+n],{type:n===1?'image/jpeg':'image/png'});store.add({url:url(n),blob});c.applyPhoto(url(n));}
 return {c,store,calls,revoked,build:()=>buildSwaplottingReview(c.snapshot(),{getPhoto:store.get})};
}
test('registered native DTO preserves key order, constants, option values and selective trim',async()=>{
 const h=await setup(),r=h.build();
 assert.deepEqual(Object.keys(r.dto),['id','kluster','namapemilik','kontaktelp','kontakemail','tipehakid','tipehak','kantorid','namakantor','wilayahid','namawilayah','nomorhak','reviu','lat','lon','file']);
 assert.deepEqual(Object.fromEntries(Object.entries(r.dto).filter(([key])=>key!=='file')),{id:'id',kluster:'K4',namapemilik:'Owner',kontaktelp:'00 raw',kontakemail:'synthetic@example.invalid',tipehakid:'8',tipehak:'Wakaf',kantorid:' raw-office ',namakantor:' Raw Office ',wilayahid:' raw-region ',namawilayah:' Raw Region ',nomorhak:'00001',reviu:'Review <>&',lat:'-0',lon:'106.1234567890123'});
 assert.equal(r.submitted,false);assert.equal(h.calls.length,3);assert.equal(h.c.submit,undefined);
});
test('unregistered native DTO keeps raw proof numbers and the original label as option value',async()=>{
 const h=await setup('unregistered'),r=h.build();
 assert.deepEqual(Object.keys(r.dto),['id','kluster','namapemilik','kontaktelp','kontakemail','alamat','alashak','nomoralashak','keteranganalashak','buktipajak','nomorbuktipajak','keteranganbuktipajak','kantorid','namakantor','wilayahid','namawilayah','reviu','lat','lon','file']);
 assert.equal(r.dto.alamat,'Alamat');assert.equal(r.dto.alashak,'Surat Dibawah Tangan');assert.equal(r.dto.buktipajak,'Girik');assert.equal(r.dto.nomoralashak,'\u0085 RAW ALAS \u0085');assert.equal(r.dto.nomorbuktipajak,' 00 RAW PAJAK ');assert.equal(r.dto.keteranganalashak,'Uraian alas');assert.equal(r.dto.keteranganbuktipajak,'Uraian pajak');
 assert.equal(r.dto.file.length,2);assert.equal(r.parts.length,21);
});
test('native trim codepoints include NEL but exclude zero-width and Mongolian vowel separator',()=>{
 const native='\u0009\u000a\u000b\u000c\u000d\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
 assert.equal(swaplottingNativeTrim(native+' A\u0085B '+native),'A\u0085B');assert.equal(swaplottingNativeTrim(native),'');assert.equal(swaplottingNativeTrim('\u180e\u200b A \u200b\u180e'),'\u180e\u200b A \u200b\u180e');assert.throws(()=>swaplottingNativeTrim(1));
});
test('raw native validators run before service trim, and review exposes the resulting empty field',async()=>{
 const h=await setup();h.c.setField('number','\u0085 ');assert.equal(h.c.validate(),true);const r=h.build();assert.equal(r.dto.nomorhak,'');assert.equal(r.display.find(row=>row.key==='nomorhak').trimmed,true);assert.match(swaplottingReviewView(r),/Kosong setelah spasi/);h.c.setField('number','');assert.throws(h.build);
});
test('parts preserve repeated file names/order and retain only owned immutable byte handles',async()=>{
 const h=await setup(),r=h.build(),files=r.parts.filter(row=>row.kind==='file');assert.equal(r.parts.length,17);assert.deepEqual(files.map(row=>[row.name,row.ordinal,row.sourceMediaType,row.byteLength]),[['file',1,'image/jpeg',11],['file',2,'image/png',11]]);
 assert.equal(files[0].handle,h.store.get(url(1)));assert.equal(files[0].filename,null);assert.match(files[0].mediaTypePolicy,/application\/octet-stream/);assert.match(files[0].filenamePolicy,/unresolved/);assert.ok(Object.isFrozen(r.dto));assert.ok(Object.isFrozen(r.dto.file));
 h.store.sync([url(2)]);assert.equal(h.store.get(url(1)),null);assert.throws(h.build);h.store.dispose();assert.equal(h.store.get(url(2)),null);assert.deepEqual(h.revoked,[url(1),url(2)]);
});
test('a syntactically valid blob URL without an owned Blob is never sufficient',async()=>{
 const h=await setup(),m=h.c.snapshot();assert.throws(()=>buildSwaplottingReview(m,{getPhoto:()=>null}));assert.throws(()=>buildSwaplottingReview(m,{getPhoto:()=>({size:0,type:'image/jpeg',arrayBuffer(){throw Error('not used');}})}));assert.throws(()=>buildSwaplottingReview(m,{getPhoto:()=>({size:10,type:'application/octet-stream',arrayBuffer(){throw Error('not used');}})}));
 m.photos[0]='https://synthetic.invalid/photo.jpg';assert.throws(()=>buildSwaplottingReview(m,{getPhoto:h.store.get}));
 m.photos=Array(1);assert.throws(()=>buildSwaplottingReview(m,{getPhoto:h.store.get}));
});
test('trusted owner, original references, disclaimer and pending gates cannot be bypassed by a complete-looking form',async()=>{
 const h=await setup();
 for(const change of [m=>m.owner.status='unresolved',m=>m.owner.source='user-input',m=>m.fields.name='forged',m=>m.office={...m.office,KantorId:'alias'},m=>m.officeIndex=99,m=>m.region={...m.region,code:'alias'},m=>m.regionIndex=null,m=>m.disclaimerStatus='error',m=>{m.disclaimer={message:'terms'};m.disclaimerAcknowledged=false;},m=>m.pending.regions=true,m=>m.pending.offices=true,m=>m.right='6']){const m=h.c.snapshot();change(m);assert.throws(()=>buildSwaplottingReview(m,{getPhoto:h.store.get}));}
 const m=h.c.snapshot();m.office.Nama=m.offices[0].Nama=null;m.region.name=m.regions[0].name=null;const r=buildSwaplottingReview(m,{getPhoto:h.store.get});assert.equal(r.dto.namakantor,'');assert.equal(r.dto.namawilayah,'');
});
test('coordinates use the captured form target and declared browser formatter, not fixed7 or live device GPS',async()=>{
 const h=await setup();const r=h.build();assert.equal(r.dto.lat,'-0');assert.equal(r.dto.lon,'106.1234567890123');assert.match(r.coordinateFormatting,/native-text-parity-unproven/);
 for(const mutate of [m=>m.point.lat=NaN,m=>m.point.lng=181,m=>m.pointProvenance={kind:'device-gps'},m=>m.pointProvenance={kind:'manual-coordinate',declaredCrs:'browser-wgs84-decimal',raw:{latitude:'1',longitude:'2'}}]){const m=h.c.snapshot();mutate(m);assert.throws(()=>buildSwaplottingReview(m,{getPhoto:h.store.get}));}
 h.c.backToMap();assert.throws(h.build);h.c.dispose();assert.throws(h.build);
});
test('review is an independent snapshot and escapes HTML while retaining human field labels',async()=>{
 const h=await setup('unregistered');h.c.setField('basisNumber',' <img src=x onerror="x"> ');const r=h.build(),html=swaplottingReviewView(r);h.c.setField('basisNumber','changed');assert.equal(r.dto.nomoralashak,' <img src=x onerror="x"> ');assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/Nomor alas hak/);assert.doesNotMatch(html,/native-32|byte handles|kantorid/);assert.match(html,/belum dikirim/);assert.equal(swaplottingReviewView(null),'');assert.match(swaplottingReviewView(null,'<error>'),/&lt;error&gt;/);
});
