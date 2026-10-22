import {BERKAS_RATING_COPY,berkasRatingEntry,berkasRatingValid,berkasRatingValues,berkasRatingResult} from './model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
// The parent injects a write bound to the original selected source. There is
// no transport, raw Berkas ID, authentication storage or automatic replay.
export function createBerkasRating({entry,write,writeAvailable=()=>true,isCurrent=()=>true,changed=()=>{},onResult=()=>{},onSessionError=()=>{}}={}){
 if(typeof write!=='function')throw new TypeError('BERKAS_RATING_WRITE_REQUIRED');
 const state={entry:berkasRatingEntry(entry),stage:'editing',rating:0,comment:null,pending:false,locked:false,error:'',result:null,revision:0};
 let alive=true,request=null;
 const current=()=>alive&&isCurrent();
 const editable=()=>current()&&!state.pending&&!state.locked&&state.stage==='editing';
 const snapshot=()=>structuredClone({...state,canSubmit:editable()&&writeAvailable()&&berkasRatingValid(state.rating,state.comment),canCancel:current()&&!state.pending&&state.stage==='editing'});
 const emit=()=>{state.revision++;if(current())changed(snapshot());};
 function choose(value){if(!editable()||!Number.isInteger(value)||value<1||value>5)return false;state.rating=value;state.error='';emit();return true;}
 function comment(value){if(!editable()||typeof value!=='string')return false;state.comment=value;state.error='';emit();return true;}
 function cancel(){if(!current()||state.pending||state.stage!=='editing')return false;state.stage='cancelled';state.locked=true;emit();return true;}
 async function submit(){
  if(!editable()||!writeAvailable())return false;
  if(!berkasRatingValid(state.rating,state.comment)){state.error=BERKAS_RATING_COPY.invalid;emit();return false;}
  const values=berkasRatingValues(state.rating,state.comment),token={};request=token;state.pending=true;state.error='';emit();
  const owned=()=>current()&&request===token;
  try{
   if(!owned()||!writeAvailable())return false;
   let outcome;
   try{
    const result=berkasRatingResult(await write(values));
    outcome={...result,exceptional:false,accepted:result.error===false,delivery:'received'};
   }catch(error){
    if(!owned())return false;
    if(authCodes.has(error?.code)){state.locked=true;state.error=typeof error?.message==='string'?error.message:BERKAS_RATING_COPY.sessionChanged;try{onSessionError(error);}catch{}return false;}
    if(error?.code==='SESSION_CHANGED'){state.locked=true;state.error=typeof error?.message==='string'&&error.message?error.message:BERKAS_RATING_COPY.sessionChanged;return false;}
    // A verified local rejection has no delivery ambiguity. Keep the draft for
    // a fresh explicit click; no queued POST is retained or replayed.
    if(error?.delivery==='not_sent'){state.error=typeof error?.message==='string'&&error.message?error.message:BERKAS_RATING_COPY.notSent;return false;}
    // Native controller catch uses first/error=false with error text. Preserve
    // that flag separately from acceptance and lock uncertain delivery.
    outcome={error:false,message:BERKAS_RATING_COPY.fallback,exceptional:true,accepted:false,delivery:'unknown'};
   }
   if(!owned())return false;
   state.result=outcome;state.stage='result';state.locked=true;state.pending=false;request=null;emit();
   if(!current())return false;
   // Commit before the parent pops the composer. A rendering failure cannot
   // deliver the result a second time or restore the write capability.
   try{onResult(structuredClone(outcome));}catch{}
   return true;
  }finally{if(owned()){state.pending=false;request=null;emit();}}
 }
 function dispose(){if(!alive)return;alive=false;request=null;state.entry={numberYear:'',officeName:''};state.stage='disposed';state.rating=0;state.comment=null;state.pending=false;state.locked=true;state.error='';state.result=null;state.revision++;}
 return {choose,comment,cancel,submit,snapshot,dispose};
}
