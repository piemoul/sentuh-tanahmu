// Native 6.1.5 Cari Bidang form contract: parcel-search-followup/flow.json c110b2f2.
// Input helpers: parcel-search-input-followup/flow.json 7ae1307678dbce9e.
// Shared input formatter bodies/profile preference remain unaudited. No guessed
// truncation, digit filter or geometry from lookup metadata.
export const parcelSearchRights=Object.freeze([
 Object.freeze({label:'Hak Milik',code:1}),Object.freeze({label:'Hak Guna Usaha',code:2}),
 Object.freeze({label:'Hak Guna Bangunan',code:3}),Object.freeze({label:'Hak Pakai',code:4}),
 Object.freeze({label:'Hak Pengelolaan',code:5}),Object.freeze({label:'Hak Wakaf',code:8}),
]);
export const parcelSearchCopy=Object.freeze({
 tabs:Object.freeze(['Sertipikat Analog','Sertipikat Elektronik']),
 invalid:'Harap lengkapi form lokasi bidang tanah',
 serviceError:'Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi.',
 notFound:'Bidang tanah nggak ketemu, nih!',
 analogSuggestion:'Yuk, cek dulu data yang kamu masukin. Mungkin Sertipikatnya Elektronik, coba cari di tab Sertipikat Elektronik, ya!',
 electronicSuggestion:'Yuk, cek dulu data yang kamu masukin. Mungkin Sertipikatnya Analog, coba cari di tab Sertipikat Analog, ya!',
});
const object=value=>value!==null&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
const malformed=part=>Object.assign(new TypeError('Data layanan bidang belum dapat dikenali.'),{code:`PARCEL_${part}_MODEL`});
const nullableString=(row,key,part)=>{const value=row[key]??null;if(value!==null&&typeof value!=='string')throw malformed(part);return value;};
export function parcelSearchRight(value){return parcelSearchRights.find(row=>row.code===value||String(row.code)===value)?.code??null;}
export function parcelSearchNeedsRegion(right){return right!==2&&right!==5;}
// Native dyn:Qbc→cb10fc→42989c removes every literal ASCII dot only.
// This is the stored-value callback, not the still-unclosed input formatter.
export function parcelSearchNibel(value){if(typeof value!=='string')throw new TypeError('PARCEL_NIBEL_STRING');return value.split('.').join('');}
// Native 447974 trim (also frozen by Daring/collection audits) includes U+0085.
// Check a temporary value only; the original ID is sent to the boundary read.
export function parcelSearchUsableId(value){return typeof value==='string'&&value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu,'')!=='';}
// Project only the displayed office name and the actual main-office identity.
// Raw lowercase/Directus id aliases are deliberately never substituted.
export function parcelSearchOffices(rows){
 if(!Array.isArray(rows))throw malformed('OFFICE');
 return Array.from(rows,row=>{if(!object(row))throw malformed('OFFICE');return {KantorId:nullableString(row,'KantorId','OFFICE'),Nama:nullableString(row,'Nama','OFFICE')};});
}
export function parcelSearchRegions(rows){
 if(!Array.isArray(rows))throw malformed('REGION');
 return Array.from(rows,row=>{
  if(!object(row))throw malformed('REGION');
  // Validate all four typed fields. Projection 812114 uses WilayahId, not Kode.
  nullableString(row,'Kode','REGION');nullableString(row,'TipeWilayah','REGION');
  return {code:nullableString(row,'WilayahId','REGION'),name:nullableString(row,'Nama','REGION')};
 });
}
export function parcelSearchValidation({tab,right,office,region,number,nibel}){
 const missing=[];
 if(tab===0){
  if(parcelSearchRight(right)===null)missing.push('jenisHak');
  if(office==null)missing.push('kantor');
  if(parcelSearchNeedsRegion(right)&&(region==null||typeof region.code!=='string'||region.code===''))missing.push('kelurahan');
  if(number==null)missing.push('nomorSertipikat');
 }else if(tab===1){if(typeof nibel!=='string'||nibel.length<14)missing.push('NIBEL');}
 else missing.push('tab');
 return {ok:missing.length===0,missing};
}
export function parcelSearchLookup(row){
 // The backend owns the full tyb800 contract, including specialized Null?
 // fields and signed64 values. Frontend consumes only exact PersilId here.
 if(!object(row))throw malformed('LOOKUP');
 const PersilId=nullableString(row,'PersilId','LOOKUP');
 return {PersilId};
}
export function parcelSearchBoundary(data){
 // Browser rendering limits match the established parcel camera contract.
 // Return original server data; do not construct/repair/reproject geometry.
 const fail=()=>{throw Object.assign(new TypeError('Koordinat bidang dari layanan belum dapat digunakan untuk membuka peta resmi.'),{code:'PARCEL_BOUNDARY_MODEL'});};
 const array=(value,min,max)=>{if(!Array.isArray(value)||value.length<min||value.length>max)fail();return value;};
 if(!object(data)||data.type!=='FeatureCollection')fail();
 const features=array(data.features,0,200),crs=data.crs?.properties?.name;
 if(data.crs!=null&&!['EPSG:4326','urn:ogc:def:crs:EPSG::4326','urn:ogc:def:crs:OGC:1.3:CRS84'].includes(crs))fail();
 let points=0;
 for(const feature of features){
  if(!object(feature)||feature.type!=='Feature')fail();
  const geometry=feature.geometry;if(!object(geometry)||!['Polygon','MultiPolygon'].includes(geometry.type))fail();
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:array(geometry.coordinates,1,5000);
  for(const polygon of polygons)for(const ring of array(polygon,1,5000)){
   array(ring,4,20000);
   for(const point of ring){
    if(++points>20000)fail();array(point,2,20000);
    if(!point.every(value=>typeof value==='number'&&Number.isFinite(value))||Math.abs(point[0])>180||Math.abs(point[1])>90)fail();
   }
   if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])fail();
  }
 }
 return {data,status:features.length?'ready':'empty'};
}
