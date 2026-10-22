import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {SessionStore,COOKIE} from '../private/session.mjs';

const READ='get-bukutamu-d28bf4',POST='post-bukutamu-d99dd8';
const query={uid:' SYNTHETIC QR UID +&/ ',unid:' SYNTHETIC QR UNIT +&/ '};
const source={userId:' SYNTHETIC USER +&/ ',kantorId:' SYNTHETIC OFFICE +&/ ',unitKerjaId:' SYNTHETIC UNIT +&/ ',namaUnitKerja:'UNIT SINTETIS'};
const fields={name:' Nama Sintetis ',nik:' not-a-digit-123456 ',phone:' +62 000 ',birthDate:' 01011990 ',birthPlace:' Kota Sintetis ',address:' Alamat\nSintetis\rTetap ',email:' synthetic @ example.invalid ',institution:' Instansi Sintetis ',purpose:' Baris satu\nbaris dua\rbaris tiga\r\nakhir é '};
const names=['kantorId','unitKerjaId','userId','nik','alamat','namaLengkap','tempatLahir','tanggalLahir','noTelp','email','instansi','keperluan'];
const delay=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let n=0;n<1000;n++){if(predicate())return;await delay();}throw Error('Synthetic handoff was not reached');}
function parts(raw,type){
 assert.ok(Buffer.isBuffer(raw));const match=/^multipart\/form-data; boundary=(--dio-boundary-\d{10})$/.exec(type??'');assert.ok(match);
 const boundary=match[1],open=Buffer.from('--'+boundary+'\r\n'),divider=Buffer.from('\r\n--'+boundary),end=Buffer.from('--'+boundary+'--\r\n');
 assert.ok(raw.subarray(0,open.length).equals(open));assert.ok(raw.subarray(-end.length).equals(end));
 const values=[];let cursor=open.length;
 while(cursor<raw.length){const headEnd=raw.indexOf('\r\n\r\n',cursor),valueEnd=raw.indexOf(divider,headEnd+4);assert.ok(headEnd>=cursor&&valueEnd>=headEnd+4);
  const header=raw.subarray(cursor,headEnd).toString('utf8'),name=/^content-disposition: form-data; name="([^"\r\n]+)"$/.exec(header);assert.ok(name,'No filename, extra header or file part');
  const bytes=raw.subarray(headEnd+4,valueEnd);values.push([name[1],new TextDecoder('utf8',{fatal:true}).decode(bytes)]);
  const next=valueEnd+divider.length;if(raw.subarray(next,next+4).toString()==='--\r\n'){assert.equal(next+4,raw.length);break;}
  assert.equal(raw.subarray(next,next+2).toString(),'\r\n');cursor=next+2;
 }
 assert.deepEqual(values.map(row=>row[0]),names);return Object.fromEntries(values);
}
async function fixture(t,{readReply,postReply,lookup=()=>source}={}){
 let now=1000,authorization='AtrBpn synthetic-application';const calls=[],mainCalls=[];
 const sessions=new SessionStore({now:()=>now}),configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=>authorization};
 const transport=async(url,init)=>{assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/bukutamu');assert.equal(init.redirect,'manual');calls.push({url,init});
  if(init.method==='GET'){assert.deepEqual(Object.keys(init.headers),['Authorization']);assert.equal(init.body,undefined);return await readReply?.(url,init)??Response.json({error:false,message:null,data:lookup()});}
  assert.equal(init.method,'POST');assert.equal(url.search,'');return await postReply?.(url,init)??Response.json({error:true,message:'BODY IGNORED SINTETIS'});
 };
 const server=createServer({configuration,sessions,now:()=>now,guestbookNow:()=>now,guestbookTransport:transport,guestbookPostTransport:transport,transport:async(url,init)=>{mainCalls.push({url,init});throw Error('Unexpected main account transport');},log(){}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const origin='http://127.0.0.1:'+server.address().port;
 function browser(authenticated=true){const session=sessions.create();if(authenticated){session.user={username:'synthetic-owner'};session.tokens={tokenType:'Bearer',accessToken:'synthetic-access',refreshToken:'synthetic-refresh',expiredAt:null};}
  const request=async(data,headers={})=>{const response=await fetch(origin+'/api/execute',{method:'POST',headers:{Cookie:COOKIE+'='+session.id,Origin:origin,'X-CSRF-Token':session.csrfToken,...(data instanceof FormData?{}:{'Content-Type':'application/json'}),...headers},body:data instanceof FormData?data:JSON.stringify(data)});return {status:response.status,body:await response.json()};};
  const read=(values=query)=>request({operationId:READ,values});
  const open=async(values=query)=>{const response=await read(values);assert.equal(response.status,200,JSON.stringify(response.body));const id=response.body.result.guestbookContextId;assert.match(id,/^gbc_[A-Za-z0-9_-]{32}$/);return id;};
  const write=(contextId,patch={},extra={})=>request({operationId:POST,values:{contextId,...fields,...patch},confirm:true,...extra});
  return {session,request,read,open,write};
 }
 return {calls,mainCalls,sessions,browser,user:browser(),advance:ms=>now+=ms,authorization:value=>authorization=value,posts:()=>calls.filter(row=>row.init.method==='POST')};
}

test('HTTP QR-bound lookup then one confirmed submit preserves12 ordered rawUTF8 parts and standalone application authorization',async t=>{
 const h=await fixture(t),context=await h.user.open();assert.equal(h.posts().length,0);
 const response=await h.user.write(context);assert.equal(response.status,200);assert.deepEqual(response.body.result,{status:200,data:{error:false},delivery:'received'});assert.equal(h.posts().length,1);
 const request=h.posts()[0].init,body=parts(request.body,request.headers['Content-Type']);
 assert.deepEqual(body,{kantorId:source.kantorId,unitKerjaId:source.unitKerjaId,userId:source.userId,nik:fields.nik,alamat:fields.address,namaLengkap:fields.name,tempatLahir:fields.birthPlace,tanggalLahir:fields.birthDate,noTelp:fields.phone,email:fields.email,instansi:fields.institution,keperluan:fields.purpose});
 assert.equal(request.headers.Authorization,'AtrBpn synthetic-application');assert.doesNotMatch(JSON.stringify(request.headers),/Bearer|synthetic-access|synthetic-refresh/);assert.equal(h.mainCalls.length,0);
 assert.equal((await h.user.write(context)).status,409);assert.equal(h.posts().length,1);
});

test('HTTP origin,CSRF,confirmation,rawlookupIDs,extra fields and files cannot reach the native writer',async t=>{
 const h=await fixture(t),context=await h.user.open(),data={operationId:POST,values:{contextId:context,...fields},confirm:true};
 for(const headers of [{Origin:'https://other.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await h.user.request(data,headers)).status,403);
 const confirmation=await h.user.write(context,{}, {confirm:false});assert.equal(confirmation.body.error.code,'CONFIRMATION_REQUIRED');assert.equal(confirmation.body.error.details.delivery,'not_sent');
 for(const patch of [{kantorId:'forged'},{unitKerjaId:'forged'},{userId:'forged'},{name:''},{nik:'123'},{email:'invalid'},{purpose:null},{birthDate:1011990}]){const invalid=await h.user.write(context,patch);assert.equal(invalid.status,400);assert.equal(invalid.body.error.details.delivery,'not_sent');}
 const form=new FormData();form.set('operationId',POST);form.set('values',JSON.stringify(data.values));form.set('confirm','true');form.append('file',new File(['SINTETIS'],'synthetic.txt'));const file=await h.user.request(form);assert.equal(file.status,400);assert.equal(file.body.error.details.delivery,'not_sent');
 const scope=await h.user.write(context,{}, {guestbookContextId:context});assert.equal(scope.status,400);assert.equal(scope.body.error.code,'GUESTBOOK_POST_SCOPE');assert.equal(scope.body.error.details.delivery,'not_sent');
 const anonymous=await h.browser(false).write(context);assert.equal(anonymous.status,401);assert.equal(anonymous.body.error.details.delivery,'not_sent');assert.equal(h.posts().length,0);
});

test('HTTP null/malformed lookup cannot mint a context; native errortrue plus valid nullable lookup still can',async t=>{
 for(const data of [null,{...source,userId:3}]){const h=await fixture(t,{readReply:()=>Response.json({error:false,message:null,data})}),response=await h.user.read();assert.equal(response.body.result?.guestbookContextId,undefined);assert.equal(h.posts().length,0);}
 const h=await fixture(t,{readReply:()=>Response.json({error:true,message:'SINTETIS',data:{userId:null,kantorId:null,unitKerjaId:null,namaUnitKerja:null}})}),context=await h.user.open();
 assert.equal((await h.user.write(context)).body.result.data.error,false);const body=parts(h.posts()[0].init.body,h.posts()[0].init.headers['Content-Type']);for(const key of ['kantorId','unitKerjaId','userId'])assert.equal(body[key],'');
});

test('HTTP context is account-owned, expires at10minutes and is replaced by every subsequent QR read',async t=>{
 const h=await fixture(t),context=await h.user.open();assert.equal((await h.browser().write(context)).status,409);assert.equal((await h.browser(false).write(context)).status,401);
 h.advance(600000);const expired=await h.user.write(context);assert.equal(expired.status,409);assert.equal(expired.body.error.details.delivery,'not_sent');assert.equal(h.posts().length,0);
 const fresh=await h.user.open();await h.user.open({uid:'DIFFERENT SYNTHETIC',unid:'UNIT'});assert.equal((await h.user.write(fresh)).status,409);assert.equal(h.posts().length,0);
});

test('HTTP200 accepts empty or any validJSON root and ignores businesserrortrue; textplain malformedJSON uses text path',async t=>{
 for(const [body,type]of [['','application/json'],['null','application/json'],['false','text/json'],['42','application/problem+json'],['"SINTETIS"','application/json'],['[]','application/json'],['{"error":true}','application/json'],['{bad JSON','text/plain']]){
  const h=await fixture(t,{postReply:()=>new Response(body,{headers:{'Content-Type':type}})}),context=await h.user.open(),response=await h.user.write(context);assert.equal(response.status,200);assert.deepEqual(response.body.result.data,{error:false});assert.equal(response.body.result.delivery,'received');assert.equal(h.posts().length,1);
 }
});

test('HTTP201 is a known received error, preserves explicit retry; accepted IDguard survives readyTTL and relookup',async t=>{
 let status=201;const h=await fixture(t,{postReply:()=>Response.json({error:false},{status})}),context=await h.user.open();
 const known=await h.user.write(context);assert.equal(known.status,200);assert.deepEqual(known.body.result,{status:201,data:{error:true},delivery:'received'});await delay();assert.equal(h.posts().length,1);
 status=200;assert.equal((await h.user.write(context)).body.result.data.error,false);assert.equal(h.posts().length,2);h.advance(600001);const fresh=await h.user.open();assert.equal((await h.user.write(fresh)).body.error.code,'GUESTBOOK_ATTEMPT_USED');assert.equal(h.posts().length,2);
});

test('HTTP malformedJSON,oversize,truncation,drop,redirect,non2xx and invalidUTF8 remain unknown and never auto-retry',async t=>{
 const scenarios=[()=>new Response('{bad}',{headers:{'Content-Type':'application/json'}}),()=>new Response('x',{headers:{'Content-Type':'text/plain','content-length':'20971521'}}),()=>new Response('{}',{headers:{'Content-Type':'application/json','content-length':'3'}}),()=>{throw Error('Synthetic drop');},()=>new Response(null,{status:302,headers:{Location:'https://other.invalid'}}),()=>Response.json({error:false},{status:503}),()=>new Response(Uint8Array.of(0xff),{headers:{'Content-Type':'application/json'}}),()=>new Response(new ReadableStream({start(controller){controller.error(Error('Synthetic body loss'));}}),{headers:{'Content-Type':'application/json'}})];
 for(const postReply of scenarios){const h=await fixture(t,{postReply}),context=await h.user.open(),response=await h.user.write(context);assert.equal(response.body.ok,false);assert.equal(response.body.error.details.delivery,'unknown');assert.equal(h.posts().length,1);await delay();assert.equal(h.posts().length,1);h.advance(600001);const fresh=await h.user.open();assert.equal((await h.user.write(fresh)).body.error.code,'GUESTBOOK_ATTEMPT_USED');assert.equal(h.posts().length,1);}
});

test('HTTP pending singleflight blocks second click and logout prevents late accepted result from publication',async t=>{
 let release;const h=await fixture(t,{postReply:()=>new Promise(resolve=>release=resolve)}),context=await h.user.open(),pending=h.user.write(context);await until(()=>release);
 assert.equal((await h.user.write(context)).status,409);assert.equal(h.posts().length,1);h.sessions.delete(h.user.session.id);release(Response.json({error:true}));const result=await pending;assert.equal(result.body.ok,false);assert.equal(result.body.error.details.delivery,'unknown');assert.equal(h.posts().length,1);
});

test('HTTP latest read alone can own context when two lookup requests complete out of order',async t=>{
 let release;const h=await fixture(t,{readReply:url=>url.searchParams.get('uid')==='HELD SYNTHETIC'?new Promise(resolve=>release=resolve):undefined});
 const pending=h.user.read({uid:'HELD SYNTHETIC',unid:'UNIT'});await until(()=>release);const current=await h.user.open();release(Response.json({error:false,message:null,data:source}));const stale=await pending;assert.equal(stale.body.result.guestbookContextId,undefined);assert.equal((await h.user.write(current)).body.result.data.error,false);assert.equal(h.posts().length,1);
});

test('HTTP sessionrotation invalidates old GETcontinuation and old opaque context without touching fresh account',async t=>{
 let release;const h=await fixture(t,{readReply:url=>url.searchParams.get('uid')==='HELD SYNTHETIC'?new Promise(resolve=>release=resolve):undefined}),old=await h.user.open();
 const pending=h.user.read({uid:'HELD SYNTHETIC',unid:'UNIT'});await until(()=>release);h.sessions.delete(h.user.session.id);const next=h.browser(),fresh=await next.open();release(Response.json({error:false,message:null,data:source}));const stale=await pending;assert.equal(stale.body.ok,false);assert.equal(stale.body.result,undefined);assert.equal((await next.write(old)).status,409);assert.equal((await next.write(fresh)).body.result.data.error,false);assert.equal(h.posts().length,1);
});

test('HTTP standalone write never refreshes even when accounttoken metadata is expired',async t=>{
 const h=await fixture(t);h.user.session.tokens.expiredAt=0;const context=await h.user.open();assert.equal((await h.user.write(context)).body.result.data.error,false);assert.equal(h.mainCalls.length,0);assert.deepEqual(h.calls.map(row=>row.init.method),['GET','POST']);
});

test('HTTP public redaction never changes private rawlookupIDs or binds them to rotated appheader',async t=>{
 const raw={userId:'AtrBpn synthetic-application',kantorId:'ID-synthetic-access-RAW',unitKerjaId:'synthetic-application',namaUnitKerja:'UNIT SINTETIS'};
 const h=await fixture(t,{lookup:()=>raw}),response=await h.user.read();assert.equal(response.status,200);assert.doesNotMatch(JSON.stringify(response.body),/synthetic-access|synthetic-application/);assert.match(JSON.stringify(response.body),/REDACTED/);
 const context=response.body.result.guestbookContextId;assert.match(context,/^gbc_/);h.authorization('AtrBpn synthetic-rotated-application');const result=await h.user.write(context);assert.equal(result.body.result.data.error,false);
 const request=h.posts()[0].init,body=parts(request.body,request.headers['Content-Type']);assert.equal(request.headers.Authorization,'AtrBpn synthetic-rotated-application');for(const key of ['kantorId','unitKerjaId','userId'])assert.equal(body[key],raw[key]);assert.doesNotMatch(JSON.stringify(result.body),/synthetic-access|synthetic-application|synthetic-rotated/);assert.equal(h.mainCalls.length,0);
});
