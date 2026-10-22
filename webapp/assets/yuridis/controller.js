import {YURIDIS_COPY,yuridisOffices,yuridisRows,yuridisEntries,yuridisOfficeIndex,yuridisUsableId,yuridisLocation,yuridisBoundary} from './model.js';

const authCodes = new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const copy = value => structuredClone(value);
// read returns decoded response data. This module owns no HTTP, credentials,
// storage, GPS, review write, or document request. Abort is logical ownership.
export function createYuridis({read,getFavoriteOfficeId=()=>null,isAuthenticated=()=>false,isCurrent=()=>true,changed=()=>{},onSessionError=()=>{}} = {}) {
  if (typeof read !== 'function') throw new TypeError('YURIDIS_READ_REQUIRED');
  const state = {stage:'idle',offices:[],officeIndex:null,office:null,officeId:null,officeSource:null,rows:[],query:'',detail:null,pending:{offices:false,feed:false,map:false},errors:{offices:'',feed:''},revision:0};
  const requests = {offices:null,feed:null,map:null};
  let alive = true,started = false,selection = null;
  const current = () => alive && isCurrent();
  const snapshot = () => copy({...state,entries:yuridisEntries(state.rows,state.query)});
  const emit = () => { if (current()) changed(snapshot()); };
  const favorite = () => { const id = getFavoriteOfficeId(); return typeof id === 'string' ? id : null; };
  function clearDetail() { requests.map=null;state.pending.map=false;state.detail=null;state.revision++; }
  function clearFeed() { requests.feed=null;state.pending.feed=false;state.rows=[];state.errors.feed='';clearDetail(); }
  function selectContext(index,office,profileId=favorite()) {
    const id=office?.KantorId ?? profileId,source=office?.KantorId!=null?'returned':typeof profileId==='string'?'favorite':null;
    selection={index,office,id,source};
    Object.assign(state,{officeIndex:index,office,officeId:id,officeSource:source});
    return selection;
  }
  const selectedCurrent = selected => selection===selected && (selected.source!=='favorite' || favorite()===selected.id);
  function failure(error,kind,valid) {
    if (!valid()) return false;
    state.errors[kind]=typeof error?.message === 'string' && error.message ? error.message : YURIDIS_COPY.error;
    state.stage='error';
    if (authCodes.has(error?.code)) onSessionError(error);
    return false;
  }
  async function loadFeed(selected) {
    const {id}=selected;
    // Native may pass an empty nonnull ID. The existing browser registry needs
    // a usable identifier; report no-office instead of substituting another ID.
    if (!yuridisUsableId(id)) { state.stage='no-office';emit();return false; }
    const request={};requests.feed=request;state.pending.feed=true;state.stage='loading';emit();
    const owned=()=>current() && requests.feed===request && selection===selected;
    const valid=()=>owned() && selectedCurrent(selected);
    try {
      if (!valid()) return false;
      const response=await read('feed',{kantorId:id});
      if (!valid()) return false;
      state.rows=yuridisRows(response);state.stage=state.rows.length?'ready':'empty';state.revision++;return true;
    } catch(error) { return failure(error,'feed',valid); }
    finally {
      if (owned()) {
        requests.feed=null;state.pending.feed=false;
        if (!selectedCurrent(selected)) {
          // A changed profile retires its fallback read. Capture the new known
          // profile for an explicit refresh; do not issue another request here.
          clearFeed();const replacement=selectContext(selected.index,selected.office);
          state.stage=yuridisUsableId(replacement.id)?'idle':'no-office';
        }
        emit();
      }
    }
  }
  async function selectOffice(index) {
    if (!current() || state.pending.offices || !Number.isInteger(index) || index < 0 || !Object.hasOwn(state.offices,index)) return false;
    if (state.pending.feed && selection?.index===index && selectedCurrent(selection)) return false;
    clearFeed();return loadFeed(selectContext(index,state.offices[index]));
  }
  async function refresh() {
    if (!current() || !started || state.pending.offices || state.pending.feed) return false;
    clearFeed();return loadFeed(selectContext(state.officeIndex,state.office));
  }
  async function start() {
    if (!current() || state.pending.offices) return false;
    started=true;clearFeed();selection=null;Object.assign(state,{offices:[],officeIndex:null,office:null,officeId:null,officeSource:null});state.errors.offices='';
    const request={};requests.offices=request;state.pending.offices=true;state.stage='loading';emit();
    const valid=()=>current() && requests.offices===request;
    let selected=null,officeError=null;
    try {
      if (!valid()) return false;
      const response=await read('offices',{nama:'',tipeKantor:''});
      if (!valid()) return false;
      state.offices=yuridisOffices(response);selected=yuridisOfficeIndex(state.offices,favorite());
    } catch(error) {
      if (!valid()) return false;
      officeError=error;
      if (authCodes.has(error?.code)) return failure(error,'offices',valid);
      state.errors.offices=typeof error?.message==='string' && error.message ? error.message : YURIDIS_COPY.error;
    }
    finally { if (valid()) { requests.offices=null;state.pending.offices=false;if(authCodes.has(officeError?.code))emit(); } }
    if (!current() || authCodes.has(officeError?.code)) return false;
    // Native starts these loaders concurrently. Serial selection here is an
    // explicit browser adaptation. The independently proved profile fallback
    // d0f8e4..d0f958 remains available even if offices are empty or fail. Never
    // invent a dropdown row or accept an office ID from this public interface.
    if (selected!==null) return selectOffice(selected);
    const fallback=selectContext(null,null);
    if (yuridisUsableId(fallback.id)) return loadFeed(fallback);
    state.stage=officeError?'error':'no-office';emit();return false;
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
    if (!current() || !state.detail || state.pending.map || isAuthenticated()!==true || !selection || !selectedCurrent(selection)) return false;
    const mapSelection=selection;
    const detail=state.detail,originalId=detail.item.persilId;
    detail.map={stage:'loading',metadata:null,geometry:null,error:''};
    if (!yuridisUsableId(originalId)) { detail.map.stage='error';detail.map.error=YURIDIS_COPY.mapNotFound;emit();return false; }
    const request={};requests.map=request;state.pending.map=true;emit();
    const owned=()=>current() && requests.map===request && state.detail===detail;
    const valid=()=>owned() && isAuthenticated()===true && selectedCurrent(mapSelection);
    try {
      if (!valid()) return false;
      const response=await read('location',{persilId:originalId});
      if (!valid()) return false;
      const location=yuridisLocation(response);
      if (location.error!==false || !location.data || !yuridisUsableId(location.data.persilId)) {
        detail.map.stage='error';detail.map.error=YURIDIS_COPY.mapNotFound;return false;
      }
      detail.map.metadata=location.data;
      const boundary=await read('boundary',{persilid:location.data.persilId});
      if (!valid()) return false;
      const model=yuridisBoundary(boundary);
      detail.map.geometry=copy(model.data);detail.map.stage=model.status;state.revision++;return true;
    } catch(error) {
      if (!valid()) return false;
      detail.map.stage='error';detail.map.error=typeof error?.message==='string' && error.message ? error.message : YURIDIS_COPY.mapNotFound;
      if (authCodes.has(error?.code)) onSessionError(error);
      return false;
    } finally {
      if (owned()) {
        requests.map=null;state.pending.map=false;
        if(isAuthenticated()!==true || !selectedCurrent(mapSelection)) detail.map={stage:'idle',metadata:null,geometry:null,error:''};
        emit();
      }
    }
  }
  function dispose() {
    if (!alive) return;
    alive=false;selection=null;requests.offices=requests.feed=requests.map=null;
    Object.assign(state,{stage:'disposed',offices:[],officeIndex:null,office:null,officeId:null,officeSource:null,rows:[],query:'',detail:null,pending:{offices:false,feed:false,map:false},errors:{offices:'',feed:''},revision:state.revision+1});
  }
  return {start,selectOffice,refresh,setQuery,openDetail,closeDetail,loadMap,dispose,snapshot};
}
