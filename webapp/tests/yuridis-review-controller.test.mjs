import test from 'node:test';
import assert from 'node:assert/strict';
import {createYuridisReview} from '../assets/yuridis/review-controller.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const row=comment=>({reviewId:'not-content-id',rating:4,comment,createdAt:'not-rendered-as-footer',reviewPhotos:[]});
function fixture(patch={}){
 const calls=[],changes=[],sessions=[];let current=true,authenticated=true;
 const c=createYuridisReview({read:values=>{const work=deferred();calls.push({values,...work});return work.promise;},changed:model=>changes.push(model),onSessionError:error=>sessions.push(error.code),isCurrent:()=>current,isAuthenticated:()=>authenticated,...patch});
 return{c,calls,changes,sessions,retire:()=>current=false,expire:()=>authenticated=false};
}

test('last-user read pins original persilId and sertipikatSaya without lost scope or pagination',async()=>{
 const h=fixture(),id=' raw +& persil / ',work=h.c.start(id);
 assert.deepEqual(h.calls[0].values,{reviewType:'sertipikatSaya',contentId:id});assert.equal(h.calls[0].values.pageNumber,undefined);assert.equal(h.calls[0].values.pageSize,undefined);
 h.calls[0].resolve({error:true,data:[row('Original comment')]});assert.equal(await work,true);assert.equal(h.c.snapshot().stage,'ready');assert.equal(h.c.snapshot().contentId,id);assert.equal(h.c.snapshot().rows[0].comment,'Original comment');
 const refresh=h.c.refresh();assert.deepEqual(h.calls[1].values,h.calls[0].values);h.calls[1].resolve({data:[]});assert.equal(await refresh,true);assert.equal(h.c.snapshot().stage,'empty');
});

test('anonymous/missing content and duplicate pending reads never invent a context',async()=>{
 const missing=fixture();assert.equal(await missing.c.start(null),false);assert.equal(missing.calls.length,0);assert.equal(missing.c.snapshot().stage,'error');
 const anonymous=fixture();anonymous.expire();assert.equal(await anonymous.c.start('known-persil'),false);assert.equal(anonymous.calls.length,0);assert.equal(anonymous.c.snapshot().stage,'signin');
 const h=fixture(),work=h.c.start('selected');assert.equal(await h.c.start('unrelated'),false);assert.equal(await h.c.refresh(),false);assert.equal(h.calls.length,1);h.calls[0].resolve({data:[]});await work;assert.equal(h.c.snapshot().contentId,'selected');
});

test('accepted-write reload supersedes the earlier read while preserving exact last-user fields',async()=>{
 for(const outcome of ['success','auth']){
  const h=fixture(),old=h.c.start(' original-persil '),fresh=h.c.reload();assert.equal(h.calls.length,2);assert.deepEqual(h.calls[1].values,{reviewType:'sertipikatSaya',contentId:' original-persil '});h.calls[1].resolve({data:[row('Fresh')]});assert.equal(await fresh,true);
  if(outcome==='auth')h.calls[0].reject(Object.assign(new Error('Stale auth'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve({data:[row('Old')]});assert.equal(await old,false);assert.equal(h.c.snapshot().rows[0].comment,'Fresh');assert.deepEqual(h.sessions,[]);
 }
});

test('malformed normalized response remains an error, never a synthetic empty review',async()=>{
 for(const response of [{data:null},{data:{}},{data:[{rating:'3',reviewPhotos:[]}]},{data:[{rating:3,reviewPhotos:[{mediaUrl:42}]}]}]){
  const h=fixture(),work=h.c.start('selected');h.calls[0].resolve(response);assert.equal(await work,false);assert.equal(h.c.snapshot().stage,'error');assert.deepEqual(h.c.snapshot().rows,[]);assert.equal(h.c.snapshot().pending,false);
 }
});

test('session/owner retirement suppresses success and expiry; current expiry alone notifies once',async()=>{
 for(const change of ['retire','dispose','expire'])for(const outcome of ['success','auth']){
  const h=fixture(),work=h.c.start('selected');if(change==='retire')h.retire();if(change==='dispose')h.c.dispose();if(change==='expire')h.expire();const before=h.c.snapshot(),count=h.changes.length;
  if(outcome==='auth')h.calls[0].reject(Object.assign(new Error('Retired expiry'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve({data:[row('Retired')]});assert.equal(await work,false);assert.deepEqual(h.sessions,[]);
  if(change==='expire'){assert.equal(h.c.snapshot().stage,'signin');assert.equal(h.c.snapshot().pending,false);assert.deepEqual(h.c.snapshot().rows,[]);}else{assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,count);}
 }
 const current=fixture(),work=current.c.start('selected');current.calls[0].reject(Object.assign(new Error('Current expiry'),{code:'SESSION_EXPIRED'}));await work;assert.deepEqual(current.sessions,['SESSION_EXPIRED']);
});

test('synchronous render retirement/auth drop stops last-user transport before it starts',async()=>{
 for(const change of ['owner','auth']){
  let h;h=fixture({changed:model=>{if(model.pending){if(change==='owner')h.retire();else h.expire();}}});assert.equal(await h.c.start('selected'),false);assert.equal(h.calls.length,0);assert.deepEqual(h.sessions,[]);if(change==='auth'){assert.equal(h.c.snapshot().stage,'signin');assert.equal(h.c.snapshot().pending,false);}
 }
});
