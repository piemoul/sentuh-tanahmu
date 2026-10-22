const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function swaplottingReviewView(review,error=''){
 if(error)return `<p class="notice notice-error" role="alert">${esc(error)}</p>`;
 if(!review)return '';
 return `<section class="swaplotting-review panel" aria-labelledby="swaplotting-review-title"><h3 id="swaplotting-review-title" tabindex="-1">Ringkasan draf</h3><p>Periksa nilai yang akan dipakai. Draf ini belum dikirim.</p><dl class="service-facts">${review.display.map(row=>`<div><dt>${esc(row.label)}</dt><dd class="swaplotting-review-value">${row.value.length?esc(row.value):`<em>${row.trimmed?'Kosong setelah spasi di awal/akhir dibuang':'Kosong'}</em>`}${row.trimmed&&row.value.length?'<small class="form-hint">Spasi di awal/akhir dibuang.</small>':''}</dd></div>`).join('')}</dl><h4>Foto dokumen</h4><ul>${review.dto.file.map(photo=>`<li>Foto ${photo.ordinal} · ${photo.byteLength} byte</li>`).join('')}</ul><button type="button" class="text-button" data-action="swaplotting-review-close">Tutup ringkasan</button></section>`;
}
