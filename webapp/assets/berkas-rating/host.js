import {createBerkasRating} from './controller.js';
import {berkasRatingView} from './view.js';
// A single composer replaces the parent-owned #modal contents. The parent
// opens/restores/pops that dialog and owns delayed native result navigation.
export function createBerkasRatingHost({document,root,entry,write,writeAvailable=()=>true,isCurrent=()=>true,onCancel=()=>{},onResult=()=>{},onSessionError=()=>{}}={}){
 if(!document||!root||typeof root.querySelector!=='function')throw new TypeError('BERKAS_RATING_ROOT_REQUIRED');
 let alive=true,slot=null,events=null;
 const current=()=>alive&&isCurrent();
 const mounted=()=>current()&&slot&&slot.isConnected!==false&&root.isConnected!==false&&root.querySelector('[data-berkas-rating]')===slot;
 const controller=createBerkasRating({entry,write,isCurrent:current,writeAvailable:()=>current()&&writeAvailable(),changed:()=>paint(),onResult,onSessionError});
 const owned=target=>mounted()&&target?.isConnected!==false&&slot.contains(target);
 function paint(){
  if(!mounted())return false;
  const model=controller.snapshot(),blocked=model.pending||model.locked||model.stage!=='editing';
  for(const star of slot.querySelectorAll('[data-berkas-rating-value]')){const value=Number(star.dataset.berkasRatingValue);star.disabled=blocked;star.setAttribute('aria-pressed',String(model.rating===value));star.setAttribute('data-filled',String(value<=model.rating));}
  const textarea=slot.querySelector('[data-berkas-rating-comment]');
  // Input nodes and their caret/IME state survive star changes and busy/error
  // paints. The controller retains the exact raw draft until native trim.
  if(textarea){textarea.disabled=blocked;const value=model.comment??'';if(textarea.value!==value)textarea.value=value;}
  const label=slot.querySelector('[data-berkas-rating-value-label]');if(label)label.textContent=model.rating?`${model.rating} dari 5 bintang`:'Belum memilih rating';
  const error=slot.querySelector('[data-berkas-rating-error]');if(error){error.textContent=model.error;error.hidden=!model.error;}
  const pending=slot.querySelector('[data-berkas-rating-pending]');if(pending)pending.hidden=!model.pending;
  const cancel=slot.querySelector('[data-berkas-rating-cancel]');if(cancel)cancel.disabled=!model.canCancel;
  const send=slot.querySelector('[data-berkas-rating-submit]');if(send)send.disabled=!model.canSubmit;
  return true;
 }
 function cancel(){if(!mounted()||!controller.cancel())return false;try{onCancel();}catch{}return true;}
 async function click(event){
  const target=event.target,star=target?.closest?.('[data-berkas-rating-value]'),cancelButton=target?.closest?.('[data-berkas-rating-cancel]');
  if(!owned(star??cancelButton))return;
  event.preventDefault();event.stopPropagation?.();
  const button=star??cancelButton;if(button.disabled)return;
  if(cancelButton){cancel();return;}
  if(!/^[1-5]$/.test(star.dataset.berkasRatingValue??''))return;
  controller.choose(Number(star.dataset.berkasRatingValue));
 }
 function input(event){const target=event.target;if(!owned(target)||!target.matches?.('[data-berkas-rating-comment]')||target.disabled)return;event.stopPropagation?.();controller.comment(target.value);}
 async function submit(event){if(!owned(event.target)||!event.target.matches?.('[data-berkas-rating-form]'))return;event.preventDefault();event.stopPropagation?.();await controller.submit();}
 function escape(event){if(!mounted())return;event.preventDefault();event.stopImmediatePropagation?.();if(!controller.snapshot().pending)cancel();}
 function mount(){
  if(!current()||root.isConnected===false)return false;
  events?.abort();events=new AbortController();root.innerHTML=berkasRatingView(controller.snapshot());slot=root.querySelector('[data-berkas-rating]');if(!slot)return false;
  const options={signal:events.signal};slot.addEventListener('click',click,options);slot.addEventListener('input',input,options);slot.addEventListener('submit',submit,options);root.addEventListener('cancel',escape,{...options,capture:true});
  return true;
 }
 function dispose(){if(!alive)return;alive=false;events?.abort();events=null;controller.dispose();if(slot&&root.querySelector('[data-berkas-rating]')===slot)slot.remove();slot=null;}
 return {mount,paint,cancel,dispose,controller};
}
