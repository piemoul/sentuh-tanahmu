import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),declaration=source.match(/async function api\([\s\S]*?\n}\n/)?.[0];assert.ok(declaration);
function fixture(response){const calls=[];const context=vm.createContext({state:{csrfToken:'synthetic-csrf'},FormData,fetch:async(...args)=>{calls.push(args);if(response instanceof Error)throw response;return response;}});vm.runInContext(declaration,context);return{api:context.api,calls};}
test('HTML502 includes only safe HTTP and connection metadata, never gateway page or parser exception text',async()=>{
  const h=fixture(new Response('<html>private-body-token-SYNTHETIC</html>',{status:502,headers:{'Content-Type':'text/html; charset=utf-8','CF-Ray':'synthetic-ray-AB12'}}));
  await assert.rejects(h.api('/api/execute',{method:'POST',body:{operationId:'synthetic-read',values:{}}}),error=>{assert.equal(error.code,'LOCAL_RESPONSE_UNREADABLE');assert.equal(error.httpStatus,502);assert.equal(error.responseMime,'text/html');assert.equal(error.gatewayRequestId,'synthetic-ray-AB12');assert.match(error.message,/HTTP 502/);assert.match(error.message,/ID koneksi: synthetic-ray-AB12/);assert.doesNotMatch(error.message,/private-body-token|<html>|Unexpected/);return true;});assert.equal(h.calls.length,1);
});
test('malformed JSON200 stays an explicit unreadable response, not success or a retry',async()=>{
  const h=fixture(new Response('{broken',{status:200,headers:{'Content-Type':'application/json'}}));await assert.rejects(h.api('/api/state'),error=>error.code==='LOCAL_RESPONSE_UNREADABLE'&&error.httpStatus===200&&error.responseMime==='application/json'&&!error.gatewayRequestId);assert.equal(h.calls.length,1);
});
test('invalid or oversized gateway IDs and MIME values cannot enter UI messages or diagnostics',async()=>{
  for(const ray of ['<script>never</script>','x'.repeat(81)]){const h=fixture(new Response('not JSON',{status:503,headers:{'Content-Type':'unsafe value <script>','CF-Ray':ray}}));await assert.rejects(h.api('/api/state'),error=>{assert.equal(error.gatewayRequestId,undefined);assert.equal(error.responseMime,'unknown');assert.doesNotMatch(error.message,/<script>|x{81}/);return true;});}
});
test('structured JSON errors keep original auth/network handling and request body/headers stay unchanged',async()=>{
  const h=fixture(Response.json({error:{code:'SESSION_EXPIRED',message:'Synthetic expired',details:{networkCode:'ECONNRESET',requestId:'synthetic-request-id'}}},{status:401}));await assert.rejects(h.api('/api/execute',{method:'POST',body:{operationId:'synthetic-read',values:{}}}),error=>error.code==='SESSION_EXPIRED'&&error.message.includes('ECONNRESET')&&error.message.includes('synthetic-request-id'));
  assert.equal(h.calls.length,1);assert.equal(h.calls[0][1].headers['X-CSRF-Token'],'synthetic-csrf');assert.equal(h.calls[0][1].credentials,'same-origin');assert.deepEqual(JSON.parse(h.calls[0][1].body),{operationId:'synthetic-read',values:{}});
});
test('normal JSON/multipart and network rejection retain semantics without retries',async()=>{
  const good=fixture(Response.json({result:{status:200,data:{data:[]}}})),body=new FormData();body.append('operationId','synthetic-only');const result=await good.api('/api/execute',{method:'POST',body});assert.equal(result.result.status,200);assert.equal(good.calls[0][1].body,body);assert.equal(good.calls[0][1].headers['Content-Type'],undefined);
  const error=new TypeError('Synthetic connection failure'),bad=fixture(error);await assert.rejects(bad.api('/api/state'),value=>value===error);assert.equal(bad.calls.length,1);
});
