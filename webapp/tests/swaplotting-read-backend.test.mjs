import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeSwaplottingDisclaimer as decode} from '../private/swaplotting-read-models.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Only synthetic transport and loopback HTTP fixtures; no APK/account or visit.
const ID='get-map-getdisclaimer-d29ef0',O='get-legacy-kantah-d10364',R='get-legacy-wilayah-d752bc';
const empty={message:null,message2:null,message3:null,url:null};
const token={tokenType:'Bearer',accessToken:'synthetic-swap-read-access',refreshToken:'synthetic-swap-read-refresh',expiredAt:4_000_000_000};
const config={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-swap-read-application',reason:'synthetic only'};
const session=()=>({active:true,user:{username:'synthetic-swap-read-user'},tokens:{...token}});
const request=(patch={})=>({path:'Map/GetDisclaimer',method:'GET',encoding:'none',auth:'optionalSession',...patch});
const json=JSON.stringify;
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};

test('catalog retains the office correction plus separately audited lost-review, Rating and Yuridis deltas',()=>{
 const before=JSON.parse(readFileSync(new URL('../../environment/swaplotting-read/operations-before.json',import.meta.url)));
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(o=>o.enabled).length,94);
 const review='post-review-all-dace58',post='post-review-post-deb030',mitra=['get-mitra-getpenilailist-d3aa20','get-mitra-getkantorppat-d3af08','get-mitra-getppatlist-d3b428','get-mitra-getwilayahsurveyor-d3b910','get-mitra-getsurveyorlist-d3be30'],changed=OPERATIONS.filter((o,i)=>json(o)!==json(before[i]));assert.deepEqual(changed.map(o=>o.id).sort(),[review,post,O,...mitra,'get-ratingppat-getratingquestions-d1d6bc','get-announcement-yuridis-bykantor-d0fb64','post-review-last-user-review-dad1dc','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].sort());
 const expected=structuredClone(before.find(o=>o.id===O));expected.fields.find(f=>f.path==='tipeKantor').allowEmpty=true;assert.deepEqual(changed.find(o=>o.id===O),expected);
 assert.deepEqual(OPERATIONS.filter(o=>![review,post].includes(o.id)).map(o=>o.enabled),before.filter(o=>![review,post].includes(o.id)).map(o=>['get-ratingppat-getratingquestions-d1d6bc','post-review-last-user-review-dad1dc','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].includes(o.id)?true:o.enabled));
 assert.equal(OPERATIONS.find(o=>o.id===review).enabled,true);assert.equal(OPERATIONS.find(o=>o.id===review).effect,'read');
 assert.equal(OPERATIONS.find(o=>o.id===post).enabled,true);assert.equal(OPERATIONS.find(o=>o.id===post).effect,'write');assert.equal(OPERATIONS.find(o=>o.id===post).requiresConfirmation,true);
 for(const op of OPERATIONS.filter(o=>/Swaplotting(?:Terdaftar|BelumTerdaftar)|Instansi(?:Bersertipikat|BelumBersertipikat)/.test(o.path))){const personal=['post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8'].includes(op.id);assert.equal(op.enabled,personal,op.id);if(personal){assert.equal(op.clientProfile,'swaplotting-post');assert.equal(op.requiresConfirmation,true);assert.throws(()=>prepareOperation(op.id,{namapemilik:'forged',lat:'1',lon:'2'},{authenticated:true}),{code:'SWAPLOTTING_SUBMIT_SCOPE'});}}
 assert.equal(OPERATIONS.find(o=>o.id==='post-geotag-uploadgeotag-d96b98').enabled,false);
});
test('native office query accepts two present raw empty Strings while Cari Bidang filter remains unchanged',()=>{
 for(const tipeKantor of ['', '3,2,1',' raw filter +& ']){
  const p=prepareOperation(O,{nama:'',tipeKantor});assert.deepEqual({...p.query},{nama:'',tipeKantor});assert.equal(p.method,'GET');assert.equal(p.encoding,'none');assert.equal(p.auth,'optionalSession');assert.equal(p.serviceId,'main');assert.deepEqual({...p.body},{});
 }
 assert.throws(()=>prepareOperation(O,{nama:''}),{code:'FIELD_REQUIRED'});
 for(const tipeKantor of [null,true,false,[],{}])assert.throws(()=>prepareOperation(O,{nama:'',tipeKantor}));
 // Existing generic scalar String coercion was not changed by allowEmpty.
 assert.equal(prepareOperation(O,{nama:'',tipeKantor:3}).query.tipeKantor,'3');
});
test('region preparation preserves the selected main KantorId and fixed empty name with no Directus identifier substitution',()=>{
 const p=prepareOperation(R,{kantorid:' original main KantorId +& '},{authenticated:true});assert.deepEqual({...p.query},{kantorid:' original main KantorId +& ',nama:''});assert.equal(p.serviceId,'main');assert.equal(p.auth,'session');assert.equal(p.method,'GET');assert.equal(p.path,'legacy/Wilayah');
 assert.throws(()=>prepareOperation(R,{kantorid:'original',nama:'changed'},{authenticated:true}),{code:'FIXED_FIELD'});
});
test('disclaimer is exactly four nullable String fields, retaining raw text and treating missing/null as null',()=>{
 assert.deepEqual(decode({}),empty);assert.deepEqual(decode({...empty}),empty);
 const value={message:' raw text ',message2:'',message3:'<b>server text</b>',url:'arbitrary raw String, not automatically opened'};assert.deepEqual(decode(value),value);
 assert.deepEqual(decode({message:'text',error:true,data:{message:'do not unwrap'},unknown:42}),{...empty,message:'text'});
 assert.deepEqual(decode({error:false,data:{message:'nested only'},Message:'wrong case'}),empty);
});
test('all disclaimer nonnull fields are strict Strings; no bool/number/list/object coercion',()=>{
 for(const key of Object.keys(empty))for(const value of [0,1,true,false,[],{}])assert.throws(()=>decode({[key]:value}),{code:'SWAPLOTTING_DISCLAIMER_RESPONSE_UNRECOGNIZED'});
 for(const value of [null,undefined,1,true,[],new Map(),new Date()])assert.throws(()=>decode(value));
});
test('native conditional String decode happens once, requires a Map and never recursively decodes or unwraps data',()=>{
 assert.deepEqual(decode('{"message":" once ","url":null}'),{...empty,message:' once '});
 for(const value of ['not-json','null','[]','42','true',json(json({message:'too deeply encoded'}))])assert.throws(()=>decode(value),{code:'SWAPLOTTING_DISCLAIMER_RESPONSE_UNRECOGNIZED'});
 assert.deepEqual(decode('{"error":true,"data":{"message":"ignored"}}'),empty);
});
test('model accepts null-prototype Maps and does not evaluate response accessors or inherited fields',()=>{
 const own=Object.create(null);own.message=' own ';assert.deepEqual(decode(own),{...empty,message:' own '});
 const getter={};Object.defineProperty(getter,'message',{get(){throw Error('getter invoked');}});assert.throws(()=>decode(getter),{code:'SWAPLOTTING_DISCLAIMER_RESPONSE_UNRECOGNIZED'});
 const unrelated={};Object.defineProperty(unrelated,'error',{get(){throw Error('unknown getter invoked');}});assert.deepEqual(decode(unrelated),empty);
 assert.throws(()=>decode(Object.create({message:'inherited'})));
});
test('existing disclaimer operation remains optional-session bodyless main GET with no browser request fields',()=>{
 const p=prepareOperation(ID,{});assert.equal(p.path,'Map/GetDisclaimer');assert.equal(p.auth,'optionalSession');assert.equal(p.method,'GET');assert.equal(p.encoding,'none');assert.equal(p.clientProfile,'main');assert.equal(p.effect,'read');assert.equal(p.requiresConfirmation,false);assert.deepEqual({...p.query},{});assert.deepEqual({...p.body},{});assert.deepEqual(p.files,[]);
 for(const key of ['nik','latitude','longitude','url','base','headers','error','message'])assert.throws(()=>prepareOperation(ID,{[key]:'forged'}),{code:'UNKNOWN_FIELD'});
});
for(const authenticated of [false,true])test(`disclaimer transport ${authenticated?'with session':'anonymous'} preserves main-client headers and never follows returned URL`,async()=>{
 let count=0;const client=new ApiClient(config,{log(){},transport:async(url,init)=>{count++;assert.equal(url.href,'https://sentuh.atrbpn.go.id/Map/GetDisclaimer');assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(init.headers.Authorization,authenticated?'Bearer synthetic-swap-read-access':undefined);return Response.json({error:true,message:' native text ',url:'https://must-not-open.invalid/terms'});}});
 const result=await client.request(request(authenticated?{session:session()}:{}));assert.equal(count,1);assert.deepEqual(result.data,{...empty,message:' native text ',url:'https://must-not-open.invalid/terms'});assert.equal(result.status,200);
});
test('exact disclaimer scope rejects alternate origins/path/method/auth/client/query/body/files before transport or getter evaluation',async()=>{
 let count=0;const client=new ApiClient(config,{log(){},transport:async()=>{count++;return Response.json({});}});
 for(const patch of [{base:'https://aplikasi.atrbpn.go.id/'},{base:'https://sentuh.atrbpn.go.id/alternate/'},{path:'/Map/GetDisclaimer'},{path:'Map/GetDisclaimer?injected=1'},{path:'Map/GetDisclaimer#fragment'},{method:'POST'},{encoding:'form'},{auth:'none'},{auth:'session'},{clientProfile:'sps-document-viewer'},{query:null},{query:[]},{query:{extra:''}},{body:null},{body:[]},{body:{extra:''}},{files:null},{files:[{}]}])await assert.rejects(client.request(request(patch)),{code:'SWAPLOTTING_DISCLAIMER_SCOPE'});
 const query={};Object.defineProperty(query,'extra',{get(){throw Error('query getter invoked');}});await assert.rejects(client.request(request({query})),{code:'SWAPLOTTING_DISCLAIMER_SCOPE'});
 await assert.rejects(client.request(request({body:{[Symbol('hidden')]:true}})),{code:'SWAPLOTTING_DISCLAIMER_SCOPE'});assert.equal(count,0);
});
test('HTTP200 JSON transformation then at most one native String decode permits exactly the proven disclaimer shapes',async()=>{
 for(const [body,type]of [[json({message:'text'}),'application/json'],[json(json({message:'text'})),'application/json'],[json({message:'text'}),'text/plain']]){
  const client=new ApiClient(config,{log(){},transport:async()=>new Response(body,{headers:{'Content-Type':type}})});assert.deepEqual((await client.request(request())).data,{...empty,message:'text'});
 }
 for(const [body,type]of [[json(json(json({message:'too deep'}))),'application/json'],[json(json({message:'quoted plain String'})),'text/plain'],['null','application/json'],['[]','application/json'],['{"message":false}','application/json']]){
  const client=new ApiClient(config,{log(){},transport:async()=>new Response(body,{headers:{'Content-Type':type}})});await assert.rejects(client.request(request()),{code:'SWAPLOTTING_DISCLAIMER_RESPONSE_UNRECOGNIZED'});
 }
});
test('only HTTP200 parses a disclaimer; non200 response bodies cannot be mistaken for accepted terms',async()=>{
 for(const status of [201,202,204,206,400,403,404,500]){
  const client=new ApiClient(config,{log(){},transport:async()=>new Response(status===204?null:'malformed private response',{status})});await assert.rejects(client.request(request()),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status);
 }
 const redirect=new ApiClient(config,{log(){},transport:async()=>new Response(null,{status:302,headers:{Location:'https://must-not-open.invalid/'}})});await assert.rejects(redirect.request(request()),{code:'UPSTREAM_REDIRECT'});
});
test('other generic routes retain their own business-error policy; typed disclaimer logic is not global',async()=>{
 const client=new ApiClient(config,{log(){},transport:async()=>Response.json({error:true,message:'generic service rejection',data:{message:'not disclaimer'}})});await assert.rejects(client.request({path:'Map/OtherRead',method:'GET',encoding:'none',auth:'optionalSession'}),{code:'UPSTREAM_REJECTED'});
});
test('shared response size/network/TLS policy remains bounded and diagnostics exclude text, credentials or returned URLs',async()=>{
 const logs=[];for(const responder of [()=>new Response('x',{headers:{'Content-Length':String(20*1024*1024+1)}}),()=>{throw Object.assign(Error('synthetic-swap-read-access private raw URL'),{code:'CERT_HAS_EXPIRED'});}]){
  const client=new ApiClient(config,{log:e=>logs.push(e),transport:responder});await assert.rejects(client.request(request({session:session()})),error=>['RESPONSE_TOO_LARGE','UPSTREAM_UNREACHABLE'].includes(error.code));
 }
 for(const value of ['synthetic-swap-read-access','synthetic-swap-read-refresh','private raw URL'])assert.equal(json(logs).includes(value),false);
});
test('shared HTTP401 invalidates only an owned session generation; anonymous status is a transport rejection',async()=>{
 const owned=session(),old=session();const client=new ApiClient(config,{log(){},transport:async()=>new Response('malformed private401',{status:401})});await assert.rejects(client.request(request({session:owned})),{code:'SESSION_EXPIRED'});assert.equal(owned.tokens,null);await assert.rejects(client.request(request()),{code:'UPSTREAM_REJECTED'});
 const newer=new ApiClient(config,{log(){},transport:async()=>{old.tokens={...token,accessToken:'new-generation'};return new Response('',{status:401});}});await assert.rejects(newer.request(request({session:old})),{code:'SESSION_CHANGED'});assert.equal(old.tokens.accessToken,'new-generation');
});

async function fixture(t,responder=url=>Response.json(url.pathname==='/Map/GetDisclaimer'?{message:' synthetic terms '}:[]),{expired=false}={}){
 const calls=[],logs=[],sessions=new SessionStore();const server=createServer({configuration:config,sessions,log:e=>logs.push(e),transport:async(url,init)=>{calls.push({url:new URL(url),init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-swap-read-user',token:{...token,expiredAt:expired?1:token.expiredAt}}});if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'synthetic-swap-read-refreshed'}});return responder(url,init);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:json(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const result=await response.json();if(result.csrfToken)state=result;return {status:response.status,result};}
 await send('/api/state');return {calls,logs,send,login:()=>send('/api/login',{username:'synthetic-swap-read-user',password:'synthetic-swap-read-password'}),run:(operationId,values)=>send('/api/execute',{operationId,values})};
}
test('HTTP anonymous disclaimer uses the existing read operation while Origin/CSRF and unknown-field rejection remain mandatory',async t=>{
 const f=await fixture(t);const reply=await f.run(ID,{});assert.equal(reply.status,200);assert.deepEqual(reply.result.result.data,{...empty,message:' synthetic terms '});assert.equal(f.calls[0].init.headers.Authorization,undefined);const before=f.calls.length;
 for(const headers of [{Origin:'https://other.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await f.send('/api/execute',{operationId:ID,values:{}},headers)).status,403);
 for(const key of ['nik','url','headers','latitude','longitude'])assert.equal((await f.run(ID,{[key]:'forged'})).status,400);assert.equal(f.calls.length,before);
});
test('HTTP office/region reads retain main empty filter and original selected KantorId, without new identity/write calls',async t=>{
 const office={KantorId:' original KantorId +& ',Nama:' Office ',TipeKantorId:3};const f=await fixture(t,url=>Response.json(url.pathname==='/legacy/Kantah'?[office]:[{Kode:'not-selected-code',WilayahId:' returned WilayahId ',Nama:' Region '} ]));await f.login();
 const offices=await f.run(O,{nama:'',tipeKantor:''});assert.equal(offices.status,200);assert.deepEqual(offices.result.result.data,[office]);assert.deepEqual([...f.calls.at(-1).url.searchParams],[['nama',''],['tipeKantor','']]);
 const regions=await f.run(R,{kantorid:offices.result.result.data[0].KantorId});assert.equal(regions.status,200);assert.deepEqual(regions.result.result.data,[{Kode:'not-selected-code',Nama:' Region ',TipeWilayah:null,WilayahId:' returned WilayahId '}]);assert.deepEqual([...f.calls.at(-1).url.searchParams],[['kantorid',office.KantorId],['nama','']]);assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/legacy/Kantah','/legacy/Wilayah']);assert.ok(f.calls.slice(1).every(c=>c.init.method==='GET'&&c.init.body===undefined));
});
test('HTTP optional-session refresh precedes disclaimer and public data redacts only actual request credential generations',async t=>{
 const f=await fixture(t,()=>Response.json({error:true,message:'synthetic-swap-read-refreshed synthetic-swap-read-refresh',url:null}),{expired:true});await f.login();const reply=await f.run(ID,{});assert.equal(reply.status,200);assert.equal(reply.result.result.data.message,'[REDACTED] [REDACTED]');assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/auth/refresh_token','/Map/GetDisclaimer']);assert.equal(f.calls.at(-1).init.headers.Authorization,'Bearer synthetic-swap-read-refreshed');for(const value of ['synthetic-swap-read-access','synthetic-swap-read-refresh','synthetic-swap-read-refreshed'])assert.equal(json(f.logs).includes(value),false);
});
test('HTTP pending logout suppresses a late disclaimer response instead of publishing retired account text',async t=>{
 const started=deferred(),release=deferred();const f=await fixture(t,async()=>{started.resolve();await release.promise;return Response.json({message:'late private terms'});});await f.login();const pending=f.run(ID,{});await started.promise;await f.send('/api/logout',{});release.resolve();const reply=await pending;assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
});
