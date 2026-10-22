import test from 'node:test';
import assert from 'node:assert/strict';
import {RATING_PPAT_COPY,ratingPPATWriteValues,ratingPPATResult} from '../assets/rating-ppat/model.js';
import {createRatingPPAT} from '../assets/rating-ppat/controller.js';
import {ratingPPATView} from '../assets/rating-ppat/view.js';
const entry={aktaId:' RAW AKTA ',namaPPAT:'<PPAT>'};
const answer=id=>({pertanyaanRatingPPATId:id,pertanyaan:'Question',jawaban:'Answer'});
const group=(id,ids=['answer'])=>({pertanyaanRatingPPATId:id,indikator:'Group',jawabanRatingPPAT:ids===null?null:ids.map(answer)});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function setup({groups=[group('g')],read=async()=>({data:groups}),write=async()=>({success:true,message:'received'}),onResult=()=>{}}={}){
 let current=true,available=true;const reads=[],writes=[],results=[],sessions=[],changes=[];
 const c=createRatingPPAT({entry,read:(...args)=>{reads.push(args);return read(...args);},write:values=>{writes.push(structuredClone(values));return write(values);},writeAvailable:()=>available,isCurrent:()=>current,changed:value=>changes.push(value),onSessionError:error=>sessions.push(error),onResult:value=>{results.push(value);onResult(value);}});
 return {c,reads,writes,results,sessions,changes,retire:()=>current=false,setAvailable:value=>available=value};
}
async function ready(h){await h.c.start();h.c.choose(0,0);return h;}

test('write values preserve original entry and Map insertion order without extra keys or normalization',()=>{
 const selected=new Map([['10',' second '],['2','first']]);selected.set('10','');
 assert.deepEqual(ratingPPATWriteValues({...entry,alias:'ignored'},selected),{aktaId:' RAW AKTA ',PertanyaanRatingPPATId:['','first']});
 for(const value of [null,{},new Map([[1,'x']]),new Map([['g',null]])])assert.throws(()=>ratingPPATWriteValues(entry,value));
 assert.deepEqual(ratingPPATResult({success:false,message:'',other:'ignored'}),{success:false,message:''});
 for(const value of [null,[],[false,'x'],{success:'false',message:'x'},{success:false,message:null}])assert.throws(()=>ratingPPATResult(value));
});
test('read-only construction retains the original absence of a submit API',()=>{
 const c=createRatingPPAT({entry,read:async()=>({data:[]})});assert.equal(c.submit,undefined);assert.equal(c.snapshot().writeCapable,false);
});
test('actual choices serialize in first-choice order and replacement keeps its position',async()=>{
 const h=setup({groups:[group('2',['a','replacement']),group('10',['b']),group('1',[null])]});await h.c.start();
 h.c.choose(1,0);h.c.choose(0,0);h.c.choose(2,0);h.c.choose(0,1);assert.equal(await h.c.submit(),true);
 assert.deepEqual(h.writes,[{aktaId:entry.aktaId,PertanyaanRatingPPATId:['b','replacement','']}]);assert.deepEqual(h.reads,[[]]);
});
test('only loaded ready or empty questions can submit; empty native count passes with an empty list',async()=>{
 const h=setup({groups:[]});assert.equal(await h.c.submit(),false);await h.c.start();assert.equal(h.c.snapshot().stage,'empty');assert.equal(await h.c.submit(),true);
 assert.deepEqual(h.writes,[{aktaId:entry.aktaId,PertanyaanRatingPPATId:[]}]);assert.equal(h.results.length,1);
});
test('incomplete explicit submit reports exact native text without sending',async()=>{
 const h=setup({groups:[group('g0'),group('g1')]});await h.c.start();h.c.choose(0,0);assert.equal(await h.c.submit(),false);
 assert.equal(h.c.snapshot().writeError,'Jawab seluruh pertanyaan sebelum mengirim.');assert.equal(h.writes.length,0);
 h.c.choose(1,0);assert.equal(h.c.snapshot().writeError,'');assert.equal(await h.c.submit(),true);
});
test('duplicate/null group IDs and empty answers retain the native count-only incompleteness',async()=>{
 for(const groups of [[group('same'),group('same')],[group(null)],[group('empty',[])],[group('empty',null)]]){
  const h=setup({groups});await h.c.start();groups.forEach((_,i)=>h.c.choose(i,0));assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);assert.equal(h.c.snapshot().writeError,RATING_PPAT_COPY.incomplete);
 }
});
test('snapshot edits, forged values and out-of-range choices cannot enter the submitted payload',async()=>{
 const h=setup();await h.c.start();const snapshot=h.c.snapshot();snapshot.entry.aktaId='forged';snapshot.groups[0].jawabanRatingPPAT[0].pertanyaanRatingPPATId='forged';snapshot.selection.set('g','forged');h.changes.at(-1).selection.set('g','forged');
 assert.equal(h.c.choose(0,1),false);assert.equal(h.c.choose('0',0),false);assert.equal(await h.c.submit(),false);h.c.choose(0,0);await h.c.submit();assert.deepEqual(h.writes,[{aktaId:entry.aktaId,PertanyaanRatingPPATId:['answer']}]);
});
test('a pending write locks repeat submit, choice and read reload independently of read pending',async()=>{
 const wait=deferred(),h=await ready(setup({write:()=>wait.promise})),work=h.c.submit();const before=h.c.snapshot();
 assert.equal(before.writePending,true);assert.equal(before.pending,false);assert.equal(await h.c.submit(),false);assert.equal(await h.c.retry(),false);assert.equal(h.c.choose(0,0),false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.reads.length,1);assert.equal(h.writes.length,1);
 wait.resolve({success:false,message:''});assert.equal(await work,true);assert.equal(h.c.snapshot().writePending,false);assert.deepEqual(h.results,[{success:false,message:''}]);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,1);
});
test('write availability is checked independently and pending questionnaire reads cannot post',async()=>{
 const wait=deferred(),h=setup({read:()=>wait.promise}),work=h.c.start();assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);wait.resolve({data:[group('g')]});await work;h.c.choose(0,0);h.setAvailable(false);assert.equal(await h.c.submit(),false);h.setAvailable(true);assert.equal(await h.c.submit(),true);
});
test('both tuple booleans and empty/whitespace/literal messages are forwarded without persistence claims',async()=>{
 for(const result of [{success:true,message:''},{success:false,message:'   '},{success:false,message:'<img src=x onerror=bad()>'},{success:true,message:'Gagal Mengirimkan Rating PPAT'}]){
  const h=await ready(setup({write:async()=>result}));assert.equal(await h.c.submit(),true);assert.deepEqual(h.results,[result]);assert.equal(h.c.snapshot().resultDelivered,true);assert.equal(h.reads.length,1);
 }
});
test('ordinary transport/decoding failures use the exact native false tuple once without automatic retry',async()=>{
 for(const write of [async()=>{throw new Error('timeout');},()=>{throw new Error('sync transport');},async()=>({success:'true',message:'wrong'}),async()=>{throw Object.assign(new Error('401 text only'),{code:'HTTP_401'});}]){
  const h=await ready(setup({write}));assert.equal(await h.c.submit(),true);assert.deepEqual(h.results,[{success:false,message:'Terjadi kesalahan saat Mengirimkan Rating PPAT'}]);assert.equal(h.sessions.length,0);assert.equal(h.writes.length,1);assert.equal(await h.c.submit(),false);
 }
});
test('only the three real auth codes call the session handler and never emit a result tuple',async()=>{
 for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){const error=Object.assign(new Error('login'),{code}),h=await ready(setup({write:async()=>{throw error;}}));assert.equal(await h.c.submit(),false);assert.deepEqual(h.sessions,[error]);assert.deepEqual(h.results,[]);assert.equal(h.c.snapshot().writePending,false);assert.equal(h.writes.length,1);}
});
test('SESSION_CHANGED preserves the session and blocks repost until an explicit successful reload',async()=>{
 let attempt=0;const h=await ready(setup({write:async()=>{if(++attempt===1)throw Object.assign(new Error('<changed>'),{code:'SESSION_CHANGED'});return {success:false,message:'next'};}}));
 assert.equal(await h.c.submit(),false);assert.equal(h.c.snapshot().writeRequiresReload,true);assert.equal(h.c.snapshot().writeError,'<changed>');assert.equal(await h.c.submit(),false);assert.deepEqual(h.sessions,[]);assert.deepEqual(h.results,[]);assert.equal(h.reads.length,1);
 await h.c.retry();assert.equal(h.c.snapshot().selection.size,0);assert.equal(h.c.snapshot().writeRequiresReload,false);h.c.choose(0,0);await h.c.submit();assert.equal(h.writes.length,2);assert.deepEqual(h.results,[{success:false,message:'next'}]);
});
test('source/session retirement drops stale success, auth failure and ownership failure without callbacks',async()=>{
 for(const result of [{success:true,message:'old'},Object.assign(new Error('old auth'),{code:'SESSION_EXPIRED'}),Object.assign(new Error('old owner'),{code:'SESSION_CHANGED'})]){
  const wait=deferred(),h=await ready(setup({write:()=>wait.promise})),work=h.c.submit(),before=h.c.snapshot(),count=h.changes.length;h.retire();if(result instanceof Error)wait.reject(result);else wait.resolve(result);assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,count);assert.deepEqual(h.results,[]);assert.deepEqual(h.sessions,[]);h.c.dispose();
 }
});
test('dispose clears private values while a late write cannot restore them or navigate',async()=>{
 const wait=deferred(),h=await ready(setup({write:()=>wait.promise})),work=h.c.submit();h.c.dispose();h.c.dispose();wait.resolve({success:true,message:'late'});assert.equal(await work,false);const s=h.c.snapshot();assert.deepEqual(s.entry,{aktaId:'',namaPPAT:''});assert.deepEqual(s.groups,[]);assert.equal(s.selection.size,0);assert.equal(s.writePending,false);assert.equal(s.writeError,'');assert.equal(s.stage,'disposed');assert.deepEqual(h.results,[]);assert.equal(await h.c.submit(),false);
});
test('a throwing result callback does not turn a completed tuple into another write or fallback',async()=>{
 const h=await ready(setup({onResult:()=>{throw new Error('render failure');}}));assert.equal(await h.c.submit(),true);assert.equal(await h.c.submit(),false);assert.deepEqual(h.results,[{success:true,message:'received'}]);assert.equal(h.writes.length,1);
});
test('write view allows explicit count validation, separates busy states and escapes inline ownership errors',async()=>{
 const wait=deferred(),h=setup({write:()=>wait.promise});await h.c.start();let html=ratingPPATView(h.c.snapshot(),{writeAvailable:true});assert.match(html,/data-action="rating-ppat-submit"  aria/);assert.doesNotMatch(html,/belum ada penilaian yang dikirim/);
 h.c.choose(0,0);const work=h.c.submit();html=ratingPPATView(h.c.snapshot(),{writeAvailable:true});assert.match(html,/data-rating-ppat-write-pending/);assert.doesNotMatch(html,/data-action="rating-ppat-submit"|Memuat pertanyaan/);assert.match(html,/data-action="rating-ppat-back" disabled/);assert.match(html,/data-action="rating-ppat-retry" disabled/);assert.match(html,/data-rating-ppat-answer="0" checked disabled/);
 wait.reject(Object.assign(new Error('<img src=x onerror=bad()>'),{code:'SESSION_CHANGED'}));await work;html=ratingPPATView(h.c.snapshot(),{writeAvailable:true});assert.match(html,/&lt;img src=x onerror=bad\(\)&gt;/);assert.doesNotMatch(html,/<img/);assert.match(html,/data-action="rating-ppat-submit" disabled/);
});
