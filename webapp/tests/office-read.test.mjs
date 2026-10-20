import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS, prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Every upstream call is intercepted in process. Values and credentials are synthetic.
const nearbyId='post-kantornearby-getkantornearby-d21a34';
const calendarId='post-kantornearby-getcalendar-d2127c';
const coordinates={latitude:-6.175392,longitude:106.827153};
const reference='fixture-encoded + / = office';
const decoded=' fixture decoded + & / é office ';
const calendarValues={kantorId:reference,tahun:'2026'};
const token={tokenType:'Bearer',accessToken:'fixture-office-access',refreshToken:'fixture-office-refresh',expiredAt:4_000_000_000};
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=> 'AtrBpn fixture-office-application',calendarOfficeId:id=>{assert.equal(id,reference);return decoded}};
const plain=value=>JSON.parse(JSON.stringify(value));
const prepared=(id,values)=>prepareOperation(id,values,{});
const request=(id,values)=>{const p=prepared(id,values);return {...p,base:p.service.baseUrl}};
const nearby=()=>request(nearbyId,coordinates);
const calendar=()=>request(calendarId,calendarValues);

async function fixture(t,responder,configuration=config){
 const calls=[],logs=[],sessions=new SessionStore();
 const server=createServer({configuration,sessions,log:entry=>logs.push(entry),transport:async(url,init)=>{
  calls.push({url:new URL(url),...init});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'fixture-office-user',token:{...token}}});
  return responder(url,init);
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
 async function send(path,data,headers={}){
  const response=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
  if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  const result=await response.json();if(result.csrfToken)state=result;return {response,result};
 }
 await send('/api/state');
 return {calls,logs,sessions,send,execute:(id,values,headers)=>send('/api/execute',{operationId:id,values},headers),get state(){return state}};
}

test('office adapters prepare two read contracts with numeric location and fixed native nearby values',()=>{
 for(const [id,path,encoding] of [[nearbyId,'kantornearby/getkantornearby','json'],[calendarId,'KantorNearby/GetCalendar','form']]){
  const op=OPERATIONS.find(item=>item.id===id);assert.ok(op.enabled);assert.equal(op.serviceId,'main');assert.equal(op.auth,'optionalSession');assert.equal(op.method,'POST');assert.equal(op.path,path);assert.equal(op.encoding,encoding);assert.equal(op.effect,'read');assert.equal(op.mutates,false);assert.equal(op.requiresConfirmation,false);
 }
 const input={...coordinates};assert.deepEqual(plain(prepared(nearbyId,input).body),{...input,radius:0.1,isKalender:1,limit:null});assert.deepEqual(input,coordinates);
 for(const value of [{latitude:-90,longitude:-180},{latitude:90,longitude:180},{latitude:0,longitude:0}])assert.deepEqual(plain(prepared(nearbyId,value).body),{...value,radius:0.1,isKalender:1,limit:null});
 for(const key of ['latitude','longitude']){
  for(const value of [undefined,null,''])assert.throws(()=>prepared(nearbyId,{...coordinates,[key]:value}),{code:'FIELD_REQUIRED'});
  for(const value of ['1',true,{},[],NaN,Infinity,-Infinity,key==='latitude'?90.001:180.001,key==='latitude'?-90.001:-180.001])assert.throws(()=>prepared(nearbyId,{...coordinates,[key]:value}),{code:'INVALID_FIELD'});
 }
 for(const [key,value] of [['radius',1],['isKalender',0],['limit',10]])assert.throws(()=>prepared(nearbyId,{...coordinates,[key]:value}),{code:'FIXED_FIELD'});
 for(const key of ['url','headers','latitudeText','__proto__','constructor','prototype'])assert.throws(()=>prepared(nearbyId,{...coordinates,...JSON.parse(JSON.stringify({[key]:'forbidden'}))}),{code:'UNKNOWN_FIELD'});
});

test('calendar input remains two raw nonempty strings and cannot acquire arbitrary request fields',()=>{
 const raw={kantorId:' raw + / = ',tahun:' 2026 '};assert.deepEqual(plain(prepared(calendarId,raw).body),raw);
 for(const key of ['kantorId','tahun']){
  for(const value of [undefined,null,''])assert.throws(()=>prepared(calendarId,{...raw,[key]:value}),{code:'FIELD_REQUIRED'});
  for(const value of [2026,true,{},[],'bad\0text','x'.repeat(16001)])assert.throws(()=>prepared(calendarId,{...raw,[key]:value}),{code:'INVALID_FIELD'});
 }
 for(const key of ['KantorId','year','url','headers','__proto__','constructor','prototype'])assert.throws(()=>prepared(calendarId,{...raw,...JSON.parse(JSON.stringify({[key]:'forbidden'}))}),{code:'UNKNOWN_FIELD'});
});

test('nearby JSON and decoded calendar form preserve native wire fields with anonymous or stored session auth',async()=>{
 const calls=[],transforms=[];const client=new ApiClient({...config,calendarOfficeId:value=>{transforms.push(value);return decoded}},{log:()=>{},transport:async(url,init)=>{calls.push({url,init});return Response.json({error:false,message:null,data:[]})}});
 for(const session of [undefined,{active:true,tokens:{...token}}]){
  const n=nearby();await client.request({...n,session});const nc=calls.at(-1);
  assert.equal(nc.url.href,'https://sentuh.atrbpn.go.id/kantornearby/getkantornearby');assert.equal(nc.init.method,'POST');assert.equal(nc.init.headers['Content-Type'],'application/json');assert.equal(nc.init.headers.Accept,'application/json');assert.equal(nc.init.headers.Authorization,session?'Bearer '+token.accessToken:undefined);assert.deepEqual(JSON.parse(nc.init.body),{...coordinates,radius:0.1,isKalender:1,limit:null});
  const c=calendar(),snapshot=plain(c.body);await client.request({...c,session});const cc=calls.at(-1);
  assert.equal(cc.url.href,'https://sentuh.atrbpn.go.id/KantorNearby/GetCalendar');assert.equal(cc.init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(cc.init.headers.Accept,'application/json');assert.equal(cc.init.headers.Authorization,session?'Bearer '+token.accessToken:undefined);assert.ok(cc.init.body instanceof URLSearchParams);assert.deepEqual([...cc.init.body],[['kantorId',decoded],['tahun','2026']]);assert.deepEqual(plain(c.body),snapshot);assert.equal(c.body.kantorId,reference);
 }
 assert.deepEqual(transforms,[reference,reference]);assert.equal(calls.length,4);
});

test('exact office transport scopes reject alternate profiles methods auth encodings queries files and body shapes before forwarding',async()=>{
 const calls=[],transforms=[];const client=new ApiClient({...config,calendarOfficeId:value=>{transforms.push(value);return decoded}},{log:()=>{},transport:async(...args)=>{calls.push(args);return Response.json({})}});
 for(const make of [nearby,calendar]){
  const original=make();
  for(const patch of [{clientProfile:'sps-document-viewer'},{method:'GET'},{method:'PUT'},{auth:'none'},{auth:'session'},{auth:'application'},{encoding:'multipart'},{encoding:original.encoding==='json'?'form':'json'},{query:{extra:'1'}},{files:[{key:'file',file:new Blob(['fixture'])}]},{body:{...original.body,extra:'1'}}])await assert.rejects(client.request({...original,...patch}),{status:409,code:'OFFICE_READ_SCOPE'});
  await assert.rejects(client.request({...original,base:'https://not-allowlisted.example.invalid/'}),{code:'SERVICE_NOT_READY'});
 }
 for(const body of [{...nearby().body,latitude:'1'},{...nearby().body,longitude:Infinity},{...nearby().body,latitude:91},{...nearby().body,longitude:-181},{...nearby().body,radius:1},{...nearby().body,isKalender:0},{...nearby().body,limit:10}])await assert.rejects(client.request({...nearby(),body}),{code:'OFFICE_READ_SCOPE'});
 for(const body of [{...calendar().body,kantorId:1},{...calendar().body,tahun:2026}])await assert.rejects(client.request({...calendar(),body}),{code:'OFFICE_READ_SCOPE'});
 assert.equal(calls.length,0);assert.equal(transforms.length,0);
});

test('missing or malformed calendar reference configuration fails closed without disclosing helper errors',async()=>{
 let calls=0;const transport=async()=>{calls++;return Response.json({})};
 const missing=new ApiClient({...config,calendarOfficeId:undefined},{transport,log:()=>{}});
 await assert.rejects(missing.request(calendar()),{status:503,code:'OFFICE_REFERENCE_CONFIGURATION'});
 for(const helper of [()=>{throw new Error('fixture-sensitive-helper-material')},()=>'',()=>null,()=>12,()=>({})]){
  const client=new ApiClient({...config,calendarOfficeId:helper},{transport,log:()=>{}});
  await assert.rejects(client.request(calendar()),error=>error.status===400&&error.code==='OFFICE_REFERENCE_INVALID'&&!JSON.stringify(error).includes('fixture-sensitive-helper-material'));
 }
 assert.equal(calls,0);
});

test('calendar retry transforms the original reference anew and never transforms unrelated endpoints',async()=>{
 const inputs=[],calls=[];let attempt=0;
 const client=new ApiClient({...config,calendarOfficeId:value=>{inputs.push(value);assert.equal(value,reference);return decoded}},{log:()=>{},transport:async(url,init)=>{calls.push({url,init});if(url.pathname==='/KantorNearby/GetCalendar'&&++attempt===1)throw Object.assign(new Error('synthetic transient'),{code:'ECONNRESET'});return Response.json({error:false,data:[]})}});
 const req=calendar(),body=req.body;
 await assert.rejects(client.request(req),{code:'UPSTREAM_UNREACHABLE'});assert.equal(req.body,body);assert.equal(body.kantorId,reference);
 await client.request(req);assert.deepEqual(inputs,[reference,reference]);assert.deepEqual(calls.slice(0,2).map(call=>call.init.body.get('kantorId')),[decoded,decoded]);assert.equal(body.kantorId,reference);
 await client.request({path:'account/fixture',auth:'none',body:{kantorId:reference,tahun:'2026'}});assert.equal(inputs.length,2);assert.equal(calls.at(-1).init.body.get('kantorId'),reference);
});

test('two office reads retain successful native envelopes including error true while normal failures remain failures',async()=>{
 for(const make of [nearby,calendar]){
  for(const status of [200,201,202,206,299])for(const error of [false,true]){
   const envelope={error,message:'fixture status',data:[{fixture:'row'}]};const client=new ApiClient(config,{log:()=>{},transport:async()=>Response.json(envelope,{status})});
   const result=await client.request(make());assert.equal(result.status,status);assert.deepEqual(result.data,envelope);
  }
  for(const status of [400,403,404,500]){const client=new ApiClient(config,{log:()=>{},transport:async()=>Response.json({error:false,data:[]},{status})});await assert.rejects(client.request(make()),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status)}
  const redirected=new ApiClient(config,{log:()=>{},transport:async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.example.invalid'}})});await assert.rejects(redirected.request(make()),{code:'UPSTREAM_REDIRECT'});
 }
 const ordinary=new ApiClient(config,{log:()=>{},transport:async()=>Response.json({error:true,data:[]})});await assert.rejects(ordinary.request({path:'account/fixture'}),{code:'UPSTREAM_REJECTED'});
});

test('office HTTP execution keeps Origin CSRF allowlist and field validation ahead of transport',async t=>{
 const f=await fixture(t,()=>Response.json({error:false,data:[]}));
 for(const [id,values] of [[nearbyId,coordinates],[calendarId,calendarValues]]){
  assert.equal((await f.execute(id,values,{Origin:'https://untrusted.example.invalid'})).response.status,403);
  assert.equal((await f.execute(id,values,{'X-CSRF-Token':'wrong'})).response.status,403);
  assert.equal((await f.execute(id,{...values,url:'https://untrusted.example.invalid'})).response.status,400);
 }
 assert.equal((await f.execute(nearbyId,{...coordinates,latitude:'1'})).response.status,400);assert.equal((await f.execute(calendarId,{...calendarValues,tahun:2026})).response.status,400);assert.equal(f.calls.length,0);
 for(const [id,values] of [[nearbyId,coordinates],[calendarId,calendarValues]]){const result=await f.execute(id,values);assert.equal(result.response.status,200);assert.equal(result.result.result.status,200)}
 assert.equal(f.calls.length,2);assert.ok(f.calls.every(call=>call.headers.Authorization===undefined));
});

test('calendar optional-session execution refreshes first and keeps failures retryable with the original reference',async t=>{
 const transformations=[];let reads=0;
 const f=await fixture(t,url=>{
  if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'fixture-office-renewed'}});
  if(++reads===1)throw Object.assign(new Error('synthetic reset'),{code:'ECONNRESET'});
  return Response.json({error:false,data:[]});
 },{...config,calendarOfficeId:value=>{transformations.push(value);assert.equal(value,reference);return decoded}});
 await f.send('/api/login',{username:'fixture-office-user',password:'fixture-only-password'});
 const session=[...f.sessions.sessions.values()][0];session.tokens.expiredAt=1;
 const first=await f.execute(calendarId,calendarValues);assert.equal(first.result.error.code,'UPSTREAM_UNREACHABLE');assert.equal((await f.send('/api/state')).result.authenticated,true);
 const second=await f.execute(calendarId,calendarValues);assert.equal(second.response.status,200);assert.deepEqual(transformations,[reference,reference]);
 assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/auth/refresh_token','/KantorNearby/GetCalendar','/KantorNearby/GetCalendar']);assert.equal(f.calls[1].headers.Authorization,'AtrBpn '+token.accessToken);assert.ok(f.calls.slice(2).every(call=>call.headers.Authorization==='Bearer fixture-office-renewed'&&call.body.get('kantorId')===decoded));assert.equal(calendarValues.kantorId,reference);
});

test('office responses redact credential fields and values while transport logs omit payloads and credentials',async t=>{
 const f=await fixture(t,()=>Response.json({error:true,message:`Echo ${token.accessToken} ${token.refreshToken} fixture-office-application`,data:[{nama:'fixture kantor',accessToken:'hidden-field-value',secret:'fixture-secret-field',nested:{Authorization:'sensitive-header'}}]}));
 await f.send('/api/login',{username:'fixture-office-user',password:'fixture-only-password'});
 for(const [id,values] of [[nearbyId,coordinates],[calendarId,calendarValues]]){
  const output=await f.execute(id,values);assert.equal(output.response.status,200);assert.equal(output.result.result.data.error,true);assert.equal(output.result.result.data.data[0].nama,'fixture kantor');
  for(const secret of [token.accessToken,token.refreshToken,'fixture-office-application','hidden-field-value','fixture-secret-field','sensitive-header'])assert.ok(!JSON.stringify(output.result).includes(secret));
 }
 const logs=JSON.stringify(f.logs);for(const value of [reference,decoded,token.accessToken,token.refreshToken,'fixture-only-password','fixture-office-application',String(coordinates.latitude),String(coordinates.longitude)])assert.ok(!logs.includes(value));
 assert.ok(f.logs.every(entry=>!Object.hasOwn(entry,'headers')&&!Object.hasOwn(entry,'body')));
});

test('office unauthorized responses and delayed results retain existing session isolation',async t=>{
 for(const [id,values] of [[nearbyId,coordinates],[calendarId,calendarValues]]){
  const f=await fixture(t,()=>Response.json({error:true,message:'fixture rejected'},{status:401}));
  await f.send('/api/login',{username:'fixture-office-user',password:'fixture-only-password'});
  const session=[...f.sessions.sessions.values()][0];session.downloads.set('fixture-download',{});
  const failed=await f.execute(id,values);assert.equal(failed.response.status,401);assert.equal(failed.result.error.code,'SESSION_EXPIRED');assert.equal(session.tokens,null);assert.equal(session.user,null);assert.equal(session.downloads.size,0);
 }
 let ready,release;const started=new Promise(resolve=>{ready=resolve}),pending=new Promise(resolve=>{release=resolve});
 const f=await fixture(t,async()=>{ready();await pending;return Response.json({error:false,data:[{keterangan:'fixture old session result'}]})});
 await f.send('/api/login',{username:'fixture-office-user',password:'fixture-only-password'});
 const inflight=f.execute(calendarId,calendarValues);await started;await f.send('/api/logout',{});release();
 const result=await inflight;assert.equal(result.response.status,401);assert.equal(result.result.error.code,'SESSION_EXPIRED');assert.ok(!JSON.stringify(result.result).includes('fixture old session result'));
});
