import test from 'node:test';
import assert from 'node:assert/strict';
import {QueueClient,QueueClientError} from '../private/queue-client.mjs';

const BASE='https://aplikasi.atrbpn.go.id/konsol/antrian/directus/';
const AUTH='Bearer queue-client-synthetic-bundle-secret';
const response=(data=[],status=200,type='application/json')=>new Response(JSON.stringify({error:false,data}),{status,headers:type?{'Content-Type':type}:{}});
function fixture(responder=()=>response()) {
  const calls=[],logs=[],waits=[]; let authCalls=0;
  const config={queueAuthorization(){authCalls++;return AUTH;},applicationAuthorization(){throw new Error('main auth must not be read');},tlsOptions(){throw new Error('main TLS must not be read');}};
  const client=new QueueClient(config,{transport:async(url,init)=>{const call={url:new URL(url),init};calls.push(call);return responder(call,calls.length);},log:entry=>logs.push(entry),sleep:async(ms,options)=>waits.push({ms,options})});
  return {client,calls,logs,waits,config,get authCalls(){return authCalls;}};
}
const rejects=(promise,code,status=502)=>assert.rejects(promise,error=>error instanceof QueueClientError && error.code===code && error.status===status);

test('queue construction is lazy; missing bundle configuration only fails actual GET',async()=>{
  let derived=0,requests=0;
  const client=new QueueClient({queueAuthorization(){derived++;throw new Error(AUTH);}},{transport:async()=>{requests++;},log:()=>{}});
  assert.equal(derived,0);
  new QueueClient({configured:false});
  await rejects(client.list(''),'QUEUE_IDENTITY_REQUIRED',400);
  await rejects(client.detail('..'),'QUEUE_DETAIL_ID_INVALID',400);
  assert.equal(derived,0);
  await rejects(client.list('fixture-own-nik'),'QUEUE_CONFIGURATION_REQUIRED',503);
  assert.equal(derived,1);assert.equal(requests,0);
  for(const bad of [null,undefined,'','AtrBpn fixture','Bearer ','Bearer fixture\r\nInjected: secret','Bearer fixture extra',7]) {
    const other=new QueueClient({queueAuthorization:()=>bad},{transport:async()=>{requests++;},log:()=>{}});
    await rejects(other.list('fixture'),'QUEUE_CONFIGURATION_REQUIRED',503);
  }
  assert.equal(requests,0);
});

test('list uses only exact Directus GET and one-pass native query escaping',async()=>{
  const f=fixture();
  const cases=[['fixture-A,fixture-B','fixture-A%2Cfixture-B'],['A B+C%','A+B%2BC%25'],["!'()*~",'%21%27%28%29%2A~'],['é/文😀','%C3%A9%2F%E6%96%87%F0%9F%98%80'],['\ud800','%EF%BF%BD']];
  for(const [input,expected] of cases) {
    const result=await f.client.list(input),{url,init}=f.calls.at(-1);
    assert.equal(url.href,BASE+'api/antrian/saya?nik='+expected);
    assert.deepEqual(result,{status:200,contentType:'application/json',data:[]});
    assert.equal(init.method,'GET');assert.equal(init.redirect,'manual');assert.equal(init.body,undefined);
    assert.deepEqual(Object.keys(init.headers).sort(),['Authorization','User-Agent']);
    assert.equal(init.headers.Authorization,AUTH);assert.equal(init.headers['User-Agent'],'Dart/Flutter');
    assert.equal(init.credentials,undefined);assert.equal(init.session,undefined);
  }
  assert.equal(f.authCalls,cases.length);assert.equal(f.waits.length,0);
});

test('full selected detail ID keeps colon and encodes remaining accepted text without truncation',async()=>{
  const f=fixture(()=>response({id:'whole:id',booking:[]}));
  for(const [id,path] of [['whole:part:tail','whole:part:tail'],['UUID.with-dots','UUID.with-dots'],[' own É 文 ','%20own%20%C3%89%20%E6%96%87%20']]) {
    const out=await f.client.detail(id);
    assert.equal(f.calls.at(-1).url.href,BASE+'api/antrian/'+path);
    assert.equal(f.calls.at(-1).url.search,'');assert.equal(out.data.id,'whole:id');
  }
});

test('detail URL separators percent forms controls dot segments and malformed inputs stop before auth',async()=>{
  const f=fixture();
  for(const bad of [null,undefined,7,{},'', '.', '..','a/b','a\\b','a?b','a#b','%2e%2e','%2f','a%20b','a\n','a\0','a\u007f','a\u009f','\ud800','https://elsewhere.invalid/id','x'.repeat(1025)]) await rejects(f.client.detail(bad),'QUEUE_DETAIL_ID_INVALID',400);
  for(const bad of [null,undefined,7,{},'']) await rejects(f.client.list(bad),'QUEUE_IDENTITY_REQUIRED',400);
  assert.equal(f.calls.length,0);assert.equal(f.authCalls,0);
});

test('all 2xx statuses with JSON payload use strict native models and preserve every row',async()=>{
  const rows=Array.from({length:133},(_,i)=>({id:'duplicate',nomor:`N${i}`,kode_booking:['001','001']}));
  for(const status of [200,201,202,203,206,299]) {
    const f=fixture(()=>response(rows,status));const out=await f.client.list('fixture');
    assert.equal(out.status,status);assert.equal(out.data.length,133);assert.deepEqual(out.data.map(row=>row.nomor),rows.map(row=>row.nomor));
  }
});

test('JSON MIME gate permits application/json text/json and +json but never sniffs body',async()=>{
  for(const type of ['application/json','text/json; charset=utf-8','Application/Problem+JSON; charset="UTF-8"','application/vnd.fixture+json']) {
    const f=fixture(()=>response([],200,type));assert.deepEqual((await f.client.list('fixture')).data,[]);
  }
  for(const type of [null,'text/plain','text/html','application/octet-stream','invalid-mime','application/json invalid']) {
    const f=fixture(()=>response([],200,type));await rejects(f.client.list('fixture'),'QUEUE_RESPONSE_UNRECOGNIZED');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});

test('empty transport body fails envelope without treating it as successful empty list',async()=>{
  for(const status of [200,204,205]) {
    const f=fixture(()=>new Response(null,{status,headers:{'Content-Type':'application/json'}}));
    await rejects(f.client.list('fixture'),'QUEUE_SERVICE_ERROR');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});

test('business, nullable error defaults, wrong schemas and JSON strings never trigger retry',async()=>{
  for(const [body,code] of [
    [{error:true,data:[]},'QUEUE_SERVICE_ERROR'],[{data:[]},'QUEUE_SERVICE_ERROR'],[{error:null,data:[]},'QUEUE_SERVICE_ERROR'],[{error:false,data:null},'QUEUE_SERVICE_ERROR'],
    [{error:'false',data:[]},'QUEUE_RESPONSE_UNRECOGNIZED'],[{error:false,data:{}},'QUEUE_RESPONSE_UNRECOGNIZED'],[JSON.stringify({error:false,data:[]}),'QUEUE_RESPONSE_UNRECOGNIZED'],[null,'QUEUE_RESPONSE_UNRECOGNIZED'],
  ]) {
    const f=fixture(()=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}}));
    await rejects(f.client.list('fixture'),code);assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});

test('raw detail JSON preserves integer/double codes and wide counts and omits applicant token',async()=>{
  const f=fixture(()=>new Response('{"error":false,"data":{"jumlah_berkas":9223372036854775807,"booking":[{"kode":7},{"kode":7.0},{"kode":-0.0},{"kode":9007199254740993}],"pemohon":{"token":"synthetic-applicant-token"}}}',{headers:{'Content-Type':'application/json'}}));
  const out=await f.client.detail('fixture:full');
  assert.deepEqual(out.data.booking,['7','7.0','-0.0','9007199254740993']);assert.equal(out.data.jumlah_berkas,'9223372036854775807');
  assert.equal(Object.hasOwn(out.data.pemohon,'token'),false);assert.ok(!JSON.stringify(out).includes('synthetic-applicant-token'));
  assert.doesNotThrow(()=>JSON.stringify(out));
  const unsupported=fixture(()=>new Response('{"error":false,"data":{"booking":[{"kode":9223372036854775808}]}}',{headers:{'Content-Type':'application/json'}}));
  await rejects(unsupported.client.detail('fixture'),'UNSUPPORTED_QUEUE_NUMBER');assert.equal(unsupported.calls.length,1);
});

test('all native eligible HTTP statuses have at most four attempts and nominal 1/3/5-second delays',async()=>{
  for(const status of [408,429,500,502,503,504,440,499,460,598,599,520,521,522,523,524,525,527]) {
    const f=fixture(()=>response([],status));await rejects(f.client.list('fixture-nik'),'QUEUE_HTTP_STATUS');
    assert.equal(f.calls.length,4,`${status}`);assert.deepEqual(f.waits.map(item=>item.ms),[1000,3000,5000]);assert.equal(f.authCalls,1);
    assert.ok(f.calls.every(call=>call.init===f.calls[0].init && call.init.headers===f.calls[0].init.headers));
    assert.deepEqual(f.logs.map(item=>item.outcome),['retry','retry','retry','failure']);assert.ok(f.logs.every(item=>item.status===status));
  }
});

test('retry success uses same credential generation and stops immediately',async()=>{
  const f=fixture((_call,count)=>response([],count<3?503:201));
  const out=await f.client.list('private-fixture-nik');
  assert.equal(out.status,201);assert.equal(f.calls.length,3);assert.equal(f.authCalls,1);assert.deepEqual(f.waits.map(item=>item.ms),[1000,3000]);
  assert.deepEqual(f.logs.map(item=>item.outcome),['retry','retry','success']);
});

test('queue 401/403 and other noneligible status errors preserve main auth and stay local HTTP502',async()=>{
  const main={user:{username:'fixture'},tokens:{accessToken:'main-fixture-token',refreshToken:'main-fixture-refresh'}};
  const before=JSON.stringify(main);
  for(const status of [400,401,403,404,409,422,501]) {
    const f=fixture(()=>response([],status));
    await rejects(f.client.list('fixture',{session:main}),'QUEUE_HTTP_STATUS',502);
    assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);assert.equal(JSON.stringify(main),before);assert.equal(f.calls[0].init.session,undefined);
  }
});

test('JSON parse or UTF-8 errors override otherwise retryable status',async()=>{
  for(const body of ['{"broken":',new Uint8Array([0xff,0xfe])]) {
    const f=fixture(()=>new Response(body,{status:503,headers:{'Content-Type':'application/json'}}));
    await rejects(f.client.list('fixture'),'QUEUE_RESPONSE_UNRECOGNIZED');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
  const f=fixture((_call,count)=>new Response(count===1?'plain error':JSON.stringify({error:false,data:[]}),{status:count===1?503:200,headers:{'Content-Type':count===1?'text/plain':'application/json'}}));
  assert.deepEqual((await f.client.list('fixture')).data,[]);assert.equal(f.calls.length,2);
});

test('unsafe redirect or previously followed response is rejected without forwarding bearer',async()=>{
  for(const status of [301,302,303,307,308]) {
    const f=fixture(()=>new Response('',{status,headers:{Location:'https://elsewhere.invalid/'+AUTH}}));
    await rejects(f.client.detail('private:detail'),'QUEUE_REDIRECT_REJECTED');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);assert.ok(!JSON.stringify(f.logs).includes(AUTH));
  }
  for(const patch of [{redirected:true},{url:'https://elsewhere.invalid/stolen'},{url:BASE+'api/another/path'}]) {
    const f=fixture(()=>{const res=response();for(const [key,value] of Object.entries(patch))Object.defineProperty(res,key,{value});return res;});
    await rejects(f.client.list('fixture'),'QUEUE_REDIRECT_REJECTED');assert.equal(f.calls.length,1);
  }
});

test('native GET redirect statuses follow only the canonical same-endpoint slash with unchanged identity',async()=>{
  for(const status of [301,302,303,307,308]) {
    const f=fixture((call,count)=>count===1?new Response('',{status,headers:{Location:call.url.pathname+'/'+call.url.search}}):response([{id:'owned'}]));
    const out=await f.client.list('fixture A,B*~');assert.equal(out.data[0].id,'owned');assert.equal(f.calls.length,2);assert.equal(f.authCalls,1);
    assert.equal(f.calls[1].url.pathname,f.calls[0].url.pathname+'/');assert.equal(f.calls[1].url.searchParams.get('nik'),'fixture A,B*~');
    assert.equal(f.calls[1].init,f.calls[0].init);assert.equal(f.calls[1].init.headers.Authorization,AUTH);assert.equal(f.waits.length,0);
    assert.deepEqual(f.logs.map(log=>log.outcome),['redirect','success']);assert.equal(f.logs[0].status,status);
    assert.ok(!JSON.stringify(f.logs).includes('fixture A')&&!JSON.stringify(f.logs).includes(AUTH));
  }
});
test('canonical detail redirect preserves full colon ID and never adds query or body',async()=>{
  const f=fixture((call,count)=>count===1?new Response('',{status:308,headers:{Location:call.url.pathname+'/'}}):response({id:'owned:full'}));
  assert.equal((await f.client.detail('owned:full')).data.id,'owned:full');assert.equal(f.calls[1].url.pathname,'/konsol/antrian/directus/api/antrian/owned:full/');
  assert.equal(f.calls[1].url.search,'');assert.equal(f.calls[1].init.method,'GET');assert.equal(f.calls[1].init.body,undefined);
});
test('Panggilan uses its own data-only model and same scoped canonical GET transport',async()=>{
  const wire={id:'discarded-id',tipe:'discarded-type',pesan:'Pesan fixture',pengirim:'Loket fixture',penerima:'Pemohon fixture',tanggal_dikirim:'2026-10-19T01:02:03.123456Z'};
  const f=fixture((call,count)=>count===1?new Response('',{status:308,headers:{Location:call.url.pathname+'/'+call.url.search}}):Response.json({error:'ignored native field',message:{ignored:true},data:[wire]}));
  const out=await f.client.calls('fixture-A,fixture-B');assert.equal(f.calls.length,2);assert.equal(f.calls[0].url.pathname,'/konsol/antrian/directus/api/notifikasi');assert.equal(f.calls[1].url.searchParams.get('nik'),'fixture-A,fixture-B');
  assert.equal(out.data[0].pesan,wire.pesan);assert.equal(out.data[0].timeKind,'instant');assert.match(out.data[0].epochMicroseconds,/^\d+$/);
  assert.equal(Object.hasOwn(out.data[0],'id'),false);assert.equal(Object.hasOwn(out.data[0],'tipe'),false);assert.ok(f.logs.every(row=>row.path==='/konsol/antrian/directus/api/notifikasi'));
  const malformed=fixture(()=>Response.json({error:false,data:[{...wire,pesan:null}]}));await rejects(malformed.client.calls('fixture'),'QUEUE_RESPONSE_UNRECOGNIZED');assert.equal(malformed.calls.length,1);
  const empty=fixture(()=>Response.json({error:true,data:[]}));assert.deepEqual((await empty.client.calls('fixture')).data,[]);
  await rejects(empty.client.calls(''),'QUEUE_IDENTITY_REQUIRED',400);
});
test('redirect cannot change identity, endpoint, audience, scheme, port or add credentials/fragment',async()=>{
  const original=BASE+'api/antrian/saya?nik=fixture';
  for(const location of [BASE+'api/antrian/saya/',BASE+'api/antrian/saya/?nik=other',BASE+'api/antrian/saya/?nik=fixture&nik=fixture',BASE+'api/antrian/other?nik=fixture','http://aplikasi.atrbpn.go.id/konsol/antrian/directus/api/antrian/saya/?nik=fixture','https://aplikasi.atrbpn.go.id:444/konsol/antrian/directus/api/antrian/saya/?nik=fixture',original+'#fragment','https://user:pass@aplikasi.atrbpn.go.id/konsol/antrian/directus/api/antrian/saya/?nik=fixture','https://elsewhere.invalid/?nik=fixture']){
    const f=fixture(()=>new Response('',{status:308,headers:{Location:location}}));await rejects(f.client.list('fixture'),'QUEUE_REDIRECT_REJECTED');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});
test('redirect query re-encoding retains the exact decoded identity without a second transformation',async()=>{
  const f=fixture((_call,count)=>count===1?new Response('',{status:308,headers:{Location:BASE+'api/antrian/saya/?nik=fixture%20A%2cB'}}):response());
  await f.client.list('fixture A,B');assert.equal(f.calls[1].url.search,'?nik=fixture%20A%2cB');assert.equal(f.calls[1].url.searchParams.get('nik'),'fixture A,B');
});
test('canonical redirect loops and more than five hops stop without transport retry',async()=>{
  const looping=fixture((call,count)=>new Response('',{status:308,headers:{Location:count===1?call.url.pathname+'/'+call.url.search:BASE+'api/antrian/saya?nik=fixture'}}));
  await rejects(looping.client.list('fixture'),'QUEUE_REDIRECT_LOOP');assert.equal(looping.calls.length,2);assert.equal(looping.waits.length,0);
  const encodings=['%66ixture','f%69xture','fi%78ture','fix%74ure','fixt%75re','fixtu%72e'];
  const capped=fixture((_call,count)=>new Response('',{status:308,headers:{Location:BASE+'api/antrian/saya/?nik='+encodings[count-1]}}));
  await rejects(capped.client.list('fixture'),'QUEUE_REDIRECT_LIMIT');assert.equal(capped.calls.length,6);assert.equal(capped.waits.length,0);assert.equal(capped.logs.filter(log=>log.outcome==='redirect').length,5);
});
test('retry after canonical redirect restarts the original GET with the same bearer generation',async()=>{
  const f=fixture((call,count)=>count%2===1?new Response('',{status:308,headers:{Location:call.url.pathname+'/'+call.url.search}}):response([],count===2?503:200));
  await f.client.list('fixture');assert.equal(f.calls.length,4);assert.equal(f.authCalls,1);assert.deepEqual(f.waits.map(item=>item.ms),[1000]);
  assert.equal(f.calls[0].url.href,f.calls[2].url.href);assert.equal(f.calls[1].url.href,f.calls[3].url.href);
});
test('cancellation after redirect prevents the next hop and cancels redirect response body',async()=>{
  const controller=new AbortController();let calls=0,cancelled=0;
  const client=new QueueClient({queueAuthorization:()=>AUTH},{transport:async url=>{calls++;return new Response(new ReadableStream({cancel(){cancelled++;}}),{status:308,headers:{Location:new URL(url).pathname+'/'+new URL(url).search}});},log:entry=>{if(entry.outcome==='redirect')controller.abort();}});
  await rejects(client.list('fixture',{signal:controller.signal}),'QUEUE_ABORTED',499);assert.equal(calls,1);assert.equal(cancelled,1);
});

test('recognized bounded network failures retry; unknown TLS and format exceptions do not',async()=>{
  for(const code of ['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ETIMEDOUT','EHOSTUNREACH','ENETUNREACH','ECONNRESET','EPIPE','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','UND_ERR_SOCKET','REQUEST_TIMEOUT']) {
    const f=fixture(()=>{throw Object.assign(new Error(AUTH),{code});});
    await rejects(f.client.list('fixture'),'QUEUE_NETWORK_ERROR');assert.equal(f.calls.length,4,code);assert.equal(f.authCalls,1);
    assert.ok(f.logs.every(row=>row.networkCode===code));assert.ok(!JSON.stringify(f.logs).includes(AUTH));
  }
  for(const cause of [new Error(AUTH),new SyntaxError(AUTH),Object.assign(new Error(AUTH),{code:'CERT_HAS_EXPIRED'}),Object.assign(new Error(AUTH),{code:AUTH}),new QueueClientError(401,AUTH,AUTH)]) {
    const f=fixture(()=>{throw cause;});await rejects(f.client.list('fixture'),'QUEUE_NETWORK_ERROR');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);assert.ok(!JSON.stringify(f.logs).includes(AUTH));
  }
});

test('wrapped timeout is retryable while explicit cancellation is not',async()=>{
  const wrapped=fixture(()=>{throw Object.assign(new Error(AUTH),{name:'AbortError',code:'ABORT_ERR',cause:Object.assign(new Error(AUTH),{code:'REQUEST_TIMEOUT'})});});
  await rejects(wrapped.client.list('fixture'),'QUEUE_NETWORK_ERROR');assert.equal(wrapped.calls.length,4);
  for(const cause of [Object.assign(new Error(AUTH),{name:'AbortError'}),Object.assign(new Error(AUTH),{code:'REQUEST_ABORTED'})]) {
    const f=fixture(()=>{throw cause;});await rejects(f.client.list('fixture'),'QUEUE_ABORTED',499);assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});

test('abort before GET does not derive credentials or call transport',async()=>{
  const f=fixture(),controller=new AbortController();controller.abort(new Error(AUTH));
  await rejects(f.client.list('fixture',{signal:controller.signal}),'QUEUE_ABORTED',499);
  await rejects(f.client.list('fixture',{signal:{aborted:false}}),'QUEUE_SIGNAL_INVALID',400);
  assert.equal(f.authCalls,0);assert.equal(f.calls.length,0);
});

test('abort while awaiting transport suppresses late success and cancels its body',async()=>{
  let finish,cancelled=false;
  const f=fixture(()=>new Promise(resolve=>{finish=resolve;})),controller=new AbortController();
  const pending=f.client.list('private-fixture',{signal:controller.signal});
  await new Promise(resolve=>setImmediate(resolve));controller.abort(new Error(AUTH));
  await rejects(pending,'QUEUE_ABORTED',499);
  finish(new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/json'}}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(cancelled,true);assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);assert.ok(!JSON.stringify(f.logs).includes(AUTH));
});

test('abort at response handoff cancels the unconsumed body and never retries',async()=>{
  let ready,cancelled=false;const started=new Promise(resolve=>{ready=resolve;}),controller=new AbortController();
  const f=fixture(()=>new Response(new ReadableStream({pull(){ready();},cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/json'}}));
  const pending=f.client.detail('private:fixture',{signal:controller.signal});await started;controller.abort(new Error(AUTH));
  await rejects(pending,'QUEUE_ABORTED',499);assert.equal(cancelled,true);assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
});

test('abort while reader is pending cancels the stream and never retries',async()=>{
  let ready,cancelled=false;const started=new Promise(resolve=>{ready=resolve;}),controller=new AbortController();
  const f=fixture(()=>new Response(new ReadableStream({pull(){ready();},cancel(){cancelled=true;}},{highWaterMark:0}),{headers:{'Content-Type':'application/json'}}));
  const pending=f.client.detail('private:fixture',{signal:controller.signal});await started;controller.abort(new Error(AUTH));
  await rejects(pending,'QUEUE_ABORTED',499);assert.equal(cancelled,true);assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
});

test('abort during retry sleep stops subsequent GET',async()=>{
  const controller=new AbortController();let attempts=0,sleeping;
  const client=new QueueClient({queueAuthorization:()=>AUTH},{transport:async()=>{attempts++;return response([],503);},log:()=>{},sleep:()=>new Promise(resolve=>{sleeping=resolve;})});
  const pending=client.list('fixture',{signal:controller.signal});
  while(!sleeping) await new Promise(resolve=>setImmediate(resolve));
  controller.abort(new Error(AUTH));await rejects(pending,'QUEUE_ABORTED',499);sleeping();assert.equal(attempts,1);
});

test('recognized body stream network error can retry and recover',async()=>{
  const f=fixture((_call,count)=>count===1?new Response(new ReadableStream({start(controller){controller.error(Object.assign(new Error(AUTH),{code:'ECONNRESET'}));}}),{headers:{'Content-Type':'application/json'}}):response());
  assert.deepEqual((await f.client.list('fixture')).data,[]);assert.equal(f.calls.length,2);assert.deepEqual(f.waits.map(item=>item.ms),[1000]);
});

test('decompressed response cap rejects declared or actual over-limit body without retry',async()=>{
  for(const res of [new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':String(20*1024*1024+1)}}),new Response(new Uint8Array(20*1024*1024+1),{headers:{'Content-Type':'application/json'}})]) {
    const f=fixture(()=>res);await rejects(f.client.list('fixture'),'QUEUE_RESPONSE_TOO_LARGE');assert.equal(f.calls.length,1);assert.equal(f.waits.length,0);
  }
});

test('logs omit input identities and selected IDs, bearer values, response fields and error messages',async()=>{
  const nik='private-fixture-nik',id='private:fixture:id',raw=AUTH.slice(7);
  const f=fixture((_call,count)=>count===1?response([],503):response({id,nama:'payload-'+AUTH,booking:[{kode:'prefix-'+raw}],pemohon:{nama:raw,token:'applicant-private-fixture'}}));
  const out=await f.client.detail(id);
  assert.equal(out.data.nama,'payload-[REDACTED]');assert.deepEqual(out.data.booking,['prefix-[REDACTED]']);assert.equal(out.data.pemohon.nama,'[REDACTED]');
  const text=JSON.stringify(f.logs);
  for(const secret of [nik,id,AUTH,raw,'applicant-private-fixture','payload-']) assert.equal(text.includes(secret),false);
  assert.ok(f.logs.every(item=>item.path==='/konsol/antrian/directus/api/antrian/:id'));
  assert.ok(!JSON.stringify(out).includes(AUTH) && !JSON.stringify(out).includes(raw));
  const list=fixture(()=>response([{id:'fixture',pemohon:AUTH,nomor:raw}]));
  const listed=await list.client.list(nik);assert.equal(listed.data[0].pemohon,'[REDACTED]');assert.equal(listed.data[0].nomor,'[REDACTED]');assert.ok(!JSON.stringify(list.logs).includes(nik));
});

test('broken diagnostic logger cannot turn successful GET into a retry',async()=>{
  let calls=0;
  const client=new QueueClient({queueAuthorization:()=>AUTH},{transport:async()=>{calls++;return response();},log:()=>{throw new Error(AUTH);}});
  assert.deepEqual((await client.list('fixture')).data,[]);assert.equal(calls,1);
});
