// Browser-only coordinate-entry adaptation. These declarations and session
// metadata are not proof of measurement, ownership, presence or server acceptance.
export const SWAPLOTTING_MERCATOR_LATITUDE=85.0511287798066;
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const decimal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const fail=(code,message)=>Object.assign(new TypeError(message),{code:'SWAPLOTTING_COORDINATE_'+code});
const text=(value,max=100)=>typeof value==='string'&&value.length<=max;
export const swaplottingCoordinateText=value=>Object.is(value,-0)?'-0':String(value);
function declaration(value){if(value!==true)throw fail('DECLARATION','Nyatakan bahwa Longitude dan Latitude menggunakan WGS84 dalam derajat desimal.');}
function rawNumber(raw){
 if(!text(raw)||!decimal.test(raw.trim()))throw fail('DECIMAL','Gunakan angka derajat desimal untuk Longitude dan Latitude.');
 const number=Number(raw.trim());
 if(!Number.isFinite(number))throw fail('FINITE','Koordinat harus berupa angka hingga.');
 // Browser input policy: do not silently reduce a nonzero decimal to zero.
 if(number===0&&/[1-9]/.test(raw.trim().split(/[eE]/)[0]))throw fail('UNDERFLOW','Nilai koordinat terlalu kecil untuk direpresentasikan.');
 return number;
}
function camera(value){
 if(!object(value)||typeof value.lat!=='number'||!Number.isFinite(value.lat)||typeof value.lng!=='number'||!Number.isFinite(value.lng)||Math.abs(value.lng)>180||Math.abs(value.lat)>90)throw fail('RANGE','Longitude harus -180 sampai 180 dan Latitude -90 sampai 90.');
 if(Math.abs(value.lat)>SWAPLOTTING_MERCATOR_LATITUDE)throw fail('MERCATOR','Latitude berada di luar jangkauan peta Mercator.');
 return {lat:value.lat,lng:value.lng};
}
export function parseSwaplottingCoordinateEntry(value){
 if(!object(value))throw fail('INPUT','Isian koordinat tidak valid.');
 declaration(value.declaredWgs84);
 const raw={longitude:value.longitude,latitude:value.latitude};
 const point=camera({lng:rawNumber(raw.longitude),lat:rawNumber(raw.latitude)});
 return {camera:point,provenance:{kind:'manual-coordinate',declaredCrs:'browser-wgs84-decimal',raw}};
}
function sessionPoint(point){
 if(!object(point)||!text(point.id)||!point.id.length||!['survey','external_gnss'].includes(point.source)||point.crs!=='EPSG:4326')throw fail('SOURCE','Titik sesi harus berasal dari pengukuran atau GNSS eksternal dengan label EPSG:4326.');
 const value=camera({lat:point.latitude,lng:point.longitude});
 if(point.name!==undefined&&!text(point.name))throw fail('METADATA','Nama titik tidak valid.');
 if(point.accuracy!=null&&(typeof point.accuracy!=='number'||!Number.isFinite(point.accuracy)||point.accuracy<0))throw fail('METADATA','Metadata akurasi tidak valid.');
 if(point.measuredAt!=null&&!text(point.measuredAt,100))throw fail('METADATA','Metadata waktu tidak valid.');
 if(point.warnings!==undefined&&(!Array.isArray(point.warnings)||point.warnings.length>20||point.warnings.some(value=>!text(value,1000))))throw fail('METADATA','Metadata peringatan tidak valid.');
 if(point.original!==undefined&&(!object(point.original)||!text(point.original.longitude)||!text(point.original.latitude)))throw fail('METADATA','Metadata koordinat asal tidak valid.');
 const raw={longitude:swaplottingCoordinateText(value.lng),latitude:swaplottingCoordinateText(value.lat)};
 const metadata={name:point.name??'',accuracy:point.accuracy??null,measuredAt:point.measuredAt??null,warnings:[...(point.warnings??[])]};
 return {camera:value,raw,metadata};
}
export function swaplottingSessionCoordinate(point,{declaredWgs84}={}){
 declaration(declaredWgs84);const projected=sessionPoint(point);
 return {camera:projected.camera,provenance:{kind:'session-point',declaredCrs:'browser-wgs84-decimal',raw:projected.raw,recordId:point.id,measurementSource:point.source,sourceCrsLabel:point.crs,metadata:projected.metadata}};
}
export function swaplottingCoordinateSignature(point){
 try{const {raw,metadata}=sessionPoint(point);return JSON.stringify([point.id,point.source,point.crs,raw.longitude,raw.latitude,metadata.name,metadata.accuracy==null?null:swaplottingCoordinateText(metadata.accuracy),metadata.measuredAt,metadata.warnings,point.original===undefined?null:[point.original.longitude,point.original.latitude]]);}catch{return null;}
}
export function swaplottingCoordinateCandidates(points){
 if(!Array.isArray(points)||points.length>500)return [];
 const ids=new Map();for(const point of points)if(object(point)&&typeof point.id==='string')ids.set(point.id,(ids.get(point.id)??0)+1);
 const result=[];points.forEach((record,index)=>{const signature=swaplottingCoordinateSignature(record);if(signature===null||ids.get(record.id)!==1)return;const projected=sessionPoint(record);result.push({index,record,signature,label:projected.metadata.name||record.id,...projected});});return result;
}
// Validate a fresh immutable projection before associating it with a controller
// target. The host separately verifies current-session reference/generation.
export function swaplottingCoordinateProvenance(value,target){
 const selected=camera(target);let projected;
 if(!object(value)||value.declaredCrs!=='browser-wgs84-decimal'||!object(value.raw))throw fail('PROVENANCE','Asal koordinat tidak valid.');
 if(value.kind==='manual-coordinate')projected=parseSwaplottingCoordinateEntry({...value.raw,declaredWgs84:true});
 else if(value.kind==='session-point'){
  if(!object(value.metadata))throw fail('PROVENANCE','Metadata titik sesi tidak valid.');
  projected=swaplottingSessionCoordinate({id:value.recordId,source:value.measurementSource,crs:value.sourceCrsLabel,longitude:rawNumber(value.raw.longitude),latitude:rawNumber(value.raw.latitude),name:value.metadata.name,accuracy:value.metadata.accuracy,measuredAt:value.metadata.measuredAt,warnings:value.metadata.warnings},{declaredWgs84:true});
  // Session raw values are the canonical text of stored binary64 coordinates.
  if(projected.provenance.raw.longitude!==value.raw.longitude||projected.provenance.raw.latitude!==value.raw.latitude)throw fail('PROVENANCE','Koordinat titik sesi telah berubah.');
 }else throw fail('PROVENANCE','Asal koordinat tidak didukung.');
 if(!Object.is(projected.camera.lat,selected.lat)||!Object.is(projected.camera.lng,selected.lng))throw fail('PROVENANCE','Asal koordinat tidak cocok dengan titik peta.');
 return projected.provenance;
}
export function swaplottingCoordinateProvenanceFacts(value){
 if(!value)return [];
 if(value.kind==='map-camera')return [['Asal titik','Titik tengah peta']];
 if(value.kind==='initial-viewport')return [['Asal titik','Tampilan awal peta']];
 if(!['manual-coordinate','session-point'].includes(value.kind))return [];
 const facts=[['Asal titik',value.kind==='manual-coordinate'?'Koordinat yang dimasukkan pengguna':'Titik pengukuran dari sesi browser'],['Longitude',value.raw?.longitude??''],['Latitude',value.raw?.latitude??''],['Deklarasi pengguna','WGS84, derajat desimal; belum diverifikasi']];
 if(value.kind==='session-point')facts.push(['Sumber yang dilaporkan',value.measurementSource==='external_gnss'?'GNSS eksternal':'Pengukuran'],['Nama titik',value.metadata?.name??''],['Label CRS sumber',value.sourceCrsLabel??''],['Akurasi yang dilaporkan',value.metadata?.accuracy==null?'Tidak tersedia':`${swaplottingCoordinateText(value.metadata.accuracy)} m`],['Waktu yang dilaporkan',value.metadata?.measuredAt??'Tidak tersedia'],...(value.metadata?.warnings??[]).map(warning=>['Peringatan sumber',warning]));
 return facts;
}
