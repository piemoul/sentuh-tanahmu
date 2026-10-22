import test from 'node:test';
import assert from 'node:assert/strict';
import {createLostCertificates} from '../assets/lost-certificate/controller.js';

const offices=[{KantorId:' office-A ',Nama:'Synthetic A'},{KantorId:'office-B',Nama:'Synthetic B'}];
const row=(id=' original-parcel ',pemohon='Synthetic Owner')=>({persilId:id,pemohon,nomor:'Different certificate',nomorBerkas:'Synthetic File',wilayah:'Synthetic Village',berkasId:'never-map-from-file',dI304Id:'never-map-from-announcement',tanggalMulai:'2026-10-20',tanggalSelesai:'2026-11-20',luas:100});
const geometry=()=>({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.1,-6],[106.1,-5.9],[106,-6]]]},properties:{source:'Synthetic'}}]});
const defer=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function fixture(options={}) {
  const calls=[],changes=[],auth=[];let active=true,authenticated=true,favoriteId=null;
  const c=createLostCertificates({read:(kind,values)=>{const pending=defer();calls.push({kind,values,...pending});return pending.promise;},getFavoriteOfficeId:()=>favoriteId,isAuthenticated:()=>authenticated,isCurrent:()=>active,changed:s=>changes.push(s),onSessionError:error=>auth.push(error.code),...options});
  return {c,calls,changes,auth,inactive(){active=false;},anonymous(){authenticated=false;},authenticate(){authenticated=true;},favorite(value){favoriteId=value;},async resolve(work,value,index=calls.length-1){calls[index].resolve(value);return work;},async reject(work,error,index=calls.length-1){calls[index].reject(error);return work;}};
}
async function loaded(h,rows=[row()]) {const work=h.c.start();h.calls.at(-1).resolve(offices);await Promise.resolve();assert.equal(h.calls.at(-1).kind,'feed');h.calls.at(-1).resolve({data:rows});assert.equal(await work,true);}
async function afterLocation(h,returnedId=' returned-parcel ') {const work=h.c.loadMap(),index=h.calls.length-1;h.calls[index].resolve({error:false,data:{persilId:returnedId}});await Promise.resolve();assert.equal(h.calls.at(-1).kind,'boundary');return {work,index,boundary:h.calls.length-1};}

test('construction is inert and start serializes native empty office query before exact favorite-office feed',async()=>{
  const h=fixture();h.favorite('office-B');assert.equal(h.calls.length,0);assert.equal(h.c.snapshot().stage,'idle');
  const work=h.c.start();assert.deepEqual(h.calls[0].values,{nama:'',tipeKantor:''});assert.equal(await h.c.start(),false);
  h.calls[0].resolve(offices);await Promise.resolve();assert.equal(h.calls.length,2);assert.equal(h.calls[1].kind,'feed');assert.deepEqual(h.calls[1].values,{kantorId:'office-B'});assert.equal(h.c.snapshot().officeIndex,1);
  h.calls[1].resolve({error:true,data:[row(),row()]});assert.equal(await work,true);assert.equal(h.c.snapshot().rows.length,2);assert.equal(h.c.snapshot().stage,'ready');assert.equal(h.c.snapshot().pending.feed,false);
});
test('first office fallback, empty offices and missing-ID guard have distinct no-office behavior',async()=>{
  const h=fixture();h.favorite('not returned');await loaded(h);assert.deepEqual(h.calls[1].values,{kantorId:' office-A '});
  for(const rows of [[],[{KantorId:null,Nama:'Missing ID'}],[{KantorId:' \u0085 ',Nama:'Blank ID'}]]){const f=fixture(),work=f.c.start();f.calls[0].resolve(rows);assert.equal(await work,false);assert.equal(f.c.snapshot().stage,'no-office');assert.equal(f.calls.length,1);}
  const fallback=fixture();fallback.favorite('profile-office');const work=fallback.c.start();fallback.calls[0].resolve([{KantorId:null,Nama:'Nullable ID'}]);await Promise.resolve();assert.deepEqual(fallback.calls[1].values,{kantorId:'profile-office'});fallback.calls[1].resolve({data:[]});await work;assert.equal(fallback.c.snapshot().stage,'empty');
});
test('query is local/raw, duplicate records remain and selected detail uses the original source index',async()=>{
  const h=fixture();await loaded(h,[row('A','First'),row('B','Match'),row('B','Match')]);const before=h.calls.length;
  h.c.setQuery('MATCH');assert.deepEqual(h.c.snapshot().entries.map(x=>x.index),[1,2]);assert.equal(h.c.openDetail(2),true);assert.equal(h.c.snapshot().detail.item.persilId,'B');
  h.c.closeDetail();assert.equal(h.c.snapshot().query,'MATCH');h.c.setQuery(' Match ');assert.equal(h.c.snapshot().entries.length,0);assert.equal(h.calls.length,before);
  for(const index of [-1,3,1.5,'1',null])assert.equal(h.c.openDetail(index),false);
});
test('office switch retires old feed success/session failure and failure clears old rows/detail before explicit retry',async()=>{
  for(const stale of ['success','auth']){
    const h=fixture();await loaded(h);h.c.openDetail(0);const old=h.c.selectOffice(0),oldIndex=h.calls.length-1;assert.equal(h.c.snapshot().rows.length,0);assert.equal(h.c.snapshot().detail,null);
    const next=h.c.selectOffice(1),nextIndex=h.calls.length-1;h.calls[nextIndex].resolve({data:[row('new','New Owner')]});await next;
    if(stale==='auth')h.calls[oldIndex].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));else h.calls[oldIndex].resolve({data:[row('old')]});await old;
    assert.equal(h.c.snapshot().officeIndex,1);assert.equal(h.c.snapshot().rows[0].persilId,'new');assert.deepEqual(h.auth,[]);
    const failure=h.c.selectOffice(1);h.calls.at(-1).reject(new Error('Synthetic timeout'));await failure;assert.equal(h.c.snapshot().stage,'error');assert.deepEqual(h.c.snapshot().rows,[]);
    const retry=h.c.selectOffice(1);h.calls.at(-1).resolve({data:[]});await retry;assert.equal(h.c.snapshot().stage,'empty');assert.equal(h.c.snapshot().errors.feed,'');
  }
});
test('office refresh invalidates pending feed and uses a fresh profile favorite snapshot',async()=>{
  const h=fixture();await loaded(h);const old=h.c.selectOffice(0),oldIndex=h.calls.length-1;h.favorite('office-B');const refresh=h.c.start(),officeIndex=h.calls.length-1;
  h.calls[oldIndex].resolve({data:[row('stale')]});await old;assert.deepEqual(h.c.snapshot().rows,[]);
  h.calls[officeIndex].resolve(offices);await Promise.resolve();assert.deepEqual(h.calls.at(-1).values,{kantorId:'office-B'});h.calls.at(-1).resolve({data:[]});await refresh;assert.equal(h.c.snapshot().officeIndex,1);
});
test('map requires authenticated explicit action and uses metadata returned persilId, never another record identifier',async()=>{
  const h=fixture();await loaded(h);h.c.openDetail(0);const before=h.calls.length,{work,boundary}=await afterLocation(h);
  assert.equal(h.calls[before].kind,'location');assert.deepEqual(h.calls[before].values,{persilId:' original-parcel '});assert.deepEqual(h.calls[boundary].values,{persilid:' returned-parcel '});
  const raw=geometry();h.calls[boundary].resolve(raw);assert.equal(await work,true);assert.equal(h.c.snapshot().detail.map.stage,'ready');assert.equal(h.c.snapshot().detail.map.metadata.persilId,' returned-parcel ');assert.deepEqual(h.c.snapshot().detail.map.geometry,raw);
  h.anonymous();assert.equal(await h.c.loadMap(),false);assert.equal(h.calls.length,before+2);
  const anonymous=createLostCertificates({read:()=>{throw new Error('never called');}});assert.equal(await anonymous.loadMap(),false);
});
test('missing/error/null/malformed metadata never substitutes original ID or requests a boundary',async()=>{
  for(const reply of [{error:true,data:{persilId:'returned'}},{error:false,data:null},{error:false,data:{persilId:null}},{error:false,data:{persilId:' \u0085 '}},{error:false,data:{persilId:42}}]){
    const h=fixture();await loaded(h);h.c.openDetail(0);const before=h.calls.length,work=h.c.loadMap();h.calls.at(-1).resolve(reply);assert.equal(await work,false);assert.equal(h.calls.length,before+1);assert.equal(h.c.snapshot().detail.map.stage,'error');assert.equal(h.c.snapshot().detail.map.geometry,null);
  }
  for(const persilId of [null,'',' \u0085 ']){const h=fixture();await loaded(h,[row(persilId)]);h.c.openDetail(0);const before=h.calls.length;assert.equal(await h.c.loadMap(),false);assert.equal(h.calls.length,before);assert.equal(h.c.snapshot().detail.map.error,'Lokasi Peta Bidang tidak ditemukan.');}
});
test('boundary empty, malformed and ordinary failure retain detail and allow an explicit full-chain retry',async()=>{
  for(const kind of ['empty','invalid','failure']){
    const h=fixture();await loaded(h);h.c.openDetail(0);const {work,boundary}=await afterLocation(h);
    if(kind==='failure')h.calls[boundary].reject(new Error('Synthetic boundary failure'));else h.calls[boundary].resolve(kind==='empty'?{type:'FeatureCollection',features:[]}:{type:'FeatureCollection',features:[{}]});
    assert.equal(await work,kind==='empty');assert.equal(h.c.snapshot().detail.map.stage,kind==='empty'?'empty':'error');assert.equal(h.c.snapshot().detail.item.pemohon,'Synthetic Owner');assert.equal(h.c.snapshot().pending.map,false);
    const retry=h.c.loadMap();assert.equal(h.calls.at(-1).kind,'location');h.calls.at(-1).resolve({error:true,data:null});await retry;
  }
});
test('duplicate pending map action is blocked and old location/boundary responses cannot revive a changed detail or session',async()=>{
  for(const stage of ['location','boundary'])for(const change of ['detail','close','office','dispose','inactive'])for(const outcome of ['success','auth']){
    const h=fixture();await loaded(h,[row('A'),row('B')]);h.c.openDetail(0);let work,index;
    if(stage==='location'){work=h.c.loadMap();index=h.calls.length-1;}else({work,boundary:index}=await afterLocation(h));
    const count=h.calls.length;assert.equal(await h.c.loadMap(),false);assert.equal(h.calls.length,count);
    if(change==='detail')h.c.openDetail(1);if(change==='close')h.c.closeDetail();if(change==='office'){const next=h.c.selectOffice(1);h.calls.at(-1).resolve({data:[]});await next;}if(change==='dispose')h.c.dispose();if(change==='inactive')h.inactive();
    const before=h.c.snapshot(),changes=h.changes.length;
    if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve(stage==='location'?{error:false,data:{persilId:'stale'}}:geometry());
    assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,changes);assert.deepEqual(h.auth,[]);assert.equal(h.calls.length,change==='office'?count+1:count);
  }
});
test('current session failures are surfaced once; retired office/feed results do not clear another session',async()=>{
  for(const stage of ['offices','feed','location','boundary']){
    const h=fixture();let work,index;
    if(stage==='offices'){work=h.c.start();index=0;}else if(stage==='feed'){work=h.c.start();h.calls[0].resolve(offices);await Promise.resolve();index=1;}else{await loaded(h);h.c.openDetail(0);if(stage==='location'){work=h.c.loadMap();index=h.calls.length-1;}else({work,boundary:index}=await afterLocation(h));}
    h.calls[index].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));await work;assert.deepEqual(h.auth,['SESSION_EXPIRED']);
  }
  for(const stage of ['offices','feed'])for(const outcome of ['success','auth']){const h=fixture();let work=h.c.start(),index=0;if(stage==='feed'){h.calls[0].resolve(offices);await Promise.resolve();index=1;}h.c.dispose();const before=h.c.snapshot(),changes=h.changes.length;if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve(stage==='offices'?offices:{data:[row()]});await work;assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,changes);assert.deepEqual(h.auth,[]);}
});
test('auth drop while an otherwise-current map read is pending discards its result and releases the retry lock',async()=>{
  for(const stage of ['location','boundary'])for(const outcome of ['success','auth']){
    const h=fixture();await loaded(h);h.c.openDetail(0);let work,index;
    if(stage==='location'){work=h.c.loadMap();index=h.calls.length-1;}else({work,boundary:index}=await afterLocation(h));
    h.anonymous();
    if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('expired old read'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve(stage==='location'?{error:false,data:{persilId:'retired'}}:geometry());
    assert.equal(await work,false);assert.equal(h.c.snapshot().pending.map,false);assert.deepEqual(h.c.snapshot().detail.map,{stage:'idle',metadata:null,geometry:null,error:''});assert.deepEqual(h.auth,[]);
    h.authenticate();const retry=h.c.loadMap();assert.equal(h.calls.at(-1).kind,'location');assert.equal(h.c.snapshot().pending.map,true);h.calls.at(-1).resolve({error:true,data:null});await retry;assert.equal(h.c.snapshot().pending.map,false);
  }
});
test('snapshots and upstream references cannot mutate canonical office, records, detail or boundary geometry',async()=>{
  const h=fixture(),raw=row(),officeRows=structuredClone(offices);const work=h.c.start();h.calls[0].resolve(officeRows);await Promise.resolve();h.calls[1].resolve({data:[raw]});await work;raw.pemohon='changed outside';officeRows[0].KantorId='changed outside';
  const first=h.c.snapshot();first.rows[0].pemohon='snapshot changed';first.offices.length=0;first.entries[0].item.persilId='snapshot changed';assert.equal(h.c.snapshot().rows[0].pemohon,'Synthetic Owner');assert.equal(h.c.snapshot().office.KantorId,' office-A ');
  h.c.openDetail(0);const {work:map,boundary}=await afterLocation(h),rawGeometry=geometry();h.calls[boundary].resolve(rawGeometry);await map;rawGeometry.features.length=0;const after=h.c.snapshot();after.detail.item.pemohon='snapshot changed';after.detail.map.geometry.features.length=0;assert.equal(h.c.snapshot().detail.map.geometry.features.length,1);assert.equal(h.c.snapshot().detail.item.pemohon,'Synthetic Owner');
});
