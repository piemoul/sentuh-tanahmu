import {createYuridis} from './controller.js';
import {yuridisView} from './view.js';
import {createYuridisReview} from './review-controller.js';
import {lostReviewsView} from '../lost-review/view.js';
import {createLostReviewComposeHost} from '../lost-review/compose-host.js';
const specs=Object.freeze({
 offices:['get-legacy-kantah-d10364','GET','legacy/Kantah?nama={value}&tipeKantor={value}','optionalSession','none','read'],
 feed:['get-announcement-yuridis-bykantor-d0fb64','GET','announcement/yuridis_byKantor?kantorId={value}','optionalSession','none','read'],
 location:['get-lokasibidang-getbypersilid-dad6f4','GET','LokasiBidang/GetByPersilId','session','none','read'],
 boundary:['get-legacy-getparcelboundarybyid-dbaeb8','GET','legacy/GetParcelBoundaryById?persilid={value}','session','none','read'],
 review:['post-review-last-user-review-dad1dc','POST','review/last_user_review','session','form','read'],
 post:['post-review-post-deb030','POST','review/post','session','multipart','write']
});
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
// Everything is bound to this parent's epoch/route/tab; IDs only come from
// the current returned office, announcement and location metadata snapshots.
export function createYuridisHost({document,getContext,execute,prepare=async()=>{},formatDate,renderMap=()=>'',paintMaps=()=>{},onSessionError=()=>{},onRead=()=>{},posts=new Map()}={}){
 if(typeof getContext!=='function'||typeof execute!=='function')throw new TypeError('YURIDIS_HOST_CONTEXT');
 const initialEpoch=getContext().epoch;let alive=true,attempted=false,slot=null,events=null,review=null;
 const current=()=>{const c=getContext();return alive&&c.epoch===initialEpoch&&c.route==='announcements'&&c.tab==='yuridis'&&!c.logoutPending;};
 const authenticated=()=>current()&&getContext().authenticated===true;
 const operation=kind=>{const s=specs[kind];return s&&getContext().operations?.find(o=>o.id===s[0]&&o.method===s[1]&&o.endpoint===s[2]&&o.auth===s[3]&&o.encoding===s[4]&&o.effect===s[5]&&o.serviceId==='main'&&o.enabled===true&&(kind!=='post'||o.requiresConfirmation===true));};
 const available=()=>current()&&getContext().configured&&!getContext().loading&&!!operation('offices')&&!!operation('feed');
 const find=()=>document.querySelector('#main [data-yuridis-host]');
 function sessionError(error){if(current()&&authCodes.has(error?.code))onSessionError(error);}
 async function read(kind,values){const op=operation(kind);if(!current()||!op||!getContext().configured||getContext().loading||op.auth==='session'&&!authenticated())throw new Error('Pembacaan pengumuman yuridis belum tersedia.');const reply=await execute({operationId:op.id,values}),result=reply?.result;if(!Number.isInteger(result?.status)||(kind==='review'?result.status<200||result.status>299:result.status!==200))throw new Error('Respons pengumuman yuridis belum sesuai kontrak layanan.');if(current())onRead(kind,result.status);return result.data;}
 const controller=createYuridis({read,getFavoriteOfficeId:()=>getContext().favoriteOfficeId,isAuthenticated:authenticated,isCurrent:current,changed:()=>paint(),onSessionError:sessionError});
 function reviewCurrent(value){if(!value||!current()||review!==value)return false;const detail=controller.snapshot().detail;return !!detail&&detail.index===value.index&&detail.revision===value.revision;}
 function disposeReview(){const old=review;review=null;old?.compose?.dispose();old?.controller?.dispose();}
 const postKey=value=>JSON.stringify([initialEpoch,'sertipikatSaya',value.contentId]);
 function reviewHTML(detail){
  if(!detail){disposeReview();return '';}
  if(!review||!reviewCurrent(review)){
   disposeReview();const value={index:detail.index,revision:detail.revision,contentId:detail.item.persilId,attempted:false,scheduled:false,controller:null,compose:null};review=value;
   value.controller=createYuridisReview({read:values=>read('review',values),isCurrent:()=>reviewCurrent(value),isAuthenticated:authenticated,changed:()=>paint(),onSessionError:sessionError});
  }
  const value=review,canRead=!!operation('review')&&getContext().configured&&!getContext().loading;
  if(canRead&&authenticated()&&!value.attempted&&!value.scheduled){value.scheduled=true;queueMicrotask(async()=>{if(!reviewCurrent(value))return;value.scheduled=false;value.attempted=true;await value.controller.start(value.contentId);});}
  const canCompose=typeof value.contentId==='string'&&canRead&&!!operation('post')&&getContext().configured&&!getContext().loading&&!posts.has(postKey(value));
  return lostReviewsView(value.controller.snapshot(),{authenticated:authenticated(),available:canRead,canCompose}).replaceAll('lost-review-retry','yuridis-review-retry').replaceAll('lost-review-compose','yuridis-review-compose');
 }
 function markup(){const model=controller.snapshot();return yuridisView(model,{available:available(),authenticated:authenticated(),formatDate,mapHTML:model.detail?.map?.geometry?renderMap(model.detail.map.geometry):'',reviewsHTML:reviewHTML(model.detail)});}
 function bind(){const next=find();if(!current()||!next)return false;if(slot!==next){events?.abort();slot=next;events=new AbortController();const options={signal:events.signal};slot.addEventListener('click',click,options);slot.addEventListener('input',input,options);slot.addEventListener('change',change,options);}return true;}
 const owned=target=>current()&&slot===find()&&slot?.isConnected!==false&&target?.isConnected!==false&&slot?.contains(target);
 function paint(){if(!bind())return;const active=document.activeElement,selection=active?.id==='yuridis-query'?{start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection}:null;slot.innerHTML=markup();paintMaps();if(selection){const next=slot.querySelector('#yuridis-query');next?.focus({preventScroll:true});next?.setSelectionRange(selection.start,selection.end,selection.direction);}}
 async function click(event){const button=event.target.closest?.('[data-action]');if(!owned(button)||button.disabled)return;const action=button.dataset.action;if(action==='yuridis-retry-offices')await controller.start();else if(action==='yuridis-refresh')await controller.refresh();else if(action==='yuridis-detail'&&/^(?:0|[1-9]\d*)$/.test(button.dataset.index??''))controller.openDetail(Number(button.dataset.index));else if(action==='yuridis-back')controller.closeDetail();else if(action==='yuridis-map')await controller.loadMap();else if(action==='yuridis-review-retry'&&reviewCurrent(review))await review.controller.refresh();else if(action==='yuridis-review-compose')compose();}
 function input(event){if(owned(event.target)&&!event.target.disabled&&event.target.id==='yuridis-query')controller.setQuery(event.target.value);}
 async function change(event){const target=event.target;if(owned(target)&&!target.disabled&&target.id==='yuridis-office'&&/^(?:0|[1-9]\d*)$/.test(target.value))await controller.selectOffice(Number(target.value));}
 function compose(){
  const value=review,op=operation('post');if(!value||!reviewCurrent(value)||value.compose||typeof value.contentId!=='string'||!authenticated()||!operation('review')||!op||posts.has(postKey(value)))return false;
  let host;const formCurrent=()=>reviewCurrent(value)&&value.compose===host;
  host=createLostReviewComposeHost({document,contentId:value.contentId,reviewType:'sertipikatSaya',isCurrent:formCurrent,isAuthenticated:authenticated,
   write:async({values,files})=>{
    if(!formCurrent()||!authenticated()||operation('post')!==op||!operation('review')||!getContext().configured||getContext().loading||posts.has(postKey(value)))throw new Error('Formulir ulasan sudah berubah.');
    const token={};posts.set(postKey(value),token);let accepted=false;
    try{const reply=await execute({operationId:op.id,values,files,confirm:true});if(reply?.result?.status!==200||reply.result.data!==false)throw new Error('Pengiriman ulasan belum dikonfirmasi.');accepted=true;return true;}
    finally{if(posts.get(postKey(value))===token)posts.delete(postKey(value));if(accepted&&reviewCurrent(value)&&authenticated())queueMicrotask(()=>{if(reviewCurrent(value)&&authenticated())void value.controller.reload();});if(current())paint();}
   },onClosed:()=>{if(value.compose===host)value.compose=null;},onSessionError:sessionError});value.compose=host;if(!host.open()){host.dispose();return false;}return true;
 }
 async function attach(){if(!bind()||!available()||attempted)return;attempted=true;try{await prepare();}catch(error){if(authCodes.has(error?.code)){sessionError(error);return;}}if(current())await controller.start();}
 function html(){queueMicrotask(attach);return `<div data-yuridis-host>${markup()}</div>`;}
 function dispose(){if(!alive)return;alive=false;events?.abort();events=null;disposeReview();controller.dispose();slot?.replaceChildren();slot=null;}
 return {html,attach,paint,dispose,controller};
}
