// Native review/all: yyb metadata -> zyb rows -> Ayb photos. Dates stay raw.
// The service receives a Map after the shared transformer, never JSON-decodes
// another String. Exact integer lexemes avoid IEEE rounding; signed64 values
// outside JS safe precision use the existing browser decimal-String adaptation.
const numericTokens=new WeakMap(),MIN=-(1n<<63n),MAX=(1n<<63n)-1n;
function invalid(code='LOST_REVIEW_RESPONSE_UNRECOGNIZED') {
  throw Object.assign(new Error('Respons ulasan pengumuman belum sesuai kontrak layanan.'),{code});
}
function record(value) {
  if(value===null||typeof value!=='object'||Array.isArray(value)||numericTokens.has(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();
  return value;
}
function own(row,key) {
  const descriptor=Object.getOwnPropertyDescriptor(row,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value'))invalid();
  return descriptor.value;
}
function nullableString(row,key) {
  const value=own(row,key);if(value==null)return null;if(typeof value!=='string')invalid();return value;
}
function nullableInteger(row,key) {
  const value=own(row,key);if(value==null)return null;
  const source=value&&typeof value==='object'&&numericTokens.get(value);
  if(typeof source!=='string'||! /^-?(?:0|[1-9]\d*)$/.test(source))invalid();
  if(source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_LOST_REVIEW_NUMBER');
  const integer=BigInt(source);if(integer<MIN||integer>MAX)invalid('UNSUPPORTED_LOST_REVIEW_NUMBER');
  return integer<BigInt(Number.MIN_SAFE_INTEGER)||integer>BigInt(Number.MAX_SAFE_INTEGER)?integer.toString():Number(integer);
}
function nullableList(value,parse) {
  if(value==null)return null;if(!Array.isArray(value))invalid();
  return Array.from({length:value.length},(_,index)=>{if(!Object.hasOwn(value,index))invalid();return parse(own(value,String(index)));});
}
function photo(value) {
  const row=record(value);
  return Object.fromEntries(['mediaId','mediaUrl','createdAt'].map(key=>[key,nullableString(row,key)]));
}
function review(value) {
  const row=record(value);
  return {reviewId:nullableString(row,'reviewId'),rating:nullableInteger(row,'rating'),comment:nullableString(row,'comment'),createdAt:nullableString(row,'createdAt'),reviewPhotos:nullableList(own(row,'reviewPhotos'),photo)};
}
export function decodeLostReviewJson(text) {
  if(typeof text!=='string')invalid();
  let parsed;
  try {
    parsed=JSON.parse(text,(_key,value,context)=>{
      if(typeof value!=='number')return value;
      if(typeof context?.source!=='string')invalid('LOST_REVIEW_RAW_JSON_REQUIRED');
      const marker=Object.freeze(Object.create(null));numericTokens.set(marker,context.source);return marker;
    });
  }catch(error){if(error?.code==='LOST_REVIEW_RAW_JSON_REQUIRED')throw error;invalid();}
  const body=record(parsed),error=own(body,'error');
  if(error!=null&&typeof error!=='boolean')invalid();
  return {totalRecords:nullableInteger(body,'totalRecords'),resultsCount:nullableInteger(body,'resultsCount'),pageSize:nullableInteger(body,'pageSize'),pageNumber:nullableInteger(body,'pageNumber'),error:error??null,message:nullableString(body,'message'),data:nullableList(own(body,'data'),review)};
}
