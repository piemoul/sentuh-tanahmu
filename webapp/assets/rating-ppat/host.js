import {createRatingPPAT} from './controller.js';
import {ratingPPATView} from './view.js';
// A parent-owned child screen inside #main. No transport, auth, storage,
// sensors, modal global or invented Akta lookup lives here. The optional write
// capability and its availability are supplied separately from the read.
export function createRatingPPATHost({document,entry,read,write,isCurrent=()=>true,available=()=>true,writeAvailable=()=>false,onSessionError=()=>{},onBack=()=>{},onResult=()=>{}}={}){
 let alive=true,slot=null,events=null;
 const current=()=>alive&&isCurrent();
 const find=()=>document.querySelector('#main [data-rating-ppat-host]');
 const controller=createRatingPPAT({entry,read,write,writeAvailable:()=>current()&&writeAvailable(),isCurrent:current,changed:()=>paint(),onSessionError,onResult});
 const owned=target=>current()&&slot&&slot===find()&&slot.isConnected!==false&&target?.isConnected!==false&&slot.contains(target);
 function bind(){const next=find();if(!current()||!next)return false;if(slot!==next){events?.abort();slot=next;events=new AbortController();const options={signal:events.signal};slot.addEventListener('click',click,options);slot.addEventListener('change',change,options);slot.addEventListener('submit',event=>event.preventDefault(),options);}return true;}
 function paint(){if(!current()||!bind())return;const focus=document.activeElement?.id;slot.innerHTML=ratingPPATView(controller.snapshot(),{available:available(),writeAvailable:writeAvailable()});if(focus&&/^rating-ppat-answer-\d+-\d+$/.test(focus))slot.querySelector('#'+focus)?.focus();}
 async function click(event){const button=event.target.closest?.('[data-action]');if(!owned(button)||button.disabled||controller.snapshot().writePending)return;if(button.dataset.action==='rating-ppat-back'){onBack();return;}if(button.dataset.action==='rating-ppat-retry'&&available())await controller.retry();if(button.dataset.action==='rating-ppat-submit'&&writeAvailable())await controller.submit?.();}
 function change(event){const target=event.target;if(!owned(target)||target.disabled||!target.matches?.('[data-rating-ppat-group][data-rating-ppat-answer]'))return;const group=target.dataset.ratingPpatGroup,answer=target.dataset.ratingPpatAnswer;if(!/^(?:0|[1-9][0-9]*)$/.test(group??'')||!/^(?:0|[1-9][0-9]*)$/.test(answer??''))return;controller.choose(Number(group),Number(answer));paint();}
 function attach(){if(!current()||!bind())return;if(available())void controller.start();}
 function html(){queueMicrotask(attach);return `<div data-rating-ppat-host>${ratingPPATView(controller.snapshot(),{available:available(),writeAvailable:writeAvailable()})}</div>`;}
 function dispose(){if(!alive)return;alive=false;events?.abort();events=null;controller.dispose();slot?.replaceChildren();slot=null;}
 return {html,attach,paint,dispose,controller};
}
