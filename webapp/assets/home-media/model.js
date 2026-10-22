// Native contracts: home-media-followup/flow-final.json. URL policy and safe
// integer rejection below are browser adaptations, not native/provider parity.
export const HOME_MEDIA_OPERATIONS=Object.freeze({banner:'get-banner-d22854',youtube:'get-youtube-getyoutubelist-d2d384'});
const message='Informasi Beranda belum dapat dimuat. Coba muat ulang.';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const own=(value,key)=>Object.hasOwn(value,key)?value[key]:undefined;
const invalid=()=>{throw new TypeError('HOME_MEDIA_RESPONSE_INVALID');};
const failure=(code='HOME_MEDIA_RESPONSE_INVALID')=>({ok:false,rows:[],code,error:message});
function nullableString(value){if(value!=null&&typeof value!=='string')invalid();return value??null;}
function nullableInteger(value){
 // The browser receives already-decoded JSON. Never accept an unsafe integer
 // which may have lost native signed64 precision; do not coerce String/num.
 // Decoded Number cannot recover native JSON int-vs-double identity (1 vs1.0).
 if(value!=null&&!Number.isSafeInteger(value))invalid();return value??null;
}
function rows(value,fields){
 if(!Array.isArray(value))invalid();
 const result=[];
 for(let index=0;index<value.length;index++){
  if(!Object.hasOwn(value,index)||!object(value[index]))invalid();
  const row={};for(const [key,parse]of fields)row[key]=parse(own(value[index],key));result.push(row);
 }
 return result;
}
const bannerFields=[['bannerId',nullableString],['sequenceId',nullableInteger],['bannerUrl',nullableString],['externalUrl',nullableString],['path',nullableString]];
const youtubeFields=['channelTitle','channelId','videoId','title','thumbnailUrl','publishedTime'].map(key=>[key,nullableString]);
export function parseHomeBannerResponse(reply){
 try{
  // Complete native service has no local HTTP status gate/String JSON decode.
  if(!object(reply)||!object(reply.data))invalid();
  const body=reply.data,error=own(body,'error');
  if(error!=null&&typeof error!=='boolean')invalid();
  nullableString(own(body,'message'));
  for(const key of ['totalRecords','resultsCount','pageSize','pageNumber'])nullableInteger(own(body,key));
  const data=own(body,'data'),parsed=data==null?[]:rows(data,bannerFields);
  // Parse all metadata/items BEFORE this gate, including error=true responses.
  if(error==null)invalid();
  // Native returns a normal empty List when typed error=true, not an exception.
  return {ok:true,rows:error?[]:parsed};
 }catch{return failure();}
}
export function parseHomeYoutubeResponse(reply){
 try{
  if(!object(reply)||reply.status!==200) return failure('HOME_MEDIA_HTTP_STATUS');
  const body=typeof reply.data==='string'?JSON.parse(reply.data):reply.data;
  if(!object(body))invalid();
  // Native reads data only; error/message are not this endpoint's envelope.
  return {ok:true,rows:rows(own(body,'data'),youtubeFields)};
 }catch{return failure();}
}

const base='https://sentuh.atrbpn.go.id';
const controls=/[\u0000-\u001f\u007f-\u009f]/;
// Percent bytes 80..9f can be continuation bytes of legitimate UTF-8 text;
// do not mistake every such byte for a Unicode control character.
const encodedControls=/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;
function https(value){
 if(typeof value!=='string'||!value||value.trim()!==value||controls.test(value)||encodedControls.test(value)||value.includes('\\')||!/^https:\/\//i.test(value))return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url:null;}catch{return null;}
}
export function homeBannerImageUrl(path){
 if(typeof path!=='string'||controls.test(path)||encodedControls.test(path)||path.includes('\\'))return null;
 // Keep the native literal concatenation. Never resolve path as an authority.
 const url=https(`${base.replace(/\/+$/,'')}/${path.replace(/^\/+/, '')}`);
 return url?.origin===base?url.href:null;
}
export function homeExternalUrl(value){return https(value)?.href??null;}
export function homeYoutubeThumbnailUrl(value){
 const url=https(value),hosts=['www.atrbpn.go.id','sentuh.atrbpn.go.id','i.ytimg.com','img.youtube.com'];
 return url&&!url.port&&hosts.includes(url.hostname)?url.href:null;
}
export function homeYoutubeEmbedUrl(videoId){
 // Native forwards an arbitrary nullable String to its plugin. Browser guard:
 // accept a bounded URL-safe token and one fixed iframe origin. This is not
 // a claim that native or provider IDs have a particular required length.
 return typeof videoId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(videoId)?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=0&controls=1`:null;
}
