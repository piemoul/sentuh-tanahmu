// XQb PlotBidang reads, distinct from personal /apis/Swaplotting uploads.
// Frozen swaplotting-service-followup f5be0748…: required envelope error bool,
// required WQb fields, nullable UQb metadata, and discarded VQb validation.
const numbers=new WeakMap(),MIN=-(1n<<63n),MAX=(1n<<63n)-1n;
function invalid(code='PLOT_READ_RESPONSE_UNRECOGNIZED'){throw Object.assign(new Error('Respons plot bidang belum sesuai format layanan.'),{code});}
function record(value){if(!value||typeof value!=='object'||Array.isArray(value)||numbers.has(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();return value;}
function own(value,key){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor)return undefined;if(!Object.hasOwn(descriptor,'value'))invalid();return descriptor.value;}
function raw(text){if(typeof text!=='string')invalid();try{return JSON.parse(text,(_key,value,context)=>{if(typeof value!=='number')return value;if(typeof context?.source!=='string')invalid('PLOT_RAW_JSON_REQUIRED');const marker=Object.freeze(Object.create(null));numbers.set(marker,{source:context.source,value});return marker;});}catch(error){if(error?.code==='PLOT_RAW_JSON_REQUIRED')throw error;invalid();}}
function numeric(value){const number=value&&typeof value==='object'&&numbers.get(value);if(!number)invalid();return number;}
function integer(value){const n=numeric(value);if(!/^-?(?:0|[1-9]\d*)$/.test(n.source))invalid();if(n.source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_PLOT_NUMBER');const result=BigInt(n.source);if(result<MIN||result>MAX)invalid('UNSUPPORTED_PLOT_NUMBER');return result<BigInt(Number.MIN_SAFE_INTEGER)||result>BigInt(Number.MAX_SAFE_INTEGER)?result.toString():Number(result);}
function number(value){const n=numeric(value);if(!/[.eE]/.test(n.source)&&n.source.replace(/^-/,'').length<=19){const i=BigInt(n.source);if(i>=MIN&&i<=MAX)return integer(value);}if(!Number.isFinite(n.value))invalid('UNSUPPORTED_PLOT_NUMBER');return n.value;}
function string(value){if(typeof value!=='string')invalid();return value;}
function nullable(value,parse){return value==null?null:parse(value);}
function list(value,parse){if(!Array.isArray(value))invalid();return Array.from({length:value.length},(_,index)=>{if(!Object.hasOwn(value,index))invalid();return parse(own(value,String(index)));});}
const nativeWhitespace=/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g;
function geometryLeaf(value){
 // plot-number-followup81ce3ef5… proves native Unicode edge trim and direct
 // Infinity/-Infinity/NaN/-NaN success paths. These values are discarded, so
 // never apply the finite-JSON-output policy used for retained num metadata.
 // The decimal/exponent String syntax remains an explicit browser adaptation
 // around a native bootstrap parser whose complete grammar is not in libapp.
 if(typeof value==='string'){
  if(!/^(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|-?(?:Infinity|NaN))$/.test(value.replace(nativeWhitespace,'')))invalid('PLOT_GEOMETRY_VALIDATION_UNRECOGNIZED');
 }else numeric(value);
}
function validateDelineasi(value){
 if(value==null)return;
 record(value);string(own(value,'type'));
 list(own(value,'coordinates'),first=>list(first,second=>list(second,geometryLeaf)));
 //9b98a0's VQb result is discarded; do not return or synthesize a geometry.
}
function wqb(value){record(value);return {plotId:string(own(value,'plotId')),nup:string(own(value,'nup')),wilayah:string(own(value,'wilayah')),statusVerifikasi:integer(own(value,'statusVerifikasi')),statusTerdaftar:integer(own(value,'statusTerdaftar')),tanggal:string(own(value,'tanggal'))};}
const fields=[['nup',string],['jenisInstansi',integer],['wilayahId',string],['wilayah',string],['kantorId',string],['kantor',string],['alamat',string],['jenisHakId',string],['jenisHak',string],['nomorHak',string],['statusVerifikasi',integer],['keterangan',string],['nib',string],['nibel',string],['penguasaan',string],['pemilikan',string],['pemanfaatan',string],['penggunaan',string],['permasalahan',string],['luas',number],['luasDelineasi',number],['reviu',string],['rutr',string],['batasUtara',string],['batasTimur',string],['batasSelatan',string],['batasBarat',string]];
function uqb(value){record(value);const result={};for(const [key,parse]of fields){if(key==='luas')validateDelineasi(own(value,'delineasi'));result[key]=nullable(own(value,key),parse);}return result;}
function envelope(text,parse){const body=record(raw(text)),error=own(body,'error');if(typeof error!=='boolean')invalid();if(error)return {error:true,data:null};return {error:false,data:parse(own(body,'data'))};}
export function decodePlotListJson(text){return envelope(text,value=>list(value,wqb));}
export function decodePlotDetailJson(text){return envelope(text,uqb);}
