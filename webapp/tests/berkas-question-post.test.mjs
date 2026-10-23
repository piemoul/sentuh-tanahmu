import test from 'node:test';import assert from 'node:assert/strict';
import {prepareBerkasQuestionInput,serializeBerkasQuestionPost,questionHistoryPath,decodeBerkasQuestionHistory,decodeBerkasQuestionOutcome}from'../private/berkas-question-post.mjs';
import {createBerkasQuestionAttempt}from'../private/berkas-question-post.mjs';
import {ApiClient}from'../private/api-client.mjs';
import {getOperation,prepareOperation}from'../private/operations.mjs';
const bytes=value=>Buffer.from(JSON.stringify(value));
const row=patch=>({berkasId:'B-1',nik:'SYNTHETIC-NIK',content:'Raw\ntext',isTanya:'1',tanggal:'23-10-2026',waktu:'09:00',namaKantor:'Kantor sintetis',...patch});
test('question catalog is an explicit confirmed main writer with exactly two native fields and a separate existing history read',()=>{
 const post=getOperation('post-tanyajawab-submitpertanyaan-d994f4'),read=getOperation('get-tanyajawab-gettanyajawabberkas-d2826c');
 assert.equal(post.enabled,true);assert.equal(post.effect,'write');assert.equal(post.mutates,true);assert.equal(post.requiresConfirmation,true);assert.equal(post.encoding,'form');assert.equal(post.auth,'session');assert.equal(post.serviceId,'main');assert.deepEqual(post.nativeFields.map(field=>field.path),['berkasid','content']);assert.deepEqual(post.fields.map(field=>field.path),['contextId','content']);assert.equal(read.enabled,true);assert.equal(read.effect,'read');
 const values={contextId:'bqc_'+'a'.repeat(32),content:' raw\n '},prepared=prepareOperation(post.id,values,{authenticated:true});assert.deepEqual(prepared.berkasQuestionInput,values);assert.deepEqual(prepared.body,{});assert.equal(prepared.requiresConfirmation,true);assert.equal(post.serverAcceptance,'untested');
});
test('question form uses native ordered fields, mask1 punctuation, original whitespace and LF octets',()=>{
 assert.equal(serializeBerkasQuestionPost({content:" \n*!'()~+&=é😀\r\n ",berkasid:'B-1'}),'berkasid=B-1&content=+%0A%2A%21%27%28%29~%2B%26%3D%C3%A9%F0%9F%98%80%0D%0A+');
 assert.equal(serializeBerkasQuestionPost({berkasid:'B-1',content:'x\uD800y\uDC00'}),'berkasid=B-1&content=x%EF%BF%BDy%EF%BF%BD');
});
test('question form preserves entire ASCII domain according to independent native safe set',()=>{
 const safe='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
 for(let code=0;code<128;code++){const ch=String.fromCharCode(code),result=serializeBerkasQuestionPost({berkasid:'B-1',content:'x'+ch}).slice('berkasid=B-1&content=x'.length);assert.equal(result,safe.includes(ch)?ch:code===32?'+':'%'+code.toString(16).toUpperCase().padStart(2,'0'),String(code));}
});
test('question validation trims only a copy and has no invented native text length limit',()=>{
 const content=' \u0085 original\n '+ 'x'.repeat(20000);assert.equal(prepareBerkasQuestionInput({contextId:'bqc_'+'a'.repeat(32),content}).content,content);
 for(const content of ['', ' \n\t\u0085\uFEFF',null,1])assert.throws(()=>prepareBerkasQuestionInput({contextId:'bqc_'+'a'.repeat(32),content}));
});
test('question records reject extra wire fields and descriptors without executing accessors',()=>{
 let invoked=false;for(const value of [{berkasid:'B-1',content:'x',Nik:'forged'},{berkasid:'B-1',get content(){invoked=true;return 'x';}}])assert.throws(()=>serializeBerkasQuestionPost(value));assert.equal(invoked,false);
});
test('question GET retains direct ordinary-ID interpolation and rejects unproved URI domains',()=>{
 assert.equal(questionHistoryPath('A-01-abc'),'TanyaJawab/GetTanyaJawabBerkas?berkasid=A-01-abc');
 for(const id of ['','a&x=1','a#fragment','a%20b','a/b',' a','é','a\uD800',null,1])assert.throws(()=>questionHistoryPath(id));
});
test('question success requires exact200 and a MIME-transformed typed false error; message is ignored',()=>{
 for(const message of [null,1,{anything:true},'text'])assert.deepEqual(decodeBerkasQuestionOutcome(bytes({error:false,message}),'application/json',200),{success:true,recognized:true});
 for(const error of [undefined,null,0,'false',{},[]])assert.deepEqual(decodeBerkasQuestionOutcome(bytes({error}),'application/json',200),{success:false,recognized:false});
 assert.deepEqual(decodeBerkasQuestionOutcome(bytes({error:true}),'application/json',200),{success:false,recognized:true});
 for(const status of [201,204,400,500])assert.deepEqual(decodeBerkasQuestionOutcome(bytes({error:false}),'application/json',status),{success:false,recognized:false});
 for(const body of [[],null,'{"error":false}'])assert.equal(decodeBerkasQuestionOutcome(bytes(body),'application/json',200).success,false);
});
test('question response never sniffs text/plain JSON and malformed transform stays unknown',()=>{
 assert.equal(decodeBerkasQuestionOutcome(bytes({error:false}),'text/plain',200).success,false);
 assert.equal(decodeBerkasQuestionOutcome(Buffer.from('{bad}'),'application/json',200).recognized,false);
 assert.equal(decodeBerkasQuestionOutcome(Uint8Array.of(255),'application/json',200).recognized,false);
});
test('question history consumes data List and exactly seven required String values without envelope-error gating',()=>{
 assert.deepEqual(decodeBerkasQuestionHistory(bytes({error:true,message:1,data:[row()]}),'application/json',201),[row()]);
 assert.deepEqual(decodeBerkasQuestionHistory(bytes({data:[]}),'application/json',200),[]);
 for(const key of Object.keys(row()))for(const value of [null,1,true,undefined])assert.throws(()=>decodeBerkasQuestionHistory(bytes({data:[row({[key]:value})]}),'application/json',200),key);
 for(const data of [null,{},'[]',1])assert.throws(()=>decodeBerkasQuestionHistory(bytes({data}),'application/json',200));
 assert.throws(()=>decodeBerkasQuestionHistory(bytes({data:[row()]}),'text/plain',200));
 assert.throws(()=>decodeBerkasQuestionHistory(bytes({data:[]}),'application/json',503));
});
test('question client rejects profile/path/method/auth/file/query bypasses before transport',async()=>{
 const calls=[],client=new ApiClient({configured:true},{log(){},transport:async(...args)=>{calls.push(args);return Response.json({error:false});}});
 const session={active:true,user:{username:'synthetic'},tokens:{tokenType:'Bearer',accessToken:'synthetic-only'}};
 const valid=()=>({path:'TanyaJawab/SubmitPertanyaan',method:'POST',encoding:'form',auth:'session',session,clientProfile:'berkas-question-post',body:{berkasid:'B-1',content:'x'},query:{},files:[],berkasQuestionAttempt:createBerkasQuestionAttempt()});
 for(const patch of [{path:'tanyajawab/SubmitPertanyaan'},{path:'TanyaJawab/%53ubmitPertanyaan'},{path:'TanyaJawab/SubmitPertanyaan?x=1'},{path:'auth/signin'},{base:'https://sipenta.atrbpn.go.id/'},{method:'GET'},{encoding:'json'},{encoding:'multipart'},{auth:'application'},{clientProfile:'main'},{berkasQuestionAttempt:{}},{files:[{}]},{query:{extra:'x'}}])await assert.rejects(client.request({...valid(),...patch}));
 let invoked=false;await assert.rejects(client.request({...valid(),query:{get x(){invoked=true;return 'forged';}}}));assert.equal(invoked,false);assert.equal(calls.length,0);
 const accepted=valid();assert.equal((await client.request(accepted)).data.success,true);await assert.rejects(client.request(accepted));assert.equal(calls.length,1);
});
test('question history client requires fixed main-session direct path instead of query-map encoding',async()=>{
 let calls=0;const client=new ApiClient({configured:true},{log(){},transport:async()=>{calls++;return Response.json({error:true,data:[]});}}),session={active:true,user:{},tokens:{tokenType:'Bearer',accessToken:'synthetic-only'}};
 const valid={path:'TanyaJawab/GetTanyaJawabBerkas?berkasid=B-1',method:'GET',encoding:'none',auth:'session',session,body:{},query:{},files:[]};
 for(const patch of [{path:'TanyaJawab/GetTanyaJawabBerkas',query:{berkasid:'B-1'}},{path:'TanyaJawab/GetTanyaJawabBerkas?berkasid=B-1&x=1'},{path:'TanyaJawab/GetTanyaJawabBerkas?berkasid=B-1#x'},{method:'POST'},{auth:'none'},{body:{extra:'x'}},{base:'https://sipenta.atrbpn.go.id/'}])await assert.rejects(client.request({...valid,...patch}));assert.equal(calls,0);assert.deepEqual((await client.request(valid)).data,[]);assert.equal(calls,1);
});
