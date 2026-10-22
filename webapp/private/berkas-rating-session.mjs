import {randomBytes,randomInt} from 'node:crypto';
import {ApiError} from './api-client.mjs';
import {BERKAS_RATING_PATH,prepareBerkasRatingInput,createBerkasRatingAttempt,berkasRatingWasDispatched} from './berkas-rating-post.mjs';

const LIST='post-berkas-getberkas-d15068',DETAIL='post-berkas-cariberkas-d88218',opaque=prefix=>prefix+randomBytes(24).toString('base64url');
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function bodyData(result){let value=result?.data;for(let index=0;index<3&&record(value)&&Object.hasOwn(value,'data');index++)value=value.data;return value;}
function explicitError(result){let value=result?.data;for(let index=0;index<4&&record(value);index++){if(value.error===true)return true;if(!Object.hasOwn(value,'data'))break;value=value.data;}return false;}
function rowsOf(result){const value=bodyData(result);if(Array.isArray(value))return value;if(record(value))for(const key of ['items','records','list','result','message'])if(Array.isArray(value[key]))return value[key];return null;}
function detailOf(result){const value=bodyData(result);return record(value)&&['nomor','tahun','statusBerkas','namaProsedur'].every(key=>Object.hasOwn(value,key))&&['nomor','tahun','statusBerkas'].every(key=>value[key]===null||Number.isInteger(value[key]))&&(value.namaProsedur===null||typeof value.namaProsedur==='string')&&(value.berkasId==null||typeof value.berkasId==='string')&&[value.parapihak,value.perjalananBerkas??value.PerjalananBerkas].every(rows=>rows==null||Array.isArray(rows)&&rows.every(record))&&(value.kantor==null||record(value.kantor))?value:null;}
const notSent=error=>{error.delivery='not_sent';error.details={...(error.details||{}),delivery:'not_sent'};return error;};
const invalid=()=>new ApiError(409,'BERKAS_RATING_CONTEXT_INVALID','Konteks penilaian berakhir atau berubah. Buka kembali detail dari Berkasku.');

// Opaque source/detail references,120s ready TTL and session-lifetime accepted/
// unknown guards are browser adaptations. No profile ID, display ID, Activity,
// bookmark ID, persistence, provider read or automatic write replay is used.
export class BerkasRatingSession{
 constructor({clientPromise,now=Date.now,ttlMs=120_000,maxContexts=64}={}){this.clientPromise=clientPromise;this.now=now;this.ttlMs=ttlMs;this.maxContexts=maxContexts;this.states=new WeakMap();this.live=new Set();this.closed=false;}
 state(session){
  let state=this.states.get(session);
  if(state&&state.owner!==session.user){this.discard(session);state=null;}
  if(!state){const abort=()=>this.discard(session);state={owner:session.user,lists:new Map(),contexts:new Map(),guards:new Map(),authSignal:session.authenticationSignal,abort};state.authSignal?.addEventListener('abort',abort,{once:true});this.states.set(session,state);this.live.add(state);}
  return state;
 }
 active(session,state,assertCurrent=()=>{}){assertCurrent();if(this.closed||session?.active===false||!session?.tokens||!session.user||this.states.get(session)!==state||state.owner!==session.user||session.authenticationSignal?.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi penilaian sudah berakhir. Silakan masuk kembali.');}
 sweep(state){const time=this.now();for(const [id,context]of state.contexts)if(context.status==='ready'&&context.expires<=time)state.contexts.delete(id);}
 beginRead(prepared,session){
  if(prepared?.operation?.id!==LIST||typeof prepared.body?.selesai!=='boolean'||!session?.tokens||!session.user||session.active===false||this.closed)return null;
  const state=this.state(session);this.active(session,state);const kind=prepared.body.selesai,ticket={state,kind};
  state.lists.set(kind,ticket);for(const [id,context]of state.contexts)if(context.source.kind===kind&&context.status==='ready')state.contexts.delete(id);
  return ticket;
 }
 observeList(prepared,result,session,ticket){
  if(!ticket||prepared?.operation?.id!==LIST)return result;
  const {state,kind}=ticket;
  if(this.closed||this.states.get(session)!==state||state.lists.get(kind)!==ticket||state.owner!==session.user||!session.tokens||session.active===false)return result;
  if(!Number.isInteger(result.status)||result.status<200||result.status>=300||explicitError(result))return result;
  const rows=rowsOf(result);if(!rows)return result;
  const source={id:opaque('brs_'),kind,expires:this.now()+this.ttlMs,ids:new Set(),state},sources=[];
  rows.forEach((row,index)=>{if(record(row)&&row.readyToRating===true&&typeof row.berkasId==='string'&&row.berkasId.trim()){source.ids.add(row.berkasId);sources.push({index,sourceId:source.id});}});
  state.lists.set(kind,source);return {...result,berkasRatingSources:sources};
 }
 beginDetail(prepared,sourceId,session){
  const state=this.state(session);this.active(session,state);this.sweep(state);
  if(prepared?.operation?.id!==DETAIL||prepared.method!=='POST'||prepared.path!=='/berkas/CariBerkas'||prepared.auth!=='session'||prepared.encoding!=='form'||typeof sourceId!=='string'||!/^brs_[A-Za-z0-9_-]{32}$/.test(sourceId))throw notSent(invalid());
  const body=prepared.body,source=[...state.lists.values()].find(value=>value.id===sourceId);
  if(!source||source.expires<=this.now()||!record(body)||typeof body.berkasId!=='string'||!source.ids.has(body.berkasId)||['nomor','tahun','kantorId'].some(key=>body[key]!==null))throw notSent(invalid());
  return {state,source,berkasId:body.berkasId,owner:session.user};
 }
 observeDetail(result,session,ticket){
  const {state,source}=ticket;
  const detail=detailOf(result);
  if(this.closed||this.states.get(session)!==state||state.lists.get(source.kind)!==source||source.expires<=this.now()||session.user!==ticket.owner||session.active===false||!session.tokens||!Number.isInteger(result.status)||result.status<200||result.status>=300||explicitError(result)||!detail||detail.berkasId!=null&&detail.berkasId!==ticket.berkasId)return result;
  this.sweep(state);
  while(state.contexts.size>=this.maxContexts){const removable=[...state.contexts].find(([,context])=>context.status!=='preparing');if(!removable)return result;state.contexts.delete(removable[0]);}
  const context={id:opaque('brc_'),source,berkasId:ticket.berkasId,owner:ticket.owner,expires:this.now()+this.ttlMs,status:'ready'};
  state.contexts.set(context.id,context);return {...result,berkasRatingContextId:context.id};
 }
 async submit(values,session,assertCurrent=()=>{}){
  let input;try{input=prepareBerkasRatingInput(values);}catch(error){throw notSent(new ApiError(error.status||400,error.code,error.message));}
  const state=this.state(session);this.active(session,state,assertCurrent);this.sweep(state);const context=state.contexts.get(input.contextId);
  const current=()=>{this.active(session,state,assertCurrent);if(state.contexts.get(input.contextId)!==context||context.owner!==session.user||state.lists.get(context.source.kind)!==context.source)throw invalid();};
  if(!context||context.status!=='ready'||context.expires<=this.now())throw notSent(invalid());
  const guard=state.guards.get(context.berkasId);if(guard)throw notSent(new ApiError(409,'BERKAS_RATING_ATTEMPT_USED','Penilaian ini sedang dikirim atau hasil sebelumnya belum dapat diulang. Periksa hasil melalui aplikasi resmi.'));
  try{current();}catch(error){throw notSent(error);}
  const attempt=createBerkasRatingAttempt();context.status='preparing';state.guards.set(context.berkasId,context);
  try{
   const client=await this.clientPromise;current();await client.ensureFresh(session);current();
   const result=await client.request({path:BERKAS_RATING_PATH,method:'POST',encoding:'multipart',auth:'session',session,clientProfile:'berkas-rating-post',body:{Berkasid:context.berkasId,rating:input.rating,userComment:input.userComment},query:{},files:[],berkasRatingAttempt:attempt,berkasRatingBoundary:'--dio-boundary-'+String(randomInt(0,0x100000000)).padStart(10,'0')});
   current();context.status=result.data.error===false?'accepted':'ready';if(result.data.error===true)state.guards.delete(context.berkasId);
   return {...result,delivery:'received'};
  }catch(error){
   const sent=berkasRatingWasDispatched(attempt);context.status=sent?'unknown':'ready';if(!sent&&state.guards.get(context.berkasId)===context)state.guards.delete(context.berkasId);
   error.delivery=sent?'unknown':'not_sent';throw error;
  }
 }
 discard(session){const state=session&&this.states.get(session);if(!state)return;state.authSignal?.removeEventListener('abort',state.abort);state.lists.clear();state.contexts.clear();state.guards.clear();this.states.delete(session);this.live.delete(state);}
 close(){if(this.closed)return;this.closed=true;for(const state of this.live){state.authSignal?.removeEventListener('abort',state.abort);state.lists.clear();state.contexts.clear();state.guards.clear();}this.live.clear();}
}
