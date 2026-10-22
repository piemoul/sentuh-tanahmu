// Native6.1.5: frozen swaplotting UI6463b44d…, map07d83a8a…, servicef5be0748….
// Point/form drafts and temporary browser camera URLs only. No upload, OTP or submission.
import {swaplottingCoordinateText} from './coordinate-entry.js';
export const SWAPLOTTING_INITIAL_CAMERA=Object.freeze({lat:-0.792918,lng:116.482347,zoom:4.4746});
export const SWAPLOTTING_RIGHTS=Object.freeze([['1','Hak Milik'],['2','Hak Guna Usaha'],['3','Hak Guna Bangunan'],['4','Hak Pakai'],['5','Hak Pengelolaan'],['8','Wakaf']].map(([code,label])=>Object.freeze({code,label})));
export const SWAPLOTTING_BASIS=Object.freeze(['Surat Keterangan Waris','Surat Wasiat','Akta Hibah','Akta Jual Beli','Risalah Lelang','Putusan Pemberian Hak','Ikrar Wakaf','Surat Dibawah Tangan','Kuitansi','Surat Pernyataan Penguasaan','Bukti Lainnya']);
export const SWAPLOTTING_TAX=Object.freeze(['Petok D','Letter C','Girik','Kekitir','Pipil','Verponding','Surat Pemberitahuan Pajak Terhutang','Pajak Hasil Bumi','Dokumen Perpajakan Lain']);
export const SWAPLOTTING_READS=Object.freeze({
 disclaimer:Object.freeze({id:'get-map-getdisclaimer-d29ef0',path:'Map/GetDisclaimer',auth:'optionalSession'}),
 offices:Object.freeze({id:'get-legacy-kantah-d10364',path:'legacy/Kantah',auth:'optionalSession'}),
 regions:Object.freeze({id:'get-legacy-wilayah-d752bc',path:'legacy/Wilayah',auth:'session'}),
});
export const SWAPLOTTING_COPY=Object.freeze({readError:'Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi',owner:'Data pengguna belum tersedia untuk formulir ini.',write:'Kirim belum diaktifkan. Isian ini hanya draf sementara; belum dikirim atau diverifikasi.',point:'Titik draf ini belum diverifikasi sebagai hasil pengukuran atau bukti kunjungan.',photos:'Foto disimpan sementara di browser hingga Anda meninggalkan formulir atau sesi berakhir. Belum diunggah atau diverifikasi.'});
export const SWAPLOTTING_FIELDS=Object.freeze({
 registered:Object.freeze([['office','Kantor','office'],['region','Desa/Kelurahan','region'],['right','Jenis Hak','right'],['number','Nomor Hak','text'],['photos','Foto Dokumen','photos'],['review','Uraian Singkat','text']].map(([id,label,type])=>Object.freeze({id,label,type}))),
 unregistered:Object.freeze([['office','Kantor','office'],['region','Desa/Kelurahan','region'],['address','Alamat Tanah','text'],['basis','Alas Hak','basis'],['basisNumber','Nomor Alas Hak','text'],['basisDescription','Uraian Alas Hak','text'],['tax','Bukti Pajak','tax'],['taxNumber','Nomor Bukti Pajak','text'],['taxDescription','Uraian Bukti Pajak','text'],['photos',' Foto Dokumen','photos'],['review','Uraian Singkat','text']].map(([id,label,type])=>Object.freeze({id,label,type}))),
});
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const failure=kind=>Object.assign(new Error(SWAPLOTTING_COPY.readError),{code:'SWAPLOTTING_'+kind+'_MODEL'});
const nullableString=(row,key,kind)=>{const value=row[key];if(value!=null&&typeof value!=='string')throw failure(kind);return value??null;};
export function swaplottingReadOperation(operations,kind,ready=op=>op.enabled===true){
 const spec=SWAPLOTTING_READS[kind];if(!spec||!Array.isArray(operations))return null;
 return operations.find(op=>op&&op.id===spec.id&&op.path===spec.path&&op.auth===spec.auth&&op.method==='GET'&&op.encoding==='none'&&op.serviceId==='main'&&(op.clientProfile??'main')==='main'&&op.effect==='read'&&op.enabled===true&&ready(op))??null;
}
export function swaplottingDisclaimer(raw){
 let value=raw;if(typeof value==='string'){try{value=JSON.parse(value);}catch{throw failure('DISCLAIMER');}}
 if(!object(value))throw failure('DISCLAIMER');
 return Object.fromEntries(['message','message2','message3','url'].map(key=>[key,nullableString(value,key,'DISCLAIMER')]));
}
export function swaplottingHasMessage(model){return typeof model?.message==='string'&&model.message.length!==0;}
export function swaplottingOffices(rows){
 if(!Array.isArray(rows))throw failure('OFFICE');
 return Array.from(rows,row=>{
  if(!object(row))throw failure('OFFICE');
  // Validate full native jyb before projecting the two UI fields.
  for(const key of ['Alamat','Email','Fax','KantorId','Nama','Telp','Kota'])nullableString(row,key,'OFFICE');
  if(row.TipeKantorId!=null&&(typeof row.TipeKantorId!=='number'||!Number.isInteger(row.TipeKantorId)))throw failure('OFFICE');
  return {KantorId:row.KantorId??null,Nama:row.Nama??null};
 });
}
export function swaplottingRegions(rows){
 if(!Array.isArray(rows))throw failure('REGION');
 return Array.from(rows,row=>{if(!object(row))throw failure('REGION');for(const key of ['Kode','Nama','TipeWilayah','WilayahId'])nullableString(row,key,'REGION');return {code:row.WilayahId??null,name:row.Nama??null};});
}
export function swaplottingEmptyFields(){return {name:null,phone:null,email:null,number:null,review:null,address:null,basisNumber:null,basisDescription:null,taxNumber:null,taxDescription:null};}
// Trusted session-owned account_summary projection only; not a full lCb,
// managed-user import, ownership assertion or date-parser implementation.
export function swaplottingOwnProfile(profile){
 if(!object(profile)||!Number.isInteger(profile.userLevel)||![2,3].includes(profile.userLevel)||profile.isIkd!==false)return null;
 for(const key of ['nama','nomorHp','email'])if(profile[key]!=null&&typeof profile[key]!=='string')return null;
 return {name:profile.nama??'',phone:profile.nomorHp??'',email:profile.email??''};
}
export function swaplottingValidate(kind,model){
 if(!['registered','unregistered'].includes(kind))throw new TypeError('SWAPLOTTING_FORM_KIND');
 const strings=kind==='registered'?['name','phone','email','number','review']:['name','phone','email','address','basisNumber','basisDescription','taxNumber','taxDescription','review'];
 const choices=kind==='registered'?['office','region','right']:['office','region','basis','tax'],errors={};
 for(const key of strings){const value=model.fields?.[key];if(value!=null&&typeof value!=='string')throw new TypeError('SWAPLOTTING_FIELD_TYPE');errors[key]=value==null||value.length===0;}
 for(const key of choices)errors[key]=model[key]==null;
 if(model.photos!=null&&!Array.isArray(model.photos))throw new TypeError('SWAPLOTTING_PHOTO_TYPE');
 errors.photos=model.photos==null||model.photos.length===0;
 // Native flags are retained; Strings are browser-only field feedback.
 return {ok:!Object.values(errors).some(Boolean),flags:errors,errors:Object.fromEntries(Object.entries(errors).map(([key,missing])=>[key,missing?'Isian ini wajib diisi.':null])),missing:Object.keys(errors).filter(key=>errors[key])};
}
// Browser adaptation of native List<String> file paths. Accept only the exact
// same-origin UUID URL shape minted by browser URL.createObjectURL, never a
// remote image, data URL or user-supplied HTML. This does not prove image origin,
// MIME, identity, freshness or physical presence; the camera owner retains bytes.
export function swaplottingPhotoPath(value,origin=globalThis.location?.origin){
 if(typeof value!=='string'||typeof origin!=='string'||!/^https?:\/\//.test(origin))return null;
 try{
  const site=new URL(origin);if(site.origin!==origin||site.username||site.password||site.pathname!=='/'||site.search||site.hash)return null;
  if(!value.startsWith(`blob:${origin}/`)||!/^blob:https?:\/\/[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value))return null;
  const url=new URL(value);return url.protocol==='blob:'&&url.origin===origin&&!url.search&&!url.hash?value:null;
 }catch{return null;}
}
export function swaplottingCamera(value,{zoomRequired=false}={}){
 if(!object(value)||typeof value.lat!=='number'||!Number.isFinite(value.lat)||Math.abs(value.lat)>90||typeof value.lng!=='number'||!Number.isFinite(value.lng)||Math.abs(value.lng)>180)throw new TypeError('SWAPLOTTING_CAMERA_INVALID');
 const camera={lat:value.lat,lng:value.lng};
 if(zoomRequired||value.zoom!==undefined){if(typeof value.zoom!=='number'||!Number.isFinite(value.zoom)||value.zoom<0||value.zoom>21)throw new TypeError('SWAPLOTTING_CAMERA_INVALID');camera.zoom=value.zoom;}
 return camera;
}
export function swaplottingDisclaimerUrl(raw){
 if(typeof raw!=='string'||!/^https?:\/\//i.test(raw)||/[\u0000-\u001f\u007f]/.test(raw))return null;
 try{const url=new URL(raw);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function swaplottingPointText(model){const point=model.screen==='map'?(model.cameraTarget??model.initialCamera):model.point;return point?`Titik tengah peta: ${swaplottingCoordinateText(point.lat)}, ${swaplottingCoordinateText(point.lng)}`:'Titik peta belum tersedia.';}
