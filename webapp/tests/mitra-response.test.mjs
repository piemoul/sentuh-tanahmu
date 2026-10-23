import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MITRA_READS,prepareMitraQuery,decodeMitraValue,decodeMitraBytes} from '../private/mitra-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';

const paths=Object.keys(MITRA_READS),json=JSON.stringify;
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-mitra-app'};
const token={tokenType:'Bearer',accessToken:'synthetic-mitra-access',refreshToken:'synthetic-mitra-refresh',expiredAt:4_000_000_000};
const session=()=>({active:true,user:{username:'synthetic-mitra-user'},tokens:{...token}});
const query=(path,value=' selected reference ')=>MITRA_READS[path].idField?{[MITRA_READS[path].idField]:value}:{};
const request=(path,patch={})=>({path,method:'GET',encoding:'none',auth:'optionalSession',body:{},query:query(path),files:[],...patch});
const client=transport=>new ApiClient(config,{log:()=>{},transport});
const fail={code:'MITRA_RESPONSE_UNRECOGNIZED'};

test('all five nullableString models retain native fields, nulls, duplicates, raw dates and source order',()=>{
  for(const path of paths){
    const {fields,discarded}=MITRA_READS[path],row=Object.fromEntries([...fields,...discarded].map((key,index)=>[key,index%2?'':' raw '+key+' ']));
    const expected=Object.fromEntries(fields.map(key=>[key,row[key]]));
    assert.deepEqual(decodeMitraValue({error:true,data:[{},row,row],unknown:'discard'},path),{data:[Object.fromEntries(fields.map(key=>[key,null])),expected,expected]});
    assert.equal(decodeMitraValue({data:Array.from({length:31},()=>row)},path).data.length,31);
    assert.deepEqual(decodeMitraValue({data:[]},path),{data:[]});
  }
});
test('only data List succeeds after exactly one service String decode; envelope error/message never substitute models',()=>{
  for(const path of paths){
    const body={error:true,message:[{nama:'not a fallback'}],data:[]};assert.deepEqual(decodeMitraValue(json(body),path),{data:[]});
    for(const value of [null,[],true,1,{message:[]},{data:null},{data:{}},{data:'[]'},json(json(body)),{Data:[]}])assert.throws(()=>decodeMitraValue(value,path),fail);
  }
});
test('malformed retained or discarded String fields fail the entire list instead of dropping bad rows',()=>{
  for(const path of paths){
    for(const key of [...MITRA_READS[path].fields,...MITRA_READS[path].discarded])for(const value of [1,true,{},[]])assert.throws(()=>decodeMitraValue({data:[{}, {[key]:value},{}]},path),fail);
    for(const item of [null,true,[],1,'row'])assert.throws(()=>decodeMitraValue({data:[item]},path),fail);
    assert.throws(()=>decodeMitraValue({data:new Array(1)},path),fail);
  }
  let reads=0;const body={get data(){reads++;return [];}};assert.throws(()=>decodeMitraValue(body,paths[0]),fail);
  const row={get nama(){reads++;return 'never';}};assert.throws(()=>decodeMitraValue({data:[row]},paths[0]),fail);assert.equal(reads,0);
});
test('shared JSON-MIME transform and the one service decode stay distinct; text response uses replacementUTF8',()=>{
  const path=paths[0],body={error:true,data:[{nama:'raw name'}]},bytes=Buffer.from(json(body));
  for(const mime of ['application/json','text/json','APPLICATION/JSON; charset=utf-8','image/x+json']){
    assert.deepEqual(decodeMitraBytes(bytes,mime,path),{data:body.data});
    assert.deepEqual(decodeMitraBytes(Buffer.from(json(json(body))),mime,path),{data:body.data});
    assert.throws(()=>decodeMitraBytes(Buffer.from(json(json(json(body)))),mime,path),fail);
  }
  for(const mime of ['text/plain','not-a-mime','']){
    assert.deepEqual(decodeMitraBytes(bytes,mime,path),{data:body.data});
    assert.throws(()=>decodeMitraBytes(Buffer.from(json(json(body))),mime,path),fail);
  }
  for(const bytes of [Buffer.alloc(0),Buffer.from(' '),Buffer.from('{bad}'),Buffer.from([0xff])])assert.throws(()=>decodeMitraBytes(bytes,'application/json',path),fail);
  const invalidUtf8=Buffer.concat([Buffer.from('{"data":[{"nama":"'),Buffer.from([255]),Buffer.from('"}]}')]);
  assert.throws(()=>decodeMitraBytes(invalidUtf8,'application/json',path),fail);assert.equal(decodeMitraBytes(invalidUtf8,'text/plain',path).data[0].nama,'\uFFFD');
});
test('query preparation contains exactly the selected raw String, including empty and whitespace, without evaluating getters',()=>{
  for(const path of paths){
    for(const value of ['', '   ', ' raw +&/%~*é '])assert.deepEqual({...prepareMitraQuery(path,query(path,value))},query(path,value));
    assert.throws(()=>prepareMitraQuery(path,{...query(path),extra:'x'}),{code:'MITRA_READ_SCOPE'});
    assert.throws(()=>prepareMitraQuery(path,Object.assign(query(path),{[Symbol('extra')]:1})),{code:'MITRA_READ_SCOPE'});
    const key=MITRA_READS[path].idField;if(key)for(const value of [null,undefined,1,true,{},[]])assert.throws(()=>prepareMitraQuery(path,{[key]:value}),{code:'MITRA_READ_SCOPE'});
  }
  let reads=0;assert.throws(()=>prepareMitraQuery('Mitra/GetPPATList',{get kantorId(){reads++;return 'never';}}),{code:'MITRA_READ_SCOPE'});assert.equal(reads,0);
});
test('catalog retains five Mitra records plus later Rating and Yuridis deltas with prior write IDs plus the selected Rating writer',()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/mitra-read-baseline.json',import.meta.url))),ids=baseline.mitraOperationIds;
  assert.deepEqual(OPERATIONS.map(op=>op.id),baseline.catalog.operations.map(op=>op.id));
  const changed=OPERATIONS.filter((op,index)=>createHash('sha256').update(json(op)).digest('hex')!==baseline.catalog.operations[index].sha256);assert.deepEqual(changed.map(op=>op.id).sort(),[...ids,'get-ratingppat-getratingquestions-d1d6bc','get-announcement-yuridis-bykantor-d0fb64','post-review-last-user-review-dad1dc','post-review-post-deb030','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4','get-tanyajawab-gettanyajawabberkas-d2826c'].sort());
  assert.deepEqual(OPERATIONS.map(op=>op.enabled),baseline.catalog.operations.map(op=>['get-ratingppat-getratingquestions-d1d6bc','post-review-last-user-review-dad1dc','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4'].includes(op.id)?true:op.enabled));assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,95);assert.deepEqual(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').map(op=>op.id),baseline.catalog.operations.filter(op=>['post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4'].includes(op.id)||baseline.catalog.enabledWriteIds.includes(op.id)).map(op=>op.id));
  for(const id of ids){const op=OPERATIONS.find(op=>op.id===id);assert.equal(op.evidence.nativeProofSha256,'e6d6c1b29c6f6efa4e8cbd9ba84657ae54205e3f77a71d524b6016abdf854d5b');for(const value of ['', '   ']){const prepared=prepareOperation(id,query(op.path,value));assert.deepEqual({...prepared.query},query(op.path,value));assert.equal(prepared.auth,'optionalSession');assert.equal(prepared.method,'GET');assert.equal(prepared.requiresConfirmation,false);}}
});
test('actual client GET recipes preserve query values and use stored bearer only when a session exists',async()=>{
  const calls=[],c=client(async(url,init)=>{calls.push({url,init});return Response.json({error:true,data:[]});});
  for(const path of paths)for(const authenticated of [false,true]){
    const value=' raw +&/%~*é ',result=await c.request(request(path,{query:query(path,value),...(authenticated?{session:session()}:{})})),{url,init}=calls.at(-1);
    assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/'+path);assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(init.headers.Authorization,authenticated?'Bearer '+token.accessToken:undefined);assert.deepEqual([...url.searchParams],Object.entries(query(path,value)));assert.deepEqual(result.data,{data:[]});
  }
  assert.equal(calls.length,10);
});
test('exact Mitra scope rejects alternate origin/path/method/auth/profile/body/files/query before forwarding or getter reads',async()=>{
  let calls=0;const c=client(async()=>{calls++;return Response.json({data:[]});}),path='Mitra/GetPPATList';
  for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{path:'/Mitra/GetPPATList'},{path:'Mitra/GetPPATList?x=1'},{path:'Mitra/GetPPATList#x'},{method:'POST'},{encoding:'form'},{auth:'none'},{auth:'session'},{clientProfile:'sps-document-viewer'},{body:{x:1}},{body:null},{files:[{key:'file',file:new File(['x'],'x.png')}]},{query:{kantorId:1}},{query:{kantorId:'x',extra:'x'}}])await assert.rejects(c.request(request(path,patch)),{code:'MITRA_READ_SCOPE'});
  let reads=0;await assert.rejects(c.request(request(path,{query:{get kantorId(){reads++;return 'never';}}})),{code:'MITRA_READ_SCOPE'});assert.equal(reads,0);assert.equal(calls,0);
});
test('onlyHTTP200 publishes typeddata and the Mitra error-flag exception never spreads to another endpoint',async()=>{
  for(const path of paths){
    assert.deepEqual((await client(async()=>Response.json({error:true,data:[]})).request(request(path))).data,{data:[]});
    for(const status of [201,204,299,403,500])await assert.rejects(client(async()=>new Response(null,{status})).request(request(path)),{code:'UPSTREAM_REJECTED'});
    await assert.rejects(client(async()=>Response.json({error:false,data:[{nama:1}]})).request(request(path)),fail);
  }
  await assert.rejects(client(async()=>Response.json({error:true,data:[]})).request({path:'synthetic/unrelated',method:'GET',encoding:'none',auth:'none'}),{code:'UPSTREAM_REJECTED'});
});
test('current401 revokes only its session, stale401 keeps replacement tokens, and network failures do not retry',async()=>{
  const path=paths[0],current=session();await assert.rejects(client(async()=>Response.json({},{status:401})).request(request(path,{session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
  const stale=session(),replacement={...token,accessToken:'synthetic-new-mitra'};await assert.rejects(client(async()=>{stale.tokens=replacement;return Response.json({},{status:401});}).request(request(path,{session:stale})),{code:'SESSION_CHANGED'});assert.equal(stale.tokens,replacement);
  let calls=0;await assert.rejects(client(async()=>{calls++;throw Object.assign(new Error('synthetic never log names'),{code:'ECONNREFUSED'});}).request(request(path)),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
  await assert.rejects(client(async()=>new Response(null,{status:200,headers:{'Content-Length':String(20*1024*1024+1)}})).request(request(path)),{code:'RESPONSE_TOO_LARGE'});
});
test('real loopback API permits all five anonymous optional-session GETs but retains Origin/CSRF and exact query guards',async t=>{
  const calls=[],server=createServer({configuration:config,log:()=>{},transport:async(url,init)=>{calls.push({url,init});return Response.json({error:true,data:[]});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base='http://127.0.0.1:'+server.address().port,response=await fetch(base+'/api/state'),cookie=response.headers.get('set-cookie').split(';')[0],state=await response.json();
  const send=(body,headers={})=>fetch(base+'/api/execute',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json',...headers},body:json(body)});
  const ops=OPERATIONS.filter(op=>paths.includes(op.path));
  for(const op of ops){const response=await send({operationId:op.id,values:query(op.path,'   ')});assert.equal(response.status,200);assert.deepEqual((await response.json()).result.data,{data:[]});assert.equal(calls.at(-1).init.headers.Authorization,undefined);}
  assert.equal(calls.length,5);const body={operationId:ops[0].id,values:{}};assert.equal((await send(body,{Origin:'https://untrusted.invalid'})).status,403);assert.equal((await send(body,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await send({operationId:ops[0].id,values:{unexpected:'x'}})).status,400);assert.equal(calls.length,5);
});
