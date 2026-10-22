import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ApiClient} from '../private/api-client.mjs';
import * as registry from '../private/operations.mjs';
import {createServer} from '../server.mjs';
import {prepareLostReviewPostValues, reviewPostFileDefinitions, lostReviewPhotoMime, lostReviewPostFilename, prepareLostReviewPostFiles, serializeLostReviewPost, lostReviewPostOutcome, LOST_REVIEW_POST_TYPE, LOST_REVIEW_POST_BODY_LIMIT} from '../private/lost-review-post.mjs';

const input = (patch = {}) => ({contentId: ' selected record ', reviewType: LOST_REVIEW_POST_TYPE, comment: 'comment', rating: 3, ...patch});
test('composer values preserve exact text, edited-empty comment and native scalar order', () => {
  const body = prepareLostReviewPostValues({rating: 5, comment: '', contentId: ' \0 ', reviewType: LOST_REVIEW_POST_TYPE});
  assert.deepEqual(Object.entries(body), [['contentId',' \0 '],['reviewType',LOST_REVIEW_POST_TYPE],['comment',''],['rating',5]]);
  assert.equal(prepareLostReviewPostValues({contentId: '', comment: ' \n ', rating: 1}).reviewType, LOST_REVIEW_POST_TYPE);
  assert.equal(prepareLostReviewPostValues(input({comment:'x'.repeat(20000)})).comment.length,20000);
});
test('composer rejects missing/null text, wrong type and unselected or nonintegral rating', () => {
  for (const value of [null, undefined, 0, {}, []]) {
    assert.throws(() => prepareLostReviewPostValues(input({contentId:value})), {code:'INVALID_REVIEW_TEXT'});
    assert.throws(() => prepareLostReviewPostValues(input({comment:value})), {code:'INVALID_REVIEW_TEXT'});
  }
  for (const rating of [0, -1, 6, 1.5, '1', null, undefined, Infinity, NaN]) assert.throws(() => prepareLostReviewPostValues(input({rating})), {code:'INVALID_REVIEW_RATING'});
  assert.throws(() => prepareLostReviewPostValues(input({reviewType:'other'})), {code:'LOST_REVIEW_POST_SCOPE'});
});
test('composer scope rejects extra keys, symbols, exotic prototypes and accessors without executing them', () => {
  for (const params of [input({unknown:'x'}), Object.assign(input(),{[Symbol('x')]:'x'}), Object.assign(Object.create({}),input())]) assert.throws(() => prepareLostReviewPostValues(params), {code:'LOST_REVIEW_POST_SCOPE'});
  let reads=0;
  for (const key of ['contentId','reviewType','comment','rating']) {
    const params=input(); Object.defineProperty(params,key,{enumerable:true,get(){reads++;return 'x';}});
    assert.throws(() => prepareLostReviewPostValues(params), {code:'LOST_REVIEW_POST_SCOPE'});
  }
  assert.equal(reads,0);
});
test('photo definitions retain sequential visible order, zero-byte files and more than ten selections', () => {
  const uploaded=Array.from({length:12},(_,index)=>({key:`reviewPhoto${index+1}`,file:new File([index===0?'':'bytes'],`${12-index}.heic`,{type:'ignored/browser-type'})}));
  const definitions=reviewPostFileDefinitions(uploaded);
  assert.equal(definitions.length,12);assert.equal(uploaded[0].file.name,'12.heic');assert.equal(uploaded[0].file.size,0);
  assert.deepEqual(definitions.map(row=>row.name),uploaded.map(row=>row.key));
  assert.ok(definitions.every(row=>row.minBytes===0&&row.maxBytes===LOST_REVIEW_POST_BODY_LIMIT&&row.required));
  assert.deepEqual(reviewPostFileDefinitions([]),[]);
});
test('photo definitions reject duplicate/gapped/reordered keys, sparse lists and non-File values', () => {
  const file=new File(['x'],'photo.png');
  for (const uploaded of [[{key:'reviewPhoto0',file}],[{key:'reviewPhoto01',file}],[{key:'reviewPhoto2',file}],[{key:'reviewPhoto1',file},{key:'reviewPhoto1',file}],[{key:'reviewPhoto1',file:new Blob(['x'])}],new Array(1),[{key:'reviewPhoto1',file,extra:true}]]) assert.throws(()=>reviewPostFileDefinitions(uploaded),{code:'LOST_REVIEW_POST_SCOPE'});
  let reads=0;const entry={key:'reviewPhoto1'};Object.defineProperty(entry,'file',{get(){reads++;return file;}});
  assert.throws(()=>reviewPostFileDefinitions([entry]),{code:'LOST_REVIEW_POST_SCOPE'});assert.equal(reads,0);
});
test('extension MIME matches all996 recovered defaults, with lookup-only trim/case and exact unknown fallback',()=>{
  const bytes=fs.readFileSync(new URL('../../analysis/recovered/lost-review-post-protocol/mime-table.json',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'ddf3ebe66b99f9a8a4aaaa89ba968fa7b1fbe44029959f7e7cf666dfd85e19c6');
  const {mapping}=JSON.parse(bytes);assert.equal(Object.keys(mapping).length,996);
  for(const [extension,mime]of Object.entries(mapping))assert.equal(lostReviewPhotoMime('raw.'+extension),mime,extension);
  assert.equal(lostReviewPhotoMime(' photo.HEIC '),'image/heic');assert.equal(lostReviewPhotoMime('JPG'),'image/jpeg');
  for(const name of ['photo.jfif','photo.unlisted-extension','photo.JPG.'])assert.equal(lostReviewPhotoMime(name),'application/octet-stream',name);
});
test('Android basename is slash-only and untrimmed; browser header guards reject instead of silently sanitizing',()=>{
  assert.equal(lostReviewPostFilename('/raw/../leaf/  a%2F".PNG  //'),'  a%2F".PNG  ');
  const long='a'.repeat(250)+'.png';assert.equal(lostReviewPostFilename(long),long);
  for(const name of ['', '/', 'bad\n.jpg','bad\r.jpg','bad\0.jpg','bad\\path.jpg'])assert.throws(()=>lostReviewPostFilename(name),{code:'INVALID_REVIEW_PHOTO_NAME'});
});
test('original file bytes survive MIME reassignment and custom multipart preserves raw text/header/file order',async()=>{
  const original=Buffer.from([0xff,0xd8,0xff,0xe1,0,1,10,13,255]);
  const uploaded=[{key:'reviewPhoto1',file:new File([original],'  photo".HEIC  ',{type:'image/png'})},{key:'reviewPhoto2',file:new File([],'unknown.jfif',{type:'image/jpeg'})}];
  const files=prepareLostReviewPostFiles(uploaded);assert.equal(files[0].file.type,'image/heic');assert.equal(files[1].file.type,'application/octet-stream');
  assert.deepEqual(Buffer.from(await files[0].file.arrayBuffer()),original);assert.equal(files[0].file.name,uploaded[0].file.name);
  const params=input({comment:'first\nsecond\rlast\r\nend',rating:4});const serialized=await serializeLostReviewPost(params,uploaded,'native-fixture-boundary');
  const prefix='--native-fixture-boundary\r\ncontent-disposition: form-data; name="contentId"\r\n\r\n selected record \r\n--native-fixture-boundary\r\ncontent-disposition: form-data; name="reviewType"\r\n\r\n'+LOST_REVIEW_POST_TYPE+'\r\n--native-fixture-boundary\r\ncontent-disposition: form-data; name="comment"\r\n\r\nfirst\nsecond\rlast\r\nend\r\n--native-fixture-boundary\r\ncontent-disposition: form-data; name="rating"\r\n\r\n4\r\n--native-fixture-boundary\r\ncontent-disposition: form-data; name="reviewPhoto1"; filename="  photo%22.HEIC  "\r\ncontent-type: image/heic\r\n\r\n';
  const suffix='\r\n--native-fixture-boundary\r\ncontent-disposition: form-data; name="reviewPhoto2"; filename="unknown.jfif"\r\ncontent-type: application/octet-stream\r\n\r\n\r\n--native-fixture-boundary--\r\n';
  assert.deepEqual(serialized.body,Buffer.concat([Buffer.from(prefix),original,Buffer.from(suffix)]));
  assert.equal(serialized.contentType,'multipart/form-data; boundary=native-fixture-boundary');
  const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':serialized.contentType},body:serialized.body}).formData();
  assert.deepEqual([...form.keys()],['contentId','reviewType','comment','rating','reviewPhoto1','reviewPhoto2']);assert.equal(form.get('comment'),params.comment);
  await assert.rejects(serializeLostReviewPost(params,[{key:'reviewPhoto1',file:new File([new Uint8Array(LOST_REVIEW_POST_BODY_LIMIT)],'too-big.png')}],'fixture'),{code:'BODY_TOO_LARGE'});
});
test('writer success follows JSON-MIME fatalUTF8/syntax transform, not a status-only body bypass',()=>{
  for(const mime of ['application/json','TEXT/JSON; charset=utf-8','application/problem+json','image/x+json'])for(const text of ['{}','[]','true','false','null','123','"raw String"','"{not recursively decoded}"']){
    assert.equal(lostReviewPostOutcome(Buffer.from('\uFEFF'+text),mime,200),false);assert.equal(lostReviewPostOutcome(Buffer.from(text),mime,201),true);
  }
  assert.equal(lostReviewPostOutcome(Buffer.alloc(0),'application/json',200),false);
  for(const bytes of [Buffer.from(' '),Buffer.from('{bad}'),Buffer.from([0xc3,0x28]),Buffer.from([0xef,0xbb,0xbf,0xef,0xbb,0xbf,0x31])])assert.throws(()=>lostReviewPostOutcome(bytes,'application/json',200),{code:'INVALID_REVIEW_POST_RESPONSE'});
  for(const mime of ['text/plain','application/jsonish','not a mime',''])assert.equal(lostReviewPostOutcome(Buffer.from([0xc3,0x28]),mime,200),false);
  assert.equal(lostReviewPostOutcome(Buffer.from('unused'),'text/plain',299),true);
});

const ID='post-review-post-deb030';
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=>'AtrBpn synthetic-review-post-app'};
const token={tokenType:'Bearer',accessToken:'synthetic-review-post-access',refreshToken:'synthetic-review-post-refresh',expiredAt:4_000_000_000};
const session=()=>({active:true,user:{username:'synthetic-review-post-user'},tokens:{...token}});
const request=(patch={})=>({path:'review/post',method:'POST',encoding:'multipart',auth:'session',body:input(),query:{},files:[],session:session(),...patch});
const client=transport=>new ApiClient(config,{log:()=>{},transport});
test('catalog retains the audited post and later Yuridis delta against the96-file baseline with session and confirmation',()=>{
  const {OPERATIONS,prepareOperation}=registry,baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/lost-review-post-baseline.json',import.meta.url)));
  assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,94);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='read').length,74);assert.equal(OPERATIONS.filter(op=>op.enabled&&op.effect==='write').length,20);
  const changed=OPERATIONS.filter((op,index)=>createHash('sha256').update(JSON.stringify(op)).digest('hex')!==baseline.catalog.operations[index].sha256),mitra=['get-mitra-getpenilailist-d3aa20','get-mitra-getkantorppat-d3af08','get-mitra-getppatlist-d3b428','get-mitra-getwilayahsurveyor-d3b910','get-mitra-getsurveyorlist-d3be30'];assert.deepEqual(changed.map(op=>op.id).sort(),[ID,...mitra,'get-ratingppat-getratingquestions-d1d6bc','get-announcement-yuridis-bykantor-d0fb64','post-review-last-user-review-dad1dc','post-ratingppat-postratingppat-d86e10','post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8'].sort());
  for(const id of mitra)assert.equal(OPERATIONS.find(op=>op.id===id).enabled,baseline.catalog.operations.find(op=>op.id===id).enabled);
  const op=changed.find(op=>op.id===ID);for(const [key,value]of Object.entries({enabled:true,effect:'write',mutates:true,requiresConfirmation:true,method:'POST',path:'review/post',encoding:'multipart',auth:'session',serviceId:'main',serverAcceptance:'untested'}))assert.equal(op[key],value,key);
  assert.equal(op.evidence.nativeProofSha256,'8c141a63e3fe77ee8b6be559914be7de58cea4fa9aaaa0c003aa31b8514b39ce');
  const prepared=prepareOperation(ID,input({comment:''}),{authenticated:true});assert.deepEqual(Object.entries(prepared.body),Object.entries(input({comment:''})));assert.equal(prepared.requiresConfirmation,true);assert.deepEqual(prepared.files,[]);
  assert.throws(()=>prepareOperation(ID,input(),{}),{code:'LOGIN_REQUIRED'});
  assert.throws(()=>prepareOperation(ID,input({reviewType:'different'}),{authenticated:true}),{code:'LOST_REVIEW_POST_SCOPE'});
  for(const op of OPERATIONS.filter(op=>op.path.startsWith('review/')&&!['review/all','review/post'].includes(op.path)&&op.id!=='post-review-last-user-review-dad1dc'))assert.equal(op.enabled,false,op.id);
  for(const id of ['post-geotag-uploadgeotag-d96b98','post-api-booking-d8b640'])assert.equal(OPERATIONS.find(op=>op.id===id).enabled,false,id);
  const quota=OPERATIONS.find(op=>op.id==='post-api-booking-limit-d8bf80');assert.equal(quota.enabled,true);assert.equal(quota.requiresConfirmation,true);assert.throws(()=>prepareOperation(quota.id,{nik:'forged'}, {authenticated:true}),{code:'QUEUE_BOOKING_REVIEW_SCOPE'});
});
test('actual client sends native multipart bytes and stored bearer, returns only the false success flag and no body contents',async()=>{
  const calls=[],logs=[],c=new ApiClient(config,{log:entry=>logs.push(entry),transport:async(url,init)=>{calls.push({url,init});return Response.json({error:true,data:'never expose synthetic upstream response'});}});
  const comment='raw\ncomment & é',result=await c.request(request({body:input({comment}),files:[{key:'reviewPhoto1',file:new File([new Uint8Array([1,2,255])],'photo.HEIC',{type:'image/png'})}]}));
  assert.deepEqual(result,{status:200,data:false,contentType:'application/json'});assert.equal(calls.length,1);
  const {url,init}=calls[0];assert.equal(url.href,'https://sentuh.atrbpn.go.id/review/post');assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer '+token.accessToken);assert.ok(Buffer.isBuffer(init.body));
  assert.ok(init.body.includes(Buffer.from(comment)));assert.ok(!init.body.includes(Buffer.from('raw\r\ncomment')));
  const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();
  assert.deepEqual([...form.keys()],['contentId','reviewType','comment','rating','reviewPhoto1']);assert.equal(form.get('reviewPhoto1').type,'image/heic');assert.deepEqual(Buffer.from(await form.get('reviewPhoto1').arrayBuffer()),Buffer.from([1,2,255]));
  for(const secret of [token.accessToken,comment,'photo.HEIC','never expose'])assert.ok(!JSON.stringify(logs).includes(secret));
});
test('client refuses target/auth/profile/shape/file changes before transport without invoking accessors',async()=>{
  let calls=0;const c=client(async()=>{calls++;return Response.json({});});
  for(const patch of [{base:'https://bhumi.atrbpn.go.id/'},{path:'/review/post'},{path:'review/post?x=1'},{path:'review/post#x'},{method:'PUT'},{method:'GET'},{encoding:'json'},{encoding:'form'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{body:{...input(),rating:'1'}},{body:{...input(),comment:null}},{body:{...input(),extra:true}},{query:{x:1}},{query:null}])await assert.rejects(c.request(request(patch)),{code:'LOST_REVIEW_POST_SCOPE'});
  await assert.rejects(c.request(request({files:[{key:'reviewPhoto2',file:new File(['x'],'a.jpg')}]})),{code:'LOST_REVIEW_POST_SCOPE'});
  await assert.rejects(c.request(request({files:[{key:'reviewPhoto1',file:new File(['x'],'bad\n.jpg')}]})),{code:'INVALID_REVIEW_PHOTO_NAME'});
  let reads=0;const body=input();Object.defineProperty(body,'comment',{enumerable:true,get(){reads++;return 'never';}});
  await assert.rejects(c.request(request({body})),{code:'LOST_REVIEW_POST_SCOPE'});assert.equal(reads,0);assert.equal(calls,0);
});
test('shared transform precedes native200 acceptance; invalid JSON/UTF8 and oversized responses never succeed',async()=>{
  for(const text of ['true','null','[]','"unwrapped String"','{"error":true}',''])assert.equal((await client(async()=>new Response(text,{headers:{'Content-Type':'application/json'}})).request(request())).data,false);
  assert.equal((await client(async()=>new Response('\uFEFF{}',{headers:{'Content-Type':'application/problem+json'}})).request(request())).data,false);
  for(const bytes of [Buffer.from(' '),Buffer.from('{invalid}'),Buffer.from([0xff])])await assert.rejects(client(async()=>new Response(bytes,{headers:{'Content-Type':'application/json'}})).request(request()),{code:'INVALID_REVIEW_POST_RESPONSE'});
  assert.equal((await client(async()=>new Response(new Uint8Array([255]),{headers:{'Content-Type':'text/plain'}})).request(request())).data,false);
  for(const status of [201,202,204,299])assert.equal((await client(async()=>new Response(null,{status,headers:{'Content-Type':'application/json'}})).request(request())).data,true);
  let cancelled=false;const body=new ReadableStream({cancel(){cancelled=true;}});
  await assert.rejects(client(async()=>new Response(body,{headers:{'Content-Type':'application/json','Content-Length':String(20*1024*1024+1)}})).request(request()),{code:'RESPONSE_TOO_LARGE'});assert.equal(cancelled,true);
});
test('failures never retry, session changes cannot publish success, and current/stale401 keep existing ownership policy',async()=>{
  for(const status of [400,403,429,500,503]){let calls=0;await assert.rejects(client(async()=>{calls++;return Response.json({error:true},{status});}).request(request()),{code:'UPSTREAM_REJECTED'});assert.equal(calls,1);}
  let calls=0;await assert.rejects(client(async()=>{calls++;throw Object.assign(new Error('do not log synthetic comment'),{code:'ECONNRESET'});}).request(request()),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
  const current=session();await assert.rejects(client(async()=>Response.json({},{status:401})).request(request({session:current})),{code:'SESSION_EXPIRED'});assert.equal(current.tokens,null);
  const stale=session(),replacement={...token,accessToken:'synthetic-post-replacement'};await assert.rejects(client(async()=>{stale.tokens=replacement;return Response.json({},{status:401});}).request(request({session:stale})),{code:'SESSION_CHANGED'});assert.equal(stale.tokens,replacement);
  const changed=session();await assert.rejects(client(async()=>{changed.user={username:'new owner'};return Response.json({});}).request(request({session:changed})),{code:'SESSION_CHANGED'});
  const before=session();let forwarded=0;const pending=client(async()=>{forwarded++;return Response.json({});}).request(request({session:before}));before.active=false;await assert.rejects(pending,{code:'SESSION_CHANGED'});assert.equal(forwarded,0);
});
test('real loopback HTTP requires login/Origin/CSRF/confirmation and accepts ordered12photos with zero bytes and large original files',async t=>{
  const calls=[];
  const fixtureRegistry={...registry,prepareOperation(id,...args){
    if(id==='synthetic-existing-file-policy')return{operation:{id},service:{baseUrl:'https://sentuh.atrbpn.go.id/'},path:'synthetic/never-forwarded',method:'POST',encoding:'multipart',auth:'session',effect:'write',requiresConfirmation:true,body:{},query:{},files:[{path:'file',required:true}]};
    return registry.prepareOperation(id,...args);
  }};
  const server=createServer({configuration:config,registry:fixtureRegistry,log:()=>{},transport:async(url,init)=>{calls.push({url,init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-review-post-user',token}});return Response.json({error:true,data:'ignored'});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base='http://127.0.0.1:'+server.address().port;let cookie='',state;
  async function send(route,body,headers={}){
    const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state.csrfToken,...(body instanceof FormData?{}:{'Content-Type':'application/json'})}),...headers},...(body===undefined?{}:{body:body instanceof FormData?body:JSON.stringify(body)})});
    if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const data=await response.json();if(data.csrfToken)state=data;return{response,data};
  }
  const form=(files=[],{operationId=ID,confirm='true',values=input({comment:''})}={})=>{const body=new FormData();body.append('operationId',operationId);body.append('values',JSON.stringify(values));body.append('confirm',confirm);for(const entry of files)body.append(entry.key,entry.file);return body;};
  await send('/api/state');assert.equal((await send('/api/execute',form())).response.status,401);assert.equal(calls.length,0);
  assert.equal((await send('/api/login',{username:'synthetic-review-post-user',password:'synthetic-only'})).response.status,200);
  for(const [headers,options]of [[{Origin:'https://untrusted.invalid'},{}],[{'X-CSRF-Token':'wrong'},{}],[{}, {confirm:'false'}]])assert.ok((await send('/api/execute',form([],options),headers)).response.status>=400);
  assert.equal(calls.length,1);
  const files=Array.from({length:12},(_,index)=>({key:`reviewPhoto${index+1}`,file:new File([index===0?'':'original bytes'],`${12-index}.HEIC`,{type:'image/jpeg'})}));
  let result=await send('/api/execute',form(files));assert.equal(result.response.status,200);assert.equal(result.data.result.data,false);assert.equal(calls.length,2);
  const sent=calls.at(-1).init,parsed=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':sent.headers['Content-Type']},body:sent.body}).formData();
  assert.deepEqual([...parsed.keys()].slice(4),files.map(file=>file.key));assert.equal(parsed.get('reviewPhoto1').size,0);assert.equal(parsed.get('reviewPhoto1').name,'12.HEIC');assert.equal(parsed.get('reviewPhoto1').type,'image/heic');
  result=await send('/api/execute',form([{key:'reviewPhoto1',file:new File([new Uint8Array(16*1024*1024)],'large.png',{type:'image/jpeg'})}]));assert.equal(result.response.status,200);assert.equal(result.data.result.data,false);assert.equal(calls.length,3);
  for(const invalid of [[{key:'reviewPhoto2',file:new File(['x'],'x.jpg')}],[{key:'reviewPhoto1',file:new File(['x'],'x.jpg')},{key:'reviewPhoto1',file:new File(['y'],'y.jpg')}]] )assert.equal((await send('/api/execute',form(invalid))).response.status,400);
  assert.equal((await send('/api/execute',form([{key:'file',file:new File([],'zero.png')}],{operationId:'synthetic-existing-file-policy'}))).data.error.code,'FILE_SIZE');
  assert.equal((await send('/api/execute',form(files,{operationId:'synthetic-existing-file-policy'}))).data.error.code,'TOO_MANY_FILES');
  result=await send('/api/execute',form([{key:'reviewPhoto1',file:new File([new Uint8Array(LOST_REVIEW_POST_BODY_LIMIT)],'whole-body-limit.png')}]));assert.equal(result.response.status,413);
  assert.equal(calls.length,3);
});
