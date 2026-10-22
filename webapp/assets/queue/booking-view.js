import {QUEUE_BOOKING_COPY} from './booking-model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function queueBookingView(model){
 if(['idle','disposed','created'].includes(model.stage))return '';
 const review=model.review;
 let body='';
 if(model.stage==='checking')body='<p role="status">Memeriksa batas pengambilan antrian…</p>';
 if(review){
  body+=`<h2>Konfirmasi Antrian</h2><dl>${[['Kantor Pertanahan',review.office],['Lokasi Kerja',review.location],['Tanggal Kunjungan',review.date],['Loket',review.loket],['Jumlah Berkas',review.documentCount],['Antrian di Depan',review.queueAhead]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${review.estimate!==null?`<p>${esc(review.estimate)}</p>`:''}<p>${QUEUE_BOOKING_COPY.attendance}</p>`;
  if(!model.notificationAvailable&&!model.pending)body+=`<p class="notice" data-queue-booking-notification>${QUEUE_BOOKING_COPY.notification}</p>`;
  body+=`<div class="form-actions"><button type="button" class="button secondary" data-action="queue-booking-cancel" ${model.pending?'disabled':''}>Batal</button><button type="button" class="button" data-action="queue-booking-confirm" ${model.canConfirm?'':'disabled'}>Ambil Antrian</button></div>`;
 }
 if(model.stage==='creating')body+='<p role="status">Mengirim pemesanan antrian…</p>';
 // Empty native rejection messages remain empty instead of acquiring a success
 // label. The error state itself stays observable to the host and assistive UI.
 if(model.stage==='error'||model.stage==='unknown'||model.message)body+=`<p class="notice notice-error" role="alert" data-queue-booking-message>${esc(model.message)}</p>`;
 if(model.stage==='unknown')body+=`<button type="button" class="button secondary" data-action="queue-booking-reconcile" ${model.reconciling?'disabled':''}>${model.reconciling?'Memeriksa…':'Periksa daftar antrian'}</button>`;
 return `<section class="panel queue-preread-review" data-queue-booking data-stage="${esc(model.stage)}" aria-label="Pemesanan antrian" aria-busy="${model.pending||model.reconciling}">${body}</section>`;
}
