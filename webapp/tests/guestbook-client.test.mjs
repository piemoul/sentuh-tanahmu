import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {GuestbookClient,GuestbookClientError} from '../private/guestbook-client.mjs';
const application='AtrBpn synthetic-guestbook-application';
const configuration={configured:true,applicationAuthorization:()=>application};
const query={uid:' qr-kd +%&=/ é😀 ',unid:' qr-id +%&=/ '};
const envelope={error:true,message:' native flag retained ',data:{userId:'lookup-user',kantorId:'office',unitKerjaId:'unit',namaUnitKerja:'Kantor'}};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(options={}){
  const calls=[];const client=new GuestbookClient(configuration,{transport:async(url,init)=>{calls.push({url,init});return Response.json(envelope);},...options});
  return{client,calls};
}
const errorCode=code=>error=>error instanceof GuestbookClientError&&error.code===code;
test('exact standalone GET uses app configuration, fixed origin/path and ordered preserved query',async()=>{
  const {client,calls}=fixture();const result=await client.read(query);
  assert.deepEqual(result,{status:200,contentType:'application/json',data:envelope});assert.equal(calls.length,1);
  const [{url,init}]=calls;assert.ok(url instanceof URL);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/bukutamu');assert.equal(url.hash,'');
  assert.deepEqual([...url.searchParams],[['uid',query.uid],['unid',query.unid]]);assert.equal(init.method,'GET');assert.equal(init.redirect,'manual');
  assert.deepEqual(init.headers,{Authorization:application});assert.ok(init.signal instanceof AbortSignal);
  assert.equal(init.body,undefined);assert.equal(init.files,undefined);assert.equal(init.headers['Content-Type'],undefined);
});
test('empty QR strings remain empty; object key order does not change query order',async()=>{
  const {client,calls}=fixture();await client.read({unid:'',uid:''});assert.equal(calls[0].url.search,'?uid=&unid=');
});
test('no account token, profile, refresh, retries, POST or default main TLS getter',async()=>{
  let getterCalls=0;const config={configured:true,applicationAuthorization(){getterCalls++;return application;},tokens:{accessToken:'never-used'},tlsOptions(){throw new Error('must not read');},queueAuthorization(){throw new Error('must not read');}};
  const calls=[];const client=new GuestbookClient(config,{transport:async(url,init)=>{calls.push({url,init});return Response.json(envelope);}});
  await client.read({uid:'kd',unid:'id'});assert.equal(getterCalls,1);assert.equal(calls.length,1);assert.equal(calls[0].init.headers.Authorization,application);assert.equal(typeof client.post,'undefined');assert.equal(typeof client.submit,'undefined');
});
test('default HTTPS adapter keeps certificate verification and omits main client identity',async t=>{
  const requests=[];let tlsRead=0;
  t.mock.method(https,'request',(url,options,callback)=>{
    requests.push({url,options});const request=new EventEmitter();let ended=false;
    request.destroy=error=>{if(!ended){ended=true;request.emit('error',error);}};
    request.end=()=>{const incoming=Readable.from([Buffer.from(JSON.stringify(envelope))]);incoming.headers={'content-type':'application/json'};incoming.statusCode=200;callback(incoming);incoming.once('end',()=>{ended=true;});};
    return request;
  });
  const client=new GuestbookClient({...configuration,tlsOptions(){tlsRead++;throw new Error('no main identity');}});
  assert.deepEqual((await client.read({uid:'kd',unid:'id'})).data,envelope);assert.equal(tlsRead,0);assert.equal(requests.length,1);
  const {options}=requests[0];assert.equal(options.rejectUnauthorized,true);assert.equal(options.servername,'sentuh.atrbpn.go.id');assert.equal(options.agent,false);
  for(const key of ['secureContext','ca','pfx','passphrase','cert','key'])assert.equal(options[key],undefined);
  assert.equal(options.headers.authorization,application);assert.equal(options.headers['content-type'],undefined);assert.equal(options.headers['content-length'],undefined);
});
test('input scope rejects extra fields, aliases, nonstrings and malformed UTF16 before transport/config',async()=>{
  let auth=0,calls=0;const client=new GuestbookClient({configured:true,applicationAuthorization(){auth++;return application;}},{transport:async()=>{calls++;throw new Error();}});
  const cases=[null,[],{}, {uid:'x'}, {uid:'x',unid:'y',base:'https://example.invalid'}, {uid:'x',unid:1}, {uid:null,unid:'y'}, {UID:'x',unid:'y'}, {uid:'\ud800',unid:'y'}, {uid:'x'.repeat(4097),unid:'y'},Object.create({uid:'x',unid:'y'})];
  for(const value of cases)await assert.rejects(client.read(value),errorCode('GUESTBOOK_INVALID_INPUT'));
  const accessor={unid:'y'};Object.defineProperty(accessor,'uid',{get(){throw new Error('getter must not run');}});await assert.rejects(client.read(accessor),errorCode('GUESTBOOK_INVALID_INPUT'));
  assert.equal(auth,0);assert.equal(calls,0);
});
test('configuration failures and wrong authorization scheme never enter transport or leak text',async()=>{
  const sensitive='sensitive-private-application';let calls=0;
  for(const config of [{configured:false,applicationAuthorization:()=>application},{configured:true},{configured:true,applicationAuthorization(){throw new Error(sensitive);}},...['Bearer wrong','AtrBpn ', 'AtrBpn x\r\nsecret: y', 'AtrBpn a b','AtrBpn '+'x'.repeat(4097)].map(value=>({configured:true,applicationAuthorization:()=>value}))]){
    const client=new GuestbookClient(config,{transport:async()=>{calls++;throw new Error(sensitive);}});
    await assert.rejects(client.read({uid:'x',unid:'y'}),error=>error.code==='GUESTBOOK_CONFIGURATION_UNAVAILABLE'&&error.status===503&&!JSON.stringify(error).includes(sensitive));
  }
  assert.equal(calls,0);
});
for(const status of [201,204,400,401,403,429,500])test(`HTTP ${status} is not200 success and never retries`,async()=>{
  let calls=0,cancelled=0;const response=new Response(status===204?null:new ReadableStream({cancel(){cancelled++;}}),{status});
  const client=new GuestbookClient(configuration,{transport:async()=>{calls++;return response;}});
  await assert.rejects(client.read({uid:'x',unid:'y'}),error=>error.code==='GUESTBOOK_HTTP_STATUS'&&error.status===502&&error.details.upstreamStatus===status);
  await settle();assert.equal(calls,1);assert.equal(cancelled,status===204?0:1);
});
for(const status of [301,302,303,307,308])test(`redirect ${status} is rejected without exposing Location or another request`,async()=>{
  const sensitive='https://example.invalid/sensitive-private-query';let calls=0;
  const client=new GuestbookClient(configuration,{transport:async()=>{calls++;return new Response('',{status,headers:{Location:sensitive}});}});
  await assert.rejects(client.read({uid:'x',unid:'y'}),error=>error.code==='GUESTBOOK_REDIRECT_REJECTED'&&!JSON.stringify(error).includes(sensitive));assert.equal(calls,1);
});
test('already-followed or changed-response URL is rejected even if transport reports200',async()=>{
  for(const property of ['redirected','url']){
    const response=Response.json(envelope);Object.defineProperty(response,property,{value:property==='redirected'?true:'https://example.invalid/leak'});
    const {client}=fixture({transport:async()=>response});await assert.rejects(client.read({uid:'x',unid:'y'}),errorCode(property==='redirected'?'GUESTBOOK_REDIRECT_REJECTED':'GUESTBOOK_RESPONSE_UNRECOGNIZED'));
  }
});
test('malformed JSON, wrong model and JSON String are never converted to populated metadata',async()=>{
  for(const text of ['not-json-sensitive','',JSON.stringify(JSON.stringify(envelope)),JSON.stringify({data:{userId:9}}),JSON.stringify({error:1,data:envelope.data})]){
    const {client}=fixture({transport:async()=>new Response(text,{headers:{'content-type':'application/json'}})});
    await assert.rejects(client.read({uid:'x',unid:'y'}),errorCode('GUESTBOOK_RESPONSE_UNRECOGNIZED'));
  }
});
test('HTTP200 data:null and error:true stay honest parsed results',async()=>{
  const {client}=fixture({transport:async()=>Response.json({error:true,data:null})});
  assert.deepEqual((await client.read({uid:'x',unid:'y'})).data,{error:true,message:null,data:null});
});
test('response byte limit rejects declared and streamed excess and cancels body',async()=>{
  for(const declared of [true,false]){
    let cancelled=0;const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(65));},cancel(){cancelled++;}});
    const response=new Response(stream,{headers:{'content-type':'application/json',...(declared?{'content-length':'65'}:{})}});
    const {client}=fixture({maxResponseBytes:64,transport:async()=>response});
    await assert.rejects(client.read({uid:'x',unid:'y'}),errorCode('GUESTBOOK_RESPONSE_TOO_LARGE'));await settle();assert.equal(cancelled,1);
  }
});
test('response bound counts UTF8 bytes and accepts exact boundary',async()=>{
  const body=JSON.stringify({data:{namaUnitKerja:'é😀'}}),length=Buffer.byteLength(body);
  const ok=fixture({maxResponseBytes:length,transport:async()=>new Response(body,{headers:{'content-type':'application/json'}})});assert.equal((await ok.client.read({uid:'x',unid:'y'})).data.data.namaUnitKerja,'é😀');
  const bad=fixture({maxResponseBytes:length-1,transport:async()=>new Response(body,{headers:{'content-type':'application/json'}})});await assert.rejects(bad.client.read({uid:'x',unid:'y'}),errorCode('GUESTBOOK_RESPONSE_TOO_LARGE'));
});
test('invalid UTF8 is rejected instead of replacing model string bytes',async()=>{
  const body=Buffer.concat([Buffer.from('{"data":{"userId":"'),Buffer.from([0xc0,0xaf]),Buffer.from('"}}')]);
  const {client}=fixture({transport:async()=>new Response(body,{headers:{'content-type':'application/json'}})});await assert.rejects(client.read({uid:'x',unid:'y'}),errorCode('GUESTBOOK_RESPONSE_UNRECOGNIZED'));
});
test('pre-aborted request does not read configuration or call transport, and hides abort reason',async()=>{
  let auth=0,calls=0;const controller=new AbortController();controller.abort(new Error('sensitive-abort-reason'));
  const client=new GuestbookClient({configured:true,applicationAuthorization(){auth++;return application;}},{transport:async()=>{calls++;return Response.json(envelope);}});
  await assert.rejects(client.read({uid:'x',unid:'y'},{signal:controller.signal}),error=>error.code==='GUESTBOOK_REQUEST_ABORTED'&&!error.message.includes('sensitive'));
  assert.equal(auth,0);assert.equal(calls,0);
});
test('abort while transport pending settles promptly and cancels late response body',async()=>{
  const pending=deferred();let cancelled=0,requestSignal;
  const {client}=fixture({transport:async(_url,init)=>{requestSignal=init.signal;return pending.promise;}});
  const controller=new AbortController(),read=client.read({uid:'x',unid:'y'},{signal:controller.signal});await settle();controller.abort('private');
  await assert.rejects(read,errorCode('GUESTBOOK_REQUEST_ABORTED'));assert.equal(requestSignal.aborted,true);
  pending.resolve(new Response(new ReadableStream({cancel(){cancelled++;}})));await settle();assert.equal(cancelled,1);
});
test('abort during body read cancels reader and never returns late metadata',async()=>{
  let cancelled=0;const body=new ReadableStream({start(controller){controller.enqueue(Buffer.from('{"data":'));},cancel(){cancelled++;}});
  const {client}=fixture({transport:async()=>new Response(body,{headers:{'content-type':'application/json'}})});const controller=new AbortController();
  const read=client.read({uid:'x',unid:'y'},{signal:controller.signal});await settle();controller.abort();
  await assert.rejects(read,errorCode('GUESTBOOK_REQUEST_ABORTED'));await settle();assert.equal(cancelled,1);assert.equal(body.locked,false);
});
test('timeout covers stalled transport and body without retry',async()=>{
  const keepAlive=setTimeout(()=>{},500);try{
    for(const body of [false,true]){
      let calls=0,cancelled=0;const pending=deferred();const {client}=fixture({timeoutMs:10,transport:async()=>{calls++;return body?new Response(new ReadableStream({cancel(){cancelled++;}}),{headers:{'content-type':'application/json'}}):pending.promise;}});
      await assert.rejects(client.read({uid:'x',unid:'y'}),error=>error.code==='GUESTBOOK_TIMEOUT'&&error.status===504);assert.equal(calls,1);
      if(body){await settle();assert.equal(cancelled,1);}else pending.reject(new Error('late-private-failure'));
    }
  }finally{clearTimeout(keepAlive);}
});
test('provider errors, forged public error class and body failures are sanitized without causes',async()=>{
  const sensitive='private-upstream-Authorization-query-value';
  for(const source of [()=>{throw new Error(sensitive);},()=>{throw new GuestbookClientError(502,'FAKE',sensitive,{url:sensitive});},()=>new Response(new ReadableStream({start(controller){controller.error(new Error(sensitive));}}),{headers:{'content-type':'application/json'}})]){
    const {client}=fixture({transport:async()=>source()});await assert.rejects(client.read({uid:sensitive,unid:sensitive}),error=>error.code==='GUESTBOOK_NETWORK_ERROR'&&!JSON.stringify(error).includes(sensitive)&&!error.message.includes(sensitive)&&error.cause===undefined);
  }
});
test('concurrent readers have independent URLs, signals and results',async()=>{
  const a=deferred(),b=deferred(),calls=[];const {client}=fixture({transport:async(url,init)=>{calls.push({url,init});return url.searchParams.get('uid')==='a'?a.promise:b.promise;}});
  const stop=new AbortController(),first=client.read({uid:'a',unid:'1'},{signal:stop.signal}),second=client.read({uid:'b',unid:'2'});await settle();stop.abort();
  await assert.rejects(first,errorCode('GUESTBOOK_REQUEST_ABORTED'));b.resolve(Response.json(envelope));assert.deepEqual((await second).data,envelope);assert.notEqual(calls[0].init.signal,calls[1].init.signal);a.resolve(Response.json({data:null}));await settle();
});
test('synchronous cancellation inside configuration is handled without unhandled rejection',async()=>{
  const controller=new AbortController();let calls=0;const client=new GuestbookClient({configured:true,applicationAuthorization(){controller.abort();return application;}},{transport:async()=>{calls++;return Response.json(envelope);}});
  await assert.rejects(client.read({uid:'x',unid:'y'},{signal:controller.signal}),errorCode('GUESTBOOK_REQUEST_ABORTED'));await settle();assert.equal(calls,0);
});
test('all returned String slots redact exact request header and raw suffix across configuration changes',async()=>{
  const pending=deferred(),raw=application.slice('AtrBpn '.length);let auth=application,getterCalls=0;
  const client=new GuestbookClient({configured:true,applicationAuthorization(){getterCalls++;return auth;}},{transport:async()=>pending.promise});
  const read=client.read({uid:'kd',unid:'id'});await settle();auth='AtrBpn synthetic-next-generation';
  pending.resolve(Response.json({error:true,message:`${application} ${raw}`,data:{userId:raw,kantorId:application,unitKerjaId:`before:${raw}:after`,namaUnitKerja:`${raw} ${application}`}}, {headers:{'content-type':`application/json; echo="${raw}"`}}));
  const result=await read;assert.equal(getterCalls,1);const output=JSON.stringify(result);assert.ok(!output.includes(application));assert.ok(!output.includes(raw));
  assert.equal(result.data.error,true);assert.equal(result.data.data.userId,'[REDACTED]');assert.equal(result.data.data.unitKerjaId,'before:[REDACTED]:after');assert.equal(result.contentType,'application/json');
});
test('JSON MIME is normalized without reflecting parameters; explicit browser transformer guard',async()=>{
  for(const [header,mime] of [['Application/JSON; charset=utf-8','application/json'],['text/json; echo="private"','text/json'],['application/vnd.atr+json; v=1','application/vnd.atr+json']]){
    const {client}=fixture({transport:async()=>new Response(JSON.stringify(envelope),{headers:{'content-type':header}})});
    assert.equal((await client.read({uid:'x',unid:'y'})).contentType,mime);
  }
});
test('JSON-looking non-JSON MIME, missing or malformed MIME fail closed',async()=>{
  for(const mime of [null,'text/plain','text/html','application/jsonx','application/json, text/html','application/'+ 'x'.repeat(257)+'+json']){
    const {client}=fixture({transport:async()=>new Response(Buffer.from(JSON.stringify(envelope)),{headers:mime===null?{}:{'content-type':mime}})});
    await assert.rejects(client.read({uid:'x',unid:'y'}),errorCode('GUESTBOOK_RESPONSE_UNRECOGNIZED'));
  }
});
test('an authorization suffix echoed inside a syntactically valid JSON MIME token is also rejected',async()=>{
  const raw=application.slice('AtrBpn '.length),{client}=fixture({transport:async()=>Response.json(envelope,{headers:{'content-type':`application/${raw}+json`}})});
  await assert.rejects(client.read({uid:'x',unid:'y'}),error=>error.code==='GUESTBOOK_RESPONSE_UNRECOGNIZED'&&!JSON.stringify(error).includes(raw));
});
