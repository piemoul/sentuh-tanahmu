// Native jyb/mzb/nzb models; frozen booking-read/selection/date ledgers.
// Raw JSON retains Dart int-vs-double distinction and signed64 integer values.
const numbers=new WeakMap(), MIN=-(1n<<63n), MAX=(1n<<63n)-1n;
const invalid=(code='QUEUE_PREREAD_UNRECOGNIZED')=>{throw Object.assign(new Error('Respons pilihan antrean belum sesuai format layanan.'),{code});};
function record(value){if(!value||typeof value!=='object'||Array.isArray(value)||numbers.has(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();return value;}
function own(value,key){const d=Object.getOwnPropertyDescriptor(value,key);if(!d)return undefined;if(!Object.hasOwn(d,'value'))invalid();return d.value;}
function text(value,key,empty=false,required=false){const v=own(value,key);if(v==null){if(required)invalid();return empty?'':null;}if(typeof v!=='string')invalid();return v;}
function list(value,parse){if(!Array.isArray(value))invalid();return Array.from({length:value.length},(_,i)=>{if(!Object.hasOwn(value,i))invalid();return parse(own(value,String(i)));});}
function raw(text){if(typeof text!=='string')invalid();try{return JSON.parse(text,(_k,v,c)=>{if(typeof v!=='number')return v;if(typeof c?.source!=='string')invalid('QUEUE_RAW_JSON_REQUIRED');const marker=Object.freeze(Object.create(null));numbers.set(marker,{source:c.source,value:v});return marker;});}catch(e){if(e?.code==='QUEUE_RAW_JSON_REQUIRED')throw e;invalid();}}
function numeric(value){if(typeof value==='number')invalid('QUEUE_RAW_JSON_REQUIRED');const n=value&&typeof value==='object'&&numbers.get(value);if(!n)invalid();return n;}
function integer(value){if(value==null)return 0;const n=numeric(value);if(!/^-?(?:0|[1-9]\d*)$/.test(n.source))invalid();if(n.source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_QUEUE_NUMBER');const v=BigInt(n.source);if(v<MIN||v>MAX)invalid('UNSUPPORTED_QUEUE_NUMBER');return v<BigInt(Number.MIN_SAFE_INTEGER)||v>BigInt(Number.MAX_SAFE_INTEGER)?v.toString():Number(v);}
function estimate(value){if(value==null)return 0;const n=numeric(value);if(!/[.eE]/.test(n.source)){if(n.source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_QUEUE_NUMBER');const v=BigInt(n.source);if(v<MIN||v>MAX)invalid('UNSUPPORTED_QUEUE_NUMBER');}if(!Number.isFinite(n.value))invalid('UNSUPPORTED_QUEUE_NUMBER');return n.value;}
export function queuePrereadDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))invalid();
 const [y,m,d]=value.split('-').map(Number),leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(y<1||m<1||m>12||d<1||d>days[m-1])invalid();return value;
}
function dateTime(value,key){
 const v=text(value,key);if(v===null)return null;
 // Deliberate browser subset of native DateTime.parse: strict civil calendar,
 // normal ISO time/offset and finite JS time, with original String preserved.
 const m=/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,6}))?)?(?: ?(?:[zZ]|([+-])(\d{2}):?(\d{2})))?)?$/.exec(v);
 if(!m)invalid();queuePrereadDate(m[1]);
 if(Number(m[2]??0)>23||Number(m[3]??0)>59||Number(m[4]??0)>59||Number(m[7]??0)>23||Number(m[8]??0)>59)invalid();
 if(!Number.isFinite(Date.parse(v.replace(',','.'))))invalid();return v;
}
export function parseQueueBookingOfficesJson(text){const body=record(raw(text));const data=list(own(body,'data'),v=>{record(v);return Object.fromEntries(['id','nama','kantor_id'].map(k=>[k,textField(v,k)]));});return {error:data.length===0,data};}
const textField=(v,k)=>text(v,k);
export function parseQueueBookingLocationsJson(text){const body=record(raw(text));const data=list(own(body,'data'),v=>{record(v);return Object.fromEntries(['id','kantor','nama','alamat'].map(k=>[k,textFieldEmpty(v,k)]));});return {error:data.length===0,data};}
const textFieldEmpty=(v,k)=>text(v,k,true);
export function parseQueueBookingAvailabilityJson(rawText){
 const body=record(raw(rawText)),error=own(body,'error');if(error==null||error===true)return {error:true,data:[]};if(error!==false)invalid();
 return {error:false,data:list(own(body,'data'),v=>{record(v);return {id: text(v,'id',false,true),nama:text(v,'nama',false,true),deskripsi:text(v,'deskripsi'),nomor:text(v,'nomor'),jumlah_antrian_total:integer(own(v,'jumlah_antrian_total')),jumlah_antrian:integer(own(v,'jumlah_antrian')),jam_buka:dateTime(v,'jam_buka'),jam_tutup:dateTime(v,'jam_tutup'),status:integer(own(v,'status')),estimasi:estimate(own(v,'estimasi')),estimasi_message:text(v,'estimasi_message'),is_available:integer(own(v,'is_available'))};})};
}
