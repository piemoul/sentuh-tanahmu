import {randomBytes,createHash}from'node:crypto';
import {ApiError}from'./api-client.mjs';
import {BERKAS_QUESTION_POST_PATH,ordinaryQuestionId,questionHistoryPath,prepareBerkasQuestionInput,createBerkasQuestionAttempt,berkasQuestionWasDispatched}from'./berkas-question-post.mjs';
const DETAIL='post-berkas-cariberkas-d88218';
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function dataOf(result){let value=result?.data;for(let i=0;i<3&&record(value)&&Object.hasOwn(value,'data');i++)value=value.data;return value;}
function hasError(result){let value=result?.data;for(let i=0;i<4&&record(value);i++){if(value.error===true)return true;if(!Object.hasOwn(value,'data'))break;value=value.data;}return false;}
const validResult=result=>Number.isInteger(result?.status)&&result.status>=200&&result.status<300&&!hasError(result);
const invalid=()=>new ApiError(409,'BERKAS_QUESTION_CONTEXT_INVALID','Konteks percakapan berubah. Buka kembali detail Koleksi atau Cari Berkas.');
const notSent=error=>{error.delivery='not_sent';return error;};
// Opaque detail ownership, bounded memory and uncertainty guards are browser
// adaptations. They add no fields to the original two-field BPN request.
export class BerkasQuestionSession{
 constructor({clientPromise,maxContexts=64}={}){this.clientPromise=clientPromise;this.maxContexts=maxContexts;this.states=new WeakMap();this.live=new Set();this.closed=false;}
 state(session){let state=this.states.get(session);if(state&&state.owner!==session.user){this.discard(session);state=null;}if(!state){const abort=()=>this.discard(session);state={owner:session.user,collection:null,contexts:new Map(),busy:new Set(),unknown:new Set(),authSignal:session.authenticationSignal,abort};state.authSignal?.addEventListener('abort',abort,{once:true});this.states.set(session,state);this.live.add(state);}return state;}
 active(session,state,assertCurrent=()=>{}){assertCurrent();if(this.closed||session?.active===false||!session?.tokens||!session.user||state.owner!==session.user||this.states.get(session)!==state||session.authenticationSignal?.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi percakapan sudah berakhir. Silakan masuk kembali.');}
 beginRead(prepared,session){
  if(this.closed||!session?.tokens||!session.user||session.active===false)return null;
  const state=this.state(session);
  if(prepared?.path==='collection/GetUserCollection'&&prepared.method==='GET'&&prepared.auth==='session'){
   const ticket={kind:'collection',state,ids:new Set()};state.collection=ticket;for(const [key,value]of state.contexts)if(value.kind==='collection')state.contexts.delete(key);return ticket;
  }
  if(prepared?.operation?.id!==DETAIL||prepared.path!=='/berkas/CariBerkas'||prepared.method!=='POST'||prepared.encoding!=='form'||prepared.auth!=='session')return null;
  const body=prepared.body;
  if(body?.berkasId===null&&['nomor','tahun','kantorId'].every(key=>typeof body[key]==='string'&&body[key].length))return {kind:'search',state};
  if(ordinaryQuestionId(body?.berkasId)&&['nomor','tahun','kantorId'].every(key=>body[key]===null)&&state.collection?.ids.has(body.berkasId))return {kind:'detail',state,source:state.collection,berkasId:body.berkasId};
  return null;
 }
 observe(result,session,ticket){
  if(!ticket)return result;const {state}=ticket;
  if(this.closed||state.owner!==session.user||this.states.get(session)!==state||!session.tokens||session.active===false||!validResult(result))return result;
  const data=dataOf(result);
  if(ticket.kind==='collection'){
   if(state.collection!==ticket||!Array.isArray(data))return result;
   for(const row of data)if(record(row)&&row.type==='BERKAS'&&ordinaryQuestionId(row.contentId))ticket.ids.add(row.contentId);
   return result;
  }
  if(ticket.kind==='detail'&&(state.collection!==ticket.source||!ticket.source.ids.has(ticket.berkasId)))return result;
  if(!record(data)||!['nomor','tahun','statusBerkas','namaProsedur'].every(key=>Object.hasOwn(data,key))||!['nomor','tahun','statusBerkas'].every(key=>data[key]===null||Number.isInteger(data[key]))||!(data.namaProsedur===null||typeof data.namaProsedur==='string'))return result;
  const id=ticket.kind==='detail'?ticket.berkasId:data.berkasId;
  if(!ordinaryQuestionId(id)||data.berkasId!=null&&data.berkasId!==id)return result;
  while(state.contexts.size>=this.maxContexts)state.contexts.delete(state.contexts.keys().next().value);
  const context={id:'bqc_'+randomBytes(24).toString('base64url'),berkasId:id,kind:ticket.kind==='detail'?'collection':'search',source:ticket.source??null};
  state.contexts.set(context.id,context);
  return {...result,berkasQuestionContext:{contextId:context.id,berkasId:id,entry:context.kind}};
 }
 async submit(values,session,assertCurrent=()=>{}){
  let input;try{input=prepareBerkasQuestionInput(values);}catch(error){throw notSent(new ApiError(error.status||400,error.code,error.message));}
  const state=this.state(session),context=state.contexts.get(input.contextId);
  const current=()=>{this.active(session,state,assertCurrent);if(!context||state.contexts.get(context.id)!==context||context.kind==='collection'&&state.collection!==context.source)throw invalid();};
  try{current();}catch(error){throw notSent(error);}
  const fingerprint=createHash('sha256').update(context.berkasId+'\0'+input.content).digest('hex');
  if(state.busy.has(context.berkasId))throw notSent(new ApiError(409,'BERKAS_QUESTION_BUSY','Pesan sebelumnya masih diproses.'));
  if(state.unknown.has(fingerprint))throw notSent(new ApiError(409,'BERKAS_QUESTION_UNCONFIRMED','Pesan yang sama belum terkonfirmasi. Periksa riwayat sebelum mengirim pesan lain.'));
  const attempt=createBerkasQuestionAttempt();state.busy.add(context.berkasId);
  try{
   const client=await this.clientPromise;current();await client.ensureFresh(session);current();
   const result=await client.request({path:BERKAS_QUESTION_POST_PATH,method:'POST',encoding:'form',auth:'session',session,clientProfile:'berkas-question-post',body:{berkasid:context.berkasId,content:input.content},query:{},files:[],berkasQuestionAttempt:attempt});
   current();const accepted=result.data.success===true,delivery=result.data.recognized===true?'received':'unknown';
   if(delivery==='unknown')state.unknown.add(fingerprint);
   let refresh=null;
   if(accepted){
    try{await client.ensureFresh(session);current();const history=await client.request({path:questionHistoryPath(context.berkasId),method:'GET',encoding:'none',auth:'session',session,body:{},query:{},files:[],clientProfile:'main'});current();refresh={success:true,result:history};}
    catch(error){current();refresh={success:false,code:['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED','SESSION_CHANGED'].includes(error.code)?error.code:'BERKAS_QUESTION_HISTORY_FAILED'};}
   }
   return {...result,data:{success:accepted},delivery,refresh};
  }catch(error){const sent=berkasQuestionWasDispatched(attempt);if(sent)state.unknown.add(fingerprint);error.delivery=sent?'unknown':'not_sent';throw error;}
  finally{state.busy.delete(context.berkasId);}
 }
 discard(session){const state=session&&this.states.get(session);if(!state)return;state.authSignal?.removeEventListener('abort',state.abort);state.contexts.clear();state.busy.clear();state.unknown.clear();state.collection=null;this.live.delete(state);this.states.delete(session);}
 close(){if(this.closed)return;this.closed=true;for(const state of this.live){state.authSignal?.removeEventListener('abort',state.abort);state.contexts.clear();state.busy.clear();state.unknown.clear();state.collection=null;}this.live.clear();}
}
