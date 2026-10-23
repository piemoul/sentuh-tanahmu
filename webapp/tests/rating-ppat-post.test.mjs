import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,getOperation,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';
import {RATING_PPAT_POST_ID as ID,RATING_PPAT_POST_PATH as PATH,RATING_PPAT_POST_MESSAGE as MISSING,RATING_PPAT_POST_FAILURE as FAILED,prepareRatingPpatPostValues as prepare,serializeRatingPpatPost as serialize,ratingPpatPostFailure as failure,decodeRatingPpatPostValue as decode,decodeRatingPpatPostBytes as bytes} from '../private/rating-ppat-post.mjs';

// All IDs, credentials, responses and writes below are synthetic. Transport is
// injected; the HTTP handler test listens on loopback only. No provider calls.
const json=JSON.stringify,scope={code:'RATING_PPAT_POST_SCOPE'};
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-rating-post-application'};
const token={tokenType:'Bearer',accessToken:'synthetic-rating-post-access',refreshToken:'synthetic-rating-post-refresh',expiredAt:4_000_000_000};
const session=()=>({active:true,user:{username:'synthetic-rating-post-user'},tokens:{...token}});
const values=(patch={})=>({aktaId:' original Akta +&/ ',PertanyaanRatingPPATId:[' choice B ','choice A',' choice B ',''],...patch});
const request=(patch={})=>({path:PATH,query:{},method:'POST',encoding:'json',auth:'session',body:values(),files:[],session:session(),...patch});
const client=transport=>new ApiClient(config,{transport,log:()=>{}});
const response=(body={error:false,message:'SINTETIS diterima'},status=200)=>Response.json(body,{status});

test('selected Akta and dense answer IDs preserve literal Strings, duplicates and insertion order in a fresh ordered body',()=>{
 const source=values({aktaId:' \0日本語\\\n ',PertanyaanRatingPPATId:[' 2 ','1',' 2 ','','\0','<img src=x>']});
 const result=prepare(source);assert.equal(Object.getPrototypeOf(result),null);assert.deepEqual(Object.keys(result),['aktaId','PertanyaanRatingPPATId']);
 assert.equal(result.aktaId,source.aktaId);assert.deepEqual(result.PertanyaanRatingPPATId,source.PertanyaanRatingPPATId);assert.notEqual(result.PertanyaanRatingPPATId,source.PertanyaanRatingPPATId);
 assert.deepEqual(Object.entries(prepare({PertanyaanRatingPPATId:[],aktaId:''})),[['aktaId',''],['PertanyaanRatingPPATId',[]]]);
 assert.deepEqual(Object.entries(prepare(Object.assign(Object.create(null),source))),Object.entries(result));
 result.PertanyaanRatingPPATId[0]='changed';assert.equal(source.PertanyaanRatingPPATId[0],' 2 ');
});

test('preparation rejects wrong/missing/extra/prototype/symbol fields without invoking value accessors',()=>{
 let reads=0;
 const cases=[undefined,null,[],true,1,'x',{},values({aktaId:null}),values({aktaId:1}),values({aktaId:undefined}),values({PertanyaanRatingPPATId:null}),values({PertanyaanRatingPPATId:'[]'}),{...values(),other:1},{...values(),[Symbol('extra')]:1},Object.assign(Object.create({}),values())];
 for(const value of cases)assert.throws(()=>prepare(value),scope);
 for(const key of ['aktaId','PertanyaanRatingPPATId']){const input=values();Object.defineProperty(input,key,{get(){reads++;return 'never';}});assert.throws(()=>prepare(input),scope);}
 const extra=values();Object.defineProperty(extra,'foreign',{get(){reads++;return 'never';}});assert.throws(()=>prepare(extra),scope);assert.equal(reads,0);
});

test('sparse, accessor, coercible, numeric, object and extra-property answer lists fail before serialization',()=>{
 let reads=0;const getter=['x'];Object.defineProperty(getter,'0',{get(){reads++;return 'never';}});
 const extended=['x'];extended.extra='never';const symbol=['x'];symbol[Symbol('extra')]=1;
 const coercible={toString(){reads++;return 'never';}},custom=['x'];Object.setPrototypeOf(custom,{});
 for(const list of [new Array(1),new Array(4_294_967_295),[undefined],[null],[1],[true],[[]],[{}],[coercible],getter,extended,symbol,custom])assert.throws(()=>prepare(values({PertanyaanRatingPPATId:list})),scope);
 assert.equal(reads,0);
});

test('scoped serializer emits exactly one ordered JSON object and never sorts, deduplicates, trims or URL-encodes values',()=>{
 const input={PertanyaanRatingPPATId:['2','1','2','','\n','"\\日本語'],aktaId:' A +&/\0 '};
 const encoded=serialize(input);assert.equal(encoded,'{"aktaId":" A +&/\\u0000 ","PertanyaanRatingPPATId":["2","1","2","","\\n","\\\"\\\\日本語"]}');assert.deepEqual(JSON.parse(encoded),{aktaId:input.aktaId,PertanyaanRatingPPATId:input.PertanyaanRatingPPATId});
});

test('normal response keeps inverted bool and raw message separate, including the misleading native fallback text on true success',()=>{
 assert.deepEqual(decode({error:false,message:' exact '}),{success:true,message:' exact '});
 assert.deepEqual(decode({error:true,message:'success-looking text'}),{success:false,message:'success-looking text'});
 assert.deepEqual(decode({error:false}),{success:true,message:MISSING});
 for(const input of [{},{error:null,message:null},{message:MISSING}])assert.deepEqual(decode(input),{success:false,message:MISSING});
 for(const text of ['',' ','<img src=x onerror=bad>','false'])assert.deepEqual(decode({error:false,message:text}),{success:true,message:text});
 assert.deepEqual(decode(Object.assign(Object.create(null),{error:false,message:'null prototype'})),{success:true,message:'null prototype'});
});

test('response malformed root/known fields take the exact catch fallback and unconsumed fields are not evaluated',()=>{
 let reads=0;
 for(const input of [null,[],1,true,'{"error":false}',JSON.rawJSON('1'),{error:undefined},{error:0},{error:'false'},{error:{}},{message:undefined},{message:1},{message:[]},Object.create({error:false})])assert.deepEqual(decode(input),failure());
 for(const key of ['error','message']){const input={error:false,message:'safe'};Object.defineProperty(input,key,{get(){reads++;return 'never';}});assert.deepEqual(decode(input),failure());}
 const good={error:false,message:'safe'};Object.defineProperty(good,'data',{get(){reads++;throw Error('never');}});assert.deepEqual(decode(good),{success:true,message:'safe'});assert.equal(reads,0);
 assert.deepEqual(failure(),{success:false,message:FAILED});assert.notEqual(failure(),failure());
});

test('every accepted2xx JSON MIME uses the direct object once; text/plain and outer JSON String never get unwrapped',()=>{
 const body={error:false,message:'SINTETIS201'};
 for(const status of [200,201,202,206,299])for(const mime of ['application/json','text/json','APPLICATION/JSON; charset=utf-8','application/problem+json','image/x+json'])assert.deepEqual(bytes(Buffer.from(json(body)),mime,status),{success:true,message:body.message});
 for(const mime of ['text/plain','invalid-mime',''])assert.deepEqual(bytes(Buffer.from(json(body)),mime,200),failure());
 for(const text of [json(json(body)),json(json(json(body))),'null','true','[]','1'])assert.deepEqual(bytes(Buffer.from(text),'application/json'),failure());
 for(const status of [0,null,199,300,400,500])assert.deepEqual(bytes(Buffer.from(json(body)),'application/json',status),failure());
});

test('fatal JSON UTF8, malformed JSON and empty204 bodies cannot report successful storage',()=>{
 const valid=Buffer.from('{"error":false,"message":"yes"}');assert.deepEqual(bytes(Buffer.concat([Buffer.from([239,187,191]),valid]),'application/json'),{success:true,message:'yes'});
 const invalidString=Buffer.concat([Buffer.from('{"error":false,"message":"'),Buffer.from([255]),Buffer.from('"}')]);
 for(const raw of [Buffer.alloc(0),Buffer.from(' '),Buffer.from('{bad}'),Buffer.from([255]),invalidString])assert.deepEqual(bytes(raw,'application/json',204),failure());
 assert.deepEqual(bytes(invalidString,'text/plain'),failure());
});

test('catalog enables only the selected Rating writer, corrects GET reason only and keeps other167 records/prior14 write IDs intact beside later quota, personal Swaplotting, Berkas Rating, Buku Tamu and Tanya deltas',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/rating-ppat-write-baseline.json',import.meta.url)));
 const oldSource=fs.readFileSync(new URL('../../environment/rating-ppat-write-before/webapp/private/operations.mjs',import.meta.url),'utf8'),start=oldSource.indexOf('const operationData = ')+'const operationData = '.length,end=oldSource.indexOf('// Appended to generated operationData/serviceData');
 const oldOperations=JSON.parse(oldSource.slice(start,end).trim().replace(/;$/,'')),readID='get-ratingppat-getratingquestions-d1d6bc';
 const before=new Map(baseline.catalog.operations.map(op=>[op.id,op.sha256]));
 const changed=OPERATIONS.filter(op=>createHash('sha256').update(json(op)).digest('hex')!==before.get(op.id)).map(op=>op.id);assert.deepEqual(changed.sort(),[ID,readID,'post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4','get-tanyajawab-gettanyajawabberkas-d2826c'].sort());
 const oldRead=oldOperations.find(op=>op.id===readID),newRead=getOperation(readID);assert.notEqual(newRead.reason,oldRead.reason);assert.deepEqual({...newRead,reason:oldRead.reason},oldRead);
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,95);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,21);
 assert.deepEqual(OPERATIONS.filter(op=>op.enabled&&op.effect==='write'&&![ID,'post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4'].includes(op.id)).map(op=>op.id),oldOperations.filter(op=>op.enabled&&op.effect==='write').map(op=>op.id));
 const op=getOperation(ID);for(const [key,value]of Object.entries({enabled:true,supported:true,inspectOnly:false,auth:'session',serviceId:'main',method:'POST',path:PATH,encoding:'json',effect:'write',mutates:true,requiresConfirmation:true,readiness:'ready_unverified',serverAcceptance:'untested'}))assert.equal(op[key],value,key);
 assert.equal(op.evidence.nativeProofSha256,'67a9a026369f288352b435e6a09facc9ee87167dfa1ce154d2f5da55fb61bd52');assert.deepEqual(op.fields.map(field=>field.path),['aktaId','PertanyaanRatingPPATId']);assert.equal(op.fields[1].type,'array');
});

test('registry preparation preserves exact selected fields and confirmation without creating a general nested-model adapter',()=>{
 assert.throws(()=>prepareOperation(ID,values()),{code:'LOGIN_REQUIRED'});
 const result=prepareOperation(ID,values({aktaId:'',PertanyaanRatingPPATId:[]}),{authenticated:true});
 assert.equal(result.service.baseUrl,'https://sentuh.atrbpn.go.id/');assert.deepEqual({method:result.method,path:result.path,encoding:result.encoding,auth:result.auth,clientProfile:result.clientProfile,effect:result.effect,requiresConfirmation:result.requiresConfirmation,query:result.query,files:result.files},{method:'POST',path:PATH,encoding:'json',auth:'session',clientProfile:'main',effect:'write',requiresConfirmation:true,query:{},files:[]});assert.equal(serialize(result.body),'{"aktaId":"","PertanyaanRatingPPATId":[]}');
 for(const input of [{...values(),nik:'foreign'},{...values(),files:[]},values({PertanyaanRatingPPATId:[1]})])assert.throws(()=>prepareOperation(ID,input,{authenticated:true}),scope);
 assert.throws(()=>prepareOperation('post-review-last-user-review-d42f30',{}, {authenticated:true}),{code:'OPERATION_INSPECT_ONLY'});
});

test('actual client sends fixed ordered JSON, stored bearer and text/plain Accept with no extra identity/location/query/file fields',async()=>{
 const calls=[],logs=[],c=new ApiClient(config,{log:entry=>logs.push(entry),transport:async(url,init)=>{calls.push({url,init});return response();}});
 const input=request({body:{PertanyaanRatingPPATId:['2','1','2',''],aktaId:'原本 +&/ '}}),result=await c.request(input);
 assert.equal(result.status,200);assert.deepEqual(result.data,{success:true,message:'SINTETIS diterima'});assert.equal(result.contentType,'application/json');assert.equal(calls.length,1);
 const {url,init}=calls[0];assert.equal(url.href,'https://sentuh.atrbpn.go.id/RatingPPAT/PostRatingPPAT');assert.equal(init.method,'POST');assert.equal(init.body,'{"aktaId":"原本 +&/ ","PertanyaanRatingPPATId":["2","1","2",""]}');assert.equal(init.headers.Accept,'text/plain');assert.equal(init.headers['Content-Type'],'application/json');assert.equal(init.headers.Authorization,'Bearer '+token.accessToken);
 assert.equal(Object.keys(JSON.parse(init.body)).join(','),'aktaId,PertanyaanRatingPPATId');for(const secret of [token.accessToken,token.refreshToken,input.body.aktaId])assert.equal(json(logs).includes(secret),false);
});

test('direct-client dispatch rejects foreign origins/profiles, aliases, query/body accessors and files before forwarding',async()=>{
 let calls=0,reads=0;const c=client(async()=>{calls++;return response();});
 const query={get x(){reads++;return 'never';}},body=values();Object.defineProperty(body,'aktaId',{get(){reads++;return 'never';}});
 for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{base:'https://sentuh.atrbpn.go.id/prefix/'},{path:'/'+PATH},{path:PATH.toLowerCase()},{path:'RatingPPAT/%50ostRatingPPAT'},{path:PATH+'?x=1'},{path:PATH+'#x'},{method:'GET'},{method:'PUT'},{encoding:'form'},{encoding:'multipart'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{query:{id:'x'}},{query:null},{query},{body},{body:{aktaId:'x',PertanyaanRatingPPATId:'[]'}},{body:{...values(),reviewType:'other'}},{files:[{key:'file',file:new File(['synthetic'],'x.png')}]}])await assert.rejects(c.request(request(patch)),scope);
 assert.equal(calls,0);assert.equal(reads,0);
});

test('2xx business rejection and malformed bodies return false tuples while201 true outcomes remain permitted',async()=>{
 for(const status of [200,201,202,299])assert.deepEqual((await client(async()=>response({error:false,message:'yes'},status)).request(request())).data,{success:true,message:'yes'});
 for(const [res,expected] of [[response({error:true,message:'server rejected'}),{success:false,message:'server rejected'}],[response({error:1,message:'wrong type'}),failure()],[new Response('{bad}',{headers:{'Content-Type':'application/json'}}),failure()],[new Response('{"error":false}',{headers:{'Content-Type':'text/plain'}}),failure()],[new Response(null,{status:204,headers:{'Content-Type':'application/json'}}),failure()]]){
  const result=await client(async()=>res).request(request());assert.deepEqual(result.data,expected);
 }
});

test('missing or closed local sessions fail before transport; provider401 keeps expiry and stale-token replacement guards',async()=>{
 let calls=0;const c=client(async()=>{calls++;return response();});await assert.rejects(c.request(request({session:undefined})),{code:'AUTH_REQUIRED'});await assert.rejects(c.request(request({session:{...session(),active:false}})),{code:'SESSION_EXPIRED'});assert.equal(calls,0);
 const current=session();await assert.rejects(client(async()=>response({},401)).request(request({session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
 const stale=session(),newTokens={...token,accessToken:'synthetic-new-generation'};await assert.rejects(client(async()=>{stale.tokens=newTokens;return response({},401);}).request(request({session:stale})),{code:'SESSION_CHANGED'});assert.equal(stale.tokens,newTokens);
});

test('inflight account/profile/token replacement or logout cannot deliver an old successful Rating result',async()=>{
 for(const mutate of [owner=>owner.user={username:'synthetic-other'},owner=>owner.tokens={...token},owner=>owner.active=false]){
  const owner=session();let release;const wait=new Promise(resolve=>release=resolve);let calls=0;
  const pending=client(async()=>{calls++;await wait;return response();}).request(request({session:owner}));mutate(owner);release();await assert.rejects(pending,{code:'SESSION_CHANGED'});assert.equal(calls,1);
 }
});

test('transport errors, non2xx, redirects and browser response bounds stay explicit and never automatically retry',async()=>{
 let calls=0;await assert.rejects(client(async()=>{calls++;throw Object.assign(new Error('synthetic private body'),{code:'ECONNREFUSED'});}).request(request()),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
 for(const [status,code] of [[302,'UPSTREAM_REDIRECT'],[403,'UPSTREAM_REJECTED'],[500,'UPSTREAM_REJECTED']]){let count=0;await assert.rejects(client(async()=>{count++;return new Response(null,{status});}).request(request()),{code});assert.equal(count,1);}
 await assert.rejects(client(async()=>new Response(null,{status:200,headers:{'Content-Length':String(20*1024*1024+1)}})).request(request()),{code:'RESPONSE_TOO_LARGE'});
});

test('loopback HTTP execute requires session, same Origin, CSRF and explicit confirmation before one synthetic write',async t=>{
 const calls=[],server=createServer({configuration:config,log:()=>{},transport:async(url,init)=>{calls.push({url,init});if(url.pathname==='/auth/signin')return response({data:{username:'synthetic-rating-post-user',token:{...token}}});assert.equal(url.pathname,'/'+PATH);return response({error:false,message:'SINTETIS written'},201);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base='http://127.0.0.1:'+server.address().port;let reply=await fetch(base+'/api/state'),cookie=reply.headers.get('set-cookie').split(';')[0],state=await reply.json();
 const send=(path,body,headers={})=>fetch(base+path,{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json',...headers},body:json(body)});
 const input={operationId:ID,values:values(),confirm:true};assert.equal((await send('/api/execute',input)).status,401);assert.equal(calls.length,0);
 reply=await send('/api/login',{username:'synthetic-rating-post-user',password:'synthetic-rating-post-password'});assert.equal(reply.status,200);cookie=reply.headers.get('set-cookie').split(';')[0];state=await reply.json();assert.equal(calls.length,1);
 const before=calls.length;
 for(const headers of [{Origin:'https://untrusted.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await send('/api/execute',input,headers)).status,403);
 reply=await send('/api/execute',{...input,confirm:false});assert.equal(reply.status,409);assert.equal((await reply.json()).error.code,'CONFIRMATION_REQUIRED');
 assert.equal((await send('/api/execute',{...input,values:{...values(),nik:'foreign'}})).status,400);assert.equal(calls.length,before);
 const uploaded=new FormData();uploaded.set('operationId',ID);uploaded.set('values',json(values()));uploaded.set('confirm','true');uploaded.set('file',new File(['synthetic only'],'unrequested.png'));
 const uploadReply=await fetch(base+'/api/execute',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken},body:uploaded});assert.equal(uploadReply.status,400);assert.equal(calls.length,before);
 reply=await send('/api/execute',input);assert.equal(reply.status,200);const actual=await reply.json();assert.equal(actual.result.status,201);assert.deepEqual(actual.result.data,{success:true,message:'SINTETIS written'});assert.equal(calls.length,before+1);assert.equal(calls.at(-1).init.body,serialize(input.values));assert.equal(calls.at(-1).init.headers.Accept,'text/plain');
 reply=await send('/api/logout',{});const logoutCookie=reply.headers.get('set-cookie').split(';')[0],logoutState=await reply.json(),loggedOut=calls.length;
 assert.equal((await send('/api/execute',input)).status,403);cookie=logoutCookie;state=logoutState;assert.equal((await send('/api/execute',input)).status,401);assert.equal(calls.length,loggedOut);
});
