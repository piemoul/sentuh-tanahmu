// Local browser camera adaptation. No file import, network, GPS or upload.
export const SWAPLOTTING_CAPTURE_COPY=Object.freeze({title:'Ambil Foto Sertipikat',instruction:'Pastikan Sertipikat masuk kedalam kotak dibawah ini',permissionTitle:'Gagal akses kamera',permission:'Sentuh Tanahku membutuhkan akses kamera untuk upload dokumen.',retake:'Foto Ulang',use:'Pakai Foto Ini',cancel:'Batal'});
const MAX_PIXELS=32_000_000;
const frameError=()=>({code:'CAMERA_FRAME_UNAVAILABLE',message:'Frame kamera belum tersedia. Coba buka kamera kembali.'});
function errorMessage(error){
 if(['NotAllowedError','SecurityError'].includes(error?.name))return {code:'CAMERA_PERMISSION',message:SWAPLOTTING_CAPTURE_COPY.permission};
 if(error?.name==='NotFoundError')return {code:'CAMERA_NOT_FOUND',message:'Kamera tidak ditemukan pada perangkat ini.'};
 if(error?.name==='NotReadableError')return {code:'CAMERA_UNAVAILABLE',message:'Kamera belum dapat digunakan. Tutup aplikasi kamera lain lalu coba lagi.'};
 return {code:'CAMERA_UNAVAILABLE',message:'Kamera belum dapat dibuka. Coba lagi.'};
}
export function createSwaplottingCamera({document,mediaDevices=document?.defaultView?.navigator?.mediaDevices,isCurrent=()=>true,onChange=()=>{}}={}){
 if(!document?.createElement)throw new TypeError('SWAPLOTTING_CAMERA_DOCUMENT');
 let active=null,disposed=false,state={stage:'idle',message:'',errorCode:null};
 const current=owner=>!disposed&&active===owner&&isCurrent(owner.context)&&document.hidden!==true&&owner.video.isConnected!==false;
 const tracks=owner=>{try{return owner.stream?.getTracks?.()??[];}catch{return[];}};
 const live=owner=>owner.stream&&owner.stream.active!==false&&tracks(owner).some(track=>track.kind==='video'&&track.readyState!=='ended');
 function frame(owner){
  const video=owner.video,w=video.videoWidth,h=video.videoHeight;
  return owner.played&&video.srcObject===owner.stream&&live(owner)&&video.readyState>=2&&Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w<=16384&&h<=16384&&w*h<=MAX_PIXELS?{width:w,height:h}:null;
 }
 const snapshot=()=>({...state,canCapture:!!(active&&current(active)&&state.stage==='ready'&&frame(active)),dimensions:active&&current(active)&&state.stage==='ready'?frame(active):null});
 const publish=(stage,message='',errorCode=null)=>{state={stage,message,errorCode};onChange(snapshot());};
 function clearCanvas(owner){if(owner.canvas){owner.canvas.width=owner.canvas.height=0;owner.canvas=null;}}
 function release(owner){
  if(!owner)return;owner.stopping=true;
  for(const {target,event,handler}of owner.listeners)target.removeEventListener?.(event,handler);owner.listeners=[];
  const stream=owner.stream;
  for(const track of tracks(owner))try{track.stop();}catch{}
  if(stream&&owner.video.srcObject===stream)try{owner.video.pause?.();owner.video.srcObject=null;}catch{}
  owner.stream=null;owner.played=false;
 }
 function retire(owner){
  if(!owner)return;if(active===owner)active=null;
  release(owner);owner.finish?.(null);owner.finish=null;clearCanvas(owner);
 }
 function stop(){const owner=active;retire(owner);if(!disposed)publish('idle');}
 const listen=(owner,target,event,handler)=>{target.addEventListener?.(event,handler);owner.listeners.push({target,event,handler});};
 function failed(owner,error){if(!current(owner)){retire(owner);return false;}retire(owner);publish('error',error.message,error.code);return false;}
 async function start(context,video){
  if(disposed||!video||video.isConnected===false||document.hidden===true||!isCurrent(context))return false;
  stop();const owner={context,video,stream:null,played:false,stopping:false,listeners:[],finish:null,canvas:null};active=owner;
  if(typeof mediaDevices?.getUserMedia!=='function')return failed(owner,{code:'CAMERA_UNSUPPORTED',message:'Kamera memerlukan browser yang mendukung akses kamera melalui HTTPS atau localhost.'});
  publish('starting','Membuka kamera…');
  try{
   if(!current(owner)){retire(owner);return false;}
   owner.stream=await mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
   if(!current(owner)){retire(owner);return false;}
   if(!live(owner)||tracks(owner).some(track=>track.kind==='audio'))return failed(owner,{code:'CAMERA_UNAVAILABLE',message:'Stream kamera belum dapat digunakan.'});
   const ready=()=>{if(!current(owner)||!owner.played)return;if(frame(owner))publish('ready','Kamera siap. Periksa bingkai sebelum mengambil foto.');else publish('starting','Menunggu frame kamera…');};
   for(const event of ['loadeddata','loadedmetadata','canplay','playing','resize'])listen(owner,video,event,ready);
   for(const track of tracks(owner))listen(owner,track,'ended',()=>{if(current(owner)&&!owner.stopping)failed(owner,{code:'CAMERA_ENDED',message:'Kamera berhenti. Buka kembali untuk melanjutkan.'});});
   video.muted=true;video.playsInline=true;video.autoplay=true;video.srcObject=owner.stream;
   if(typeof video.play!=='function')throw new Error('Unsupported video');
   await video.play();if(!current(owner)){retire(owner);return false;}owner.played=true;ready();return true;
  }catch(error){return failed(owner,errorMessage(error));}
 }
 function capture(){
  const owner=active;if(!owner||!current(owner)||state.stage!=='ready'||owner.finish)return Promise.resolve(null);
  const size=frame(owner);if(!size){failed(owner,frameError());return Promise.resolve(null);}
  let canvas;
  try{
   canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;owner.canvas=canvas;
   const context=canvas.getContext('2d');if(!context||typeof canvas.toBlob!=='function')throw new Error('Canvas unavailable');
   context.drawImage(owner.video,0,0,size.width,size.height);
  }catch{failed(owner,{code:'CAMERA_CAPTURE_FAILED',message:'Frame kamera belum dapat diambil. Coba lagi.'});return Promise.resolve(null);}
  publish('capturing','Menyiapkan preview foto…');
  if(!current(owner)){retire(owner);return Promise.resolve(null);}
  // A browser canvas JPEG request, without resizing, crop or an invented native
  // JPEG quality/preset. The returned Blob MIME is checked, not assumed.
  const result=new Promise(resolve=>{
   let finished=false;owner.finish=value=>{if(finished)return;finished=true;owner.finish=null;resolve(value);};
   release(owner);
   try{canvas.toBlob(blob=>{
    if(finished)return;
    if(!current(owner)){retire(owner);return;}
    const BlobClass=document.defaultView?.Blob??globalThis.Blob;
    if(typeof BlobClass!=='function'||!(blob instanceof BlobClass)||blob.size<=0||!['image/jpeg','image/png','image/webp'].includes(blob.type)){
     const finish=owner.finish;owner.finish=null;clearCanvas(owner);failed(owner,{code:'CAMERA_CAPTURE_FAILED',message:'Foto belum dapat diproses. Buka kamera kembali lalu coba lagi.'});finish?.(null);return;
    }
    const finish=owner.finish;owner.finish=null;clearCanvas(owner);publish('captured','Preview foto siap.');finish?.({blob,...size,context:owner.context});
   },'image/jpeg');}catch{
    const finish=owner.finish;owner.finish=null;clearCanvas(owner);failed(owner,{code:'CAMERA_CAPTURE_FAILED',message:'Foto belum dapat diproses. Buka kamera kembali lalu coba lagi.'});finish?.(null);
   }
  });
  return result;
 }
 const pagehide=()=>stop(),visibility=()=>{if(document.hidden)stop();};
 document.defaultView?.addEventListener?.('pagehide',pagehide);document.addEventListener?.('visibilitychange',visibility);
 function dispose(){if(disposed)return;stop();disposed=true;document.defaultView?.removeEventListener?.('pagehide',pagehide);document.removeEventListener?.('visibilitychange',visibility);}
 return {start,capture,stop,snapshot,dispose};
}
