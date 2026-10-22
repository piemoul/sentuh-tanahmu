// A local draft removal confirmation; it never deletes a device/server file.
export function createSwaplottingPhotoRemoval({document,isCurrent=()=>true,onRemove=()=>false,onClose=()=>{}}){
 let active=null,disposed=false;
 const current=owner=>!disposed&&active===owner&&isCurrent(owner.context)&&owner.dialog.isConnected!==false;
 function retire(owner){
  if(!owner||active!==owner)return false;active=null;owner.events.abort();
  try{if(owner.dialog.open)owner.dialog.close();}catch{}
  owner.dialog.remove();try{onClose(owner.context);}catch{}return true;
 }
 function close(){return retire(active);}
 function open(context){
  close();if(disposed||!context||!isCurrent(context))return false;
  const dialog=document.createElement('dialog'),owner={dialog,context:Object.freeze({...context}),events:new AbortController()};active=owner;
  dialog.className='swaplotting-photo-removal';dialog.setAttribute('aria-labelledby','swaplotting-photo-removal-title');
  dialog.innerHTML='<h2 id="swaplotting-photo-removal-title">Hapus Foto</h2><p>Apakah Anda yakin ingin menghapus foto ini?</p><div class="swaplotting-capture-actions"><button type="button" class="button secondary" data-photo-removal="cancel">Batal</button><button type="button" class="button" data-photo-removal="remove">Hapus</button></div>';
  const options={signal:owner.events.signal};
  dialog.addEventListener('cancel',event=>{event.preventDefault();retire(owner);},options);
  dialog.addEventListener('close',()=>retire(owner),options);
  dialog.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-photo-removal]');if(!button||!dialog.contains(button)||button.disabled)return;
   if(button.dataset.photoRemoval==='cancel'){retire(owner);return;}
   if(button.dataset.photoRemoval!=='remove')return;
   if(current(owner))try{onRemove(owner.context);}catch{}
   retire(owner);
  },options);
  document.body.append(dialog);
  try{dialog.showModal();dialog.querySelector('[data-photo-removal="cancel"]')?.focus();return true;}
  catch{retire(owner);return false;}
 }
 const pagehide=()=>close(),visibility=()=>{if(document.hidden)close();};
 document.defaultView?.addEventListener?.('pagehide',pagehide);document.addEventListener?.('visibilitychange',visibility);
 return {open,close,dispose(){if(disposed)return;close();disposed=true;document.defaultView?.removeEventListener?.('pagehide',pagehide);document.removeEventListener?.('visibilitychange',visibility);}};
}
