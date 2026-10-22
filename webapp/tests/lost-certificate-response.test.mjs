import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeLostCertificatesJson as decode} from '../private/lost-certificate-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS, prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Every upstream response and account in this file is synthetic, in process.
const ID = 'get-announcement-sertipikat-hilang-bykantor-d10a9c';
const PATH = 'announcement/sertipikat_hilang_byKantor';
const strings = ['dI304Id','persilId','berkasId','nomor','tanggalMulai','tanggalSelesai','nib','wilayah','pemohon','nomorBerkas','tanggalBerkas','tipe'];
const blank = {...Object.fromEntries(strings.map(key => [key, null])), luas: null};
const row = {...Object.fromEntries(strings.map(key => [key, ' Synthetic ' + key + ' é<&> '])), luas: 123};
const token = {tokenType:'Bearer',accessToken:'synthetic-lost-access',refreshToken:'synthetic-lost-refresh',expiredAt:4_000_000_000};
const configuration = {configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-lost-application'};
const session = () => ({active:true,user:{username:'synthetic-lost-user'},tokens:{...token}});
const make = (patch = {}) => ({path:PATH,query:{kantorId:' Synthetic +&/ office '},method:'GET',encoding:'none',auth:'optionalSession',body:{},files:[],...patch});
const client = responder => new ApiClient(configuration, {log:()=>{},transport:async (...args) => responder(...args)});
const json = JSON.stringify;

test('native lost-certificate data has all13 nullable fields, source order and untouched Strings', () => {
  const input = {error:true,message:[{wrong:'fallback'}],data:[row,{},blank,{...row,nomor:'',tanggalMulai:'not a parsed date',unknown:'discard'}],secret:'discard'};
  const text = json(input), output = decode(text);
  assert.deepEqual(output,{data:[row,blank,blank,{...row,nomor:'',tanggalMulai:'not a parsed date'}]});
  assert.equal(output.data.length,4); assert.equal(Object.keys(output.data[0]).length,13);
  assert.equal(json(input),text); assert.deepEqual(decode('{"data":[]}'),{data:[]});
  assert.deepEqual(decode('{"data":[{"Nomor":"wrong case","Luas":15,"__proto__":{"pemohon":"discard"}}]}'),{data:[blank]});
});

test('only exact data List is accepted; message, direct arrays and malformed rows never substitute', () => {
  for (const text of ['null','[]','{}','{"message":[]}','{"data":null,"message":[]}','{"data":{},"message":[]}','{"data":"[]"}','{"Data":[]}','{"data":[null]}','{"data":[true]}','{"data":[[]]}','{"data":["row"]}','{"data":[1]}','invalid json']) assert.throws(()=>decode(text),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'},text);
  for (const value of [undefined,null,{},[],true,123]) assert.throws(()=>decode(value),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
});

test('each nonnull String field rejects wrong scalar/container types without coercion', () => {
  for (const field of strings) {
    for (const value of [0,1,1.25,true,false,[],{}]) assert.throws(()=>decode(json({data:[{...row,[field]:value}]})),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'},field);
    assert.equal(decode(json({data:[{[field]:null}]})).data[0][field],null);
    assert.equal(decode(json({data:[{[field]:''}]})).data[0][field],'');
    assert.equal(decode(json({data:[{[field]:'   '}]})).data[0][field],'   ');
  }
});

test('luas nullable int retains signed64 lexemes and wide values instead of IEEE rounding', () => {
  for (const value of ['0','-0','1','-1','9007199254740991','-9007199254740991','9007199254740992','9007199254740993','-9007199254740993','9223372036854775807','-9223372036854775808']) {
    const integer = BigInt(value), expected = integer < BigInt(Number.MIN_SAFE_INTEGER) || integer > BigInt(Number.MAX_SAFE_INTEGER) ? integer.toString() : Number(integer);
    assert.equal(decode('{"data":[{"luas":'+value+'}]}').data[0].luas,expected);
  }
  for (const value of ['1.0','1e0','1.5','"1"','true','false','[]','{}']) assert.throws(()=>decode('{"data":[{"luas":'+value+'}]}'),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
  for (const value of ['9223372036854775808','-9223372036854775809','123456789012345678901234567890']) assert.throws(()=>decode('{"data":[{"luas":'+value+'}]}'),{code:'UNSUPPORTED_LOST_CERTIFICATE_NUMBER'});
});

test('main JSON transformation permits exactly one service String decode, never recursive unwrap', () => {
  const text = json({error:true,data:[row]}), quoted = json(text);
  assert.deepEqual(decode(text),{data:[row]});
  assert.deepEqual(decode(quoted,{jsonTransformed:true}),{data:[row]});
  assert.throws(()=>decode(quoted),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
  assert.throws(()=>decode(json(quoted),{jsonTransformed:true}),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
  assert.throws(()=>decode(json('invalid json'),{jsonTransformed:true}),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
  const wide = '{"data":[{"luas":9007199254740993}]}';
  assert.equal(decode(json(wide),{jsonTransformed:true}).data[0].luas,'9007199254740993');
});

test('existing lost-certificate read contract stays fixed with protected submissions disabled', () => {
  const operation = OPERATIONS.find(op=>op.id===ID);
  for (const [key,value] of Object.entries({enabled:true,method:'GET',encoding:'none',auth:'optionalSession',serviceId:'main',effect:'read',mutates:false,requiresConfirmation:false,path:PATH,serverAcceptance:'untested'})) assert.equal(operation[key],value,key);
  assert.equal(OPERATIONS.length,176); assert.equal(OPERATIONS.filter(op=>op.enabled).length,94);
  const prepared = prepareOperation(ID,{kantorId:' Synthetic office '},{});
  assert.deepEqual({...prepared.query},{kantorId:' Synthetic office '}); assert.deepEqual({...prepared.body},{}); assert.deepEqual(prepared.files,[]);
  assert.throws(()=>prepareOperation(ID,{kantorId:'office',url:'https://untrusted.invalid'},{}),{code:'UNKNOWN_FIELD'});
  assert.equal(OPERATIONS.find(op=>op.id==='post-geotag-uploadgeotag-d96b98').enabled,false);
});

test('bodyless fixed GET encodes office once and uses only existing optional-session bearer behavior', async () => {
  const calls=[],logs=[],c = new ApiClient(configuration,{log:entry=>logs.push(entry),transport:async(url,init)=>{calls.push({url,init});return Response.json({error:true,data:[row]});}});
  for (const current of [undefined,session()]) {
    const result = await c.request(make({session:current})), {url,init} = calls.at(-1);
    assert.equal(url.origin,'https://sentuh.atrbpn.go.id'); assert.equal(url.pathname,'/'+PATH);
    assert.deepEqual([...url.searchParams],[['kantorId',' Synthetic +&/ office ']]);
    assert.equal(init.method,'GET'); assert.equal(init.body,undefined); assert.equal(init.headers.Accept,'application/json');
    assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');
    assert.equal(init.headers.Authorization,current?'Bearer '+token.accessToken:undefined);
    assert.deepEqual(result.data,{data:[row]}); assert.equal(result.status,200);
  }
  assert.equal(calls.length,2); assert.equal(logs.length,2);
  assert.ok(!json(logs).includes('Synthetic +&/ office')); assert.ok(!json(logs).includes(token.accessToken)); assert.ok(!json(logs).includes(row.pemohon));
});

test('scoped read rejects changed transport, path, origin, body, files and arbitrary query before forwarding', async () => {
  let calls=0; const c=client(async()=>{calls++;return Response.json({data:[]});});
  const symbol=Symbol('unexpected'), patches=[{method:'POST'},{method:'HEAD'},{encoding:'json'},{auth:'session'},{auth:'none'},{auth:'application'},{clientProfile:'sps-document-viewer'},{query:{}},{query:null},{query:{kantorId:1}},{query:{kantorId:'a',extra:'b'}},{query:{KantorId:'a'}},{query:{kantorId:'a',[symbol]:'unexpected'}},{body:{name:'not allowed'}},{body:[]},{body:null},{files:[{key:'file',file:new Blob(['synthetic'])}]},{path:'/'+PATH},{path:PATH+'?kantorId=x'},{path:PATH+'#fragment'}];
  for (const patch of patches) await assert.rejects(c.request(make(patch)),{code:'LOST_CERTIFICATE_READ_SCOPE'},json(patch));
  await assert.rejects(c.request(make({base:'https://untrusted.invalid'})),{code:'SERVICE_NOT_READY'});
  let getters=0;const query={get kantorId(){getters++;return 'not evaluated';}};
  await assert.rejects(c.request(make({query})),{code:'LOST_CERTIFICATE_READ_SCOPE'});
  assert.equal(getters,0); assert.equal(calls,0);
});

test('HTTP200 alone can publish a typed list regardless of unrelated error/message fields', async () => {
  for (const error of [true,false,null,1,'true',[],{}]) {
    for (const contentType of ['application/json','text/plain','application/octet-stream']) {
      const c=client(async()=>new Response(json({error,message:'unused',data:[{},row]}),{headers:{'Content-Type':contentType}}));
      assert.deepEqual((await c.request(make())).data,{data:[blank,row]});
    }
  }
  const quoted=client(async()=>Response.json(json({data:[row]})));
  assert.deepEqual((await quoted.request(make())).data,{data:[row]});
  for(const contentType of ['text/plain','application/octet-stream'])await assert.rejects(client(async()=>new Response(json(json({data:[row]})),{headers:{'Content-Type':contentType}})).request(make()),{code:'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'});
});

test('non200 statuses reject without parsing or upgrading empty/error responses into success', async () => {
  for (const status of [201,202,204,206,299,400,401,403,404,500]) {
    const c=client(async()=>new Response(status===204?null:'not json',{status}));
    await assert.rejects(c.request(make()),error=>error.code==='UPSTREAM_REJECTED'&&error.status===(status===401?401:status===403?403:502)&&error.details.upstreamStatus===status);
  }
  await assert.rejects(client(async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.invalid'}})).request(make()),{code:'UPSTREAM_REDIRECT'});
});

test('malformed successful responses fail closed and never fall back to message or generic error text', async () => {
  for (const text of ['not json','{"data":{}}','{"data":null,"message":[]}','{"data":[{"luas":1.0}]}','{"data":[{"nomor":false}]}']) {
    await assert.rejects(client(async()=>new Response(text,{headers:{'Content-Type':'application/json'}})).request(make()),error=>error.code==='LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED'&&error.status===502&&error.details.upstreamStatus===200);
  }
  await assert.rejects(client(async()=>Response.json({error:true,data:[]})).request(make({path:'announcement/unmapped_read_contract'})),{code:'UPSTREAM_REJECTED'},'Typed error-flag exceptions remain limited to their separately audited endpoints');
});

test('logged-in upstream401 preserves revocation and concurrent-token safeguards', async () => {
  const current=session(); await assert.rejects(client(async()=>Response.json({data:[]},{status:401})).request(make({session:current})),{code:'SESSION_EXPIRED'});
  assert.equal(current.tokens,null); assert.equal(current.user,null);
  const changing=session(),newTokens={...token,accessToken:'synthetic-lost-new'};
  const c=client(async()=>{changing.tokens=newTokens;return Response.json({data:[]},{status:401});});
  await assert.rejects(c.request(make({session:changing})),{code:'SESSION_CHANGED'});
  assert.equal(changing.tokens,newTokens); assert.notEqual(changing.user,null);
});

test('actual HTTP API accepts the existing anonymous read, rejects extra input, and retains CSRF/Origin gates', async t => {
  const calls=[],sessions=new SessionStore();
  const server=createServer({configuration,sessions,log:()=>{},transport:async(url,init)=>{calls.push({url,init});return new Response('{"error":true,"data":[{"nomor":"Synthetic notice","luas":9007199254740993}]}',{headers:{'Content-Type':'application/json'}});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base='http://127.0.0.1:'+server.address().port, stateResponse=await fetch(base+'/api/state'),state=await stateResponse.json(),cookie=stateResponse.headers.get('set-cookie').split(';')[0];
  async function execute(values,headers={}) {const response=await fetch(base+'/api/execute',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json',...headers},body:json({operationId:ID,values})});return {response,result:await response.json()};}
  const success=await execute({kantorId:' Synthetic office '});
  assert.equal(success.response.status,200);assert.equal(success.result.ok,true);assert.deepEqual(success.result.result.data,{data:[{...blank,nomor:'Synthetic notice',luas:'9007199254740993'}]});
  assert.equal(calls.length,1);assert.equal(calls[0].init.headers.Authorization,undefined);assert.equal(calls[0].url.searchParams.get('kantorId'),' Synthetic office ');
  assert.equal((await execute({kantorId:'office',name:'forbidden override'})).response.status,400);
  assert.equal((await execute({kantorId:'office'},{Origin:'https://untrusted.invalid'})).response.status,403);
  assert.equal((await execute({kantorId:'office'},{'X-CSRF-Token':'invalid'})).response.status,403);
  assert.equal(calls.length,1);
});
