import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {RATING_PPAT_READ_PATH as PATH,RATING_PPAT_READ_ID as ID,prepareRatingPpatRead,decodeRatingPpatValue as decode,decodeRatingPpatBytes as bytes} from '../private/rating-ppat-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';

const json=JSON.stringify,fail={code:'RATING_PPAT_RESPONSE_UNRECOGNIZED'};
const token={tokenType:'Bearer',accessToken:'synthetic-rating-access',refreshToken:'synthetic-rating-refresh',expiredAt:4_000_000_000};
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-rating-app'};
const session=()=>({active:true,user:{username:'synthetic-rating-user'},tokens:{...token}});
const request=(patch={})=>({path:PATH,method:'GET',encoding:'none',auth:'session',body:{},query:{},files:[],session:session(),...patch});
const client=transport=>new ApiClient(config,{log:()=>{},transport});
const answer=patch=>({pertanyaanRatingPPATId:' answer+& ',pertanyaan:' first question ',jawaban:' exact answer ',bobot:'001',nilai:'2.0',...patch});
const group=patch=>({pertanyaanRatingPPATId:' group ID ',kategori:' hidden category ',indikator:' indicator ',jawabanRatingPPAT:[answer()],...patch});
const projectedAnswer={pertanyaanRatingPPATId:' answer+& ',pertanyaan:' first question ',jawaban:' exact answer '};
const projectedGroup={pertanyaanRatingPPATId:' group ID ',indikator:' indicator ',jawabanRatingPPAT:[projectedAnswer]};

test('Gyb/Hyb exact fields preserve null, empty nested list, raw IDs, duplicates and complete source order',()=>{
  const rows=[{},group({jawabanRatingPPAT:null}),group({jawabanRatingPPAT:[]}),group(),group()];
  const before=json(rows),result=decode({error:true,message:'ignored',data:rows});
  assert.deepEqual(result,{data:[{pertanyaanRatingPPATId:null,indikator:null,jawabanRatingPPAT:null},{...projectedGroup,jawabanRatingPPAT:null},{...projectedGroup,jawabanRatingPPAT:[]},projectedGroup,projectedGroup]});
  assert.equal(json(rows),before);assert.equal(decode({data:Array.from({length:33},()=>group())}).data.length,33);
  assert.deepEqual(decode({data:[{id:'never substitute alias',jawabanRatingPPAT:[{}]}]}),{data:[{pertanyaanRatingPPATId:null,indikator:null,jawabanRatingPPAT:[{pertanyaanRatingPPATId:null,pertanyaan:null,jawaban:null}]}]});
  for(const text of ['', '   ', '<img onerror=never()>', '0001'])assert.deepEqual(decode({data:[group({pertanyaanRatingPPATId:text,indikator:text,jawabanRatingPPAT:[answer({pertanyaanRatingPPATId:text,pertanyaan:text,jawaban:text})]})]}).data[0],{pertanyaanRatingPPATId:text,indikator:text,jawabanRatingPPAT:[{pertanyaanRatingPPATId:text,pertanyaan:text,jawaban:text}]});
});

test('all eight nullable String fields reject wrong types, including discarded kategori/bobot/nilai',()=>{
  for(const key of ['pertanyaanRatingPPATId','kategori','indikator'])for(const value of [undefined,1,true,[],{}])assert.throws(()=>decode({data:[group(),group({[key]:value}),group()]}),fail);
  for(const key of ['pertanyaanRatingPPATId','pertanyaan','jawaban','bobot','nilai'])for(const value of [undefined,1,true,[],{}])assert.throws(()=>decode({data:[group({jawabanRatingPPAT:[answer(),answer({[key]:value}),answer()]})]}),fail);
  assert.deepEqual(decode({data:[{kategori:null,jawabanRatingPPAT:[{bobot:null,nilai:null}]}]}).data[0].jawabanRatingPPAT,[{pertanyaanRatingPPATId:null,pertanyaan:null,jawaban:null}]);
});

test('only nonnull data List succeeds; error/message are ignored after exactly one service String decode',()=>{
  const body={error:true,message:[{id:'not questions'}],data:[]};assert.deepEqual(decode(body),{data:[]});assert.deepEqual(decode(json(body)),{data:[]});
  for(const value of [null,[],true,1,{message:[]},{data:null},{data:{}},{data:'[]'},json(json(body)),{Data:[]}])assert.throws(()=>decode(value),fail);
});

test('nested lists and every row must be typed and dense; getters and unknown fields are never evaluated',()=>{
  for(const value of [undefined,{},'',true,1])assert.throws(()=>decode({data:[group({jawabanRatingPPAT:value})]}),fail);
  for(const item of [null,true,1,'row',[]]){
    assert.throws(()=>decode({data:[item]}),fail);assert.throws(()=>decode({data:[group({jawabanRatingPPAT:[item]})]}),fail);
  }
  assert.throws(()=>decode({data:new Array(1)}),fail);assert.throws(()=>decode({data:[group({jawabanRatingPPAT:new Array(1)})]}),fail);
  let reads=0;for(const value of [{get data(){reads++;return [];}},{data:[{get kategori(){reads++;return '';}}]},{data:[{get jawabanRatingPPAT(){reads++;return [];}}]},{data:[group({jawabanRatingPPAT:[{get nilai(){reads++;return '';}}]})]}])assert.throws(()=>decode(value),fail);
  const row=group();Object.defineProperty(row,'unknown',{get(){reads++;throw Error('never');}});assert.deepEqual(decode({data:[row]}),{data:[projectedGroup]});assert.equal(reads,0);
});

test('shared JSON MIME transform stays separate from optional service decode and invalid UTF8 fails only JSON path',()=>{
  const body={error:true,data:[group()]};
  for(const mime of ['application/json','text/json','APPLICATION/JSON; charset=utf-8','image/x+json']){
    assert.deepEqual(bytes(Buffer.from(json(body)),mime),{data:[projectedGroup]});assert.deepEqual(bytes(Buffer.from(json(json(body))),mime),{data:[projectedGroup]});assert.throws(()=>bytes(Buffer.from(json(json(json(body)))),mime),fail);
  }
  for(const mime of ['text/plain','invalid-mime','']){assert.deepEqual(bytes(Buffer.from(json(body)),mime),{data:[projectedGroup]});assert.throws(()=>bytes(Buffer.from(json(json(body))),mime),fail);}
  assert.deepEqual(bytes(Buffer.concat([Buffer.from([239,187,191]),Buffer.from('{"data":[]}')]),'application/json'),{data:[]});
  for(const raw of [Buffer.alloc(0),Buffer.from(' '),Buffer.from('{bad}'),Buffer.from([255])])assert.throws(()=>bytes(raw,'application/json'),fail);
  const invalid=Buffer.concat([Buffer.from('{"data":[{"indikator":"'),Buffer.from([255]),Buffer.from('"}]}')]);assert.throws(()=>bytes(invalid,'application/json'),fail);assert.equal(bytes(invalid,'text/plain').data[0].indikator,'\uFFFD');
});

test('question operation accepts no parameters without evaluating accessors or accepting prototype/symbol aliases',()=>{
  assert.deepEqual(prepareRatingPpatRead(),{});assert.deepEqual(prepareRatingPpatRead(Object.create(null)),{});
  let reads=0;for(const value of [null,[],1,true,{id:''},{aktaId:''},{[Symbol('extra')]:1},Object.create({}),{get data(){reads++;return 'never';}}])assert.throws(()=>prepareRatingPpatRead(value),{code:'RATING_PPAT_READ_SCOPE'});assert.equal(reads,0);
  assert.throws(()=>prepareOperation(ID,{},{}),{code:'LOGIN_REQUIRED'});
  const prepared=prepareOperation(ID,{}, {authenticated:true});assert.deepEqual({method:prepared.method,path:prepared.path,auth:prepared.auth,encoding:prepared.encoding,query:prepared.query,body:prepared.body,files:prepared.files,requiresConfirmation:prepared.requiresConfirmation},{method:'GET',path:PATH,auth:'session',encoding:'none',query:{},body:{},files:[],requiresConfirmation:false});
  assert.throws(()=>prepareOperation(ID,{get extra(){reads++;return ''; }},{authenticated:true}),{code:'RATING_PPAT_READ_SCOPE'});assert.equal(reads,0);
});

test('catalog retains the Rating GET plus later Yuridis delta and prior write IDs plus the separately enabled Rating POST',()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/rating-ppat-read-baseline.json',import.meta.url)));
  assert.deepEqual(OPERATIONS.map(op=>op.id),baseline.catalog.operations.map(op=>op.id));
  const changed=OPERATIONS.filter((op,index)=>createHash('sha256').update(json(op)).digest('hex')!==baseline.catalog.operations[index].sha256);assert.deepEqual(changed.map(op=>op.id).sort(),[ID,'get-announcement-yuridis-bykantor-d0fb64','post-review-last-user-review-dad1dc','post-review-post-deb030','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].sort());
  assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,94);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,20);
  assert.deepEqual(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').map(op=>op.id),baseline.catalog.operations.filter(op=>['post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].includes(op.id)||baseline.catalog.enabledWriteIds.includes(op.id)).map(op=>op.id));
  for(const [index,op] of OPERATIONS.entries())if(op.id!==ID)assert.equal(op.enabled,['post-review-last-user-review-dad1dc','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].includes(op.id)?true:baseline.catalog.operations[index].enabled,op.id);
  const op=changed.find(op=>op.id===ID);assert.deepEqual(op.fields,[]);for(const [key,value] of Object.entries({enabled:true,auth:'session',method:'GET',path:PATH,encoding:'none',serviceId:'main',effect:'read',mutates:false,requiresConfirmation:false}))assert.equal(op[key],value,key);
  assert.equal(op.evidence.nativeProofSha256,'fb14dcd006486b43e476901746b9befacba29ae8970b926ec1656bb12bd431f1');
  const post=OPERATIONS.find(op=>op.path==='RatingPPAT/PostRatingPPAT');assert.equal(post.enabled,true);assert.throws(()=>prepareOperation(post.id,{aktaId:'',PertanyaanRatingPPATId:[1]}, {authenticated:true}),{code:'RATING_PPAT_POST_SCOPE'});assert.throws(()=>prepareOperation(post.id,{aktaId:'',PertanyaanRatingPPATId:[],foreign:'unmapped'}, {authenticated:true}),{code:'RATING_PPAT_POST_SCOPE'});
});

test('actual client emits only bodyless main GET with stored bearer and exact normalized projection',async()=>{
  const calls=[],logs=[],c=new ApiClient(config,{log:entry=>logs.push(entry),transport:async(url,init)=>{calls.push({url,init});return Response.json({error:true,message:'ignored',data:[group()]});}});
  assert.deepEqual((await c.request(request())).data,{data:[projectedGroup]});const {url,init}=calls[0];
  assert.equal(url.href,'https://sentuh.atrbpn.go.id/RatingPPAT/GetRatingQuestions');assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.headers.Authorization,'Bearer '+token.accessToken);assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(calls.length,1);
  for(const secret of [token.accessToken,token.refreshToken,' group ID ',' exact answer '])assert.equal(json(logs).includes(secret),false);
});

test('exact read scope rejects alternate origins/paths/recipes/body/query/files without provider forwarding',async()=>{
  let calls=0,reads=0;const c=client(async()=>{calls++;return Response.json({data:[]});});
  for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{path:'/'+PATH},{path:PATH+'?x=1'},{path:PATH+'#x'},{method:'POST'},{encoding:'form'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{body:{x:1}},{body:null},{query:{id:''}},{query:null},{files:[{key:'file',file:new File(['x'],'x.png')}]},{query:{get x(){reads++;return 'never';}}},{body:{get x(){reads++;return 'never';}}}])await assert.rejects(c.request(request(patch)),{code:'RATING_PPAT_READ_SCOPE'});
  assert.equal(reads,0);assert.equal(calls,0);
});

test('exact HTTP200 is required and ignoring body.error remains scoped to the Rating questions read',async()=>{
  assert.deepEqual((await client(async()=>Response.json({error:true,data:[]})).request(request())).data,{data:[]});
  for(const status of [201,204,299,403,500])await assert.rejects(client(async()=>new Response(null,{status})).request(request()),{code:'UPSTREAM_REJECTED'});
  await assert.rejects(client(async()=>Response.json({data:[{kategori:5}]})).request(request()),fail);
  await assert.rejects(client(async()=>Response.json({error:true,data:[]})).request({path:'synthetic/unrelated',method:'GET',encoding:'none',auth:'none'}),{code:'UPSTREAM_REJECTED'});
});

test('session absence/expiry, stale401, network refusal and response bounds retain existing guarded behavior',async()=>{
  let calls=0;const c=client(async()=>{calls++;return Response.json({data:[]});});await assert.rejects(c.request(request({session:undefined})),{code:'AUTH_REQUIRED'});await assert.rejects(c.request(request({session:{...session(),active:false}})),{code:'SESSION_EXPIRED'});assert.equal(calls,0);
  const current=session();await assert.rejects(client(async()=>Response.json({},{status:401})).request(request({session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
  const stale=session(),replacement={...token,accessToken:'synthetic-rating-replacement'};await assert.rejects(client(async()=>{stale.tokens=replacement;return Response.json({},{status:401});}).request(request({session:stale})),{code:'SESSION_CHANGED'});assert.equal(stale.tokens,replacement);
  await assert.rejects(client(async()=>{calls++;throw Object.assign(new Error('synthetic only'),{code:'ECONNREFUSED'});}).request(request()),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
  await assert.rejects(client(async()=>new Response(null,{status:200,headers:{'Content-Length':String(20*1024*1024+1)}})).request(request()),{code:'RESPONSE_TOO_LARGE'});
});

test('actual loopback execute requires session/Origin/CSRF and forwards only the fixed bodyless question GET',async t=>{
  const calls=[],server=createServer({configuration:config,log:()=>{},transport:async(url,init)=>{calls.push({url,init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-rating-user',token:{...token}}});assert.equal(url.pathname,'/'+PATH);return Response.json({error:true,data:[group()]});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base='http://127.0.0.1:'+server.address().port;let response=await fetch(base+'/api/state'),cookie=response.headers.get('set-cookie').split(';')[0],state=await response.json();
  const send=(route,body,headers={})=>fetch(base+route,{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json',...headers},body:json(body)});
  response=await send('/api/execute',{operationId:ID,values:{}});assert.equal(response.status,401);assert.equal(calls.length,0);
  response=await send('/api/login',{username:'synthetic-rating-user',password:'synthetic-rating-password'});assert.equal(response.status,200);cookie=response.headers.get('set-cookie').split(';')[0];state=await response.json();
  response=await send('/api/execute',{operationId:ID,values:{}});assert.equal(response.status,200);assert.deepEqual((await response.json()).result.data,{data:[projectedGroup]});assert.equal(calls.length,2);assert.equal(calls[1].init.body,undefined);assert.equal(calls[1].url.search,'');
  const body={operationId:ID,values:{}};assert.equal((await send('/api/execute',body,{Origin:'https://untrusted.invalid'})).status,403);assert.equal((await send('/api/execute',body,{'X-CSRF-Token':'wrong'})).status,403);assert.equal((await send('/api/execute',{operationId:ID,values:{aktaId:'must not send'}})).status,400);assert.equal(calls.length,2);
});
