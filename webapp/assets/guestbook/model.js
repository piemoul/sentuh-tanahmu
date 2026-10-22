// Frozen guestbook-followup d0fc1e5e… and guestbook-service-followup9bceab7d….
// Pure local values only. QR metadata read is not an arrival registration.
export const GUESTBOOK_FIELDS=Object.freeze([
 ['name','Nama Lengkap','Nama tidak boleh kosong'],['nik','NIK','NIK tidak boleh kosong'],['phone','Nomor Telepon','Nomor Telepon tidak boleh kosong'],['birthDate','Tanggal Lahir','Tanggal Lahir tidak boleh kosong'],['birthPlace','Tempat Lahir','Tempat Lahir tidak boleh kosong'],['address','Alamat Sesuai KTP','Alamat Sesuai KTP tidak boleh kosong'],['email','Alamat Email','Alamat Email tidak boleh kosong'],['institution','Instansi','Instansi tidak boleh kosong'],['purpose','Keperluan','Keperluan tidak boleh kosong'],
].map(([id,label,empty])=>Object.freeze({id,label,empty})));
export const GUESTBOOK_COPY=Object.freeze({invalidQr:'QrCode is not valid',readError:'Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi',nullData:'Data unit belum tersedia. Coba lagi pembacaan QR kantor.',boundary:'Simpan belum diaktifkan. Pendaftaran kedatangan dilakukan pada kunjungan nyata dan diverifikasi petugas. Halaman ini hanya membaca data unit dan memeriksa isian sementara.'});
// Positive native submit/input ledger ea94f17f… (20261022). These additional
// labels do not change the original QR/read/prefill/aggregate validators.
export const GUESTBOOK_WRITE_COPY=Object.freeze({save:'Simpan',saving:'Menyimpan…',title:'Terimakasih',success:'Buku Tamu Sudah Terisi',back:'Kembali',notSent:'Data belum dikirim. Periksa isian sebelum mencoba kembali.',unknown:'Hasil pengiriman belum dapat dipastikan. Periksa melalui aplikasi resmi atau petugas sebelum mengirim kembali.',sessionChanged:'Sesi atau halaman Buku Tamu sudah berubah. Buka kembali Buku Tamu.'});
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const malformed=()=>Object.assign(new Error(GUESTBOOK_COPY.readError),{code:'GUESTBOOK_RESPONSE_INVALID'});
export function guestbookPrefill(user){
 const values=Object.fromEntries(GUESTBOOK_FIELDS.map(field=>[field.id,null]));
 if(typeof user?.nomorIndukKependudukan==='string')values.nik=user.nomorIndukKependudukan;
 if(typeof user?.email==='string')values.email=user.email;
 return values;
}
export function guestbookParseQr(raw){
 if(typeof raw!=='string'||raw===''||/[\u0000-\u001f\u007f]/.test(raw)||!/^https?:\/\//i.test(raw))return null;
 // Browser adaptation: exact HTTP(S) host, no credentials/custom port.
 // URL is used for the host guard only; never its decoded searchParams.
 try{const url=new URL(raw);if(!['http:','https:'].includes(url.protocol)||url.host!=='persuratan.atrbpn.go.id'||url.username||url.password)return null;}catch{return null;}
 const query=raw.split('?')[1];if(query===undefined)return null;
 let id=null,kd=null;
 for(const part of query.split('&')){
  const role=part.includes('id')?'id':part.includes('kd')?'kd':null;
  if(!role)continue;
  const value=part.split('=')[1];if(value===undefined)return null;
  if(role==='id')id=value;else kd=value;
 }
 return id===null||kd===null?null:{uid:kd,unid:id};
}
export function guestbookValidate(values){
 const errors={};
 for(const field of GUESTBOOK_FIELDS){const value=values?.[field.id];if(value!==null&&value!==undefined&&typeof value!=='string')throw new TypeError('GUESTBOOK_FIELD_TYPE');errors[field.id]=value==null||value.length===0?field.empty:null;}
 if((values?.nik?.length??0)<16)errors.nik='NIK Tidak Boleh Kurang Dari 16 Digit';
 if(values?.email!=null&&!values.email.includes('@'))errors.email='Email Tidak Valid';
 return {ok:Object.values(errors).every(value=>value===null),errors};
}
export function guestbookMetadata(envelope){
 if(!object(envelope))throw malformed();
 let model=null;
 if(envelope.data!=null){
  if(!object(envelope.data))throw malformed();model={};
  for(const key of ['userId','kantorId','unitKerjaId','namaUnitKerja']){const value=envelope.data[key];if(value!=null&&typeof value!=='string')throw malformed();model[key]=value??null;}
 }
 if(envelope.error!=null&&typeof envelope.error!=='boolean'||envelope.message!=null&&typeof envelope.message!=='string')throw malformed();
 // Native GET ignores envelope.error after successful typed parsing.
 return model;
}
function writeRecord(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))throw new TypeError('GUESTBOOK_WRITE_SHAPE');
 for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!Object.hasOwn(descriptor,'value'))throw new TypeError('GUESTBOOK_WRITE_SHAPE');}
 return value;
}
export function guestbookWriteValues(values){
 const keys=GUESTBOOK_FIELDS.map(field=>field.id);writeRecord(values,keys);
 const result={};for(const key of keys){if(typeof values[key]!=='string')throw new TypeError('GUESTBOOK_FIELD_TYPE');result[key]=values[key];}
 // Aggregate validation is raw String length/contains only. No trim,date
 // parsing,formatter guessing or browser identity fields are introduced.
 if(!guestbookValidate(result).ok)throw new TypeError('GUESTBOOK_WRITE_INVALID');
 return result;
}
export function guestbookWriteResult(value){
 writeRecord(value,['error','delivery']);if(typeof value.error!=='boolean'||value.delivery!=='received')throw new TypeError('GUESTBOOK_WRITE_RESULT');
 return {error:value.error,delivery:'received'};
}
export function guestbookInputMode(key){return ['nik','birthDate'].includes(key)?'numeric':key==='phone'?'tel':key==='email'?'email':'text';}
