// One explicit personal-plot intent. The parent owns local staging, the final
// HTTP write and native result feedback/navigation; this module owns no client.
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
export const SWAPLOTTING_SUBMIT_COPY=Object.freeze({
 pending:'Mengirim Swaplotting…',
 unknown:'Hasil pengiriman belum dapat dipastikan. Periksa melalui aplikasi resmi sebelum mengirim kembali.',
 stale:'Formulir atau sesi berubah. Buka kembali Swaplotting sebelum mengirim.',
 notSent:'Kiriman belum dikirim. Periksa kembali draf ini.',
 completion:'Respons pengiriman sudah diterima, tetapi langkah berikutnya belum selesai. Kembali ke peta atau buka kembali layanan sebelum melanjutkan.',
});
export function createSwaplottingSubmit({capture,isSnapshotCurrent,submit,available=()=>false,isCurrent=()=>true,changed=()=>{},onSessionError=()=>{},onResult=()=>{},onBack=()=>false}={}){
 if(typeof capture!=='function'||typeof isSnapshotCurrent!=='function')throw new TypeError('SWAPLOTTING_SUBMIT_OWNER_REQUIRED');
 let alive=true,request=null;
 const capable=typeof submit==='function',state={stage:'idle',pending:false,message:'',requiresReload:false};
 const current=()=>alive&&isCurrent();
 const ready=()=>{try{return capable&&available()===true;}catch{return false;}};
 const sourceCurrent=token=>{try{return !!token?.source&&isSnapshotCurrent(token.source)===true;}catch{return false;}};
 const owns=token=>current()&&request===token&&sourceCurrent(token);
 function release(token=request){if(token)token.source=null;if(request===token)request=null;}
 function stale(){release();Object.assign(state,{stage:'stale',pending:false,message:SWAPLOTTING_SUBMIT_COPY.stale,requiresReload:true});}
 function snapshot(){
  if(request&&current()&&!sourceCurrent(request))stale();
  const locked=state.pending||state.stage==='result'||state.stage==='complete';
  return {...state,capable,locked,canSubmit:current()&&ready()&&!locked&&!state.requiresReload};
 }
 const emit=()=>{if(current())changed(snapshot());};
 function check(token){if(owns(token))return true;if(request===token){stale();emit();}return false;}
 async function begin(){
  if(!snapshot().canSubmit)return false;
  let source;
  try{source=capture();}catch(error){state.stage='error';state.message=typeof error?.message==='string'&&error.message?error.message:SWAPLOTTING_SUBMIT_COPY.notSent;emit();return false;}
  if(!source)return false;
  const token={source};source=null;
  if(!current()||!ready()||!sourceCurrent(token)){release(token);return false;}
  request=token;Object.assign(state,{stage:'submitting',pending:true,message:'',requiresReload:false});emit();
  try{
   if(!check(token)||!ready())return false;
   let result;
   try{
    const reply=await submit(token.source.payload,Object.freeze({isCurrent:()=>owns(token)}));
    if(!check(token))return false;
    if(!reply||typeof reply.success!=='boolean'||reply.attemptId!==undefined&&typeof reply.attemptId!=='string')throw new TypeError('SWAPLOTTING_SUBMIT_RESULT');
    result=Object.freeze({success:reply.success,...(reply.attemptId===undefined?{}:{attemptId:reply.attemptId})});
   }catch(error){
    if(!check(token))return false;
    if(authCodes.has(error?.code)){state.stage='error';state.requiresReload=true;state.message=typeof error.message==='string'?error.message:SWAPLOTTING_SUBMIT_COPY.stale;onSessionError(error);return false;}
    if(error?.code==='SESSION_CHANGED'){stale();emit();return false;}
    if(error?.delivery==='not_sent'){state.stage='error';state.message=typeof error.message==='string'&&error.message?error.message:SWAPLOTTING_SUBMIT_COPY.notSent;return false;}
    state.stage='unknown';state.requiresReload=true;state.message=SWAPLOTTING_SUBMIT_COPY.unknown;return false;
   }
   // Keep the intent locked during asynchronous native feedback. A callback
   // failure must not replay either the upload or an already delivered result.
   state.stage='result';state.pending=false;emit();
   if(!check(token))return false;
   let directive;
   try{directive=await onResult(result);}catch(error){
    if(check(token))Object.assign(state,{stage:'completion-error',requiresReload:true,message:typeof error?.message==='string'&&error.message?error.message:SWAPLOTTING_SUBMIT_COPY.completion});
    return true;
   }
   if(!check(token))return false;
   if(directive?.completionFailed===true){
    Object.assign(state,{stage:'completion-error',requiresReload:true,message:typeof directive.message==='string'&&directive.message?directive.message:SWAPLOTTING_SUBMIT_COPY.completion});
    return true;
   }
   state.stage=result.success?'complete':'idle';state.message='';
   if(result.success&&directive?.backToMap===true){
    release(token);
    // Only the successful parent completion may authorize this synchronous
    // local return. Keep the accepted write locked until that point.
    try{if(onBack()===true)state.stage='idle';}catch{}
    emit();
   }
   return true;
  }finally{
   if(request===token){release(token);state.pending=false;if(state.stage==='submitting')state.stage='idle';emit();}
   else token.source=null;
  }
 }
 function dispose(){if(!alive)return;alive=false;release();Object.assign(state,{stage:'disposed',pending:false,message:'',requiresReload:false});}
 return {begin,snapshot,dispose};
}
