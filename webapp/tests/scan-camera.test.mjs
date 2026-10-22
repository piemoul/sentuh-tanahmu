import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanCamera} from '../scan-camera.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function fixture(options={}){
  const callbacks={},changes=[],codes=[],requests=[],tracks=[{stops:0,stop(){this.stops++;}}],stream={getTracks:()=>tracks},video={isConnected:true,srcObject:null,pause(){}},controls={stops:0,stop(){this.stops++;}};
  let decode;
  const document={hidden:false,createElement:tag=>{assert.equal(tag,'video');return{srcObject:null,pause(){}};},defaultView:{addEventListener:(event,fn)=>callbacks[event]=fn,removeEventListener:event=>delete callbacks[event]},addEventListener:(event,fn)=>callbacks[event]=fn,removeEventListener:event=>delete callbacks[event]};
  class Reader{async decodeFromStream(value,target,callback){assert.equal(value,stream);assert.notEqual(target,video);assert.equal(video.srcObject,stream);target.srcObject=stream;decode=callback;return controls;}}
  const camera=createScanCamera({document,mediaDevices:{getUserMedia:async value=>{requests.push(value);return stream;}},loadLibrary:async()=>({BrowserQRCodeReader:Reader}),onChange:value=>changes.push(value),onCode:raw=>codes.push(raw),...options});
  return{camera,document,callbacks,changes,codes,requests,stream,tracks,video,controls,decode:(...args)=>decode(...args)};
}
test('Camera asks only for environment-facing video and forwards first exact raw QR once after cleanup',async()=>{
  const f=fixture();await f.camera.start({},f.video);assert.equal(f.camera.snapshot().stage,'scanning');assert.deepEqual(f.requests,[{audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}}]);
  const raw='  q:%2F /😀\n';f.decode({getText:()=>raw},null,f.controls);f.decode({getText:()=>'second'},null,f.controls);
  assert.deepEqual(f.codes,[raw]);assert.ok(f.tracks.every(track=>track.stops>0));assert.equal(f.video.srcObject,null);assert.equal(f.camera.snapshot().stage,'detected');f.camera.destroy();
});
test('Late permission result after cancellation releases tracks without decoding or emitting a code',async()=>{
  const permission=deferred(),f=fixture({mediaDevices:{getUserMedia:()=>permission.promise}});const pending=f.camera.start({},f.video);await Promise.resolve();await Promise.resolve();f.camera.stop();permission.resolve(f.stream);assert.equal(await pending,false);assert.ok(f.tracks[0].stops>0);assert.deepEqual(f.codes,[]);assert.equal(f.camera.snapshot().stage,'idle');f.camera.destroy();
});
test('Stale route/session during library loading never opens camera',async()=>{
  const library=deferred();let current=true,calls=0;const f=fixture({isCurrent:()=>current,loadLibrary:()=>library.promise,mediaDevices:{getUserMedia:async()=>{calls++;throw Error('must not run');}}});const pending=f.camera.start({},f.video);current=false;library.resolve({});assert.equal(await pending,false);assert.equal(calls,0);f.camera.destroy();
});
test('Permission denial produces a recoverable message without raw platform error disclosure',async()=>{
  const f=fixture({mediaDevices:{getUserMedia:async()=>{throw Object.assign(Error('private device detail'),{name:'NotAllowedError'});}}});assert.equal(await f.camera.start({},f.video),false);assert.match(f.camera.snapshot().message,/Izin kamera/);assert.doesNotMatch(f.camera.snapshot().message,/private/);f.camera.destroy();
});
test('Hiding page and pagehide release active tracks; destruction removes lifecycle listeners',async()=>{
  const f=fixture();await f.camera.start({},f.video);f.document.hidden=true;f.callbacks.visibilitychange();assert.ok(f.tracks[0].stops>0);assert.equal(f.video.srcObject,null);f.document.hidden=false;await f.camera.start({},f.video);f.callbacks.pagehide();assert.equal(f.video.srcObject,null);f.camera.destroy();assert.deepEqual(f.callbacks,{});assert.equal(await f.camera.start({},f.video),false);
});
test('Missing mediaDevices stays local and leaves manual-code entry available',async()=>{
  const f=fixture({mediaDevices:null});assert.equal(await f.camera.start({},f.video),false);assert.match(f.camera.snapshot().message,/HTTPS atau localhost/);assert.deepEqual(f.requests,[]);f.camera.destroy();
});
test('Unexpected decoder initialization failure releases the stream',async()=>{
  const f=fixture({loadLibrary:async()=>({BrowserQRCodeReader:class{async decodeFromStream(){throw Error('decoder detail');}}})});assert.equal(await f.camera.start({},f.video),false);assert.ok(f.tracks[0].stops>0);assert.equal(f.camera.snapshot().stage,'error');f.camera.destroy();
});

test('Disconnected preview while permission is pending releases stream and returns to idle',async()=>{
 const permission=deferred(),f=fixture({mediaDevices:{getUserMedia:()=>permission.promise}}),pending=f.camera.start({},f.video);await Promise.resolve();await Promise.resolve();f.video.isConnected=false;permission.resolve(f.stream);
 assert.equal(await pending,false);assert.ok(f.tracks[0].stops>0);assert.equal(f.camera.snapshot().stage,'idle');assert.equal(f.video.srcObject,null);f.camera.destroy();
});

for(const late of ['controls','callback'])test(`Late old decoder ${late} cleanup cannot clear a restarted preview or stop its owned stream`,async()=>{
 const started=deferred(),release=deferred(),targets=[],callbacks=[],streams=[1,2].map(id=>({id,stops:0,getTracks(){return[{stop:()=>this.stops++}];}}));let requests=0;
 const f=fixture({mediaDevices:{getUserMedia:async()=>streams[requests++]},loadLibrary:async()=>({BrowserQRCodeReader:class{
  async decodeFromStream(stream,target,callback){targets.push(target);callbacks.push(callback);target.srcObject=stream;const controls={stop(){stream.getTracks().forEach(track=>track.stop());target.srcObject=null;}};
   if(stream.id===1){started.resolve();await release.promise;}return controls;}
 }})});
 const old=f.camera.start({},f.video);await started.promise;
 if(late==='callback'){release.resolve();await old;}
 f.camera.stop();assert.ok(streams[0].stops>0);assert.equal(await f.camera.start({},f.video),true);
 assert.equal(f.video.srcObject,streams[1]);assert.notEqual(targets[0],targets[1]);assert.notEqual(targets[0],f.video);
 if(late==='controls'){release.resolve();assert.equal(await old,false);}else callbacks[0]({getText:()=>'stale raw'},null,{stop(){targets[0].srcObject=null;streams[0].getTracks().forEach(track=>track.stop());}});
 assert.equal(f.video.srcObject,streams[1]);assert.equal(streams[1].stops,0);assert.equal(f.camera.snapshot().stage,'scanning');assert.deepEqual(f.codes,[]);
 f.camera.stop();assert.ok(streams[1].stops>0);assert.equal(f.video.srcObject,null);assert.equal(targets[1].srcObject,null);f.camera.destroy();
});

test('Visible preview play rejection releases the acquired stream and remains retryable',async()=>{
 const f=fixture();f.video.play=async()=>{throw Object.assign(Error('private autoplay detail'),{name:'NotAllowedError'});};assert.equal(await f.camera.start({},f.video),false);assert.ok(f.tracks[0].stops>0);assert.equal(f.video.srcObject,null);assert.equal(f.camera.snapshot().stage,'error');assert.doesNotMatch(f.camera.snapshot().message,/private autoplay/);f.camera.destroy();
});

for(const kind of ['NotFoundException','ChecksumException','FormatException'])test(`Expected ZXing ${kind} frame failures keep scanning without releasing preview`,async()=>{
 const f=fixture();await f.camera.start({},f.video);class FrameError extends Error{static kind=kind;}f.decode(undefined,new FrameError('private frame details'),f.controls);
 assert.equal(f.camera.snapshot().stage,'scanning');assert.equal(f.video.srcObject,f.stream);assert.equal(f.tracks[0].stops,0);assert.deepEqual(f.codes,[]);f.camera.destroy();
});

test('Fatal decoder callback releases both video sources and makes retry available without leaking diagnostics',async()=>{
 let target;const f=fixture({loadLibrary:async()=>({BrowserQRCodeReader:class{async decodeFromStream(stream,video,callback){target=video;video.srcObject=stream;const controls={stop(){stream.getTracks().forEach(track=>track.stop());video.srcObject=null;}};callback(undefined,Error('private fatal decoder details'),controls);return controls;}}})});
 assert.equal(await f.camera.start({},f.video),false);assert.ok(f.tracks[0].stops>0);assert.equal(target.srcObject,null);assert.equal(f.video.srcObject,null);assert.equal(f.camera.snapshot().stage,'error');assert.doesNotMatch(f.camera.snapshot().message,/private fatal/);assert.deepEqual(f.codes,[]);f.camera.destroy();
});
