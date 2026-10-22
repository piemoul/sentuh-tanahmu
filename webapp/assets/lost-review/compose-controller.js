// Native form/picker contract: analysis/LOST-REVIEW-COMPOSE-UI.md.
// Cancellation and editable recovery after a failed write are browser adaptations.
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
export function createLostReviewComposer({contentId,reviewType='pengumumanSertipikatHilang',write,isCurrent=()=>true,isAuthenticated=()=>false,changed=()=>{},onAccepted=()=>{},onSessionError=()=>{},createObjectURL=file=>URL.createObjectURL(file),revokeObjectURL=url=>URL.revokeObjectURL(url)}={}){
  if(typeof contentId!=='string'||typeof write!=='function'||!['pengumumanSertipikatHilang','sertipikatSaya'].includes(reviewType))throw new TypeError('LOST_REVIEW_COMPOSER_CONTEXT');
  let alive=true,sequence=0,photos=[],request=null;
  const state={stage:'editing',rating:0,comment:null,pending:false,error:'',accepted:false};
  const current=()=>alive&&isCurrent();
  const editable=()=>current()&&isAuthenticated()===true&&!state.pending&&!state.accepted;
  const snapshot=()=>({...state,canSubmit:editable()&&state.rating!==0&&state.comment!==null,photos:photos.map(({id,file,url})=>({id,name:file.name,size:file.size,url}))});
  const emit=()=>{if(current())changed(snapshot());};
  const release=entry=>{if(entry.url){try{revokeObjectURL(entry.url);}catch{}}};
  function setRating(value){if(!editable()||!Number.isInteger(value)||value<1||value>5)return false;state.rating=value;state.error='';emit();return true;}
  function setComment(value){if(!editable()||typeof value!=='string')return false;state.comment=value;state.error='';emit();return true;}
  function addPhoto(file){
    if(!editable()||!(file instanceof Blob)||typeof file.name!=='string')return false;
    // Header restriction belongs to this browser adapter, not the native picker.
    // Check the original name before browser FormData can percent-escape it.
    if(/[\r\n\0\\]/.test(file.name)){state.error='Nama foto belum dapat dikirim dari browser. Pilih berkas dengan nama tanpa karakter kontrol atau garis miring terbalik.';emit();return false;}
    let url=null;try{url=createObjectURL(file);}catch{}
    photos.unshift({id:++sequence,file,url});state.error='';emit();return true;
  }
  function removePhoto(id){if(!editable())return false;const index=photos.findIndex(entry=>entry.id===id);if(index<0)return false;release(photos[index]);photos.splice(index,1);emit();return true;}
  async function submit(){
    if(!editable()||state.rating===0||state.comment===null)return false;
    const token={};request=token;state.pending=true;state.stage='sending';state.error='';emit();
    const owned=()=>current()&&request===token;
    // Preserve original bytes and the newest-first order. The add-photo tile
    // is presentation only and is never included in this array.
    const payload={values:{contentId,reviewType,comment:state.comment,rating:state.rating},files:photos.map(({file},index)=>({key:`reviewPhoto${index+1}`,file}))};
    try{
      if(!owned()||isAuthenticated()!==true)return false;
      const accepted=await write(payload);
      if(!owned()||isAuthenticated()!==true)return false;
      if(accepted!==true)throw new Error('Pengiriman ulasan belum dikonfirmasi layanan.');
      // Mark the mutation accepted before invoking refresh/close callbacks.
      // A rendering or refresh error must never invite a duplicate write.
      state.accepted=true;state.stage='sent';state.pending=false;request=null;
      photos.forEach(release);photos=[];emit();
      try{onAccepted();}catch{}
      return true;
    }catch(error){
      if(!owned()||isAuthenticated()!==true)return false;
      state.stage='editing';state.error='Error while post review! Pengiriman belum terkonfirmasi. Periksa daftar ulasan sebelum mencoba lagi.';
      if(authCodes.has(error?.code))onSessionError(error);
      return false;
    }finally{
      if(owned()){
        state.pending=false;request=null;
        if(isAuthenticated()!==true){photos.forEach(release);photos=[];state.stage='signin';state.comment=null;state.rating=0;state.error='Sesi telah berakhir. Masuk kembali.';}
        emit();
      }
    }
  }
  function dispose(){if(!alive)return;alive=false;request=null;photos.forEach(release);photos=[];state.stage='disposed';state.comment=null;state.rating=0;state.pending=false;state.error='';}
  return {snapshot,setRating,setComment,addPhoto,removePhoto,submit,dispose};
}
