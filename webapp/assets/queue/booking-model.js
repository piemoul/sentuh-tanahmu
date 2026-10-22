import {queueDateInput} from './preread-model.js';

export const QUEUE_BOOKING_COPY=Object.freeze({
 quotaError:'Terjadi Kesalahan',quotaCatch:'Terjadi kesalahan',
 quotaFull:'Wah, maksimal cuma boleh ambil 4 antrian per hari di tiap kantor, nih! Ini biar semua kebagian ngantri dan pelayanan tetap lancar, ya.',
 quotaAvailable:'Batas booking tersedia',
 closed:'Gagal ambil antrian, nih! Kantor Pertanahan udah tutup hari ini.',
 attendance:'Saya menyetujui apabila panggilan saya terlewatkan karena saya belum hadir di lokasi pelayanan, maka petugas berhak untuk menyesuaikan urutan antrian saya.',
 notification:'Layanan notifikasi untuk pemesanan belum tersedia. Antrian belum dikirim.',
 stale:'Pilihan atau sesi antrian sudah berubah. Muat ulang pilihan sebelum melanjutkan.',
 unknown:'Hasil pemesanan belum diketahui. Periksa daftar antrian sebelum membuat pemesanan lain.',
 malformed:'Respons pemesanan belum sesuai format layanan.'
});
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const nullableString=value=>value===null||typeof value==='string';
const malformed=()=>{throw Object.assign(new TypeError(QUEUE_BOOKING_COPY.malformed),{code:'QUEUE_BOOKING_UNRECOGNIZED'});};

// These are already-decoded adapter values, not raw Directus wire parsers.
// The backend owns the integer model, identity, auth and notification token.
export function queueLimitResult(value){
 if(!record(value)||typeof value.error!=='boolean'||!nullableString(value.message)||value.available!==null&&typeof value.available!=='boolean')malformed();
 if(value.contextId!==undefined&&typeof value.contextId!=='string')malformed();
 const result={error:value.error||value.available!==true,message:value.message??(value.error||value.available===null?QUEUE_BOOKING_COPY.quotaError:value.available?QUEUE_BOOKING_COPY.quotaAvailable:QUEUE_BOOKING_COPY.quotaFull)};
 return Object.freeze({...result,...(value.contextId!==undefined?{contextId:value.contextId}:{})});
}
export function queueCreateResult(value){
 if(!record(value)||typeof value.error!=='boolean'||!nullableString(value.message))malformed();
 if(value.error||value.data===null)return Object.freeze({error:true,message:value.message??'',data:null});
 if(!record(value.data)||!['id','nomor','nama'].every(key=>typeof value.data[key]==='string'))malformed();
 return Object.freeze({error:false,message:value.message??'',data:Object.freeze({id:value.data.id,nomor:value.data.nomor,nama:value.data.nama})});
}

// Match the existing read adapter's bounded ISO/civil-date subset. The closing
// instant is converted to device-local components, including its explicit zone.
// Browser clocks have millisecond precision; full Dart/DST grammar is not claimed.
export function queueClosingTime(value){
 if(value===null)return null;
 if(typeof value!=='string')throw new TypeError('QUEUE_CLOSING_TIME');
 const m=/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,6}))?)?(?: ?([zZ]|([+-])(\d{2}):?(\d{2})))?)?$/.exec(value);
 if(!m||!queueDateInput(m[1])||Number(m[2]??0)>23||Number(m[3]??0)>59||Number(m[4]??0)>59||Number(m[8]??0)>23||Number(m[9]??0)>59)throw new TypeError('QUEUE_CLOSING_TIME');
 const [year,month,day]=m[1].split('-').map(Number),parts=[Number(m[2]??0),Number(m[3]??0),Number(m[4]??0),Number((m[5]??'').padEnd(3,'0').slice(0,3))],date=new Date(0);
 if(m[6]){date.setUTCFullYear(year,month-1,day);date.setUTCHours(...parts);if(m[7])date.setTime(date.getTime()-(m[7]==='+'?1:-1)*(Number(m[8])*60+Number(m[9]))*60000);}
 else{date.setFullYear(year,month-1,day);date.setHours(...parts);}
 if(!Number.isFinite(date.getTime()))throw new TypeError('QUEUE_CLOSING_TIME');return date;
}
const clockValue=now=>{const date=now();if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new TypeError('QUEUE_CLOCK');return date;};
export function queueBookingPreflight({limit,context,now=()=>new Date()}){
 if(limit?.error===true)return {stage:'error',message:limit.message};
 if(limit?.error!==false||typeof limit.message!=='string'||!record(context?.row))malformed();
 const estimate=context.row.estimasi_message;
 if(!nullableString(estimate))malformed();
 if(estimate!==null&&estimate.includes('full'))return {stage:'error',message:estimate};
 const closing=queueClosingTime(context.row.jam_tutup);
 if(closing!==null){
  const first=clockValue(now),cutoff=new Date(first);cutoff.setHours(closing.getHours(),closing.getMinutes(),closing.getSeconds(),0);
  if(first>cutoff){
   const second=clockValue(now),selected=queueDateInput(context.date);
   if(!selected)throw new TypeError('QUEUE_DATE');
   // Literal native comparison: day number only, with a second clock sample.
   if(selected.getDate()===second.getDate())return {stage:'error',message:QUEUE_BOOKING_COPY.closed};
  }
 }
 return {stage:'review',message:limit.message};
}
export function queueBookingReview(context){
 return Object.freeze({office:context.office.nama,location:context.location.nama,date:context.date,loket:context.row.nama,documentCount:context.documentCount,queueAhead:context.row.jumlah_antrian,estimate:context.row.estimasi_message,quotaVerified:true,bookingCreated:false});
}
