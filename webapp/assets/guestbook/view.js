import {GUESTBOOK_FIELDS,GUESTBOOK_COPY,GUESTBOOK_WRITE_COPY,guestbookInputMode} from './model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function guestbookFeedback(model){
 if(model.writePending)return `<p role="status">${GUESTBOOK_WRITE_COPY.saving}</p>`;
 if(model.pending)return '<p role="status">Memuat data unit kantor…</p>';
 return model.error?`<p class="notice notice-error" role="alert">${esc(model.error)}</p>`:'';
}
export function guestbookValidation(model){
 if(!model.validation)return '';
 return model.validation.ok?(model.writeSupported?'<p class="notice notice-info">Isian wajib telah terisi.</p>':'<p class="notice notice-info">Isian wajib telah terisi. Data belum dikirim dan kedatangan belum didaftarkan.</p>'):'<p class="notice notice-error" role="alert">Periksa kembali isian yang ditandai.</p>';
}
export function guestbookForm(model){
 if(model.stage!=='form'||!model.unit)return '';
 const unit=esc(model.unit.namaUnitKerja??''),blocked=model.writePending||model.writeLocked;
 const fields=GUESTBOOK_FIELDS.map(field=>{
  const attrs=`id="guestbook-${field.id}" data-guestbook-field="${field.id}" name="${field.id}" inputmode="${guestbookInputMode(field.id)}" autocomplete="off" aria-describedby="guestbook-error-${field.id}" aria-invalid="${!!model.validation?.errors[field.id]}"${blocked?' disabled':''}`;
  // Purpose is the sole native10-line field. DOB remains raw text with the
  // same number-keyboard hint as NIK; formatter execution is not guessed.
  const control=field.id==='purpose'?`<textarea ${attrs} rows="10">${esc(model.values[field.id])}</textarea>`:`<input ${attrs} type="text" value="${esc(model.values[field.id])}">`;
  return `<label class="parameter-field" for="guestbook-${field.id}"><span>${field.label}</span>${control}<small class="inline-error" id="guestbook-error-${field.id}">${esc(model.validation?.errors[field.id]??'')}</small></label>`;
 }).join('');
 const actions=model.writeSupported?`<div class="guestbook-form-actions"><button type="submit" class="button" data-guestbook-save${model.canSubmit?'':' disabled'}>${model.writePending?GUESTBOOK_WRITE_COPY.saving:GUESTBOOK_WRITE_COPY.save}</button></div>${model.writeError?`<p class="notice ${model.writeOutcome?.delivery==='unknown'?'notice-warning':'notice-error'}" data-guestbook-write-error role="alert">${esc(model.writeError)}</p>`:''}`:`<div class="guestbook-form-actions"><button type="submit" class="button secondary">Periksa isian</button><button type="button" class="button" disabled aria-describedby="guestbook-write-boundary">Simpan</button></div><p class="privacy-note" id="guestbook-write-boundary">${GUESTBOOK_COPY.boundary}</p>`;
 return `<section class="panel guestbook-form-panel"><div class="section-heading"><h2>Data Diri</h2></div>${unit?`<p class="guestbook-unit">${unit}</p>`:''}<details class="guestbook-instruction"><summary>Informasi kunjungan</summary><p>Selamat Datang di ${unit}</p><p>Mohon isi data diri dengan lengkap dan jelas untuk mendaftarkan kedatangan kamu di ${unit}</p><p>Isian kamu akan di verifikasi oleh petugas kami sebelum mendapatkan kartu pengunjung.</p></details><form id="guestbook-form" novalidate autocomplete="off"><div class="parameter-grid">${fields}</div><div data-guestbook-validation aria-live="polite">${guestbookValidation(model)}</div>${actions}</form></section>`;
}
export function guestbookSuccess(model){return model.stage==='success'?`<section class="panel guestbook-success" data-guestbook-success><h2>${GUESTBOOK_WRITE_COPY.title}</h2><p>${GUESTBOOK_WRITE_COPY.success}</p><button type="button" class="button" data-action="guestbook-back"${model.canBack?'':' disabled'}>${GUESTBOOK_WRITE_COPY.back}</button></section>`:'';}
export function guestbookView(model,{available=true,camera={stage:'idle',message:''}}={}){
 if(model.stage==='success')return `<section data-guestbook class="guestbook-layout">${guestbookSuccess(model)}</section>`;
 const active=['starting','scanning'].includes(camera.stage),message=camera.stage==='scanning'?'Arahkan kamera ke QR Buku Tamu dari kantor.':camera.message;
 const blocked=model.writePending||model.writeLocked;
 return `<section data-guestbook class="guestbook-layout"><section class="panel guestbook-read-panel"><h2>Pindai QR Buku Tamu</h2><p>Gunakan QR Buku Tamu yang diberikan kantor saat kunjungan. Anda juga dapat menempel kode QR secara manual.</p><div class="guestbook-camera"><video id="guestbook-video" muted playsinline aria-label="Pratinjau kamera QR Buku Tamu"></video><p data-guestbook-camera-status role="status">${esc(message)}</p><div class="guestbook-camera-actions"><button type="button" class="button secondary" data-action="guestbook-camera-start" ${!available||active||model.pending||blocked?'disabled':''}>Buka kamera</button><button type="button" class="text-button" data-action="guestbook-camera-stop" ${!active?'disabled':''}>Tutup kamera</button></div></div><form id="guestbook-read-form" novalidate><label class="parameter-field" for="guestbook-raw"><span>Kode QR Buku Tamu</span><textarea id="guestbook-raw" rows="4" autocomplete="off" spellcheck="false" ${!available||blocked?'disabled':''}>${esc(model.raw)}</textarea></label><p class="form-hint">Kamera hanya membaca kode di perangkat. Periksa kode, lalu tekan Buka data unit. Data formulir tidak disimpan setelah meninggalkan halaman.</p><div data-guestbook-feedback aria-live="polite">${guestbookFeedback(model)}</div>${!available?'<p class="notice notice-warning">Pembacaan Buku Tamu belum tersedia. Periksa koneksi atau masuk kembali.</p>':''}<button type="submit" class="button" ${!available||model.pending||blocked?'disabled':''}>${model.pending?'Memuat…':['empty','error'].includes(model.stage)?'Coba lagi pembacaan':'Buka data unit'}</button></form></section><div data-guestbook-form>${guestbookForm(model)}</div></section>`;
}
