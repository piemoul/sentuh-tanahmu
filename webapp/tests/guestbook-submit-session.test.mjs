import test from 'node:test';
import assert from 'node:assert/strict';
import {GuestbookClient,guestbookLookupFromRead} from '../private/guestbook-client.mjs';
import {GuestbookPostClient} from '../private/guestbook-post.mjs';
import {GuestbookSubmissionSession} from '../private/guestbook-submit-session.mjs';

const app='AtrBpn synthetic-guestbook-session-app',configuration={configured:true,applicationAuthorization:()=>app};
const fields=()=>({name:' synthetic name ',nik:'abcdefghijklmnop',phone:' +62 raw ',birthDate:' 1/2/raw ',birthPlace:' Kota ',address:'a\nb\rc',email:' @ ',institution:' Instansi ',purpose:' Tujuan '});
const query=(suffix='one')=>({uid:' synthetic-office-'+suffix+' ',unid:' synthetic-unit-'+suffix+' '});
const lookup=(patch={})=>({userId:'synthetic-server-user',kantorId:'synthetic-server-office',unitKerjaId:'synthetic-server-unit',namaUnitKerja:'Nama unit sintetis',...patch});
const session=()=>{const authenticationController=new AbortController();return{active:true,user:{username:'synthetic-account'},tokens:{accessToken:'never-forward-account-token'},authenticationController,authenticationSignal:authenticationController.signal};};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const rejected=(code,delivery='not_sent')=>error=>{assert.equal(error.code,code);assert.equal(error.delivery,delivery);assert.equal(error.details?.delivery,delivery);return true;};
function fixture(options={}){
 let now=1_000;const calls=[],current=session();const reader=new GuestbookClient(configuration,{transport:async(url,init)=>{calls.push({url,init});return options.read?options.read(url,init):Response.json({error:true,message:'unused native error',data:lookup()});}});
 const poster=new GuestbookPostClient(options.configuration??configuration,{transport:async(url,init)=>{calls.push({url,init});return options.post?options.post(url,init):Response.json({error:true});},timeoutMs:options.timeoutMs??30_000,maxResponseBytes:options.maxResponseBytes??20*1024*1024});
 const store=new GuestbookSubmissionSession({postClientPromise:options.postClientPromise??Promise.resolve(poster),now:()=>now,...options.store});
 const open=async(params=query(),owner=current)=>{const ticket=store.beginRead(params,owner),result=await reader.read(params);return store.observeRead(result,owner,ticket);};
 const write=(contextId,patch={},owner=current,assertCurrent=()=>{},signal)=>store.submit({contextId,...fields(),...patch},owner,assertCurrent,signal);
 return{store,reader,poster,session:current,calls,open,write,advance:ms=>{now+=ms;},posts:()=>calls.filter(row=>row.init.method==='POST')};
}
test('realreader brandsrawlookup privately whilepublicredaction neverbecomesnativeID',async()=>{
 const params=query(),source=lookup({userId:'user '+app,kantorId:'office synthetic-guestbook-session-app',namaUnitKerja:'display '+app});
 const reader=new GuestbookClient(configuration,{transport:async()=>Response.json({error:true,message:app,data:source})});const result=await reader.read(params);
 assert.equal(JSON.stringify(result).includes('synthetic-guestbook-session-app'),false);assert.equal(result.data.data.userId,'user [REDACTED]');assert.deepEqual(guestbookLookupFromRead(result,params),source);
 const cloned=guestbookLookupFromRead(result,params);cloned.userId='tampered';assert.deepEqual(guestbookLookupFromRead(result,params),source);
 for(const forged of [{...result},structuredClone(result),JSON.parse(JSON.stringify(result)),{status:200,data:{data:source}}])assert.equal(guestbookLookupFromRead(forged,params),null);
 assert.equal(guestbookLookupFromRead(result,query('other')),null);assert.equal(guestbookLookupFromRead(result),null);
});
test('opaquereadycontext keepslookupIDs serverowned and originaltext reachesonePOST',async()=>{
 const h=fixture(),read=await h.open(),id=read.guestbookContextId;assert.match(id,/^gbc_[A-Za-z0-9_-]{32}$/);assert.equal(id.includes('synthetic'),false);
 assert.deepEqual(await h.write(id),{status:200,data:{error:false},delivery:'received'});assert.equal(h.posts().length,1);
 const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':h.posts()[0].init.headers['Content-Type']},body:h.posts()[0].init.body}).formData();
 assert.equal(form.get('kantorId'),'synthetic-server-office');assert.equal(form.get('unitKerjaId'),'synthetic-server-unit');assert.equal(form.get('userId'),'synthetic-server-user');assert.equal(form.get('tanggalLahir'),fields().birthDate);assert.equal(form.get('nik'),fields().nik);assert.equal(form.get('namaLengkap'),fields().name);
 assert.equal(h.posts()[0].init.headers.Authorization,app);assert.equal(h.posts()[0].init.body.includes(Buffer.from(h.session.tokens.accessToken)),false);
 h.store.close();
});
test('publicredactedIDsareimmutablyseparatedfromsameQRnativepayload',async()=>{
 const source=lookup({userId:'raw '+app,kantorId:'synthetic-guestbook-session-app'}),h=fixture({read:()=>Response.json({data:source})}),read=await h.open();assert.equal(read.data.data.userId,'raw [REDACTED]');read.data.data.userId='caller forged';read.data.data.kantorId='caller forged';
 await h.write(read.guestbookContextId);const bytes=h.posts()[0].init.body;assert.ok(bytes.includes(Buffer.from(source.userId)));assert.ok(bytes.includes(Buffer.from(source.kantorId)));assert.equal(bytes.includes(Buffer.from('caller forged')),false);h.store.close();
});
test('actualbrandedresultfromdifferentQRcannotmintcurrentticketcontext',async()=>{
 const h=fixture(),a=query('a'),b=query('b'),ticket=h.store.beginRead(b,h.session),result=await h.reader.read(a),observed=h.store.observeRead(result,h.session,ticket);
 assert.equal(observed.guestbookContextId,undefined);assert.equal(h.store.states.get(h.session).context,null);assert.equal(h.posts().length,0);h.store.close();
});
test('unbranded, nullmodel and malformedlookupresponsesneverissuecontextorPOST',async()=>{
 const h=fixture(),ticket=h.store.beginRead(query(),h.session);for(const data of [lookup(),null])assert.equal(h.store.observeRead({status:200,data:{error:false,data}},h.session,ticket).guestbookContextId,undefined);
 const nullReader=new GuestbookClient(configuration,{transport:async()=>Response.json({data:null})});const result=await nullReader.read(query());assert.equal(h.store.observeRead(result,h.session,ticket).guestbookContextId,undefined);
 const malformed=new GuestbookClient(configuration,{transport:async()=>Response.json({data:{userId:1}})});await assert.rejects(malformed.read(query()),{code:'GUESTBOOK_RESPONSE_UNRECOGNIZED'});assert.equal(h.posts().length,0);h.store.close();
});
test('readrace latestticketwins and beginningnewreadinvalidatesoldformimmediately',async()=>{
 const h=fixture(),a=query('a'),b=query('b'),ta=h.store.beginRead(a,h.session),tb=h.store.beginRead(b,h.session),ra=await h.reader.read(a),rb=await h.reader.read(b);
 assert.equal(h.store.observeRead(ra,h.session,ta).guestbookContextId,undefined);const current=h.store.observeRead(rb,h.session,tb).guestbookContextId;assert.match(current,/^gbc_/);
 h.store.beginRead(query('c'),h.session);await assert.rejects(h.write(current),rejected('GUESTBOOK_CONTEXT_INVALID'));assert.equal(h.posts().length,0);h.store.close();
});
test('missingorextraidentityfieldsinvaliddraftwrongcontextrejectbeforetransport',async()=>{
 const h=fixture(),read=await h.open();for(const patch of [{kantorId:'forged'},{userId:'forged'},{unitKerjaId:'forged'},{uid:'forged'},{name:''},{nik:'short'},{email:'no-at'},{birthDate:null}])await assert.rejects(h.write(read.guestbookContextId,patch),rejected('GUESTBOOK_POST_INPUT_INVALID'));
 await assert.rejects(h.write('gbc_'+'y'.repeat(32)),rejected('GUESTBOOK_CONTEXT_INVALID'));assert.equal(h.posts().length,0);h.store.close();
});
test('readycontextTTL10minutes expiresexactlyatdeadline, rereadgetsnewopaqueID',async()=>{
 const h=fixture({post:()=>new Response(null,{status:201})}),first=await h.open();h.advance(599999);assert.equal((await h.write(first.guestbookContextId)).data.error,true);h.advance(1);await assert.rejects(h.write(first.guestbookContextId),rejected('GUESTBOOK_CONTEXT_INVALID'));
 const second=await h.open();assert.notEqual(first.guestbookContextId,second.guestbookContextId);assert.equal((await h.write(second.guestbookContextId)).data.error,true);assert.equal(h.posts().length,2);h.store.close();
});
test('knownreceivederror retainsreadycontext andpermitsonlynewexplicitretry',async()=>{
 const h=fixture({post:()=>new Response(null,{status:201})}),id=(await h.open()).guestbookContextId;assert.deepEqual(await h.write(id),{status:201,data:{error:true},delivery:'received'});assert.equal(h.posts().length,1);await settle();assert.equal(h.posts().length,1);assert.equal(h.store.states.get(h.session).context.status,'ready');assert.equal(h.store.states.get(h.session).guards.size,0);await h.write(id,{purpose:'new explicit purpose'});assert.equal(h.posts().length,2);h.store.close();
});
test('acceptedguardpersistsTTLfreshQRreadandsameaccounttokenrefresh',async()=>{
 const h=fixture(),first=(await h.open()).guestbookContextId;await h.write(first);await assert.rejects(h.write(first),rejected('GUESTBOOK_CONTEXT_INVALID'));h.advance(600001);h.session.tokens={accessToken:'replacement-account-token'};
 const next=(await h.open(query('same-office-different-code'))).guestbookContextId;await assert.rejects(h.write(next),rejected('GUESTBOOK_ATTEMPT_USED'));assert.equal(h.posts().length,1);h.store.close();
});
test('unknownhandoffguardpersistsfreshlookup andneverautomaticallyresubmits',async()=>{
 for(const mode of ['transport','malformed','truncated','redirect','non2xx','oversize']){
  const post=()=>{if(mode==='transport')throw Error('synthetic socket loss');if(mode==='malformed')return new Response(' ',{headers:{'Content-Type':'application/json'}});if(mode==='truncated')return new Response('{}',{headers:{'Content-Length':'9','Content-Type':'application/json'}});if(mode==='redirect')return new Response(null,{status:302});if(mode==='non2xx')return new Response(null,{status:401});return new Response('x'.repeat(65));};
  const h=fixture({post,maxResponseBytes:64}),id=(await h.open()).guestbookContextId;await assert.rejects(h.write(id),error=>{assert.equal(error.delivery,'unknown');assert.equal(error.details?.delivery,'unknown');return true;});assert.equal(h.posts().length,1);h.advance(700000);const next=(await h.open(query('fresh'))).guestbookContextId;await assert.rejects(h.write(next),rejected('GUESTBOOK_ATTEMPT_USED'));assert.equal(h.posts().length,1);h.store.close();
 }
});
test('concurrentwritesandfreshcontextforpendingoriginaltargetshareoneserverhandoff',async()=>{
 const pending=deferred(),h=fixture({post:()=>pending.promise}),a=(await h.open()).guestbookContextId,write=h.write(a);await settle();assert.equal(h.posts().length,1);await assert.rejects(h.write(a),rejected('GUESTBOOK_CONTEXT_INVALID'));
 const b=(await h.open(query('otherqr'))).guestbookContextId;await assert.rejects(h.write(b),rejected('GUESTBOOK_ATTEMPT_USED'));pending.resolve(Response.json({}));await assert.rejects(write,error=>error.delivery==='unknown');assert.equal(h.posts().length,1);h.store.close();
});
test('pretransportconfigurationfailure isnotSentandretrydoesnotneednewread',async()=>{
 let configured=false;const config={get configured(){return configured;},applicationAuthorization:()=>app},h=fixture({configuration:config}),id=(await h.open()).guestbookContextId;await assert.rejects(h.write(id),rejected('GUESTBOOK_POST_CONFIGURATION_UNAVAILABLE'));assert.equal(h.posts().length,0);assert.equal(h.store.states.get(h.session).guards.size,0);configured=true;await h.write(id);assert.equal(h.posts().length,1);h.store.close();
});
test('newreadwhilesharedclientloadsretiresoldbeforeanyPOST',async()=>{
 const lazy=deferred(),h=fixture({postClientPromise:lazy.promise}),id=(await h.open()).guestbookContextId,pending=h.write(id);h.store.beginRead(query('new'),h.session);lazy.resolve(h.poster);await assert.rejects(pending,rejected('GUESTBOOK_CONTEXT_INVALID'));assert.equal(h.posts().length,0);h.store.close();
});
test('staleownershipbeforeclientreadycannotdispatch and stalecompletioncannotpublish',async()=>{
 let current=true;const ready=deferred(),h=fixture({postClientPromise:ready.promise}),id=(await h.open()).guestbookContextId,pending=h.write(id,{},h.session,()=>{if(!current)throw Object.assign(Error('retired'),{code:'SESSION_CHANGED'});});current=false;ready.resolve(h.poster);await assert.rejects(pending,rejected('SESSION_CHANGED'));assert.equal(h.posts().length,0);h.store.close();
 const response=deferred(),next=fixture({post:()=>response.promise}),nid=(await next.open()).guestbookContextId;let alive=true;const sent=next.write(nid,{},next.session,()=>{if(!alive)throw Object.assign(Error('retired'),{code:'SESSION_CHANGED'});});await settle();alive=false;response.resolve(Response.json({}));await assert.rejects(sent,rejected('SESSION_CHANGED','unknown'));assert.equal(next.posts().length,1);next.store.close();
});
test('requestcancellationbeforehandoffnotSent andafterhandoffunknownlocksurvivesnewread',async()=>{
 const h=fixture(),id=(await h.open()).guestbookContextId,pre=new AbortController();pre.abort();await assert.rejects(h.write(id,{},h.session,()=>{},pre.signal),rejected('GUESTBOOK_POST_ABORTED'));assert.equal(h.posts().length,0);await h.write(id);h.store.close();
 const response=deferred(),next=fixture({post:()=>response.promise}),nid=(await next.open()).guestbookContextId,controller=new AbortController(),pending=next.write(nid,{},next.session,()=>{},controller.signal);await settle();controller.abort();await assert.rejects(pending,rejected('GUESTBOOK_POST_ABORTED','unknown'));assert.equal(next.posts()[0].init.signal.aborted,true);response.resolve(Response.json({}));const newer=(await next.open()).guestbookContextId;await assert.rejects(next.write(newer),rejected('GUESTBOOK_ATTEMPT_USED'));next.store.close();
});
test('sessionrotationandexplicitdiscardabortpendingPOSTandretireallreferences',async()=>{
 for(const retire of [h=>h.session.authenticationController.abort(),h=>h.store.discard(h.session),h=>h.store.close()]){
  const response=deferred(),h=fixture({post:()=>response.promise}),id=(await h.open()).guestbookContextId,pending=h.write(id);await settle();retire(h);await assert.rejects(pending,error=>{assert.equal(error.delivery,'unknown');return true;});assert.equal(h.posts()[0].init.signal.aborted,true);assert.equal(h.store.live.size,0);response.resolve(Response.json({}));await settle();h.store.close();
 }
});
test('timeout after POST handoff remains unknown and fresh read cannot replay',async()=>{
 const late=deferred(),h=fixture({post:()=>late.promise,timeoutMs:5}),id=(await h.open()).guestbookContextId,keep=setTimeout(()=>{},1000);
 try{await assert.rejects(h.write(id),rejected('GUESTBOOK_POST_TIMEOUT','unknown'));assert.equal(h.posts().length,1);assert.equal(h.posts()[0].init.signal.aborted,true);late.resolve(Response.json({}));await settle();const fresh=(await h.open()).guestbookContextId;await assert.rejects(h.write(fresh),rejected('GUESTBOOK_ATTEMPT_USED'));assert.equal(h.posts().length,1);}finally{clearTimeout(keep);h.store.close();}
});
test('replacementuserobjectdoesnotinheritoldcontextandtokenrefreshdoesnotchangeowner',async()=>{
 const h=fixture(),id=(await h.open()).guestbookContextId;h.session.tokens={accessToken:'fresh-token'};await h.write(id);h.session.user={username:'new-synthetic-owner'};await assert.rejects(h.write(id),rejected('GUESTBOOK_CONTEXT_INVALID'));const read=await h.open();await h.write(read.guestbookContextId);assert.equal(h.posts().length,2);h.store.close();
});
test('guardkeynormalizesnulltoemptythreeIDs andstoresnoPIIvalues',async()=>{
 let ids=lookup({userId:null,kantorId:null,unitKerjaId:null}),h=fixture({read:()=>Response.json({data:ids})}),id=(await h.open()).guestbookContextId;await h.write(id);
 ids=lookup({userId:'',kantorId:'',unitKerjaId:'',namaUnitKerja:'display change'});const same=(await h.open(query('different'))).guestbookContextId;await assert.rejects(h.write(same),rejected('GUESTBOOK_ATTEMPT_USED'));const state=h.store.states.get(h.session);assert.equal(state.guards.size,1);
 for(const [key,value]of state.guards){assert.match(key,/^[a-f0-9]{64}$/);assert.deepEqual(Object.keys(value).sort(),['contextId','status']);assert.match(value.contextId,/^gbc_/);assert.equal(value.status,'accepted');assert.equal(JSON.stringify(value).includes('synthetic'),false);}
 ids=lookup({userId:'new-user',kantorId:'',unitKerjaId:''});await h.write((await h.open()).guestbookContextId);assert.equal(h.posts().length,2);h.store.close();
});
test('default256guardboundisatomicanddoesnotdropacceptedguardsfornewtargets',async()=>{
 const h=fixture(),id=(await h.open()).guestbookContextId;assert.equal(h.store.maxGuards,256);const state=h.store.states.get(h.session);for(let n=0;n<256;n++)state.guards.set(n.toString(16).padStart(64,'0'),{contextId:'gbc_'+'x'.repeat(32),status:'accepted'});
 await assert.rejects(h.write(id),rejected('GUESTBOOK_ATTEMPT_LIMIT'));assert.equal(h.posts().length,0);assert.equal(state.guards.size,256);h.store.close();
 let count=0;const next=fixture({store:{maxGuards:2},read:()=>Response.json({data:lookup({userId:'unique-user-'+count++})})});for(let n=0;n<2;n++)await next.write((await next.open()).guestbookContextId);await assert.rejects(next.write((await next.open()).guestbookContextId),rejected('GUESTBOOK_ATTEMPT_LIMIT'));assert.equal(next.posts().length,2);next.store.close();
});
test('closedinactiveandmissingauthenticationcannotcreatereadcontextorPOST',async()=>{
 for(const owner of [null,{}, {active:false,user:{},tokens:{}},{active:true,user:null,tokens:{}},{active:true,user:{},tokens:null}]){const h=fixture();assert.throws(()=>h.store.beginRead(query(),owner),{code:'SESSION_EXPIRED'});assert.equal(h.store.live.size,0);h.store.close();}
 const h=fixture(),id=(await h.open()).guestbookContextId;h.store.close();await assert.rejects(h.write(id),error=>error.code==='SESSION_EXPIRED');assert.equal(h.store.live.size,0);h.store.close();
});
test('constructorrejectsbadcontextpolicieswithoutsideeffects',()=>{
 for(const options of [{now:1},{ttlMs:0},{ttlMs:1.5},{maxGuards:0},{maxGuards:1025},{maxGuards:1.5}])assert.throws(()=>new GuestbookSubmissionSession(options),TypeError);
});
