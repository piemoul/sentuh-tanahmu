import {isJourneySnapshot} from './model.js';
import {berkasJourneyView} from './view.js';
let nextTitle=0;
export function createBerkasJourneyHost({root,snapshot,isCurrent,context,formatDate,formatTime}){
  if(!root?.ownerDocument||typeof root.appendChild!=='function'||!isJourneySnapshot(snapshot)||typeof isCurrent!=='function'||typeof formatDate!=='function'||typeof formatTime!=='function')throw new TypeError('BERKAS_JOURNEY_HOST');
  let retained=snapshot,currentCheck=isCurrent,ownedContext=context,parent=null,child=null,childAbort=null,opener=null,scrollTop=0,pageScroll=null,label=null,disposed=false;
  const document=root.ownerDocument,titleId=`berkas-journey-title-${++nextTitle}`,abort=new AbortController();
  const validContext=()=>{if(disposed)return false;try{return currentCheck(ownedContext)===true;}catch{return false;}};
  const owns=()=>!!parent&&!!child&&parent.parentNode===root&&child.parentNode===root;
  const connected=()=>root.isConnected===true;
  function restoreLabel(){if(root.getAttribute('aria-labelledby')===titleId){if(label===null)root.removeAttribute('aria-labelledby');else root.setAttribute('aria-labelledby',label);}}
  function scrub(){
    childAbort?.abort();childAbort=null;
    restoreLabel();
    // Remove only this owner's wrappers; a replaced root may already contain a
    // newer account/view. Never put detached old private nodes back into it.
    if(parent?.parentNode===root)parent.remove();if(child?.parentNode===root)child.remove();
    if(parent)parent.replaceChildren();if(child)child.replaceChildren();
    parent=null;child=null;opener=null;pageScroll=null;
  }
  function dispose(){if(disposed)return;disposed=true;abort.abort();scrub();retained=null;currentCheck=null;ownedContext=null;root=null;label=null;}
  function back(){
    if(!parent)return false;
    if(!validContext()||!connected()||!owns()){dispose();return false;}
    const previous=Array.from(parent.childNodes),focus=opener,returningPage=pageScroll;
    childAbort?.abort();childAbort=null;child.replaceChildren();child.remove();for(const node of previous)root.appendChild(node);parent.remove();restoreLabel();
    parent=null;child=null;opener=null;pageScroll=null;root.scrollTop=scrollTop;
    if(focus?.isConnected&&root.contains(focus)&&!focus.disabled&&!focus.closest('[hidden], [inert]'))focus.focus({preventScroll:true});
    if(returningPage)returningPage.view.scrollTo(returningPage.x,returningPage.y);
    return true;
  }
  function open(requestedOpener=document.activeElement){
    if(disposed||!validContext()||!connected())return false;
    if(parent){if(!owns()){dispose();return false;}return true;}
    // Render before moving any actual DOM. Formatting errors are local dashes;
    // invalid injected dependencies cannot leave a half-hidden parent view.
    const html=berkasJourneyView(retained,{formatDate,formatTime,titleId});
    const nextParent=document.createElement('div'),nextChild=document.createElement('div'),nextAbort=new AbortController();
    nextParent.setAttribute('data-berkas-journey-parent','');nextParent.setAttribute('hidden','');nextParent.setAttribute('inert','');nextParent.setAttribute('aria-hidden','true');
    nextChild.setAttribute('data-berkas-journey-child','');nextChild.innerHTML=html;
    nextChild.addEventListener('click',event=>{const button=event.target?.closest?.('[data-berkas-journey-back]');if(button&&child===nextChild&&button.isConnected&&nextChild.contains(button)){event.preventDefault();back();}},{signal:nextAbort.signal});
    scrollTop=root.scrollTop;label=root.getAttribute('aria-labelledby');opener=requestedOpener?.isConnected&&root.contains(requestedOpener)?requestedOpener:null;
    // Cari Berkas uses the document scroller, unlike modal detail roots. Save
    // before changing its height; a shorter child can clamp the old position.
    const pageWindow=root.id==='main'?document.defaultView:null;
    if(pageWindow&&typeof pageWindow.scrollTo==='function'&&Number.isFinite(pageWindow.scrollX)&&Number.isFinite(pageWindow.scrollY))pageScroll={view:pageWindow,x:pageWindow.scrollX,y:pageWindow.scrollY};
    for(const node of Array.from(root.childNodes))nextParent.appendChild(node);
    root.appendChild(nextParent);root.appendChild(nextChild);parent=nextParent;child=nextChild;childAbort=nextAbort;
    root.setAttribute('aria-labelledby',titleId);root.scrollTop=0;nextChild.querySelector('h2')?.focus({preventScroll:true});if(pageScroll)pageScroll.view.scrollTo(0,0);return true;
  }
  root.addEventListener('close',dispose,{signal:abort.signal});
  return Object.freeze({open,back,dispose,get active(){return !disposed&&owns()&&connected()&&validContext();},get current(){return !disposed&&connected()&&validContext();}});
}
