// Additive visible controls and DOM observations. Application state is untouched.
const panel=document.createElement('aside');
panel.id='lost-fixture';
panel.innerHTML='<h2>KIRIM ULASAN · SINTETIS LOKAL</h2><p>Form, galeri dan submit memakai modul aplikasi asli. Pilih berkas melalui input galeri aplikasi: empty.png lalu marker-icon.png. Berkas asli dan hash sumber terlihat pada keadaan uji. Kartu0 = sukses200; kartu3 = percobaan pertama201 lalu retry200; kartu5 = POST tertunda4detik; kartu6 = 401tertunda4detik; kartu7 = error503. Kontrol mode mengubah respons fixture berikutnya saja. Tidak ada server asli, akun, GPS atau provider. Tekan Alt+Shift+O untuk merekam DOM ketika modal terbuka.</p><a href="#/lost">Buka Sertipikat Hilang</a><a href="#/services">Buka Layanan</a><a href="/fixture/sample/0.png" download="empty.png">Unduh empty.png sintetis</a><a href="/fixture/sample/1.png" download="marker-icon.png">Unduh marker-icon.png sintetis</a><button id="fixture-observe">Observe keadaan</button><button id="fixture-slow">Tunda baca ulasan berikutnya5detik</button><label>POST berikutnya <select id="fixture-post-mode"><option value="200">Sukses200</option><option value="201">Gagal201</option><option value="slow">Tunda4detik lalu200</option><option value="stale401">Tunda4detik lalu401</option><option value="error">Error503</option></select></label><button id="fixture-post-set">Atur mode POST</button><button id="fixture-stop">Hentikan fixture</button><details><summary>Keadaan uji teramati</summary><pre id="fixture-status"></pre></details>';
document.body.append(panel);
const violations=[],imageErrors=[],galleryEvents=[],unhandled=[];
let blockedNavigations=0;
document.addEventListener('securitypolicyviolation',event=>{
  if(violations.length<60)violations.push({directive:event.effectiveDirective,blocked:event.blockedURI});
});
document.addEventListener('error',event=>{
  const image=event.target;
  if(image?.matches?.('.lost-review-photos img,.lost-review-compose-photos img')&&imageErrors.length<60){
    const url=new URL(image.src,location.href);
    imageErrors.push({origin:url.origin,path:url.pathname,complete:image.complete,naturalWidth:image.naturalWidth});
  }
},true);
window.addEventListener('unhandledrejection',event=>{if(unhandled.length<20)unhandled.push({name:event.reason?.name??'unknown',message:String(event.reason?.message??event.reason).slice(0,200)});});
document.addEventListener('click',event=>{if(event.target.matches?.('[data-review-file]'))galleryEvents.push({kind:'open-chooser'});},true);
document.addEventListener('change',event=>{if(event.target.matches?.('[data-review-file]'))galleryEvents.push({kind:'selection',files:[...event.target.files].map(file=>({name:file.name,bytes:file.size,type:file.type}))});},true);
document.addEventListener('cancel',event=>{if(event.target.matches?.('.lost-review-compose'))queueMicrotask(()=>void observe());},true);
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(link&&new URL(link.href,location.href).origin!==location.origin){event.preventDefault();blockedNavigations++;}
},true);
const local=async(route,data)=>{
  const response=await fetch(route,{method:data?'POST':'GET',credentials:'omit',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},...(data?{body:JSON.stringify(data)}:{})});
  if(!response.ok)throw Error('Fixture request rejected');
  return response.json();
};
const rect=node=>{if(!node)return null;const value=node.getBoundingClientRect();return {width:value.width,height:value.height,left:value.left,right:value.right,top:value.top,bottom:value.bottom};};
function dom(){
  const field=document.querySelector('#lost-query'),detail=document.querySelector('[data-lost-detail]'),reviews=document.querySelector('[data-lost-reviews]'),list=reviews?.querySelector('.lost-review-list'),map=detail?.querySelector('.lost-certificate-map'),compose=document.querySelector('dialog.lost-review-compose'),comment=compose?.querySelector('#lost-review-comment');
  const maps=[...document.querySelectorAll('[data-official-map]')],tiles=[...document.querySelectorAll('.leaflet-tile')];
  return {
    route:location.hash,
    viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
    title:document.querySelector('main h1')?.textContent??null,
    openDialogs:document.querySelectorAll('dialog[open]').length,hasDetail:!!detail,
    compose:compose?{open:compose.open,text:compose.textContent,rect:rect(compose),busy:!!compose.querySelector('[aria-busy="true"]'),formCount:compose.querySelectorAll('[data-review-compose-form]').length,submitDisabled:compose.querySelector('[data-review-submit]')?.disabled??null,closeDisabled:compose.querySelector('[data-review-close]')?.disabled??null,comment:comment?{value:comment.value,focused:document.activeElement===comment,start:comment.selectionStart,end:comment.selectionEnd}:null,ratingButtons:[...compose.querySelectorAll('[data-review-rate]')].map(button=>({value:button.dataset.reviewRate,filled:button.classList.contains('filled'),pressed:button.getAttribute('aria-pressed'),disabled:button.disabled})),photos:[...compose.querySelectorAll('[data-review-photo]')].map(figure=>{const image=figure.querySelector('img');return{id:figure.dataset.reviewPhoto,name:figure.querySelector('figcaption')?.textContent,removeDisabled:figure.querySelector('[data-review-remove]')?.disabled??null,preview:image?{scheme:image.src.split(':')[0],complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,width:image.width,height:image.height}:null};}),picker:compose.querySelector('[data-review-file]')?{accept:compose.querySelector('[data-review-file]').accept,multiple:compose.querySelector('[data-review-file]').multiple,capture:compose.querySelector('[data-review-file]').getAttribute('capture')}:null,errors:[...compose.querySelectorAll('[role="alert"]')].map(node=>node.textContent),unsafeNodes:compose.querySelectorAll('script,iframe,object,embed').length,unsafeEventAttributes:[...compose.querySelectorAll('*')].flatMap(node=>[...node.attributes].filter(a=>/^on/i.test(a.name)).map(a=>a.name))}:null,
    cardCount:document.querySelectorAll('.lost-certificate-card').length,
    cards:[...document.querySelectorAll('.lost-certificate-card')].map(node=>({index:node.dataset.index,text:node.textContent,blocks:[...node.children].map(child=>child.textContent)})),
    officeValue:document.querySelector('#lost-office')?.value??null,
    officeOptions:[...document.querySelectorAll('#lost-office option')].map(node=>({value:node.value,label:node.textContent,selected:node.selected})),
    query:field?{value:field.value,focused:document.activeElement===field,start:field.selectionStart,end:field.selectionEnd}:null,
    facts:[...document.querySelectorAll('.lost-certificate-facts>div')].map(node=>({label:node.querySelector('dt')?.textContent,value:node.querySelector('dd')?.textContent})),
    detailHeader:detail?.querySelector('header')?.textContent??null,
    reviewCount:reviews?.querySelectorAll('.lost-review-card').length??0,
    reviewCards:[...(reviews?.querySelectorAll('.lost-review-card')??[])].map(node=>({
      index:node.dataset.lostReviewIndex,comment:node.querySelector('.lost-review-comment')?.textContent??null,
      stars:node.querySelector('.lost-review-stars')?.getAttribute('aria-label')??null,
      filledStars:node.querySelectorAll('.lost-review-stars .filled').length,
      totalStars:node.querySelectorAll('.lost-review-stars>span').length,
      footer:node.querySelector('.lost-review-footer')?.textContent??null,
      photos:[...node.querySelectorAll('.lost-review-photos img')].map(image=>{const url=new URL(image.src,location.href);return {origin:url.origin,path:url.pathname,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,loading:image.loading,width:image.getAttribute('width'),height:image.getAttribute('height'),rect:rect(image)};}),
      unavailablePhotos:node.querySelectorAll('.lost-review-photo-unavailable').length,
      rect:rect(node),
    })),
    reviewList:list?{rect:rect(list),clientHeight:list.clientHeight,scrollHeight:list.scrollHeight,clientWidth:list.clientWidth,scrollWidth:list.scrollWidth,scrollTop:list.scrollTop,overflow:getComputedStyle(list).overflowY}:null,
    reviewSection:reviews?{text:reviews.textContent,rect:rect(reviews),busy:reviews.getAttribute('aria-busy'),beforeMap:!!map&&!!(reviews.compareDocumentPosition(map)&Node.DOCUMENT_POSITION_FOLLOWING)}:null,
    reviewButtons:[...(reviews?.querySelectorAll('button')??[])].map(button=>({text:button.textContent,action:button.dataset.action??null,disabled:button.disabled})),
    reviewEmptyImage:reviews?.querySelector('.lost-review-empty img')?{src:reviews.querySelector('.lost-review-empty img').getAttribute('src'),complete:reviews.querySelector('.lost-review-empty img').complete,naturalWidth:reviews.querySelector('.lost-review-empty img').naturalWidth}:null,
    reviewErrors:[...(reviews?.querySelectorAll('[role="alert"]')??[])].map(node=>node.textContent),
    reviewInputs:reviews?.querySelectorAll('input,textarea,form').length??0,
    unsafeReviewContentNodes:reviews?.querySelectorAll('script,iframe,object,embed').length??0,
    unsafeReviewEventAttributes:[...(reviews?.querySelectorAll('*')??[])].flatMap(node=>[...node.attributes].filter(attribute=>/^on/i.test(attribute.name)).map(attribute=>attribute.name)),
    mapStatuses:maps.map(node=>({text:node.querySelector('.official-map-status')?.textContent,zoom:node.querySelector('.parcel-map-zoom')?.textContent})),
    mapCount:maps.length,markerCount:document.querySelectorAll('.leaflet-marker-icon').length,vectorCount:document.querySelectorAll('.leaflet-overlay-pane path').length,
    tiles:tiles.map(node=>({src:new URL(node.src).pathname,complete:node.complete,width:node.naturalWidth})),
    detailText:detail?.textContent??null,resultText:document.querySelector('[data-lost-results]')?.textContent??null,
    violations:[...violations],imageErrors:[...imageErrors],blockedNavigations,galleryEvents:[...galleryEvents],unhandled:[...unhandled],
  };
}
async function observe(){
  const browser=dom();
  await local('/fixture/observe',browser);
  document.getElementById('fixture-status').textContent=JSON.stringify({browser,server:await local('/fixture/status')},null,2);
  return browser;
}
document.getElementById('fixture-observe').addEventListener('click',()=>void observe());
document.addEventListener('keydown',event=>{if(event.altKey&&event.shiftKey&&event.key.toLowerCase()==='o'){event.preventDefault();void observe();}});
document.getElementById('fixture-slow').addEventListener('click',async()=>{await local('/fixture/slow-review',{});await observe();});
document.getElementById('fixture-post-set').addEventListener('click',async()=>{await local('/fixture/post-mode',{mode:document.getElementById('fixture-post-mode').value});await observe();});
document.getElementById('fixture-stop').addEventListener('click',async event=>{
  const state=dom();
  if(state.openDialogs||state.hasDetail||state.route!=='#/lost'){
    document.getElementById('fixture-status').textContent='Tutup detail melalui aplikasi dan kembali ke Sertipikat Hilang dahulu.';
    return;
  }
  event.target.disabled=true;
  await local('/fixture/observe',state);
  await local('/fixture/stop',{openDialogs:0,route:location.hash,hasDetail:false});
  event.target.textContent='Fixture dihentikan';
});
await observe();
