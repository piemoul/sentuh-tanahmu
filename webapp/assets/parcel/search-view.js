import {parcelSearchRights,parcelSearchCopy} from './search-model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=text=>`<p class="notice notice-error" role="alert">${esc(text)}</p>`;
const loading=model=>model.pending.lookup||model.pending.boundary;
export function parcelSearchFeedback(model){
 const errors=[model.errors.input,model.errors.lookup].filter(Boolean);
 return [...new Set(errors)].map(message).join('');
}
export function parcelSearchResult(model,{map='',actions=''}={}){
 if(model.pending.lookup)return '<div class="parcel-search-placeholder" role="status"><h2>Mencari bidang tanah…</h2><p>Menunggu hasil pencarian dari layanan.</p></div>';
 if(model.pending.boundary)return '<div class="parcel-search-placeholder" role="status"><h2>Memuat batas bidang…</h2><p>Membuka peta untuk bidang yang ditemukan.</p></div>';
 if(model.noMatch)return `<div class="parcel-search-placeholder" role="status"><h2>${esc(model.notFoundTitle||parcelSearchCopy.notFound)}</h2><p>${esc(model.suggestion)}</p></div>`;
 if(model.errors.boundary)return `<div class="parcel-search-placeholder">${message(model.errors.boundary)}<button type="button" class="button secondary" data-action="parcel-search-again">Coba lagi pencarian</button></div>`;
 if(model.geometryStatus==='ready')return map+actions;
 if(model.geometryStatus==='empty')return '<div class="parcel-search-placeholder" role="status"><h2>Batas bidang belum tersedia</h2><p>Bidang ditemukan, tetapi layanan mengembalikan batas kosong.</p></div>';
 return '<div class="parcel-search-placeholder"><img src="assets/icons/location.svg" alt=""><h2>Cari lokasi bidang tanah</h2><p>Pilih jenis sertipikat dan lengkapi data pencarian. Peta akan menampilkan bidang yang ditemukan.</p></div>';
}
export function parcelSearchView(model,{available=true,map='',actions=''}={}){
 const busy=loading(model),disabled=busy||!available,analog=model.tab===0;
 const placeholder=(text,selected)=>`<option value="" disabled ${selected?'selected':''}>${text}</option>`;
 const tabs=parcelSearchCopy.tabs.map((label,index)=>`<button type="button" id="parcel-search-tab-${index}" role="tab" aria-controls="parcel-search-fields" aria-selected="${model.tab===index}" class="${model.tab===index?'active':''}" data-action="parcel-search-tab" data-index="${index}" ${busy?'disabled':''}>${label}</button>`).join('');
 const rights=parcelSearchRights.map(row=>`<option value="${row.code}" ${row.code===model.right?'selected':''}>${row.label}</option>`).join('');
 const offices=model.offices.map((row,index)=>`<option value="${index}" ${index===model.officeIndex?'selected':''} ${typeof row.KantorId!=='string'||row.KantorId===''?'disabled':''}>${esc(row.Nama??'Kantor tanpa nama')}</option>`).join('');
 const regions=model.regions.map((row,index)=>`<option value="${index}" ${index===model.regionIndex?'selected':''} ${typeof row.code!=='string'||row.code===''?'disabled':''}>${esc(row.name??'Wilayah tanpa nama')}</option>`).join('');
 const fields=analog?`
  <label class="parameter-field" for="parcel-search-right"><span>Jenis Hak</span><select id="parcel-search-right" ${disabled?'disabled':''}>${placeholder('Pilih Jenis Hak',model.right===null)}${rights}</select></label>
  <label class="parameter-field" for="parcel-search-office"><span>Kantor Pertanahan</span><select id="parcel-search-office" ${disabled||model.pending.offices?'disabled':''}>${placeholder(model.pending.offices?'Memuat kantor…':'Pilih Kantor Pertanahan',model.officeIndex===null)}${offices}</select></label>
  ${model.errors.offices?`${message(model.errors.offices)}<button type="button" class="text-button" data-action="parcel-search-offices">Coba lagi daftar kantor</button>`:!model.pending.offices&&!model.offices.length?'<p class="form-hint">Daftar kantor belum tersedia.</p>':''}
  <label class="parameter-field" for="parcel-search-region"><span>Desa/Kelurahan</span><select id="parcel-search-region" ${disabled||!model.office||model.pending.regions||!model.regionEnabled?'disabled':''}>${placeholder(model.pending.regions?'Memuat wilayah…':!model.regionEnabled?'Tidak wajib untuk jenis hak ini':'Pilih Desa/Kelurahan',model.regionIndex===null)}${regions}</select></label>
  ${model.errors.regions?`${message(model.errors.regions)}<button type="button" class="text-button" data-action="parcel-search-regions">Coba lagi daftar wilayah</button>`:model.office&&!model.pending.regions&&!model.regions.length&&model.regionEnabled?'<p class="form-hint">Daftar Desa/Kelurahan kosong untuk kantor ini.</p>':''}
  <label class="parameter-field" for="parcel-search-number"><span>Nomor Hak Sertipikat</span><input id="parcel-search-number" name="number" type="text" autocomplete="off" value="${esc(model.number)}" ${disabled?'disabled':''}></label>`:
  `<label class="parameter-field" for="parcel-search-nibel"><span>NIBEL</span><input id="parcel-search-nibel" name="nibel" type="text" autocomplete="off" value="${esc(model.rawNibel)}" ${disabled?'disabled':''}></label>`;
 return `<section data-parcel-search><div class="service-tabs parcel-search-tabs" role="tablist" aria-label="Jenis sertipikat">${tabs}</div><div class="parcel-search-layout"><section class="panel parcel-search-form-panel"><form id="parcel-search-form" novalidate><div id="parcel-search-fields" role="tabpanel" aria-labelledby="parcel-search-tab-${model.tab}">${fields}</div><div data-parcel-search-feedback aria-live="polite">${parcelSearchFeedback(model)}</div>${!available?'<p class="notice notice-warning">Pencarian bidang belum siap. Periksa koneksi dan masuk kembali bila diperlukan.</p>':''}<button type="submit" class="button" ${disabled||model.pending.offices||analog&&model.pending.regions?'disabled':''}>${busy?'Mencari…':'Cari bidang tanah'}</button></form></section><section class="panel parcel-search-result" data-parcel-search-result aria-busy="${busy}">${parcelSearchResult(model,{map,actions})}</section></div></section>`;
}
