// Local QR decoding only. This module never sends a code or camera frame.
const libraries=new WeakMap();
const LIBRARY='/assets/vendor/zxing/zxing-browser.min.js';

export function loadScanQrLibrary(document){
  if(typeof document?.defaultView?.ZXingBrowser?.BrowserQRCodeReader==='function')return Promise.resolve(document.defaultView.ZXingBrowser);
  if(libraries.has(document))return libraries.get(document);
  const promise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let finished=false;
    const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);script.onload=script.onerror=null;
      const library=document.defaultView?.ZXingBrowser;
      if(ok&&typeof library?.BrowserQRCodeReader==='function')resolve(library);
      else{script.remove();reject(new Error('Pembaca QR belum dapat dimuat. Coba lagi.'));}};
    const timer=setTimeout(()=>finish(false),20_000);timer.unref?.();
    script.src=LIBRARY;script.async=true;script.referrerPolicy='no-referrer';
    script.onload=()=>finish(true);script.onerror=()=>finish(false);document.head.append(script);
  });
  libraries.set(document,promise);void promise.catch(()=>{if(libraries.get(document)===promise)libraries.delete(document);});return promise;
}

function cameraMessage(error){
  if(['NotAllowedError','SecurityError'].includes(error?.name))return 'Izin kamera belum diberikan. Izinkan kamera atau tempel kode secara manual.';
  if(error?.name==='NotFoundError')return 'Kamera tidak ditemukan. Tempel kode secara manual.';
  if(error?.name==='NotReadableError')return 'Kamera sedang tidak dapat digunakan. Tutup aplikasi kamera lain atau tempel kode secara manual.';
  return 'Kamera belum dapat dibuka. Coba lagi atau tempel kode secara manual.';
}

export function createScanCamera({document=globalThis.document,mediaDevices=document?.defaultView?.navigator?.mediaDevices,loadLibrary=()=>loadScanQrLibrary(document),isCurrent=()=>true,onChange=()=>{},onCode=()=>{}}={}){
  let active=null,destroyed=false,state={stage:'idle',message:''};
  const publish=(stage,message='')=>{state={stage,message};onChange({...state});};
  const current=owner=>!destroyed&&active===owner&&isCurrent(owner.context)&&owner.video?.isConnected!==false;
  function cleanup(owner){
    if(!owner)return;
    try{owner.controls?.stop();}catch{}
    for(const track of owner.stream?.getTracks?.()??[])try{track.stop();}catch{}
    for(const video of [owner.decoderVideo,owner.video])try{if(video?.srcObject===owner.stream){video.pause?.();video.srcObject=null;}}catch{}
  }
  function retire(owner){
    cleanup(owner);if(active===owner){active=null;if(!destroyed)publish('idle');}
  }
  function stop(reason='stopped'){
    const owner=active;active=null;cleanup(owner);if(!destroyed)publish(reason==='detected'?'detected':'idle',reason==='detected'?'Kode terbaca. Periksa kode, lalu buka hasil.':'');
  }
  async function start(context,video){
    if(destroyed||!video||!isCurrent(context))return false;
    stop();const owner={context,video,decoderVideo:null,stream:null,controls:null,delivered:false};active=owner;
    if(typeof mediaDevices?.getUserMedia!=='function'){active=null;publish('error','Kamera memerlukan browser yang mendukung akses kamera melalui HTTPS atau localhost. Tempel kode secara manual.');return false;}
    publish('starting','Membuka kamera…');
    try{
      const library=await loadLibrary();if(!current(owner)){retire(owner);return false;}
      owner.stream=await mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      if(!current(owner)){retire(owner);return false;}
      video.muted=true;video.playsInline=true;video.autoplay=true;video.srcObject=owner.stream;
      if(typeof video.play==='function')await video.play();
      if(!current(owner)){retire(owner);return false;}
      // ZXing controls.stop() clears its decoding video's source unconditionally.
      // A private element per attempt prevents late old controls/callbacks from
      // clearing a newer stream attached to the shared visible preview.
      owner.decoderVideo=document.createElement('video');owner.decoderVideo.muted=true;owner.decoderVideo.playsInline=true;
      const reader=new library.BrowserQRCodeReader(undefined,{delayBetweenScanAttempts:200,delayBetweenScanSuccess:500});
      owner.controls=await reader.decodeFromStream(owner.stream,owner.decoderVideo,(result,error,controls)=>{
        if(!current(owner)||owner.delivered){owner.controls=controls??owner.controls;retire(owner);return;}
        if(!result){
          // These three errors are normal unsuccessful frame decodes. ZXing
          // terminates its scan for other errors; expose a retryable local state
          // instead of leaving an ended stream marked as actively scanning.
          if(error&&!['NotFoundException','ChecksumException','FormatException'].includes(error.constructor?.kind)){
            owner.controls=controls??owner.controls;active=null;cleanup(owner);publish('error',cameraMessage(error));
          }
          return;
        }
        let raw;try{raw=result.getText();}catch{return;}if(typeof raw!=='string')return;
        owner.delivered=true;owner.controls=controls??owner.controls;stop('detected');onCode(raw,context);
      });
      if(!current(owner)){retire(owner);return false;}
      publish('scanning','Arahkan kamera ke kode QR dokumen.');return true;
    }catch(error){
      if(!current(owner)){retire(owner);return false;}
      active=null;cleanup(owner);publish('error',cameraMessage(error));return false;
    }
  }
  const pagehide=()=>stop(),visibility=()=>{if(document?.hidden)stop();};
  document?.defaultView?.addEventListener?.('pagehide',pagehide);
  document?.addEventListener?.('visibilitychange',visibility);
  return{start,stop,snapshot:()=>({...state}),destroy(){if(destroyed)return;stop();destroyed=true;document?.defaultView?.removeEventListener?.('pagehide',pagehide);document?.removeEventListener?.('visibilitychange',visibility);}};
}
