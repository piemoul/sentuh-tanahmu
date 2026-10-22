import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplottingCamera,SWAPLOTTING_CAPTURE_COPY} from '../assets/swaplotting/camera.js';
import {createSwaplottingPhotoCapture} from '../assets/swaplotting/capture-dialog.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
class Events{
 constructor(){this.events=new Map();}
 addEventListener(name,handler){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(handler);}
 removeEventListener(name,handler){this.events.get(name)?.delete(handler);}
 emit(name,event={}){event.target??=this;event.preventDefault??=()=>{event.prevented=true;};for(const handler of [...this.events.get(name)??[]])handler(event);return event;}
 listenerCount(){return [...this.events.values()].reduce((n,set)=>n+set.size,0);}
}
class Element extends Events{
 constructor(tag,doc){super();Object.assign(this,{tagName:tag.toUpperCase(),ownerDocument:doc,children:[],parentElement:null,attributes:{},hidden:false,disabled:false,open:false,_text:'',focusCalls:0});}
 get isConnected(){return this.ownerDocument.body===this||!!this.parentElement?.isConnected;}
 append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node);}}
 remove(){if(this.parentElement){const at=this.parentElement.children.indexOf(this);this.parentElement.children.splice(at,1);this.parentElement=null;}}
 set textContent(value){this._text=String(value);for(const node of this.children)node.parentElement=null;this.children=[];}
 get textContent(){return this._text+this.children.map(node=>node.textContent).join('');}
 setAttribute(name,value){this.attributes[name]=String(value);}getAttribute(name){return this.attributes[name]??null;}removeAttribute(name){delete this.attributes[name];if(name==='src')delete this.src;}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 matches(selector){const m=/^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);return m?Object.hasOwn(this.attributes,m[1])&&(m[2]===undefined||this.attributes[m[1]]===m[2]):selector.startsWith('.')?this.className?.split(' ').includes(selector.slice(1)):this.tagName===selector.toUpperCase();}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
 querySelectorAll(selector){return this.children.flatMap(node=>[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]);}querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 focus(){this.focusCalls++;this.ownerDocument.activeElement=this;}
 showModal(){if(this.failModal)throw Error('fixture modal');this.open=true;}
 close(){this.open=false;this.emit('close');}
}
function stream(){const track=new Events();Object.assign(track,{kind:'video',readyState:'live',stops:0,stop(){this.stops++;this.readyState='ended';}});return {track,get active(){return track.readyState==='live';},getTracks:()=>[track],getVideoTracks:()=>[track]};}
function documentFixture(){
 const doc=new Events();Object.assign(doc,{hidden:false,requests:[],streams:[],videos:[],canvases:[],encoders:[],draws:[],created:[],revoked:[],urlBlobs:new Map(),autoEncode:true});let urlId=0;
 const win=new Events();win.Blob=Blob;win.URL={createObjectURL(blob){if(doc.failURL)throw Error('private URL error');const url=doc.badURL?'https://external.invalid/never-load':`blob:swaplotting-test/${++urlId}`;doc.created.push({url,blob});doc.urlBlobs.set(url,blob);return url;},revokeObjectURL(url){doc.revoked.push(url);doc.urlBlobs.delete(url);}};
 win.navigator={mediaDevices:{async getUserMedia(constraints){doc.requests.push(constraints);if(doc.permission)return doc.permission(constraints);const value=stream();doc.streams.push(value);return value;}}};doc.defaultView=win;
 doc.createElement=tag=>{const node=new Element(tag,doc);
  if(tag==='video'){Object.assign(node,{videoWidth:640,videoHeight:480,readyState:2,srcObject:null,pauseCalls:0,async play(){if(doc.play)return doc.play(node);},pause(){this.pauseCalls++;}});doc.videos.push(node);}
  if(tag==='canvas'){node.getContext=()=>doc.noContext?null:{drawImage(...args){if(doc.failDraw)throw Error('private canvas');doc.draws.push({canvas:node,args,width:node.width,height:node.height});}};node.toBlob=(callback,mime)=>{if(doc.failEncode)throw Error('private encoder');const job={callback,mime,canvas:node};doc.encoders.push(job);if(doc.autoEncode)queueMicrotask(()=>callback(doc.encodeBlob??new Blob(['synthetic-frame'],{type:'image/jpeg'})));};doc.canvases.push(node);}
  return node;};
 doc.body=doc.createElement('body');doc.activeElement=doc.body;return doc;
}
function engine(options={}){const doc=options.document??documentFixture(),video=doc.createElement('video');doc.body.append(video);const changes=[];const camera=createSwaplottingCamera({document:doc,onChange:s=>changes.push(s),...options});return{doc,video,camera,changes};}
function dialogFixture(options={}){const doc=options.document??documentFixture(),launch=doc.createElement('button');doc.body.append(launch);launch.focus();const uses=[],closes=[];const capture=createSwaplottingPhotoCapture({document:doc,onUse:(photo,context)=>{uses.push({photo,context});return false;},onClose:context=>closes.push(context),...options});const dialog=doc.body.querySelector('dialog');const action=name=>dialog.querySelector(`[data-swaplotting-capture-action="${name}"]`);const click=name=>{const button=action(name);assert.ok(button);if(!button.disabled&&!button.hidden)dialog.emit('click',{target:button});};return{doc,launch,capture,dialog,action,click,uses,closes};}
async function preview(f,context={kind:'registered',oldPath:null}){assert.equal(f.capture.open(context),true);await tick();f.click('take');await tick();assert.equal(f.capture.snapshot().stage,'preview');}

test('engine and dialog construction are local and inert until explicit user open/shutter',()=>{
 const f=dialogFixture();assert.equal(f.doc.requests.length,0);assert.equal(f.doc.draws.length,0);assert.equal(f.capture.snapshot().open,false);assert.equal(f.dialog.open,false);assert.equal(f.dialog.hidden,true);assert.equal(f.doc.body.querySelector('input'),null);assert.equal(f.capture.open({kind:'registered',oldPath:null}),true);assert.equal(f.doc.requests.length,1);assert.equal(f.doc.draws.length,0);f.capture.dispose();
});
test('camera requests no audio, prefers environment and preserves live video through readiness',async()=>{
 const f=engine();assert.equal(await f.camera.start({},f.video),true);assert.deepEqual(f.doc.requests,[{audio:false,video:{facingMode:{ideal:'environment'}}}]);assert.equal(f.video.srcObject,f.doc.streams[0]);assert.equal(f.camera.snapshot().stage,'ready');assert.equal(f.camera.snapshot().canCapture,true);assert.deepEqual(f.camera.snapshot().dimensions,{width:640,height:480});assert.equal(f.doc.draws.length,0);f.camera.dispose();
});
test('capture encodes an actual current video frame at its dimensions then immediately stops camera tracks',async()=>{
 const f=engine();await f.camera.start({kind:'registered'},f.video);const result=await f.camera.capture();assert.ok(result.blob instanceof Blob);assert.equal(result.blob.type,'image/jpeg');assert.deepEqual([result.width,result.height],[640,480]);assert.equal(f.doc.draws.length,1);assert.deepEqual(f.doc.draws[0].args,[f.video,0,0,640,480]);assert.equal(f.doc.encoders[0].mime,'image/jpeg');assert.equal(f.doc.streams[0].track.stops,1);assert.equal(f.video.srcObject,null);assert.equal(f.doc.canvases[0].width,0);assert.equal(f.camera.snapshot().stage,'captured');f.camera.dispose();
});
test('metadata is awaited without replacing video and a later usable frame enables shutter',async()=>{
 const f=engine();f.video.videoWidth=0;f.video.videoHeight=0;f.video.readyState=1;await f.camera.start({},f.video);assert.equal(f.camera.snapshot().stage,'starting');assert.equal(await f.camera.capture(),null);f.video.videoWidth=800;f.video.videoHeight=600;f.video.readyState=2;f.video.emit('loadeddata');assert.equal(f.camera.snapshot().canCapture,true);assert.equal(f.doc.videos[0],f.video);assert.equal((await f.camera.capture()).width,800);f.camera.dispose();
});
test('capture rechecks current source, ready state, dimensions and bounded canvas size',async()=>{
 for(const mutate of [video=>video.srcObject={},video=>video.readyState=1,video=>video.videoWidth=0,video=>video.videoHeight=0,video=>video.videoWidth=1.5,video=>{video.videoWidth=16384;video.videoHeight=16384;}]){const f=engine();await f.camera.start({},f.video);mutate(f.video);assert.equal(await f.camera.capture(),null);assert.equal(f.doc.draws.length,0);assert.equal(f.doc.encoders.length,0);f.camera.dispose();}
});
test('duplicate capture is blocked while an encoder callback is pending',async()=>{
 const f=engine();f.doc.autoEncode=false;await f.camera.start({},f.video);const first=f.camera.capture();assert.equal(await f.camera.capture(),null);assert.equal(f.doc.draws.length,1);f.doc.encoders[0].callback(new Blob(['frame'],{type:'image/png'}));assert.equal((await first).blob.type,'image/png');f.camera.dispose();
});
test('late permission cannot attach a stream or publish over a newer camera owner',async()=>{
 const waiting=deferred(),f=engine();let count=0;f.doc.permission=()=>++count===1?waiting.promise:Promise.resolve(stream());const old=f.camera.start({id:'old'},f.video);f.camera.stop();await f.camera.start({id:'new'},f.video);const current=f.video.srcObject,changes=f.changes.length,late=stream();waiting.resolve(late);assert.equal(await old,false);assert.equal(late.track.stops,1);assert.equal(current.track.stops,0);assert.equal(f.video.srcObject,current);assert.equal(f.changes.length,changes);f.camera.dispose();
});
test('late play completion cannot clear a newer stream on the shared video',async()=>{
 const pending=deferred(),f=engine();let calls=0;f.doc.play=()=>++calls===1?pending.promise:Promise.resolve();const old=f.camera.start({},f.video);await tick();const oldStream=f.video.srcObject;f.camera.stop();await f.camera.start({},f.video);const current=f.video.srcObject;pending.resolve();assert.equal(await old,false);assert.equal(f.video.srcObject,current);assert.equal(current.track.stops,0);assert.equal(oldStream.track.stops,1);f.camera.dispose();
});
test('stopping resolves a pending frame and retires its late encoder callback',async()=>{
 const f=engine();f.doc.autoEncode=false;await f.camera.start({},f.video);const old=f.camera.capture(),callback=f.doc.encoders[0].callback;f.camera.stop();assert.equal(await old,null);await f.camera.start({},f.video);const current=f.video.srcObject,changes=f.changes.length;callback(new Blob(['late'],{type:'image/jpeg'}));assert.equal(f.camera.snapshot().stage,'ready');assert.equal(f.changes.length,changes);assert.equal(f.video.srcObject,current);f.camera.dispose();
});
test('stale metadata callbacks cannot alter a restarted capture owner',async()=>{
 const f=engine();await f.camera.start({},f.video);const old=[...f.video.events.get('loadeddata')][0];f.camera.stop();await f.camera.start({},f.video);const count=f.changes.length;old();assert.equal(f.changes.length,count);assert.equal(f.camera.snapshot().stage,'ready');f.camera.dispose();
});
test('permission denial and missing capability use fixed local errors without private platform text',async()=>{
 const f=engine({mediaDevices:{async getUserMedia(){throw Object.assign(Error('private-camera-device-id'),{name:'NotAllowedError'});}}});assert.equal(await f.camera.start({},f.video),false);assert.equal(f.camera.snapshot().errorCode,'CAMERA_PERMISSION');assert.equal(f.camera.snapshot().message,SWAPLOTTING_CAPTURE_COPY.permission);assert.doesNotMatch(f.camera.snapshot().message,/private/);f.camera.dispose();const absent=engine({mediaDevices:null});assert.equal(await absent.camera.start({},absent.video),false);assert.match(absent.camera.snapshot().message,/HTTPS atau localhost/);absent.camera.dispose();
});
test('ended tracks and play rejection release streams and expose only retryable local failure',async()=>{
 const f=engine();await f.camera.start({},f.video);const value=f.doc.streams[0];value.track.emit('ended');assert.equal(f.camera.snapshot().stage,'error');assert.equal(value.track.stops,1);assert.equal(f.video.srcObject,null);f.camera.dispose();const rejected=engine();rejected.doc.play=async()=>{throw Error('private autoplay');};assert.equal(await rejected.camera.start({},rejected.video),false);assert.equal(rejected.doc.streams[0].track.stops,1);assert.doesNotMatch(rejected.camera.snapshot().message,/private/);rejected.camera.dispose();
});
test('draw/encoder failures and invalid Blobs never produce a capture result',async()=>{
 for(const setup of [doc=>doc.failDraw=true,doc=>doc.noContext=true,doc=>doc.failEncode=true,doc=>doc.encodeBlob=null,doc=>doc.encodeBlob=new Blob([],{type:'image/jpeg'}),doc=>doc.encodeBlob=new Blob(['x'],{type:'image/svg+xml'})]){const f=engine();await f.camera.start({},f.video);setup(f.doc);if(f.doc.encodeBlob===null){f.doc.autoEncode=false;const promise=f.camera.capture();f.doc.encoders[0].callback(null);assert.equal(await promise,null);}else assert.equal(await f.camera.capture(),null);assert.equal(f.doc.streams[0].track.stops,1);assert.equal(f.camera.snapshot().stage,'error');f.camera.dispose();}
});
test('hidden/pagehide and disposal stop tracks, retire pending owners and remove lifecycle listeners',async()=>{
 const f=engine();await f.camera.start({},f.video);f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.video.srcObject,null);assert.equal(f.camera.snapshot().stage,'idle');f.doc.hidden=false;await f.camera.start({},f.video);f.doc.defaultView.emit('pagehide');assert.equal(f.video.srcObject,null);f.camera.dispose();f.camera.dispose();assert.equal(f.doc.listenerCount(),0);assert.equal(f.doc.defaultView.listenerCount(),0);assert.equal(await f.camera.start({},f.video),false);
});
test('native dialog title/instruction and local actions are present without a gallery/file importer',async()=>{
 const f=dialogFixture();await preview(f,{kind:'unregistered',oldPath:' raw old path '});assert.match(f.dialog.textContent,/Ambil Foto Sertipikat/);assert.match(f.dialog.textContent,/Pastikan Sertipikat masuk kedalam kotak dibawah ini/);assert.match(f.dialog.textContent,/Foto Ulang/);assert.match(f.dialog.textContent,/Pakai Foto Ini/);assert.equal(f.doc.body.querySelector('input'),null);assert.equal(f.capture.snapshot().context.oldPath,' raw old path ');assert.doesNotMatch(f.dialog.textContent,/raw old path/);assert.equal(f.doc.requests.length,1);f.capture.dispose();
});
test('exact true transfers URL ownership to host and does not get revoked by close/dispose',async()=>{
 let delivered;const f=dialogFixture({onUse:(photo,context)=>{delivered={photo,context};return true;}});await preview(f,{kind:'registered',oldPath:''});const url=f.doc.created[0].url;f.click('use');assert.deepEqual(delivered.context,{kind:'registered',oldPath:''});assert.equal(delivered.photo.url,url);assert.ok(delivered.photo.blob instanceof Blob);assert.equal(f.capture.snapshot().open,false);assert.equal(f.closes.length,1);assert.deepEqual(f.doc.revoked,[]);f.capture.close();f.capture.dispose();assert.deepEqual(f.doc.revoked,[]);assert.equal(f.doc.urlBlobs.has(url),true);f.doc.defaultView.URL.revokeObjectURL(url);
});
test('false or thrown use rejects ownership, releases once and closes the actual attempt once',async()=>{
 for(const throws of [false,true]){const f=dialogFixture({onUse:()=>{if(throws)throw Error('private host error');return false;}});await preview(f);f.click('use');assert.equal(f.doc.revoked.length,1);assert.equal(f.doc.urlBlobs.size,0);assert.equal(f.closes.length,1);f.capture.close();f.capture.dispose();assert.equal(f.closes.length,1);assert.equal(f.doc.revoked.length,1);}
});
test('true transfer survives host generation change and reentrant close or dispose inside callback',async()=>{
 for(const action of ['close','dispose']){let active=true,f;f=dialogFixture({isCurrent:()=>active,onUse:()=>{active=false;f.capture[action]();return true;}});await preview(f);const url=f.doc.created[0].url;f.click('use');assert.equal(f.doc.urlBlobs.has(url),true);assert.deepEqual(f.doc.revoked,[]);assert.equal(f.closes.length,1);f.capture.dispose();assert.deepEqual(f.doc.revoked,[]);f.doc.defaultView.URL.revokeObjectURL(url);}
});
test('retake releases the old preview and reopens video without replacing its stable node',async()=>{
 const f=dialogFixture();await preview(f);const video=f.doc.videos[0],first=f.doc.created[0].url;f.click('retake');await tick();assert.equal(f.doc.videos.length,1);assert.equal(f.doc.videos[0],video);assert.equal(f.doc.requests.length,2);assert.deepEqual(f.doc.revoked,[first]);assert.equal(f.capture.snapshot().hasPreview,false);assert.equal(video.hidden,false);assert.equal(f.action('take').disabled,false);assert.equal(f.doc.draws.length,1);f.capture.dispose();
});
test('Esc/cancel closes native dialog, releases preview, returns focus and never notifies on no-op close',async()=>{
 const f=dialogFixture();f.capture.close();assert.equal(f.closes.length,0);await preview(f);const event=f.dialog.emit('cancel');assert.equal(event.prevented,true);assert.equal(f.capture.snapshot().open,false);assert.equal(f.dialog.open,false);assert.equal(f.doc.revoked.length,1);assert.equal(f.doc.activeElement,f.launch);assert.equal(f.closes.length,1);f.capture.close();f.capture.dispose();assert.equal(f.closes.length,1);
});
test('late old permission after close cannot notify or overwrite the newer dialog owner',async()=>{
 const wait=deferred(),doc=documentFixture();let calls=0;doc.permission=()=>++calls===1?wait.promise:Promise.resolve(stream());const f=dialogFixture({document:doc});f.capture.open({kind:'registered',oldPath:'old'});f.capture.close();assert.equal(f.closes.length,1);f.capture.open({kind:'unregistered',oldPath:'new'});await tick();const current=f.doc.videos[0].srcObject,late=stream();wait.resolve(late);await tick();assert.equal(late.track.stops,1);assert.equal(f.doc.videos[0].srcObject,current);assert.equal(f.closes.length,1);assert.equal(f.capture.snapshot().context.kind,'unregistered');f.capture.dispose();
});
test('late old encoder callback cannot create a URL or close a new capture',async()=>{
 const f=dialogFixture();f.doc.autoEncode=false;f.capture.open({kind:'registered',oldPath:null});await tick();f.click('take');const old=f.doc.encoders[0].callback;f.capture.close();f.capture.open({kind:'unregistered',oldPath:null});await tick();const current=f.doc.videos[0].srcObject;old(new Blob(['late'],{type:'image/jpeg'}));await tick();assert.equal(f.doc.created.length,0);assert.equal(f.closes.length,1);assert.equal(f.capture.snapshot().open,true);assert.equal(f.doc.videos[0].srcObject,current);f.capture.dispose();
});
test('queued close event from old native dialog is ignored after a new modal opens',async()=>{
 const f=dialogFixture();f.capture.open({kind:'registered',oldPath:null});await tick();f.capture.close();f.capture.open({kind:'unregistered',oldPath:null});await tick();f.dialog.emit('close');assert.equal(f.capture.snapshot().open,true);assert.equal(f.closes.length,1);f.dialog.close();assert.equal(f.capture.snapshot().open,false);assert.equal(f.closes.length,2);f.capture.dispose();
});
test('hidden and pagehide release both stream/preview and each active attempt exactly once',async()=>{
 const f=dialogFixture();f.capture.open({kind:'registered',oldPath:null});await tick();f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.closes.length,1);assert.equal(f.doc.streams[0].track.stops,1);f.doc.hidden=false;await preview(f);f.doc.defaultView.emit('pagehide');assert.equal(f.closes.length,2);assert.equal(f.doc.urlBlobs.size,0);f.capture.dispose();assert.equal(f.doc.listenerCount(),0);assert.equal(f.doc.defaultView.listenerCount(),0);assert.equal(f.dialog.listenerCount(),0);
});
test('invalid contexts, unsupported modal and duplicate opens never start another camera',async()=>{
 const f=dialogFixture();for(const ctx of [{},{kind:'other'},{kind:'registered',oldPath:3}])assert.equal(f.capture.open(ctx),false);f.dialog.showModal=null;assert.equal(f.capture.open({kind:'registered'}),false);assert.equal(f.doc.requests.length,0);f.dialog.showModal=Element.prototype.showModal;assert.equal(f.capture.open({kind:'registered'}),true);assert.equal(f.capture.open({kind:'unregistered'}),false);assert.equal(f.doc.requests.length,1);f.capture.dispose();assert.equal(f.capture.open({kind:'registered'}),false);
});
test('URL creation failure remains local, offers explicit retry and never navigates to an external preview',async()=>{
 for(const bad of ['failURL','badURL']){const f=dialogFixture();f.doc[bad]=true;f.capture.open({kind:'registered'});await tick();f.click('take');await tick();assert.equal(f.capture.snapshot().hasPreview,false);assert.equal(f.action('retry').hidden,false);assert.equal(f.dialog.querySelector('img').src,undefined);f.doc[bad]=false;f.click('retry');await tick();assert.equal(f.doc.requests.length,2);assert.equal(f.action('take').disabled,false);f.capture.dispose();}
});
test('stale host context before use releases its local preview without invoking host acceptance',async()=>{
 let active=true,calls=0;const f=dialogFixture({isCurrent:()=>active,onUse:()=>{calls++;return true;}});await preview(f);active=false;f.click('use');assert.equal(calls,0);f.capture.close();assert.equal(f.doc.urlBlobs.size,0);f.capture.dispose();
});
test('old close cannot steal focus from a synchronously reopened owner and dispose cannot reopen',async()=>{
 let f,closes=0,reopened;f=dialogFixture({onClose:()=>{closes++;reopened=f.capture.open({kind:'unregistered',oldPath:null});}});await preview(f);f.capture.close();await tick();assert.equal(reopened,true);assert.equal(closes,1);assert.equal(f.capture.snapshot().context.kind,'unregistered');assert.equal(f.doc.activeElement,f.action('cancel'));assert.equal(f.doc.streams[1].track.stops,0);const requestCount=f.doc.requests.length;f.capture.dispose();assert.equal(reopened,false);assert.equal(closes,2);assert.equal(f.doc.requests.length,requestCount);assert.equal(f.doc.streams[1].track.stops,1);assert.equal(f.capture.snapshot().open,false);
});
