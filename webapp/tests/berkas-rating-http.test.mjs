import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';import {SessionStore,COOKIE} from '../private/session.mjs';
const ids={list:'post-berkas-getberkas-d15068',detail:'post-berkas-cariberkas-d88218',post:'post-berkas-postratingberkas-d915c4'},original=' own RAW ID : +&/ ';
const row=(patch={})=>({berkasId:original,readyToRating:true,nomor:42,tahun:2026,namaProsedur:'SINTETIS',...patch});
const detail=(patch={})=>({berkasId:original,nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'SINTETIS',parapihak:[],perjalananBerkas:[],kantor:{nama:'SINTETIS'},...patch});
async function fixture(t,{reply,listRows=()=>[row()],primary=()=>detail()}={}){
 let time=1000;const calls=[],sessions=new SessionStore({now:()=>time}),configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS',applicationAuthorization:()=> 'AtrBpn synthetic-app'};
 const server=createServer({configuration,sessions,now:()=>time,berkasRatingNow:()=>time,log(){},transport:async(url,init)=>{calls.push({url,init});const override=await reply?.(url,init);if(override)return override;if(url.pathname==='/Berkas/GetBerkas')return Response.json({error:false,data:listRows()});if(url.pathname==='/berkas/CariBerkas')return Response.json({error:false,data:primary()});if(url.pathname==='/berkas/postratingberkas')return Response.json({error:false,message:'SINTETIS'});throw Error('Unexpected synthetic provider path '+url.pathname);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const origin='http://127.0.0.1:'+server.address().port;
 function browser(authenticated=true){const session=sessions.create();if(authenticated){session.user={username:'synthetic-owner'};session.tokens={tokenType:'Bearer',accessToken:'synthetic-access',refreshToken:null,expiredAt:null};}
  const request=async(data,headers={})=>{const response=await fetch(origin+'/api/execute',{method:'POST',headers:{Cookie:COOKIE+'='+session.id,Origin:origin,'X-CSRF-Token':session.csrfToken,...(data instanceof FormData?{}:{'Content-Type':'application/json'}),...headers},body:data instanceof FormData?data:JSON.stringify(data)});return {status:response.status,body:await response.json()};};
  const execute=(kind,values={},extra={})=>request({operationId:ids[kind],values,...extra});
  const list=()=>execute('list',{selesai:false});
  const open=async()=>{const source=(await list()).body.result.berkasRatingSources[0]?.sourceId;const response=await execute('detail',{berkasId:original},{berkasRatingSourceId:source});assert.equal(response.status,200,JSON.stringify(response.body));return response.body.result.berkasRatingContextId;};
  const write=(contextId,patch={},extra={})=>execute('post',{contextId,rating:3,userComment:' \u0085 Raw\ncomment \uFEFF ',...patch},{confirm:true,...extra});
  return {session,request,execute,list,open,write};
 }
 return {calls,browser,user:browser(),advance:ms=>time+=ms,posts:()=>calls.filter(row=>row.url.pathname==='/berkas/postratingberkas')};
}

test('actual HTTP own list→detail→one confirmed rating preserves exact raw ID,trim and ordered multipart bytes',async t=>{
 const h=await fixture(t),context=await h.user.open();assert.match(context,/^brc_[A-Za-z0-9_-]{32}$/);assert.equal(h.posts().length,0);
 const reply=await h.user.write(context);assert.equal(reply.status,200);assert.deepEqual(reply.body.result.data,{error:false,message:'SINTETIS'});assert.equal(reply.body.result.delivery,'received');assert.equal(h.posts().length,1);
 const init=h.posts()[0].init,form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();assert.deepEqual([...form.keys()],['Berkasid','rating','userComment']);assert.equal(form.get('Berkasid'),original);assert.equal(form.get('rating'),'3');assert.match(init.body.toString(),/Raw\ncomment\r\n--/);assert.equal(init.headers.Authorization,'Bearer synthetic-access');
 assert.equal((await h.user.write(context)).status,409);assert.equal(h.posts().length,1);assert.deepEqual(h.calls.map(row=>row.url.pathname),['/Berkas/GetBerkas','/berkas/CariBerkas','/berkas/postratingberkas']);
});

test('HTTP origin,CSRF,confirmation,rawID,extra fields and multipart files fail before writer transport',async t=>{
 const h=await fixture(t),context=await h.user.open(),data={operationId:ids.post,values:{contextId:context,rating:3,userComment:'x'},confirm:true};
 for(const headers of [{Origin:'https://other.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await h.user.request(data,headers)).status,403);
 assert.equal((await h.user.write(context,{}, {confirm:false})).body.error.code,'CONFIRMATION_REQUIRED');
 for(const patch of [{Berkasid:'forged'},{rating:0},{rating:'3'},{rating:1.5},{userComment:' \u0085\n'}])assert.equal((await h.user.write(context,patch)).status,400);
 assert.equal((await h.user.write(context,{}, {berkasRatingSourceId:'unexpected'})).status,400);
 const form=new FormData();form.set('operationId',ids.post);form.set('values',JSON.stringify(data.values));form.set('confirm','true');form.append('file',new File(['SINTETIS'],'x.txt'));assert.equal((await h.user.request(form)).status,400);
 const raw=await h.user.execute('post',{Berkasid:original,rating:3,userComment:'x'},{confirm:true});assert.equal(raw.status,400);assert.equal(h.posts().length,0);
});

test('HTTP source/detail refs remain account-owned and cannot derive eligibility from bare detail or display IDs',async t=>{
 const h=await fixture(t),list=await h.user.list(),source=list.body.result.berkasRatingSources[0].sourceId;
 assert.equal((await h.browser().execute('detail',{berkasId:original},{berkasRatingSourceId:source})).status,409);
 assert.equal((await h.user.execute('detail',{berkasId:'42/2026'},{berkasRatingSourceId:source})).status,409);
 assert.equal((await h.user.execute('detail',{berkasId:original,nomor:'42'},{berkasRatingSourceId:source})).status,409);
 const bare=await h.user.execute('detail',{berkasId:original});assert.equal(bare.status,200);assert.equal(bare.body.result.berkasRatingContextId,undefined);
 const context=await h.user.open();assert.equal((await h.browser().write(context)).status,409);assert.equal((await h.browser(false).write(context)).status,401);assert.equal(h.posts().length,0);
});

test('HTTP readyToRatingfalse/null/missing/malformed rows and expliciterror list envelopes never issue source refs',async t=>{
 const h=await fixture(t,{listRows:()=>[row({readyToRating:false}),row({readyToRating:null}),row({readyToRating:undefined}),row({readyToRating:'true'})]});assert.deepEqual((await h.user.list()).body.result.berkasRatingSources,[]);
 const error=await fixture(t,{reply:url=>url.pathname==='/Berkas/GetBerkas'?Response.json({error:true,message:'SINTETIS',data:[row()]}):undefined});const response=await error.user.list();assert.equal(response.status,502);assert.equal(response.body.result,undefined);assert.equal(error.posts().length,0);
});

test('HTTP mismatched primary ID,error envelope and malformed detail cannot issue a rating context',async t=>{
 for(const options of [{primary:()=>detail({berkasId:'different-primary-ID'})},{primary:()=>detail({statusBerkas:'1'})},{reply:url=>url.pathname==='/berkas/CariBerkas'?Response.json({error:true,data:detail()}):undefined}]){
  const h=await fixture(t,options),source=(await h.user.list()).body.result.berkasRatingSources[0].sourceId,reply=await h.user.execute('detail',{berkasId:original},{berkasRatingSourceId:source});assert.equal(reply.status,200);assert.equal(reply.body.result.berkasRatingContextId,undefined);assert.equal(h.posts().length,0);
 }
 const omitted=await fixture(t,{primary:()=>detail({berkasId:null})});assert.match(await omitted.user.open(),/^brc_/);
});

test('HTTP ready TTL/list replacement revokes context without posting and never triggers implicit reads',async t=>{
 const h=await fixture(t),context=await h.user.open();h.advance(120000);assert.equal((await h.user.write(context)).body.error.details.delivery,'not_sent');assert.equal(h.posts().length,0);assert.equal(h.calls.length,2);
 const fresh=await h.user.open();await h.user.list();assert.equal((await h.user.write(fresh)).status,409);assert.equal(h.posts().length,0);
});

test('HTTP strict errortrue allows an explicit second click only; accepted response blocks fresh-context replay',async t=>{
 let reject=true;const h=await fixture(t,{reply:url=>url.pathname==='/berkas/postratingberkas'?Response.json({error:reject,message:''},{status:201}):undefined}),context=await h.user.open();
 const first=await h.user.write(context);assert.equal(first.status,200);assert.deepEqual(first.body.result.data,{error:true,message:''});assert.equal(h.posts().length,1);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.posts().length,1);
 reject=false;const second=await h.user.write(context);assert.equal(second.body.result.data.error,false);assert.equal(h.posts().length,2);h.advance(120001);const next=await h.user.open();assert.equal((await h.user.write(next)).body.error.code,'BERKAS_RATING_ATTEMPT_USED');assert.equal(h.posts().length,2);
});

test('HTTP malformed/non2xx/redirect/bodyloss/transport outcomes remain unknown and cannot be replayed after TTL',async t=>{
 for(const response of [()=>Response.json({error:'false'}),()=>new Response('{"error":false}',{headers:{'Content-Type':'text/plain'}}),()=>new Response('{bad}',{headers:{'Content-Type':'application/json'}}),()=>Response.json({error:false},{status:503}),()=>new Response(null,{status:302,headers:{Location:'https://other.invalid'}}),()=>new Response(new ReadableStream({start(controller){controller.error(Error('SINTETIS bodyloss'));}}),{headers:{'Content-Type':'application/json'}}),()=>{throw Object.assign(Error('SINTETIS timeout'),{name:'TimeoutError'});}]){
  const h=await fixture(t,{reply:url=>url.pathname==='/berkas/postratingberkas'?response():undefined}),context=await h.user.open(),reply=await h.user.write(context);assert.equal(reply.body.ok,false);assert.equal(reply.body.error.details.delivery,'unknown');assert.equal(h.posts().length,1);
  h.advance(120001);const next=await h.user.open();assert.equal((await h.user.write(next)).body.error.code,'BERKAS_RATING_ATTEMPT_USED');assert.equal(h.posts().length,1);
 }
});

test('HTTP concurrent clicks share one backend guard and pending logout cannot publish an old accepted result',async t=>{
 let release;const h=await fixture(t,{reply:url=>url.pathname==='/berkas/postratingberkas'?new Promise(resolve=>release=resolve):undefined}),context=await h.user.open(),pending=h.user.write(context);while(!release)await new Promise(resolve=>setImmediate(resolve));
 assert.equal((await h.user.write(context)).status,409);assert.equal(h.posts().length,1);h.user.session.authenticationController.abort();h.user.session.active=false;release(Response.json({error:false,message:'late'}));const late=await pending;assert.equal(late.body.ok,false);assert.equal(late.body.error.details.delivery,'unknown');assert.equal(h.posts().length,1);
});

test('HTTP writer result applies existing credential redaction to a provider message without losing bool or empty text',async t=>{
 const h=await fixture(t,{reply:url=>url.pathname==='/berkas/postratingberkas'?Response.json({error:false,message:'Bearer synthetic-access AtrBpn synthetic-app'}):undefined}),context=await h.user.open(),reply=await h.user.write(context);
 assert.equal(reply.status,200);assert.equal(reply.body.result.data.error,false);assert.doesNotMatch(reply.body.result.data.message,/synthetic-access|synthetic-app/);assert.match(reply.body.result.data.message,/REDACTED/);
});
