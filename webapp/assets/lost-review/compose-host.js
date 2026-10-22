import {createLostReviewComposer} from './compose-controller.js';
import {lostReviewComposeView} from './compose-view.js';
export function createLostReviewComposeHost({document,contentId,reviewType='pengumumanSertipikatHilang',write,isCurrent=()=>true,isAuthenticated=()=>false,onAccepted=()=>{},onSessionError=()=>{},onClosed=()=>{}}={}){
  const dialog=document.createElement('dialog');dialog.className='lost-review-compose';dialog.setAttribute('aria-labelledby','lost-review-compose-title');
  let alive=true;
  const current=()=>alive&&isCurrent();
  function paint(model){
    if(!current())return;
    const active=document.activeElement,textarea=active?.id==='lost-review-comment'&&dialog.contains(active),selection=textarea?{start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection}:null;
    dialog.innerHTML=lostReviewComposeView(model);
    if(selection){const next=dialog.querySelector('#lost-review-comment');if(next){next.focus({preventScroll:true});next.setSelectionRange(selection.start,selection.end,selection.direction);}}
  }
  const controller=createLostReviewComposer({contentId,reviewType,write,isCurrent:current,isAuthenticated,changed:paint,onSessionError,onAccepted:()=>{if(!current())return;dispose();onAccepted();}});
  function dispose(){if(!alive)return;alive=false;controller.dispose();if(dialog.open)dialog.close();dialog.remove();onClosed();}
  dialog.addEventListener('close',dispose);
  dialog.addEventListener('cancel',event=>{if(controller.snapshot().pending){event.preventDefault();return;}dispose();});
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled||!dialog.contains(button)||!current())return;
    if(button.hasAttribute('data-review-close'))dispose();
    else if(button.hasAttribute('data-review-rate'))controller.setRating(Number(button.dataset.reviewRate));
    else if(button.hasAttribute('data-review-add'))dialog.querySelector('[data-review-file]')?.click();
    else if(button.hasAttribute('data-review-remove'))controller.removePhoto(Number(button.dataset.reviewRemove));
  });
  dialog.addEventListener('input',event=>{if(event.target.id==='lost-review-comment'&&current())controller.setComment(event.target.value);});
  dialog.addEventListener('change',event=>{if(!event.target.matches('[data-review-file]')||!current())return;const file=event.target.files?.[0];if(file)controller.addPhoto(file);else event.target.value='';});
  dialog.addEventListener('submit',event=>{if(!event.target.matches('[data-review-compose-form]'))return;event.preventDefault();void controller.submit();});
  return {open(){if(!current()||isAuthenticated()!==true)return false;paint(controller.snapshot());document.body.append(dialog);dialog.showModal();return true;},dispose};
}
