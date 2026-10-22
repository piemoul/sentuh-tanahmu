import test from 'node:test';
import assert from 'node:assert/strict';
import {createBerkasRatingHost} from '../assets/berkas-rating/host.js';
import {BERKAS_RATING_COPY} from '../assets/berkas-rating/model.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const decode=value=>value.replace(/&(?:amp|quot|lt|gt|#39);/g,token=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&#39;':"'"}[token]));
// Bounded DOM/event fake for the actual host modules. No browser globals,
// fetch, credentials, storage, sensors or provider request are supplied.
class Element{
 constructor(document,tag,text=null){Object.assign(this,{document,tagName:tag.toUpperCase(),text,children:[],parentNode:null,attributes:new Map(),listeners:new Map()});this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,char=>'-'+char.toLowerCase()))??undefined});}
 get isConnected(){return this===this.document.body||!!this.parentNode?.isConnected;}
 get disabled(){return this.attributes.has('disabled');}set disabled(value){value?this.attributes.set('disabled',''):this.attributes.delete('disabled');}
 get hidden(){return this.attributes.has('hidden');}set hidden(value){value?this.attributes.set('hidden',''):this.attributes.delete('hidden');}
 get value(){return this._value??(this.tagName==='TEXTAREA'?this.textContent:this.getAttribute('value')??'');}set value(value){this._value=String(value);}
 get textContent(){return this.text===null?this.children.map(child=>child.textContent).join(''):decode(this.text);}
 set textContent(value){this.replaceChildren(new Element(this.document,'#text',String(value)));}
 setAttribute(name,value){this.attributes.set(name,String(value));}getAttribute(name){return this.attributes.get(name)??null;}
 appendChild(child){child.remove();this.children.push(child);child.parentNode=this;return child;}
 remove(){if(this.parentNode){const siblings=this.parentNode.children;siblings.splice(siblings.indexOf(this),1);this.parentNode=null;}}
 replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];for(const child of children)this.appendChild(child);}
 contains(child){return this===child||this.children.some(node=>node.contains(child));}
 matches(selector){if(this.text!==null)return false;const tag=selector.match(/^[a-z][\w-]*/i)?.[0];if(tag&&tag.toUpperCase()!==this.tagName)return false;for(const match of selector.matchAll(/#([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)){if(match[1]&&this.getAttribute('id')!==match[1])return false;if(match[2]&&(!this.attributes.has(match[2])||match[3]!==undefined&&this.getAttribute(match[2])!==match[3]))return false;}return true;}
 closest(selector){for(let node=this;node;node=node.parentNode)if(node.matches(selector))return node;return null;}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 addEventListener(type,fn,options={}){if(options.signal?.aborted)return;const item={fn,capture:options.capture===true};this.listeners.set(type,[...(this.listeners.get(type)??[]),item]);options.signal?.addEventListener('abort',()=>this.listeners.set(type,(this.listeners.get(type)??[]).filter(value=>value!==item)),{once:true});}
 focus(){this.document.activeElement=this;}
 set innerHTML(html){this.replaceChildren();const stack=[this],voids=new Set(['INPUT','BR','IMG','HR']);for(const token of String(html).match(/<[^>]*>|[^<]+/g)??[]){if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const child=new Element(this.document,tag);for(const match of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))child.setAttribute(match[1],decode(match[2]??''));stack.at(-1).appendChild(child);if(!voids.has(child.tagName)&&!token.endsWith('/>'))stack.push(child);}else stack.at(-1).appendChild(new Element(this.document,'#text',token));}}
}
async function dispatch(type,target){
 const event={type,target,defaultPrevented:false,stopped:false,immediate:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;this.immediate=true;}};
 const path=[];for(let node=target;node;node=node.parentNode)path.push(node);
 async function call(node,capture){for(const item of [...node.listeners.get(type)??[]]){if(item.capture!==capture)continue;await item.fn(event);if(event.immediate)break;}}
 for(const node of [...path].reverse()){await call(node,true);if(event.stopped)return event;}
 for(const node of path){await call(node,false);if(event.stopped)break;}
 return event;
}
function setup({write=async()=>({error:false,message:'received'}),onResult=()=>{},onCancel=()=>{}}={}){
 const document={activeElement:null,createElement(tag){return new Element(this,tag);}};document.body=document.createElement('body');const root=document.body.appendChild(document.createElement('dialog'));root.setAttribute('id','modal');root.innerHTML='<p data-original-detail>Original detail</p>';
 let current=true,available=true;const writes=[],results=[],cancels=[],sessions=[],generic=[];root.addEventListener('cancel',()=>generic.push('cancel'));
 const host=createBerkasRatingHost({document,root,entry:{numberYear:'1/2026',officeName:'<Office>'},write:value=>{writes.push(structuredClone(value));return write(value);},writeAvailable:()=>available,isCurrent:()=>current,onResult:value=>{results.push(value);onResult(value);},onCancel:()=>{cancels.push(true);onCancel();},onSessionError:error=>sessions.push(error)});
 assert.equal(host.mount(),true);const slot=()=>root.querySelector('[data-berkas-rating]'),find=name=>slot()?.querySelector(`[data-berkas-rating-${name}]`);
 return {document,root,host,writes,results,cancels,sessions,generic,slot,find,fire:(type,target)=>dispatch(type,target),async choose(value){return dispatch('click',slot().querySelector(`[data-berkas-rating-value="${value}"]`));},async comment(value){const node=find('comment');node.value=value;return dispatch('input',node);},submit:()=>dispatch('submit',find('form')),cancel:()=>dispatch('click',find('cancel')),escape:()=>dispatch('cancel',root),retire:()=>current=false,setAvailable:value=>available=value,dispose:()=>host.dispose()};
}
async function ready(h){await h.choose(3);await h.comment(' \u0085raw\n comment \u0085');return h;}

test('host mounts one native composer in the existing parent dialog with five accessible tap stars',t=>{
 const h=setup();t.after(h.dispose);assert.equal(h.root.querySelector('dialog'),null);assert.equal(h.root.querySelector('[data-original-detail]'),null);assert.equal(h.slot().querySelectorAll('[data-berkas-rating-value]').length,5);assert.equal(h.find('submit').disabled,true);assert.equal(h.find('cancel').disabled,false);assert.match(h.root.textContent,/Berikan rating kamu untuk Berkas no\. 1\/2026 Kantor Pertanahan <Office>/);assert.equal(h.root.querySelector('Office'),null);assert.equal(h.find('comment').getAttribute('maxlength'),null);
});
test('actual form input and star click produce one source-free trimmed write without another confirmation',async t=>{
 const h=await ready(setup());t.after(h.dispose);assert.equal(h.find('submit').disabled,false);await h.submit();assert.deepEqual(h.writes,[{rating:3,userComment:'raw\n comment'}]);assert.deepEqual(h.results,[{error:false,message:'received',exceptional:false,accepted:true,delivery:'received'}]);assert.equal(h.find('submit').disabled,true);assert.equal(h.slot().querySelectorAll('[data-berkas-rating-value]').every(node=>node.disabled),true);assert.equal(h.root.querySelector('dialog'),null);
});
test('input and caret survive star paints, local rejection and retry availability changes',async t=>{
 const h=setup({write:async()=>{throw Object.assign(new Error('<not sent>'),{delivery:'not_sent'});}});t.after(h.dispose);const textarea=h.find('comment');textarea.focus();await h.comment(' raw\n text ');textarea.selectionStart=2;textarea.selectionEnd=6;await h.choose(4);assert.equal(h.find('comment'),textarea);assert.equal(h.document.activeElement,textarea);assert.equal(textarea.selectionStart,2);assert.equal(textarea.selectionEnd,6);
 await h.submit();assert.equal(h.find('comment'),textarea);assert.equal(textarea.value,' raw\n text ');assert.equal(h.find('error').textContent,'<not sent>');assert.equal(h.find('error').hidden,false);assert.equal(h.root.querySelector('not'),null);h.setAvailable(false);h.host.paint();assert.equal(h.find('submit').disabled,true);h.setAvailable(true);h.host.paint();assert.equal(h.find('submit').disabled,false);assert.equal(h.writes.length,1);
});
test('busy composer blocks Batal and Escape and programmatic duplicate controls cannot replay it',async t=>{
 const wait=deferred(),h=await ready(setup({write:()=>wait.promise}));t.after(h.dispose);const work=h.submit();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.writes.length,1);assert.equal(h.find('pending').hidden,false);assert.equal(h.find('cancel').disabled,true);assert.equal(h.find('comment').disabled,true);assert.equal(h.find('submit').disabled,true);
 await h.cancel();const escape=await h.escape();assert.equal(escape.defaultPrevented,true);assert.deepEqual(h.generic,[]);assert.deepEqual(h.cancels,[]);const star=h.slot().querySelector('[data-berkas-rating-value="5"]');star.disabled=false;await h.fire('click',star);assert.equal(h.host.controller.snapshot().rating,3);h.find('cancel').disabled=false;await h.cancel();await h.submit();assert.equal(h.writes.length,1);assert.deepEqual(h.cancels,[]);
 wait.resolve({error:true,message:'not accepted'});await work;assert.equal(h.results.length,1);assert.equal(h.results[0].accepted,false);
});
test('Batal and Escape cancel the child exactly once and prevent generic parent modal cleanup',async t=>{
 for(const useEscape of [false,true]){const h=await ready(setup());t.after(h.dispose);const event=useEscape?await h.escape():await h.cancel();assert.equal(event.defaultPrevented,true);assert.deepEqual(h.cancels,[true]);assert.deepEqual(h.generic,[]);assert.equal(h.writes.length,0);await h.cancel();await h.escape();assert.deepEqual(h.cancels,[true]);}
});
test('not_sent error leaves exact draft editable, while ambiguous result freezes it without accepted=true',async t=>{
 for(const delivery of ['not_sent','unknown']){const h=await ready(setup({write:async()=>{throw Object.assign(new Error('<failure>'),{delivery});}}));t.after(h.dispose);await h.submit();if(delivery==='not_sent'){assert.equal(h.find('submit').disabled,false);assert.equal(h.find('comment').disabled,false);assert.equal(h.find('error').textContent,'<failure>');assert.deepEqual(h.results,[]);}else{assert.equal(h.find('submit').disabled,true);assert.equal(h.find('comment').disabled,true);assert.deepEqual(h.results,[{error:false,message:BERKAS_RATING_COPY.fallback,exceptional:true,accepted:false,delivery:'unknown'}]);}assert.equal(h.writes.length,1);}
});
test('a current auth error goes only to the guarded parent callback and cannot submit again',async t=>{
 const error=Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}),h=await ready(setup({write:async()=>{throw error;}}));t.after(h.dispose);await h.submit();assert.deepEqual(h.sessions,[error]);assert.deepEqual(h.results,[]);assert.equal(h.find('submit').disabled,true);await h.submit();assert.equal(h.writes.length,1);
});
test('navigation and disposal ignore late write success or auth errors without erasing a newer dialog',async t=>{
 for(const auth of [false,true]){const wait=deferred(),h=await ready(setup({write:()=>wait.promise}));t.after(h.dispose);const work=h.submit();await new Promise(resolve=>setImmediate(resolve));h.retire();h.root.innerHTML='<p data-new-detail>New owner</p>';h.dispose();if(auth)wait.reject(Object.assign(new Error('old401'),{code:'SESSION_EXPIRED'}));else wait.resolve({error:false,message:'old result'});await work;assert.ok(h.root.querySelector('[data-new-detail]'));assert.deepEqual(h.results,[]);assert.deepEqual(h.sessions,[]);assert.equal(h.host.controller.snapshot().comment,null);assert.deepEqual(h.host.controller.snapshot().entry,{numberYear:'',officeName:''});}
});
test('stale detached controls and forged out-of-range star values cannot send or change draft',async t=>{
 const h=await ready(setup());t.after(h.dispose);const old=h.slot(),star=old.querySelector('[data-berkas-rating-value="1"]'),listener=old.listeners.get('click')[0].fn,form=h.find('form'),submit=old.listeners.get('submit')[0].fn;h.host.mount();assert.equal((old.listeners.get('click')??[]).length,0);await listener({target:star,preventDefault(){assert.fail('No detached control action');}});await submit({target:form,preventDefault(){assert.fail('No detached form action');}});assert.equal(h.writes.length,0);
 const replacement=h.slot().querySelector('[data-berkas-rating-value="1"]');for(const value of ['6','2.5','01','0','1e0']){replacement.setAttribute('data-berkas-rating-value',value);await h.fire('click',replacement);}assert.equal(h.host.controller.snapshot().rating,3);assert.equal(h.writes.length,0);
});
test('same-owner mount preserves one pending write and aborts only old event bindings',async t=>{
 const wait=deferred(),h=await ready(setup({write:()=>wait.promise}));t.after(h.dispose);const old=h.slot(),work=h.submit();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.host.mount(),true);assert.notEqual(h.slot(),old);assert.equal((old.listeners.get('submit')??[]).length,0);assert.equal(h.find('pending').hidden,false);assert.equal(h.find('comment').value,' \u0085raw\n comment \u0085');await h.submit();assert.equal(h.writes.length,1);wait.resolve({error:false,message:''});await work;assert.equal(h.results.length,1);assert.equal(h.results[0].message,'');
});
test('callback consumption may dispose synchronously and never touch a newer root or replay',async t=>{
 let h;h=await ready(setup({onResult:()=>{h.dispose();h.root.innerHTML='<p data-final-feedback>Feedback</p>';}}));t.after(h.dispose);await h.submit();assert.ok(h.root.querySelector('[data-final-feedback]'));assert.equal(h.results.length,1);assert.equal(h.writes.length,1);assert.equal(await h.host.controller.submit(),false);assert.equal((h.root.listeners.get('cancel')??[]).length,1);
});
test('retired ownership blocks mount, direct host cancel and every existing event',async t=>{
 const h=await ready(setup());t.after(h.dispose);h.retire();assert.equal(h.host.mount(),false);assert.equal(h.host.cancel(),false);await h.cancel();await h.submit();await h.choose(1);await h.comment('changed');assert.equal(h.writes.length,0);assert.deepEqual(h.cancels,[]);assert.equal(h.host.controller.snapshot().comment,' \u0085raw\n comment \u0085');
});
