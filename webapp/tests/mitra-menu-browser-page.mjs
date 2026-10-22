// Fixture controls observe DOM and configure synthetic transport only.
// They never read or replace application controllers/variables.
const panel=document.createElement('aside');panel.id='mitra-fixture';
panel.innerHTML='<h2>MITRA KERJA · SINTETIS LOKAL</h2><p>Lima GET Mitra memakai aplikasi dan model aktual, tanpa server asli. Data error:true tetap mempunyai daftar bertipe. Kantor/provinsi mencakup ID raw ber-spasi, kosong, null, nama null dan markup. Pilihan dan pencarian dilakukan lewat kontrol aplikasi. Kontrol di bawah hanya mengubah respons lokal berikutnya. Alt+Shift+O merekam DOM saat dialog Informasi terbuka.</p><a href="#/partners">Buka Mitra Kerja</a><a href="#/services">Buka Layanan</a><label>Resep <select id="mitra-fixture-kind"><option value="offices">Kantor PPAT</option><option value="ppat">Daftar PPAT</option><option value="provinces">Provinsi Surveyor</option><option value="surveyor">Daftar Surveyor</option><option value="valuers">Penilai</option></select></label><label>Respons berikutnya <select id="mitra-fixture-mode"><option value="normal">Normal error:true + data</option><option value="string">Envelope JSON String sekali</option><option value="empty">Daftar kosong</option><option value="error">Error503</option><option value="malformed">Field bertipe salah</option><option value="hold">Tahan sukses sampai dilepas</option><option value="hold401">Tahan401 sampai dilepas</option></select></label><button id="mitra-fixture-set">Atur respons berikutnya</button><button id="mitra-fixture-release">Lepaskan pembacaan tertunda</button><button id="mitra-fixture-observe">Observe keadaan</button><button id="mitra-fixture-stop">Hentikan fixture</button><details><summary>Keadaan teramati</summary><pre id="mitra-fixture-status"></pre></details>';
document.body.append(panel);
const violations=[],imageErrors=[],unhandled=[];let blockedNavigations=0;
document.addEventListener('securitypolicyviolation',event=>{if(violations.length<40)violations.push({directive:event.effectiveDirective,blocked:event.blockedURI});});
document.addEventListener('error',event=>{if(event.target?.tagName==='IMG'&&imageErrors.length<40){const url=new URL(event.target.src,location.href);imageErrors.push({origin:url.origin,path:url.pathname});}},true);
window.addEventListener('unhandledrejection',event=>{if(unhandled.length<20)unhandled.push({name:event.reason?.name??'unknown',message:String(event.reason?.message??event.reason).slice(0,200)});});
document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(link&&new URL(link.href,location.href).origin!==location.origin){event.preventDefault();blockedNavigations++;}},true);
const local=async(route,data)=>{const response=await fetch(route,{method:data?'POST':'GET',credentials:'omit',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},...(data?{body:JSON.stringify(data)}:{})});if(!response.ok)throw Error('Mitra fixture control rejected');return response.json();};
const rect=node=>{if(!node)return null;const r=node.getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
function dom(){
 const main=document.querySelector('main'),search=main?.querySelector('#flow-search'),dialog=document.querySelector('#modal[open]');
 return{
  route:location.hash,viewport:{width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
  title:main?.querySelector('h1')?.textContent??null,headings:[...(main?.querySelectorAll('h2')??[])].map(node=>node.textContent),
  hasChild:!!main?.querySelector('[data-action="partner-back"]'),openDialogs:document.querySelectorAll('dialog[open]').length,
  tabs:[...(main?.querySelectorAll('[role="tab"]')??[])].map(node=>({text:node.textContent,id:node.dataset.id,action:node.dataset.action,selected:node.getAttribute('aria-selected'),disabled:node.disabled})),
  search:search?{value:search.value,placeholder:search.placeholder,label:search.closest('label')?.textContent,focused:document.activeElement===search,start:search.selectionStart,end:search.selectionEnd}:null,
  cards:[...(main?.querySelectorAll('.partner-card')??[])].map(card=>({title:card.querySelector('h3')?.textContent??null,text:card.textContent,fields:[...card.querySelectorAll('dl>div')].map(row=>({label:row.querySelector('dt')?.textContent,value:row.querySelector('dd')?.textContent})),badges:[...card.querySelectorAll('.badge')].map(node=>node.textContent),actions:[...card.querySelectorAll('[data-action]')].map(button=>({text:button.textContent,action:button.dataset.action,index:button.dataset.index,disabled:button.disabled})),rect:rect(card)})),
  buttons:[...(main?.querySelectorAll('button')??[])].map(node=>({text:node.textContent,action:node.dataset.action??null,id:node.dataset.id??null,index:node.dataset.index??null,disabled:node.disabled})),
  notices:[...(main?.querySelectorAll('.notice,.inline-error,[role="alert"]')??[])].map(node=>node.textContent),
  emptyText:main?.querySelector('.empty-state')?.textContent??null,dataHeading:main?.querySelector('.server-data-heading')?.textContent??null,
  inputNames:[...(main?.querySelectorAll('input,select,textarea')??[])].map(node=>({tag:node.tagName,type:node.type,id:node.id,name:node.name})),
  dialog:dialog?{title:dialog.querySelector('h2')?.textContent,text:dialog.textContent,rect:rect(dialog)}:null,
  unsafeNodes:main?.querySelectorAll('script,iframe,object,embed').length??0,unsafeEventAttributes:[...(main?.querySelectorAll('*')??[])].flatMap(node=>[...node.attributes].filter(attr=>/^on/i.test(attr.name)).map(attr=>attr.name)),
  violations:[...violations],imageErrors:[...imageErrors],unhandled:[...unhandled],blockedNavigations,
 };
}
async function observe(){const browser=dom();await local('/fixture/observe',browser);document.getElementById('mitra-fixture-status').textContent=JSON.stringify({browser,server:await local('/fixture/status')},null,2);return browser;}
document.getElementById('mitra-fixture-observe').addEventListener('click',()=>void observe());
document.addEventListener('keydown',event=>{if(event.altKey&&event.shiftKey&&event.key.toLowerCase()==='o'){event.preventDefault();void observe();}});
document.getElementById('mitra-fixture-set').addEventListener('click',async()=>{await local('/fixture/mode',{kind:document.getElementById('mitra-fixture-kind').value,mode:document.getElementById('mitra-fixture-mode').value});await observe();});
document.getElementById('mitra-fixture-release').addEventListener('click',async()=>{await local('/fixture/release',{});await observe();});
document.getElementById('mitra-fixture-stop').addEventListener('click',async event=>{const state=dom();if(state.route!=='#/partners'||state.hasChild||state.openDialogs){document.getElementById('mitra-fixture-status').textContent='Tutup dialog/detail dan kembali ke daftar induk Mitra Kerja dahulu.';return;}event.target.disabled=true;await local('/fixture/observe',state);await local('/fixture/stop',{route:state.route,openDialogs:0,hasChild:false});event.target.textContent='Fixture dihentikan';});
await observe();
