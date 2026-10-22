// Static model bindings: analysis/LOST-REVIEW-PROTOCOL.md (native 6.1.5).
// Wide native ints travel as exact decimal Strings through the browser bridge.
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const invalid=()=>Object.assign(new TypeError('Respons ulasan belum sesuai kontrak layanan.'),{code:'LOST_REVIEW_MODEL'});
function own(row,key){const descriptor=Object.getOwnPropertyDescriptor(row,key);if(!descriptor)return null;if(!Object.hasOwn(descriptor,'value'))throw invalid();return descriptor.value??null;}
function string(row,key){const value=own(row,key);if(value!==null&&typeof value!=='string')throw invalid();return value;}
function integer(row,key){
  const value=own(row,key);if(value===null||Number.isSafeInteger(value))return value;
  if(typeof value!=='string'||!/^-?(?:0|[1-9]\d{0,18})$/.test(value))throw invalid();
  const integer=BigInt(value);
  if(integer<-(1n<<63n)||integer>=(1n<<63n)||integer>=BigInt(Number.MIN_SAFE_INTEGER)&&integer<=BigInt(Number.MAX_SAFE_INTEGER))throw invalid();
  return value;
}
function photo(row){if(!object(row))throw invalid();return Object.fromEntries(['mediaId','mediaUrl','createdAt'].map(key=>[key,string(row,key)]));}
function review(row){
  if(!object(row))throw invalid();
  const photos=own(row,'reviewPhotos');if(photos!==null&&!Array.isArray(photos))throw invalid();
  return {reviewId:string(row,'reviewId'),rating:integer(row,'rating'),comment:string(row,'comment'),createdAt:string(row,'createdAt'),reviewPhotos:photos===null?null:Array.from(photos,photo)};
}
export function lostReviewEnvelope(value){
  if(!object(value))throw invalid();
  const error=own(value,'error'),data=own(value,'data');
  if(error!==null&&typeof error!=='boolean'||data!==null&&!Array.isArray(data))throw invalid();
  return {totalRecords:integer(value,'totalRecords'),resultsCount:integer(value,'resultsCount'),pageSize:integer(value,'pageSize'),pageNumber:integer(value,'pageNumber'),error,message:string(value,'message'),data:data===null?null:Array.from(data,review)};
}
export function lostReviewRows(value){const envelope=lostReviewEnvelope(value);if(envelope.data===null)throw invalid();return envelope.data;}
