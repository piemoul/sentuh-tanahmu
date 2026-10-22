// Cari Bidang direct Cyb/tyb models. No envelope, coordinates or geometry.
// int? is a signed64 native integer. Retain its JSON lexeme until validation
// so 1.0 is not silently an int and wide integer values do not lose precision.
const numbers=new WeakMap(), MIN=-(1n<<63n), MAX=(1n<<63n)-1n;
function invalid(code='PARCEL_LOOKUP_RESPONSE_UNRECOGNIZED'){throw Object.assign(new Error('Respons pencarian bidang belum sesuai format layanan.'),{code});}
function record(value){if(!value||typeof value!=='object'||Array.isArray(value)||numbers.has(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();return value;}
function own(value,key){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor)return undefined;if(!Object.hasOwn(descriptor,'value'))invalid();return descriptor.value;}
function raw(text){if(typeof text!=='string')invalid();try{return JSON.parse(text,(_key,value,context)=>{if(typeof value!=='number')return value;if(typeof context?.source!=='string')invalid('PARCEL_RAW_JSON_REQUIRED');const marker=Object.freeze(Object.create(null));numbers.set(marker,context.source);return marker;});}catch(error){if(error?.code==='PARCEL_RAW_JSON_REQUIRED')throw error;invalid();}}
function nullableText(value,key){const field=own(value,key);if(field==null)return null;if(typeof field!=='string')invalid();return field;}
function nullableInteger(value,key){const field=own(value,key);if(field==null)return null;const source=field&&typeof field==='object'&&numbers.get(field);if(typeof source!=='string'||! /^-?(?:0|[1-9]\d*)$/.test(source))invalid();if(source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_PARCEL_NUMBER');const integer=BigInt(source);if(integer<MIN||integer>MAX)invalid('UNSUPPORTED_PARCEL_NUMBER');return integer<BigInt(Number.MIN_SAFE_INTEGER)||integer>BigInt(Number.MAX_SAFE_INTEGER)?integer.toString():Number(integer);}
function nullableNull(value,key){if(own(value,key)!=null)invalid();return null;}
export function decodeParcelRegionsJson(text){
 try{const rows=raw(text);if(!Array.isArray(rows))invalid();return Array.from({length:rows.length},(_,index)=>{if(!Object.hasOwn(rows,index))invalid();const row=record(own(rows,String(index)));return Object.fromEntries(['Kode','Nama','TipeWilayah','WilayahId'].map(key=>[key,nullableText(row,key)]));});}
 catch(error){if(error?.code==='PARCEL_RAW_JSON_REQUIRED')throw error;throw Object.assign(new Error('Respons wilayah bidang belum sesuai format layanan.'),{code:'PARCEL_REGION_RESPONSE_UNRECOGNIZED'});}
}
export function decodeParcelLookupJson(text){
 const row=record(raw(text));
 // e31134 is the native Null? check: these four fields accept null only.
 return {Alamat:nullableNull(row,'Alamat'),BatasPersil:nullableInteger(row,'BatasPersil'),BatasPersilLegal:nullableInteger(row,'BatasPersilLegal'),Luas:nullableInteger(row,'Luas'),NamaWilayah:nullableNull(row,'NamaWilayah'),NomorIndukBidang:nullableNull(row,'NomorIndukBidang'),PersilId:nullableText(row,'PersilId'),TipeWilayah:nullableNull(row,'TipeWilayah')};
}
