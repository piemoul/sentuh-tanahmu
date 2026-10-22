import test from 'node:test';
import assert from 'node:assert/strict';
import {createLostReviewComposer} from '../assets/lost-review/compose-controller.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function fixture(patch={}){
 const calls=[],sessions=[],revoked=[];let current=true,authenticated=true,accepted=0;
 const c=createLostReviewComposer({contentId:' original-yuridis-persil ',reviewType:'sertipikatSaya',write:payload=>{const wait=deferred();calls.push({payload,...wait});return wait.promise;},isCurrent:()=>current,isAuthenticated:()=>authenticated,onAccepted:()=>accepted++,onSessionError:error=>sessions.push(error.code),createObjectURL:()=>'blob:synthetic-yuridis',revokeObjectURL:url=>revoked.push(url),...patch});
 return{c,calls,sessions,revoked,accepted:()=>accepted,retire:()=>current=false,expire:()=>authenticated=false};
}
const ready=h=>{assert.equal(h.c.setRating(4),true);assert.equal(h.c.setComment(' raw Yuridis \n comment '),true);};

test('explicit sertipikatSaya scope preserves exact captured content, raw comment, original photo bytes and order',async()=>{
 const h=fixture();ready(h);const first=new File([Uint8Array.of(0,255,7)],'first.heic',{type:'image/heic'}),second=new File(['second'],'second.png',{type:'image/png'});h.c.addPhoto(first);h.c.addPhoto(second);const work=h.c.submit();const {values,files}=h.calls[0].payload;
 assert.deepEqual(values,{contentId:' original-yuridis-persil ',reviewType:'sertipikatSaya',comment:' raw Yuridis \n comment ',rating:4});assert.deepEqual(files.map(f=>f.key),['reviewPhoto1','reviewPhoto2']);assert.equal(files[0].file,second);assert.equal(files[1].file,first);assert.deepEqual(new Uint8Array(await files[1].file.arrayBuffer()),Uint8Array.of(0,255,7));assert.equal(values.reviewId,undefined);
 h.calls[0].resolve(true);assert.equal(await work,true);assert.equal(h.accepted(),1);assert.equal(await h.c.submit(),false);assert.equal(h.calls.length,1);
});

test('default lost scope remains unchanged and arbitrary review types cannot widen compose context',async()=>{
 const calls=[];const defaultLost=createLostReviewComposer({contentId:' original-lost-file ',isAuthenticated:()=>true,write:async payload=>{calls.push(payload);return true;}});defaultLost.setRating(1);defaultLost.setComment('');assert.equal(await defaultLost.submit(),true);assert.equal(calls[0].values.reviewType,'pengumumanSertipikatHilang');assert.equal(calls[0].values.contentId,' original-lost-file ');
 for(const reviewType of ['reviewId','SertipikatSaya','sertipikatSaya ',null,{},'pengumumanYuridis'])assert.throws(()=>createLostReviewComposer({contentId:'selected',reviewType,write:async()=>true}),/LOST_REVIEW_COMPOSER_CONTEXT/);
});

test('pending submission locks edits and duplicates; only the injected exact acceptance true completes',async()=>{
 for(const accepted of [false,null,undefined,{accepted:true},200]){
  const h=fixture();ready(h);const work=h.c.submit();assert.equal(await h.c.submit(),false);assert.equal(h.c.setComment('swapped'),false);assert.equal(h.c.setRating(1),false);assert.equal(h.calls.length,1);h.calls[0].resolve(accepted);assert.equal(await work,false);assert.equal(h.accepted(),0);assert.equal(h.c.snapshot().accepted,false);assert.match(h.c.snapshot().error,/belum terkonfirmasi/);assert.equal(h.calls.length,1);
 }
});

test('retired route/session cannot accept old post success or report old auth errors',async()=>{
 for(const change of ['retire','dispose','expire'])for(const outcome of ['success','auth']){
  const h=fixture();ready(h);h.c.addPhoto(new File(['bytes'],'selected.png'));const work=h.c.submit();if(change==='retire')h.retire();if(change==='dispose')h.c.dispose();if(change==='expire')h.expire();
  if(outcome==='auth')h.calls[0].reject(Object.assign(new Error('Retired expiry'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve(true);assert.equal(await work,false);assert.equal(h.accepted(),0);assert.deepEqual(h.sessions,[]);h.c.dispose();assert.deepEqual(h.revoked,['blob:synthetic-yuridis']);
 }
});

test('synchronous pending-render owner/auth retirement cannot cross the write boundary',async()=>{
 for(const change of ['owner','auth']){
  let h;h=fixture({changed:model=>{if(model.pending){if(change==='owner')h.retire();else h.expire();}}});ready(h);assert.equal(await h.c.submit(),false);assert.equal(h.calls.length,0);assert.equal(h.accepted(),0);assert.deepEqual(h.sessions,[]);if(change==='auth'){assert.equal(h.c.snapshot().stage,'signin');assert.equal(h.c.snapshot().pending,false);assert.equal(h.c.snapshot().comment,null);}
 }
});

test('captured review context is immutable even when caller option objects and snapshots change',async()=>{
 const options={contentId:' original-selected-persil ',reviewType:'sertipikatSaya'},h=fixture(options);ready(h);options.contentId='injected-after-construction';options.reviewType='pengumumanSertipikatHilang';const snapshot=h.c.snapshot();snapshot.rating=1;snapshot.comment='injected';const work=h.c.submit();assert.equal(h.calls[0].payload.values.contentId,' original-selected-persil ');assert.equal(h.calls[0].payload.values.reviewType,'sertipikatSaya');assert.equal(h.calls[0].payload.values.rating,4);h.calls[0].resolve(true);await work;
});

test('accepted Yuridis write remains accepted if close/refresh callback throws and cannot be resent',async()=>{
 const h=fixture({onAccepted:()=>{throw new Error('Synthetic refresh failure');}});ready(h);const work=h.c.submit();h.calls[0].resolve(true);assert.equal(await work,true);assert.equal(h.c.snapshot().accepted,true);assert.equal(h.c.snapshot().error,'');assert.equal(await h.c.submit(),false);assert.equal(h.calls.length,1);
});
