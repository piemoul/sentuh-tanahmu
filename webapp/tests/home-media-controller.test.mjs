import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeMedia} from '../assets/home-media/controller.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const banner=(rows=[{bannerId:'synthetic-banner',path:'synthetic.png'}])=>({status:200,data:{error:false,data:rows}});
const youtube=(rows=[{videoId:'synthetic-video',title:'Synthetic'}])=>({status:200,data:{data:rows}});
function setup(){const calls=[],changes=[],auth=[];let current=true;const c=createHomeMedia({read:kind=>{const wait=deferred();calls.push({kind,...wait});return wait.promise;},onChange:state=>changes.push(state),isCurrent:()=>current,onSessionError:error=>auth.push(error)});return {c,calls,changes,auth,setCurrent(value){current=value;}};}

test('construction performs no reads, validates callbacks, and exposes no write or auth API',async()=>{
 assert.throws(()=>createHomeMedia());for(const key of ['read','onChange','isCurrent','onSessionError'])assert.throws(()=>createHomeMedia({read:()=>{},[key]:null}));
 const h=setup();assert.equal(h.calls.length,0);assert.deepEqual(Object.keys(h.c),['snapshot','load','retire','dispose']);assert.equal(await h.c.load('submit'),false);assert.equal(h.calls.length,0);
 for(const kind of ['banner','youtube'])assert.deepEqual(h.c.snapshot()[kind],{rows:[],loading:false,error:'',code:null,attempted:false,generation:0});
});
test('both sections load independently and suppress same-kind duplicate requests',async()=>{
 const h=setup(),a=h.c.load('banner'),b=h.c.load('youtube');assert.deepEqual(h.calls.map(x=>x.kind),['banner','youtube']);
 assert.equal(await h.c.load('banner',{refresh:true}),false);assert.equal(await h.c.load('youtube'),false);assert.equal(h.calls.length,2);
 h.calls[1].resolve(youtube());assert.equal(await b,true);assert.equal(h.c.snapshot().youtube.rows.length,1);assert.equal(h.c.snapshot().banner.loading,true);
 h.calls[0].resolve(banner());assert.equal(await a,true);assert.equal(h.c.snapshot().banner.loading,false);
});
test('accepted load increments generation, publishes loading then immutable typed rows',async()=>{
 const h=setup(),work=h.c.load('banner');assert.equal(h.changes.length,1);assert.equal(h.changes[0].banner.generation,1);assert.equal(h.changes[0].banner.loading,true);assert.equal(h.changes[0].banner.attempted,true);
 const input=banner();h.calls[0].resolve(input);assert.equal(await work,true);const snap=h.c.snapshot();assert.equal(snap.banner.generation,1);assert.equal(snap.banner.rows[0].bannerId,'synthetic-banner');
 snap.banner.rows[0].path='mutated';h.changes.at(-1).banner.rows[0].path='mutated';input.data.data[0].path='mutated';assert.equal(h.c.snapshot().banner.rows[0].path,'synthetic.png');
});
test('nonempty cache skips implicit load; explicit refresh clears old card generation immediately',async()=>{
 const h=setup(),first=h.c.load('banner');h.calls[0].resolve(banner());await first;assert.equal(await h.c.load('banner'),false);assert.equal(h.calls.length,1);
 const refresh=h.c.load('banner',{refresh:true});assert.equal(h.c.snapshot().banner.generation,2);assert.deepEqual(h.c.snapshot().banner.rows,[]);assert.equal(h.c.snapshot().banner.loading,true);
 h.calls[1].resolve(banner([{bannerId:'new'}]));assert.equal(await refresh,true);assert.equal(h.c.snapshot().banner.rows[0].bannerId,'new');assert.equal(h.c.snapshot().banner.generation,2);
});
test('successful empty result does not retry implicitly but explicit refresh can recover',async()=>{
 for(const kind of ['banner','youtube']){const h=setup(),first=h.c.load(kind);h.calls[0].resolve(kind==='banner'?banner([]):youtube([]));assert.equal(await first,true);assert.equal(h.c.snapshot()[kind].error,'');assert.equal(h.c.snapshot()[kind].attempted,true);assert.equal(await h.c.load(kind),false);assert.equal(h.calls.length,1);const retry=h.c.load(kind,{refresh:true});h.calls[1].resolve(kind==='banner'?banner():youtube());assert.equal(await retry,true);}
});
test('typed failures discard secondary/provider data and allow only explicit retry',async()=>{
 for(const [kind,reply,code]of [['banner',{status:200,data:{error:true,data:[{bannerId:4}]}},'HOME_MEDIA_RESPONSE_INVALID'],['youtube',{status:500,data:{data:[{videoId:'discarded'}]}},'HOME_MEDIA_HTTP_STATUS'],['youtube',youtube([{title:4}]),'HOME_MEDIA_RESPONSE_INVALID']]){
  const h=setup(),work=h.c.load(kind);h.calls[0].resolve(reply);assert.equal(await work,false);const state=h.c.snapshot()[kind];assert.deepEqual(state.rows,[]);assert.equal(state.loading,false);assert.equal(state.code,code);assert.ok(state.error);assert.equal(await h.c.load(kind),false);
  const next=h.c.load(kind,{refresh:true});h.calls[1].resolve(kind==='banner'?banner():youtube());assert.equal(await next,true);assert.equal(h.c.snapshot()[kind].error,'');assert.equal(h.c.snapshot()[kind].code,null);
 }
});
test('one section failure never erases the other successful cache',async()=>{
 const h=setup(),a=h.c.load('banner'),b=h.c.load('youtube');h.calls[0].resolve(banner());h.calls[1].reject(new Error('Synthetic transport failure'));await Promise.all([a,b]);assert.equal(h.c.snapshot().banner.rows.length,1);assert.equal(h.c.snapshot().youtube.error,'Synthetic transport failure');assert.equal(h.auth.length,0);
});
test('current auth errors call hook exactly once without controller global auth mutation',async()=>{
 for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){const h=setup(),work=h.c.load('youtube');const error=Object.assign(new Error('Synthetic session error'),{code});h.calls[0].reject(error);assert.equal(await work,false);assert.deepEqual(h.auth,[error]);assert.equal(h.c.snapshot().youtube.code,code);assert.equal(h.c.snapshot().youtube.loading,false);assert.equal(h.c.snapshot().youtube.rows.length,0);}
});
test('dispose revokes pending success and auth errors, clears both rows and advances generations',async()=>{
 for(const rejection of [false,true]){const h=setup(),work=h.c.load('banner'),other=h.c.load('youtube');h.c.dispose();const before=h.changes.length;if(rejection)h.calls[0].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve(banner());h.calls[1].resolve(youtube());assert.equal(await work,false);assert.equal(await other,false);assert.equal(h.changes.length,before);assert.deepEqual(h.auth,[]);for(const kind of ['banner','youtube']){assert.deepEqual(h.c.snapshot()[kind].rows,[]);assert.equal(h.c.snapshot()[kind].loading,false);assert.equal(h.c.snapshot()[kind].generation,2);}h.c.dispose();assert.equal(h.c.snapshot().banner.generation,2);assert.equal(await h.c.load('banner',{refresh:true}),false);}
});
test('route retirement drops old responses while a new mount may retry an empty branch',async()=>{
 for(const rejection of [false,true]){const h=setup(),work=h.c.load('youtube');h.setCurrent(false);if(rejection)h.calls[0].reject(Object.assign(new Error('expired'),{code:'AUTH_REQUIRED'}));else h.calls[0].resolve(youtube());assert.equal(await work,false);assert.equal(h.c.snapshot().youtube.attempted,false);h.setCurrent(true);const fresh=h.c.load('youtube');assert.equal(h.calls.length,2);h.calls[1].resolve(youtube([{videoId:'fresh'}]));assert.equal(await fresh,true);assert.equal(h.auth.length,0);assert.equal(h.c.snapshot().youtube.rows[0].videoId,'fresh');}
});
test('a loading notification that disposes the owner prevents even starting a read',async()=>{
 let reads=0,c;c=createHomeMedia({read:()=>{reads++;return youtube();},onChange:()=>c.dispose()});assert.equal(await c.load('youtube'),false);assert.equal(reads,0);assert.deepEqual(c.snapshot().youtube.rows,[]);
});
test('refresh error never restores previously selected rows and retires stale generations',async()=>{
 const h=setup(),first=h.c.load('youtube');h.calls[0].resolve(youtube());await first;const selectedGeneration=h.c.snapshot().youtube.generation;const work=h.c.load('youtube',{refresh:true});assert.notEqual(h.c.snapshot().youtube.generation,selectedGeneration);h.calls[1].reject(new Error());assert.equal(await work,false);const s=h.c.snapshot().youtube;assert.deepEqual(s.rows,[]);assert.equal(s.code,'HOME_MEDIA_READ_FAILED');assert.ok(s.error);assert.equal(s.loading,false);assert.equal(await h.c.load('youtube'),false);
});
test('retire preserves nonempty cache across remount while stale auth/success cannot affect it',async()=>{
 for(const rejection of [false,true]){const h=setup(),bannerWork=h.c.load('banner'),oldYoutube=h.c.load('youtube');h.calls[0].resolve(banner());await bannerWork;const oldGeneration=h.c.snapshot().banner.generation;h.c.retire();h.setCurrent(false);assert.equal(h.c.snapshot().banner.rows.length,1);assert.equal(h.c.snapshot().banner.generation,oldGeneration+1);assert.equal(h.c.snapshot().youtube.loading,false);assert.equal(h.c.snapshot().youtube.attempted,false);h.c.retire();assert.equal(h.c.snapshot().banner.generation,oldGeneration+1);
  if(rejection)h.calls[1].reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}));else h.calls[1].resolve(youtube([{videoId:'stale'}]));assert.equal(await oldYoutube,false);assert.equal(h.c.snapshot().banner.rows.length,1);assert.equal(h.auth.length,0);h.setCurrent(true);assert.equal(await h.c.load('banner'),false);assert.equal(h.calls.length,2);const fresh=h.c.load('youtube');h.calls[2].resolve(youtube([{videoId:'fresh'}]));assert.equal(await fresh,true);assert.equal(h.c.snapshot().youtube.rows[0].videoId,'fresh');
 }
});
test('pending identity rejects old result after retirement and immediate new request',async()=>{
 const h=setup(),old=h.c.load('youtube');h.c.retire();const fresh=h.c.load('youtube');const generation=h.c.snapshot().youtube.generation;h.calls[0].resolve(youtube([{videoId:'old'}]));assert.equal(await old,false);assert.equal(h.c.snapshot().youtube.loading,true);assert.equal(h.c.snapshot().youtube.generation,generation);h.calls[1].resolve(youtube([{videoId:'new'}]));assert.equal(await fresh,true);assert.equal(h.c.snapshot().youtube.rows[0].videoId,'new');
});
test('typed banner service error is a normal empty result after parsing all records',async()=>{
 const h=setup(),work=h.c.load('banner');h.calls[0].resolve({status:503,data:{error:true,data:[{bannerId:'discarded',path:'not-rendered'}]}});assert.equal(await work,true);assert.deepEqual(h.c.snapshot().banner.rows,[]);assert.equal(h.c.snapshot().banner.error,'');assert.equal(h.c.snapshot().banner.code,null);assert.equal(await h.c.load('banner'),false);
});
test('cache-only remount re-arms retirement so every unmount revokes old card generations',async()=>{
 const h=setup(),a=h.c.load('banner'),b=h.c.load('youtube');h.calls[0].resolve(banner());h.calls[1].resolve(youtube());await Promise.all([a,b]);h.c.retire();const first=h.c.snapshot();assert.equal(await h.c.load('banner'),false);assert.equal(await h.c.load('youtube'),false);assert.equal(h.calls.length,2);h.c.retire();for(const kind of ['banner','youtube']){assert.equal(h.c.snapshot()[kind].generation,first[kind].generation+1);assert.equal(h.c.snapshot()[kind].rows.length,1);}const after=h.c.snapshot();h.c.retire();assert.deepEqual(h.c.snapshot(),after);
});
