import test from 'node:test';
import assert from 'node:assert/strict';
import {QUEUE_BOOKING_COPY as COPY,queueLimitResult,queueCreateResult,queueClosingTime,queueBookingPreflight,queueBookingReview} from '../assets/queue/booking-model.js';
const source=(row={},date='2026-10-21')=>({office:{nama:'Kantor sintetis'},location:{nama:'Lokasi sintetis'},row:{nama:'Loket sintetis',jumlah_antrian:'9223372036854775807',estimasi_message:null,jam_tutup:null,...row},date,documentCount:5});
const allowed=()=>queueLimitResult({error:false,available:true,message:null});

test('quota result distinguishes Boolean availability, null model, null fallback and literal empty messages',()=>{
 for(const [error,available,message,expectedError,expectedMessage] of [[false,true,null,false,COPY.quotaAvailable],[false,false,null,true,COPY.quotaFull],[false,null,null,true,COPY.quotaError],[true,true,null,true,COPY.quotaError],[true,null,'',true,''],[false,false,'',true,''],[false,true,'',false,'']])assert.deepEqual(queueLimitResult({error,available,message}),{error:expectedError,message:expectedMessage});
 assert.deepEqual(queueLimitResult({error:false,available:true,message:'ok',contextId:'raw context '}),{error:false,message:'ok',contextId:'raw context '});
 for(const value of [null,{}, {error:false,available:1,message:null},{error:false,available:'true',message:null},{error:false,available:true,message:1},{error:'false',available:true,message:null},{error:false,available:true,message:null,contextId:1}])assert.throws(()=>queueLimitResult(value));
});
test('quota rejection wins over full and closing without reading the clock',()=>{
 const result=queueBookingPreflight({limit:queueLimitResult({error:true,available:null,message:''}),context:source({estimasi_message:'full',jam_tutup:'invalid'}),now:()=>{throw new Error('must not sample');}});
 assert.deepEqual(result,{stage:'error',message:''});
});
test('full is exact case-sensitive substring and preserves the complete message',()=>{
 for(const text of ['full','fully booked','not full','場所full尾','prefix full suffix'])assert.deepEqual(queueBookingPreflight({limit:allowed(),context:source({estimasi_message:text,jam_tutup:'invalid'}),now:()=>{throw 0;}}),{stage:'error',message:text});
 for(const text of [null,'','FULL','FulL','f ull'])assert.equal(queueBookingPreflight({limit:allowed(),context:source({estimasi_message:text})}).stage,'review');
});
test('closing uses local time-of-day, ignores its date/fraction and compares strictly after cutoff',()=>{
 const context=source({jam_tutup:'2001-02-03 14:15:16.999999'});let calls=0;
 const equality=queueBookingPreflight({limit:allowed(),context,now:()=>{calls++;return new Date(2026,9,21,14,15,16,0);}});
 assert.equal(equality.stage,'review');assert.equal(calls,1);
 const later=queueBookingPreflight({limit:allowed(),context,now:()=>new Date(2026,9,21,14,15,16,1)});
 assert.deepEqual(later,{stage:'error',message:COPY.closed});
});
test('closing second sample compares day number only, including another month and midnight crossing',()=>{
 const context=source({jam_tutup:'2000-01-01 00:00:00'},'2028-12-21');let calls=0;
 assert.equal(queueBookingPreflight({limit:allowed(),context,now:()=>{calls++;return new Date(2026,9,21,23);}}).stage,'error');assert.equal(calls,2);
 let index=0;const samples=[new Date(2026,9,21,23,59,59),new Date(2026,9,22,0,0,0)];
 assert.equal(queueBookingPreflight({limit:allowed(),context,now:()=>samples[index++]}).stage,'review');assert.equal(index,2);
});
test('closing normal date parser preserves local-only midnight and explicit offset instant',()=>{
 const local=queueClosingTime('0001-01-02');assert.equal(local.getFullYear(),1);assert.equal(local.getMonth(),0);assert.equal(local.getDate(),2);assert.equal(local.getHours(),0);
 assert.equal(queueClosingTime('2026-10-21T14:30:59.123456+07:00').toISOString(),'2026-10-21T07:30:59.123Z');
 assert.equal(queueClosingTime('2026-10-21 14:30:59,9-0230').toISOString(),'2026-10-21T17:00:59.900Z');
 assert.equal(queueClosingTime('2026-10-21T14:30Z').toISOString(),'2026-10-21T14:30:00.000Z');
 assert.equal(queueClosingTime(null),null);
 for(const value of [undefined,1,'2026-02-30','2026-10-21T24:00','2026-10-21T23:60','2026-10-21T23:59:60','2026-10-21T10:00+24:00','2026-10-21T10:00+00:60',''])assert.throws(()=>queueClosingTime(value));
});
test('null closing takes no clock samples and unsupported clocks cannot become eligibility',()=>{
 assert.equal(queueBookingPreflight({limit:allowed(),context:source(),now:()=>{throw 0;}}).stage,'review');
 for(const sample of [null,'2026-10-21',new Date(NaN)])assert.throws(()=>queueBookingPreflight({limit:allowed(),context:source({jam_tutup:'2000-01-01 12:00'}),now:()=>sample}));
});
test('create adapter preserves raw ID and empty strings; service rejection is not synthetic success',()=>{
 const data={id:' ',nomor:'<native>',nama:''};assert.deepEqual(queueCreateResult({error:false,message:null,data}),{error:false,message:'',data});
 assert.deepEqual(queueCreateResult({error:false,message:null,data:{id:'',nomor:'',nama:''}}).data,{id:'',nomor:'',nama:''});
 assert.deepEqual(queueCreateResult({error:true,message:'',data:null}),{error:true,message:'',data:null});
 assert.deepEqual(queueCreateResult({error:false,message:null,data:null}),{error:true,message:'',data:null});
 for(const value of [null,{}, {error:0,message:null,data}, {error:false,message:3,data},{error:false,message:null,data:{...data,id:null}},{error:false,message:null,data:{...data,nomor:1}}])assert.throws(()=>queueCreateResult(value));
});
test('confirmation uses captured presentation fields and retains wide count without identity/token exposure',()=>{
 const context=source();const review=queueBookingReview(context);
 assert.deepEqual(review,{office:'Kantor sintetis',location:'Lokasi sintetis',date:'2026-10-21',loket:'Loket sintetis',documentCount:5,queueAhead:'9223372036854775807',estimate:null,quotaVerified:true,bookingCreated:false});
 assert.equal(Object.isFrozen(review),true);assert.equal(Object.hasOwn(review,'applicant'),false);assert.equal(Object.hasOwn(review,'token'),false);
});
