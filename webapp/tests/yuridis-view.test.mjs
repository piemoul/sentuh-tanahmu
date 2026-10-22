import test from 'node:test';
import assert from 'node:assert/strict';
import {yuridisRows,yuridisEntries} from '../assets/yuridis/model.js';
import {yuridisCard,yuridisResults,yuridisDetail,yuridisView} from '../assets/yuridis/view.js';
import {certificateDateDisplay} from './support/certificate-date-formatter.mjs';

const row={persilId:'PRIVATE-YURIDIS-PERSIL-ID',nomorBerkas:'Synthetic file 421',nomorPengumuman:'PRIVATE-UNRENDERED-ANNOUNCEMENT',tanggalMulai:'2026-10-20T13:24:35.123Z',tanggalSelesai:'2026-11-20',nib:'Synthetic NIB',wilayah:'Synthetic Village',luasPersil:123,pemohon:'Synthetic Applicant',permohonan:'PRIVATE-UNRENDERED-APPLICATION',kegiatan:'Rutin'};
const options={formatDate:certificateDateDisplay};
function state(input=[row]){
  const rows=yuridisRows({data:input});
  return {stage:rows.length?'ready':'empty',offices:[{KantorId:'PRIVATE-OFFICE-ID',Nama:'Synthetic Office'}],officeIndex:0,office:{KantorId:'PRIVATE-OFFICE-ID',Nama:'Synthetic Office'},officeId:'PRIVATE-OFFICE-ID',officeSource:'returned',rows,entries:yuridisEntries(rows,''),query:'',detail:null,pending:{offices:false,feed:false,map:false},errors:{offices:'',feed:''},revision:1};
}
function selected(model,index=0){
  model.detail={index,item:model.rows[index],revision:model.revision,map:{stage:'idle',metadata:null,geometry:null,error:''}};
  return model;
}
const facts=html=>[...html.matchAll(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/gs)].map(([,label,value])=>[label,value]);
const action=(html,name)=>{const matches=[...html.matchAll(/<button\b[^>]*>/g)].map(match=>match[0]).filter(tag=>tag.includes(`data-action="${name}"`));assert.equal(matches.length,1,`one ${name} button`);return matches[0];};

test('Yuridis cards show the native applicant, two actual formatted dates, village and badge without exposing hidden identifiers',()=>{
  const html=yuridisView(state(),options);
  for(const copy of ['Kantor Pertanahan','Cari nama/wilayah/no berkas','Synthetic Applicant','20 Oktober 2026','Synthetic Village','Selesai 20 November 2026','data-action="yuridis-detail" data-index="0"'])assert.ok(html.includes(copy),copy);
  assert.doesNotMatch(html,/PRIVATE-YURIDIS|PRIVATE-OFFICE|PRIVATE-UNRENDERED|name="persilId"|name="kantorId"/);
  assert.doesNotMatch(html,/Sertipikat milik|dilaporkan hilang|Tanggal berkas/);
  assert.match(html,/<button type="button" class="lost-certificate-card yuridis-card"/);
});

test('detail contains exactly the six native fact bindings, dates and source applicant; no lost-certificate facts or invented area unit',()=>{
  const html=yuridisView(selected(state()),{...options,authenticated:true});
  assert.deepEqual(facts(html),[['Nama Desa','Synthetic Village'],['NIB','Synthetic NIB'],['No Berkas','Synthetic file 421'],['Luas','123'],['Kegiatan','Rutin'],['Selesai','20 November 2026']]);
  assert.match(html,/<h2>Synthetic Applicant<\/h2>/);
  assert.match(html,/<p>20 Oktober 2026 - 20 November 2026<\/p>/);
  assert.equal((html.match(/20 November 2026/g)||[]).length,2);
  assert.doesNotMatch(html,/PRIVATE-|123\s*(?:m²|m2|meter)|<dt>(?:Tanggal mulai|Tanggal berkas|Nomor Pengumuman|Permohonan)<\/dt>|\.pdf|Lihat Dokumen/);
  assert.doesNotMatch(action(html,'yuridis-map'),/\bdisabled\b/);
  assert.ok(action(html,'yuridis-back'));
});

test('native area.toString null and int64 are preserved while nullable text/date browser guards remain explicit',()=>{
  const empty=yuridisView(selected(state([{}])),options);
  assert.deepEqual(facts(empty),[['Nama Desa','-'],['NIB','-'],['No Berkas','-'],['Luas','null'],['Kegiatan','-'],['Selesai','-']]);
  assert.match(empty,/<h2>-<\/h2><p>- - -<\/p>/);
  assert.doesNotMatch(empty,/undefined|Invalid Date/);
  const exact=yuridisView(selected(state([{...row,luasPersil:'9007199254740993',wilayah:'',nib:'',nomorBerkas:'',pemohon:'',kegiatan:''}])),options);
  assert.deepEqual(facts(exact).slice(0,5),[['Nama Desa',''],['NIB',''],['No Berkas',''],['Luas','9007199254740993'],['Kegiatan','']]);
  assert.match(exact,/<h2><\/h2>/);
  assert.doesNotMatch(exact,/9007199254740992|9007199254740993\s*m/);
});

test('badge selects orange only for exact Rutin and does not normalize native empty/null or case variants',()=>{
  for(const kegiatan of ['Rutin','rutin','RUTIN',' Rutin','Rutin ','',null]){
    const html=yuridisCard({item:{...row,kegiatan},index:0},certificateDateDisplay);
    const badge=html.match(/<span class="badge ([^"]+)">([^<]*)<\/span>/);
    assert.ok(badge,String(kegiatan));
    assert.equal(badge[1],kegiatan==='Rutin'?'badge-warning':'badge-info');
    assert.equal(badge[2],kegiatan===null?'-':kegiatan);
  }
});

test('search renders original selected-row indices, keeps duplicates and has no unproved hard record cap',()=>{
  const input=Array.from({length:137},(_,index)=>({...row,pemohon:`Applicant ${index}`,nomorBerkas:`File ${index}`,wilayah:index===135?'Needle Village':'Other Village'}));
  input[136]={...input[135]};
  const model=state(input);model.query='needle';model.entries=yuridisEntries(model.rows,model.query);
  const filtered=yuridisView(model,options);
  assert.deepEqual([...filtered.matchAll(/data-action="yuridis-detail" data-index="(\d+)"/g)].map(match=>Number(match[1])),[135,136]);
  assert.equal((filtered.match(/Needle Village/g)||[]).length,2);
  assert.match(yuridisView(selected(model,136),options),/<h2>Applicant 135<\/h2>/);
  const full=yuridisView(state(input),options);
  assert.equal((full.match(/data-action="yuridis-detail"/g)||[]).length,137);
  assert.doesNotMatch(full,/flow-page|Halaman \d|Berikutnya/);
  model.detail=null;model.query='PRIVATE-UNRENDERED';model.entries=yuridisEntries(model.rows,model.query);
  assert.match(yuridisView(model,options),/Tidak ada pengumuman yang cocok/);
});

test('card/detail dates delegate to the existing shipped formatter, preserve its parsing/fallback, and require a formatter',()=>{
  const item={...row,tanggalMulai:'1/1/2024 1:00:00 PM',tanggalSelesai:'not-a-date'};
  const calls=[];const formatDate=value=>{calls.push(value);return certificateDateDisplay(value);};
  let html=yuridisCard({item,index:4},formatDate);
  assert.match(html,/01 Januari 2024/);assert.match(html,/<span>Selesai -<\/span>/);
  assert.deepEqual(calls,[item.tanggalMulai,item.tanggalSelesai]);
  calls.length=0;html=yuridisDetail(selected(state([item])),{formatDate});
  assert.match(html,/<p>01 Januari 2024 - -<\/p>/);
  assert.deepEqual(facts(html).at(-1),['Selesai','-']);
  assert.equal(calls.filter(value=>value===item.tanggalMulai).length,1);
  assert.equal(calls.filter(value=>value===item.tanggalSelesai).length,2);
  assert.throws(()=>yuridisCard({item:row,index:0}),{message:'YURIDIS_DATE_FORMATTER_REQUIRED'});
  assert.throws(()=>yuridisDetail(selected(state())),{message:'YURIDIS_DATE_FORMATTER_REQUIRED'});
});

test('server strings, long mobile text, office names, query attributes and formatter output are escaped as content',()=>{
  const payload='<img src=x onerror="fixture()"> & \'<script>fixture()</script>';
  const long='Wilayah panjang '.repeat(220)+payload;
  const model=state([{...row,pemohon:payload,wilayah:long,nomorBerkas:payload,nib:payload,kegiatan:payload}]);
  model.offices[0].Nama=payload;model.query='" autofocus onfocus="fixture()';
  let html=yuridisView(model,options);
  assert.doesNotMatch(html,/<img src=x|<script>fixture|value="" autofocus|<option[^>]*onerror/);
  assert.match(html,/&lt;img src=x onerror=&quot;fixture\(\)&quot;&gt;/);
  assert.match(html,/value="&quot; autofocus onfocus=&quot;fixture\(\)"/);
  assert.ok(html.includes(long.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')));
  html=yuridisView(selected(model),{formatDate:()=>'<svg onload="fixture()">'});
  assert.doesNotMatch(html,/<svg|<script>|<img src=x/);
  assert.match(html,/&lt;svg onload=&quot;fixture\(\)&quot;&gt;/);
  assert.equal(facts(html).length,6);
});

test('loading, absent office, genuine empty, search-empty, office failure and feed failure stay distinct',()=>{
  const model=state([]);
  assert.match(yuridisView(model,options),/Belum ada Pengumuman Yuridis/);
  model.stage='no-office';model.officeIndex=null;model.officeId=null;
  assert.match(yuridisView(model,options),/Kamu belum punya kantor favorit, nih!/);
  model.errors.offices='<office unavailable>';
  let html=yuridisView(model,options);assert.match(html,/&lt;office unavailable&gt;/);assert.ok(action(html,'yuridis-retry-offices'));
  model.errors.offices='';model.errors.feed='<feed unavailable>';
  // The full page also retains its toolbar refresh. Check the error panel's
  // recovery action without imposing a non-native page-wide uniqueness rule.
  html=yuridisResults(model,options);assert.match(html,/&lt;feed unavailable&gt;/);assert.match(html,/Gagal mengambil data/);assert.ok(action(html,'yuridis-refresh'));
  model.pending.feed=true;html=yuridisResults(model,options);assert.match(html,/role="status"/);assert.doesNotMatch(html,/Belum ada Pengumuman|Gagal mengambil data/);
  model.pending.feed=false;model.errors.feed='';model.stage='ready';model.rows=state().rows;model.entries=[];
  assert.match(yuridisResults(model,options),/Tidak ada pengumuman yang cocok/);
});

test('a favorite-office fallback can show returned rows and refresh without a fabricated picker selection',()=>{
  const model=state();model.offices=[];model.officeIndex=null;model.office=null;model.officeId='PRIVATE-FAVORITE-ID';model.officeSource='favorite';
  const html=yuridisView(model,options);
  assert.match(html,/Synthetic Applicant/);
  assert.doesNotMatch(action(html,'yuridis-refresh'),/\bdisabled\b/);
  assert.match(html,/<option value="" disabled selected>/);
  assert.doesNotMatch(html,/PRIVATE-FAVORITE-ID|value="0"[^>]*selected|Kamu belum punya kantor favorit/);
});

test('an office-picker failure remains a retryable warning alongside a successful favorite-office feed',()=>{
  const model=state();model.offices=[];model.officeIndex=null;model.office=null;model.officeId='PRIVATE-FAVORITE-ID';model.officeSource='favorite';model.errors.offices='<office picker timeout>';
  let html=yuridisView(model,options);
  assert.match(html,/Synthetic Applicant/);assert.match(html,/&lt;office picker timeout&gt;/);assert.ok(action(html,'yuridis-retry-offices'));
  assert.doesNotMatch(action(html,'yuridis-refresh'),/\bdisabled\b/);
  assert.doesNotMatch(html,/Kamu belum punya kantor favorit|PRIVATE-FAVORITE-ID/);
  model.rows=[];model.entries=[];model.stage='empty';html=yuridisView(model,options);
  assert.match(html,/Belum ada Pengumuman Yuridis/);assert.match(html,/&lt;office picker timeout&gt;/);
});

test('a missing effective office, unavailable adapter or pending feed cannot present an enabled refresh',()=>{
  const model=state([]);model.officeIndex=null;model.office=null;model.officeId=null;model.officeSource=null;model.stage='no-office';
  assert.match(action(yuridisView(model,options),'yuridis-refresh'),/\bdisabled\b/);
  model.officeId='FAVORITE';model.officeSource='favorite';model.pending.feed=true;
  assert.match(action(yuridisView(model,options),'yuridis-refresh'),/\bdisabled\b/);
  model.pending.feed=false;
  assert.match(action(yuridisView(model,{...options,available:false}),'yuridis-refresh'),/\bdisabled\b/);
});

test('map stays an explicit authenticated read; every outcome preserves detail facts and root-owned review/map slots',()=>{
  const model=selected(state());let html=yuridisView(model,options);
  assert.match(action(html,'yuridis-map'),/\bdisabled\b/);assert.match(html,/Masuk ke akun untuk membaca lokasi peta bidang/);
  model.pending.map=true;model.detail.map.stage='loading';html=yuridisView(model,{...options,authenticated:true});
  assert.match(action(html,'yuridis-map'),/\bdisabled\b/);assert.match(html,/aria-busy="true"/);assert.match(html,/Memuat lokasi peta bidang/);
  model.pending.map=false;model.detail.map={stage:'error',error:'<map unavailable>'};html=yuridisView(model,{...options,authenticated:true});
  assert.match(html,/&lt;map unavailable&gt;/);assert.deepEqual(facts(html)[2],['No Berkas','Synthetic file 421']);
  model.detail.map={stage:'empty'};assert.match(yuridisView(model,{...options,authenticated:true}),/Batas bidang belum tersedia dari layanan/);
  model.detail.map={stage:'ready'};html=yuridisView(model,{...options,authenticated:true,mapHTML:'<div data-synthetic-map="ready"></div>',reviewsHTML:'<section data-synthetic-review="read"></section>'});
  assert.match(html,/<div data-synthetic-map="ready"><\/div>/);assert.match(html,/<section data-synthetic-review="read"><\/section>/);
  assert.equal(facts(html).length,6);assert.doesNotMatch(html,/PRIVATE-|navigator|geolocation|UploadGeotag|<form|type="submit"/);
  assert.equal(yuridisDetail(state(),options),'');
});
