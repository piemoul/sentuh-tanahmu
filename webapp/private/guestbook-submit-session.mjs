import {randomBytes,createHash} from 'node:crypto';
import {ApiError} from './api-client.mjs';
import {guestbookLookupFromRead} from './guestbook-client.mjs';
import {guestbookExact,prepareGuestbookPostInput,guestbookPostBody,createGuestbookPostAttempt,guestbookPostWasDispatched} from './guestbook-post.mjs';

const opaque=()=> 'gbc_'+randomBytes(24).toString('base64url');
const notSent=error=>{error.delivery='not_sent';error.details={...(error.details||{}),delivery:'not_sent'};return error;};
const invalid=()=>new ApiError(409,'GUESTBOOK_CONTEXT_INVALID','Konteks unit Buku Tamu berakhir atau berubah. Buka kembali data unit dari QR kantor.');
// Only one currently selected QR/read context can own a form. A ten-minute
// ready lifetime and session-lifetime pending/accepted/unknown duplicate guard
// are explicit browser adaptations, not proof of QR authenticity or attendance.
export class GuestbookSubmissionSession{
 constructor({postClientPromise,now=Date.now,ttlMs=10*60_000,maxGuards=256}={}){if(typeof now!=='function'||!Number.isSafeInteger(ttlMs)||ttlMs<1||!Number.isSafeInteger(maxGuards)||maxGuards<1||maxGuards>1024)throw new TypeError('Konfigurasi konteks Buku Tamu tidak valid.');this.postClientPromise=postClientPromise;this.now=now;this.ttlMs=ttlMs;this.maxGuards=maxGuards;this.states=new WeakMap();this.live=new Set();this.closed=false;}
 state(session){
  if(this.closed||!session||typeof session!=='object'||!session.tokens||!session.user||session.active===false||session.authenticationSignal?.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi Buku Tamu berakhir. Silakan masuk kembali.');
  let state=this.states.get(session);if(state&&state.owner!==session.user){this.discard(session);state=null;}
  if(!state){const abort=()=>this.discard(session);state={owner:session.user,read:null,context:null,guards:new Map(),controller:new AbortController(),authSignal:session.authenticationSignal,abort};state.authSignal?.addEventListener('abort',abort,{once:true});this.states.set(session,state);this.live.add(state);}return state;
 }
 active(session,state,assertCurrent=()=>{}){assertCurrent();if(this.closed||session?.active===false||!session?.tokens||!session.user||this.states.get(session)!==state||session.user!==state.owner||session.authenticationSignal?.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi Buku Tamu berakhir. Silakan masuk kembali.');}
 beginRead(query,session){
  guestbookExact(query,['uid','unid']);for(const key of ['uid','unid'])if(typeof query[key]!=='string')throw notSent(invalid());
  const state=this.state(session);this.active(session,state);const ticket={state,owner:session.user,query:Object.freeze({...query})};state.read=ticket;state.context=null;return ticket;
 }
 observeRead(result,session,ticket){
  const state=ticket?.state;
  if(!state||this.closed||this.states.get(session)!==state||state.read!==ticket||state.owner!==session.user||ticket.owner!==session.user||session.active===false||!session.tokens||result?.status!==200)return result;
  const lookup=guestbookLookupFromRead(result,ticket.query);if(!lookup)return result;
  // Nullable IDs are native nullable kBb Strings and map to empty multipart
  // values. They are never replaced with account/display/browser identities.
  const key=createHash('sha256').update(JSON.stringify(['kantorId','unitKerjaId','userId'].map(name=>lookup[name]??''))).digest('hex');
  const context={id:opaque(),lookup:Object.freeze(lookup),key,owner:session.user,expires:this.now()+this.ttlMs,status:'ready'};state.context=context;
  return {...result,guestbookContextId:context.id};
 }
 async submit(values,session,assertCurrent=()=>{},requestSignal){
  let input;try{input=prepareGuestbookPostInput(values);}catch(error){throw notSent(new ApiError(error.status||400,error.code||'GUESTBOOK_POST_INPUT_INVALID',error.message));}
  const state=this.state(session);this.active(session,state,assertCurrent);const context=state.context;
  const current=()=>{this.active(session,state,assertCurrent);if(state.context!==context||context.owner!==session.user)throw invalid();};
  if(!context||context.id!==input.contextId||context.status!=='ready'||context.expires<=this.now())throw notSent(invalid());
  if(state.guards.has(context.key))throw notSent(new ApiError(409,'GUESTBOOK_ATTEMPT_USED','Pengiriman Buku Tamu sebelumnya sedang diproses atau belum dapat diulang. Periksa hasil melalui petugas kantor.'));
  if(state.guards.size>=this.maxGuards)throw notSent(new ApiError(409,'GUESTBOOK_ATTEMPT_LIMIT','Batas konteks pengiriman Buku Tamu pada sesi ini tercapai.'));
  try{current();}catch(error){throw notSent(error);}
  if(requestSignal!==undefined&&!(requestSignal instanceof AbortSignal))throw notSent(invalid());
  const attempt=createGuestbookPostAttempt(),guard={contextId:context.id,status:'pending'};context.status='preparing';state.guards.set(context.key,guard);
  try{
   const client=await this.postClientPromise;current();
   const signals=[session.authenticationSignal,requestSignal,state.controller.signal].filter(Boolean),signal=AbortSignal.any(signals);
   const result=await client.submit(guestbookPostBody(context.lookup,input.fields),{signal,attempt});
   current();if(!result||result.delivery!=='received'||typeof result.data?.error!=='boolean')throw new ApiError(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum dapat diproses.');
   context.status=result.data.error?'ready':'accepted';if(result.data.error)state.guards.delete(context.key);else guard.status='accepted';return result;
  }catch(error){const sent=guestbookPostWasDispatched(attempt);context.status=sent?'unknown':'ready';if(!sent&&state.guards.get(context.key)===guard)state.guards.delete(context.key);else if(sent)guard.status='unknown';error.delivery=sent?'unknown':'not_sent';error.details={...(error.details||{}),delivery:error.delivery};throw error;}
 }
 discard(session){const state=session&&this.states.get(session);if(!state)return;state.authSignal?.removeEventListener('abort',state.abort);state.controller.abort();state.context=null;state.read=null;state.guards.clear();this.states.delete(session);this.live.delete(state);}
 close(){if(this.closed)return;this.closed=true;for(const state of this.live){state.authSignal?.removeEventListener('abort',state.abort);state.controller.abort();state.context=null;state.read=null;state.guards.clear();}this.live.clear();}
}
