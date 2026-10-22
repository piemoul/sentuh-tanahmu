import {parseHomeBannerResponse,parseHomeYoutubeResponse} from './model.js';
const kinds=['banner','youtube'];
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const empty=()=>({rows:[],loading:false,error:'',code:null,attempted:false,generation:0});
// Browser adaptation: independent loading/error states, duplicate suppression,
// explicit refresh after an empty/error result, and lifetime-bound async results.
// Native may refetch an empty list at init; this controller never loops retries.
export function createHomeMedia({read,onChange=()=>{},isCurrent=()=>true,onSessionError=()=>{}}={}){
 if(typeof read!=='function'||typeof onChange!=='function'||typeof isCurrent!=='function'||typeof onSessionError!=='function')throw new TypeError('HOME_MEDIA_CALLBACK_REQUIRED');
 let alive=true,retired=false;const state={banner:empty(),youtube:empty()},pending={banner:null,youtube:null};
 const snapshot=()=>structuredClone(state);
 function dispose(){
  if(!alive)return;alive=false;
  for(const kind of kinds){pending[kind]=null;const generation=state[kind].generation+1;state[kind]={...empty(),generation};}
 }
 function retire(){
  if(!alive||retired)return;retired=true;
  for(const kind of kinds){pending[kind]=null;const section=state[kind];Object.assign(section,{loading:false,error:'',code:null,attempted:section.rows.length>0,generation:section.generation+1});}
 }
 function current(){if(!alive)return false;if(isCurrent()===true){retired=false;return true;}retire();return false;}
 const emit=()=>{if(current())onChange(snapshot());};
 async function load(kind,{refresh=false}={}){
  if(!kinds.includes(kind)||!current())return false;
  const section=state[kind];
  if(pending[kind]||!refresh&&(section.rows.length>0||section.attempted))return false;
  const request={};pending[kind]=request;
  Object.assign(section,{rows:[],loading:true,error:'',code:null,attempted:true,generation:section.generation+1});
  // Retired old responses must not inspect the remounted/off-route owner or
  // affect a newer request/cache. Identity guard comes before current().
  const valid=()=>pending[kind]===request&&current();
  emit();if(!valid())return false;
  let success=false;
  try{
   const reply=await read(kind);if(!valid())return false;
   const outcome=kind==='banner'?parseHomeBannerResponse(reply):parseHomeYoutubeResponse(reply);
   section.rows=outcome.rows;section.error=outcome.ok?'':outcome.error;section.code=outcome.ok?null:outcome.code;success=outcome.ok;
  }catch(error){
   if(!valid())return false;
   section.rows=[];section.error=typeof error?.message==='string'&&error.message?error.message:'Informasi Beranda belum dapat dimuat. Coba muat ulang.';
   section.code=typeof error?.code==='string'?error.code:'HOME_MEDIA_READ_FAILED';
   if(authCodes.has(section.code))onSessionError(error);
  }finally{if(valid()){pending[kind]=null;section.loading=false;emit();}}
  return success&&current();
 }
 return {snapshot,load,retire,dispose};
}
