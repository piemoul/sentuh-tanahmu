import test from 'node:test';
import assert from 'node:assert/strict';
import {queueBookingView} from '../assets/queue/booking-view.js';
const model=(changes={})=>({stage:'review',review:{office:'<img src=x onerror=alert(1)>',location:'A&B',date:'2026-10-21',loket:'"quoted"',documentCount:5,queueAhead:'9223372036854775807',estimate:'<script>bad</script>'},message:'',pending:false,requiresReload:false,reconciling:false,notificationAvailable:true,canConfirm:true,...changes});
test('confirmation renders captured fields literally and offers native Batal / Ambil Antrian only',()=>{
 const html=queueBookingView(model());assert.ok(html.includes('&lt;img'));assert.ok(html.includes('A&amp;B'));assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));assert.ok(html.includes('9223372036854775807'));assert.ok(!html.includes('<script>'));assert.match(html,/data-action="queue-booking-cancel"[^>]*>Batal/);assert.match(html,/data-action="queue-booking-confirm"[^>]*>Ambil Antrian/);assert.ok(html.includes('panggilan saya terlewatkan'));assert.equal((html.match(/<button/g)??[]).length,2);
});
test('pending create locks buttons and exposes loading, without result/booking-code fabrication',()=>{
 const html=queueBookingView(model({stage:'creating',pending:true,canConfirm:false}));assert.match(html,/data-action="queue-booking-cancel" disabled/);assert.match(html,/data-action="queue-booking-confirm" disabled/);assert.ok(html.includes('aria-busy="true"'));assert.ok(html.includes('Mengirim pemesanan'));assert.ok(!html.includes('Kode Booking'));
});
test('unknown offers only an explicit read action; message markup and empty native rejection stay literal',()=>{
 const html=queueBookingView(model({stage:'unknown',review:null,message:'<pending>',canConfirm:false}));assert.ok(html.includes('&lt;pending&gt;'));assert.ok(html.includes('data-action="queue-booking-reconcile"'));assert.ok(!html.includes('queue-booking-confirm'));assert.ok(!html.includes('queue-booking-cancel'));
 assert.match(queueBookingView(model({stage:'error',review:null,message:''})),/data-queue-booking-message><\/p>/);
});
test('unavailable notifications explain disabled final action while normal terminal/disposed views stay empty',()=>{
 const html=queueBookingView(model({notificationAvailable:false,canConfirm:false}));assert.ok(html.includes('data-queue-booking-notification'));assert.match(html,/data-action="queue-booking-confirm" disabled/);for(const stage of ['idle','disposed','created'])assert.equal(queueBookingView(model({stage})), '');
});
