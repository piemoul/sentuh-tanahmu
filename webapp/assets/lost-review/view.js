// The native row's completed Future displays literal id_ID, not createdAt.
// See analysis/LOST-REVIEW-UI.md; this component does not invent an author/date.
const MEDIA_ORIGIN='https://sentuh.atrbpn.go.id';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function lostReviewPhotoUrl(value){
  if(typeof value!=='string')return null;
  try{const url=new URL(value);return url.origin===MEDIA_ORIGIN&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
function stars(rating){
  let value=null;try{if(rating!==null)value=BigInt(rating);}catch{}
  const label=value===null?'Penilaian belum tersedia':`Penilaian ${rating} dari 5`;
  return `<span class="lost-review-stars" role="img" aria-label="${esc(label)}">${Array.from({length:5},(_,index)=>`<span aria-hidden="true" class="${value!==null&&value>BigInt(index)?'filled':''}">★</span>`).join('')}</span>`;
}
function card(item,index){
  const photos=item.reviewPhotos??[];
  return `<article class="lost-review-card" data-lost-review-index="${index}">${stars(item.rating)}<p class="lost-review-comment">${esc(item.comment??'-')}</p>${photos.length?`<div class="lost-review-photos" aria-label="Foto ulasan">${photos.map((photo,index)=>{const url=lostReviewPhotoUrl(photo.mediaUrl);return url?`<img src="${esc(url)}" width="48" height="48" loading="lazy" referrerpolicy="no-referrer" alt="Foto ulasan ${index+1}">`:`<span class="lost-review-photo-unavailable" role="img" aria-label="Foto ulasan ${index+1} belum dapat ditampilkan">Foto belum tersedia</span>`;}).join('')}</div>`:''}<span class="lost-review-footer">id_ID</span></article>`;
}
export function lostReviewsView(model,{authenticated=false,available=true,canCompose=false}={}){
  let body='';
  if(!authenticated)body='<p class="form-hint">Masuk ke akun untuk melihat ulasan pengumuman.</p>';
  else if(!available)body='<p class="notice">Ulasan belum dapat dimuat. Periksa koneksi.</p>';
  else if(model.pending||model.stage==='idle'||model.stage==='loading')body='<p role="status">Memuat ulasan…</p>';
  else if(model.stage==='error')body=`<p class="notice error" role="alert">${esc(model.error)}</p><button type="button" class="button secondary" data-action="lost-review-retry">Coba lagi ulasan</button>`;
  else if(model.stage==='ready')body=`<div class="lost-review-list" aria-label="Daftar ulasan">${model.rows.map(card).join('')}</div>`;
  else if(model.stage==='empty')body='<div class="lost-review-empty"><img src="assets/lost-review/empty.png" alt="Belum ada ulasan" width="181" height="185"></div>';
  else body='<p class="form-hint">Masuk ke akun untuk melihat ulasan pengumuman.</p>';
  return `<section class="panel lost-certificate-reviews" data-lost-reviews aria-busy="${!!model.pending}"><h2>Ulasan</h2><div aria-live="polite">${body}</div><button type="button" class="button secondary" data-action="lost-review-compose" ${authenticated&&canCompose?'':'disabled'}>Beri Ulasan</button>${canCompose?'':'<p class="form-hint">Penulisan ulasan belum tersedia di browser.</p>'}</section>`;
}
