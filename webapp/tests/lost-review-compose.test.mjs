import test from 'node:test';
import assert from 'node:assert/strict';
import {createLostReviewComposer} from '../assets/lost-review/compose-controller.js';
import {lostReviewComposeView} from '../assets/lost-review/compose-view.js';
import {lostReviewsView} from '../assets/lost-review/view.js';
import {createLostReview} from '../assets/lost-review/controller.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(patch={}){
  const calls=[],revoked=[],changes=[],errors=[];let current=true,auth=true,accepted=0,urls=0;
  const c=createLostReviewComposer({contentId:' selected record ',write:payload=>{const work=deferred();calls.push({payload,...work});return work.promise;},isCurrent:()=>current,isAuthenticated:()=>auth,changed:model=>changes.push(model),onAccepted:()=>accepted++,onSessionError:error=>errors.push(error.code),createObjectURL:()=>`blob:synthetic-${++urls}`,revokeObjectURL:url=>revoked.push(url),...patch});
  return {c,calls,revoked,changes,errors,accepted:()=>accepted,stale:()=>current=false,expire:()=>auth=false};
}
const ready=h=>{h.c.setRating(3);h.c.setComment(' raw \n text ');};
test('native gate distinguishes untouched null, edited empty, raw whitespace and one of five stars',async()=>{
  const h=fixture();assert.equal(h.c.snapshot().comment,null);assert.equal(await h.c.submit(),false);
  h.c.setRating(5);assert.equal(h.c.snapshot().canSubmit,false);assert.equal(await h.c.submit(),false);
  h.c.setComment('');assert.equal(h.c.snapshot().canSubmit,true);
  for(const value of [0,6,-1,2.5,'2',null])assert.equal(h.c.setRating(value),false);
  assert.equal(h.c.setComment(null),false);assert.equal(h.c.setRating(5),true);assert.equal(h.c.snapshot().rating,5);
  const work=h.c.submit();assert.deepEqual(h.calls[0].payload,{values:{contentId:' selected record ',reviewType:'pengumumanSertipikatHilang',comment:'',rating:5},files:[]});
  h.calls[0].resolve(true);assert.equal(await work,true);assert.equal(h.accepted(),1);assert.equal(h.c.snapshot().accepted,true);assert.equal(await h.c.submit(),false);
});
test('single-gallery additions preserve original byte identity, newest-first order and contiguous upload keys',async()=>{
  const h=fixture();ready(h);const a=new File([Uint8Array.of(0,255,3)],'original.heic',{type:'image/heic'}),b=new File([],'empty.png'),c=new File(['last'],'new.jpg');
  h.c.addPhoto(a);h.c.addPhoto(b);h.c.addPhoto(c);
  const snapshot=h.c.snapshot();assert.deepEqual(snapshot.photos.map(p=>p.name),['new.jpg','empty.png','original.heic']);assert.equal(snapshot.photos[0].file,undefined);
  snapshot.photos[0].name='outside';snapshot.photos.pop();assert.equal(h.c.snapshot().photos.length,3);
  assert.equal(h.c.removePhoto(2),true);assert.equal(h.c.removePhoto(2),false);assert.deepEqual(h.revoked,['blob:synthetic-2']);
  const work=h.c.submit();assert.deepEqual(h.calls[0].payload.files.map(p=>p.key),['reviewPhoto1','reviewPhoto2']);assert.equal(h.calls[0].payload.files[0].file,c);assert.equal(h.calls[0].payload.files[1].file,a);assert.deepEqual(new Uint8Array(await h.calls[0].payload.files[1].file.arrayBuffer()),Uint8Array.of(0,255,3));
  h.calls[0].resolve(true);assert.equal(await work,true);assert.deepEqual(h.revoked,['blob:synthetic-2','blob:synthetic-3','blob:synthetic-1']);
});
test('no native count cap, conversion or MIME allowlist is invented; preview failure does not replace original file',()=>{
  const h=fixture({createObjectURL:()=>{throw Error('Preview unavailable');}});ready(h);
  for(let i=0;i<12;i++)assert.equal(h.c.addPhoto(new File(['bytes'],`photo-${i}.heic`,{type:'image/heic'})),true);
  assert.equal(h.c.snapshot().photos.length,12);assert.equal(h.c.snapshot().photos[0].url,null);assert.equal(h.c.addPhoto(null),false);assert.equal(h.c.addPhoto(new Blob()),false);
  h.c.dispose();assert.deepEqual(h.c.snapshot().photos,[]);
});
test('browser header-name guard rejects original control/backslash names before FormData can escape them',()=>{
  const h=fixture();ready(h);
  for(const name of ['line\nphoto.png','line\rphoto.png','nul\0photo.png','path\\photo.png']){assert.equal(h.c.addPhoto(new File(['x'],name)),false);assert.match(h.c.snapshot().error,/Nama foto/);}
  assert.equal(h.c.snapshot().photos.length,0);assert.equal(h.c.addPhoto(new File(['x'],' quoted " photo.png ')),true);assert.equal(h.c.snapshot().photos[0].name,' quoted " photo.png ');
});
test('pending lock is synchronous, keeps inputs immutable and never retries automatically',async()=>{
  const h=fixture();ready(h);h.c.addPhoto(new File(['x'],'a.jpg'));const work=h.c.submit();
  assert.equal(h.c.snapshot().pending,true);assert.equal(await h.c.submit(),false);assert.equal(h.c.setRating(1),false);assert.equal(h.c.setComment('changed'),false);assert.equal(h.c.addPhoto(new File(['y'],'b.jpg')),false);assert.equal(h.c.removePhoto(1),false);assert.equal(h.calls.length,1);
  h.calls[0].reject(Object.assign(new Error('Timeout'),{code:'UPSTREAM_TIMEOUT'}));assert.equal(await work,false);assert.equal(h.calls.length,1);assert.equal(h.c.snapshot().comment,' raw \n text ');assert.equal(h.c.snapshot().photos.length,1);assert.match(h.c.snapshot().error,/belum terkonfirmasi.*Periksa daftar/);assert.equal(h.c.snapshot().canSubmit,true);
  const retry=h.c.submit();assert.equal(h.calls.length,2);h.calls[1].resolve(true);assert.equal(await retry,true);
});
test('accepted mutation stays accepted when refresh callback throws and cannot be sent twice',async()=>{
  const h=fixture({onAccepted:()=>{throw Error('Refresh failed');}});ready(h);const work=h.c.submit();h.calls[0].resolve(true);assert.equal(await work,true);assert.equal(h.c.snapshot().accepted,true);assert.equal(h.c.snapshot().error,'');assert.equal(await h.c.submit(),false);assert.equal(h.calls.length,1);
});
test('cancel/dispose and stale-owner success or 401 cannot touch the next detail',async()=>{
  for(const action of ['dispose','stale'])for(const outcome of ['success','auth']){
    const h=fixture();ready(h);h.c.addPhoto(new File(['x'],'a.png'));const work=h.c.submit(),before=h.changes.length;
    if(action==='dispose'){h.c.dispose();h.c.dispose();assert.deepEqual(h.revoked,['blob:synthetic-1']);}else h.stale();
    if(outcome==='success')h.calls[0].resolve(true);else h.calls[0].reject(Object.assign(new Error('Expired'),{code:'SESSION_EXPIRED'}));
    assert.equal(await work,false);assert.equal(h.accepted(),0);assert.deepEqual(h.errors,[]);assert.equal(h.changes.length,before);h.c.dispose();assert.deepEqual(h.revoked,['blob:synthetic-1']);
  }
});
test('auth drop hides pending media and current auth errors propagate once',async()=>{
  const h=fixture();ready(h);h.c.addPhoto(new File(['x'],'a.png'));const work=h.c.submit();h.expire();h.calls[0].resolve(true);assert.equal(await work,false);assert.equal(h.c.snapshot().stage,'signin');assert.equal(h.c.snapshot().comment,null);assert.deepEqual(h.c.snapshot().photos,[]);assert.equal(h.accepted(),0);
  const j=fixture();ready(j);const other=j.c.submit();j.calls[0].reject(Object.assign(new Error('Expired'),{code:'SESSION_EXPIRED'}));await other;assert.deepEqual(j.errors,['SESSION_EXPIRED']);
});
test('only exact true from the native-status adapter is accepted; false/null/envelopes remain unconfirmed',async()=>{
  for(const value of [false,null,undefined,{}, {accepted:true},200]){const h=fixture();ready(h);const work=h.c.submit();h.calls[0].resolve(value);assert.equal(await work,false);assert.equal(h.accepted(),0);assert.equal(h.c.snapshot().accepted,false);}
});
test('compose view escapes raw comment/filenames, gallery is single image picker and pending form disappears',()=>{
  const h=fixture();ready(h);h.c.setComment('</textarea><script>never()</script>');h.c.addPhoto(new File(['x'],'<img onerror=x>.png'));
  const html=lostReviewComposeView(h.c.snapshot());assert.match(html,/Berikan ulasan/);assert.match(html,/placeholder="Kritik dan saran"/);assert.match(html,/&lt;\/textarea&gt;&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<img onerror| multiple| capture|latitude|longitude|GPS/);assert.match(html,/type="file" accept="image\/\*"/);assert.equal((html.match(/data-review-rate=/g)||[]).length,5);assert.doesNotMatch(html,/reviewPhoto/);
  const pending=lostReviewComposeView({...h.c.snapshot(),pending:true});assert.doesNotMatch(pending,/<form|textarea|type="file"|data-review-submit/);assert.match(pending,/data-review-close aria-label="Tutup ulasan" disabled/);assert.match(pending,/Tunggu hasil pengiriman/);
});
test('write entry is explicit, authenticated and separately gated from review reads',()=>{
  const model={stage:'empty',rows:[],pending:false};
  assert.match(lostReviewsView(model,{authenticated:true,canCompose:true}),/data-action="lost-review-compose" >Beri Ulasan/);
  for(const opts of [{},{authenticated:false,canCompose:true},{authenticated:true,canCompose:false}])assert.match(lostReviewsView(model,opts),/data-action="lost-review-compose" disabled>Beri Ulasan/);
});
test('accepted-write reread replaces an earlier pending read without letting its stale result overwrite',async()=>{
  const calls=[];const c=createLostReview({read:()=>{const work=deferred();calls.push(work);return work.promise;},isAuthenticated:()=>true});
  const initial=c.start('selected'),fresh=c.reload();assert.equal(calls.length,2);
  calls[1].resolve({error:false,data:[]});assert.equal(await fresh,true);assert.equal(c.snapshot().stage,'empty');
  calls[0].resolve({error:false,data:[{comment:'stale',rating:1,reviewPhotos:[]}]});assert.equal(await initial,false);assert.deepEqual(c.snapshot().rows,[]);assert.equal(c.snapshot().stage,'empty');
});
