import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {getPublicCatalog} from '../private/operations.mjs';
import {createBerkasRatingHost} from '../assets/berkas-rating/host.js';
import {berkasRatingValues,BERKAS_RATING_COPY} from '../assets/berkas-rating/model.js';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split('\n');
const actual=name=>{const line=lines.find(line=>line.startsWith('function '+name+'(')||line.startsWith('async function '+name+'('));assert.ok(line,name);return line;};
const start=source.indexOf('function berkasRatingOperation('),end=source.indexOf('function berkasReadSection(',start);assert.ok(start>=0&&end>start);
const block=source.slice(start,end),plain=value=>JSON.parse(JSON.stringify(value)),tick=()=>new Promise(resolve=>setImmediate(resolve));
const sameNodes=(actual,expected)=>{assert.equal(actual.length,expected.length);for(let index=0;index<expected.length;index++)assert.equal(actual[index],expected[index]);};
const original=' original RAW Berkas ID +&/ ',contextId='brc_'+'a'.repeat(32),sourceId='brs_'+'b'.repeat(32),ids={post:'post-berkas-postratingberkas-d915c4',list:'post-berkas-getberkas-d15068',detail:'post-berkas-cariberkas-d88218'};
const primary=(patch={})=>({status:200,berkasRatingContextId:contextId,data:{error:false,data:{berkasId:original,nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'SINTETIS',kantor:{nama:'<Office>'},parapihak:[],perjalananBerkas:[],...patch}}});
const received=(error=false,message='received')=>({result:{status:201,delivery:'received',data:{error,message}}});
// Add only browser DOM/event capabilities missing from the existing test
// harness. Actual app helpers and host/controller/view modules are executed.
function dom(document){
 const proto=Object.getPrototypeOf(document.body),captures=new WeakMap(),add=proto.addEventListener,create=document.createElement.bind(document);
 proto.addEventListener=function(type,fn,options={}){add.call(this,type,fn);captures.set(fn,options.capture===true);options.signal?.addEventListener('abort',()=>this.listeners.set(type,(this.listeners.get(type)??[]).filter(value=>value!==fn)),{once:true});};
 const value=Object.getOwnPropertyDescriptor(proto,'value');
 Object.defineProperties(proto,{childNodes:{configurable:true,get(){return [...this.children];}},hidden:{configurable:true,get(){return this.attributes.has('hidden');},set(raw){raw?this.attributes.set('hidden',''):this.attributes.delete('hidden');}},value:{configurable:true,get(){return this._value??(this.tagName==='TEXTAREA'?this.textContent:value.get.call(this));},set(raw){value.set.call(this,raw);}}});
 proto.replaceChildren=function(...nodes){for(const child of this.children)child.parentNode=null;this.children=[];for(const node of nodes)this.appendChild(node);};
 proto.remove=function(){if(this.parentNode){const siblings=this.parentNode.children;siblings.splice(siblings.indexOf(this),1);this.parentNode=null;}};
 proto.insertBefore=function(node,reference){if(!reference)return this.appendChild(node);node.remove();const index=this.children.indexOf(reference);assert.ok(index>=0);this.children.splice(index,0,node);node.parentNode=this;return node;};
 proto.removeAttribute=function(name){this.attributes.delete(name);};
 document.createElement=tag=>{const node=create(tag);node.dataset=new Proxy({}, {get:(_,key)=>node.getAttribute('data-'+String(key).replace(/[A-Z]/g,char=>'-'+char.toLowerCase()))??undefined,set:(_,key,value)=>{node.setAttribute('data-'+String(key).replace(/[A-Z]/g,char=>'-'+char.toLowerCase()),value);return true;}});return node;};
 return async(type,target)=>{
  const event={target,type,defaultPrevented:false,stopped:false,immediate:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;this.immediate=true;}};
  const path=[];for(let node=target;node;node=node.parentNode)path.push(node);
  const call=async(node,capture)=>{for(const fn of [...node.listeners.get(type)??[]]){if((captures.get(fn)??false)!==capture)continue;await fn(event);if(event.immediate)break;}};
  for(const node of [...path].reverse()){await call(node,true);if(event.stopped)return event;}
  for(const node of path){await call(node,false);if(event.stopped)return event;}
  if(!event.stopped&&!['cancel','close'].includes(type))for(const fn of document.listeners.get(type)??[]){await fn(event);if(event.immediate)break;}
  return event;
 };
}
function setup({readyToRating=true,isPPAT=false,route='files',tab='berjalan'}={}){
 const h=harness(),{document,c,state,modal}=h,fire=dom(document),timers=new Map();let nextTimer=0;
 state.operations=getPublicCatalog();const item={berkasId:original,readyToRating,isPPAT},rows=[item],response={status:200,data:{error:false,data:rows},berkasRatingSources:[{index:0,sourceId}]},reader={loading:false,response},key=`files:${tab}`,journeys=[];
 c.flowResults.set(key,reader);Object.assign(c,{route,flowTab:tab,flowDetail:item,createBerkasRatingHost,berkasRatingValues,structuredClone,queueMicrotask,setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),currentFlow:()=>({key:`files:${c.flowTab}`,op:state.operations.find(value=>value.id===ids.list),tab:{values:{selesai:c.flowTab==='selesai'}},def:{title:'Berkasku'}}),berkasJourneyMount:(res,context,root)=>{journeys.push({res,context,root});const button=document.createElement('button');button.dataset.action='berkas-journey-open';button.textContent='Perjalanan Berkas';root.querySelector('.berkas-detail')?.appendChild(button);},loadBerkasSections:async()=>{},empty:()=>'<p>Loading</p>',berkasDetailView:()=>'<div class="berkas-detail"><input id="preserved-input" value="untouched"><details class="json-details"></details></div>',renders:0,render:()=>{c.renders++;c.reconcileBerkasRating?.();}});
 vm.runInContext(['flowData','dataItems','isBerkasDetail','berkasDetailTarget','loadBerkasDetail'].map(actual).join('\n')+'\n'+block,c);
 const context={kind:'files',item,epoch:c.sessionEpoch,sequence:c.detailSequence,current:()=>c.route==='files'&&state.authenticated&&!c.logoutPending&&c.flowResults.get(key)===reader&&!reader.loading&&reader.response===response&&response.data.data===rows&&rows.includes(item)&&c.flowDetail===item&&c.flowTab===tab};
 function mount(res=primary(),ctx=context){modal.innerHTML=c.berkasDetailView(res);modal.showModal();return c.berkasRatingMount(res,ctx,modal);}
 const owner=()=>c.flowResults.get('berkas:rating'),find=name=>modal.querySelector(`[data-berkas-rating-${name}]`);
 return {...h,item,rows,response,reader,key,context,timers,journeys,fire,mount,owner,find,open:()=>c.openBerkasRating(owner()?.button),async choose(value){return fire('click',modal.querySelector(`[data-berkas-rating-value="${value}"]`));},async comment(value){const input=find('comment');input.value=value;return fire('input',input);},submit:()=>fire('submit',find('form')),escape:()=>fire('cancel',modal),async runTimer(){assert.equal(timers.size,1);const [id,timer]=[...timers][0];assert.equal(timer.delay,300);timers.delete(id);timer.fn();await tick();},dispose:()=>c.resetBerkasRating()};
}
async function ready(h){assert.ok(h.mount());assert.equal(h.open(),true);await h.choose(3);await h.comment(' \u0085raw\n comment ');return h;}
async function settle(h,work,result=received()){h.calls.at(-1).resolve(result);await work;}

test('actual own-row source selector requires readytrue, exact index and unique opaque reference',()=>{
 const h=setup();assert.equal(h.c.berkasRatingSource(h.response,h.item,0),sourceId);for(const index of [-1,'0',0.5,1])assert.equal(h.c.berkasRatingSource(h.response,h.item,index),null);for(const flag of [false,null,undefined,'true'])assert.equal(h.c.berkasRatingSource(h.response,{...h.item,readyToRating:flag},0),null);h.response.berkasRatingSources.push({index:0,sourceId});assert.equal(h.c.berkasRatingSource(h.response,h.item,0),null);assert.equal(h.calls.length,0);
});
test('actual entry is Berkasku only and depends on readytrue rather than isPPAT',t=>{
 for(const isPPAT of [false,true,null]){const h=setup({isPPAT});t.after(h.dispose);assert.ok(h.mount());assert.equal(h.open(),true);assert.equal(h.owner().host.controller.snapshot().entry.numberYear,'42/2026');assert.equal(h.owner().host.controller.snapshot().entry.officeName,'<Office>');}
 for(const value of [false,null,undefined,'true']){const h=setup({readyToRating:value});h.item.readyToRating=value;assert.equal(h.mount(),null);}
 for(const route of ['collections','activity','searchfile']){const h=setup({route});assert.equal(h.mount(),null);}
});
test('actual loader binds opaque source metadata to original raw selected ID without deriving ID from display',async t=>{
 const h=setup();t.after(h.dispose);const work=h.c.loadBerkasDetail(h.item);assert.deepEqual(plain(h.calls[0].options.body),{operationId:ids.detail,values:{berkasId:original},berkasRatingSourceId:sourceId});h.calls[0].resolve({result:primary()});await work;assert.ok(h.owner());assert.equal(h.owner().contextId,contextId);assert.equal(h.calls.length,1);assert.equal(h.modal.textContent.includes(original),false);
});
test('expired-source local detail read retries once without metadata and never replays a writer',async()=>{
 const h=setup(),work=h.c.loadBerkasDetail(h.item);h.calls[0].reject(Object.assign(new Error('source expired'),{code:'BERKAS_RATING_CONTEXT_INVALID',delivery:'not_sent'}));await tick();assert.equal(h.calls.length,2);assert.deepEqual(plain(h.calls[1].options.body),{operationId:ids.detail,values:{berkasId:original}});const res=primary();delete res.berkasRatingContextId;h.calls[1].resolve({result:res});await work;assert.equal(h.owner(),undefined);assert.equal(h.calls.some(call=>call.options.body.operationId===ids.post),false);
});
test('ambiguous or retired-source detail failure has no metadata fallback or newer-account expiry',async()=>{
 for(const retire of [false,true]){const h=setup(),epoch=h.c.sessionEpoch,work=h.c.loadBerkasDetail(h.item);if(retire){h.c.flowResults.set(h.key,{...h.reader});h.modal.innerHTML='<p>Newer owner</p>';}h.calls[0].reject(Object.assign(new Error('old read'),{code:retire?'SESSION_EXPIRED':'BERKAS_RATING_CONTEXT_INVALID',delivery:'unknown'}));await work;assert.equal(h.calls.length,1);assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.authenticated,true);assert.equal(h.owner(),undefined);if(retire)assert.equal(h.modal.textContent,'Newer owner');}
});
test('actual writer sends only injected context/rating/trimmed comment and rejects forged payloads before API',async t=>{
 const h=await ready(setup());t.after(h.dispose);const owner=h.owner();for(const values of [{rating:5,userComment:'raw\n comment'},{rating:3,userComment:'wrong'},{rating:3,userComment:'raw\n comment',Berkasid:original}])await assert.rejects(h.c.berkasRatingWrite(owner,values),error=>error.delivery==='not_sent');assert.equal(h.calls.length,0);
 const work=h.submit();await tick();assert.deepEqual(plain(h.calls[0].options.body),{operationId:ids.post,values:{contextId,rating:3,userComment:'raw\n comment'},confirm:true});await settle(h,work,received(true,'literal'));assert.equal(h.owner().phase,'waiting');assert.equal(h.calls.length,1);
});
test('success pops composer, starts completed-list refresh without awaiting and delays feedback exactly300ms',async t=>{
 const h=await ready(setup());t.after(h.dispose);const owner=h.owner(),nodes=owner.nodes.slice(),work=h.submit();await tick();await settle(h,work,received(false,'<literal result>'));assert.equal(owner.phase,'waiting');assert.equal(owner.host,null);assert.equal(owner.detail.isConnected,true);sameNodes(h.modal.childNodes,nodes);assert.equal(h.calls.length,2);assert.deepEqual(plain(h.calls[1].options.body),{operationId:ids.list,values:{selesai:true}});assert.equal(h.find('result'),null);assert.equal(h.c.flowDetail,h.item);
 await h.runTimer();assert.equal(owner.phase,'feedback');assert.equal(owner.popped,true);assert.equal(h.c.flowDetail,null);assert.equal(h.find('message').textContent,'<literal result>');assert.equal(h.modal.querySelector('literal'),null);assert.equal(h.calls.length,2);assert.equal(h.c.closeBerkasRatingResult(),true);assert.equal(h.modal.open,false);assert.equal(h.owner(),undefined);
 h.calls[1].resolve({result:{status:200,data:{data:[]}}});await tick();assert.equal(h.state.authenticated,true);assert.equal(h.c.flowResults.get('files:selesai').loading,false);
});
test('ordinary errortrue feedback and Escape restore original detail nodes and allow a fresh explicit composer',async t=>{
 const h=await ready(setup());t.after(h.dispose);const owner=h.owner(),input=owner.nodes[0].querySelector('#preserved-input');input.value='preserved draft outside composer';const work=h.submit();await tick();await settle(h,work,received(true,''));assert.equal(h.calls.length,1);await h.runTimer();assert.equal(owner.phase,'feedback');assert.equal(owner.popped,false);assert.equal(h.find('message').textContent,'');const event=await h.escape();assert.equal(event.defaultPrevented,true);assert.equal(owner.phase,'detail');assert.equal(h.modal.open,true);assert.equal(h.modal.querySelector('#preserved-input'),input);assert.equal(input.value,'preserved draft outside composer');assert.equal(h.c.flowDetail,h.item);assert.equal(h.open(),true);assert.equal(h.owner().host.controller.snapshot().rating,0);assert.equal(h.owner().host.controller.snapshot().comment,null);assert.equal(h.calls.length,1);
});
test('Batal and Escape are local detail restoration without API and rebuild journey entry',async t=>{
 for(const escape of [false,true]){const h=await ready(setup());t.after(h.dispose);const owner=h.owner(),nodes=owner.nodes.slice();if(escape)assert.equal((await h.escape()).defaultPrevented,true);else await h.fire('click',h.find('cancel'));assert.equal(owner.phase,'detail');sameNodes(h.modal.childNodes,nodes);assert.equal(h.calls.length,0);assert.equal(h.modal.open,true);assert.equal(h.journeys.length,1);assert.ok(h.modal.querySelector('[data-action="berkas-journey-open"]'));}
});
test('uncertain native exceptionalfalse never refreshes completed list or claims acceptance and still follows extra pop',async t=>{
 const h=await ready(setup());t.after(h.dispose);const owner=h.owner(),work=h.submit();await tick();h.calls[0].reject(Object.assign(new Error('timeout'),{delivery:'unknown',code:'UPSTREAM_TIMEOUT'}));await work;assert.deepEqual(plain(owner.outcome),{error:false,message:BERKAS_RATING_COPY.fallback,exceptional:true,accepted:false,delivery:'unknown'});assert.equal(h.calls.length,1);await h.runTimer();assert.equal(owner.popped,true);assert.equal(h.c.flowDetail,null);assert.match(h.modal.textContent,/belum dapat dipastikan/);assert.equal(h.calls.length,1);
});
test('malformed successful API envelope is unknown rather than rating acceptance',async t=>{
 for(const response of [{result:{delivery:'received',data:{error:'false',message:'wrong'}}},{result:{delivery:'unknown',data:{error:false,message:'wrong'}}},{result:{status:200,data:{error:false,message:'missing delivery'}}}]){const h=await ready(setup());t.after(h.dispose);const work=h.submit();await tick();await settle(h,work,response);assert.equal(h.owner().outcome.accepted,false);assert.equal(h.owner().outcome.exceptional,true);assert.equal(h.calls.length,1);}
});
test('expired writer local rejection keeps owner current, displays literal error and permits Batal but no new send',async t=>{
 const h=await ready(setup());t.after(h.dispose);const owner=h.owner(),work=h.submit();await tick();h.calls[0].reject(Object.assign(new Error('<context expired>'),{code:'BERKAS_RATING_CONTEXT_INVALID',delivery:'not_sent'}));await work;assert.equal(owner.expired,true);assert.equal(owner.phase,'compose');assert.equal(h.c.berkasRatingCurrent(owner),true);assert.equal(h.find('error').textContent,'<context expired>');assert.equal(h.find('submit').disabled,true);await h.submit();assert.equal(h.calls.length,1);await h.fire('click',h.find('cancel'));assert.equal(owner.phase,'detail');assert.equal(owner.button.disabled,true);assert.match(h.modal.textContent,/Muat ulang daftar Berkasku/);assert.equal(h.open(),false);
});
test('pending navigation/session/source replacement suppresses late accepted tuple or401 and erases old references',async()=>{
 for(const auth of [false,true]){const h=await ready(setup()),owner=h.owner(),epoch=h.c.sessionEpoch,work=h.submit();await tick();h.c.flowResults.set(h.key,{...h.reader});h.c.reconcileBerkasRating();h.modal.innerHTML='<p>New account screen</p>';h.modal.open=true;if(auth)h.calls[0].reject(Object.assign(new Error('old401'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve(received(false,'old'));await work;assert.equal(h.owner(),undefined);assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.authenticated,true);assert.equal(h.modal.textContent,'New account screen');assert.equal(owner.host,null);assert.equal(owner.context,null);assert.equal(owner.item,null);assert.equal(h.timers.size,0);assert.equal(h.calls.length,1);}
});
test('delayed result timer cannot replace a new navigation or logout screen',async()=>{
 for(const action of ['navigate','clearPrivate']){const h=await ready(setup()),owner=h.owner(),work=h.submit();await tick();await settle(h,work,received(true,'old result'));const timer=[...h.timers.values()][0];assert.ok(timer);if(action==='navigate'){h.c.location.hash='#/account';h.c.navigate();}else h.c.clearPrivate();h.modal.innerHTML='<p>New private screen</p>';h.modal.open=true;timer.fn();assert.equal(h.owner(),undefined);assert.equal(h.modal.textContent,'New private screen');assert.equal(h.timers.size,0);assert.equal(owner.context,null);assert.equal(owner.nodes,null);assert.equal(owner.host,null);}
});
test('completed refresh response or401 after newer login cannot publish or clear the new account',async t=>{
 for(const auth of [false,true]){const h=await ready(setup());t.after(h.dispose);const work=h.submit();await tick();await settle(h,work,received(false,'accepted'));assert.equal(h.calls.length,2);h.c.sessionEpoch++;h.state.user={username:'new login'};h.c.resetBerkasRating();const epoch=h.c.sessionEpoch,before=h.c.renders;if(auth)h.calls[1].reject(Object.assign(new Error('old refresh401'),{code:'SESSION_EXPIRED'}));else h.calls[1].resolve({result:{status:200,data:{data:[{berkasId:'OLD'}]}}});await tick();assert.equal(h.state.authenticated,true);assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.user.username,'new login');assert.equal(h.c.renders,before);assert.equal(h.state.results.has(ids.list),false);}
});
test('completed-tab source replacement and refresh render before300ms do not retire committed feedback',async t=>{
 const h=await ready(setup({tab:'selesai'}));t.after(h.dispose);const owner=h.owner(),originalReader=h.reader,work=h.submit();await tick();await settle(h,work,received(false,'accepted'));assert.notEqual(h.c.flowResults.get('files:selesai'),originalReader);assert.equal(owner.phase,'waiting');assert.equal(h.c.berkasRatingCurrent(owner),false);assert.equal(h.c.berkasRatingCurrent(owner,false),true);
 h.calls[1].resolve({result:{status:200,data:{data:[]}}});await tick();assert.equal(h.owner(),owner);assert.equal(owner.phase,'waiting');assert.equal(h.timers.size,1);await h.runTimer();assert.equal(owner.phase,'feedback');assert.equal(h.find('message').textContent,'accepted');assert.equal(h.c.closeBerkasRatingResult(),true);assert.equal(h.modal.open,false);
});
test('current completed-refresh401 immediately retires private owner and its delayed result timer',async()=>{
 const h=await ready(setup()),owner=h.owner(),epoch=h.c.sessionEpoch,work=h.submit();await tick();await settle(h,work,received(false,'accepted'));const timer=[...h.timers.values()][0];assert.ok(timer);h.calls[1].reject(Object.assign(new Error('current refresh expired'),{code:'SESSION_EXPIRED'}));await tick();assert.equal(h.state.authenticated,false);assert.equal(h.c.sessionEpoch,epoch+1);assert.equal(h.owner(),undefined);assert.equal(h.timers.size,0);assert.equal(owner.context,null);assert.equal(owner.nodes,null);assert.equal(h.modal.open,false);timer.fn();assert.equal(h.find('result'),null);assert.equal(h.c.renders>=1,true);
});
test('exact selected operation capability rejects path/profile/auth/encoding/effect/confirmation substitutions',()=>{
 for(const patch of [{path:'/berkas/postratingberkas'},{clientProfile:'main'},{auth:'application'},{encoding:'form'},{effect:'read'},{requiresConfirmation:false},{method:'GET'},{serviceId:'directus'},{enabled:false}]){const h=setup(),op=h.state.operations.find(value=>value.id===ids.post);Object.assign(op,patch);assert.equal(h.c.berkasRatingOperation(),null);assert.equal(h.mount(),null);assert.equal(h.calls.length,0);}
});
