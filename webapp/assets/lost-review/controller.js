import {lostReviewRows} from './model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
// One detail owner, the native first page only. No credentials, storage, writes,
// user identity, or request fields inferred from another announcement.
export function createLostReview({read,isCurrent=()=>true,isAuthenticated=()=>false,changed=()=>{},onSessionError=()=>{}}={}){
  if(typeof read!=='function')throw new TypeError('LOST_REVIEW_READ_REQUIRED');
  const state={stage:'idle',contentId:null,rows:[],pending:false,error:''};
  let alive=true,request=null;
  const current=()=>alive&&isCurrent();
  const snapshot=()=>structuredClone(state);
  const emit=()=>{if(current())changed(snapshot());};
  async function start(contentId){
    if(!current()||state.pending)return false;
    state.contentId=typeof contentId==='string'?contentId:null;state.rows=[];state.error='';
    if(isAuthenticated()!==true){state.stage='signin';emit();return false;}
    // Native asserts nonnull. This guard reports missing data instead of
    // substituting persilId/dI304Id or crashing the browser.
    if(typeof contentId!=='string'){state.stage='error';state.error='Ulasan pengumuman ini belum dapat dimuat.';emit();return false;}
    const token={};request=token;state.stage='loading';state.pending=true;emit();
    const owned=()=>current()&&request===token;
    const valid=()=>owned()&&isAuthenticated()===true;
    try{
      if(!valid())return false;
      const response=await read({reviewType:'pengumumanSertipikatHilang',contentId,pageNumber:'1',pageSize:'10'});
      if(!valid())return false;
      state.rows=lostReviewRows(response);state.stage=state.rows.length?'ready':'empty';return true;
    }catch(error){
      if(!valid())return false;
      state.stage='error';state.error=typeof error?.message==='string'&&error.message?error.message:'Gagal mengambil ulasan.';
      if(authCodes.has(error?.code))onSessionError(error);
      return false;
    }finally{
      if(owned()){
        request=null;state.pending=false;
        if(isAuthenticated()!==true){state.rows=[];state.error='';state.stage='signin';}
        emit();
      }
    }
  }
  function dispose(){if(!alive)return;alive=false;request=null;Object.assign(state,{stage:'disposed',contentId:null,rows:[],pending:false,error:''});}
  // A successful write replaces the native Future even if the previous read
  // has not settled. Its old result must not overwrite the post-write reread.
  function reload(){if(!current())return Promise.resolve(false);request=null;state.pending=false;return start(state.contentId);}
  return {start,refresh:()=>start(state.contentId),reload,snapshot,dispose};
}
