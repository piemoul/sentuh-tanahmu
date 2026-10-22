import {createHomeMedia} from './controller.js';
import {homeYoutubeEmbedUrl} from './model.js';
import {homeMediaShell,homeMediaSection} from './view.js';

const playerFailure='Video belum dapat dibuka. Pilih video lain atau coba lagi.';
const integer=value=>typeof value==='string'&&/^(?:0|[1-9]\d*)$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):null;

// Owns local DOM/player lifetime only. Reads stay in the injected controller.
export function createHomeMediaHost({document,read,isCurrent=()=>true,onAuthError=()=>{},resolvePlayerUrl=homeYoutubeEmbedUrl}){
 if(!document||typeof resolvePlayerUrl!=='function')throw new TypeError('HOME_MEDIA_HOST_REQUIRED');
 let alive=true,root=null,dialog=null,frame=null,player=null,playerError='',lastYoutubeGeneration=null;
 const rendered={banner:null,youtube:null};
 const current=()=>alive&&isCurrent();
 const controller=createHomeMedia({read,isCurrent:current,onSessionError:onAuthError,onChange:()=>paint()});
 const snapshot=()=>controller.snapshot();
 const connected=node=>!!node&&node.isConnected!==false;
 const owned=node=>current()&&connected(root)&&connected(node)&&root.contains(node);
 const playerCurrent=owner=>{
  if(!current()||!owner||player!==owner)return false;
  const value=snapshot().youtube,row=value.rows[owner.index];
  return !value.loading&&value.generation===owner.generation&&!!row&&(row.videoId??'')===owner.videoId&&(row.title??'')===owner.title;
 };
 function focusReturn(owner){
  if(!current()||player||!owner)return;
  const target=owned(owner.returnFocus)?owner.returnFocus:root?.querySelector(`[data-home-media-action="play"][data-home-media-index="${owner.index}"][data-home-media-generation="${owner.generation}"]`);
  if(connected(target)&&!target.disabled)try{target.focus?.();}catch{}
 }
 function closePlayer({restoreFocus=true}={}){
  const owner=player;if(!owner)return false;player=null;
  if(frame){frame.removeAttribute('src');frame.remove();frame=null;}
  try{if(dialog?.open)dialog.close();}catch{}
  if(dialog)dialog.hidden=true;
  if(restoreFocus)focusReturn(owner);return true;
 }
 function makeDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.className='home-media-player-dialog';dialog.hidden=true;
  dialog.setAttribute('aria-labelledby','home-media-player-title');
  const header=document.createElement('div');header.className='home-media-player-header';
  const title=document.createElement('h2');title.id='home-media-player-title';title.textContent='Video';
  const close=document.createElement('button');close.type='button';close.className='button secondary';close.textContent='Tutup';close.setAttribute('data-home-media-player-close','');
  header.append(title,close);const hint=document.createElement('p');hint.className='home-media-player-hint';hint.textContent='Tekan Putar pada pemutar untuk menonton video.';
  dialog.append(header,hint);
  dialog.addEventListener('click',dialogClick);dialog.addEventListener('cancel',dialogCancel);dialog.addEventListener('close',dialogClosed);dialog.addEventListener('keydown',dialogKey);
  document.body.append(dialog);return dialog;
 }
 function dialogClick(event){if(event.target.closest?.('[data-home-media-player-close]')&&dialog?.contains(event.target))closePlayer();}
 function dialogCancel(event){event.preventDefault();closePlayer();}
 function dialogClosed(){if(dialog&&!dialog.open)closePlayer();}
 function dialogKey(event){if(event.key==='Escape'){event.preventDefault();closePlayer();}}
 function safePlayerUrl(videoId){
  const expected=homeYoutubeEmbedUrl(videoId);if(!expected)return null;
  try{
   const raw=resolvePlayerUrl(videoId);if(typeof raw!=='string')return null;
   const origin=document.defaultView?.location?.origin,href=document.defaultView?.location?.href??origin;
   const url=new URL(raw,href);if(url.username||url.password||!['http:','https:'].includes(url.protocol))return null;
   // Production is the fixed helper URL. Only an explicitly injected fixture
   // resolver may point to the same origin; card/provider URLs never reach it.
   if(url.href===expected)return expected;
   return resolvePlayerUrl!==homeYoutubeEmbedUrl&&origin&&url.origin===origin?url.href:null;
  }catch{return null;}
 }
 function play(node){
  if(!owned(node)||node.disabled)return false;
  const index=integer(node.getAttribute('data-home-media-index')),generation=integer(node.getAttribute('data-home-media-generation'));
  const model=snapshot().youtube,row=index===null?null:model.rows[index];
  if(index===null||generation===null||model.loading||model.generation!==generation||!row||!homeYoutubeEmbedUrl(row.videoId))return false;
  const videoId=row.videoId??'',title=row.title??'',url=safePlayerUrl(videoId);
  if(!url){playerError=playerFailure;paint();return false;}
  if(!owned(node)||snapshot().youtube.generation!==generation)return false;
  closePlayer({restoreFocus:false});playerError='';
  const owner={index,generation,videoId,title,returnFocus:node};player=owner;
  const modal=makeDialog();
  if(!playerCurrent(owner)||typeof modal.showModal!=='function'){closePlayer({restoreFocus:false});playerError=playerFailure;paint();return false;}
  const heading=modal.querySelector('#home-media-player-title');if(heading)heading.textContent=title||'Video';
  frame=document.createElement('iframe');frame.className='home-media-player-frame';frame.title=title||'Video kanal Sentuh Tanahku';frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('allow','encrypted-media; picture-in-picture; fullscreen');frame.setAttribute('allowfullscreen','');
  modal.hidden=false;
  try{modal.showModal();if(!playerCurrent(owner))throw new Error('HOME_MEDIA_RETIRED');frame.src=url;modal.insertBefore(frame,modal.querySelector('.home-media-player-hint'));modal.querySelector('[data-home-media-player-close]')?.focus?.();return true;}
  catch{closePlayer({restoreFocus:false});if(current()){playerError=playerFailure;paint();}return false;}
 }
 function paint(){
  if(!current()){closePlayer({restoreFocus:false});return false;}
  const model=snapshot();
  if(lastYoutubeGeneration!==model.youtube.generation){lastYoutubeGeneration=model.youtube.generation;playerError='';}
  if(player&&!playerCurrent(player))closePlayer({restoreFocus:false});
  if(!connected(root))return false;
  for(const kind of ['banner','youtube']){
   const section=root.querySelector(`[data-home-media-section="${kind}"]`);if(!section)continue;
   const html=homeMediaSection(kind,model,{playerError});
   if(rendered[kind]?.node!==section||rendered[kind]?.html!==html){section.innerHTML=html;rendered[kind]={node:section,html};}
   section.setAttribute('aria-busy',String(model[kind].loading));
  }
  return true;
 }
 function handle(action,node){
  if(!current()){closePlayer({restoreFocus:false});return false;}
  if(!owned(node)||node.disabled)return false;
  if(action==='play')return play(node);
  if(action==='reload-banner'||action==='reload-youtube'){
   const kind=action.slice(7);if(snapshot()[kind].loading)return false;
   if(kind==='youtube'){closePlayer({restoreFocus:false});playerError='';}
   void controller.load(kind,{refresh:true});return true;
  }
  return false;
 }
 function click(event){const node=event.target.closest?.('[data-home-media-action]');if(node)handle(node.getAttribute('data-home-media-action'),node);}
 function imageError(event){
  const image=event.target;if(!owned(image)||image.tagName!=='IMG')return;
  const banner=image.closest('.home-banner-image'),thumbnail=image.closest('.home-youtube-thumbnail'),wrapper=banner??thumbnail;
  if(!wrapper||!root.contains(wrapper))return;
  image.hidden=true;
  if(!wrapper.querySelector('[data-home-media-image-fallback]')){
   const text=document.createElement('span');text.className='home-media-placeholder';text.setAttribute('data-home-media-image-fallback','');text.textContent=banner?'Gambar belum dapat dimuat.':'Pratinjau video belum dapat dimuat.';wrapper.append(text);
  }
 }
 function mount(outlet){
  if(!current()||!connected(outlet))return false;
  const next=outlet.matches?.('[data-home-media]')?outlet:outlet.querySelector?.('[data-home-media]');if(!connected(next))return false;
  if(root!==next){root?.removeEventListener('click',click);root?.removeEventListener('error',imageError,true);root=next;rendered.banner=rendered.youtube=null;root.addEventListener('click',click);root.addEventListener('error',imageError,true);}
  paint();void controller.load('banner');void controller.load('youtube');return true;
 }
 function removeDialog(){
  if(!dialog)return;
  dialog.removeEventListener('click',dialogClick);dialog.removeEventListener('cancel',dialogCancel);dialog.removeEventListener('close',dialogClosed);dialog.removeEventListener('keydown',dialogKey);dialog.remove();dialog=null;
 }
 function unmount(){
  if(!alive)return;closePlayer({restoreFocus:false});root?.removeEventListener('click',click);root?.removeEventListener('error',imageError,true);root=null;rendered.banner=rendered.youtube=null;removeDialog();controller.retire();
 }
 const pagehide=()=>closePlayer({restoreFocus:false}),visibility=()=>{if(document.hidden)closePlayer({restoreFocus:false});};
 document.defaultView?.addEventListener?.('pagehide',pagehide);document.addEventListener?.('visibilitychange',visibility);
 function dispose(){
  if(!alive)return;unmount();alive=false;controller.dispose();
  document.defaultView?.removeEventListener?.('pagehide',pagehide);document.removeEventListener?.('visibilitychange',visibility);
  removeDialog();
 }
 return {controller,view:()=>alive?homeMediaShell(snapshot(),{playerError}):'',mount,unmount,paint,handle,closePlayer,playerSnapshot:()=>player?{open:true,videoId:player.videoId,title:player.title,index:player.index,generation:player.generation}:{open:false},dispose};
}
