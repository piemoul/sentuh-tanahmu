import {createBerkasQuestion}from'./controller.js';
import {berkasQuestionView,questionConversationView,questionNoticeView}from'./view.js';
let nextTitle=0;
export function createBerkasQuestionHost({root,numberYear='',read,write,isCurrent,onSessionError=()=>{}}={}){
 if(!root?.ownerDocument||typeof read!=='function'||typeof write!=='function'||typeof isCurrent!=='function')throw new TypeError('BERKAS_QUESTION_HOST');
 const document=root.ownerDocument,titleId='berkas-question-title-'+(++nextTitle),abort=new AbortController();
 let alive=true,parent=null,child=null,controller=null,childAbort=null,opener=null,label=null,scrollTop=0,pageScroll=null,scrollTimer=null,lastHistory=-1;
 const valid=()=>{try{return alive&&root?.isConnected===true&&isCurrent()===true;}catch{return false;}};
 const owns=()=>parent?.parentNode===root&&child?.parentNode===root;
 const active=()=>valid()&&owns();
 function restoreLabel(){if(root?.getAttribute('aria-labelledby')===titleId){if(label===null)root.removeAttribute('aria-labelledby');else root.setAttribute('aria-labelledby',label);}}
 function stop(){if(scrollTimer!==null)clearTimeout(scrollTimer);scrollTimer=null;childAbort?.abort();childAbort=null;controller?.dispose();controller=null;}
 function dispose(){if(!alive)return;alive=false;abort.abort();stop();restoreLabel();if(parent?.parentNode===root)parent.remove();if(child?.parentNode===root)child.remove();parent?.replaceChildren();child?.replaceChildren();parent=null;child=null;opener=null;pageScroll=null;root=null;}
 function scroll(){if(scrollTimer!==null)clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrollTimer=null;if(active()){const history=child.querySelector('[data-bq-history]');history?.scrollTo?.({top:history.scrollHeight,behavior:'smooth'});}},300);}
 function paint(state){
  if(!active())return;
  const history=child.querySelector('[data-bq-history]');if(lastHistory!==state.historyRevision){history.innerHTML=questionConversationView(state);lastHistory=state.historyRevision;scroll();}
  child.querySelector('[data-bq-notices]').innerHTML=questionNoticeView(state);
  const textarea=child.querySelector('[data-bq-message]');if(textarea.value!==state.draft)textarea.value=state.draft;textarea.disabled=state.locked;
  const send=child.querySelector('[data-bq-send]');send.disabled=state.sendBusy||state.locked;send.setAttribute('aria-label',state.sendBusy?'Mengirim pesan':'Kirim pesan');send.innerHTML=state.sendBusy?'<span class="bq-spinner" aria-hidden="true"></span>':'<span aria-hidden="true">➤</span>';
  const reload=child.querySelector('[data-bq-reload]');if(reload)reload.disabled=state.readBusy||state.sendBusy||state.locked;
 }
 function back(){if(!active()){dispose();return false;}const nodes=Array.from(parent.childNodes),focus=opener,returning=pageScroll;stop();child.replaceChildren();child.remove();for(const node of nodes)root.appendChild(node);parent.remove();restoreLabel();parent=null;child=null;opener=null;pageScroll=null;root.scrollTop=scrollTop;if(focus?.isConnected&&root.contains(focus)&&!focus.disabled&&!focus.closest('[hidden],[inert]'))focus.focus({preventScroll:true});if(returning)returning.view.scrollTo(returning.x,returning.y);return true;}
 function open(requestedOpener=document.activeElement){
  if(!valid())return false;if(parent)return active();
  const previous=document.createElement('div'),next=document.createElement('div');previous.setAttribute('hidden','');previous.setAttribute('inert','');previous.setAttribute('aria-hidden','true');previous.setAttribute('data-berkas-question-parent','');next.setAttribute('data-berkas-question-child','');next.innerHTML=berkasQuestionView({numberYear,titleId});
  scrollTop=root.scrollTop;label=root.getAttribute('aria-labelledby');opener=requestedOpener?.isConnected&&root.contains(requestedOpener)?requestedOpener:null;const view=root.id==='main'?document.defaultView:null;if(view?.scrollTo)pageScroll={view,x:view.scrollX,y:view.scrollY};
  for(const node of Array.from(root.childNodes))previous.appendChild(node);root.appendChild(previous);root.appendChild(next);parent=previous;child=next;childAbort=new AbortController();lastHistory=-1;root.setAttribute('aria-labelledby',titleId);root.scrollTop=0;
  controller=createBerkasQuestion({read,write,isCurrent:active,changed:paint,onSessionError});
  child.addEventListener('input',event=>{if(active()&&event.target.matches('[data-bq-message]'))controller.draft(event.target.value);},{signal:childAbort.signal});
  child.addEventListener('submit',event=>{if(active()&&event.target.matches('[data-bq-form]')){event.preventDefault();controller.draft(child.querySelector('[data-bq-message]').value);void controller.send();scroll();}},{signal:childAbort.signal});
  child.addEventListener('click',event=>{if(!active())return;if(event.target.closest('[data-bq-back]')){event.preventDefault();back();}else if(event.target.closest('[data-bq-reload]')){event.preventDefault();void controller.load();}},{signal:childAbort.signal});
  paint(controller.snapshot());next.querySelector('h2').focus({preventScroll:true});if(pageScroll)view.scrollTo(0,0);void controller.load();return true;
 }
 root.addEventListener('close',dispose,{signal:abort.signal});
 return Object.freeze({open,back,dispose,get active(){return active();},get current(){return valid();}});
}
