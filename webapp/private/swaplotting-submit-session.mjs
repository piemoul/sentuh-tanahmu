import {randomBytes,randomInt} from 'node:crypto';
import {ApiError} from './api-client.mjs';
import {APP_VERSION} from './configuration.mjs';
import {parseQueueProfileResponse} from './queue-profile.mjs';
import {decodeSwaplottingDisclaimer} from './swaplotting-read-models.mjs';
import {swaplottingOffices,swaplottingRegions} from '../assets/swaplotting/model.js';
import {SWAPLOTTING_POSTS,SWAPLOTTING_POST_LIMIT,SWAPLOTTING_COORDINATE_FORMAT,prepareSwaplottingReviewValues,buildSwaplottingPostValues,prepareSwaplottingUploadedFiles,serializeSwaplottingPost,createSwaplottingAttempt,swaplottingWasDispatched,swaplottingExact,swaplottingPostError} from './swaplotting-post.mjs';

const kinds=['profile','disclaimer','offices','regions'],opaque=prefix=>prefix+randomBytes(24).toString('base64url');
const readKinds={'post-account-account-summary-d2939c':'profile','get-map-getdisclaimer-d29ef0':'disclaimer','get-legacy-kantah-d10364':'offices','get-legacy-wilayah-d752bc':'regions'};
const changed=()=>new ApiError(409,'SWAPLOTTING_CONTEXT_CHANGED','Sumber formulir berubah. Muat kembali ringkasan akun, ketentuan dan pilihan wilayah.');
const sameProfile=(a,b)=>a&&b&&['userId','nomorIdentitas','userLevel','isIkd','nama','nomorHp','email'].every(key=>a[key]===b[key]);
function profile(result){parseQueueProfileResponse(result);const value=result.data.data;return Object.fromEntries(['userId','nomorIdentitas','userLevel','isIkd','nama','nomorHp','email'].map(key=>[key,value[key]??null]));}
function ownContact(value){if(!value||![2,3].includes(value.userLevel)||value.isIkd!==false)throw new ApiError(409,'SWAPLOTTING_OWN_PROFILE_REQUIRED','Profil sendiri belum tersedia untuk formulir ini.');return {name:value.nama??'',phone:value.nomorHp??'',email:value.email??''};}

// Session-only staging is a browser adaptation: one context,120s ready TTL,
//25MiB final payload and64MiB total retained source bytes. No filesystem, URL
// fetch, persistence, fabricated presence/measurement claim or Activity write.
export class SwaplottingSubmissionSession {
 constructor({clientPromise,now=Date.now,ttlMs=120_000,maxStagedBytes=64*1024*1024,sweepMs=30_000}={}){
  this.clientPromise=clientPromise;this.now=now;this.ttlMs=ttlMs;this.maxStagedBytes=maxStagedBytes;this.stagedBytes=0;this.states=new WeakMap();this.live=new Set();this.contexts=new Set();this.closed=false;
  this.timer=setInterval(()=>this.sweep(),sweepMs);this.timer.unref?.();
 }
 state(session){let state=this.states.get(session);if(!state){const controller=new AbortController();state={sources:Object.fromEntries(kinds.map(kind=>[kind,null])),sequences:Object.fromEntries(kinds.map(kind=>[kind,0])),revision:0,review:null,busy:false,controller,signal:AbortSignal.any([controller.signal,session.authenticationSignal].filter(value=>value instanceof AbortSignal))};const abort=()=>this.discard(session);state.authSignal=session.authenticationSignal;state.authAbort=abort;state.authSignal?.addEventListener('abort',abort,{once:true});this.states.set(session,state);this.live.add(state);}return state;}
 active(session,state,assertCurrent=()=>{}){assertCurrent();if(this.closed||!session?.tokens||!session.user||session.active===false||this.states.get(session)!==state||state.signal.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');}
 release(context){if(!context||context.released)return;context.released=true;this.stagedBytes-=context.reserved;context.files=[];context.reserved=0;this.contexts.delete(context);}
 retireReady(state){if(state.review?.status==='ready'){this.release(state.review);state.review=null;}}
 sweep(){const now=this.now();for(const context of this.contexts)if(context.status==='ready'&&now>=context.expiresAt){this.release(context);if(context.state.review===context)context.state.review=null;}}
 beginRead(prepared,session){
  const kind=readKinds[prepared?.operation?.id];if(!kind||!session?.tokens||!session.user||session.active===false||this.closed)return null;
  if(kind==='offices'&&(prepared.query?.nama!==''||prepared.query?.tipeKantor!==''))return null;
  if(kind==='regions'&&prepared.query?.nama!=='')return null;
  const state=this.state(session);this.active(session,state);const sequence=++state.sequences[kind];state.sources[kind]=null;state.revision++;this.retireReady(state);
  let parent=null;
  if(kind==='offices'){state.sources.regions=null;state.sequences.regions++;}
  if(kind==='regions'){const offices=state.sources.offices;if(offices&&typeof prepared.query?.kantorid==='string'&&offices.value.some(value=>value.KantorId===prepared.query.kantorid))parent={offices,kantorId:prepared.query.kantorid};}
  return {kind,state,sequence,parent};
 }
 observe(prepared,result,session,ticket){
  if(!ticket)return result;const {state,kind,sequence,parent}=ticket;
  if(this.closed||this.states.get(session)!==state||state.signal.aborted||!session.tokens||session.active===false||state.sequences[kind]!==sequence||kind==='regions'&&(!parent||state.sources.offices!==parent.offices))return result;
  try{
   if(!Number.isInteger(result.status)||result.status<200||result.status>=300)throw Error('status');
   const value=kind==='profile'?profile(result):kind==='disclaimer'?decodeSwaplottingDisclaimer(result.data):kind==='offices'?swaplottingOffices(result.data):swaplottingRegions(result.data);
   const context={id:opaque('ss_'),value:structuredClone(value),parent};state.sources[kind]=context;
   return {...result,swaplottingSourceContext:{kind,id:context.id}};
  }catch{return result;}
 }
 async prepareReview(values,uploadedFiles,session,assertCurrent){
  let input,uploads;try{input=prepareSwaplottingReviewValues(values);uploads=prepareSwaplottingUploadedFiles(uploadedFiles);}catch(error){throw new ApiError(error.status||400,error.code,error.message);}
  if(uploads.length<1||uploads.length>5)throw new ApiError(400,'SWAPLOTTING_PHOTO_COUNT','Pilih satu sampai lima foto pada formulir.');
  const state=this.state(session);this.active(session,state,assertCurrent);this.sweep();
  if(state.busy||['dispatched','accepted','unknown'].includes(state.review?.status))throw new ApiError(409,state.review?.status==='unknown'?'SWAPLOTTING_OUTCOME_UNKNOWN':'SWAPLOTTING_BUSY','Pengiriman sebelumnya belum dapat diulang. Periksa hasilnya terlebih dahulu.');
  const sources=Object.fromEntries(kinds.map(kind=>{const source=state.sources[kind];if(!source||source.id!==input.sourceContexts[kind])throw changed();return [kind,source];}));
  if(sources.regions.parent?.offices!==sources.offices)throw changed();
  const {draft,kind}=input,office=sources.offices.value[draft.officeIndex],region=sources.regions.value[draft.regionIndex];
  if(!office||!region||typeof office.KantorId!=='string'||!office.KantorId.length||typeof region.code!=='string'||!region.code.length||sources.regions.parent.kantorId!==office.KantorId)throw changed();
  const contacts=ownContact(sources.profile.value);
  if(['name','phone','email'].some(key=>draft.fields[key]!==contacts[key]))throw new ApiError(409,'SESSION_CHANGED','Kontak profil berubah. Muat kembali formulir untuk akun ini.');
  if(typeof sources.disclaimer.value.message==='string'&&sources.disclaimer.value.message.length!==0&&!draft.disclaimerAcknowledged)throw new ApiError(409,'SWAPLOTTING_DISCLAIMER_REQUIRED','Setujui ketentuan peta yang sedang ditampilkan terlebih dahulu.');
  const reserved=uploads.reduce((total,value)=>total+value.size,0);
  if(reserved>SWAPLOTTING_POST_LIMIT)throw new ApiError(413,'BODY_TOO_LARGE','Ukuran kiriman melebihi batas browser.');
  this.retireReady(state);
  if(this.stagedBytes+reserved>this.maxStagedBytes)throw new ApiError(503,'SWAPLOTTING_STAGING_FULL','Penyimpanan sementara sedang penuh. Coba lagi setelah pengiriman lain selesai.');
  this.stagedBytes+=reserved;state.busy=true;const revision=state.revision;
  let context;
  const current=()=>{this.active(session,state,assertCurrent);if(state.revision!==revision||kinds.some(kind=>state.sources[kind]!==sources[kind]))throw changed();};
  try{
   const client=await this.clientPromise;current();await client.ensureFresh(session);current();
   const fresh=profile(await client.request({path:'account/account_summary',method:'POST',encoding:'form',auth:'session',session,body:{appVersion:APP_VERSION},query:{}}));current();
   if(!sameProfile(fresh,sources.profile.value))throw new ApiError(409,'SESSION_CHANGED','Profil berubah. Muat kembali formulir untuk akun ini.');ownContact(fresh);
   const body=buildSwaplottingPostValues(kind,{...draft,fields:{...draft.fields,...contacts},office,region});
   const files=[];
   for(const upload of uploads){current();const buffer=Buffer.from(await Blob.prototype.arrayBuffer.call(upload.file));current();if(buffer.length!==upload.size)throw new ApiError(409,'SWAPLOTTING_PHOTO_CHANGED','Byte foto berubah saat ringkasan disiapkan.');files.push({key:'file',filename:randomBytes(16).toString('hex'),bytes:buffer});}
   const boundary='--dio-boundary-'+String(randomInt(0,0x100000000)).padStart(10,'0');
   // Validate exact final size now. Source byte buffers remain unchanged; the
   // final payload is rebuilt once at dispatch with the same metadata/boundary.
   await serializeSwaplottingPost(kind,body,files,boundary);current();
   const activityBody={activityType:'Swaplotting',contentId:'',title:kind==='registered'?'Swaplotting Tanah Bersertipikat':'Swaplotting Tanah Belum Bersertipikat',subtitle:`Kantor Pertanahan ${office.Nama??''}\nDesa/Kelurahan ${region.name??''}\n`+(kind==='registered'?`${body.tipehak}\nNomor ${draft.fields.number}`:draft.fields.address),status:'sukses'};
   context={id:opaque('sr_'),state,kind,body,files,boundary,reserved,released:false,status:'ready',expiresAt:this.now()+this.ttlMs,sources,owner:session.user,activityBody,completion:null};this.contexts.add(context);state.review=context;
   return {reviewId:context.id,kind,expiresAt:context.expiresAt,review:{dto:{...body},photos:uploads.map((upload,index)=>({name:'file',ordinal:index+1,byteLength:upload.size,filename:files[index].filename,contentType:'application/octet-stream',sourceMediaType:upload.type})),coordinateFormatting:SWAPLOTTING_COORDINATE_FORMAT,submitted:false}};
  }catch(error){if(!context)this.stagedBytes-=reserved;error.delivery='not_sent';throw error;}
  finally{state.busy=false;}
 }
 async submit(values,session,assertCurrent){
  try{swaplottingExact(values,['reviewId','kind']);}catch{throw new ApiError(400,'SWAPLOTTING_SUBMIT_SCOPE','Pengiriman memerlukan ringkasan formulir sesi ini.');}
  const state=this.state(session);this.active(session,state,assertCurrent);this.sweep();const context=state.review;
  if(!context||context.id!==values.reviewId||context.kind!==values.kind)throw new ApiError(409,'SWAPLOTTING_REVIEW_EXPIRED','Ringkasan sudah berakhir atau bukan milik sesi ini.');
  if(state.busy||context.status!=='ready')throw new ApiError(409,'SWAPLOTTING_ATTEMPT_USED','Pengiriman ini sudah dijalankan. Periksa hasilnya terlebih dahulu.');
  const current=()=>{this.active(session,state,assertCurrent);if(state.review!==context||session.user!==context.owner||kinds.some(kind=>state.sources[kind]!==context.sources[kind]))throw changed();};
  current();state.busy=true;context.status='preparing';const attempt=createSwaplottingAttempt();context.attempt=attempt;
  try{
   const client=await this.clientPromise;current();await client.ensureFresh(session);current();
   const fresh=profile(await client.request({path:'account/account_summary',method:'POST',encoding:'form',auth:'session',session,body:{appVersion:APP_VERSION},query:{}}));current();
   if(!sameProfile(fresh,context.sources.profile.value))throw new ApiError(409,'SESSION_CHANGED','Profil berubah sebelum pengiriman. Muat kembali formulir.');
   const result=await client.request({path:SWAPLOTTING_POSTS[context.kind].path,method:'POST',encoding:'multipart',auth:'session',clientProfile:'swaplotting-post',session,body:context.body,files:context.files,query:{},swaplottingAttempt:attempt,swaplottingBoundary:context.boundary,signal:state.signal});current();
   context.status=result.data===true?'accepted':'failed';context.result={status:result.status,data:result.data,contentType:result.contentType};
   return {...result,reviewId:context.id,delivery:result.data===true?'confirmed':'not_confirmed'};
  }catch(error){context.status=swaplottingWasDispatched(attempt)?'unknown':'not_sent';error.delivery=swaplottingWasDispatched(attempt)?'unknown':'not_sent';throw error;}
  finally{state.busy=false;this.release(context);}
 }
 async complete(values,session,assertCurrent){
  try{swaplottingExact(values,['reviewId']);}catch{throw new ApiError(400,'SWAPLOTTING_COMPLETE_SCOPE','Pilih hasil pengiriman Swaplotting sesi ini.');}
  const state=this.state(session);this.active(session,state,assertCurrent);const context=state.review;
  if(!context||context.id!==values.reviewId||!['accepted','completed'].includes(context.status))throw new ApiError(409,'SWAPLOTTING_NOT_ACCEPTED','Tidak ada hasil Swaplotting berhasil yang dapat diselesaikan.');
  if(state.busy||context.completion!==null)throw new ApiError(409,'SWAPLOTTING_COMPLETION_USED','Penyelesaian hasil ini sudah dijalankan.');
  const current=()=>{this.active(session,state,assertCurrent);if(state.review!==context||session.user!==context.owner)throw changed();};
  current();context.completion='running';state.busy=true;
  let activity={success:false,delivery:'not_sent'},refresh={success:false,result:null};
  const ordinary=error=>error instanceof ApiError&&(error.status>=500||error.code==='UPSTREAM_REJECTED'&&error.status===403);
  try{
   const client=await this.clientPromise;current();
   const attempt=createSwaplottingAttempt();context.activityAttempt=attempt;
   try{
    await client.ensureFresh(session);current();
    const result=await client.request({path:'activity/AddUserActivity',method:'POST',encoding:'multipart',auth:'session',clientProfile:'swaplotting-activity',session,body:context.activityBody,files:[],query:{},swaplottingAttempt:attempt,swaplottingBoundary:'--dio-boundary-'+String(randomInt(0,0x100000000)).padStart(10,'0'),signal:state.signal});current();
    activity={success:result.data===true,delivery:result.data===true?'confirmed':'unknown'};
   }catch(error){activity={success:false,delivery:swaplottingWasDispatched(attempt)?'unknown':'not_sent'};current();if(!ordinary(error))throw error;}
   // Native d74828 ignores the Activity bool and always forces the GET after a
   // normal provider failure. Never replay the mutation when refresh fails.
   try{await client.ensureFresh(session);current();const result=await client.request({path:'activity/GetUserActivity',method:'GET',encoding:'none',auth:'session',session,body:{},query:{}});current();refresh={success:true,result};}
   catch(error){current();if(!ordinary(error))throw error;}
   context.completion='completed';context.status='completed';context.completionResult={reviewId:context.id,uploadAccepted:true,activity,refresh,completed:true};return context.completionResult;
  }catch(error){context.completion='failed';error.uploadAccepted=true;error.activityDelivery=activity.delivery;throw error;}
  finally{state.busy=false;}
 }
 status(reviewId,session,assertCurrent=()=>{}){
  const state=this.states.get(session);if(!state)throw new ApiError(404,'SWAPLOTTING_REVIEW_NOT_FOUND','Hasil pengiriman tidak ditemukan pada sesi ini.');this.active(session,state,assertCurrent);this.sweep();const context=state.review;
  if(!context||context.id!==reviewId)throw new ApiError(404,'SWAPLOTTING_REVIEW_NOT_FOUND','Hasil pengiriman tidak ditemukan pada sesi ini.');
  return {reviewId:context.id,kind:context.kind,state:context.status,uploadAccepted:context.result?.data===true,delivery:context.result?.data===true?'confirmed':context.status==='failed'?'not_confirmed':swaplottingWasDispatched(context.attempt)?'unknown':'not_sent',completion:context.completion,upstreamStatus:context.result?.status??null};
 }
 discardReview(reviewId,session){const state=this.states.get(session),context=state?.review;if(!context||context.id!==reviewId)return false;if(state.busy||!['ready','not_sent','failed','completed'].includes(context.status))return false;this.release(context);state.review=null;return true;}
 discard(session){const state=session&&this.states.get(session);if(!state)return;state.controller.abort();state.authSignal?.removeEventListener('abort',state.authAbort);if(!state.busy)this.release(state.review);state.sources=Object.fromEntries(kinds.map(kind=>[kind,null]));state.review=null;state.revision++;this.states.delete(session);this.live.delete(state);}
 close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);for(const state of this.live){state.controller.abort();state.authSignal?.removeEventListener('abort',state.authAbort);if(!state.busy)this.release(state.review);state.sources=Object.fromEntries(kinds.map(kind=>[kind,null]));state.review=null;state.revision++;}this.live.clear();}
}
