// Native6.1.5 RAb/BBb: analysis/BERKAS-JOURNEY-UI-FOLLOWUP.md.
// Local snapshot only. No identifier resolution, requests or mutable source rows.
const snapshots=new WeakSet();
const missing=Symbol('missing');
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail=()=>{throw Object.assign(new Error('Data perjalanan berkas belum dapat ditampilkan.'),{code:'BERKAS_JOURNEY_MODEL'});};
function own(value,key){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor)return missing;if(!Object.hasOwn(descriptor,'value'))fail();return descriptor.value;}
function nullable(value,key,type){const raw=own(value,key);if(raw===missing||raw===null)return null;if(typeof raw!==type)fail();return raw;}
function copyRows(rows){
  if(!Array.isArray(rows))fail();
  return Array.from({length:rows.length},(_,index)=>{
    const descriptor=Object.getOwnPropertyDescriptor(rows,String(index));
    if(!descriptor||!Object.hasOwn(descriptor,'value')||!record(descriptor.value))fail();
    const row=descriptor.value;
    return {record:Object.freeze({taskNodeGroupId:nullable(row,'taskNodeGroupId','string'),tanggalFlow:nullable(row,'tanggalFlow','string'),namaGrup:nullable(row,'namaGrup','string'),isCurrent:nullable(row,'isCurrent','boolean')}),sourceIndex:index};
  });
}
export function createJourneySnapshot(value){
  if(!record(value))fail();
  const numberText=own(value,'numberText'),statusText=own(value,'statusText');
  if(typeof numberText!=='string'||typeof statusText!=='string')fail();
  const working=copyRows(own(value,'rows'));
  if(statusText==='0')working.unshift({record:Object.freeze({taskNodeGroupId:'',tanggalFlow:null,namaGrup:null,isCurrent:false}),sourceIndex:null});
  let activeIndex=-1;
  for(let index=working.length-1;index>=0;index--)if(working[index].record.isCurrent===true){activeIndex=index;break;}
  if(activeIndex===-1)for(let index=working.length-1;index>=0;index--){const date=working[index].record.tanggalFlow;if(date!==null&&date!==''){activeIndex=index;break;}}
  if(activeIndex===-1&&working.length)activeIndex=0;
  const rows=Object.freeze(working.map((row,index)=>Object.freeze({...row,ordinal:index+1,state:index<activeIndex?'past':index===activeIndex?'current':'future',isLast:index===working.length-1})));
  const snapshot=Object.freeze({numberText,statusText,activeIndex,rows});snapshots.add(snapshot);return snapshot;
}
function callerIntegerText(value,key){
  const raw=own(value,key);if(raw===missing||raw===null)return 'null';
  // Main ABb has nullable native integers. Reject already rounded browser
  // values rather than pretending to recover an unavailable original integer.
  if(typeof raw!=='number'||!Number.isSafeInteger(raw))fail();
  return String(raw);
}
export function journeySnapshotFromBerkas(value){
  if(!record(value))fail();
  const numberText=callerIntegerText(value,'nomor'),statusText=callerIntegerText(value,'statusBerkas');
  const lower=own(value,'perjalananBerkas'),rows=lower===missing||lower===null?own(value,'PerjalananBerkas'):lower;
  // Native caller asserts a nonnull List. A visible unavailable state is the
  // browser guard; null must never silently become an empty journey.
  return createJourneySnapshot({numberText,statusText,rows});
}
export const isJourneySnapshot=value=>value!==null&&typeof value==='object'&&snapshots.has(value);
