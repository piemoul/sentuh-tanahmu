// Decorative local contact illustration. Contact links remain outside its lifecycle.
const managers=new WeakMap(),selector='[data-contact-animation]',asset='/assets/profile/contact-email.json',maxBytes=200000;
const fallback='Ilustrasi email belum dapat dimuat.';
function animationData(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!Number.isFinite(value.w)||value.w<=0||!Number.isFinite(value.h)||value.h<=0)throw Error('Invalid contact animation');
 if(value.assets!=null&&!Array.isArray(value.assets))throw Error('Invalid contact assets');
 for(const entry of value.assets??[]){if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Invalid contact asset');for(const key of ['p','u','url'])if(entry[key]!=null&&(typeof entry[key]!=='string'||entry[key]!==''))throw Error('External contact asset unavailable');}
 return value;
}
async function loadAnimationData(fetcher,signal){
 const response=await fetcher(asset,{credentials:'omit',redirect:'error',signal});
 if(response.status!==200||Number(response.headers?.get?.('content-length'))>maxBytes)throw Error('Contact animation unavailable');
 let bytes;
 if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Contact animation too large');}chunks.push(part.value);}}finally{reader.releaseLock();}bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}}
 else{bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength>maxBytes)throw Error('Contact animation too large');}
 return animationData(JSON.parse(new TextDecoder().decode(bytes)));
}
export function startProfileContactAnimations(root=document,options={}){
 if(!root||typeof root.querySelectorAll!=='function')throw new TypeError('Contact animation root required');
 if(managers.has(root))return managers.get(root);
 const doc=root.ownerDocument??root,view=doc.defaultView??globalThis.window,Observer=options.MutationObserver??view?.MutationObserver??globalThis.MutationObserver;
 const pageTarget=options.pageTarget??view,visibilityTarget=options.visibilityTarget??doc,media=options.mediaQuery??view?.matchMedia?.('(prefers-reduced-motion: reduce)');
 const fetcher=options.fetcher??globalThis.fetch,libraryLoader=options.libraryLoader??(()=>import('../vendor/lottie/lottie-light.min.js'));
 const abort=new AbortController(),animationLoader=options.animationLoader??(({signal})=>loadAnimationData(fetcher,signal));
 const records=new Map();let stopped=false,libraryPromise,dataPromise;
 const attached=owner=>owner.isConnected!==false&&(root===owner||root.contains(owner))&&owner.matches(selector);
 const current=record=>!stopped&&!record.failed&&records.get(record.owner)===record&&attached(record.owner);
 const status=(owner,text)=>{const node=owner.querySelector('[data-contact-animation-status]');if(node){if(node.textContent!==text)node.textContent=text;node.hidden=!text;}};
 function teardown(record){for(const [event,callback]of record.events??[])try{record.animation?.removeEventListener?.(event,callback);}catch{}record.events=[];try{record.animation?.destroy?.();}catch{}record.animation=null;record.canvas?.remove();record.canvas=null;}
 function release(record){if(records.get(record.owner)!==record)return;records.delete(record.owner);teardown(record);}
 function sync(record){if(!current(record)||!record.animation)return;const mode=media?.matches?'reduced':visibilityTarget.hidden||record.owner.closest?.('[hidden]')?'paused':'playing';if(record.mode===mode)return;record.mode=mode;try{if(mode==='reduced'&&record.animation.goToAndStop)record.animation.goToAndStop(0,true);else if(mode==='playing')record.animation.play?.();else record.animation.pause?.();}catch{fail(record);}}
 function fail(record){if(!current(record))return;teardown(record);record.failed=true;status(record.owner,fallback);}
 async function initialize(record){
  try{
   libraryPromise??=Promise.resolve().then(libraryLoader).catch(error=>{libraryPromise=undefined;throw error;});dataPromise??=Promise.resolve().then(()=>animationLoader({signal:abort.signal})).then(animationData).catch(error=>{dataPromise=undefined;throw error;});
   const [loaded,data]=await Promise.all([libraryPromise,dataPromise]);if(!current(record))return;
   const engine=loaded?.default??loaded;if(typeof engine?.loadAnimation!=='function')throw Error('Contact animation engine unavailable');
   const canvas=doc.createElement('div');canvas.className='contact-animation-canvas';canvas.setAttribute('aria-hidden','true');record.canvas=canvas;record.owner.appendChild(canvas);
   record.animation=engine.loadAnimation({container:canvas,renderer:'svg',loop:true,autoplay:!media?.matches&&!visibilityTarget.hidden&&!record.owner.closest?.('[hidden]'),animationData:JSON.parse(JSON.stringify(data)),rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
   if(!current(record)){teardown(record);return;}if(!record.animation||typeof record.animation.destroy!=='function')throw Error('Contact animation instance unavailable');
   const ready=()=>{if(current(record)){status(record.owner,'');record.mode=null;sync(record);}},failed=()=>fail(record);
   for(const [event,callback]of [['DOMLoaded',ready],['data_failed',failed],['error',failed]]){record.animation.addEventListener?.(event,callback);record.events.push([event,callback]);}
   sync(record);if(record.animation?.isLoaded||typeof record.animation?.addEventListener!=='function')ready();
  }catch{fail(record);}
 }
 function scan(){if(stopped)return;for(const record of [...records.values()])if(!attached(record.owner))release(record);const owners=[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];for(const owner of owners)if(attached(owner)&&!records.has(owner)){const record={owner,animation:null,canvas:null,events:[],mode:null};records.set(owner,record);status(owner,'Memuat ilustrasi email…');void initialize(record);}for(const record of records.values())sync(record);}
 const observer=Observer?new Observer(mutations=>{for(const mutation of mutations)for(const removed of mutation.removedNodes??[])for(const record of [...records.values()])if(removed===record.owner||removed.contains?.(record.owner))release(record);scan();}):null;
 function changed(){for(const record of records.values())sync(record);}
 function stop(){if(stopped)return;stopped=true;observer?.disconnect();abort.abort();pageTarget?.removeEventListener?.('pagehide',stop);visibilityTarget?.removeEventListener?.('visibilitychange',changed);if(media?.removeEventListener)media.removeEventListener('change',changed);else media?.removeListener?.(changed);for(const record of [...records.values()]){release(record);if(attached(record.owner))status(record.owner,'Ilustrasi email.');}managers.delete(root);}
 const manager={scan,stop};managers.set(root,manager);observer?.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-contact-animation','hidden']});pageTarget?.addEventListener?.('pagehide',stop);visibilityTarget?.addEventListener?.('visibilitychange',changed);if(media?.addEventListener)media.addEventListener('change',changed);else media?.addListener?.(changed);scan();return manager;
}
