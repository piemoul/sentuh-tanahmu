import {GUESTBOOK_FIELDS,GUESTBOOK_COPY,GUESTBOOK_WRITE_COPY,guestbookPrefill,guestbookParseQr,guestbookValidate,guestbookMetadata,guestbookWriteValues,guestbookWriteResult} from './model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
// Read and optional write are injected. Only nine raw form fields are passed
// to write; QR lookup ownership/opaque IDs stay in the parent/backend. No
// storage,camera,PII logging or transport/automatic retry lives here.
export function createGuestbook({read,write=null,writeAvailable=()=>true,user=null,changed=()=>{},isCurrent=()=>true,onSessionError=()=>{},onResult=()=>{},onBack=()=>{}}){
 if(typeof read!=='function')throw new TypeError('GUESTBOOK_READ_REQUIRED');
 if(write!==null&&typeof write!=='function')throw new TypeError('GUESTBOOK_WRITE_REQUIRED');
 let alive=true,request=null,writeRequest=null,backUsed=false,prefill=guestbookPrefill(user);
 const writable=typeof write==='function';
 const state={raw:'',stage:'idle',pending:false,error:'',unit:null,values:{...prefill},validation:null};
 if(writable)Object.assign(state,{writeSupported:true,writePending:false,writeLocked:false,writeError:'',writeOutcome:null});
 const current=()=>alive&&isCurrent();
 const available=()=>{try{return writable&&writeAvailable()===true;}catch{return false;}};
 const canSubmit=()=>current()&&writable&&state.stage==='form'&&!!state.unit&&!state.pending&&!state.writeLocked&&available();
 const snapshot=()=>structuredClone(writable?{...state,canSubmit:canSubmit(),canBack:current()&&state.stage==='success'&&!backUsed}:state);
 const emit=()=>{if(current())changed(snapshot());};
 function setRaw(raw){
  if(!current()||typeof raw!=='string'||writable&&(state.writePending||state.writeLocked))return false;
  if(writable){state.writeError='';state.writeOutcome=null;}
  request=null;state.raw=raw;state.pending=false;state.stage='idle';state.error='';state.unit=null;state.values={...prefill};state.validation=null;emit();return true;
 }
 async function open(){
  if(!current()||state.pending||writable&&state.writeLocked)return false;
  if(writable){state.writeError='';state.writeOutcome=null;}
  const values=guestbookParseQr(state.raw);state.error='';state.unit=null;state.validation=null;state.values={...prefill};
  if(!values){state.stage='invalid';state.error=GUESTBOOK_COPY.invalidQr;emit();return false;}
  const owner={};request=owner;state.pending=true;state.stage='reading';emit();
  const valid=()=>current()&&request===owner;
  try{
   const raw=await read(values);if(!valid())return false;
   const unit=guestbookMetadata(raw);state.unit=unit;state.stage=unit===null?'empty':'form';if(unit===null)state.error=GUESTBOOK_COPY.nullData;return unit!==null;
  }catch(error){
   if(!valid())return false;
   state.stage='error';state.error=typeof error?.message==='string'&&error.message?error.message:GUESTBOOK_COPY.readError;
   if(authCodes.has(error?.code))onSessionError(error);
   return false;
  }finally{if(valid()){request=null;state.pending=false;emit();}}
 }
 function setField(key,value){
  if(!current()||state.stage!=='form'||typeof value!=='string'||!GUESTBOOK_FIELDS.some(field=>field.id===key)||writable&&(state.writePending||state.writeLocked))return false;
  state.values[key]=value;if(state.validation)state.validation=guestbookValidate(state.values);emit();return true;
 }
 function validate(){if(!current()||state.stage!=='form'||writable&&(state.writePending||state.writeLocked))return false;state.validation=guestbookValidate(state.values);emit();return state.validation.ok;}
 async function submit(){
  if(!canSubmit())return false;
  const owner={};writeRequest=owner;state.pending=true;state.writePending=true;state.writeError='';state.writeOutcome=null;emit();
  const owned=()=>current()&&writeRequest===owner;
  try{
   // Native publishes busy before aggregate validation. An invalid press only
   // updates the exact existing field errors, then clears busy without a POST.
   state.validation=guestbookValidate(state.values);if(!state.validation.ok)return false;
   const values=guestbookWriteValues(state.values);if(!owned())return false;
   let result;
   try{result=guestbookWriteResult(await write(values));}
   catch(error){
    if(!owned())return false;
    if(authCodes.has(error?.code)){state.writeLocked=true;state.writeError=typeof error?.message==='string'&&error.message?error.message:GUESTBOOK_WRITE_COPY.sessionChanged;try{onSessionError(error);}catch{}return false;}
    if(error?.code==='SESSION_CHANGED'){state.writeLocked=true;state.writeError=GUESTBOOK_WRITE_COPY.sessionChanged;return false;}
    if(error?.delivery==='not_sent'){state.writeError=typeof error?.message==='string'&&error.message?error.message:GUESTBOOK_WRITE_COPY.notSent;state.writeOutcome={accepted:false,error:null,delivery:'not_sent'};return false;}
    // Ambiguous handoff is a browser adaptation, separate from native's bool.
    // Preserve the draft and lock all writes/QR/edits; never claim success.
    state.writeLocked=true;state.writeError=GUESTBOOK_WRITE_COPY.unknown;state.writeOutcome={accepted:false,error:null,delivery:'unknown'};return false;
   }
   if(!owned())return false;
   state.writeOutcome={accepted:result.error===false,error:result.error,delivery:'received'};
   // Known native errortrue retains the form/draft without feedback, clearing,
   // refresh or navigation. Only another explicit press can send again.
   if(result.error)return false;
   state.stage='success';state.writeLocked=true;state.pending=false;state.writePending=false;writeRequest=null;emit();
   if(current())try{onResult(structuredClone(state.writeOutcome));}catch{}
   return true;
  }finally{if(owned()){writeRequest=null;state.pending=false;state.writePending=false;emit();}}
 }
 function back(){if(!current()||!writable||state.stage!=='success'||backUsed)return false;backUsed=true;emit();if(current())try{onBack();}catch{}return true;}
 function dispose(){if(!alive)return;alive=false;request=null;writeRequest=null;prefill={};Object.assign(state,{raw:'',stage:'disposed',pending:false,error:'',unit:null,values:Object.fromEntries(GUESTBOOK_FIELDS.map(field=>[field.id,null])),validation:null});if(writable)Object.assign(state,{writePending:false,writeLocked:true,writeError:'',writeOutcome:null});}
 return {snapshot,setRaw,open,setField,validate,dispose,...(writable?{submit,back}:{})};
}
