// Additive visible controls and DOM observations. Application state is untouched.
const panel=document.createElement('aside');
panel.id='lost-fixture';
panel.innerHTML='<h2>ULASAN SERTIPIKAT HILANG · SINTETIS LOKAL</h2><p>Kasus kartu: 0 = 13 ulasan, null, markup dan foto; 1 = berkasId null; 3 = gagal503 lalu retry; 5 = tunda1500ms; 6 = sesi401; 7 = kosong. Foto dan raster peta berasal dari fixture lokal. Tidak ada akun asli, request provider, GPS, unggahan atau penulisan ulasan.</p><a href="#/lost">Buka Sertipikat Hilang</a><a href="#/services">Buka Layanan</a><button id="fixture-observe">Observe keadaan</button><button id="fixture-slow">Tunda ulasan berikutnya</button><button id="fixture-expire">Akhiri sesi pada ulasan berikutnya</button><button id="fixture-stop">Hentikan fixture</button><details><summary>Keadaan uji teramati</summary><pre id="fixture-status"></pre></details>';
document.body.append(panel);
const violations=[],imageErrors=[];
let blockedNavigations=0;
document.addEventListener('securitypolicyviolation',event=>{
  if(violations.length<60)violations.push({directive:event.effectiveDirective,blocked:event.blockedURI});
});
document.addEventListener('error',event=>{
  const image=event.target;
  if(image?.matches?.('.lost-review-photos img')&&imageErrors.length<60){
    const url=new URL(image.src,location.href);
    imageErrors.push({origin:url.origin,path:url.pathname,complete:image.complete,naturalWidth:image.naturalWidth});
  }
},true);
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
  const field=document.querySelector('#lost-query'),detail=document.querySelector('[data-lost-detail]'),reviews=document.querySelector('[data-lost-reviews]'),list=reviews?.querySelector('.lost-review-list'),map=detail?.querySelector('.lost-certificate-map');
  const maps=[...document.querySelectorAll('[data-official-map]')],tiles=[...document.querySelectorAll('.leaflet-tile')];
  return {
    route:location.hash,
    viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
    title:document.querySelector('main h1')?.textContent??null,
    openDialogs:document.querySelectorAll('dialog[open]').length,hasDetail:!!detail,
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
    violations:[...violations],imageErrors:[...imageErrors],blockedNavigations,
  };
}
async function observe(){
  const browser=dom();
  await local('/fixture/observe',browser);
  document.getElementById('fixture-status').textContent=JSON.stringify({browser,server:await local('/fixture/status')},null,2);
  return browser;
}
document.getElementById('fixture-observe').addEventListener('click',()=>void observe());
document.getElementById('fixture-slow').addEventListener('click',async()=>{await local('/fixture/slow-review',{});await observe();});
document.getElementById('fixture-expire').addEventListener('click',async()=>{await local('/fixture/expire-review',{});await observe();});
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
