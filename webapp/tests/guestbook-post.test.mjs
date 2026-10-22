import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {GuestbookPostClient,GuestbookPostError,prepareGuestbookPostInput,guestbookPostBody,serializeGuestbookPost,guestbookPostOutcome,createGuestbookPostAttempt,guestbookPostWasDispatched} from '../private/guestbook-post.mjs';

const configuration={configured:true,applicationAuthorization:()=>'AtrBpn synthetic-guestbook-submit-app'};
const fields=(patch={})=>({name:' Nama é😀 ',nik:'abcdefghijklmnop',phone:'+62 (raw) ext. 9',birthDate:' 2001/01/02 raw ',birthPlace:' Kota ',address:'a\nb\rc\r\nd',email:' @ ',institution:' Instansi ',purpose:'Tujuan\nbaris kedua',...patch});
const lookup=(patch={})=>({userId:' native user ',kantorId:' office ',unitKerjaId:' unit ',namaUnitKerja:' Nama Kantor ',...patch});
const values=(patch={})=>({contextId:'gbc_'+'x'.repeat(32),...fields(),...patch});
const body=(patch={},ids={})=>guestbookPostBody(lookup(ids),fields(patch));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const code=expected=>error=>error instanceof GuestbookPostError&&error.code===expected;
function fixture(response=()=>Response.json({error:true}),options={}){const calls=[];const client=new GuestbookPostClient(configuration,{transport:async(url,init)=>{calls.push({url,init});return response(url,init);},...options});return{client,calls};}
// Independent parser: exact CRLF framing and byte slices; no product serializer
// or platform FormData value normalization is used to derive expected parts.
function multipart(bytes,contentType){
 const boundary=/^multipart\/form-data; boundary=(--dio-boundary-\d{10})$/.exec(contentType)?.[1];assert.ok(boundary);
 const marker=Buffer.from('--'+boundary),parts=[];let cursor=0;
 while(true){assert.equal(bytes.subarray(cursor,cursor+marker.length).compare(marker),0);cursor+=marker.length;
  if(bytes.subarray(cursor,cursor+4).equals(Buffer.from('--\r\n'))){cursor+=4;break;}
  assert.ok(bytes.subarray(cursor,cursor+2).equals(Buffer.from('\r\n')));cursor+=2;
  const end=bytes.indexOf(Buffer.from('\r\n\r\n'),cursor);assert.ok(end>=cursor);const header=bytes.subarray(cursor,end).toString('utf8');
  const name=/^content-disposition: form-data; name="([A-Za-z]+)"$/.exec(header)?.[1];assert.ok(name);cursor=end+4;
  const next=bytes.indexOf(Buffer.concat([Buffer.from('\r\n'),marker]),cursor);assert.ok(next>=cursor);parts.push([name,bytes.subarray(cursor,next).toString('utf8')]);cursor=next+2;
 }
 assert.equal(cursor,bytes.length);return parts;
}
test('nine form values follow raw aggregate validation without trimming or interpreting dates',()=>{
 const prepared=prepareGuestbookPostInput(values());assert.deepEqual(prepared.fields,fields());assert.ok(Object.isFrozen(prepared)&&Object.isFrozen(prepared.fields));
 for(const birthDate of [' ','20200101','31/99/0000','not-a-date','\n'])assert.equal(prepareGuestbookPostInput(values({birthDate})).fields.birthDate,birthDate);
 assert.equal(prepareGuestbookPostInput(values({nik:'x'.repeat(17)})).fields.nik.length,17);
 for(const key of ['name','phone','birthPlace','address','institution','purpose'])assert.equal(prepareGuestbookPostInput(values({[key]:' '})).fields[key],' ');
 assert.equal(prepareGuestbookPostInput(values({purpose:'x'.repeat(100001)})).fields.purpose.length,100001);
});
test('aggregate input rejects each empty/null/nonstring, shortNIK and missing@ before transport',()=>{
 for(const key of Object.keys(fields()))for(const value of ['',null,undefined,1,true,{},[]])assert.throws(()=>prepareGuestbookPostInput(values({[key]:value})),code('GUESTBOOK_POST_INPUT_INVALID'));
 for(const patch of [{nik:'x'.repeat(15)},{email:'rawemail'},{contextId:'gbc_bad'},{contextId:'gbc_'+'x'.repeat(33)},{purpose:'\ud800'}])assert.throws(()=>prepareGuestbookPostInput(values(patch)),code('GUESTBOOK_POST_INPUT_INVALID'));
});
test('scope refuses extra/accessor/symbol/prototype inputs without invoking getters',()=>{
 let reads=0;const accessor=values();Object.defineProperty(accessor,'name',{enumerable:true,get(){reads++;return 'forged';}});
 for(const input of [accessor,values({extra:true}),Object.assign(values(),{[Symbol('x')]:true}),Object.assign(Object.create({}),values()),null,[]])assert.throws(()=>prepareGuestbookPostInput(input),code('GUESTBOOK_POST_INPUT_INVALID'));
 assert.equal(reads,0);const nullRecord=Object.assign(Object.create(null),values());assert.deepEqual(prepareGuestbookPostInput(nullRecord).fields,fields());
});
test('independent multipart parse proves twelve nativeparts, rawLF/Unicode order and lookup-only IDs',()=>{
 const encoded=serializeGuestbookPost(body(),'--dio-boundary-0000000001');
 assert.deepEqual(multipart(encoded.body,encoded.contentType),[['kantorId',' office '],['unitKerjaId',' unit '],['userId',' native user '],['nik','abcdefghijklmnop'],['alamat','a\nb\rc\r\nd'],['namaLengkap',' Nama é😀 '],['tempatLahir',' Kota '],['tanggalLahir',' 2001/01/02 raw '],['noTelp','+62 (raw) ext. 9'],['email',' @ '],['instansi',' Instansi '],['keperluan','Tujuan\nbaris kedua']]);
 assert.equal(encoded.body.includes(Buffer.from('filename=')),false);assert.equal(encoded.body.includes(Buffer.from('a\r\nb\r\nc')),false);
});
test('nullable lookupIDs become presentempty parts and public unitname never entersPOST',()=>{
 const encoded=serializeGuestbookPost(body({}, {userId:null,kantorId:null,unitKerjaId:'',namaUnitKerja:'private display only'}),'--dio-boundary-4294967295');
 assert.deepEqual(multipart(encoded.body,encoded.contentType).slice(0,3),[['kantorId',''],['unitKerjaId',''],['userId','']]);assert.equal(encoded.body.includes(Buffer.from('private display only')),false);
 for(const patch of [{userId:1},{kantorId:undefined},{extra:true}])assert.throws(()=>guestbookPostBody(lookup(patch),fields()),code('GUESTBOOK_POST_INPUT_INVALID'));
});
test('invalid boundary/body/getters and explicit browserrequest limit fail beforeauth/handoff',async()=>{
 for(const boundary of ['x','--dio-boundary-1','--dio-boundary-4294967296','--dio-boundary-0000000000\r\n'])assert.throws(()=>serializeGuestbookPost(body(),boundary),code('GUESTBOOK_POST_INPUT_INVALID'));
 let getter=0;const raw={...body()};Object.defineProperty(raw,'email',{enumerable:true,get(){getter++;return 'a@b';}});assert.throws(()=>serializeGuestbookPost(raw,'--dio-boundary-0000000000'));assert.equal(getter,0);
 const {client,calls}=fixture();const attempt=createGuestbookPostAttempt();await assert.rejects(client.submit({...body(),extra:true},{attempt}),code('GUESTBOOK_POST_INPUT_INVALID'));assert.equal(guestbookPostWasDispatched(attempt),false);assert.equal(calls.length,0);
 assert.throws(()=>serializeGuestbookPost(body({purpose:'x'.repeat(25*1024*1024)}),'--dio-boundary-0000000000'),code('GUESTBOOK_POST_TOO_LARGE'));
});
test('actualclient fixed standalonePOST sends only appauth and nativepayload, returns no serverbody',async()=>{
 const {client,calls}=fixture(()=>Response.json({error:true,message:'synthetic private server echo',data:{secret:'not exposed'}}));const attempt=createGuestbookPostAttempt();
 assert.deepEqual(await client.submit(body(),{attempt}),{status:200,data:{error:false},delivery:'received'});assert.equal(calls.length,1);assert.equal(guestbookPostWasDispatched(attempt),true);
 const [{url,init}]=calls;assert.equal(url.href,'https://sentuh.atrbpn.go.id/bukutamu');assert.equal(init.method,'POST');assert.equal(init.redirect,'manual');assert.deepEqual(Object.keys(init.headers).sort(),['Authorization','Content-Type']);assert.equal(init.headers.Authorization,configuration.applicationAuthorization());assert.ok(init.signal instanceof AbortSignal);assert.equal(multipart(init.body,init.headers['Content-Type']).length,12);
 await assert.rejects(client.submit(body(),{attempt}),code('GUESTBOOK_POST_ATTEMPT_USED'));assert.equal(calls.length,1);
});
test('defaultHTTPS transport verifieshostname and uses no mainmTLS/bearer/refresh configuration',async t=>{
 let forbidden=0;const requests=[];const config={...configuration,tokens:{accessToken:'must not use'},tlsOptions(){forbidden++;throw Error();},queueTlsOptions(){forbidden++;throw Error();},refresh(){forbidden++;throw Error();}};
 t.mock.method(https,'request',(url,options,callback)=>{const request=new EventEmitter();requests.push({url,options});let ended=false;request.destroy=error=>{if(!ended){ended=true;request.emit('error',error);}};request.end=bytes=>{requests.at(-1).bytes=bytes;const incoming=Readable.from([Buffer.from('{}')]);incoming.statusCode=200;incoming.headers={'content-type':'application/json'};callback(incoming);incoming.once('end',()=>{ended=true;});};return request;});
 assert.equal((await new GuestbookPostClient(config).submit(body())).data.error,false);assert.equal(forbidden,0);assert.equal(requests.length,1);const {options,bytes}=requests[0];assert.equal(options.rejectUnauthorized,true);assert.equal(options.servername,'sentuh.atrbpn.go.id');assert.equal(options.agent,false);assert.equal(options.headers.authorization,configuration.applicationAuthorization());assert.equal(Number(options.headers['content-length']),bytes.length);
 for(const key of ['cert','key','ca','pfx','passphrase','secureContext'])assert.equal(options[key],undefined);
});
test('JSON MIME transforms precede status: emptybody and anyvalidshape ignorebusinessflags',async()=>{
 for(const mime of ['application/json','TEXT/JSON; charset=utf-8','application/problem+json','image/x+json'])for(const text of ['','{}','[]','true','false','null','123','"String"','{"error":true}']){
  const {client}=fixture(()=>new Response(text,{headers:{'Content-Type':mime}}));assert.equal((await client.submit(body())).data.error,false,`${mime}:${text}`);
 }
 assert.equal(guestbookPostOutcome(Buffer.from('\uFEFF{}'),'application/json',200),false);
});
test('malformedJSON, whitespace and fatalUTF8 neverbecomesuccess afterhandoff',async()=>{
 for(const bytes of [Buffer.from(' '),Buffer.from('{bad}'),Buffer.from([255]),Buffer.from([0xc3,0x28]),Buffer.from('\uFEFF\uFEFF{}')]){
  const {client,calls}=fixture(()=>new Response(bytes,{headers:{'Content-Type':'application/json'}}));const attempt=createGuestbookPostAttempt();await assert.rejects(client.submit(body(),{attempt}),code('GUESTBOOK_POST_RESPONSE_INVALID'));assert.equal(guestbookPostWasDispatched(attempt),true);assert.equal(calls.length,1);
 }
});
test('nonJSON usesreplacementUTF8/noJSONsniff and 201/204/299remainknownreceivederror',async()=>{
 for(const type of ['text/plain','application/jsonish','not a mime','']){const {client}=fixture(()=>new Response(Buffer.from([255,123]),{headers:{'Content-Type':type}}));assert.equal((await client.submit(body())).data.error,false);}
 for(const status of [201,202,204,205,299]){const {client}=fixture(()=>new Response(null,{status,headers:{'Content-Type':'application/json'}}));assert.deepEqual(await client.submit(body()),{status,data:{error:true},delivery:'received'});}
});
test('non2xx redirects wrongtarget and forgedResponsesneverretry or exposeupstream details',async()=>{
 for(const status of [301,302,307,308,400,401,403,429,500]){const {client,calls}=fixture(()=>Response.json({message:'synthetic secret'},{status,headers:{Location:'https://example.invalid/private'}}));const attempt=createGuestbookPostAttempt();await assert.rejects(client.submit(body(),{attempt}),error=>{assert.equal(JSON.stringify(error).includes('synthetic secret'),false);return error instanceof GuestbookPostError;});assert.equal(calls.length,1);assert.equal(guestbookPostWasDispatched(attempt),true);}
 for(const response of [{status:200},Object.assign(new Response('{}'),{}),null]){if(response instanceof Response)Object.defineProperty(response,'url',{value:'https://example.invalid/other'});const {client}=fixture(()=>response);await assert.rejects(client.submit(body()),code('GUESTBOOK_POST_RESPONSE_INVALID'));}
 const redirected=new Response('{}');Object.defineProperty(redirected,'redirected',{value:true});await assert.rejects(fixture(()=>redirected).client.submit(body()),code('GUESTBOOK_POST_REDIRECT_REJECTED'));
});
test('declaredandstreamedresponse limits cancelunreadbody and neveracceptpartialresult',async()=>{
 for(const declared of ['65','9999999999999']){let cancel=0;const stream=new ReadableStream({cancel(){cancel++;}});const {client}=fixture(()=>new Response(stream,{headers:{'Content-Length':declared}}),{maxResponseBytes:64});await assert.rejects(client.submit(body()),code('GUESTBOOK_POST_RESPONSE_TOO_LARGE'));assert.equal(cancel,1);}
 let cancel=0;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(65));},cancel(){cancel++;}});await assert.rejects(fixture(()=>new Response(stream),{maxResponseBytes:64}).client.submit(body()),code('GUESTBOOK_POST_RESPONSE_TOO_LARGE'));assert.equal(cancel,1);
});
test('streamfailure and transporterror are sanitizeddispatchedfailures with onePOST',async()=>{
 for(const response of [()=>{throw Object.assign(Error('synthetic secret'),{code:'GUESTBOOK_POST_INPUT_INVALID',details:{private:'never echo'}});},()=>new Response(new ReadableStream({start(c){c.enqueue(Buffer.from('{}'));c.error(Error('private socket text'));}}))]){const {client,calls}=fixture(response),attempt=createGuestbookPostAttempt();await assert.rejects(client.submit(body(),{attempt}),error=>error.code==='GUESTBOOK_POST_NETWORK_ERROR'&&!JSON.stringify(error).includes('private')&&!JSON.stringify(error).includes('synthetic secret'));assert.equal(calls.length,1);assert.equal(guestbookPostWasDispatched(attempt),true);}
});
test('numericContentLength mismatch is nevera completeacceptedresponse',async()=>{
 for(const declared of ['1','3']){const {client}=fixture(()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':declared}}));await assert.rejects(client.submit(body()),code('GUESTBOOK_POST_RESPONSE_INVALID'));}
});
test('configuration errors abortbeforehandoff and do nottrust callerattempts',async()=>{
 for(const config of [{configured:false},{configured:true,applicationAuthorization:()=> 'Bearer not-app'},{configured:true,applicationAuthorization(){throw Error('private-config-value');}}]){let calls=0;const client=new GuestbookPostClient(config,{transport:async()=>{calls++;return Response.json({});}}),attempt=createGuestbookPostAttempt();await assert.rejects(client.submit(body(),{attempt}),code('GUESTBOOK_POST_CONFIGURATION_UNAVAILABLE'));assert.equal(calls,0);assert.equal(guestbookPostWasDispatched(attempt),false);}
 const {client,calls}=fixture();await assert.rejects(client.submit(body(),{attempt:{}}),code('GUESTBOOK_POST_ATTEMPT_USED'));assert.equal(calls.length,0);
});
test('preaborted and requestabortretiretransport; timeouthandleslateResponsewithoutreplay',async()=>{
 const first=fixture(),controller=new AbortController(),attempt=createGuestbookPostAttempt();controller.abort();await assert.rejects(first.client.submit(body(),{signal:controller.signal,attempt}),code('GUESTBOOK_POST_ABORTED'));assert.equal(first.calls.length,0);assert.equal(guestbookPostWasDispatched(attempt),false);
 const pending=deferred(),next=fixture(()=>pending.promise),request=new AbortController(),secondAttempt=createGuestbookPostAttempt(),write=next.client.submit(body(),{signal:request.signal,attempt:secondAttempt});await settle();request.abort('private reason');await assert.rejects(write,code('GUESTBOOK_POST_ABORTED'));assert.equal(next.calls[0].init.signal.aborted,true);assert.equal(guestbookPostWasDispatched(secondAttempt),true);pending.resolve(Response.json({}));await settle();
 let cancelled=0;const late=deferred(),timed=fixture(()=>late.promise,{timeoutMs:5}),keep=setTimeout(()=>{},1000),thirdAttempt=createGuestbookPostAttempt();try{await assert.rejects(timed.client.submit(body(),{attempt:thirdAttempt}),code('GUESTBOOK_POST_TIMEOUT'));assert.equal(guestbookPostWasDispatched(thirdAttempt),true);late.resolve(new Response(new ReadableStream({cancel(){cancelled++;}})));await settle();assert.equal(cancelled,1);assert.equal(timed.calls.length,1);}finally{clearTimeout(keep);}
});
test('constructor rejects invalidtimeouts/transports/limits withoutnetwork',()=>{
 for(const options of [{transport:1},{timeoutMs:0},{timeoutMs:120001},{timeoutMs:1.5},{maxResponseBytes:0},{maxResponseBytes:20*1024*1024+1}])assert.throws(()=>new GuestbookPostClient(configuration,options),TypeError);
});
