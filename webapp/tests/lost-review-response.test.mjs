import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeLostReviewJson as decode} from '../private/lost-review-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';

// All account, review and upstream fixtures are synthetic, in process only.
const ID='post-review-all-dace58',TYPE='pengumumanSertipikatHilang';
const json=JSON.stringify;
const blankPhoto={mediaId:null,mediaUrl:null,createdAt:null};
const blankReview={reviewId:null,rating:null,comment:null,createdAt:null,reviewPhotos:null};
const blankEnvelope={totalRecords:null,resultsCount:null,pageSize:null,pageNumber:null,error:null,message:null,data:null};
const photo={mediaId:' synthetic-photo ',mediaUrl:'https://images.example.invalid/photo?x=1&y=2',createdAt:'raw-photo-date'};
const row={reviewId:' synthetic-review ',rating:4,comment:'Synthetic <b>comment</b> é',createdAt:'raw-review-date',reviewPhotos:[photo]};
const envelope={totalRecords:11,resultsCount:1,pageSize:10,pageNumber:1,error:false,message:' raw message ',data:[row]};
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-review-application'};
const token={tokenType:'Bearer',accessToken:'synthetic-review-access',refreshToken:'synthetic-review-refresh',expiredAt:4_000_000_000};
const session=()=>({active:true,user:{username:'synthetic-review-user'},tokens:{...token}});
const request=(patch={})=>({path:'review/all',method:'POST',encoding:'form',auth:'session',body:{reviewType:TYPE,contentId:' synthetic file +&/ ',pageNumber:'1',pageSize:'10'},query:{},files:[],session:session(),...patch});
const client=responder=>new ApiClient(config,{log:()=>{},transport:async(...args)=>responder(...args)});

test('yyb7/zyb5/Ayb3 preserve all nullable fields, raw dates, empty values and list order without truncating',()=>{
  assert.deepEqual(decode('{}'),blankEnvelope);
  assert.deepEqual(decode(json({...envelope,error:true,data:[row,{}, {...row,reviewId:'',comment:'',reviewPhotos:[{},photo]}],unknown:'discard'})),{...envelope,error:true,data:[row,blankReview,{...row,reviewId:'',comment:'',reviewPhotos:[blankPhoto,photo]}]});
  const rows=Array.from({length:14},()=>({...row,unknown:'discard'}));assert.equal(decode(json({...envelope,data:rows})).data.length,14);
  assert.deepEqual(decode('{"data":[],"Data":[{"ReviewId":"not an alias"}]}'),{...blankEnvelope,data:[]});
});
test('typed parser does not perform a second JSON String decode, use another envelope source or coerce scalar fields',()=>{
  for(const text of ['null','[]','true','1','invalid',json(json(envelope))])assert.throws(()=>decode(text),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
  for(const patch of [{error:1},{error:'false'},{message:1},{message:{}},{data:{}},{data:'[]'},{data:[null]},{data:[[]]},{data:[true]}])assert.throws(()=>decode(json({...envelope,...patch})),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
  assert.deepEqual(decode('{"message":"typed, not a fallback list","rows":[]}'),{...blankEnvelope,message:'typed, not a fallback list'});
  for(const field of ['reviewId','comment','createdAt'])for(const value of [1,true,{},[]])assert.throws(()=>decode(json({...envelope,data:[{...row,[field]:value}]})),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
});
test('malformed nested photo or photo-list fails the entire model while null and empty lists remain distinct',()=>{
  assert.equal(decode(json({data:[{reviewPhotos:null}]})).data[0].reviewPhotos,null);
  assert.deepEqual(decode(json({data:[{reviewPhotos:[]}]})).data[0].reviewPhotos,[]);
  for(const value of [true,{},'[]',[null],[true],[[]],[{mediaId:1}],[{mediaUrl:false}],[{createdAt:{}}]])assert.throws(()=>decode(json({...envelope,data:[row,{reviewPhotos:value}]})),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
});
test('all five integer fields use exact nullable signed64 values, with no rating range or count positivity invention',()=>{
  for(const field of ['totalRecords','resultsCount','pageSize','pageNumber','rating']){
    const wrap=value=>field==='rating'?'{"data":[{"rating":'+value+'}]}':'{"'+field+'":'+value+'}';
    const get=model=>field==='rating'?model.data[0].rating:model[field];
    for(const value of ['-1','0','-0','9007199254740993','-9007199254740993','9223372036854775807','-9223372036854775808']){const n=BigInt(value);assert.equal(get(decode(wrap(value))),n<BigInt(Number.MIN_SAFE_INTEGER)||n>BigInt(Number.MAX_SAFE_INTEGER)?n.toString():Number(n));}
    for(const value of ['1.0','1e0','1.25','"1"','true','{}'])assert.throws(()=>decode(wrap(value)),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
    for(const value of ['9223372036854775808','-9223372036854775809'])assert.throws(()=>decode(wrap(value)),{code:'UNSUPPORTED_LOST_REVIEW_NUMBER'});
  }
});
test('catalog scopes the read POST to lost-announcement constants and keeps unrelated review paths disabled',()=>{
  const op=OPERATIONS.find(op=>op.id===ID);
  for(const [key,value]of Object.entries({enabled:true,effect:'read',mutates:false,requiresConfirmation:false,method:'POST',path:'review/all',encoding:'form',auth:'session',serviceId:'main',serverAcceptance:'untested'}))assert.equal(op[key],value,key);
  assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,95);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,21);
  for(const op of OPERATIONS.filter(op=>op.path.startsWith('review/')&&![ID,'post-review-post-deb030','post-review-last-user-review-dad1dc'].includes(op.id)))assert.equal(op.enabled,false,op.id);
  for(const contentId of ['', '   ', ' file+&/é ']){
    const prepared=prepareOperation(ID,{contentId},{authenticated:true});assert.deepEqual({...prepared.body},{reviewType:TYPE,contentId,pageNumber:'1',pageSize:'10'});assert.equal(prepared.requiresConfirmation,false);assert.equal(prepared.effect,'read');
  }
  assert.throws(()=>prepareOperation(ID,{contentId:'file'},{}),{code:'LOGIN_REQUIRED'});
  for(const value of [null,undefined,1,true,[],{}])assert.throws(()=>prepareOperation(ID,{contentId:value},{authenticated:true}));
  for(const patch of [{reviewType:'different'},{pageNumber:'2'},{pageNumber:1},{pageSize:'100'},{pageSize:10}])assert.throws(()=>prepareOperation(ID,{contentId:'file',...patch},{authenticated:true}),{code:'FIXED_FIELD'});
  assert.throws(()=>prepareOperation(ID,{contentId:'file',headers:{}},{authenticated:true}),{code:'UNKNOWN_FIELD'});
  let getters=0;assert.throws(()=>prepareOperation(ID,{get contentId(){getters++;return 'not evaluated';}},{authenticated:true}));assert.equal(getters,0);
});
test('wire request keeps four String fields in native order and only the stored account bearer',async()=>{
  const calls=[],logs=[],c=new ApiClient(config,{log:entry=>logs.push(entry),transport:async(url,init)=>{calls.push({url,init});return Response.json({...envelope,error:true});}});
  for(const contentId of ['', '   ', ' file+&/%é ']){
    const values={reviewType:TYPE,contentId,pageNumber:'1',pageSize:'10'},result=await c.request(request({body:values})),{url,init}=calls.at(-1);
    assert.equal(url.href,'https://sentuh.atrbpn.go.id/review/all');assert.equal(init.method,'POST');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(init.headers.Authorization,'Bearer '+token.accessToken);assert.deepEqual([...new URLSearchParams(init.body)],Object.entries(values));assert.deepEqual(result.data,{...envelope,error:true});
  }
  assert.equal(calls.length,3);assert.ok(!json(logs).includes(token.accessToken));assert.ok(!json(logs).includes('file+&'));assert.ok(!json(logs).includes(row.comment));
});
test('review form uses audited component bytes for star/tilde and explicit browser lone-surrogate normalization',async()=>{
  const calls=[],c=client(async(_url,init)=>{calls.push(init);return Response.json(envelope);});
  const contentId=' *~!()é +&';await c.request(request({body:{reviewType:TYPE,contentId,pageNumber:'1',pageSize:'10'}}));
  assert.equal(calls[0].body,'reviewType=pengumumanSertipikatHilang&contentId=+%2A~%21%28%29%C3%A9+%2B%26&pageNumber=1&pageSize=10');
  await c.request(request({body:{reviewType:TYPE,contentId:'\ud800',pageNumber:'1',pageSize:'10'}}));
  assert.equal(calls[1].body,'reviewType=pengumumanSertipikatHilang&contentId=%EF%BF%BD&pageNumber=1&pageSize=10');
});
test('transport refuses different review targets/constants/body/query/method/auth/profile before forwarding',async()=>{
  let calls=0;const c=client(async()=>{calls++;return Response.json(envelope);}),good=request(),symbol=Symbol('extra');
  const patches=[{method:'GET'},{method:'PUT'},{encoding:'json'},{encoding:'multipart'},{auth:'optionalSession'},{auth:'application'},{clientProfile:'sps-document-viewer'},{path:'/review/all'},{path:'review/all?x=1'},{path:'review/all#x'},{query:{page:1}},{query:null},{body:null},{body:{}},{body:{...good.body,reviewType:'different'}},{body:{...good.body,pageNumber:1}},{body:{...good.body,pageSize:'20'}},{body:{...good.body,contentId:null}},{body:{...good.body,[symbol]:'extra'}},{files:[{key:'photo',file:new Blob(['synthetic'])}]}];
  for(const patch of patches)await assert.rejects(c.request(request(patch)),{code:'LOST_REVIEW_READ_SCOPE'});
  let getters=0;await assert.rejects(c.request(request({body:{reviewType:TYPE,get contentId(){getters++;return 'never';},pageNumber:'1',pageSize:'10'}})),{code:'LOST_REVIEW_READ_SCOPE'});assert.equal(getters,0);assert.equal(calls,0);
});
test('shared accepted2xx status range publishes valid typed Lists even with error:true; data:null fails service assertion',async()=>{
  for(const status of [200,201,202,206,299]){
    const result=await client(async()=>Response.json({...envelope,error:true},{status})).request(request());assert.equal(result.status,status);assert.equal(result.data.error,true);assert.deepEqual(result.data.data,[row]);
  }
  for(const data of [null,undefined])await assert.rejects(client(async()=>Response.json({...envelope,data})).request(request()),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
  await assert.rejects(client(async()=>new Response(null,{status:204,headers:{'Content-Type':'application/json'}})).request(request()),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
});
test('JSON MIME is required before direct Map parsing; common JSON media types work and quoted JSON never unwraps twice',async()=>{
  for(const mime of ['application/json','text/json','application/problem+json','text/custom+json','APPLICATION/JSON; charset=utf-8'])assert.deepEqual((await client(async()=>new Response(json(envelope),{headers:{'Content-Type':mime}})).request(request())).data,envelope);
  for(const mime of ['text/plain','application/octet-stream','application/jsonish','not-a-mime'])await assert.rejects(client(async()=>new Response(json(envelope),{headers:{'Content-Type':mime}})).request(request()),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
  await assert.rejects(client(async()=>Response.json(json(envelope))).request(request()),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
  await assert.rejects(client(async()=>new Response('invalid json',{headers:{'Content-Type':'application/json'}})).request(request()),{code:'LOST_REVIEW_RESPONSE_UNRECOGNIZED'});
});
test('non2xx and redirect reject without retry; current401 revokes session while stale401 preserves replacement tokens',async()=>{
  for(const status of [400,403,404,429,500,503]){let calls=0;await assert.rejects(client(async()=>{calls++;return Response.json(envelope,{status});}).request(request()),error=>error.code==='UPSTREAM_REJECTED'&&error.status===(status===403?403:502)&&error.details.upstreamStatus===status);assert.equal(calls,1);}
  await assert.rejects(client(async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.invalid'}})).request(request()),{code:'UPSTREAM_REDIRECT'});
  const current=session();await assert.rejects(client(async()=>Response.json(envelope,{status:401})).request(request({session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
  const changing=session(),replacement={...token,accessToken:'synthetic-review-new'};await assert.rejects(client(async()=>{changing.tokens=replacement;return Response.json(envelope,{status:401});}).request(request({session:changing})),{code:'SESSION_CHANGED'});assert.equal(changing.tokens,replacement);
});
test('real HTTP API requires account/Origin/CSRF and permits only the authenticated read without write confirmation',async t=>{
  const calls=[],sessions=new SessionStore(),server=createServer({configuration:config,sessions,log:()=>{},transport:async(url,init)=>{
    calls.push({url,init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-review-user',token}});return Response.json({...envelope,error:true});
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base='http://127.0.0.1:'+server.address().port;let cookie='',state;
  async function send(route,data,headers={}){const response=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:json(data)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const result=await response.json();if(result.csrfToken)state=result;return {response,result};}
  await send('/api/state');const body={operationId:ID,values:{contentId:' selected synthetic file '}};
  assert.equal((await send('/api/execute',body)).response.status,401);assert.equal(calls.length,0);
  assert.equal((await send('/api/login',{username:'synthetic-review-user',password:'synthetic-only'})).response.status,200);
  const result=await send('/api/execute',body);assert.equal(result.response.status,200);assert.deepEqual(result.result.result.data,{...envelope,error:true});assert.equal(calls.length,2);assert.deepEqual([...new URLSearchParams(calls[1].init.body)],[['reviewType',TYPE],['contentId',' selected synthetic file '],['pageNumber','1'],['pageSize','10']]);
  assert.equal((await send('/api/execute',body,{Origin:'https://untrusted.invalid'})).response.status,403);assert.equal((await send('/api/execute',body,{'X-CSRF-Token':'wrong'})).response.status,403);
  assert.equal((await send('/api/execute',{operationId:ID,values:{contentId:'file',pageSize:'999'}})).response.status,400);
  assert.equal((await send('/api/execute',{operationId:'post-review-last-user-review-d42f30',values:{},confirm:true})).response.status,422);assert.equal(calls.length,2);
});
