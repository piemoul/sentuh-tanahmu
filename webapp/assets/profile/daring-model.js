// Native OEb/PEb model semantics; browser date-widget conversion is separate.
export const DARING_OPERATION_ID='post-perurilivenesssdk-validatektpdatav2-da9a78';
export const DARING_WIRE_KEYS=Object.freeze(['Nik','Nama','Tempatlahir','TglLahir','NoHp']);
export const DARING_FIELDS=Object.freeze([
 {key:'Nama',label:'Nama Lengkap'},
 {key:'Nik',label:'NIK Sesuai KTP'},
 {key:'Tempatlahir',label:'Tempat Lahir'},
 {key:'TglLahir',label:'Tanggal Lahir'},
 {key:'NoHp',label:'No. HP (terhubung dengan WhatsApp)'},
].map(Object.freeze));
export const DARING_COPY=Object.freeze({title:'Verifikasi Akun',heading:'Lengkapi data',instruction:'*Masukkan data diri kamu sesuai dengan KTP.',continue:'Lanjut',incomplete:'Harap lengkapi semua data'});
const errors=Object.freeze({nameEmpty:'Nama tidak boleh kosong',nameSpace:'Nama tidak boleh diawali spasi',nikEmpty:'NIK tidak boleh kosong',nikShort:'NIK harus 16 digit',placeEditEmpty:'Tempat Lahir tidak boleh kosong',placeFinalEmpty:'Tempat lahir tidak boleh kosong',placePattern:'Tempat Lahir hanya boleh mengandung huruf dan spasi.',phoneEditEmpty:'Nomor Telepon tidak boleh kosong',phoneFinalEmpty:'Nomor HP tidak boleh kosong',dateEmpty:'Tanggal lahir tidak boleh kosong'});
const nativeString=value=>{if(value==null)return '';if(typeof value!=='string')throw new TypeError('DARING_MODEL_STRING');return value;};
// Native String.trim also includes NEXT LINE U+0085; raw model stays intact.
const nativeTrim=value=>value.replace(/^[\s\u0085]+|[\s\u0085]+$/g,'');
export function daringValues(source={}){
 if(!source||typeof source!=='object'||Array.isArray(source))throw new TypeError('DARING_MODEL_OBJECT');
 return Object.fromEntries(DARING_WIRE_KEYS.map(key=>[key,nativeString(source[key])]));
}
export function daringSnapshot(source){return Object.freeze(daringValues(source));}
export function daringEditError(key,value){
 const raw=nativeString(value);
 if(key==='Nama')return raw.startsWith(' ')?errors.nameSpace:raw.length===0?errors.nameEmpty:null;
 if(key==='Nik')return raw.length===0?errors.nikEmpty:raw.length<16?errors.nikShort:null;
 if(key==='Tempatlahir')return raw.length===0?errors.placeEditEmpty:/^[A-Za-z][A-Za-z\s]*$/.test(raw)?null:errors.placePattern;
 if(key==='NoHp')return raw.length===0?errors.phoneEditEmpty:null;
 if(key==='TglLahir')return raw.length===0?errors.dateEmpty:null;
 throw new TypeError('DARING_FIELD');
}
export function daringFinalValidation(source){
 const values=daringValues(source),fields={Nama:null,Nik:null,Tempatlahir:null,TglLahir:null,NoHp:null};
 if(!nativeTrim(values.Nama))fields.Nama=errors.nameEmpty;
 const nik=nativeTrim(values.Nik);if(!nik)fields.Nik=errors.nikEmpty;else if(nik.length<16)fields.Nik=errors.nikShort;
 if(!nativeTrim(values.Tempatlahir))fields.Tempatlahir=errors.placeFinalEmpty;
 if(!nativeTrim(values.NoHp))fields.NoHp=errors.phoneFinalEmpty;
 if(values.TglLahir.length===0)fields.TglLahir=errors.dateEmpty;
 return {valid:Object.values(fields).every(value=>value===null),errors:fields};
}
const two=value=>String(value).padStart(2,'0');
const iso=(year,month,day)=>`${String(year).padStart(4,'0')}-${two(month)}-${two(day)}`;
const calendarDate=(year,month,day)=>{const value=new Date(0);value.setUTCFullYear(year,month-1,day);value.setUTCHours(0,0,0,0);return value.getUTCFullYear()===year&&value.getUTCMonth()===month-1&&value.getUTCDate()===day;};
export function daringDateBounds(now=new Date()){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new TypeError('DARING_DATE_CLOCK');
 return {min:'1900-01-01',max:iso(now.getFullYear(),now.getMonth()+1,now.getDate())};
}
export function daringDateFromInput(value,now=new Date()){
 if(value==='')return '';
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new RangeError('DARING_DATE');
 const [year,month,day]=value.split('-').map(Number),bounds=daringDateBounds(now);
 if(!calendarDate(year,month,day)||value<bounds.min||value>bounds.max)throw new RangeError('DARING_DATE');
 return `${two(day)}/${two(month)}/${String(year).padStart(4,'0')}`;
}
export function daringDateForInput(value){
 if(value==null||value==='')return '';
 if(typeof value!=='string'||!/^\d{2}\/\d{2}\/\d{4}$/.test(value))return '';
 const [day,month,year]=value.split('/').map(Number);return calendarDate(year,month,day)?iso(year,month,day):'';
}
