import {RATING_PPAT_COPY,ratingPPATEntry,ratingPPATGroups,ratingPPATChoice,ratingPPATCount,ratingPPATWriteValues,ratingPPATResult} from './model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
// The parent owns the selected Akta and its session/navigation epoch. read()
// is the questionnaire GET only. The optional write uses the original entry
// and Map value order; the parent owns navigation after either returned bool.
export function createRatingPPAT({entry,read,write,writeAvailable=()=>true,isCurrent=()=>true,changed=()=>{},onSessionError=()=>{},onResult=()=>{}}={}){
 if(typeof read!=='function')throw new TypeError('RATING_PPAT_READ_REQUIRED');
 const state={stage:'idle',entry:ratingPPATEntry(entry),groups:[],selection:new Map(),pending:false,error:'',revision:0,writeCapable:typeof write==='function',writePending:false,writeError:'',writeRequiresReload:false,resultDelivered:false};
 let alive=true,attempted=false,request=null,writeRequest=null;
 const current=()=>alive&&isCurrent();
 const snapshot=()=>structuredClone({...state,...ratingPPATCount(state.groups,state.selection)});
 const emit=()=>{state.revision++;if(current())changed(snapshot());};
 async function load(){
  if(!current()||state.pending||state.writePending)return false;
  attempted=true;const token={};request=token;state.groups=[];state.selection.clear();state.error='';state.writeError='';state.writeRequiresReload=false;state.resultDelivered=false;state.stage='loading';state.pending=true;emit();
  const valid=()=>current()&&request===token;
  try{const response=await read();if(!valid())return false;state.groups=ratingPPATGroups(response);state.stage=state.groups.length?'ready':'empty';return true;}
  catch(error){if(!valid())return false;state.groups=[];state.selection.clear();state.stage='error';state.error=typeof error?.message==='string'&&error.message?error.message:RATING_PPAT_COPY.error;if(authCodes.has(error?.code))onSessionError(error);return false;}
  finally{if(valid()){request=null;state.pending=false;emit();}}
 }
 function start(){return attempted?Promise.resolve(false):load();}
 function retry(){return attempted?load():Promise.resolve(false);}
 function choose(groupIndex,answerIndex){if(!current()||state.pending||state.writePending||state.resultDelivered||state.stage!=='ready')return false;const choice=ratingPPATChoice(state.groups,groupIndex,answerIndex);if(!choice)return false;state.selection.set(choice.groupId,choice.answerId);if(!state.writeRequiresReload)state.writeError='';emit();return true;}
 async function submit(){
  if(!current()||!state.writeCapable||!writeAvailable()||state.pending||state.writePending||state.writeRequiresReload||state.resultDelivered||!['ready','empty'].includes(state.stage))return false;
  if(ratingPPATCount(state.groups,state.selection).incomplete){state.writeError=RATING_PPAT_COPY.incomplete;emit();return false;}
  const values=ratingPPATWriteValues(state.entry,state.selection),token={};writeRequest=token;state.writePending=true;state.writeError='';emit();
  const owned=()=>current()&&writeRequest===token;
  try{
   if(!owned()||!writeAvailable())return false;
   let result;
   try{result=ratingPPATResult(await write(values));}
   catch(error){
    if(!owned())return false;
    if(authCodes.has(error?.code)){state.writeError=typeof error.message==='string'?error.message:RATING_PPAT_COPY.writeFallback;onSessionError(error);return false;}
    if(error?.code==='SESSION_CHANGED'){state.writeError=typeof error.message==='string'&&error.message?error.message:RATING_PPAT_COPY.sessionChanged;state.writeRequiresReload=true;return false;}
    result={success:false,message:RATING_PPAT_COPY.writeFallback};
   }
   if(!owned())return false;
   // Delivery is not persistence. Lock before parent callbacks so a rendering
   // error cannot cause a second POST or replay the already delivered result.
   state.resultDelivered=true;state.writePending=false;writeRequest=null;emit();
   if(!current())return false;
   try{onResult(result);}catch{}
   return true;
  }finally{if(owned()){writeRequest=null;state.writePending=false;emit();}}
 }
 function dispose(){if(!alive)return;alive=false;request=null;writeRequest=null;attempted=false;state.entry={aktaId:'',namaPPAT:''};state.groups=[];state.selection.clear();state.pending=false;state.error='';state.writePending=false;state.writeError='';state.writeRequiresReload=false;state.resultDelivered=false;state.stage='disposed';state.revision++;}
 return {start,retry,choose,snapshot,dispose,...(state.writeCapable?{submit}:{})};
}
