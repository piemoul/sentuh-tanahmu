import {QUEUE_BOOKING_COPY,queueLimitResult,queueCreateResult,queueBookingPreflight,queueBookingReview} from './booking-model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);

// Parent adapters own session-bound HTTP/cache/identity and notification setup.
// No background read, automatic create retry, token fabrication or list mutation.
export function createQueueBooking({captureContext,isContextCurrent,lockContext,unlockContext,checkLimit,createBooking,notificationAvailable=()=>false,isCurrent=()=>true,onChange=()=>{},onAuthError=()=>{},onCreated=()=>{},onReconcile=()=>{},now=()=>new Date(),preflight=queueBookingPreflight}={}){
 for(const callback of [captureContext,isContextCurrent,lockContext,unlockContext,checkLimit,createBooking])if(typeof callback!=='function')throw new TypeError('QUEUE_BOOKING_ADAPTER_REQUIRED');
 const state={stage:'idle',review:null,message:'',pending:false,requiresReload:false,reconciling:false};
 let alive=true,context=null,limitReceipt=null,request=null;
 const current=()=>alive&&isCurrent();
 const sourceCurrent=()=>{try{return !!context&&isContextCurrent(context)===true;}catch{return false;}};
 const notificationReady=()=>{try{return notificationAvailable()===true;}catch{return false;}};
 const release=()=>{if(context){try{unlockContext(context);}catch{}}context=null;limitReceipt=null;};
 const output=()=>structuredClone({...state,canConfirm:current()&&state.stage==='review'&&!state.pending&&!state.requiresReload&&sourceCurrent()&&notificationReady(),notificationAvailable:notificationReady()});
 const emit=()=>{if(current())onChange(output());};
 function stale(){request=null;release();state.pending=false;state.review=null;state.requiresReload=true;state.stage='error';state.message=QUEUE_BOOKING_COPY.stale;}
 function snapshot(){if(context&&current()&&!sourceCurrent()&&!['unknown','created'].includes(state.stage))stale();return output();}
 const owns=token=>current()&&request===token&&sourceCurrent();
 function checkOwner(token){if(owns(token))return true;if(request===token){stale();emit();}return false;}
 function fail(message,{reload=false}={}){release();Object.assign(state,{stage:'error',message,review:null,requiresReload:reload});}
 function handleAuth(error){
  if(authCodes.has(error?.code)){fail(typeof error.message==='string'?error.message:QUEUE_BOOKING_COPY.quotaCatch,{reload:true});onAuthError(error);return true;}
  if(error?.code==='SESSION_CHANGED'){fail(QUEUE_BOOKING_COPY.stale,{reload:true});return true;}
  return false;
 }
 async function begin(index,generation){
  if(!current()||state.pending||state.requiresReload||!['idle','error'].includes(state.stage))return false;
  const captured=captureContext(index,generation);
  if(!captured||captured.row?.is_available!==1||!Number.isInteger(captured.documentCount)||captured.documentCount<1||captured.documentCount>5||!isContextCurrent(captured)||!lockContext(captured))return false;
  context=captured;const token={};request=token;Object.assign(state,{stage:'checking',review:null,message:'',pending:true});emit();
  try{
   if(!checkOwner(token))return false;
   const response=await checkLimit(context);
   if(!checkOwner(token))return false;
   limitReceipt=queueLimitResult(response);
   const result=preflight({limit:limitReceipt,context,now});
   if(!result||!['error','review'].includes(result.stage)||typeof result.message!=='string')throw new TypeError('QUEUE_PREFLIGHT_RESULT');
   if(result.stage!=='review'){fail(result.message);return false;}
   state.stage='review';state.review=queueBookingReview(context);state.message='';return true;
  }catch(error){if(!checkOwner(token))return false;if(!handleAuth(error))fail(QUEUE_BOOKING_COPY.quotaCatch);return false;}
  finally{if(request===token){request=null;state.pending=false;emit();}}
 }
 function cancel(){
  if(!current()||state.pending||state.stage!=='review')return false;
  release();Object.assign(state,{stage:'idle',review:null,message:'',requiresReload:false});emit();return true;
 }
 async function confirm(){
  if(!current()||state.pending||state.stage!=='review'||state.requiresReload)return false;
  if(!sourceCurrent()){stale();emit();return false;}
  if(!notificationReady()){state.message=QUEUE_BOOKING_COPY.notification;emit();return false;}
  const token={};request=token;state.pending=true;state.stage='creating';state.message='';emit();
  try{
   if(!checkOwner(token))return false;
   const response=await createBooking(context,limitReceipt);
   if(!checkOwner(token))return false;
   const result=queueCreateResult(response);
   if(result.error){fail(result.message);return false;}
   // Mark delivery before the callback: navigation/render failures cannot replay
   // create. Parent starts the proven list refresh and opens official detail.
   request=null;state.pending=false;state.stage='created';state.review=null;state.message='';release();emit();
   if(current()){try{onCreated(result.data);}catch{}}
   return true;
  }catch(error){
   if(!checkOwner(token))return false;
   if(handleAuth(error))return false;
   if(error?.code==='NOTIFICATION_UNAVAILABLE'){state.stage='review';state.message=QUEUE_BOOKING_COPY.notification;return false;}
   if(error?.dispatched===false){fail(typeof error.message==='string'?error.message:QUEUE_BOOKING_COPY.malformed);return false;}
   // A missing/invalid response cannot prove that a transmitted create failed.
   // Remain terminal until an explicit read; never automatically resubmit.
   state.stage='unknown';state.message=QUEUE_BOOKING_COPY.unknown;state.review=null;
   try{unlockContext(context);}catch{}
   return false;
  }finally{if(request===token){request=null;state.pending=false;emit();}}
 }
 async function reconcile(){
  if(!current()||state.stage!=='unknown'||state.reconciling)return false;
  state.reconciling=true;emit();
  try{await onReconcile();return current();}catch{return false;}finally{state.reconciling=false;emit();}
 }
 function dispose(){if(!alive)return;alive=false;request=null;release();Object.assign(state,{stage:'disposed',review:null,message:'',pending:false,requiresReload:false,reconciling:false});}
 return {begin,cancel,confirm,reconcile,snapshot,dispose};
}
