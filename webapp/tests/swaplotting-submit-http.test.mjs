import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {SessionStore,COOKIE} from '../private/session.mjs';

const ids={profile:'post-account-account-summary-d2939c',disclaimer:'get-map-getdisclaimer-d29ef0',offices:'get-legacy-kantah-d10364',regions:'get-legacy-wilayah-d752bc',registered:'post-apis-swaplottingterdaftar-d9f850',unregistered:'post-apis-swaplottingbelumterdaftar-da0be8'};
const profile={userId:'own-synthetic',nomorIdentitas:'private-synthetic-id',userLevel:2,isIkd:false,nama:' Own SINTETIS ',nomorHp:' 00000 ',email:' synthetic@example.invalid '};
const draft=kind=>({fields:kind==='registered'?{name:profile.nama,phone:profile.nomorHp,email:profile.email,number:' 0001 ',review:' Raw review\nline '}: {name:profile.nama,phone:profile.nomorHp,email:profile.email,address:' Raw address\nline ',basisNumber:' 001 ',basisDescription:' Description ',taxNumber:' 002 ',taxDescription:' Tax ',review:' Review '},officeIndex:0,regionIndex:0,right:kind==='registered'?'1':null,basisIndex:kind==='registered'?null:0,taxIndex:kind==='registered'?null:0,latitude:'-0',longitude:'106.25',disclaimerAcknowledged:true});
async function fixture(t,{reply,profilePatch=()=>({})}={}){
 const calls=[],sessions=new SessionStore();
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'synthetic-only',applicationAuthorization:()=> 'AtrBpn synthetic-app'};
 const server=createServer({configuration,sessions,log:()=>{},transport:async(url,init)=>{
  calls.push({url,init});const override=await reply?.(url,init,calls);if(override)return override;
  if(url.pathname==='/account/account_summary')return Response.json({error:false,data:{...profile,...profilePatch()}});
  if(url.pathname==='/Map/GetDisclaimer')return Response.json({message:'Synthetic terms',message2:null,message3:null,url:null});
  if(url.pathname==='/legacy/Kantah')return Response.json([{KantorId:' office ',Nama:' Office '}]);
  if(url.pathname==='/legacy/Wilayah')return Response.json([{WilayahId:' region ',Nama:' Region '}]);
  if(url.pathname.startsWith('/apis/Swaplotting'))return Response.json({error:true,body:'ignored'});
  if(url.pathname==='/activity/AddUserActivity')return Response.json({error:true,body:'ignored'});
  if(url.pathname==='/activity/GetUserActivity')return Response.json({error:false,data:[]});
  throw Error('Unexpected synthetic request '+url.pathname);
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base='http://127.0.0.1:'+server.address().port;
 function browser(authenticated=true){
  const session=sessions.create();if(authenticated){session.user={username:'synthetic-owner',nomorIndukKependudukan:'WRONG-SIGNIN-ID'};session.tokens={tokenType:'Bearer',accessToken:'synthetic-access',refreshToken:null,expiredAt:4e9};}
  const request=async(path,data,headers={})=>{const response=await fetch(base+path,{method:'POST',headers:{Cookie:COOKIE+'='+session.id,Origin:base,'X-CSRF-Token':session.csrfToken,...(data instanceof FormData?{}:{'Content-Type':'application/json'}),...headers},body:data instanceof FormData?data:JSON.stringify(data)});return {status:response.status,body:await response.json()};};
  const execute=(id,values={},confirm=true)=>request('/api/execute',{operationId:id,values,confirm});
  async function sources(){const contexts={};for(const kind of ['profile','disclaimer','offices','regions']){const read=await execute(ids[kind],kind==='offices'?{nama:'',tipeKantor:''}:kind==='regions'?{kantorid:' office '}:{});assert.equal(read.status,200);assert.equal(read.body.result.swaplottingSourceContext.kind,kind);contexts[kind]=read.body.result.swaplottingSourceContext.id;}return contexts;}
  function stage(values,files=[new File([Uint8Array.from([0,255,1,10])],'ignored.png',{type:'image/png'})]){const form=new FormData();form.set('operationId','swaplotting-review');form.set('values',JSON.stringify(values));for(const file of files)form.append('file',file);return request('/api/swaplotting/review',form);}
  return {session,request,execute,sources,stage};
 }
 const user=browser();return {calls,user,browser,uploads:()=>calls.filter(row=>row.url.pathname.startsWith('/apis/Swaplotting')),activities:()=>calls.filter(row=>row.url.pathname==='/activity/AddUserActivity')};
}
async function stage(f,kind='registered'){const result=await f.user.stage({kind,sourceContexts:await f.user.sources(),draft:draft(kind)});assert.equal(result.status,200,JSON.stringify(result.body));return result.body.reviewId;}

test('actual HTTP both uploads preserve staged bytes and defer Activity until explicit completion exactly once',async t=>{
 for(const kind of ['registered','unregistered']){
  const f=await fixture(t),reviewId=await stage(f,kind);assert.equal(f.uploads().length,0);
  const upload=await f.user.execute(ids[kind],{reviewId});assert.equal(upload.status,200);assert.equal(upload.body.result.data,true);assert.equal(upload.body.result.delivery,'confirmed');assert.equal(f.uploads().length,1);assert.equal(f.activities().length,0);assert.equal((await f.user.request('/api/swaplotting/discard',{reviewId})).body.discarded,false);
  const init=f.uploads()[0].init,form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();assert.equal(init.headers.Authorization,'Bearer synthetic-access');assert.equal(form.get('lat'),'-0');assert.equal(form.get('id'),'id');assert.equal(form.get('kluster'),'K4');assert.equal(form.get('file').type,'application/octet-stream');assert.deepEqual([...new Uint8Array(await form.get('file').arrayBuffer())],[0,255,1,10]);
  const done=await f.user.request('/api/swaplotting/complete',{reviewId,confirm:true});assert.equal(done.status,200);assert.equal(done.body.completed,true);assert.equal(done.body.refresh.success,true);assert.equal(f.activities().length,1);assert.deepEqual(f.calls.slice(-2).map(row=>row.url.pathname),['/activity/AddUserActivity','/activity/GetUserActivity']);
  assert.equal((await f.user.request('/api/swaplotting/complete',{reviewId,confirm:true})).status,409);assert.equal(f.activities().length,1);
  assert.equal((await f.user.stage({kind,sourceContexts:await f.user.sources(),draft:draft(kind)})).status,200);
 }
});

test('HTTP origin, CSRF, confirmation, source scope and file authority fail before mutation',async t=>{
 const f=await fixture(t),sourceContexts=await f.user.sources(),values={kind:'registered',sourceContexts,draft:draft('registered')};
 const form=()=>{const x=new FormData();x.set('operationId','swaplotting-review');x.set('values',JSON.stringify(values));x.append('file',new File(['synthetic'],'x.png',{type:'image/png'}));return x;};
 for(const headers of [{'X-CSRF-Token':'wrong'},{Origin:'https://other.invalid'}])assert.equal((await f.user.request('/api/swaplotting/review',form(),headers)).status,403);
 assert.equal((await f.user.request('/api/swaplotting/review',{operationId:'swaplotting-review',values})).status,400);
 const reviewId=await stage(f);assert.equal((await f.user.execute(ids.registered,{reviewId},false)).body.error.code,'CONFIRMATION_REQUIRED');
 assert.equal((await f.user.request('/api/swaplotting/complete',{reviewId,confirm:false})).status,400);
 const forged=await f.user.execute(ids.registered,{reviewId,lat:'1'});assert.equal(forged.status,400);
 const direct=new FormData();direct.set('operationId',ids.registered);direct.set('values',JSON.stringify({reviewId}));direct.set('confirm','true');direct.append('file',new File(['x'],'x.png',{type:'image/png'}));assert.equal((await f.user.request('/api/execute',direct)).status,400);
 assert.equal(f.uploads().length,0);assert.equal(f.activities().length,0);
});

test('opaque HTTP source/review IDs cannot cross sessions or accept a forged profile contact',async t=>{
 const f=await fixture(t),sourceContexts=await f.user.sources(),values={kind:'registered',sourceContexts,draft:draft('registered')};
 assert.equal((await f.browser().stage(values)).status,409);
 values.draft.fields.email='forged@example.invalid';const forged=await f.user.stage(values);assert.equal(forged.body.error.code,'SESSION_CHANGED');
 const reviewId=await stage(f);assert.equal((await f.browser().execute(ids.registered,{reviewId})).status,409);
 assert.equal((await f.browser(false).request('/api/swaplotting/status',{reviewId})).status,401);
 assert.equal(f.uploads().length,0);
});

test('normal native false remains false and permits only a new explicit staged attempt',async t=>{
 const f=await fixture(t,{reply:url=>url.pathname.startsWith('/apis/Swaplotting')?Response.json({ignored:true},{status:201}):undefined}),reviewId=await stage(f),reply=await f.user.execute(ids.registered,{reviewId});
 assert.equal(reply.status,200);assert.equal(reply.body.result.data,false);assert.equal(f.uploads().length,1);assert.equal(f.activities().length,0);
 assert.equal((await f.user.request('/api/swaplotting/complete',{reviewId,confirm:true})).status,409);
 assert.equal((await f.user.execute(ids.registered,{reviewId})).status,409);
 assert.equal((await f.user.stage({kind:'registered',sourceContexts:await f.user.sources(),draft:draft('registered')})).status,200);
 assert.equal(f.uploads().length,1);
});

test('dispatched timeout is unknown, never retried, and server-local status exposes no source bytes or contact fields',async t=>{
 const f=await fixture(t,{reply:url=>{if(url.pathname.startsWith('/apis/Swaplotting'))throw Object.assign(new Error('Synthetic timeout'),{name:'TimeoutError',code:'REQUEST_TIMEOUT'});}}),reviewId=await stage(f),reply=await f.user.execute(ids.registered,{reviewId});
 assert.equal(reply.body.error.details.delivery,'unknown');assert.equal(f.uploads().length,1);const before=f.calls.length;
 const status=await f.user.request('/api/swaplotting/status',{reviewId});assert.equal(status.status,200);assert.equal(status.body.delivery,'unknown');assert.equal(status.body.uploadAccepted,false);assert.equal(f.calls.length,before);assert.doesNotMatch(JSON.stringify(status.body),/synthetic-access|private-synthetic-id|example.invalid|filename|latitude/);
 assert.equal((await f.user.request('/api/swaplotting/discard',{reviewId})).body.discarded,false);assert.equal((await f.user.execute(ids.registered,{reviewId})).status,409);assert.equal(f.uploads().length,1);assert.equal(f.activities().length,0);
});

test('submit preflight failure is explicitly not sent and never reaches upload transport',async t=>{
 let fail=false;const f=await fixture(t,{reply:url=>{if(fail&&url.pathname==='/account/account_summary')throw Object.assign(new Error('Synthetic timeout'),{name:'TimeoutError'});}}),reviewId=await stage(f);fail=true;
 const reply=await f.user.execute(ids.registered,{reviewId});assert.equal(reply.body.error.details.delivery,'not_sent');assert.equal(f.uploads().length,0);assert.equal(f.activities().length,0);
});

test('ordinary Activity false and forced refresh failure preserve accepted upload with no mutation replay',async t=>{
 const f=await fixture(t,{reply:url=>url.pathname==='/activity/AddUserActivity'?Response.json({ignored:true},{status:201}):url.pathname==='/activity/GetUserActivity'?Response.json({error:true},{status:503}):undefined}),reviewId=await stage(f);await f.user.execute(ids.registered,{reviewId});
 const done=await f.user.request('/api/swaplotting/complete',{reviewId,confirm:true});assert.equal(done.status,200);assert.equal(done.body.uploadAccepted,true);assert.equal(done.body.completed,true);assert.equal(done.body.activity.success,false);assert.deepEqual(done.body.refresh,{success:false,result:null});assert.equal(f.activities().length,1);assert.equal(f.uploads().length,1);
});

test('source reread revokes ready staging but preserves accepted result awaiting OK',async t=>{
 const f=await fixture(t),first=await stage(f);await f.user.execute(ids.profile);assert.equal((await f.user.execute(ids.registered,{reviewId:first})).status,409);assert.equal(f.uploads().length,0);
 const second=await stage(f);await f.user.execute(ids.registered,{reviewId:second});await f.user.execute(ids.profile);
 assert.equal((await f.user.request('/api/swaplotting/complete',{reviewId:second,confirm:true})).status,200);assert.equal(f.uploads().length,1);assert.equal(f.activities().length,1);
});

test('explicit local discard and logout revoke staged bytes and cannot be used to replay a consumed upload',async t=>{
 const f=await fixture(t),first=await stage(f);assert.equal((await f.user.request('/api/swaplotting/discard',{reviewId:first})).body.discarded,true);assert.equal((await f.user.execute(ids.registered,{reviewId:first})).status,409);
 const second=await stage(f);assert.equal((await f.user.request('/api/logout',{})).status,200);const retired=await f.user.execute(ids.registered,{reviewId:second});assert.equal(retired.status,403);assert.equal(retired.body.error.code,'CSRF_REQUIRED');assert.equal(f.uploads().length,0);
});
