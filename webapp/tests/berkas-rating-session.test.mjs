import test from 'node:test';import assert from 'node:assert/strict';
import {BerkasRatingSession} from '../private/berkas-rating-session.mjs';
import {BERKAS_RATING_PATH as PATH,markBerkasRatingDispatched} from '../private/berkas-rating-post.mjs';
import {prepareOperation} from '../private/operations.mjs';
const LIST='post-berkas-getberkas-d15068',DETAIL='post-berkas-cariberkas-d88218';
const ready=(berkasId=' original ID ' ,patch={})=>({berkasId,readyToRating:true,nomor:42,tahun:2026,...patch});
const detail=(patch={})=>({berkasId:null,nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'SINTETIS',...patch});
const result=(data,status=200)=>({status,contentType:'application/json',data:{data}});
function fixture({request,ensureFresh,ttlMs=120000,maxContexts=64}={}){
 let time=1000;const calls=[],store=new BerkasRatingSession({clientPromise:Promise.resolve({ensureFresh:async session=>ensureFresh?.(session),request:async options=>{calls.push(options);markBerkasRatingDispatched(options.berkasRatingAttempt);return request?request(options):{status:200,contentType:'application/json',data:{error:false,message:'SINTETIS'}};}}),now:()=>time,ttlMs,maxContexts});
 const who=()=>{const controller=new AbortController();return{active:true,user:{username:'owner'},tokens:{accessToken:'synthetic'},authenticationController:controller,authenticationSignal:controller.signal};},session=who();
 const list=(rows=[ready()],kind=false,target=session)=>{const prepared=prepareOperation(LIST,{selesai:kind},{authenticated:true}),ticket=store.beginRead(prepared,target);return store.observeList(prepared,result(rows),target,ticket);};
 const begin=(sourceId,id=' original ID ',target=session)=>store.beginDetail(prepareOperation(DETAIL,{berkasId:id},{authenticated:true}),sourceId,target);
 const open=(sources=list(),id=' original ID ',target=session)=>store.observeDetail(result(detail()),target,begin(sources.berkasRatingSources[0]?.sourceId,id,target));
 return{store,calls,session,who,list,begin,open,advance:ms=>time+=ms,write:(contextId,patch={},target=session)=>store.submit({contextId,rating:3,userComment:' \u0085Comment\nraw ',...patch},target,()=>{if(!target.active)throw Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'});})};
}

test('only true readyToRating rows issue opaque source refs and original ID survives omitted detail ID',async()=>{
 const h=fixture(),read=h.list([ready(),ready('false',{readyToRating:false}),ready('null',{readyToRating:null}),ready('missing',{readyToRating:undefined}),ready('text',{readyToRating:'true'}),ready('second')]);
 assert.deepEqual(read.berkasRatingSources.map(row=>row.index),[0,5]);assert.equal(read.berkasRatingSources[0].sourceId,read.berkasRatingSources[1].sourceId);assert.match(read.berkasRatingSources[0].sourceId,/^brs_[A-Za-z0-9_-]{32}$/);
 const opened=h.open(read);assert.match(opened.berkasRatingContextId,/^brc_[A-Za-z0-9_-]{32}$/);assert.equal(h.calls.length,0);
 const sent=await h.write(opened.berkasRatingContextId);assert.deepEqual(sent.data,{error:false,message:'SINTETIS'});assert.equal(sent.delivery,'received');assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0].body,{Berkasid:' original ID ',rating:3,userComment:'Comment\nraw'});assert.equal(h.calls[0].path,PATH);assert.equal(h.calls[0].clientProfile,'berkas-rating-post');
});

test('source refs cannot cross sessions/users or select Activity/bookmark/display/false-ready IDs',()=>{
 const h=fixture(),read=h.list(),source=read.berkasRatingSources[0].sourceId;
 for(const id of ['different PRIMARY ID',' original ID :2','42/2026','unknown',' original ID'.trim()])assert.throws(()=>h.begin(source,id),{code:'BERKAS_RATING_CONTEXT_INVALID'});
 assert.throws(()=>h.begin(source,' original ID ',h.who()),{code:'BERKAS_RATING_CONTEXT_INVALID'});
 h.session.user={username:'same-label-new-owner'};assert.throws(()=>h.begin(source),{code:'BERKAS_RATING_CONTEXT_INVALID'});
 const next=fixture(),falseRead=next.list([ready('false',{readyToRating:false})]);assert.deepEqual(falseRead.berkasRatingSources,[]);
});

test('detail scope accepts only ID lookup from that snapshot, never searches or another operation',()=>{
 const h=fixture(),source=h.list().berkasRatingSources[0].sourceId;
 for(const prepared of [prepareOperation(DETAIL,{berkasId:' original ID ',nomor:'42'},{authenticated:true}),prepareOperation(DETAIL,{berkasId:' original ID ',kantorId:'office'},{authenticated:true}),prepareOperation(LIST,{selesai:false},{authenticated:true})])assert.throws(()=>h.store.beginDetail(prepared,source,h.session),{code:'BERKAS_RATING_CONTEXT_INVALID'});
 for(const sourceId of ['',null,1,'brs_'+'a'.repeat(31),'brc_'+'a'.repeat(32)])assert.throws(()=>h.begin(sourceId),{code:'BERKAS_RATING_CONTEXT_INVALID'});
});

test('unsuccessful/untyped detail and stale list responses cannot create a writer context',()=>{
 const h=fixture(),prepared=prepareOperation(LIST,{selesai:false},{authenticated:true}),old=h.store.beginRead(prepared,h.session),recent=h.store.beginRead(prepared,h.session);
 assert.equal(h.store.observeList(prepared,result([ready()]),h.session,old).berkasRatingSources,undefined);
 const read=h.store.observeList(prepared,result([ready()]),h.session,recent),ticket=h.begin(read.berkasRatingSources[0].sourceId);
 for(const response of [result(null),result([]),result({berkasId:'x'}),result(detail({statusBerkas:'1'})),result(detail({berkasId:'mismatched original ID'})),{...result(detail()),data:{error:true,data:detail()}},result(detail(),500)])assert.equal(h.store.observeDetail(response,h.session,ticket).berkasRatingContextId,undefined);
 h.list();assert.equal(h.store.observeDetail(result(detail()),h.session,ticket).berkasRatingContextId,undefined);
});

test('explicit errortrue list envelope never mints contexts even when data contains eligible-looking rows',()=>{
 const h=fixture(),prepared=prepareOperation(LIST,{selesai:false},{authenticated:true}),ticket=h.store.beginRead(prepared,h.session),response={status:200,data:{error:true,data:[ready()]}};
 assert.equal(h.store.observeList(prepared,response,h.session,ticket),response);assert.equal(response.berkasRatingSources,undefined);assert.equal(h.calls.length,0);
});

test('source and ready detail TTLs expire without transmission, with no automatic reread',async()=>{
 const h=fixture(),read=h.list(),context=h.open(read).berkasRatingContextId;h.advance(120000);
 assert.throws(()=>h.begin(read.berkasRatingSources[0].sourceId),{code:'BERKAS_RATING_CONTEXT_INVALID'});
 await assert.rejects(h.write(context),{code:'BERKAS_RATING_CONTEXT_INVALID',delivery:'not_sent'});assert.equal(h.calls.length,0);
});

test('two independent list tabs stay valid, but replacing own snapshot revokes its ready contexts only',async()=>{
 const h=fixture(),working=h.list(),done=h.list([ready(' complete ')],true),a=h.open(working).berkasRatingContextId,b=h.open(done,' complete ').berkasRatingContextId;
 h.list([ready('new')]);await assert.rejects(h.write(a),{code:'BERKAS_RATING_CONTEXT_INVALID',delivery:'not_sent'});await h.write(b);assert.equal(h.calls.length,1);assert.equal(h.calls[0].body.Berkasid,' complete ');
});

test('a normal strict errortrue permits a new explicit attempt while no automatic request is scheduled',async()=>{
 const h=fixture({request:()=>({status:201,contentType:'application/json',data:{error:true,message:''}})}),context=h.open().berkasRatingContextId;
 assert.equal((await h.write(context)).data.error,true);assert.equal(h.calls.length,1);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.calls.length,1);
 await h.write(context,{rating:5,userComment:'second explicit'});assert.equal(h.calls.length,2);assert.equal(h.calls[1].body.rating,5);
});

test('accepted and ambiguous attempts remain locked through ready TTL and fresh list/detail generations',async()=>{
 for(const ambiguous of [false,true]){
  const h=fixture({request:()=>{if(ambiguous)throw Object.assign(new Error('synthetic bodyloss'),{code:'UPSTREAM_UNREACHABLE'});return{status:200,contentType:'application/json',data:{error:false,message:'ok'}};}}),context=h.open().berkasRatingContextId;
  if(ambiguous)await assert.rejects(h.write(context),{delivery:'unknown'});else await h.write(context);
  await assert.rejects(h.write(context));h.advance(120001);const fresh=h.open(h.list()).berkasRatingContextId;await assert.rejects(h.write(fresh),{code:'BERKAS_RATING_ATTEMPT_USED',delivery:'not_sent'});assert.equal(h.calls.length,1);
 }
});

test('concurrent contexts for the same original ID share one handoff guard',async()=>{
 let resolve;const h=fixture({request:()=>new Promise(done=>resolve=done)}),read=h.list(),a=h.open(read).berkasRatingContextId,b=h.open(read).berkasRatingContextId,pending=h.write(a);
 await new Promise(done=>setImmediate(done));await assert.rejects(h.write(b),{code:'BERKAS_RATING_ATTEMPT_USED',delivery:'not_sent'});assert.equal(h.calls.length,1);resolve({status:200,data:{error:false,message:'ok'},contentType:'application/json'});await pending;
});

test('pretransport refresh failure is not_sent and permits only later explicit retry',async()=>{
 let fail=true;const h=fixture({ensureFresh:()=>{if(fail)throw Object.assign(new Error('synthetic refresh failure'),{code:'UPSTREAM_UNREACHABLE'});}}),context=h.open().berkasRatingContextId;
 await assert.rejects(h.write(context),{delivery:'not_sent'});assert.equal(h.calls.length,0);fail=false;await h.write(context);assert.equal(h.calls.length,1);
});

test('same-owner token refresh retains source identity while logout/private-owner changes retire pending results',async()=>{
 const h=fixture(),context=h.open().berkasRatingContextId;h.session.tokens={accessToken:'refreshed'};await h.write(context);assert.equal(h.calls.length,1);
 for(const change of [(h)=>h.session.authenticationController.abort(),(h)=>{h.session.user={username:'other'};},(h)=>{h.session.active=false;}]){
  let resolve;const next=fixture({request:()=>new Promise(done=>resolve=done)}),id=next.open().berkasRatingContextId,pending=next.write(id);await new Promise(done=>setImmediate(done));change(next);resolve({status:200,data:{error:false,message:'late'},contentType:'application/json'});await assert.rejects(pending,{delivery:'unknown'});assert.equal(next.calls.length,1);
 }
});

test('bounded ready contexts evict oldest without erasing accepted/unknown original-ID guards',async()=>{
 const h=fixture({maxContexts:2}),read=h.list(),first=h.open(read).berkasRatingContextId;await h.write(first);
 h.open(read);h.open(read);const last=h.open(read).berkasRatingContextId;await assert.rejects(h.write(last),{code:'BERKAS_RATING_ATTEMPT_USED'});assert.equal(h.calls.length,1);
 const other=fixture({maxContexts:2}),sources=other.list(),old=other.open(sources).berkasRatingContextId;other.open(sources);other.open(sources);await assert.rejects(other.write(old),{code:'BERKAS_RATING_CONTEXT_INVALID'});
});

test('discard and close invalidate all source/detail references without any provider operation',async()=>{
 const h=fixture(),context=h.open().berkasRatingContextId;h.store.discard(h.session);await assert.rejects(h.write(context),{code:'BERKAS_RATING_CONTEXT_INVALID'});assert.equal(h.calls.length,0);
 const next=fixture(),id=next.open().berkasRatingContextId;next.store.close();await assert.rejects(next.write(id),{code:'SESSION_EXPIRED'});assert.equal(next.calls.length,0);next.store.close();
});
