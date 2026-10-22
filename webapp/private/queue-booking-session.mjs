import {randomBytes} from 'node:crypto';
import {ApiError} from './api-client.mjs';
import {APP_VERSION} from './configuration.mjs';
import {prepareQueueBookingReview,queueBookingLimitOutcome,queueBookingPreflight} from './queue-booking-models.mjs';
import {parseQueueBookingProfileResponse,queueBookingOwnApplicant} from './queue-booking-profile.mjs';

const opaque=prefix=>prefix+randomBytes(24).toString('base64url');
const sameProfile=(a,b)=>a&&b&&['userLevel','isIkd','nomorIdentitas','nama','nomorHp','tempatLahir','tanggalLahir'].every(key=>a[key]===b[key]);
const selectionChanged=()=>new ApiError(409,'QUEUE_SELECTION_CHANGED','Pilihan antrean berubah. Muat kembali data pilihan terbaru.');

// Server-owned availability snapshots. Browser input contains an opaque context
// and source row index; no NIK, office ID, applicant/token/body or upstream URL.
// Review deliberately cannot create an appointment: official web notification
// token provisioning and the complete create boundary are not configured.
export class QueueBookingSession {
 constructor({mainClientPromise,bookingClientPromise,queueReader,now=()=>Date.now()}){this.mainClientPromise=mainClientPromise;this.bookingClientPromise=bookingClientPromise;this.queueReader=queueReader;this.now=now;this.states=new WeakMap();this.closeController=new AbortController();}
 state(session){let state=this.states.get(session);if(!state){state={context:null,review:null,profile:null,profileSequence:0,reviewSequence:0,inflight:false,controller:new AbortController()};state.signal=AbortSignal.any([state.controller.signal,this.closeController.signal,session.authenticationSignal].filter(signal=>signal instanceof AbortSignal));this.states.set(session,state);}return state;}
 discard(session){const state=session&&this.states.get(session);if(state){state.controller.abort();this.states.delete(session);}}
 close(){this.closeController.abort();}
 observe(prepared,result,session){
  if(prepared.operation?.endpoint!=='account/account_summary'||!session?.tokens||session.active===false)return;
  const state=this.state(session);state.profileSequence++;
  let profile;try{profile=parseQueueBookingProfileResponse(result);}catch{profile=null;}
  if(!sameProfile(state.profile,profile)){state.profile=profile;state.review=null;state.reviewSequence++;}
 }
 observePreread(prepared,result,session){
  if(!prepared.queuePrerequisite)return result;
  const state=this.state(session);state.review=null;state.reviewSequence++;
  if(prepared.queuePrerequisite!=='availability'){state.context=null;return result;}
  if(!session?.tokens||session.active===false||!Array.isArray(result?.data?.data))throw selectionChanged();
  const source=this.queueReader.state(session),booking=source.booking;
  const office=this.queueReader.bookingOffice(source,booking.officeId),locations=booking.locations?.filter(row=>row.id===prepared.queueLocationId);
  if(!locations||locations.length!==1)throw selectionChanged();
  const id=opaque('qb_');
  state.context={id,source,officeSequence:booking.officeSequence,locationSequence:booking.locationSequence,availabilitySequence:booking.availabilitySequence,profile:state.profile&&structuredClone(state.profile),office:structuredClone(office),location:structuredClone(locations[0]),date:prepared.queueDate,rows:structuredClone(result.data.data)};
  // Calendar is normally fetched AFTER availability. Do not bind its initial
  // sequence into this context; bind it only across an individual pending review.
  return {...result,bookingContextId:id};
 }
 async review(values,session,assertCurrentSession){
  let input;try{input=prepareQueueBookingReview(values);}catch{throw new ApiError(400,'QUEUE_BOOKING_REVIEW_SCOPE','Pilih loket, jumlah berkas dan zona waktu browser yang didukung.');}
  const state=this.state(session),context=state.context,source=context?.source,booking=source?.booking;
  const active=()=>{assertCurrentSession();if(!session.tokens||session.active===false||this.states.get(session)!==state||state.signal.aborted)throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');};
  active();
  const selection=()=>{active();if(!context||state.context!==context||context.id!==input.contextId||this.queueReader.state(session)!==source||source.signal.aborted||booking.officeSequence!==context.officeSequence||booking.locationSequence!==context.locationSequence||booking.availabilitySequence!==context.availabilitySequence)throw selectionChanged();};
  selection();
  if(!context.profile)throw new ApiError(409,'QUEUE_BOOKING_PROFILE_REQUIRED','Muat ringkasan akun lalu ketersediaan loket kembali sebelum pemeriksaan antrean.');
  if(!sameProfile(context.profile,state.profile))throw new ApiError(409,'SESSION_CHANGED','Profil berubah. Muat kembali ketersediaan antrean untuk pemohon saat ini.');
  if(state.inflight)throw new ApiError(409,'QUEUE_BOOKING_BUSY','Pemeriksaan antrean sedang berlangsung.');
  if(input.rowIndex>=context.rows.length||!Object.hasOwn(context.rows,input.rowIndex))throw new ApiError(403,'QUEUE_BOOKING_ROW_NOT_OWNED','Pilih loket dari hasil ketersediaan sesi ini.');
  const row=context.rows[input.rowIndex];if(row.is_available!==1)throw new ApiError(409,'QUEUE_BOOKING_ROW_UNAVAILABLE','Loket ini belum tersedia untuk pengambilan antrean.');
  const sequence=++state.reviewSequence,calendarSequence=booking.calendarSequence;state.review=null;state.inflight=true;
  const current=()=>{selection();if(state.reviewSequence!==sequence||booking.calendarSequence!==calendarSequence)throw selectionChanged();};
  try{
   const main=await this.mainClientPromise;current();await main.ensureFresh(session);current();
   const profileSequence=++state.profileSequence,summarySequence=++source.summarySequence;
   const summary=await main.request({path:'account/account_summary',method:'POST',encoding:'form',auth:'session',session,body:{appVersion:APP_VERSION},query:{}});current();
   if(state.profileSequence!==profileSequence||source.summarySequence!==summarySequence)throw new ApiError(409,'SESSION_CHANGED','Profil berubah saat pemeriksaan antrean dimuat.');
   let profile,applicant;try{profile=parseQueueBookingProfileResponse(summary);applicant=queueBookingOwnApplicant(profile);}catch(error){throw new ApiError(error.status||502,error.code||'QUEUE_PROFILE_UNRECOGNIZED',error.message);}
   if(!sameProfile(context.profile,profile)){
    this.observe({operation:{endpoint:'account/account_summary'}},summary,session);
    this.queueReader.observe({operation:{endpoint:'account/account_summary'}},summary,session);
    throw new ApiError(409,'SESSION_CHANGED','Profil berubah. Muat kembali ketersediaan antrean untuk pemohon saat ini.');
   }
   state.profile=profile;
   this.queueReader.observe({operation:{endpoint:'account/account_summary'}},summary,session);
   const client=await this.bookingClientPromise;current();
   const result=await client.limit({nik:applicant.nik,kantorid:context.office.id,tanggal_booking:context.date},{signal:AbortSignal.any([state.signal,source.signal])});current();
   const quota=queueBookingLimitOutcome(result.data);
   if(quota.error)return {...result,data:{...quota,review:null,reviewId:null,createAvailable:false}};
   let preflight;try{preflight=queueBookingPreflight({row,date:context.date,timeZone:input.timeZone,now:this.now});}catch{throw new ApiError(409,'QUEUE_BOOKING_TIME_UNSUPPORTED','Waktu loket belum dapat dicocokkan dengan zona waktu browser.');}
   current();if(preflight.error)return {...result,data:{error:true,message:preflight.message,quotaAvailable:true,review:null,reviewId:null,createAvailable:false}};
   const reviewId=opaque('qr_');
   const review={office:structuredClone(context.office),location:structuredClone(context.location),date:context.date,loket:structuredClone(row),rowIndex:input.rowIndex,documentCount:input.documentCount,applicant:{nama:applicant.nama},timeZone:input.timeZone,quotaVerified:true,bookingCreated:false};
   // The full own applicant stays server-side. Public preview needs only name.
   state.review={id:reviewId,context,profile,applicant,rowIndex:input.rowIndex,documentCount:input.documentCount,timeZone:input.timeZone};
   return {...result,data:{...quota,review,reviewId,createAvailable:false}};
  }finally{state.inflight=false;}
 }
}
