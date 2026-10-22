import {homeBannerImageUrl,homeExternalUrl,homeYoutubeThumbnailUrl,homeYoutubeEmbedUrl} from './model.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds=new Set(['banner','youtube']);
const titles={banner:'Informasi pilihan',youtube:'Ikuti Kanal video Kami'};

function bannerCard(row,index){
 const image=homeBannerImageUrl(row.path),url=homeExternalUrl(row.externalUrl);
 const content=`<span class="home-banner-image">${image?`<img src="${esc(image)}" alt="Banner informasi ${index+1}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'<span class="home-media-placeholder">Gambar informasi belum tersedia.</span>'}</span>`;
 return url&&image?`<a class="home-banner-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" aria-label="Buka informasi ${index+1} — tab baru">${content}</a>`:`<button type="button" class="home-banner-card" disabled aria-label="Informasi ${index+1} — tautan belum tersedia">${content}</button>`;
}

function youtubeCard(row,index,generation){
 const thumbnail=homeYoutubeThumbnailUrl(row.thumbnailUrl),playable=!!homeYoutubeEmbedUrl(row.videoId),title=row.title??'';
 return `<button type="button" class="home-youtube-card" data-home-media-action="play" data-home-media-index="${index}" data-home-media-generation="${esc(generation)}" ${playable?'':'disabled'} aria-label="${esc(title||`Video ${index+1}`)}${playable?' — putar video':' — video belum tersedia'}"><span class="home-youtube-thumbnail">${thumbnail?`<img src="${esc(thumbnail)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'<span aria-hidden="true" class="home-media-placeholder">▶</span>'}</span><span class="home-youtube-title">${esc(title)}</span></button>`;
}

export function homeMediaSection(kind,model,{playerError=''}={}){
 if(!kinds.has(kind))return '';
 const state=model?.[kind]??{rows:[],loading:false,error:'',attempted:false,generation:0};
 const rows=Array.isArray(state.rows)?state.rows:[],loading=state.loading===true;
 const feedback=loading?`<p class="home-media-feedback" role="status">Memuat ${kind==='banner'?'informasi':'kanal video'}…</p>`:state.error?`<p class="home-media-feedback notice notice-error" role="alert">${esc(state.error)}</p>`:!rows.length?`<p class="home-media-feedback">${state.attempted?'Belum ada '+(kind==='banner'?'informasi':'video')+' yang ditampilkan.':'Informasi akan dimuat.'}</p>`:'';
 const cards=rows.length?(kind==='banner'?`<div class="home-banner-strip" aria-label="Informasi pilihan">${rows.map(bannerCard).join('')}</div>`:`<div class="home-youtube-strip" aria-label="Video kanal Sentuh Tanahku">${rows.map((row,index)=>youtubeCard(row,index,state.generation)).join('')}</div>`):kind==='youtube'?`<div class="home-youtube-strip home-youtube-skeleton${loading?' is-loading':''}" aria-hidden="true">${Array.from({length:4},()=>'<div class="home-youtube-card home-youtube-placeholder"><span class="home-youtube-thumbnail"></span><span class="home-youtube-title"></span></div>').join('')}</div>`:'';
 return `<div class="home-media-heading"><h2 id="home-media-${kind}-heading">${titles[kind]}</h2><button type="button" class="text-button" data-home-media-action="reload-${kind}" ${loading?'disabled':''}>${loading?'Memuat…':state.error?'Coba lagi':'Muat ulang'}</button></div>${feedback}${cards}${kind==='youtube'&&playerError?`<p class="home-media-feedback notice notice-error" role="alert">${esc(playerError)}</p>`:''}`;
}

export function homeMediaShell(model,options={}){
 return `<div class="home-media" data-home-media>${['banner','youtube'].map(kind=>`<section class="panel home-media-section" data-home-media-section="${kind}" aria-labelledby="home-media-${kind}-heading" aria-busy="${model?.[kind]?.loading===true}">${homeMediaSection(kind,model,options)}</section>`).join('')}</div>`;
}
