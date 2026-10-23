import test from 'node:test';import assert from 'node:assert/strict';
import {createServer}from'../server.mjs';import {SessionStore,COOKIE}from'../private/session.mjs';
const ids={collection:'get-collection-getusercollection-d31a50',detail:'post-berkas-cariberkas-d88218',read:'get-tanyajawab-gettanyajawabberkas-d2826c',post:'post-tanyajawab-submitpertanyaan-d994f4'};
const original='00000000-0000-4000-8000-000000000001';
const detail=patch=>({berkasId:original,nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'SINTETIS',parapihak:[],perjalananBerkas:[],kantor:{nama:'SINTETIS'},...patch});
const message=patch=>({berkasId:original,nik:'SYNTHETIC-NIK',content:'Pertanyaan sintetis',isTanya:'1',tanggal:'23 Oktober',waktu:'09:00',namaKantor:'Kantor sintetis',...patch});
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
async function fixture(t,{reply,collection=()=>[{id:'collection-1',type:'BERKAS',contentId:original}],primary=()=>detail()}={}){
 const sessions=new SessionStore(),calls=[];
 const server=createServer({sessions,configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=> 'AtrBpn synthetic-app'},log(){},transport:async(url,init)=>{calls.push({url,init});const result=await reply?.(url,init);if(result)return result;
  if(url.pathname==='/collection/GetUserCollection')return Response.json({error:false,data:collection()});
  if(url.pathname==='/berkas/CariBerkas')return Response.json({error:false,data:primary()});
  if(url.pathname==='/TanyaJawab/GetTanyaJawabBerkas')return Response.json({data:[message()]});
  if(url.pathname==='/TanyaJawab/SubmitPertanyaan')return Response.json({error:false});
  throw Error('Unexpected synthetic provider path');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const origin='http://127.0.0.1:'+server.address().port;
 function browser(){const session=sessions.create();session.user={username:'synthetic-owner'};session.tokens={tokenType:'Bearer',accessToken:'synthetic-access',refreshToken:null,expiredAt:null};
  const request=async(data,headers={})=>{const r=await fetch(origin+'/api/execute',{method:'POST',headers:{Cookie:COOKIE+'='+session.id,Origin:origin,'X-CSRF-Token':session.csrfToken,...(data instanceof FormData?{}:{'Content-Type':'application/json'}),...headers},body:data instanceof FormData?data:JSON.stringify(data)});return {status:r.status,body:await r.json()};};
  const execute=(kind,values={},extra={})=>request({operationId:ids[kind],values,...extra});
  const open=async(kind='collection')=>{if(kind==='collection')await execute('collection');const r=await execute('detail',kind==='collection'?{berkasId:original}:{nomor:'42',tahun:'2026',kantorId:'office-1',berkasId:null});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.result.berkasQuestionContext;};
  const write=(context,content=' Raw\n*!~é😀 ',extra={})=>execute('post',{contextId:typeof context==='string'?context:context?.contextId,content},{confirm:true,...extra});
  return {session,request,execute,open,write};
 }
 return {calls,sessions,browser,user:browser(),posts:()=>calls.filter(row=>row.url.pathname==='/TanyaJawab/SubmitPertanyaan'),reads:()=>calls.filter(row=>row.url.pathname==='/TanyaJawab/GetTanyaJawabBerkas')};
}
test('HTTP collection→original detail→question sends exact native form then awaits same-ID history',async t=>{
 const h=await fixture(t),context=await h.user.open();assert.equal(context.berkasId,original);assert.equal(context.entry,'collection');assert.match(context.contextId,/^bqc_/);
 const r=await h.user.write(context);assert.equal(r.status,200);assert.equal(r.body.result.data.success,true);assert.equal(r.body.result.delivery,'received');assert.equal(r.body.result.refresh.success,true);
 assert.equal(h.posts().length,1);assert.equal(h.reads().length,1);
 assert.equal(h.posts()[0].init.body,'berkasid='+original+'&content=+Raw%0A%2A%21~%C3%A9%F0%9F%98%80+');assert.equal(h.posts()[0].init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(h.posts()[0].init.headers.Authorization,'Bearer synthetic-access');
 assert.equal(h.reads()[0].url.search,'?berkasid='+original);assert.equal(h.reads()[0].init.body,undefined);
 assert.deepEqual(h.calls.map(row=>row.url.pathname),['/collection/GetUserCollection','/berkas/CariBerkas','/TanyaJawab/SubmitPertanyaan','/TanyaJawab/GetTanyaJawabBerkas']);
 assert.equal((await h.user.write(context)).status,200,'new explicit message is allowed after known acceptance');assert.equal(h.posts().length,2);
});
test('HTTP native search issues context; bare Berkasku and wrong collection content types do not',async t=>{
 const h=await fixture(t);assert.equal((await h.user.execute('detail',{berkasId:original})).body.result.berkasQuestionContext,undefined);
 assert.equal((await h.user.open('search')).entry,'search');
 const wrong=await fixture(t,{collection:()=>[{type:'PERSIL',contentId:original}]});assert.equal(await wrong.user.open(),undefined);
 const mismatch=await fixture(t,{primary:()=>detail({berkasId:'different'})});assert.equal(await mismatch.user.open(),undefined);
});
test('HTTP forged/raw IDs, cross-session context, files, extra values, CSRF and confirmation never post',async t=>{
 const h=await fixture(t),context=await h.user.open(),values={contextId:context.contextId,content:'x'};
 assert.equal((await h.browser().write(context)).status,409);
 for(const patch of [{berkasid:original},{content:' \u0085\n'},{content:1},{contextId:'bqc_'+'a'.repeat(32)}])assert.ok((await h.user.execute('post',{...values,...patch},{confirm:true})).status>=400);
 assert.equal((await h.user.write(context,'x',{confirm:false})).body.error.code,'CONFIRMATION_REQUIRED');
 assert.equal((await h.user.request({operationId:ids.post,values,confirm:true},{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal((await h.user.write(context,'x',{berkasid:'forged'})).status,400);
 const form=new FormData();form.append('operationId',ids.post);form.append('values',JSON.stringify(values));form.append('confirm','true');form.append('file',new File(['synthetic'],'x.txt'));assert.equal((await h.user.request(form)).status,400);
 assert.equal(h.posts().length,0);
});
test('HTTP business failure performs no history refresh and leaves a fresh explicit send possible',async t=>{
 const h=await fixture(t,{reply:url=>url.pathname.endsWith('/SubmitPertanyaan')?Response.json({error:true,message:{ignored:true}}):null}),context=await h.user.open();
 const r=await h.user.write(context);assert.equal(r.body.result.data.success,false);assert.equal(r.body.result.delivery,'received');assert.equal(r.body.result.refresh,null);assert.equal(h.reads().length,0);
 assert.equal((await h.user.write(context)).status,200);assert.equal(h.posts().length,2);
});
test('HTTP ambiguous native false and dropped replies block exact replay without auto-post or refresh',async t=>{
 for(const reply of [()=>new Response('{"error":false}',{headers:{'Content-Type':'text/plain'}}),()=>Response.json({}),()=>Response.json({error:false},{status:201}),()=>{throw Error('Synthetic lost reply');}]){
  const h=await fixture(t,{reply:url=>url.pathname.endsWith('/SubmitPertanyaan')?reply():null}),context=await h.user.open();const r=await h.user.write(context);assert.equal(r.body.result?.delivery??r.body.error.details.delivery,'unknown');assert.equal(h.posts().length,1);assert.equal(h.reads().length,0);assert.equal((await h.user.write(context)).body.error.code,'BERKAS_QUESTION_UNCONFIRMED');assert.equal(h.posts().length,1);
 }
});
test('HTTP accepted message retains acceptance when awaited refresh fails',async t=>{
 const h=await fixture(t,{reply:url=>url.pathname.endsWith('/GetTanyaJawabBerkas')?Response.json({data:[message({waktu:null})]}):null}),context=await h.user.open(),r=await h.user.write(context);
 assert.equal(r.status,200);assert.equal(r.body.result.data.success,true);assert.equal(r.body.result.refresh.success,false);assert.equal(r.body.result.refresh.code,'BERKAS_QUESTION_HISTORY_FAILED');assert.equal(h.posts().length,1);assert.equal(h.reads().length,1);
});
test('HTTP busy remains held through awaited refresh and prevents concurrent POST',async t=>{
 const held=deferred(),entered=deferred();const h=await fixture(t,{reply:async url=>{if(url.pathname.endsWith('/GetTanyaJawabBerkas')){entered.resolve();await held.promise;}return null;}}),context=await h.user.open();const first=h.user.write(context);await entered.promise;
 assert.equal((await h.user.write(context,'another')).body.error.code,'BERKAS_QUESTION_BUSY');assert.equal(h.posts().length,1);held.resolve();assert.equal((await first).body.result.refresh.success,true);
});
test('HTTP replaced collection context revokes writer; independent search context remains valid',async t=>{
 const h=await fixture(t),context=await h.user.open(),search=await h.user.open('search');await h.user.execute('collection');assert.equal((await h.user.write(context)).status,409);assert.equal((await h.user.write(search)).status,200);assert.equal(h.posts().length,1);
});
test('HTTP typed history accepts shared2xx,error metadata ignored and String isTanya preserved',async t=>{
 const h=await fixture(t,{reply:url=>url.pathname.endsWith('/GetTanyaJawabBerkas')?Response.json({error:true,data:[message({isTanya:'0'}),message({isTanya:'false'})]},{status:201}):null});
 const r=await h.user.execute('read',{berkasid:original});assert.equal(r.status,200);assert.equal(r.body.result.status,201);assert.deepEqual(r.body.result.data.map(row=>row.isTanya),['0','false']);
 for(const id of [original+'&forged=1',original+'#x'])assert.equal((await h.user.execute('read',{berkasid:id})).status,400);assert.equal(h.reads().length,1);
});
test('HTTP session invalidation during POST releases no private delayed refresh and never retries',async t=>{
 const held=deferred(),entered=deferred();const h=await fixture(t,{reply:async url=>{if(url.pathname.endsWith('/SubmitPertanyaan')){entered.resolve();await held.promise;}return null;}}),context=await h.user.open(),pending=h.user.write(context);await entered.promise;h.sessions.delete(h.user.session.id);held.resolve();const r=await pending;assert.equal(r.status,401);assert.equal(r.body.result,undefined);assert.equal(h.reads().length,0);assert.equal(h.posts().length,1);
});
