import {questionRows,hasQuestionText}from'./model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
export function createBerkasQuestion({read,write,isCurrent=()=>true,changed=()=>{},onSessionError=()=>{}}={}){
 if(typeof read!=='function'||typeof write!=='function')throw new TypeError('BERKAS_QUESTION_TRANSPORT');
 const state={rows:[],draft:'',readBusy:false,sendBusy:false,readError:'',sendNotice:'',locked:false,historyRevision:0};let alive=true,readToken=null,sendToken=null;
 const current=()=>alive&&isCurrent()===true;
 const snapshot=()=>structuredClone(state);
 const emit=()=>{if(current())changed(snapshot());};
 const sessionError=error=>{if(authCodes.has(error?.code)){state.locked=true;onSessionError(error);return true;}if(error?.code==='SESSION_CHANGED'){state.locked=true;state.sendNotice='Sesi percakapan berubah. Buka kembali detail berkas.';return true;}return false;};
 function draft(value){if(!current()||state.locked||typeof value!=='string')return false;state.draft=value;emit();return true;}
 async function load(){
  if(!current()||state.readBusy||state.sendBusy||state.locked)return false;
  const token={};readToken=token;state.readBusy=true;state.readError='';state.historyRevision++;emit();const owned=()=>current()&&readToken===token;
  try{const rows=questionRows(await read());if(!owned())return false;state.rows=rows;return true;}
  catch(error){if(!owned())return false;state.rows=[];if(!sessionError(error))state.readError='Riwayat percakapan belum dapat dimuat.';return false;}
  finally{if(owned()){readToken=null;state.readBusy=false;state.historyRevision++;emit();}}
 }
 async function send(){
  if(!current()||state.sendBusy||state.locked||!hasQuestionText(state.draft))return false;
  const content=state.draft,token={};sendToken=token;
  // Native UI starts the async send and immediately clears its editor. The
  // send-busy state spans the service response and awaited history refresh.
  state.draft='';state.sendBusy=true;state.sendNotice='';emit();const owned=()=>current()&&sendToken===token;
  try{
   const result=await write(content);if(!owned())return false;
   if(!result||typeof result.data?.success!=='boolean')throw new TypeError('BERKAS_QUESTION_RESULT');
   if(result.delivery==='unknown')state.sendNotice='Hasil pengiriman belum terkonfirmasi. Periksa riwayat sebelum mengirim pesan yang sama.';
   if(result.data.success===true){
    readToken=null;state.readBusy=false;state.historyRevision++;
    if(result.refresh?.success===true){try{state.rows=questionRows(result.refresh.result?.data);state.readError='';}catch{state.rows=[];state.readError='Pesan diterima, tetapi riwayat terbaru belum dapat dimuat.';}}
    else{state.rows=[];state.readError='Pesan diterima, tetapi riwayat terbaru belum dapat dimuat.';}
   }
   return result.data.success;
  }catch(error){if(!owned())return false;if(!sessionError(error))state.sendNotice=error?.delivery==='not_sent'&&error?.code!=='BERKAS_QUESTION_UNCONFIRMED'?'Pesan belum dikirim. Ketik kembali setelah memeriksa koneksi.':'Hasil pengiriman belum terkonfirmasi. Periksa riwayat sebelum mengirim pesan yang sama.';return false;}
  finally{if(owned()){sendToken=null;state.sendBusy=false;emit();}}
 }
 function dispose(){if(!alive)return;alive=false;readToken=null;sendToken=null;state.rows=[];state.draft='';state.readBusy=false;state.sendBusy=false;state.readError='';state.sendNotice='';state.locked=true;}
 return Object.freeze({draft,load,send,dispose,snapshot});
}
