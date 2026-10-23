import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation,getOperation} from '../private/operations.mjs';
import {BERKAS_RATING_ID as ID,BERKAS_RATING_PATH as PATH,BERKAS_RATING_MESSAGE as MISSING,prepareBerkasRatingPost as prepare,prepareBerkasRatingInput as input,trimBerkasRatingComment as trim,serializeBerkasRatingPost as serialize,decodeBerkasRatingValue as decode,decodeBerkasRatingBytes as bytes,createBerkasRatingAttempt as attempt,berkasRatingWasDispatched as dispatched} from '../private/berkas-rating-post.mjs';
const contextId='brc_'+'a'.repeat(32),values=(patch={})=>({Berkasid:' original ID :+&/ ',rating:3,userComment:' \u0085 Raw 日本語\nline \uFEFF ',...patch});
const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=> 'AtrBpn synthetic-app'};
const session=()=>({active:true,user:{username:'synthetic'},tokens:{tokenType:'Bearer',accessToken:'synthetic-access',refreshToken:null,expiredAt:4e9}});
function client(reply=()=>Response.json({error:false,message:'SINTETIS'})){
 const calls=[],value=new ApiClient(configuration,{log(){},transport:async(url,init)=>{calls.push({url,init});return reply(url,init);}});
 return {value,calls,send:(patch={})=>value.request({path:PATH,method:'POST',encoding:'multipart',auth:'session',session:session(),clientProfile:'berkas-rating-post',body:values(),query:{},files:[],berkasRatingAttempt:attempt(),berkasRatingBoundary:'--dio-boundary-0000000042',...patch})};
}

test('native input keeps original source ID, trims only comment and admits exact positive star integers',()=>{
 for(const rating of [1,2,3,4,5])assert.deepEqual({...prepare(values({rating}))},{Berkasid:' original ID :+&/ ',rating,userComment:'Raw 日本語\nline'});
 assert.deepEqual(input({contextId,rating:5,userComment:' \u0085comment\u0085 '}),{contextId,rating:5,userComment:'comment'});
 for(const value of [0,-1,1.5,6,'3',NaN,Infinity,null])assert.throws(()=>prepare(values({rating:value})),{code:'INVALID_BERKAS_RATING'});
 for(const value of ['',null,undefined,7,{},' \u0085\n\uFEFF'])assert.throws(()=>prepare(values({userComment:value})));
 assert.equal(trim('\u200Bkept\u200B'),'\u200Bkept\u200B');assert.equal(trim('\0kept\0'),'\0kept\0');
 const long='x'.repeat(20000);assert.equal(prepare(values({userComment:long})).userComment,long,'No invented native comment length cap');
});

test('raw IDs cannot enter public writer inputs and accessors/unknown/prototype/symbol records never execute',()=>{
 let reads=0;const examples=[null,[],1,{},values({Berkasid:null}),values({Berkasid:1}),values({Berkasid:''}),{...values(),extra:1},{...values(),[Symbol('extra')]:1},Object.assign(Object.create({}),values())];
 for(const value of examples)assert.throws(()=>prepare(value));
 for(const key of ['Berkasid','rating','userComment']){const value=values();Object.defineProperty(value,key,{get(){reads++;return 'never';}});assert.throws(()=>prepare(value));}
 for(const value of [{Berkasid:'raw',rating:3,userComment:'x'},{contextId:'raw',rating:3,userComment:'x'},{contextId,rating:3,userComment:'x',Berkasid:'raw'}])assert.throws(()=>input(value));
 assert.equal(reads,0);
});

test('multipart has exactly three ordered rawUTF8 parts and native finalizer without WHATWG newline conversion',async()=>{
 const body=serialize(values({Berkasid:'raw\nID',userComment:' \u0085first\nsecond\r\nthird & + " 日本語\0 '}),'--dio-boundary-0000000042');
 const expected='----dio-boundary-0000000042\r\ncontent-disposition: form-data; name="Berkasid"\r\n\r\nraw\nID\r\n----dio-boundary-0000000042\r\ncontent-disposition: form-data; name="rating"\r\n\r\n3\r\n----dio-boundary-0000000042\r\ncontent-disposition: form-data; name="userComment"\r\n\r\nfirst\nsecond\r\nthird & + " 日本語\0\r\n----dio-boundary-0000000042--\r\n';
 assert.deepEqual(body.body,Buffer.from(expected));assert.equal(body.contentType,'multipart/form-data; boundary=--dio-boundary-0000000042');
 const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':body.contentType},body:body.body}).formData();assert.deepEqual([...form.keys()],['Berkasid','rating','userComment']);assert.equal(form.get('rating'),'3');
 for(const boundary of ['',null,'a\r\nx','a'.repeat(121),'space here'])assert.throws(()=>serialize(values(),boundary));
});

test('strict direct response retains native nullable defaults and empty strings without second JSON decode',()=>{
 assert.deepEqual(decode({error:false,message:' exact '}),{error:false,message:' exact '});
 assert.deepEqual(decode({error:false,message:''}),{error:false,message:''});
 assert.deepEqual(decode({}),{error:true,message:MISSING});assert.deepEqual(decode({error:null,message:null}),{error:true,message:MISSING});
 assert.deepEqual(decode({error:false}),{error:false,message:MISSING});
 let reads=0;const good={error:false,message:'x'};Object.defineProperty(good,'data',{get(){reads++;throw Error('unused');}});assert.deepEqual(decode(good),{error:false,message:'x'});
 for(const value of [null,[],'{"error":false}',true,1,JSON.rawJSON('1'),{error:undefined},{error:0},{error:'false'},{message:undefined},{message:1},Object.create({error:false})])assert.throws(()=>decode(value),{code:'INVALID_BERKAS_RATING_RESPONSE'});
 for(const key of ['error','message']){const value={error:false,message:'x'};Object.defineProperty(value,key,{get(){reads++;return 'never';}});assert.throws(()=>decode(value),{code:'INVALID_BERKAS_RATING_RESPONSE'});}assert.equal(reads,0);
});

test('MIME transform accepts strict2xx JSON objects only and never calls controller exceptionalfalse acceptance',()=>{
 const raw=Buffer.from('{"error":false,"message":"SINTETIS"}');
 for(const status of [200,201,202,206,299])for(const mime of ['application/json','text/json','application/problem+json','image/x+json','APPLICATION/JSON; charset=utf-8'])assert.deepEqual(bytes(raw,mime,status),{error:false,message:'SINTETIS'});
 for(const mime of ['text/plain','invalid',''])assert.throws(()=>bytes(raw,mime),{code:'INVALID_BERKAS_RATING_RESPONSE'});
 for(const raw of [Buffer.alloc(0),Buffer.from(' '),Buffer.from('{bad}'),Buffer.from('null'),Buffer.from('"{\\"error\\":false}"'),Buffer.from([255]),Buffer.concat([Buffer.from('{"error":false,"message":"'),Buffer.from([255]),Buffer.from('"}')])])assert.throws(()=>bytes(raw,'application/json'),{code:'INVALID_BERKAS_RATING_RESPONSE'});
 for(const status of [0,null,199,300,401,500])assert.throws(()=>bytes(raw,'application/json',status),{code:'INVALID_BERKAS_RATING_RESPONSE'});
 assert.deepEqual(bytes(Buffer.concat([Buffer.from([239,187,191]),raw]),'application/json'),{error:false,message:'SINTETIS'});
});

test('Berkas Rating catalog record and later Buku Tamu/Tanya deltas remain exact; rawclientIDs stay unavailable',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/berkas-rating-runtime-baseline.json',import.meta.url))),before=new Map(baseline.catalog.operations.map(row=>[row.id,row.sha256]));
 const changed=OPERATIONS.filter(op=>createHash('sha256').update(JSON.stringify(op)).digest('hex')!==before.get(op.id)).map(op=>op.id);assert.deepEqual(changed,['post-tanyajawab-submitpertanyaan-d994f4',ID,'post-bukutamu-d99dd8','get-tanyajawab-gettanyajawabberkas-d2826c']);
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,95);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,21);
 const op=getOperation(ID);assert.deepEqual(op.fields.map(field=>field.path),['contextId','rating','userComment']);assert.deepEqual(op.nativeFields.map(field=>field.path),['Berkasid','rating','userComment']);assert.equal(op.encoding,'multipart');assert.equal(op.serverAcceptance,'untested');
 assert.throws(()=>prepareOperation(ID,{contextId,rating:3,userComment:'x'}),{code:'LOGIN_REQUIRED'});
 const prepared=prepareOperation(ID,{contextId,rating:3,userComment:' x '},{authenticated:true});assert.equal(prepared.clientProfile,'berkas-rating-post');assert.deepEqual(prepared.berkasRatingInput,{contextId,rating:3,userComment:'x'});assert.deepEqual(prepared.body,{});assert.equal(prepared.requiresConfirmation,true);
 assert.throws(()=>prepareOperation(ID,values(),{authenticated:true}));
});

test('actual ApiClient emits the mainclient wire once and preserves accepted201 strictfalse response',async()=>{
 const h=client(()=>Response.json({error:false,message:''},{status:201})),token=attempt(),result=await h.send({berkasRatingAttempt:token});assert.deepEqual(result,{status:201,data:{error:false,message:''},contentType:'application/json'});assert.equal(dispatched(token),true);assert.equal(h.calls.length,1);
 const {url,init}=h.calls[0];assert.equal(url.href,'https://sentuh.atrbpn.go.id/'+PATH);assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer synthetic-access');assert.equal(init.headers.Accept,'application/json');assert.deepEqual(init.body,serialize(values(),'--dio-boundary-0000000042').body);
 await assert.rejects(h.send({berkasRatingAttempt:token}),{code:'BERKAS_RATING_ATTEMPT_USED'});assert.equal(h.calls.length,1);
});

test('ApiClient rejects path/profile/auth/query/files/attempt aliases before any transport handoff',async()=>{
 const h=client(),cases=[{path:'/berkas/postratingberkas'},{path:'BERKAS/postratingberkas'},{path:'berkas/%70ostratingberkas'},{path:'x/../berkas/postratingberkas'},{path:PATH+'?x=1'},{path:PATH+'#x'},{base:'https://bhumi.atrbpn.go.id/'},{method:'GET'},{encoding:'json'},{auth:'optionalSession'},{clientProfile:'main'},{query:{x:1}},{files:[{key:'file',file:new File(['x'],'x.png')}]},{berkasRatingAttempt:{}},{berkasRatingAttempt:undefined},{berkasRatingBoundary:'\r\n'},{path:'account/account_summary',clientProfile:'berkas-rating-post'},{body:values({extra:1})}];
 for(const patch of cases)await assert.rejects(h.send(patch));assert.equal(h.calls.length,0);
});

test('ApiClient malformed,non2xx,redirect,bodyloss andtransport failures never become businesssuccess or replay',async()=>{
 for(const reply of [()=>Response.json({error:'false'}),()=>new Response('{bad}',{headers:{'Content-Type':'application/json'}}),()=>new Response('{"error":false}',{headers:{'Content-Type':'text/plain'}}),()=>Response.json({error:false},{status:500}),()=>new Response(null,{status:302,headers:{Location:'https://other.invalid/'}}),()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([123]));controller.error(new Error('synthetic bodyloss'));}}),{headers:{'Content-Type':'application/json'}}),()=>{throw Object.assign(new Error('Synthetic timeout'),{name:'TimeoutError'});}]){
  const h=client(reply),token=attempt();await assert.rejects(h.send({berkasRatingAttempt:token}));assert.equal(h.calls.length,1);assert.equal(dispatched(token),true);
 }
});

test('late401 cannot clear newer credentials, and successful latebody cannot escape olduser ownership',async()=>{
 let release;const h=client(()=>new Promise(resolve=>release=resolve)),owner=session(),old=owner.tokens,work=h.send({session:owner});owner.tokens={...old,accessToken:'new-synthetic'};release(Response.json({error:false},{status:401}));await assert.rejects(work,{code:'SESSION_CHANGED'});assert.equal(owner.tokens.accessToken,'new-synthetic');
 let resolve;const next=client(()=>new Promise(done=>resolve=done)),who=session(),pending=next.send({session:who});who.user={username:'new-owner'};resolve(Response.json({error:false,message:'late'}));await assert.rejects(pending,{code:'SESSION_CHANGED'});assert.equal(next.calls.length,1);
});
