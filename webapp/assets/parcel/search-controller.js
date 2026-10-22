import {parcelSearchRight,parcelSearchNeedsRegion,parcelSearchOffices,parcelSearchRegions,parcelSearchValidation,parcelSearchLookup,parcelSearchBoundary,parcelSearchCopy,parcelSearchUsableId,parcelSearchNibel} from './search-model.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const copy=value=>structuredClone(value);
// read(kind,values) returns decoded data or throws a coded error. The host owns
// HTTP/session access. This controller has no fetch, storage or write actions.
// Proven input/ID helpers are defaults; explicit hooks support bounded tests.
export function createParcelSearch({read,changed=()=>{},onSessionError=()=>{},isCurrent=()=>true,transformNibel=parcelSearchNibel,usableParcelId=parcelSearchUsableId}){
 if(typeof read!=='function')throw new TypeError('PARCEL_READ_REQUIRED');
 if(transformNibel!==null&&typeof transformNibel!=='function'||usableParcelId!==null&&typeof usableParcelId!=='function')throw new TypeError('PARCEL_HELPER_REQUIRED');
 const state={tab:0,right:null,office:null,officeIndex:null,region:null,regionIndex:null,number:null,rawNibel:null,nibel:null,offices:[],regions:[],regionEnabled:true,phase:'idle',pending:{offices:false,regions:false,lookup:false,boundary:false},errors:{offices:'',regions:'',lookup:'',boundary:'',input:''},validation:null,noMatch:false,notFoundTitle:'',suggestion:'',result:null,geometry:null,geometryStatus:'idle',outcomeRevision:0,nibelTransformReady:transformNibel!==null,parcelIdHelperReady:usableParcelId!==null};
 const requests={offices:null,regions:null,lookup:null,boundary:null};let alive=true;
 const current=()=>alive&&isCurrent();
 const snapshot=()=>copy(state);
 const emit=()=>{if(current())changed(snapshot());};
 const invalidateOutcome=()=>{
  requests.lookup=requests.boundary=null;state.pending.lookup=state.pending.boundary=false;
  Object.assign(state,{phase:'idle',validation:null,noMatch:false,notFoundTitle:'',suggestion:'',result:null,geometry:null,geometryStatus:'idle',outcomeRevision:state.outcomeRevision+1});state.errors.lookup=state.errors.boundary='';
 };
 const resetRegions=()=>{requests.regions=null;state.pending.regions=false;state.region=state.regionIndex=null;state.regions=[];state.errors.regions='';};
 const failure=(error,kind,valid)=>{
  if(!valid())return false;
  state.errors[kind]=typeof error?.message==='string'&&error.message?error.message:parcelSearchCopy.serviceError;
  if(authCodes.has(error?.code))onSessionError(error);
  return false;
 };
 async function loadOffices(){
  if(!current()||state.pending.offices)return false;
  invalidateOutcome();resetRegions();state.office=state.officeIndex=null;state.offices=[];state.errors.offices='';
  const request={};requests.offices=request;state.pending.offices=true;emit();
  const valid=()=>current()&&requests.offices===request;
  try{const raw=await read('offices',{});if(!valid())return false;state.offices=parcelSearchOffices(raw);return true;}
  catch(error){return failure(error,'offices',valid);}
  finally{if(valid()){requests.offices=null;state.pending.offices=false;emit();}}
 }
 function selectRight(value){
  if(!current())return false;const code=parcelSearchRight(value);if(code===null)return false;if(state.right===code)return true;
  invalidateOutcome();state.right=code;state.regionEnabled=parcelSearchNeedsRegion(code);emit();return true;
 }
 async function selectOffice(index){
  if(!current()||state.pending.offices||!Number.isInteger(index)||index<0||!state.offices[index])return false;
  invalidateOutcome();resetRegions();state.officeIndex=index;state.office=state.offices[index];
  const office=state.office;
  // Native aggregate checks office presence only; this additional web guard
  // prevents inventing an ID when a typed reference row has no usable ID.
  if(typeof office.KantorId!=='string'||office.KantorId===''){state.errors.regions='Identitas kantor dari layanan belum tersedia.';emit();return false;}
  const request={};requests.regions=request;state.pending.regions=true;emit();
  const valid=()=>current()&&requests.regions===request&&state.office===office;
  try{const raw=await read('regions',{kantorid:office.KantorId,nama:''});if(!valid())return false;state.regions=parcelSearchRegions(raw);return true;}
  catch(error){return failure(error,'regions',valid);}
  finally{if(valid()){requests.regions=null;state.pending.regions=false;emit();}}
 }
 function selectRegion(index){
  if(!current()||state.pending.regions||!state.regionEnabled||!Number.isInteger(index)||index<0||!state.regions[index])return false;
  invalidateOutcome();state.regionIndex=index;state.region=state.regions[index];emit();return true;
 }
 function setTab(tab){if(!current()||(tab!==0&&tab!==1))return false;if(state.tab===tab)return true;invalidateOutcome();state.tab=tab;emit();return true;}
 function setNumber(raw){if(!current()||typeof raw!=='string')return false;if(state.number===raw)return true;invalidateOutcome();state.number=raw;emit();return true;}
 function setNibel(raw){
  if(!current()||typeof raw!=='string')return false;if(state.rawNibel===raw)return true;
  invalidateOutcome();state.rawNibel=raw;state.nibel=null;state.errors.input='';
  if(transformNibel!==null){
   try{const value=transformNibel(raw);if(typeof value!=='string')throw new TypeError('PARCEL_NIBEL_TRANSFORM');state.nibel=value;}
   catch{state.errors.input='NIBEL belum dapat diproses.';emit();return false;}
  }
  emit();return true;
 }
 async function search(){
  if(!current()||state.pending.lookup||state.pending.boundary||state.pending.offices||state.tab===0&&state.pending.regions)return false;
  invalidateOutcome();
  if(state.tab===1&&transformNibel===null){state.phase='not-ready';state.errors.lookup='Pencarian NIBEL belum tersedia.';emit();return false;}
  state.validation=parcelSearchValidation(state);
  if(!state.validation.ok){state.phase='invalid';state.errors.lookup=parcelSearchCopy.invalid;emit();return false;}
  if(state.tab===0&&(typeof state.office.KantorId!=='string'||state.office.KantorId==='')){state.phase='invalid';state.errors.lookup='Identitas kantor dari layanan belum tersedia.';emit();return false;}
  const kind=state.tab===0?'analog':'electronic',tab=state.tab;
  const values=tab===0?{jenishak:state.right,nomorhak:state.number,kantorid:state.office.KantorId,wilayahid:state.region?.code??''}:{nibel:state.nibel,kodehat:''};
  const request={};requests.lookup=request;state.pending.lookup=true;state.phase='searching';emit();
  const valid=()=>current()&&requests.lookup===request;
  try{
   const raw=await read(kind,values);if(!valid())return false;
   // An explicit null lookup is a read error, not a made-up empty response.
   const parcel=parcelSearchLookup(raw);state.result=parcel;state.outcomeRevision++;
   if(usableParcelId===null){state.phase='not-ready';state.errors.lookup='Peta bidang belum tersedia.';return false;}
   const usable=usableParcelId(parcel.PersilId);if(typeof usable!=='boolean')throw new TypeError('PARCEL_ID_HELPER');
   if(!usable){state.noMatch=true;state.phase='not-found';state.notFoundTitle=parcelSearchCopy.notFound;state.suggestion=tab===0?parcelSearchCopy.analogSuggestion:parcelSearchCopy.electronicSuggestion;return false;}
   if(typeof parcel.PersilId!=='string')throw new TypeError('PARCEL_ID_MODEL');
   requests.lookup=null;state.pending.lookup=false;const boundaryRequest={};requests.boundary=boundaryRequest;state.pending.boundary=true;state.geometryStatus='loading';state.phase='boundary';emit();
   const boundaryValid=()=>current()&&requests.boundary===boundaryRequest;
   try{
    const boundary=await read('boundary',{persilid:parcel.PersilId});if(!boundaryValid())return false;
    const geometry=parcelSearchBoundary(boundary);state.geometry=copy(geometry.data);state.geometryStatus=geometry.status;state.phase='result';state.outcomeRevision++;return true;
   }catch(error){if(!boundaryValid())return false;state.geometryStatus=error?.code==='PARCEL_BOUNDARY_MODEL'?'invalid':'error';state.phase='error';return failure(error,'boundary',boundaryValid);}
   finally{if(boundaryValid()){requests.boundary=null;state.pending.boundary=false;emit();}}
  }catch(error){if(!valid())return false;state.phase='error';return failure(error,'lookup',valid);}
  finally{if(valid()){requests.lookup=null;state.pending.lookup=false;emit();}}
 }
 function dispose(){
  if(!alive)return;alive=false;for(const kind of Object.keys(requests)){requests[kind]=null;state.pending[kind]=false;}
  state.offices=[];state.regions=[];state.office=state.officeIndex=state.region=state.regionIndex=null;state.number=state.rawNibel=state.nibel=null;state.result=state.geometry=null;state.outcomeRevision++;state.phase='disposed';state.geometryStatus='idle';state.errors={offices:'',regions:'',lookup:'',boundary:'',input:''};state.validation=null;state.noMatch=false;state.notFoundTitle=state.suggestion='';
 }
 return {snapshot,loadOffices,selectRight,selectOffice,selectRegion,setTab,setNumber,setNibel,search,dispose};
}
