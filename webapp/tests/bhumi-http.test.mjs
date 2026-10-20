import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createServer} from '../server.mjs';
import {SessionStore,readSessionId} from '../private/session.mjs';

// All remote transports are injected. Only this test's loopback HTTP server is
// contacted; every credential, account and PNG below is a synthetic fixture.
const MAIN='synthetic-http-main-access',REFRESH='synthetic-http-main-refresh';
const APP='AtrBpn synthetic-http-application',KEY='synthetic-http-private-bhumi-authkey';
const TOKEN='synthetic-http-dedicated-wms-token',GOOGLE='synthetic_http_browser_google_key';
const PASSWORD='synthetic-http-login-password';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const TILE='/api/maps/bhumi/1/1/1.png';
const integration=(name,fn)=>test(name,{timeout:8_000},fn);
const image=()=>new Response(PNG,{headers:{'Content-Type':'image/png'}});
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function noSecrets(value,extra=[]){
  const text=typeof value==='string'?value:JSON.stringify(value);
  for(const secret of [MAIN,REFRESH,APP,KEY,TOKEN,PASSWORD,...extra])assert.ok(!text.includes(secret),'Private fixture value must not be browser/log visible');
}

async function fixture(t,{tokenReply,bhumiReply,authkey=()=>KEY,googleMapsBrowserKey=GOOGLE,publicOrigin='https://sentuh.davay.space',now}={}){
  const calls=[],tiles=[],logs=[],sessions=new SessionStore();let keyCalls=0;
  const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'synthetic fixture only',
    applicationAuthorization:()=>APP,queueAuthorization:()=>{throw Error('Queue authorization must not be read');},
    bhumiAuthKey(){keyCalls++;return authkey();},
    tlsOptions(){throw Error('Injected HTTP fixture must not read main TLS identity');},
    queueTlsOptions(){throw Error('Bhumi must not read queue TLS identity');}
  };
  const server=createServer({configuration,sessions,googleMapsBrowserKey,publicOrigin,now,log:entry=>logs.push(entry),
    transport:async(url,init)=>{
      const call={url:new URL(url),init};calls.push(call);
      if(call.url.origin!=='https://sentuh.atrbpn.go.id')throw Error('Unexpected main origin in fixture');
      if(call.url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'fixture-user',nomorIndukKependudukan:'fixture-own-nik',token:{tokenType:'Bearer',accessToken:MAIN,refreshToken:REFRESH,expiredAt:4e9}}});
      if(call.url.pathname==='/Bhumi/haiiizzzzzzz')return tokenReply?tokenReply(call,calls.filter(item=>item.url.pathname==='/Bhumi/haiiizzzzzzz').length):Response.json({error:false,message:TOKEN});
      throw Error('Unexpected main request in fixture');
    },
    bhumiTransport:async(url,init)=>{
      const call={url:new URL(url),init};tiles.push(call);
      return bhumiReply?bhumiReply(call,tiles.length):image();
    }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const port=server.address().port,base=`http://127.0.0.1:${port}`;
  function start(path,{method='GET',headers={},data,host=`127.0.0.1:${port}`}={}){
    const bytes=data===undefined?undefined:Buffer.from(JSON.stringify(data));
    let req;
    const promise=new Promise((resolve,reject)=>{
      req=http.request({hostname:'127.0.0.1',port,path,method,headers:{Host:host,...(bytes?{'Content-Type':'application/json','Content-Length':bytes.length}:{}),...headers}},res=>{
        const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('error',reject);
        res.on('end',()=>{
          const bytes=Buffer.concat(chunks),text=bytes.toString('utf8');let body;
          if(String(res.headers['content-type']).startsWith('application/json')){try{body=JSON.parse(text);}catch{}}
          resolve({status:res.statusCode,headers:res.headers,bytes,text,body});
        });
      });
      req.on('error',reject);req.end(bytes);
    });
    return {promise,abort:()=>req.destroy(Object.assign(new Error('Synthetic browser aborted'),{code:'FIXTURE_ABORTED'}))};
  }
  function browser({host=`127.0.0.1:${port}`,origin=`http://${host}`}={}){
    let cookie='',csrf='';
    async function request(path,data,options={}){
      const {headers={},...overrides}=options;
      const response=await start(path,{host,method:data===undefined?'GET':'POST',data,...overrides,headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:origin,'X-CSRF-Token':csrf}),...headers}}).promise;
      if(response.headers['set-cookie'])cookie=response.headers['set-cookie'][0].split(';')[0];
      if(response.body?.csrfToken)csrf=response.body.csrfToken;
      return response;
    }
    return {request,bootstrap:()=>request('/api/state'),login:()=>request('/api/login',{username:'fixture-user',password:PASSWORD}),
      get cookie(){return cookie;},get csrf(){return csrf;},get session(){return sessions.sessions.get(readSessionId(cookie));}};
  }
  return {server,port,base,start,browser,sessions,calls,tiles,logs,tokenCalls:()=>calls.filter(item=>item.url.pathname==='/Bhumi/haiiizzzzzzz'),get keyCalls(){return keyCalls;}};
}
async function signedIn(f,options){const browser=f.browser(options);assert.equal((await browser.bootstrap()).status,200);assert.equal((await browser.login()).status,200);return browser;}

integration('map configuration contains only fixed OSM provider metadata and never derives private authorization',async t=>{
  const f=await fixture(t,{authkey:()=>{throw Error('Private key must remain lazy');}});
  const result=await f.start('/api/maps/config').promise;
  assert.equal(result.status,200);assert.equal(result.headers['set-cookie'],undefined);
  assert.equal(result.headers['cache-control'],'no-store');
  assert.deepEqual(result.body,{provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'});
  assert.ok(!result.text.includes(GOOGLE));noSecrets(result.text);assert.equal(f.keyCalls,0);assert.equal(f.calls.length,0);assert.equal(f.tiles.length,0);assert.equal(f.sessions.sessions.size,0);
});

integration('anonymous, bootstrap-only and incomplete authentication cannot fetch a tile',async t=>{
  const f=await fixture(t);
  const anonymous=await f.start(TILE).promise;assert.equal(anonymous.status,401);assert.equal(anonymous.body.error.code,'LOGIN_REQUIRED');assert.equal(anonymous.headers['set-cookie'],undefined);
  const browser=f.browser();await browser.bootstrap();assert.equal((await browser.request(TILE)).status,401);
  browser.session.tokens={tokenType:'Bearer',accessToken:MAIN};assert.equal((await browser.request(TILE)).status,401);
  browser.session.tokens=null;browser.session.user={username:'fixture-user'};assert.equal((await browser.request(TILE)).status,401);
  assert.equal(f.calls.length,0);assert.equal(f.tiles.length,0);assert.equal(f.keyCalls,0);
});

integration('authenticated HTTP tile composes exact main token GET and isolated WMS PNG transport',async t=>{
  const f=await fixture(t),browser=await signedIn(f),response=await browser.request(TILE);
  assert.equal(response.status,200);assert.deepEqual(response.bytes,PNG);
  assert.equal(response.headers['content-type'],'image/png');assert.equal(response.headers['content-length'],String(PNG.length));
  assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.headers['cross-origin-resource-policy'],'same-origin');assert.equal(response.headers['x-content-type-options'],'nosniff');assert.equal(response.headers['set-cookie'],undefined);
  const token=f.tokenCalls()[0];assert.equal(f.tokenCalls().length,1);
  assert.equal(token.url.href,'https://sentuh.atrbpn.go.id/Bhumi/haiiizzzzzzz');assert.equal(token.init.method,'GET');assert.equal(token.init.body,undefined);assert.equal(token.init.headers.Authorization,`Bearer ${MAIN}`);assert.equal(token.init.headers.Cookie,undefined);
  const tile=f.tiles[0];assert.equal(f.tiles.length,1);assert.equal(tile.url.origin,'https://bhumi.atrbpn.go.id');assert.equal(tile.url.pathname,'/expapi/live-bhumi-wms');
  assert.deepEqual(tile.init.headers,{Referer:'https://bhumi.atrbpn.go.id/'});assert.equal(tile.init.method,'GET');assert.equal(tile.init.redirect,'manual');assert.equal(tile.init.credentials,'omit');assert.equal(tile.init.body,undefined);
  assert.equal(tile.url.searchParams.get('token'),TOKEN);assert.equal(tile.url.searchParams.get('authkey'),KEY);assert.equal(tile.url.searchParams.get('layers'),'petabpn:PersilBerdasarkanJenisHakStroke');assert.equal(tile.url.searchParams.get('bbox'),'0.0,-20037508.34789244,20037508.34789244,0.0');assert.equal(tile.url.searchParams.get('srs'),'EPSG:900913');
  for(const forbidden of [MAIN,REFRESH,APP,GOOGLE,PASSWORD])assert.ok(!tile.url.href.includes(forbidden));
  noSecrets(response.headers);noSecrets(f.logs);
});

integration('strict XYZ and extra query guards reject before token, key or tile transport',async t=>{
  const f=await fixture(t),browser=await signedIn(f);
  for(const path of ['/api/maps/bhumi/01/1/1.png','/api/maps/bhumi/1/01/1.png','/api/maps/bhumi/1/1/01.png','/api/maps/bhumi/-1/0/0.png','/api/maps/bhumi/22/0/0.png','/api/maps/bhumi/1/2/0.png','/api/maps/bhumi/1/0/2.png','/api/maps/bhumi/0/1/0.png','/api/maps/bhumi/21/2097152/0.png','/api/maps/bhumi/1/1/1.jpg','/api/maps/bhumi/1/1/1.png/extra',TILE+'?token=override',TILE+'?url=https%3A%2F%2Fevil.invalid',TILE+'?authkey=override',TILE+'?x=0']){
    const result=await browser.request(path);assert.equal(result.status,400,path);assert.equal(result.body.error.code,'BHUMI_TILE_INVALID');
  }
  assert.equal(f.calls.length,1);assert.equal(f.tokenCalls().length,0);assert.equal(f.keyCalls,0);assert.equal(f.tiles.length,0);
  for(const path of ['/api/maps/bhumi/0/0/0.png','/api/maps/bhumi/21/2097151/2097151.png'])assert.equal((await browser.request(path)).status,200);
  assert.equal(f.tokenCalls().length,1);assert.equal(f.tiles.length,2);
});

integration('tile endpoint rejects other methods and browser execution cannot expose its internal token GET',async t=>{
  const f=await fixture(t),browser=await signedIn(f);
  assert.equal((await browser.request(TILE,{})).status,404);
  for(const method of ['HEAD','PUT','DELETE'])assert.equal((await f.start(TILE,{method,headers:{Cookie:browser.cookie}}).promise).status,405);
  const catalog=(await browser.request('/api/catalog')).body.operations;
  const token=catalog.find(item=>item.endpoint==='Bhumi/haiiizzzzzzz');assert.equal(token.enabled,false);assert.equal(token.inspectOnly,true);
  const attempt=await browser.request('/api/execute',{operationId:token.id,values:{}});assert.equal(attempt.status,422);assert.equal(attempt.body.error.code,'OPERATION_INSPECT_ONLY');
  assert.equal(f.tokenCalls().length,0);assert.equal(f.tiles.length,0);assert.equal(f.keyCalls,0);
});

integration('tile origin gates reject foreign host, forged proxy and cross-site browser requests before upstream',async t=>{
  const f=await fixture(t),browser=await signedIn(f);
  for(const host of ['evil.invalid',`localhost:${f.port===65535?65534:f.port+1}`,`127.0.0.1:${f.port}.evil.invalid`,'host.docker.internal',`sentuh.davay.space.evil.invalid`])assert.equal((await f.start(TILE,{host,headers:{Cookie:browser.cookie,'X-Forwarded-Host':`127.0.0.1:${f.port}`,'X-Forwarded-Proto':'http'}}).promise).status,403);
  for(const headers of [{Origin:'https://evil.invalid'},{Origin:`http://localhost:${f.port}`},{'Sec-Fetch-Site':'cross-site'}]){
    const result=await f.start(TILE,{headers:{Cookie:browser.cookie,...headers}}).promise;assert.equal(result.status,403);assert.equal(result.body.error.code,'ORIGIN_REJECTED');
  }
  assert.equal(f.tokenCalls().length,0);assert.equal(f.tiles.length,0);assert.equal(f.keyCalls,0);
});

integration('localhost and configured public origin work with separate origin-bound sessions and token caches',async t=>{
  const f=await fixture(t),local=await signedIn(f,{host:`localhost:${f.port}`}),publicBrowser=await signedIn(f,{host:'sentuh.davay.space',origin:'https://sentuh.davay.space'});
  assert.equal((await local.request(TILE)).status,200);assert.equal((await publicBrowser.request(TILE)).status,200);assert.equal(f.tokenCalls().length,2);
  const before=f.tiles.length;
  const stolen=await f.start(TILE,{host:'sentuh.davay.space',headers:{Cookie:local.cookie,Origin:'https://sentuh.davay.space'}}).promise;
  assert.equal(stolen.status,403);assert.equal(stolen.body.error.code,'SESSION_ORIGIN_REJECTED');
  assert.equal((await f.start(TILE,{headers:{Cookie:local.cookie}}).promise).status,403);assert.equal(f.tiles.length,before);
  assert.equal((await publicBrowser.request('/api/state')).body.authenticated,true);assert.equal((await local.request('/api/state')).body.authenticated,true);
});

integration('concurrent HTTP tiles share one token future while subsequent reads reuse only that session cache',async t=>{
  const gate=deferred(),started=deferred();
  const f=await fixture(t,{tokenReply:()=>{started.resolve();return gate.promise;}}),browser=await signedIn(f);
  const first=browser.request(TILE),second=browser.request('/api/maps/bhumi/1/0/1.png');await started.promise;await turn();
  assert.equal(f.tokenCalls().length,1);assert.equal(f.tiles.length,0);assert.equal(f.keyCalls,0);
  gate.resolve(Response.json({message:TOKEN}));assert.equal((await first).status,200);assert.equal((await second).status,200);
  assert.equal((await browser.request(TILE)).status,200);assert.equal(f.tokenCalls().length,1);assert.equal(f.tiles.length,3);
});

integration('successful tile never exposes its secret query through public state, catalog, config or logs',async t=>{
  const f=await fixture(t),browser=await signedIn(f);assert.equal((await browser.request(TILE)).status,200);
  for(const path of ['/api/state','/api/catalog','/api/maps/config','/api/diagnostics']){
    const result=await browser.request(path);assert.equal(result.status,200);noSecrets(result.text);noSecrets(result.headers);assert.ok(!result.text.includes('/expapi/live-bhumi-wms?'));
  }
  noSecrets(f.logs);assert.ok(f.logs.some(entry=>entry.event==='bhumi_tile_request'));assert.ok(!JSON.stringify(f.logs).includes('authkey='));assert.ok(!JSON.stringify(f.logs).includes('token='));
});

integration('WMS authentication rejection retries once, returns a sanitized local error and preserves main login',async t=>{
  const f=await fixture(t,{tokenReply:(_call,n)=>Response.json({message:TOKEN+n}),bhumiReply:call=>new Response(call.url.href+' '+MAIN,{status:403,headers:{'Content-Type':'text/html','X-Token':TOKEN}})}),browser=await signedIn(f);
  const result=await browser.request(TILE);assert.equal(result.status,502);assert.equal(result.body.error.code,'BHUMI_HTTP_STATUS');assert.equal(f.tokenCalls().length,2);assert.equal(f.tiles.length,2);
  assert.equal(f.tiles[0].url.searchParams.get('token'),TOKEN+'1');assert.equal(f.tiles[1].url.searchParams.get('token'),TOKEN+'2');
  assert.equal((await browser.request('/api/state')).body.authenticated,true);noSecrets(result.text);noSecrets(result.headers);noSecrets(f.logs);
});

integration('upstream token error or dedicated transport exception cannot reflect private messages or URLs',async t=>{
  const tokenFailure=await fixture(t,{tokenReply:()=>Response.json({error:true,message:KEY+' '+TOKEN+' '+MAIN},{status:503})}),first=await signedIn(tokenFailure);
  const denied=await first.request(TILE);assert.equal(denied.status,502);assert.equal(denied.body.error.code,'BHUMI_TOKEN_UNAVAILABLE');assert.equal(tokenFailure.tiles.length,0);assert.equal(tokenFailure.keyCalls,0);noSecrets(denied.text);noSecrets(tokenFailure.logs);
  const transportFailure=await fixture(t,{bhumiReply:call=>{throw Object.assign(new Error(call.url.href+' '+MAIN),{code:KEY,status:401});}}),second=await signedIn(transportFailure);
  const failed=await second.request(TILE);assert.equal(failed.status,502);assert.equal(failed.body.error.code,'BHUMI_NETWORK_ERROR');noSecrets(failed.text);noSecrets(transportFailure.logs);assert.equal((await second.request('/api/state')).body.authenticated,true);
});

integration('missing Bhumi private key does not substitute the public Google key or change main authentication',async t=>{
  const f=await fixture(t,{authkey:()=>undefined}),browser=await signedIn(f),result=await browser.request(TILE);
  assert.equal(result.status,503);assert.equal(result.body.error.code,'BHUMI_CONFIGURATION_REQUIRED');assert.equal(f.tokenCalls().length,1);assert.equal(f.tiles.length,0);
  assert.ok(!Object.hasOwn((await browser.request('/api/maps/config')).body,'apiKey'));assert.equal((await browser.request('/api/state')).body.authenticated,true);noSecrets(result.text);noSecrets(f.logs);
});

integration('main token GET authentication failure clears main state while ordinary WMS failures do not',async t=>{
  const f=await fixture(t,{tokenReply:()=>Response.json({error:true,message:TOKEN},{status:401})}),browser=await signedIn(f),result=await browser.request(TILE);
  assert.equal(result.status,401);assert.equal(result.body.error.code,'BHUMI_AUTH_REQUIRED');assert.equal((await browser.request('/api/state')).body.authenticated,false);assert.equal(f.tiles.length,0);assert.equal(f.keyCalls,0);noSecrets(result.text);noSecrets(f.logs);
});

integration('logout while main token GET is pending prevents key derivation and late tile publication',async t=>{
  const gate=deferred(),started=deferred();
  const f=await fixture(t,{tokenReply:(_call,n)=>{if(n===1){started.resolve();return gate.promise;}return Response.json({message:TOKEN+'-new'});}}),browser=await signedIn(f),oldCookie=browser.cookie;
  const pending=browser.request(TILE);await started.promise;assert.equal((await browser.request('/api/logout',{})).status,200);
  const cancelled=await pending;assert.equal(cancelled.status,401);assert.equal(cancelled.body.error.code,'BHUMI_AUTH_REQUIRED');assert.equal(f.keyCalls,0);assert.equal(f.tiles.length,0);
  gate.resolve(Response.json({message:TOKEN+'-old'}));await turn();assert.equal(f.keyCalls,0);assert.equal(f.tiles.length,0);assert.equal((await browser.request('/api/state')).body.authenticated,false);
  assert.equal((await f.start(TILE,{headers:{Cookie:oldCookie}}).promise).status,401);
  await browser.login();assert.equal((await browser.request(TILE)).status,200);assert.equal(f.tokenCalls().length,2);assert.equal(f.tiles[0].url.searchParams.get('token'),TOKEN+'-new');
});

integration('logout while PNG GET is pending aborts transport and a late body cannot publish or contaminate a fresh session',async t=>{
  const gate=deferred(),started=deferred();let observedSignal,cancelledBody=false;
  const f=await fixture(t,{tokenReply:(_call,n)=>Response.json({message:TOKEN+n}),bhumiReply:(call,n)=>{if(n===1){observedSignal=call.init.signal;started.resolve();return gate.promise;}return image();}}),browser=await signedIn(f);
  const pending=browser.request(TILE);await started.promise;await browser.request('/api/logout',{});
  assert.equal(observedSignal.aborted,true);assert.equal((await pending).status,401);
  gate.resolve(new Response(new ReadableStream({cancel(){cancelledBody=true;}}),{headers:{'Content-Type':'image/png'}}));await turn();assert.equal(cancelledBody,true);
  await browser.login();assert.equal((await browser.request(TILE)).status,200);assert.equal(f.tokenCalls().length,2);assert.equal(f.tiles[1].url.searchParams.get('token'),TOKEN+'2');noSecrets(f.logs);
});

integration('one browser abort cannot cancel another tile sharing the pending token request',async t=>{
  const gate=deferred(),started=deferred(),closed=deferred();
  const f=await fixture(t,{tokenReply:()=>{started.resolve();return gate.promise;}}),browser=await signedIn(f);
  f.server.once('request',(_req,res)=>res.once('close',()=>closed.resolve()));
  const aborted=f.start(TILE,{headers:{Cookie:browser.cookie}}),observed=aborted.promise.then(()=>false,error=>error.code==='FIXTURE_ABORTED');
  await started.promise;const survivor=browser.request('/api/maps/bhumi/1/0/0.png');await turn();aborted.abort();assert.equal(await observed,true);await closed.promise;
  gate.resolve(Response.json({message:TOKEN}));assert.equal((await survivor).status,200);assert.equal(f.tokenCalls().length,1);assert.equal(f.tiles.length,1);assert.equal(f.tiles[0].url.searchParams.get('bbox'),'-20037508.34789244,0.0,0.0,20037508.34789244');assert.equal((await browser.request('/api/state')).body.authenticated,true);
});

integration('HTTP disconnect aborts an in-flight PNG request and discards its late body',async t=>{
  const gate=deferred(),started=deferred(),transportAborted=deferred();let cancelledBody=false;
  const f=await fixture(t,{bhumiReply:call=>{call.init.signal.addEventListener('abort',()=>transportAborted.resolve(),{once:true});started.resolve();return gate.promise;}}),browser=await signedIn(f);
  const pending=f.start(TILE,{headers:{Cookie:browser.cookie}}),observed=pending.promise.then(()=>false,error=>error.code==='FIXTURE_ABORTED');
  await started.promise;pending.abort();assert.equal(await observed,true);await transportAborted.promise;
  gate.resolve(new Response(new ReadableStream({cancel(){cancelledBody=true;}}),{headers:{'Content-Type':'image/png'}}));await turn();assert.equal(cancelledBody,true);assert.equal((await browser.request('/api/state')).body.authenticated,true);noSecrets(f.logs);
});
