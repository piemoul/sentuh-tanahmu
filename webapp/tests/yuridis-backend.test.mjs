import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ApiClient} from '../private/api-client.mjs';
import * as registry from '../private/operations.mjs';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
import {YURIDIS_PATH,YURIDIS_READ_ID,YURIDIS_REVIEW_PATH,YURIDIS_REVIEW_ID,YURIDIS_REVIEW_TYPE,decodeYuridisLastReviewJson,prepareYuridisFeed,prepareYuridisLastReview} from '../private/yuridis-response.mjs';
import {prepareLostReviewPostValues,prepareYuridisReviewPostValues,prepareSelectedReviewPostValues,serializeLostReviewPost,serializeSelectedReviewPost,LOST_REVIEW_POST_TYPE} from '../private/lost-review-post.mjs';

// Every identity, record, response and POST in this file is synthetic. All
// transport is injected; only the actual local HTTP handler listens on loopback.
const json=JSON.stringify,POST='post-review-post-deb030';
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-yuridis-application'};
const token={tokenType:'Bearer',accessToken:'synthetic-yuridis-access',refreshToken:'synthetic-yuridis-refresh',expiredAt:4_000_000_000};
const session=()=>({active:true,user:{username:'synthetic-yuridis-user'},tokens:{...token}});
const client=responder=>new ApiClient(config,{log:()=>{},transport:responder});
const feed=(patch={})=>({path:YURIDIS_PATH,query:{kantorId:' original office +&/ '},method:'GET',encoding:'none',body:{},files:[],auth:'optionalSession',...patch});
const review=(patch={})=>({path:YURIDIS_REVIEW_PATH,query:{},method:'POST',encoding:'form',body:{reviewType:YURIDIS_REVIEW_TYPE,contentId:' original persil +&/~* '},files:[],auth:'session',session:session(),...patch});
const values=(patch={})=>({contentId:' original persil +&/~* ',reviewType:YURIDIS_REVIEW_TYPE,comment:'raw\ncomment',rating:4,...patch});
const post=(patch={})=>({path:'review/post',query:{},method:'POST',encoding:'multipart',body:values(),files:[],auth:'session',session:session(),...patch});
const nativeReview={reviewId:'review',rating:4,comment:'raw <b>text</b>',createdAt:'raw date',reviewPhotos:[]};

test('catalog retains the Yuridis read/feed/post plus later Rating writer and GET reason deltas',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/yuridis-runtime-baseline.json',import.meta.url)));
 const before=new Map(baseline.catalog.operations.map(op=>[op.id,op.sha256]));
 const changed=registry.OPERATIONS.filter(op=>createHash('sha256').update(json(op)).digest('hex')!==before.get(op.id)).map(op=>op.id).sort();
 assert.deepEqual(changed,[YURIDIS_READ_ID,YURIDIS_REVIEW_ID,POST,'post-ratingppat-postratingppat-d86e10','get-ratingppat-getratingquestions-d1d6bc','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4','get-tanyajawab-gettanyajawabberkas-d2826c'].sort());
 assert.equal(registry.OPERATIONS.length,176);assert.equal(registry.OPERATIONS.filter(op=>op.enabled).length,95);
 assert.equal(registry.OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(registry.OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,21);
 const prepared=registry.prepareOperation(YURIDIS_REVIEW_ID,{contentId:' raw '},{authenticated:true});
 assert.deepEqual(Object.entries(prepared.body),[['reviewType',YURIDIS_REVIEW_TYPE],['contentId',' raw ']]);assert.equal(prepared.effect,'read');assert.equal(prepared.requiresConfirmation,false);
 assert.throws(()=>registry.prepareOperation(YURIDIS_REVIEW_ID,{contentId:'x'}),{code:'LOGIN_REQUIRED'});
 assert.throws(()=>registry.prepareOperation('post-review-last-user-review-d42f30',{contentId:'x'},{authenticated:true}),{code:'OPERATION_INSPECT_ONLY'});
 assert.equal(registry.prepareOperation(YURIDIS_READ_ID,{kantorId:''}).query.kantorId,'');
});

test('request preparers preserve original Strings, fixed scope and field order without evaluating accessors',()=>{
 assert.deepEqual(prepareYuridisFeed({kantorId:' \0 '}),{kantorId:' \0 '});
 assert.deepEqual(prepareYuridisLastReview({contentId:''}),{reviewType:YURIDIS_REVIEW_TYPE,contentId:''});
 for(const value of [{kantorId:1},{kantorId:'x',extra:1},null,[],Object.assign(Object.create({}),{kantorId:'x'})])assert.throws(()=>prepareYuridisFeed(value),{code:'YURIDIS_READ_SCOPE'});
 for(const value of [{contentId:'x',pageNumber:'1'},{contentId:'x',reviewType:LOST_REVIEW_POST_TYPE},{contentId:1},{contentId:null},{persilId:'x'},Object.assign({contentId:'x'},{[Symbol('x')]:1})])assert.throws(()=>prepareYuridisLastReview(value),{code:'YURIDIS_REVIEW_SCOPE'});
 let getters=0;for(const [fn,key,base]of [[prepareYuridisFeed,'kantorId',{}],[prepareYuridisLastReview,'contentId',{}],[prepareYuridisLastReview,'reviewType',{contentId:'x'}]]){Object.defineProperty(base,key,{enumerable:true,get(){getters++;return 'x';}});assert.throws(()=>fn(base));}assert.equal(getters,0);
});

test('last-user raw decoder rejects numeric marker roots and never calls input coercion hooks',()=>{
 for(const text of ['1','0','1.0','1e3','true','null','[]','"{}"','invalid'])assert.throws(()=>decodeYuridisLastReviewJson(text),{code:'YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED'});
 let coerced=0;for(const value of [1,null,{},[],{toString(){coerced++;return '{}';}}])assert.throws(()=>decodeYuridisLastReviewJson(value));assert.equal(coerced,0);
 assert.deepEqual(decodeYuridisLastReviewJson('{"data":null,"error":[],"totalRecords":1.0,"pageSize":{}}'),{data:[]});
 assert.deepEqual(decodeYuridisLastReviewJson('{"message":[],"unknown":1e999}'),{data:[]});
});

test('conditional singleton conversion retains exact nested integer lexemes and nullable shared review/photo models',()=>{
 const decoded=decodeYuridisLastReviewJson('{"data":{"rating":9223372036854775807,"reviewPhotos":[{"mediaUrl":" raw "},{}]},"error":true,"pageSize":9223372036854775807}');
 assert.equal(decoded.data.length,1);assert.equal(decoded.data[0].rating,'9223372036854775807');assert.deepEqual(decoded.data[0].reviewPhotos,[{mediaId:null,mediaUrl:' raw ',createdAt:null},{mediaId:null,mediaUrl:null,createdAt:null}]);
 for(const text of ['{"data":[]}','{"data":1}','{"data":true}','{"data":"{}"}','{"data":{"rating":4.0}}','{"data":{"rating":4e0}}','{"data":{"rating":"4"}}','{"data":{},"error":1}','{"data":{},"pageNumber":1e0}','{"data":{"reviewPhotos":[null]}}'])assert.throws(()=>decodeYuridisLastReviewJson(text));
});

test('feed transport uses optional session, one encoded office component and exactHTTP200 typed11field projection',async()=>{
 const observed=[];const c=client(async(url,init)=>{observed.push({url,init});return Response.json({error:true,message:'ignored',data:[{persilId:'original',luasPersil:10},{}]});});
 const result=await c.request(feed());assert.equal(result.status,200);assert.equal(result.data.data.length,2);assert.equal(result.data.data[0].persilId,'original');assert.equal(Object.keys(result.data.data[0]).length,11);assert.equal(result.data.data[1].luasPersil,null);
 assert.equal(observed[0].url.searchParams.get('kantorId'),' original office +&/ ');assert.equal([...observed[0].url.searchParams].length,1);assert.equal(observed[0].init.body,undefined);assert.equal(observed[0].init.headers.Authorization,undefined);
 await c.request(feed({session:session()}));assert.equal(observed[1].init.headers.Authorization,'Bearer '+token.accessToken);
 for(const status of [201,202,204,299,400,403,503]){let calls=0;await assert.rejects(client(async()=>{calls++;return new Response(null,{status});}).request(feed()),{code:'UPSTREAM_REJECTED'});assert.equal(calls,1);}
});

test('feed service decodes a plain String once or one JSON-transformed String once, never repeatedly',async()=>{
 const body='{"error":true,"data":[{"luasPersil":9223372036854775807}]}';
 for(const mime of ['text/plain','application/json','text/json','application/problem+json']){
  const result=await client(async()=>new Response(body,{headers:{'Content-Type':mime}})).request(feed());assert.equal(result.data.data[0].luasPersil,'9223372036854775807');
 }
 assert.equal((await client(async()=>Response.json(body)).request(feed())).data.data[0].luasPersil,'9223372036854775807');
 await assert.rejects(client(async()=>new Response(json(body),{headers:{'Content-Type':'text/plain'}})).request(feed()),{code:'YURIDIS_RESPONSE_UNRECOGNIZED'});
 await assert.rejects(client(async()=>Response.json(json(body))).request(feed()),{code:'YURIDIS_RESPONSE_UNRECOGNIZED'});
 for(const text of ['{"data":null}','{"message":[]}','{"data":[{"luasPersil":1.0}]}'])await assert.rejects(client(async()=>new Response(text,{headers:{'Content-Type':'application/json'}})).request(feed()));
});

test('last-user transport sends exactly the original fixed form and accepts all returned2xx without extraHTTP200 gate',async()=>{
 for(const status of [200,201,202,206,299]){
  let observed;const result=await client(async(url,init)=>{observed={url,init};return Response.json({error:true,data:nativeReview},{status});}).request(review());
  assert.equal(result.status,status);assert.deepEqual(result.data,{data:[nativeReview]});assert.equal(observed.url.pathname,'/'+YURIDIS_REVIEW_PATH);assert.equal(observed.url.search,'');assert.equal(observed.init.headers.Authorization,'Bearer '+token.accessToken);
  assert.equal(observed.init.body,'reviewType=sertipikatSaya&contentId=+original+persil+%2B%26%2F~%2A+');
 }
 const empty=await client(async()=>Response.json({data:null,error:'ignored'})).request(review());assert.deepEqual(empty.data,{data:[]});
 await assert.rejects(client(async()=>new Response(null,{status:204,headers:{'Content-Type':'application/json'}})).request(review()),{code:'YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED'});
});

test('last-user response requires transformedJSON Map and does not unwrap Strings or accept raw arrays',async()=>{
 for(const mime of ['application/json','text/json','text/custom+json','APPLICATION/JSON; charset=utf-8'])assert.deepEqual((await client(async()=>new Response(json({data:nativeReview}),{headers:{'Content-Type':mime}})).request(review())).data,{data:[nativeReview]});
 for(const mime of ['text/plain','application/octet-stream','application/jsonish','not-a-mime'])await assert.rejects(client(async()=>new Response('{"data":null}',{headers:{'Content-Type':mime}})).request(review()),{code:'YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED'});
 for(const body of [json('{"data":null}'),'{"data":[]}','1','true','null','{"data":{},"error":"bad"}'])await assert.rejects(client(async()=>new Response(body,{headers:{'Content-Type':'application/json'}})).request(review()),{code:'YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED'});
});

test('Yuridis endpoint guards reject wrong client/origin/path/body/auth/query/files before transport or accessors',async()=>{
 let calls=0;const c=client(async()=>{calls++;return Response.json({data:null});});
 for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{path:'/review/last_user_review'},{path:YURIDIS_REVIEW_PATH+'?x=1'},{path:YURIDIS_REVIEW_PATH+'#x'},{method:'GET'},{encoding:'json'},{auth:'optionalSession'},{clientProfile:'queue-read'},{query:{x:'1'}},{files:[{key:'x',file:new File(['x'],'x.png')}]},{body:{reviewType:'other',contentId:'p'}},{body:{contentId:'p',reviewType:YURIDIS_REVIEW_TYPE}},{body:{reviewType:YURIDIS_REVIEW_TYPE,contentId:1}}])await assert.rejects(c.request(review(patch)));
 for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{path:'/announcement/yuridis_byKantor'},{path:YURIDIS_PATH+'?x=1'},{path:YURIDIS_PATH+'#x'},{method:'POST'},{auth:'none'},{body:{x:1}},{query:{kantorId:1}},{query:{kantorId:'p',other:'1'}},{files:[{}]}])await assert.rejects(c.request(feed(patch)));
 let getters=0;for(const [kind,key,patch]of [['review','contentId',{reviewType:YURIDIS_REVIEW_TYPE}],['feed','kantorId',{}]]){Object.defineProperty(patch,key,{enumerable:true,get(){getters++;return 'x';}});await assert.rejects(c.request(kind==='review'?review({body:patch}):feed({query:patch})));}assert.equal(getters,0);assert.equal(calls,0);
});

test('session/redirect/network failures remain errors with no retry or token substitution',async()=>{
 await assert.rejects(client(async()=>{throw Error('must not send');}).request(review({session:undefined})),{code:'AUTH_REQUIRED'});
 for(const status of [403,429,503]){let calls=0;await assert.rejects(client(async()=>{calls++;return Response.json({data:null},{status});}).request(review()),{code:'UPSTREAM_REJECTED'});assert.equal(calls,1);}
 await assert.rejects(client(async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.invalid'}})).request(review()),{code:'UPSTREAM_REDIRECT'});
 let calls=0;await assert.rejects(client(async()=>{calls++;throw Object.assign(Error('synthetic private details'),{code:'ECONNRESET'});}).request(review()),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
 const current=session();await assert.rejects(client(async()=>Response.json({data:null},{status:401})).request(review({session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
 const changed=session(),replacement={...token,accessToken:'synthetic-replacement'};await assert.rejects(client(async()=>{changed.tokens=replacement;return Response.json({data:null},{status:401});}).request(review({session:changed})),{code:'SESSION_CHANGED'});assert.equal(changed.tokens,replacement);
});

test('new selected composer allows only the two proved contexts and leaves lost-only helpers strict',async()=>{
 assert.equal(prepareYuridisReviewPostValues(values()).reviewType,YURIDIS_REVIEW_TYPE);
 assert.equal(prepareSelectedReviewPostValues(values()).reviewType,YURIDIS_REVIEW_TYPE);
 assert.equal(prepareSelectedReviewPostValues(values({reviewType:LOST_REVIEW_POST_TYPE})).reviewType,LOST_REVIEW_POST_TYPE);
 assert.equal(prepareLostReviewPostValues({contentId:'x',comment:'',rating:1}).reviewType,LOST_REVIEW_POST_TYPE);
 assert.throws(()=>prepareLostReviewPostValues(values()),{code:'LOST_REVIEW_POST_SCOPE'});
 for(const type of ['other','sertipikatSaya ',null,1])assert.throws(()=>prepareSelectedReviewPostValues(values({reviewType:type})),{code:'LOST_REVIEW_POST_SCOPE'});
 let getters=0;const input=values();Object.defineProperty(input,'reviewType',{get(){getters++;return YURIDIS_REVIEW_TYPE;}});assert.throws(()=>prepareSelectedReviewPostValues(input));assert.equal(getters,0);
 const photos=[{key:'reviewPhoto1',file:new File([new Uint8Array([0,10,255])],'raw.HEIC',{type:'image/jpeg'})}];
 const packed=await serializeSelectedReviewPost(values(),photos,'synthetic-boundary'),parsed=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':packed.contentType},body:packed.body}).formData();
 assert.deepEqual([...parsed.keys()],['contentId','reviewType','comment','rating','reviewPhoto1']);assert.equal(parsed.get('reviewType'),YURIDIS_REVIEW_TYPE);assert.equal(parsed.get('contentId'),values().contentId);assert.equal(parsed.get('reviewPhoto1').type,'image/heic');assert.deepEqual(new Uint8Array(await parsed.get('reviewPhoto1').arrayBuffer()),new Uint8Array([0,10,255]));
 assert.ok(packed.body.includes(Buffer.from('raw\ncomment')));assert.ok(!packed.body.includes(Buffer.from('raw\r\ncomment')));
 await assert.rejects(serializeLostReviewPost(values(),[],'synthetic-boundary'),{code:'LOST_REVIEW_POST_SCOPE'});
});

test('Yuridis writer uses original scope and status-only false-success while preserving malformed/late-session errors',async()=>{
 let sent;const result=await client(async(url,init)=>{sent={url,init};return Response.json({error:true,data:'ignored'});}).request(post());assert.equal(result.data,false);assert.equal(result.status,200);
 const data=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':sent.init.headers['Content-Type']},body:sent.init.body}).formData();assert.equal(data.get('reviewType'),YURIDIS_REVIEW_TYPE);assert.equal(data.get('contentId'),values().contentId);
 assert.equal((await client(async()=>Response.json({},{status:201})).request(post())).data,true);
 await assert.rejects(client(async()=>new Response('bad',{headers:{'Content-Type':'application/json'}})).request(post()),{code:'INVALID_REVIEW_POST_RESPONSE'});
 const changing=session();await assert.rejects(client(async()=>{changing.user={username:'changed'};return Response.json({});}).request(post({session:changing})),{code:'SESSION_CHANGED'});
 let calls=0;await assert.rejects(client(async()=>{calls++;return Response.json({});}).request(post({body:values({reviewType:'other'})})),{code:'LOST_REVIEW_POST_SCOPE'});assert.equal(calls,0);
});

test('actual loopback handler preserves auth, Origin/CSRF, confirmation, typed read and duplicate multipart rejection',async t=>{
 const calls=[],sessions=new SessionStore(),server=createServer({configuration:config,sessions,log:()=>{},transport:async(url,init)=>{
  calls.push({url,init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-yuridis-user',token}});
  if(url.pathname==='/'+YURIDIS_PATH)return Response.json({error:true,data:[{persilId:'read-original',luasPersil:11}]});
  if(url.pathname==='/'+YURIDIS_REVIEW_PATH)return Response.json({error:true,data:nativeReview},{status:201});
  if(url.pathname==='/review/post')return Response.json({error:true,message:'ignored'});
  throw Error('Unexpected synthetic route');
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base='http://127.0.0.1:'+server.address().port;let cookie='',state;
 async function send(route,body,headers={}){const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state.csrfToken,...(body instanceof FormData?{}:{'Content-Type':'application/json'})}),...headers},...(body===undefined?{}:{body:body instanceof FormData?body:json(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const data=await response.json();if(data.csrfToken)state=data;return{response,data};}
 const execute=(operationId,vals,confirm)=>({operationId,values:vals,...(confirm===undefined?{}:{confirm})});
 const form=()=>{const body=new FormData();body.append('operationId',POST);body.append('values',json(values()));body.append('confirm','true');return body;};
 await send('/api/state');assert.equal((await send('/api/execute',execute(YURIDIS_REVIEW_ID,{contentId:'p'}))).response.status,401);assert.equal(calls.length,0);
 const publicRead=await send('/api/execute',execute(YURIDIS_READ_ID,{kantorId:'office'}));assert.equal(publicRead.response.status,200);assert.equal(publicRead.data.result.data.data[0].persilId,'read-original');assert.equal(calls[0].init.headers.Authorization,undefined);
 assert.equal((await send('/api/login',{username:'synthetic-yuridis-user',password:'synthetic-only'})).response.status,200);
 const read=await send('/api/execute',execute(YURIDIS_REVIEW_ID,{contentId:'original p'}));assert.equal(read.response.status,200);assert.equal(read.data.result.status,201);assert.deepEqual(read.data.result.data,{data:[nativeReview]});assert.equal(calls.at(-1).init.body,'reviewType=sertipikatSaya&contentId=original+p');
 const before=calls.length;
 for(const headers of [{Origin:'https://untrusted.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await send('/api/execute',execute(YURIDIS_REVIEW_ID,{contentId:'p'}),headers)).response.status,403);
 assert.equal((await send('/api/execute',execute(POST,values(),false))).data.error.code,'CONFIRMATION_REQUIRED');
 assert.equal((await send('/api/execute',execute(POST,values({reviewType:'other'}),true))).data.error.code,'LOST_REVIEW_POST_SCOPE');
 assert.equal((await send('/api/execute',execute(YURIDIS_REVIEW_ID,{contentId:'p',reviewType:LOST_REVIEW_POST_TYPE}))).data.error.code,'YURIDIS_REVIEW_SCOPE');
 const duplicateField=form();duplicateField.append('values',json(values()));assert.equal((await send('/api/execute',duplicateField)).data.error.code,'INVALID_MULTIPART');
 const duplicatePhoto=form();duplicatePhoto.append('reviewPhoto1',new File(['x'],'x.jpg'));duplicatePhoto.append('reviewPhoto1',new File(['y'],'y.jpg'));assert.equal((await send('/api/execute',duplicatePhoto)).data.error.code,'LOST_REVIEW_POST_SCOPE');
 assert.equal(calls.length,before);
 const written=await send('/api/execute',execute(POST,values(),true));assert.equal(written.response.status,200);assert.equal(written.data.result.data,false);assert.equal(calls.length,before+1);
 const posted=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':calls.at(-1).init.headers['Content-Type']},body:calls.at(-1).init.body}).formData();assert.equal(posted.get('reviewType'),YURIDIS_REVIEW_TYPE);assert.equal(posted.get('contentId'),values().contentId);
 await send('/api/logout',{});const loggedOut=calls.length;assert.equal((await send('/api/execute',execute(YURIDIS_REVIEW_ID,{contentId:'p'}))).response.status,401);assert.equal(calls.length,loggedOut);
});
