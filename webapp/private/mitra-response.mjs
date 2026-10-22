import {MIMEType} from 'node:util';

// Native6.1.5: analysis/MITRA-READ-CONTRACT-FOLLOWUP-20261021.md.
// These five existing GETs return only their projected native list models.
export const MITRA_READS=Object.freeze(Object.fromEntries([
  ['Mitra/GetPenilaiList',null,['nama'],[]],
  ['Mitra/GetKantorPPAT',null,['kantorId','nama'],['kode']],
  ['Mitra/GetPPATList','kantorId',['nama','alamatKantor','tmtPensiun','totalAkta','isPPAT','nomorSK'],['tempatKedudukan','status']],
  ['Mitra/GetWilayahSurveyor',null,['wilayahId','nama'],[]],
  ['Mitra/GetSurveyorList','wilayahId',['nama','jenisSurveyor','nomorLisensi'],[]],
].map(([path,idField,fields,discarded])=>[path,Object.freeze({idField,fields:Object.freeze(fields),discarded:Object.freeze(discarded)})])));
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail=(message,code='MITRA_RESPONSE_UNRECOGNIZED')=>{throw Object.assign(new Error(message),{code,status:400});};
export function prepareMitraQuery(path,params={}) {
  const contract=Object.hasOwn(MITRA_READS,path)?MITRA_READS[path]:null;
  if(!contract||!record(params))fail('Parameter pembacaan mitra tidak sesuai kontrak.','MITRA_READ_SCOPE');
  const keys=Reflect.ownKeys(params),expected=contract.idField?[contract.idField]:[];
  if(keys.length!==expected.length||keys.some((key,index)=>key!==expected[index]))fail('Parameter pembacaan mitra tidak sesuai kontrak.','MITRA_READ_SCOPE');
  const query=Object.create(null);
  for(const key of expected){const descriptor=Object.getOwnPropertyDescriptor(params,key);if(!descriptor||!Object.hasOwn(descriptor,'value')||typeof descriptor.value!=='string')fail('Referensi mitra harus berupa teks asli dari baris terpilih.','MITRA_READ_SCOPE');query[key]=descriptor.value;}
  return query;
}
function nullableString(object,key) {
  const descriptor=Object.getOwnPropertyDescriptor(object,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value')||descriptor.value!==null&&typeof descriptor.value!=='string')fail('Format daftar mitra belum dikenali.');
  return descriptor.value;
}
export function decodeMitraValue(value,path) {
  const contract=Object.hasOwn(MITRA_READS,path)?MITRA_READS[path]:null;
  if(!contract)fail('Jenis daftar mitra belum dikenali.');
  // Exactly one service-level String decode after the shared transform. A
  // resulting String is not recursively unwrapped, nor is message a fallback.
  if(typeof value==='string'){try{value=JSON.parse(value);}catch{fail('Format daftar mitra belum dikenali.');}}
  if(!record(value))fail('Format daftar mitra belum dikenali.');
  const descriptor=Object.getOwnPropertyDescriptor(value,'data');
  if(!descriptor||!Object.hasOwn(descriptor,'value')||!Array.isArray(descriptor.value))fail('Respons mitra belum memuat daftar.');
  const rows=descriptor.value;
  const data=Array.from({length:rows.length},(_,index)=>{
    const itemDescriptor=Object.getOwnPropertyDescriptor(rows,String(index));
    if(!itemDescriptor||!Object.hasOwn(itemDescriptor,'value')||!record(itemDescriptor.value))fail('Format daftar mitra belum dikenali.');
    const item=itemDescriptor.value;
    for(const key of contract.discarded)nullableString(item,key);
    return Object.fromEntries(contract.fields.map(key=>[key,nullableString(item,key)]));
  });
  return {data};
}
export function decodeMitraBytes(bytes,contentType,path) {
  let jsonMime=false;
  try{const mime=new MIMEType(contentType||'');jsonMime=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{/* Shared text path. */}
  let value;
  try{
    if(jsonMime)value=bytes.length?JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)):null;
    else value=new TextDecoder('utf-8').decode(bytes);
  }catch{fail('Respons daftar mitra tidak dapat diproses.');}
  // Browser MIMEType/JSON parser and String-BOM edges are explicit bounded
  // adaptations. The retained proof does not certify the full parser grammar.
  return decodeMitraValue(value,path);
}
