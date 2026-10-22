import {LOST_CERTIFICATE_COPY} from './model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=value=>value==null?'-':String(value);
function date(value,formatDate) {
  if (typeof formatDate!=='function') throw new TypeError('LOST_CERTIFICATE_DATE_FORMATTER_REQUIRED');
  // Null assertions in native are deliberately replaced with a display guard.
  return value==null?'-':formatDate(value);
}
export function lostCertificateCard({item,index},formatDate) {
  return `<button type="button" class="lost-certificate-card" data-action="lost-detail" data-index="${index}"><span>Sertipikat milik <strong>${esc(text(item.pemohon))}</strong></span><span>Kelurahan/Desa ${esc(text(item.wilayah))}</span><span>Telah dilaporkan hilang pada ${esc(date(item.tanggalMulai,formatDate))}</span><span>Diumumkan hingga ${esc(date(item.tanggalSelesai,formatDate))}</span></button>`;
}
export function lostCertificateResults(model,{formatDate}={}) {
  if (model.pending.offices || model.pending.feed) return '<section class="panel lost-certificate-state" role="status"><p>Memuat pengumuman sertipikat hilang…</p></section>';
  if (model.errors.offices) return `<section class="panel lost-certificate-state"><h2>${LOST_CERTIFICATE_COPY.error}</h2><p class="notice error" role="alert">${esc(model.errors.offices)}</p><button type="button" class="button secondary" data-action="lost-retry-offices">Coba lagi daftar kantor</button></section>`;
  if (model.errors.feed) return `<section class="panel lost-certificate-state"><h2>${LOST_CERTIFICATE_COPY.error}</h2><p class="notice error" role="alert">${esc(model.errors.feed)}</p><button type="button" class="button secondary" data-action="lost-refresh">Coba lagi pengumuman</button></section>`;
  if (model.stage==='no-office') return `<section class="panel lost-certificate-state"><p>${LOST_CERTIFICATE_COPY.noOffice}</p></section>`;
  if (!model.entries.length) return `<section class="panel lost-certificate-state"><h2>${model.rows.length?'Tidak ada pengumuman yang cocok':LOST_CERTIFICATE_COPY.empty}</h2></section>`;
  return `<div class="lost-certificate-list" aria-label="Pengumuman Sertipikat Hilang">${model.entries.map(entry=>lostCertificateCard(entry,formatDate)).join('')}</div>`;
}
export function lostCertificateDetail(model,{formatDate,authenticated=false,mapHTML='',reviewsHTML=''}={}) {
  const detail=model.detail;if(!detail)return '';
  const item=detail.item,map=detail.map;
  const rows=[['Nomor',text(item.nomor)],['Tanggal mulai',date(item.tanggalMulai,formatDate)],['Tanggal selesai',date(item.tanggalSelesai,formatDate)],['NIB',text(item.nib)],['Nama Desa',text(item.wilayah)],['Luas',text(item.luas)],['Pemohon',text(item.pemohon)],['Nomor Berkas',text(item.nomorBerkas)],['Tanggal berkas',date(item.tanggalBerkas,formatDate)],['Tipe',text(item.tipe)]];
  let mapContent='';
  if(map.stage==='loading')mapContent='<p role="status">Memuat lokasi peta bidang…</p>';
  else if(map.stage==='error')mapContent=`<p class="notice error" role="alert">${esc(map.error)}</p>`;
  else if(map.stage==='empty')mapContent='<p class="notice">Batas bidang belum tersedia dari layanan.</p>';
  else if(map.stage==='ready')mapContent=mapHTML || '<p class="notice">Data batas bidang telah diterima. Peta sedang disiapkan.</p>';
  return `<section class="lost-certificate-detail" data-lost-detail><button type="button" class="button secondary" data-action="lost-back">Kembali ke pengumuman</button><section class="panel"><header><h2>${esc(text(item.pemohon))}</h2><p>${esc(date(item.tanggalMulai,formatDate))} - ${esc(date(item.tanggalSelesai,formatDate))}</p></header><dl class="detail-list lost-certificate-facts">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></section>${reviewsHTML || '<section class="panel lost-certificate-reviews"><h2>Ulasan</h2><p>Ulasan pengumuman belum tersedia di browser.</p></section>'}<section class="panel lost-certificate-map" aria-busy="${model.pending.map}"><h2>Lokasi Peta Bidang</h2><button type="button" class="button secondary" data-action="lost-map" ${!authenticated||model.pending.map?'disabled':''}>${model.pending.map?'Memuat lokasi…':['error','empty','ready'].includes(map.stage)?'Muat ulang lokasi peta bidang':'Lokasi Peta Bidang'}</button>${!authenticated?'<p class="form-hint">Masuk ke akun untuk membaca lokasi peta bidang.</p>':''}<div data-lost-map-result>${mapContent}</div></section></section>`;
}
export function lostCertificatesView(model,{available=true,authenticated=false,formatDate,mapHTML='',reviewsHTML=''}={}) {
  if (model.detail) return lostCertificateDetail(model,{formatDate,authenticated,mapHTML,reviewsHTML});
  return `<section data-lost-certificates><section class="panel lost-certificate-controls"><label class="parameter-field" for="lost-office"><span>Kantor Pertanahan</span><select id="lost-office" ${!available||model.pending.offices?'disabled':''}><option value="" disabled ${model.officeIndex===null?'selected':''}>${model.pending.offices?'Memuat kantor…':'Pilih Kantor Pertanahan'}</option>${model.offices.map((office,index)=>`<option value="${index}" ${model.officeIndex===index?'selected':''}>${esc(text(office.Nama))}</option>`).join('')}</select></label><label class="parameter-field" for="lost-query"><span>${LOST_CERTIFICATE_COPY.search}</span><input id="lost-query" type="search" autocomplete="off" placeholder="${LOST_CERTIFICATE_COPY.search}" value="${esc(model.query)}" ${!available?'disabled':''}></label><button type="button" class="button secondary" data-action="lost-refresh" ${!available||model.pending.offices||model.pending.feed||model.officeIndex===null?'disabled':''}>Perbarui pengumuman</button>${!available?'<p class="notice">Pembacaan pengumuman belum tersedia. Periksa koneksi.</p>':''}</section><div data-lost-results aria-live="polite">${lostCertificateResults(model,{formatDate})}</div></section>`;
}
