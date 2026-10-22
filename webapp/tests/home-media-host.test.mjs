import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeMediaHost} from '../assets/home-media/host.js';

// Offline DOM adapter. src writes are recorded, never navigated or fetched.
class Events{
 constructor(){this.events=new Map();}
 addEventListener(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);}
 removeEventListener(name,fn){this.events.get(name)?.delete(fn);}
 emit(name,event={}){event.target??=this;event.preventDefault??=()=>{event.prevented=true;};for(const fn of [...this.events.get(name)??[]])fn(event);return event;}
}
const esc=value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const decode=value=>value.replace(/&quot;|&#39;|&lt;|&gt;|&amp;/g,c=>({'&quot;':'"','&#39;':"'",'&lt;':'<','&gt;':'>','&amp;':'&'}[c]));
class Element extends Events{
 constructor(document,tag,text=null){super();Object.assign(this,{ownerDocument:document,tagName:tag.toUpperCase(),parentNode:null,children:[],attributes:new Map(),text,open:false,hidden:false,writes:0});}
 get isConnected(){return this.ownerDocument.body===this||!!this.parentNode?.isConnected;}
 get className(){return this.getAttribute('class')??'';}set className(v){this.setAttribute('class',v);}
 get id(){return this.getAttribute('id')??'';}set id(v){this.setAttribute('id',v);}
 get disabled(){return this.attributes.has('disabled');}set disabled(v){v?this.setAttribute('disabled',''):this.removeAttribute('disabled');}
 get src(){return this.getAttribute('src');}set src(v){this.setAttribute('src',v);if(this.tagName==='IFRAME')this.ownerDocument.frameSources.push(v);}
 setAttribute(k,v){this.attributes.set(k,String(v));}getAttribute(k){return this.attributes.get(k)??null;}removeAttribute(k){this.attributes.delete(k);}
 append(...nodes){for(const node of nodes)this.appendChild(node);}
 appendChild(node){node.remove();this.children.push(node);node.parentNode=this;return node;}
 insertBefore(node,before){if(!before)return this.appendChild(node);const index=this.children.indexOf(before);assert.notEqual(index,-1);node.remove();this.children.splice(index,0,node);node.parentNode=this;return node;}
 remove(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 matches(selector){if(this.text!==null)return false;const tag=selector.match(/^[a-zA-Z][\w-]*/)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;for(const m of selector.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)){if(m[1]&&this.id!==m[1]||m[2]&&!this.className.split(/\s+/).includes(m[2])||m[3]&&(!this.attributes.has(m[3])||m[4]!==undefined&&this.getAttribute(m[3])!==m[4]))return false;}return true;}
 closest(s){for(let node=this;node;node=node.parentNode)if(node.matches(s))return node;return null;}
 querySelectorAll(s){return this.children.flatMap(n=>[...(n.matches(s)?[n]:[]),...n.querySelectorAll(s)]);}querySelector(s){return this.querySelectorAll(s)[0]??null;}
 focus(){this.ownerDocument.activeElement=this;}
 showModal(){if(this.ownerDocument.failModal)throw Error('synthetic modal failure');this.open=true;this.ownerDocument.modalOpened?.();}
 close(){const open=this.open;this.open=false;if(open)this.emit('close');}
 get textContent(){return this.text===null?this.children.map(n=>n.textContent).join(''):decode(this.text);}
 set textContent(v){for(const n of this.children)n.parentNode=null;this.children=[];this.appendChild(new Element(this.ownerDocument,'#text',String(v)));}
 get outerHTML(){return this.text!==null?this.text:`<${this.tagName.toLowerCase()}${[...this.attributes].map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${this.innerHTML}</${this.tagName.toLowerCase()}>`;}
 get innerHTML(){return this.children.map(n=>n.outerHTML).join('');}
 set innerHTML(html){this.writes++;for(const n of this.children)n.parentNode=null;this.children=[];const stack=[this],voids=new Set(['IMG','BR','INPUT']);for(const token of String(html).match(/<[^>]*>|[^<]+/g)??[]){if(token.startsWith('</')){if(stack.length>1)stack.pop();}else if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const n=new Element(this.ownerDocument,tag);for(const m of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(m[1],decode(m[2]??''));stack.at(-1).appendChild(n);if(!voids.has(n.tagName))stack.push(n);}else stack.at(-1).appendChild(new Element(this.ownerDocument,'#text',token));}}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const banner=(rows=[{path:'/uploads/example.jpg',externalUrl:'https://www.atrbpn.go.id/info'}],error=false)=>({status:200,data:{error,data:rows}});
const youtube=(rows=[{videoId:'synthetic_A1',title:'Judul <video>',thumbnailUrl:'https://i.ytimg.com/vi/synthetic_A1/default.jpg'}])=>({status:200,data:{data:rows}});
function setup(options={}){
 const document=new Events();document.hidden=false;document.frameSources=[];document.defaultView=new Events();document.defaultView.location={origin:'https://synthetic.invalid',href:'https://synthetic.invalid/'};document.createElement=tag=>new Element(document,tag);document.body=document.createElement('body');document.activeElement=document.body;
 const reads=[];let current=true;
 const host=createHomeMediaHost({document,read:kind=>{const d=defer();reads.push({kind,...d});return d.promise;},isCurrent:()=>current,...options});
 const container=document.createElement('main');document.body.append(container);
 const mount=()=>{container.innerHTML=host.view();assert.equal(host.mount(container),true);return container.querySelector('[data-home-media]');};
 const root=()=>container.querySelector('[data-home-media]');const node=action=>root()?.querySelector(`[data-home-media-action="${action}"]`);
 const click=action=>{const n=node(action);assert.ok(n);return host.handle(action,n);};
 const ready=async()=>{mount();reads.find(r=>r.kind==='banner').resolve(banner());reads.find(r=>r.kind==='youtube').resolve(youtube());await tick();return f;};
 const f={host,document,container,reads,mount,root,node,click,ready,setCurrent:v=>current=v,frame:()=>document.body.querySelector('iframe'),dialog:()=>document.body.querySelector('dialog')};return f;
}

test('mount starts exactly two independent reads and remount/pending paints do not duplicate them',async()=>{
 const f=setup();f.mount();assert.deepEqual(f.reads.map(x=>x.kind),['banner','youtube']);f.host.paint();f.mount();assert.equal(f.reads.length,2);assert.equal(f.frame(),null);f.reads[0].resolve(banner());await tick();assert.match(f.root().textContent,/Memuat kanal video/);f.reads[1].resolve(youtube());await tick();assert.ok(f.node('play'));assert.equal(f.frame(),null);f.host.dispose();
});
test('one section completion/refresh preserves the other ready card node and active focus',async()=>{
 const f=await setup().ready(),card=f.node('play'),section=f.root().querySelector('[data-home-media-section="youtube"]'),writes=section.writes;card.focus();assert.equal(f.click('reload-banner'),true);assert.equal(f.node('play'),card);f.reads.at(-1).resolve(banner([]));await tick();assert.equal(f.node('play'),card);assert.equal(section.writes,writes);assert.equal(f.document.activeElement,card);f.host.paint();assert.equal(f.node('play'),card);f.host.dispose();
});
test('owned image failure hides broken image once, retains card/focus, and retired capture listeners cannot alter remount',async()=>{
 const f=await setup().ready(),root=f.root(),card=f.node('play'),thumbnail=root.querySelector('.home-youtube-thumbnail'),image=thumbnail.querySelector('img'),banner=root.querySelector('.home-banner-image'),bannerImage=banner.querySelector('img'),oldHandler=[...root.events.get('error')][0];card.focus();
 root.emit('error',{target:image});root.emit('error',{target:image});root.emit('error',{target:bannerImage});assert.equal(image.hidden,true);assert.equal(bannerImage.hidden,true);assert.equal(thumbnail.querySelectorAll('[data-home-media-image-fallback]').length,1);assert.match(thumbnail.textContent,/Pratinjau video belum dapat dimuat/);assert.match(banner.textContent,/Gambar belum dapat dimuat/);assert.equal(f.node('play'),card);assert.equal(f.document.activeElement,card);f.host.paint();assert.equal(f.node('play'),card);assert.equal(image.hidden,true);assert.equal(f.reads.length,2);
 f.mount();assert.equal(root.events.get('error').size,0);const fresh=f.root().querySelector('.home-youtube-thumbnail').querySelector('img');oldHandler({target:image});assert.equal(fresh.hidden,false);assert.equal(f.root().querySelector('[data-home-media-image-fallback]'),null);f.host.unmount();assert.equal(f.root().events.get('error').size,0);f.host.dispose();
});
test('user selects a current row into fixed controlled iframe only; title is plain text and no autoplay/grants',async()=>{
 const f=await setup().ready();assert.equal(f.document.frameSources.length,0);assert.equal(f.click('play'),true);const frame=f.frame();assert.ok(frame);assert.equal(frame.src,'https://www.youtube-nocookie.com/embed/synthetic_A1?autoplay=0&controls=1');assert.equal(frame.referrerPolicy,'strict-origin-when-cross-origin');assert.equal(frame.getAttribute('allow'),'encrypted-media; picture-in-picture; fullscreen');assert.ok(frame.attributes.has('allowfullscreen'));assert.equal(frame.title,'Judul <video>');assert.equal(f.dialog().querySelector('video'),null);assert.equal(f.dialog().querySelector('#home-media-player-title').textContent,'Judul <video>');assert.deepEqual(f.host.playerSnapshot(),{open:true,videoId:'synthetic_A1',title:'Judul <video>',index:0,generation:1});assert.equal(f.reads.length,2);f.host.dispose();
});
test('same-route full outlet replacement preserves iframe identity then restores focus to fresh current card',async()=>{
 const f=await setup().ready(),old=f.node('play');f.click('play');const frame=f.frame(),dialog=f.dialog();f.mount();assert.equal(f.frame(),frame);assert.equal(f.dialog(),dialog);assert.equal(f.reads.length,2);assert.equal(f.host.handle('play',old),false);assert.equal(f.host.closePlayer(),true);assert.equal(f.frame(),null);assert.equal(f.document.activeElement,f.node('play'));f.host.dispose();
});
test('a still-connected superseded outlet loses action ownership and never receives returned focus',async()=>{
 const f=await setup().ready(),old=f.node('play');f.click('play');const frame=f.frame(),next=f.document.createElement('main');f.document.body.append(next);next.innerHTML=f.host.view();assert.equal(f.host.mount(next),true);assert.equal(old.isConnected,true);assert.equal(f.frame(),frame);assert.equal(f.host.handle('play',old),false);f.host.closePlayer();assert.equal(f.document.activeElement,next.querySelector('[data-home-media-action="play"]'));f.host.dispose();
});
test('refresh immediately revokes open player and old detached/generation actions before a new result',async()=>{
 const f=await setup().ready(),old=f.node('play');f.click('play');assert.equal(f.click('reload-youtube'),true);assert.equal(f.frame(),null);assert.equal(f.host.handle('play',old),false);const detached=f.document.createElement('button');for(const [k,v]of old.attributes)detached.setAttribute(k,v);f.root().append(detached);assert.equal(f.host.handle('play',detached),false);f.reads.at(-1).resolve(youtube([{videoId:'new-id',title:'Current'}]));await tick();assert.equal(f.host.handle('play',old),false);assert.equal(f.click('play'),true);assert.match(f.frame().src,/embed\/new-id\?/);f.host.dispose();
});
test('invalid index/generation and provider URL supplied as video ID cannot launch a frame',async()=>{
 const f=await setup().ready(),card=f.node('play');for(const value of ['-1','1.0','1e0','00','9999999999999999999','9']){card.setAttribute('data-home-media-index',value);assert.equal(f.host.handle('play',card),false);}card.setAttribute('data-home-media-index','0');card.setAttribute('data-home-media-generation','0');assert.equal(f.host.handle('play',card),false);assert.equal(f.frame(),null);f.click('reload-youtube');f.reads.at(-1).resolve(youtube([{videoId:'https://external.invalid/watch',title:'No'}]));await tick();assert.equal(f.node('play').disabled,true);assert.equal(f.click('play'),false);assert.equal(f.document.frameSources.length,0);f.host.dispose();
});
test('Escape/cancel and explicit close unload the iframe immediately and restore current focus once',async()=>{
 const f=await setup().ready();f.click('play');const card=f.node('play'),frame=f.frame(),event=f.dialog().emit('cancel');assert.equal(event.prevented,true);assert.equal(frame.isConnected,false);assert.equal(frame.src,null);assert.equal(f.frame(),null);assert.equal(f.document.activeElement,card);assert.equal(f.host.closePlayer(),false);f.click('play');f.dialog().emit('keydown',{key:'Escape'});assert.equal(f.frame(),null);f.click('play');f.dialog().emit('click',{target:f.dialog().querySelector('[data-home-media-player-close]')});assert.equal(f.frame(),null);f.host.dispose();
});
test('unmount retains successful caches, removes player/listeners, and rejects retired DOM on reentry',async()=>{
 const f=await setup().ready(),oldRoot=f.root(),old=f.node('play');f.click('play');f.host.unmount();assert.equal(f.dialog(),null);assert.equal(oldRoot.events.get('click').size,0);assert.equal(f.host.handle('play',old),false);f.mount();assert.equal(f.reads.length,2);assert.equal(f.host.controller.snapshot().youtube.rows.length,1);assert.equal(f.click('play'),true);f.host.dispose();assert.equal(f.dialog(),null);assert.deepEqual(f.host.playerSnapshot(),{open:false});assert.equal(f.host.view(),'');
});
test('retired pending success/auth cannot resurrect UI or clear a new owner; empty/error reentry explicitly retries',async()=>{
 const auth=[];const f=setup({onAuthError:e=>auth.push(e)});f.mount();f.host.unmount();f.setCurrent(false);f.reads[0].reject(Object.assign(Error('old auth'),{code:'SESSION_EXPIRED'}));f.reads[1].resolve(youtube());await tick();assert.equal(auth.length,0);assert.equal(f.frame(),null);f.setCurrent(true);f.mount();assert.equal(f.reads.length,4);f.reads[2].resolve(banner([],true));f.reads[3].resolve(youtube([]));await tick();assert.match(f.root().textContent,/Belum ada informasi/);f.host.unmount();f.mount();assert.equal(f.reads.length,6);f.host.dispose();f.reads[4].resolve(banner());f.reads[5].resolve(youtube());await tick();assert.equal(f.dialog(),null);
});
test('error/retry and current auth propagation are scoped to the current read owner',async()=>{
 const auth=[];const f=setup({onAuthError:e=>auth.push(e)});f.mount();f.reads[0].reject(Error('read failure'));f.reads[1].resolve(youtube());await tick();assert.match(f.root().textContent,/read failure/);assert.ok(f.node('play'));assert.equal(f.click('reload-banner'),true);assert.equal(f.click('reload-banner'),false);f.reads.at(-1).reject(Object.assign(Error('expired'),{code:'SESSION_EXPIRED'}));await tick();assert.equal(auth.length,1);assert.equal(f.host.controller.snapshot().youtube.rows.length,1);f.host.dispose();
});
test('only explicitly injected same-origin player is accepted; unsafe/cross-origin resolvers cannot navigate',async()=>{
 for(const url of ['javascript:alert(1)','https://unexpected.invalid/embed/synthetic_A1','https://user:secret@synthetic.invalid/player','data:text/html,unsafe']){const f=await setup({resolvePlayerUrl:()=>url}).ready();assert.equal(f.click('play'),false);assert.equal(f.frame(),null);assert.equal(f.document.frameSources.length,0);assert.match(f.root().textContent,/Video belum dapat dibuka/);f.host.dispose();}
 const f=await setup({resolvePlayerUrl:id=>`/synthetic-player?id=${id}`}).ready();assert.equal(f.click('play'),true);assert.equal(f.frame().src,'https://synthetic.invalid/synthetic-player?id=synthetic_A1');f.host.dispose();
});
test('visibility, pagehide, expired current guard and disposal release frames without focus resurrection',async()=>{
 const f=await setup().ready();f.click('play');f.document.hidden=true;f.document.emit('visibilitychange');assert.equal(f.frame(),null);f.document.hidden=false;f.click('play');f.document.defaultView.emit('pagehide');assert.equal(f.frame(),null);f.click('play');f.setCurrent(false);f.host.paint();assert.equal(f.frame(),null);f.host.dispose();assert.equal(f.dialog(),null);assert.ok([...f.document.events.values()].every(set=>set.size===0));assert.ok([...f.document.defaultView.events.values()].every(set=>set.size===0));
});
test('modal failure or retirement during showModal never leaves a frame or a resumed owner',async()=>{
 const f=await setup().ready();f.document.failModal=true;assert.equal(f.click('play'),false);assert.equal(f.frame(),null);f.document.failModal=false;f.document.modalOpened=()=>f.host.dispose();assert.equal(f.click('play'),false);assert.equal(f.frame(),null);assert.equal(f.dialog(),null);assert.deepEqual(f.host.playerSnapshot(),{open:false});
});
test('retirement inside injected resolver cannot create a body dialog after disposal',async()=>{
 let f;f=await setup({resolvePlayerUrl:()=>{f.host.dispose();return '/synthetic-player';}}).ready();assert.equal(f.click('play'),false);assert.equal(f.dialog(),null);assert.equal(f.frame(),null);assert.equal(f.document.frameSources.length,0);
});
