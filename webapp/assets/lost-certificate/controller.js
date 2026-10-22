import {LOST_CERTIFICATE_COPY,lostCertificateOffices,lostCertificateRows,lostCertificateEntries,lostCertificateOfficeIndex,lostCertificateUsableId,lostCertificateLocation,lostCertificateBoundary} from './model.js';

const authCodes = new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const copy = value => structuredClone(value);
// read returns decoded response data. This module owns no HTTP, credentials,
// storage, GPS, review write, or document request. Abort is logical ownership.
export function createLostCertificates({read,getFavoriteOfficeId=()=>null,isAuthenticated=()=>false,isCurrent=()=>true,changed=()=>{},onSessionError=()=>{}} = {}) {
  if (typeof read !== 'function') throw new TypeError('LOST_CERTIFICATE_READ_REQUIRED');
  const state = {stage:'idle',offices:[],officeIndex:null,office:null,rows:[],query:'',detail:null,pending:{offices:false,feed:false,map:false},errors:{offices:'',feed:''},revision:0};
  const requests = {offices:null,feed:null,map:null};
  let alive = true;
  const current = () => alive && isCurrent();
  const snapshot = () => copy({...state,entries:lostCertificateEntries(state.rows,state.query)});
  const emit = () => { if (current()) changed(snapshot()); };
  const favorite = () => { const id = getFavoriteOfficeId(); return typeof id === 'string' ? id : null; };
  function clearDetail() { requests.map=null;state.pending.map=false;state.detail=null;state.revision++; }
  function clearFeed() { requests.feed=null;state.pending.feed=false;state.rows=[];state.errors.feed='';clearDetail(); }
  function failure(error,kind,valid) {
    if (!valid()) return false;
    state.errors[kind]=typeof error?.message === 'string' && error.message ? error.message : LOST_CERTIFICATE_COPY.error;
    state.stage='error';
    if (authCodes.has(error?.code)) onSessionError(error);
    return false;
  }
  async function selectOffice(index) {
    if (!current() || state.pending.offices || !Number.isInteger(index) || index < 0 || !Object.hasOwn(state.offices,index)) return false;
    clearFeed();state.officeIndex=index;state.office=state.offices[index];
    const selected=state.office,id=selected.KantorId ?? favorite();
    // Native may pass an empty nonnull ID. The existing browser registry needs
    // a usable identifier; report no-office instead of substituting another ID.
    if (!lostCertificateUsableId(id)) { state.stage='no-office';emit();return false; }
    const request={};requests.feed=request;state.pending.feed=true;state.stage='loading';emit();
    const valid=()=>current() && requests.feed===request && state.office===selected;
    try {
      const response=await read('feed',{kantorId:id});
      if (!valid()) return false;
      state.rows=lostCertificateRows(response);state.stage=state.rows.length?'ready':'empty';state.revision++;return true;
    } catch(error) { return failure(error,'feed',valid); }
    finally { if (valid()) { requests.feed=null;state.pending.feed=false;emit(); } }
  }
  async function start() {
    if (!current() || state.pending.offices) return false;
    clearFeed();state.offices=[];state.officeIndex=null;state.office=null;state.errors.offices='';
    const request={};requests.offices=request;state.pending.offices=true;state.stage='loading';emit();
    const valid=()=>current() && requests.offices===request;
    let selected=null;
    try {
      const response=await read('offices',{nama:'',tipeKantor:''});
      if (!valid()) return false;
      state.offices=lostCertificateOffices(response);selected=lostCertificateOfficeIndex(state.offices,favorite());
      if (selected===null) state.stage='no-office';
    } catch(error) { return failure(error,'offices',valid); }
    finally { if (valid()) { requests.offices=null;state.pending.offices=false;if(selected===null)emit(); } }
    if (!current()) return false;
    // Native starts these loaders concurrently. Serial selection here is an
    // explicit browser adaptation to avoid guessing an uninitialized office.
    return selected===null ? false : selectOffice(selected);
  }
  function setQuery(value) {
    if (!current() || typeof value !== 'string') return false;
    state.query=value;emit();return true;
  }
  function openDetail(index) {
    if (!current() || state.pending.offices || state.pending.feed || !Number.isInteger(index) || index < 0 || !Object.hasOwn(state.rows,index)) return false;
    clearDetail();state.detail={index,item:state.rows[index],revision:state.revision,map:{stage:'idle',metadata:null,geometry:null,error:''}};emit();return true;
  }
  function closeDetail() {
    if (!current() || !state.detail) return false;
    clearDetail();emit();return true;
  }
  async function loadMap() {
    if (!current() || !state.detail || state.pending.map || isAuthenticated()!==true) return false;
    const detail=state.detail,originalId=detail.item.persilId;
    detail.map={stage:'loading',metadata:null,geometry:null,error:''};
    if (!lostCertificateUsableId(originalId)) { detail.map.stage='error';detail.map.error=LOST_CERTIFICATE_COPY.mapNotFound;emit();return false; }
    const request={};requests.map=request;state.pending.map=true;emit();
    const owned=()=>current() && requests.map===request && state.detail===detail;
    const valid=()=>owned() && isAuthenticated()===true;
    try {
      const response=await read('location',{persilId:originalId});
      if (!valid()) return false;
      const location=lostCertificateLocation(response);
      if (location.error!==false || !location.data || !lostCertificateUsableId(location.data.persilId)) {
        detail.map.stage='error';detail.map.error=LOST_CERTIFICATE_COPY.mapNotFound;return false;
      }
      detail.map.metadata=location.data;
      const boundary=await read('boundary',{persilid:location.data.persilId});
      if (!valid()) return false;
      const model=lostCertificateBoundary(boundary);
      detail.map.geometry=copy(model.data);detail.map.stage=model.status;state.revision++;return true;
    } catch(error) {
      if (!valid()) return false;
      detail.map.stage='error';detail.map.error=typeof error?.message==='string' && error.message ? error.message : LOST_CERTIFICATE_COPY.mapNotFound;
      if (authCodes.has(error?.code)) onSessionError(error);
      return false;
    } finally {
      if (owned()) {
        requests.map=null;state.pending.map=false;
        if(isAuthenticated()!==true) detail.map={stage:'idle',metadata:null,geometry:null,error:''};
        emit();
      }
    }
  }
  function dispose() {
    if (!alive) return;
    alive=false;requests.offices=requests.feed=requests.map=null;
    Object.assign(state,{stage:'disposed',offices:[],officeIndex:null,office:null,rows:[],query:'',detail:null,pending:{offices:false,feed:false,map:false},errors:{offices:'',feed:''},revision:state.revision+1});
  }
  return {start,selectOffice,setQuery,openDetail,closeDetail,loadMap,dispose,snapshot};
}
