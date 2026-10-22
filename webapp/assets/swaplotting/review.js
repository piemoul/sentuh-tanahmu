// Local descriptor of the native personal Swaplotting fields. No transport,
// FormData, generated upload filename, sensor or presence assertion.
import {SWAPLOTTING_RIGHTS,SWAPLOTTING_BASIS,SWAPLOTTING_TAX,swaplottingValidate,swaplottingHasMessage,swaplottingCamera,swaplottingPhotoPath} from './model.js';
import {swaplottingCoordinateText,swaplottingCoordinateProvenance} from './coordinate-entry.js';
const trimmed=/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g;
export function swaplottingNativeTrim(value){if(typeof value!=='string')throw new TypeError('SWAPLOTTING_REVIEW_STRING');return value.replace(trimmed,'');}
const fail=()=>{throw Object.assign(new Error('Ringkasan belum dapat dibuat. Periksa profil, pilihan wilayah, isian dan foto draf.'),{code:'SWAPLOTTING_REVIEW_NOT_READY'});};
const scalar=value=>value==null?'':typeof value==='string'?value:fail();
const trim=value=>swaplottingNativeTrim(scalar(value));
function selected(rows,index,value,keys){if(!Array.isArray(rows)||!Number.isInteger(index)||index<0||!rows[index]||!value||keys.some(key=>rows[index][key]!==value[key]))fail();}
const labels={namapemilik:'Nama pemilik',kontaktelp:'Nomor telepon',kontakemail:'Email',tipehakid:'Kode jenis hak',tipehak:'Jenis hak',kantorid:'ID kantor',namakantor:'Kantor',wilayahid:'ID desa/kelurahan',namawilayah:'Desa/Kelurahan',nomorhak:'Nomor hak',alamat:'Alamat tanah',alashak:'Alas hak',nomoralashak:'Nomor alas hak',keteranganalashak:'Uraian alas hak',buktipajak:'Bukti pajak',nomorbuktipajak:'Nomor bukti pajak',keteranganbuktipajak:'Uraian bukti pajak',reviu:'Uraian singkat',lat:'Latitude',lon:'Longitude'};
export function buildSwaplottingReview(model,{getPhoto}={}){
 if(!model||!['registered','unregistered'].includes(model.screen)||typeof getPhoto!=='function')fail();
 if(model.disclaimerStatus!=='ready'||swaplottingHasMessage(model.disclaimer)&&model.disclaimerAcknowledged!==true||model.pending?.offices||model.pending?.regions)fail();
 if(model.owner?.status!=='ready'||model.owner.source!=='account-summary-own-profile'||!model.owner.data)fail();
 for(const key of ['name','phone','email'])if(model.fields?.[key]!==model.owner.data[key])fail();
 if(!swaplottingValidate(model.screen,model).ok)fail();
 selected(model.offices,model.officeIndex,model.office,['KantorId','Nama']);selected(model.regions,model.regionIndex,model.region,['code','name']);
 if(typeof model.office.KantorId!=='string'||!model.office.KantorId||typeof model.region.code!=='string'||!model.region.code)fail();
 const point=swaplottingCamera(model.point);
 const provenance=model.pointProvenance;
 if(['manual-coordinate','session-point'].includes(provenance?.kind))swaplottingCoordinateProvenance(provenance,point);
 else if(!['map-camera','initial-viewport'].includes(provenance?.kind)||provenance.kind!==model.point.source)fail();
 const fields=model.fields,rawByKey={namapemilik:fields.name,kontaktelp:fields.phone,kontakemail:fields.email,reviu:fields.review};
 const entries=[['id','id'],['kluster','K4'],['namapemilik',trim(fields.name)],['kontaktelp',trim(fields.phone)],['kontakemail',trim(fields.email)]];
 if(model.screen==='registered'){
  const right=SWAPLOTTING_RIGHTS.find(row=>row.code===model.right);if(!right)fail();
  entries.push(['tipehakid',right.code],['tipehak',right.label]);rawByKey.nomorhak=fields.number;
 }else{
  if(!Number.isInteger(model.basisIndex)||SWAPLOTTING_BASIS[model.basisIndex]!==model.basis||!Number.isInteger(model.taxIndex)||SWAPLOTTING_TAX[model.taxIndex]!==model.tax)fail();
  entries.push(['alamat',trim(fields.address)],['alashak',model.basis],['nomoralashak',scalar(fields.basisNumber)],['keteranganalashak',trim(fields.basisDescription)],['buktipajak',model.tax],['nomorbuktipajak',scalar(fields.taxNumber)],['keteranganbuktipajak',trim(fields.taxDescription)]);
  Object.assign(rawByKey,{alamat:fields.address,keteranganalashak:fields.basisDescription,keteranganbuktipajak:fields.taxDescription});
 }
 entries.push(['kantorid',model.office.KantorId],['namakantor',scalar(model.office.Nama)],['wilayahid',model.region.code],['namawilayah',scalar(model.region.name)]);
 if(model.screen==='registered')entries.push(['nomorhak',trim(fields.number)]);
 entries.push(['reviu',trim(fields.review)],['lat',swaplottingCoordinateText(point.lat)],['lon',swaplottingCoordinateText(point.lng)]);
 const photos=Array.from(model.photos,(path,index)=>{
  if(!swaplottingPhotoPath(path,model.photoOrigin))fail();
  const handle=getPhoto(path);
  if(!handle||typeof handle.arrayBuffer!=='function'||!Number.isSafeInteger(handle.size)||handle.size<=0||!['image/jpeg','image/png','image/webp'].includes(handle.type))fail();
  return Object.freeze({kind:'file',name:'file',ordinal:index+1,byteLength:handle.size,sourceMediaType:handle.type,filename:null,filenamePolicy:'native-32-lowercase-hex-generator-unresolved',mediaTypePolicy:'native-initial-resolver-application/octet-stream',handle});
 });
 const dto=Object.freeze(Object.fromEntries([...entries,['file',Object.freeze(photos)]]));
 const parts=Object.freeze([...entries.map(([name,value])=>Object.freeze({kind:'field',name,value})),...photos]);
 const display=entries.filter(([key])=>!['id','kluster','tipehakid','kantorid','wilayahid'].includes(key)).map(([key,value])=>Object.freeze({key,label:labels[key],value,trimmed:Object.hasOwn(rawByKey,key)&&rawByKey[key]!==value}));
 return Object.freeze({kind:model.screen,dto,parts,display:Object.freeze(display),coordinateFormatting:'browser-binary64-string-preserve-negative-zero; native-text-parity-unproven',provenance:structuredClone(provenance),submitted:false});
}
