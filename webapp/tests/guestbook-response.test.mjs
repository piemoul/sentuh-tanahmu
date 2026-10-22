import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeGuestbookEnvelope,decodeGuestbookJson} from '../private/guestbook-response.mjs';
const code='GUESTBOOK_RESPONSE_UNRECOGNIZED';
const model={userId:' qr-user ',kantorId:'office',unitKerjaId:'unit',namaUnitKerja:'Unit é😀'};
test('Buku Tamu exact nullable model preserves raw strings and error:true',()=>{
  assert.deepEqual(decodeGuestbookEnvelope({error:true,message:' raw ',data:model}),{error:true,message:' raw ',data:model});
  assert.deepEqual(decodeGuestbookEnvelope({error:false,message:'',data:{userId:'',kantorId:null}}),{error:false,message:'',data:{userId:'',kantorId:null,unitKerjaId:null,namaUnitKerja:null}});
});
test('missing and explicit null envelope fields stay null',()=>{
  assert.deepEqual(decodeGuestbookEnvelope({}),{error:null,message:null,data:null});
  assert.deepEqual(decodeGuestbookEnvelope({data:null,error:null,message:null}),{error:null,message:null,data:null});
  assert.deepEqual(decodeGuestbookEnvelope({data:{}}),{error:null,message:null,data:{userId:null,kantorId:null,unitKerjaId:null,namaUnitKerja:null}});
});
test('extra fields are ignored without invoking accessors or preserving prototype keys',()=>{
  const body={data:{...model}};let calls=0;
  Object.defineProperty(body,'unknown',{get(){calls++;throw new Error('unread');}});
  Object.defineProperty(body.data,'unknown',{get(){calls++;throw new Error('unread');}});
  const parsed=decodeGuestbookEnvelope(body);assert.equal(calls,0);
  assert.deepEqual(Object.keys(parsed),['error','message','data']);assert.deepEqual(Object.keys(parsed.data),Object.keys(model));
  const hostile=decodeGuestbookJson('{"__proto__":{"polluted":true},"data":{"__proto__":{},"userId":"safe"}}');
  assert.equal(Object.getPrototypeOf(hostile.data),Object.prototype);assert.equal({}.polluted,undefined);
});
test('null-prototype maps are supported; inherited field values are not read',()=>{
  const data=Object.assign(Object.create(null),model),body=Object.assign(Object.create(null),{data,error:false});
  assert.deepEqual(decodeGuestbookEnvelope(body),{error:false,message:null,data:model});
  assert.throws(()=>decodeGuestbookEnvelope(Object.create({data:model})),{code});
});
for(const value of [null,[],true,12,'{}',new Date(),new Map()])test(`reject non-Map envelope ${value===null?'null':typeof value+':'+value?.constructor?.name}`,()=>{
  assert.throws(()=>decodeGuestbookEnvelope(value),{code});
});
for(const field of Object.keys(model))test(`typed nullable String rejects nonstring ${field}`,()=>{
  for(const value of [1,1.5,true,[],{},new String('text')])assert.throws(()=>decodeGuestbookEnvelope({data:{[field]:value}}),{code});
});
test('nullable envelope bool/String types are checked despite ignored business flags',()=>{
  for(const error of [0,1,'false',{},[]])assert.throws(()=>decodeGuestbookEnvelope({error,data:model}),{code});
  for(const message of [0,false,{},[]])assert.throws(()=>decodeGuestbookEnvelope({message,data:model}),{code});
  for(const data of ['{}',[],1,false])assert.throws(()=>decodeGuestbookEnvelope({data}),{code});
});
test('known accessor fields are rejected without evaluation',()=>{
  let calls=0;const getter={get(){calls++;return 'untrusted';}};
  for(const field of ['data','error','message']){const body={};Object.defineProperty(body,field,getter);assert.throws(()=>decodeGuestbookEnvelope(body),{code});}
  for(const field of Object.keys(model)){const data={};Object.defineProperty(data,field,getter);assert.throws(()=>decodeGuestbookEnvelope({data}),{code});}
  assert.equal(calls,0);
});
test('data callback is processed before envelope error/message, matching native ordering',()=>{
  let accesses=0;const body={data:'not a map'};
  const wrapped=new Proxy(body,{getPrototypeOf:()=>Object.prototype,getOwnPropertyDescriptor(target,key){if(key==='error'||key==='message')accesses++;return Reflect.getOwnPropertyDescriptor(target,key);}});
  assert.throws(()=>decodeGuestbookEnvelope(wrapped),{code});assert.equal(accesses,0);
});
test('wire JSON parsed once, no nested string decoding, aliases or nested envelope substitution',()=>{
  assert.deepEqual(decodeGuestbookJson(JSON.stringify({data:model,error:true})),{error:true,message:null,data:model});
  assert.throws(()=>decodeGuestbookJson(JSON.stringify(JSON.stringify({data:model}))),{code});
  const nested=decodeGuestbookJson('{"data":{"data":{"userId":"wrong"},"userid":"wrong"}}');
  assert.equal(nested.data.userId,null);
  assert.equal(decodeGuestbookJson('{"data":{"userId":"first","userId":"last"}}').data.userId,'last');
});
test('malformed wire JSON errors have fixed messages without source fragments',()=>{
  const sensitive='not-json-sensitive-visitor';
  for(const value of [sensitive,'',undefined,Buffer.from('{}'),'[', '{"data":']){
    assert.throws(()=>decodeGuestbookJson(value),error=>error.code===code&&!error.message.includes(sensitive)&&error.cause===undefined);
  }
});
