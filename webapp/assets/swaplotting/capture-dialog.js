import {createSwaplottingCamera,SWAPLOTTING_CAPTURE_COPY as COPY} from './camera.js';
// One local capture owner. A synchronous exact true from onUse transfers its
// object URL to the host, including when that callback changes form generation.
export function createSwaplottingPhotoCapture({document,isCurrent=()=>true,onUse=()=>false,onClose=()=>{},mediaDevices=document?.defaultView?.navigator?.mediaDevices}={}){
 if(!document?.createElement||!document.body)throw new TypeError('SWAPLOTTING_CAPTURE_DOCUMENT');
 let active=null,disposed=false;
 const urls=document.defaultView?.URL??globalThis.URL,released=new WeakSet();
 const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const dialog=make('dialog','swaplotting-capture-dialog');dialog.hidden=true;dialog.setAttribute('data-swaplotting-capture','');dialog.setAttribute('aria-labelledby','swaplotting-capture-title');dialog.setAttribute('aria-describedby','swaplotting-capture-instruction');
 const title=make('h2','',COPY.title);title.id='swaplotting-capture-title';
 const instruction=make('p','swaplotting-capture-instruction',COPY.instruction);instruction.id='swaplotting-capture-instruction';
 const frame=make('div','swaplotting-capture-frame'),video=make('video','swaplotting-capture-video'),image=make('img','swaplotting-capture-preview');
 video.setAttribute('data-swaplotting-capture-video','');video.setAttribute('aria-label','Preview kamera dokumen');video.muted=true;video.playsInline=true;image.alt='Preview foto dokumen lokal';image.hidden=true;frame.append(video,image);
 const status=make('p','swaplotting-capture-status');status.setAttribute('role','status');status.setAttribute('data-swaplotting-capture-status','');
 const errorTitle=make('h3','swaplotting-capture-error-title',COPY.permissionTitle);errorTitle.hidden=true;
 const note=make('p','privacy-note','Foto hanya menjadi draf lokal browser. Encoding dan ukuran mengikuti frame/browser; tidak membuktikan identitas dokumen, lokasi, kunjungan atau kesegaran terverifikasi.');
 const actions=make('div','swaplotting-capture-actions');
 const button=(name,text,secondary=false)=>{const node=make('button',secondary?'button secondary':'button',text);node.type='button';node.setAttribute('data-swaplotting-capture-action',name);actions.append(node);return node;};
 const shutter=button('take','Ambil Foto'),retake=button('retake',COPY.retake,true),use=button('use',COPY.use),retry=button('retry','Coba lagi',true),cancel=button('cancel',COPY.cancel,true);
 dialog.append(title,instruction,errorTitle,frame,status,note,actions);document.body.append(dialog);
 const current=owner=>!disposed&&active===owner&&!owner.closed&&dialog.open&&dialog.isConnected!==false&&document.hidden!==true&&isCurrent(owner.context);
 function release(photo){if(!photo||released.has(photo))return;released.add(photo);try{urls.revokeObjectURL(photo.url);}catch{}}
 function erasePreview(owner){image.removeAttribute('src');image.hidden=true;release(owner.preview);owner.preview=null;}
 const camera=createSwaplottingCamera({document,mediaDevices,isCurrent:context=>active?.context===context&&current(active),onChange:()=>paint()});
 function paint(){
  const owner=active;if(!owner||owner.closed)return;
  const model=camera.snapshot(),preview=!!owner.preview;
  video.hidden=preview;image.hidden=!preview;shutter.hidden=preview;shutter.disabled=!current(owner)||!model.canCapture||owner.taking;
  retake.hidden=use.hidden=!preview;retake.disabled=use.disabled=!current(owner)||owner.using;
  retry.hidden=(model.stage!=='error'&&!owner.previewError)||preview;retry.disabled=!current(owner);errorTitle.hidden=model.stage!=='error'&&!owner.previewError;
  status.textContent=owner.message||(preview?'Periksa foto sebelum memilih Pakai Foto Ini.':model.message);
 }
 function finish(owner){
  if(!owner||owner.closed)return;owner.closed=true;if(active===owner)active=null;
  camera.stop();erasePreview(owner);owner.message='';
  try{if(dialog.open)dialog.close();}catch{}dialog.hidden=true;
  if(!owner.notified){owner.notified=true;try{onClose(owner.context);}catch{}}
  if(!active&&!disposed&&owner.returnFocus?.isConnected!==false)try{owner.returnFocus?.focus?.();}catch{}
 }
 function close(){if(active)finish(active);}
 function open(value={}){
  const kind=value?.kind,oldPath=value?.oldPath??null;
  if(disposed||active||!['registered','unregistered'].includes(kind)||(oldPath!==null&&typeof oldPath!=='string')||document.hidden===true||typeof dialog.showModal!=='function')return false;
  const context=Object.freeze({kind,oldPath});if(!isCurrent(context))return false;
  const owner={context,preview:null,previewError:false,taking:false,using:false,closed:false,notified:false,message:'',returnFocus:document.activeElement};active=owner;dialog.hidden=false;
  try{dialog.showModal();}catch{finish(owner);return false;}
  paint();cancel.focus?.();void camera.start(context,video);return true;
 }
 async function take(){
  const owner=active;if(!owner||!current(owner)||owner.taking||owner.preview||!camera.snapshot().canCapture)return false;owner.taking=true;owner.message='';paint();
  const photo=await camera.capture();if(!current(owner)){if(active===owner)finish(owner);return false;}
  owner.taking=false;if(!photo){paint();return false;}
  let url;
  try{url=urls.createObjectURL(photo.blob);if(typeof url!=='string'||!url.startsWith('blob:'))throw new Error('Invalid local URL');}
  catch{if(typeof url==='string')try{urls.revokeObjectURL(url);}catch{}owner.previewError=true;owner.message='Preview foto belum dapat dibuka. Coba lagi.';paint();return false;}
  const preview=Object.freeze({url,blob:photo.blob});
  if(!current(owner)){release(preview);if(active===owner)finish(owner);return false;}
  owner.preview=preview;image.src=url;paint();use.focus?.();return true;
 }
 function again(){const owner=active;if(!owner||!current(owner)||owner.using)return false;erasePreview(owner);owner.message='';owner.previewError=false;owner.taking=false;void camera.start(owner.context,video);paint();return true;}
 function accept(){
  const owner=active;if(!owner||!current(owner)||!owner.preview||owner.using)return false;owner.using=true;
  // Provisional detachment protects a true transfer against synchronous host
  // rerender/close/dispose inside onUse. False or thrown results still release.
  const photo=owner.preview;owner.preview=null;let accepted=false;
  try{accepted=onUse(photo,owner.context)===true;}catch{}
  if(!accepted)release(photo);if(active===owner)finish(owner);return accepted;
 }
 const click=event=>{const target=event.target.closest?.('[data-swaplotting-capture-action]');if(!target||!dialog.contains(target)||target.disabled)return;const action=target.getAttribute('data-swaplotting-capture-action');if(action==='take')void take();else if(action==='retake'||action==='retry')again();else if(action==='use')accept();else if(action==='cancel')close();};
 const cancelled=event=>{event.preventDefault();close();},closed=()=>{if(!dialog.open)close();},pagehide=()=>close(),visibility=()=>{if(document.hidden)close();};
 dialog.addEventListener('click',click);dialog.addEventListener('cancel',cancelled);dialog.addEventListener('close',closed);document.defaultView?.addEventListener?.('pagehide',pagehide);document.addEventListener?.('visibilitychange',visibility);
 function dispose(){if(disposed)return;disposed=true;close();camera.dispose();dialog.removeEventListener('click',click);dialog.removeEventListener('cancel',cancelled);dialog.removeEventListener('close',closed);document.defaultView?.removeEventListener?.('pagehide',pagehide);document.removeEventListener?.('visibilitychange',visibility);dialog.remove();}
 return {open,close,dispose,snapshot:()=>({open:!!active,stage:active?.preview?'preview':camera.snapshot().stage,hasPreview:!!active?.preview,context:active?{...active.context}:null})};
}
