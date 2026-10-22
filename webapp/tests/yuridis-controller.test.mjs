import test from 'node:test';
import assert from 'node:assert/strict';
import {createYuridis} from '../assets/yuridis/controller.js';

// Synthetic deferred transport only. No HTTP, account, map provider or writes.
const offices=[{KantorId:' office-A ',Nama:'Synthetic A'},{KantorId:'office-B',Nama:'Synthetic B'}];
const row=(persilId=' original-persil ',pemohon='Synthetic Owner')=>({persilId,pemohon,nomorBerkas:'FILE-different-from-persil',nomorPengumuman:'ANNOUNCEMENT-never-map',tanggalMulai:'2026-10-20',tanggalSelesai:'2026-11-20',nib:'NIB-never-map',wilayah:'Synthetic Village',luasPersil:100,kegiatan:'Rutin',permohonan:'Synthetic request'});
const geometry=()=>({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.1,-6],[106.1,-5.9],[106,-6]]]},properties:{source:'Synthetic'}}]});
const defer=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function fixture(options={}) {
  const calls=[],changes=[],auth=[];let active=true,authenticated=true,favoriteId=null;
  const c=createYuridis({read:(kind,values)=>{const pending=defer();calls.push({kind,values,...pending});return pending.promise;},getFavoriteOfficeId:()=>favoriteId,isAuthenticated:()=>authenticated,isCurrent:()=>active,changed:value=>changes.push(value),onSessionError:error=>auth.push(error.code),...options});
  return {c,calls,changes,auth,favorite(value){favoriteId=value;},inactive(){active=false;},anonymous(){authenticated=false;},authenticate(){authenticated=true;}};
}
async function loaded(h,rows=[row()],officeRows=offices) {
  const work=h.c.start();h.calls.at(-1).resolve(officeRows);await Promise.resolve();
  assert.equal(h.calls.at(-1).kind,'feed');h.calls.at(-1).resolve({data:rows});assert.equal(await work,true);
}
async function fallback(h,{failed=false,rows=[row()]}={}) {
  const work=h.c.start();
  if(failed)h.calls.at(-1).reject(new Error('Synthetic office timeout'));else h.calls.at(-1).resolve([]);
  await Promise.resolve();assert.equal(h.calls.at(-1).kind,'feed');h.calls.at(-1).resolve({data:rows});assert.equal(await work,true);
}
async function afterLocation(h,returnedId=' returned-persil ') {
  const work=h.c.loadMap();h.calls.at(-1).resolve({error:false,data:{persilId:returnedId}});await Promise.resolve();
  assert.equal(h.calls.at(-1).kind,'boundary');return {work,index:h.calls.length-1};
}

test('construction is inert and start serializes office lookup before original returned favorite ID',async()=>{
  const h=fixture();h.favorite('office-B');assert.equal(h.calls.length,0);assert.equal(await h.c.refresh(),false);
  const work=h.c.start();assert.deepEqual(h.calls[0],{kind:'offices',values:{nama:'',tipeKantor:''},promise:h.calls[0].promise,resolve:h.calls[0].resolve,reject:h.calls[0].reject});
  assert.equal(await h.c.start(),false);assert.equal(await h.c.selectOffice(0),false);assert.equal(await h.c.refresh(),false);assert.equal(h.calls.length,1);
  h.calls[0].resolve(offices);await Promise.resolve();assert.deepEqual(h.calls[1].values,{kantorId:'office-B'});
  assert.equal(h.c.snapshot().officeId,'office-B');assert.equal(h.c.snapshot().officeSource,'returned');assert.equal(h.c.snapshot().officeIndex,1);
  h.calls[1].resolve({error:true,data:[row(),row()]});assert.equal(await work,true);assert.equal(h.c.snapshot().rows.length,2);assert.equal(h.c.snapshot().stage,'ready');
});

test('empty office list uses the original profile favorite without fabricating an office row',async()=>{
  const h=fixture();h.favorite(' profile-only ');await fallback(h);
  assert.deepEqual(h.calls.map(x=>x.kind),['offices','feed']);assert.deepEqual(h.calls[1].values,{kantorId:' profile-only '});
  const model=h.c.snapshot();assert.equal(model.officeIndex,null);assert.equal(model.office,null);assert.deepEqual(model.offices,[]);assert.equal(model.officeId,' profile-only ');assert.equal(model.officeSource,'favorite');assert.equal(model.stage,'ready');assert.equal(model.errors.offices,'');
});

test('ordinary failed or malformed office lookup preserves its warning and still reads the known profile favorite',async()=>{
  for(const outcome of ['network','malformed']){
    const h=fixture();h.favorite('profile-office');const work=h.c.start();
    if(outcome==='network')h.calls[0].reject(new Error('Synthetic office timeout'));else h.calls[0].resolve({data:offices});
    await Promise.resolve();assert.equal(h.calls.length,2);assert.deepEqual(h.calls[1].values,{kantorId:'profile-office'});
    h.calls[1].resolve({data:[]});assert.equal(await work,true);const model=h.c.snapshot();assert.equal(model.stage,'empty');assert.ok(model.errors.offices);assert.equal(model.errors.feed,'');assert.equal(model.pending.offices,false);assert.equal(model.pending.feed,false);assert.equal(model.officeIndex,null);assert.equal(model.officeId,'profile-office');
  }
});

test('no usable native/profile office stops feed; empty nonnull returned ID never falls back',async()=>{
  for(const favorite of [null,42,'',' \u0085 '])for(const failed of [false,true]){
    const h=fixture();h.favorite(favorite);const work=h.c.start();if(failed)h.calls[0].reject(new Error('Synthetic office failure'));else h.calls[0].resolve([]);
    assert.equal(await work,false);assert.equal(h.calls.length,1);assert.equal(h.c.snapshot().stage,failed?'error':'no-office');
  }
  const h=fixture();h.favorite('known-profile');const work=h.c.start();h.calls[0].resolve([{KantorId:'',Nama:'Returned empty ID'}]);assert.equal(await work,false);assert.equal(h.calls.length,1);assert.equal(h.c.snapshot().officeSource,'returned');assert.equal(h.c.snapshot().officeId,'');
});

test('nonempty returned offices choose first native match or first row, including nullable-ID profile fallback',async()=>{
  const h=fixture();h.favorite('not-returned');await loaded(h);assert.deepEqual(h.calls[1].values,{kantorId:' office-A '});
  const duplicate=fixture();duplicate.favorite('office-B');await loaded(duplicate,[],[offices[1],offices[1]]);assert.equal(duplicate.c.snapshot().officeIndex,0);
  const nullable=fixture();nullable.favorite(' profile ');await loaded(nullable,[],[{KantorId:null,Nama:'Nullable native ID'}]);assert.equal(nullable.c.snapshot().officeIndex,0);assert.equal(nullable.c.snapshot().office.KantorId,null);assert.equal(nullable.c.snapshot().officeSource,'favorite');assert.deepEqual(nullable.calls[1].values,{kantorId:' profile '});
});

test('current office session errors stop before favorite feed and notify once',async()=>{
  for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){
    const h=fixture();h.favorite('profile-office');const work=h.c.start();h.calls[0].reject(Object.assign(new Error('Synthetic expired'),{code}));assert.equal(await work,false);assert.deepEqual(h.auth,[code]);assert.equal(h.calls.length,1);assert.equal(h.c.snapshot().pending.offices,false);assert.equal(h.c.snapshot().stage,'error');assert.equal(h.changes.at(-1).stage,'error');
  }
});

test('duplicate pending selection/refresh is blocked while a different returned selection retires its older feed',async()=>{
  const h=fixture();await loaded(h);const old=h.c.selectOffice(0),oldIndex=h.calls.length-1,count=h.calls.length;
  assert.equal(await h.c.selectOffice(0),false);assert.equal(await h.c.refresh(),false);assert.equal(h.calls.length,count);
  const next=h.c.selectOffice(1),nextIndex=h.calls.length-1;h.calls[nextIndex].resolve({data:[row('current')]});assert.equal(await next,true);
  h.calls[oldIndex].resolve({data:[row('stale')]});assert.equal(await old,false);assert.equal(h.c.snapshot().officeId,'office-B');assert.equal(h.c.snapshot().rows[0].persilId,'current');
  for(const input of ['office-A','unowned-id','1',{},null,-1,2,0.5])assert.equal(await h.c.selectOffice(input),false);assert.equal(h.calls.length,nextIndex+1);
});

test('profile-only refresh uses current exact favorite and never a caller-supplied browser ID',async()=>{
  const h=fixture();h.favorite(' first-profile ');await fallback(h,{failed:true});h.c.openDetail(0);h.c.setQuery('Synthetic');h.favorite('second-profile');
  const work=h.c.refresh('browser-forged-id');assert.deepEqual(h.calls.at(-1).values,{kantorId:'second-profile'});assert.equal(h.c.snapshot().detail,null);assert.deepEqual(h.c.snapshot().rows,[]);assert.equal(h.c.snapshot().query,'Synthetic');
  const count=h.calls.length;assert.equal(await h.c.refresh(),false);assert.equal(h.calls.length,count);h.calls.at(-1).resolve({data:[]});assert.equal(await work,true);assert.equal(h.c.snapshot().stage,'empty');assert.equal(h.c.snapshot().officeId,'second-profile');assert.ok(h.c.snapshot().errors.offices);
});

test('current returned-office refresh retains the selected ID when profile favorite changes',async()=>{
  const h=fixture();h.favorite('office-B');await loaded(h);h.favorite('new-profile-favorite');const work=h.c.refresh();assert.deepEqual(h.calls.at(-1).values,{kantorId:'office-B'});h.calls.at(-1).resolve({data:[]});await work;assert.equal(h.c.snapshot().officeSource,'returned');
});

test('changed profile while favorite feed is pending retires success/auth failure and releases explicit-refresh ownership',async()=>{
  for(const outcome of ['success','auth']){
    const h=fixture();h.favorite('old-profile');const work=h.c.start();h.calls[0].resolve([]);await Promise.resolve();const index=h.calls.length-1;h.favorite('new-profile');
    if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('Stale session result'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve({data:[row('stale')]});
    assert.equal(await work,false);assert.deepEqual(h.auth,[]);assert.deepEqual(h.c.snapshot().rows,[]);assert.equal(h.c.snapshot().pending.feed,false);assert.equal(h.c.snapshot().officeId,'new-profile');assert.equal(h.c.snapshot().stage,'idle');assert.equal(h.calls.length,2);
    const refresh=h.c.refresh();assert.deepEqual(h.calls.at(-1).values,{kantorId:'new-profile'});h.calls.at(-1).resolve({data:[]});assert.equal(await refresh,true);
  }
});

test('office reload retires pending feed and selects from a new real office list',async()=>{
  for(const outcome of ['success','auth']){
    const h=fixture();h.favorite('profile-only');await fallback(h);const old=h.c.refresh(),oldIndex=h.calls.length-1;const next=h.c.start(),officeIndex=h.calls.length-1;
    if(outcome==='auth')h.calls[oldIndex].reject(Object.assign(new Error('Retired auth error'),{code:'SESSION_EXPIRED'}));else h.calls[oldIndex].resolve({data:[row('old')]});assert.equal(await old,false);assert.deepEqual(h.auth,[]);
    h.calls[officeIndex].resolve([offices[1]]);await Promise.resolve();assert.deepEqual(h.calls.at(-1).values,{kantorId:'office-B'});h.calls.at(-1).resolve({data:[row('new')]});await next;assert.equal(h.c.snapshot().rows[0].persilId,'new');assert.equal(h.c.snapshot().errors.offices,'');
  }
});

test('current feed failure removes old rows and detail; explicit refresh can recover without new office lookup',async()=>{
  const h=fixture();h.favorite('profile-only');await fallback(h);h.c.openDetail(0);const before=h.calls.length,work=h.c.refresh();h.calls.at(-1).reject(new Error('Synthetic feed timeout'));assert.equal(await work,false);assert.equal(h.c.snapshot().stage,'error');assert.deepEqual(h.c.snapshot().rows,[]);assert.equal(h.c.snapshot().detail,null);
  const retry=h.c.refresh();h.calls.at(-1).resolve({data:[]});assert.equal(await retry,true);assert.equal(h.calls.length,before+2);assert.equal(h.c.snapshot().errors.feed,'');assert.equal(h.c.snapshot().stage,'empty');
});

test('query is local, source duplicates survive, and detail opens the original source index without detail endpoint',async()=>{
  const h=fixture();await loaded(h,[row('A','First'),row('B','Match'),row('B','Match')]);const count=h.calls.length;h.c.setQuery('MATCH');assert.deepEqual(h.c.snapshot().entries.map(x=>x.index),[1,2]);assert.equal(h.c.openDetail(2),true);assert.equal(h.c.snapshot().detail.item.persilId,'B');h.c.closeDetail();assert.equal(h.c.snapshot().query,'MATCH');h.c.setQuery(' Match ');assert.equal(h.c.snapshot().entries.length,0);assert.equal(h.calls.length,count);
});

test('map reads original selected persilId then only the metadata-returned persilId, including favorite-only feed',async()=>{
  const h=fixture();h.favorite('profile-only');await fallback(h);h.c.openDetail(0);const before=h.calls.length,{work,index}=await afterLocation(h);assert.deepEqual(h.calls[before],{kind:'location',values:{persilId:' original-persil '},promise:h.calls[before].promise,resolve:h.calls[before].resolve,reject:h.calls[before].reject});assert.deepEqual(h.calls[index].values,{persilid:' returned-persil '});h.calls[index].resolve(geometry());assert.equal(await work,true);assert.equal(h.c.snapshot().detail.map.stage,'ready');assert.equal(h.c.snapshot().detail.map.metadata.persilId,' returned-persil ');
});

test('missing/rejected map metadata cannot substitute an original/fabricated ID',async()=>{
  for(const reply of [{error:true,data:{persilId:'returned'}},{error:false,data:null},{error:false,data:{persilId:null}},{error:false,data:{persilId:' \u0085 '}},{error:false,data:{persilId:42}}]){
    const h=fixture();await loaded(h);h.c.openDetail(0);const work=h.c.loadMap(),count=h.calls.length;h.calls.at(-1).resolve(reply);assert.equal(await work,false);assert.equal(h.calls.length,count);assert.equal(h.c.snapshot().detail.map.stage,'error');assert.equal(h.c.snapshot().detail.map.geometry,null);
  }
});

test('stale location/boundary cannot revive another detail, office, disposed owner, or changed favorite',async()=>{
  for(const stage of ['location','boundary'])for(const change of ['detail','office','dispose','inactive','favorite'])for(const outcome of ['success','auth']){
    const h=fixture();h.favorite('profile-only');await fallback(h,{rows:[row('A'),row('B')]});h.c.openDetail(0);let work,index;
    if(stage==='location'){work=h.c.loadMap();index=h.calls.length-1;}else({work,index}=await afterLocation(h));const count=h.calls.length;assert.equal(await h.c.loadMap(),false);
    if(change==='detail')h.c.openDetail(1);if(change==='office'){const next=h.c.start();h.calls.at(-1).resolve([offices[1]]);await Promise.resolve();h.calls.at(-1).resolve({data:[]});await next;}if(change==='dispose')h.c.dispose();if(change==='inactive')h.inactive();if(change==='favorite')h.favorite('another-profile');
    const before=h.c.snapshot(),changes=h.changes.length;
    if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('Retired map error'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve(stage==='location'?{error:false,data:{persilId:'stale'}}:geometry());assert.equal(await work,false);assert.deepEqual(h.auth,[]);
    if(change==='favorite'){assert.equal(h.c.snapshot().pending.map,false);assert.equal(h.c.snapshot().detail.map.stage,'idle');}else{assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,changes);}
    assert.equal(h.calls.length,count+(change==='office'?2:0));
  }
});

test('session switch during office/favorite-feed read cannot publish rows or trigger another session logout',async()=>{
  for(const stage of ['offices','feed'])for(const end of ['inactive','dispose'])for(const outcome of ['success','auth']){
    const h=fixture();h.favorite('profile-only');const work=h.c.start();let index=0;if(stage==='feed'){h.calls[0].resolve([]);await Promise.resolve();index=1;}
    if(end==='dispose')h.c.dispose();else h.inactive();const before=h.c.snapshot(),changes=h.changes.length;
    if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('Retired session'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve(stage==='offices'?offices:{data:[row('stale')]});assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,changes);assert.deepEqual(h.auth,[]);assert.equal(h.calls.length,index+1);
  }
});

test('current feed/map auth errors notify once while anonymous map completion releases its lock',async()=>{
  const h=fixture();h.favorite('profile-only');await fallback(h);const feed=h.c.refresh();h.calls.at(-1).reject(Object.assign(new Error('Synthetic current expiry'),{code:'SESSION_EXPIRED'}));assert.equal(await feed,false);assert.deepEqual(h.auth,['SESSION_EXPIRED']);
  for(const stage of ['location','boundary']){
    const f=fixture();await loaded(f);f.c.openDetail(0);let work,index;if(stage==='location'){work=f.c.loadMap();index=f.calls.length-1;}else({work,index}=await afterLocation(f));f.anonymous();f.calls[index].resolve(stage==='location'?{error:false,data:{persilId:'retired'}}:geometry());assert.equal(await work,false);assert.deepEqual(f.auth,[]);assert.equal(f.c.snapshot().pending.map,false);assert.equal(f.c.snapshot().detail.map.stage,'idle');f.authenticate();const retry=f.c.loadMap();f.calls.at(-1).reject(Object.assign(new Error('Current map expiry'),{code:'SESSION_EXPIRED'}));await retry;assert.deepEqual(f.auth,['SESSION_EXPIRED']);
  }
});

test('snapshots and source objects do not expose mutable canonical rows, offices, detail or boundary',async()=>{
  const h=fixture(),raw=row(),sourceOffices=structuredClone(offices);await loaded(h,[raw],sourceOffices);raw.pemohon='changed outside';sourceOffices[0].KantorId='changed outside';const first=h.c.snapshot();first.offices.length=0;first.rows[0].pemohon='snapshot changed';first.officeId='snapshot changed';assert.equal(h.c.snapshot().officeId,' office-A ');assert.equal(h.c.snapshot().rows[0].pemohon,'Synthetic Owner');h.c.openDetail(0);const {work,index}=await afterLocation(h),shape=geometry();h.calls[index].resolve(shape);await work;shape.features.length=0;const final=h.c.snapshot();final.detail.map.geometry.features.length=0;assert.equal(h.c.snapshot().detail.map.geometry.features.length,1);
});

test('synchronous owner retirement during rendering stops transport before offices, feed or map starts',async()=>{
  for(const phase of ['offices','feed','map']){
    let retire=false,h;h=fixture({changed:model=>{if(retire&&model.pending[phase])h.c.dispose();}});
    if(phase==='offices'){retire=true;assert.equal(await h.c.start(),false);assert.equal(h.calls.length,0);}
    else if(phase==='feed'){const work=h.c.start();retire=true;h.calls[0].resolve(offices);assert.equal(await work,false);assert.equal(h.calls.length,1);}
    else{await loaded(h);h.c.openDetail(0);const count=h.calls.length;retire=true;assert.equal(await h.c.loadMap(),false);assert.equal(h.calls.length,count);}
    assert.equal(h.c.snapshot().stage,'disposed');assert.deepEqual(h.auth,[]);
  }
});
