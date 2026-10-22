import test from 'node:test';
import assert from 'node:assert/strict';
import {createLostCertificates} from '../assets/lost-certificate/controller.js';
import {lostCertificateRows,lostCertificateEntries} from '../assets/lost-certificate/model.js';
import {lostCertificatesView,lostCertificateCard} from '../assets/lost-certificate/view.js';
import {certificateDateDisplay} from './support/certificate-date-formatter.mjs';

const row={nomor:'Synthetic certificate',persilId:'PRIVATE-PARCEL-ID',berkasId:'PRIVATE-FILE-ID',dI304Id:'PRIVATE-NOTICE-ID',pemohon:'Synthetic Owner',wilayah:'Synthetic Village',nib:'Synthetic NIB',nomorBerkas:'Synthetic file number',tanggalMulai:'2026-10-20T13:24:35.123Z',tanggalSelesai:'2026-11-20',tanggalBerkas:'2026-09-20',tipe:'Synthetic type',luas:123};
function state(rows=[row]) {return {...createLostCertificates({read:()=>{}}).snapshot(),stage:rows.length?'ready':'empty',offices:[{KantorId:'PRIVATE-OFFICE-ID',Nama:'Synthetic Office'}],officeIndex:0,office:{KantorId:'PRIVATE-OFFICE-ID',Nama:'Synthetic Office'},rows:lostCertificateRows({data:rows}),entries:lostCertificateEntries(lostCertificateRows({data:rows}),''),query:''};}
const options={formatDate:certificateDateDisplay};
const detail=(model,item=model.rows[0])=>{model.detail={index:0,item,revision:1,map:{stage:'idle',metadata:null,geometry:null,error:''}};return model;};

test('list has the office chooser and native search/copy, formats both card dates with the shipped Dart bundle',()=>{
  const html=lostCertificatesView(state(),options);
  for(const text of ['id="lost-office"','id="lost-query"','Cari nama atau no berkas','Sertipikat milik','Kelurahan/Desa','Telah dilaporkan hilang pada 20 Oktober 2026','Diumumkan hingga 20 November 2026','data-action="lost-detail" data-index="0"'])assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/PRIVATE-(?:PARCEL|FILE|NOTICE|OFFICE)-ID/);assert.doesNotMatch(html,/ID kantor|name="kantorId"/);
  assert.throws(()=>lostCertificateCard({item:row,index:0}),{message:'LOST_CERTIFICATE_DATE_FORMATTER_REQUIRED'});
});
test('detail renders the10 native facts in order, five date appearances and no fabricated PDF or area unit',()=>{
  const model=detail(state()),html=lostCertificatesView(model,{...options,authenticated:true});
  const labels=[...html.matchAll(/<dt>(.*?)<\/dt>/g)].map(match=>match[1]);assert.deepEqual(labels,['Nomor','Tanggal mulai','Tanggal selesai','NIB','Nama Desa','Luas','Pemohon','Nomor Berkas','Tanggal berkas','Tipe']);
  assert.equal((html.match(/20 Oktober 2026/g)||[]).length,2);assert.equal((html.match(/20 November 2026/g)||[]).length,2);assert.ok(html.includes('20 September 2026'));assert.match(html,/<dt>Luas<\/dt><dd>123<\/dd>/);
  assert.doesNotMatch(html,/123 m|\.pdf|Lihat Dokumen|GetDocument|href=.*dokumen/i);assert.match(html,/Ulasan pengumuman belum tersedia/);assert.doesNotMatch(html,/<(?:form|textarea)|type="submit"/);
  assert.match(html,/data-action="lost-map"(?![^>]*disabled)/);assert.match(html,/data-action="lost-back"/);
});
test('server/null/empty strings remain escaped and distinct; failed/null dates use the explicit browser guard',()=>{
  const injected={...row,pemohon:'<img src=x onerror=1>',wilayah:'<script>fixture()</script>',nomor:'',tanggalMulai:null,tanggalSelesai:'invalid',tanggalBerkas:'1/1/2024 1:00:00 PM',luas:'9007199254740993'};
  const model=detail(state([injected])),html=lostCertificatesView(model,options);
  assert.doesNotMatch(html,/<img src=x|<script>fixture/);assert.match(html,/&lt;img src=x onerror=1&gt;/);assert.match(html,/<dt>Nomor<\/dt><dd><\/dd>/);assert.match(html,/<dt>Tanggal mulai<\/dt><dd>-<\/dd>/);assert.match(html,/<dt>Tanggal selesai<\/dt><dd>-<\/dd>/);assert.match(html,/01 Januari 2024/);assert.match(html,/9007199254740993/);
  const empty=lostCertificatesView(detail(state([{}])),options);assert.match(empty,/<h2>-<\/h2>/);assert.doesNotMatch(empty,/undefined|null|Invalid Date/);
});
test('all list source indices remain addressable without a hard record cap or hidden deduplication',()=>{
  const model=state(Array.from({length:35},(_,index)=>({...row,pemohon:'Owner '+index})));model.query='owner 3';model.entries=lostCertificateEntries(model.rows,model.query);
  const html=lostCertificatesView(model,options);assert.deepEqual([...html.matchAll(/data-action="lost-detail" data-index="(\d+)"/g)].map(match=>Number(match[1])),[3,30,31,32,33,34]);
  const full=lostCertificatesView(state(Array.from({length:35},()=>row)),options);assert.equal((full.match(/class="lost-certificate-card"/g)||[]).length,35);
});
test('no-office/error/empty/search-empty/loading states and retries remain distinct and do not imply source success',()=>{
  const model=state([]);assert.match(lostCertificatesView(model,options),/Belum ada Laporan Sertipikat Hilang/);
  model.stage='no-office';assert.match(lostCertificatesView(model,options),/Kamu belum punya kantor favorit, nih!/);assert.match(lostCertificatesView(model,options),/pengumuman yuridisnya/);
  model.errors.offices='<bad office error>';assert.match(lostCertificatesView(model,options),/data-action="lost-retry-offices"/);assert.match(lostCertificatesView(model,options),/&lt;bad office error&gt;/);
  model.errors.offices='';model.errors.feed='Synthetic timeout';assert.match(lostCertificatesView(model,options),/Gagal Mengambil Data/);assert.match(lostCertificatesView(model,options),/Coba lagi pengumuman/);
  model.pending.feed=true;assert.match(lostCertificatesView(model,options),/role="status"/);assert.doesNotMatch(lostCertificatesView(model,options),/Coba lagi pengumuman/);
  const filtered=state();filtered.entries=[];assert.match(lostCertificatesView(filtered,options),/Tidak ada pengumuman yang cocok/);
});
test('map is authenticated and explicit; errors preserve facts while only root-trusted map markup is injected',()=>{
  const model=detail(state());let html=lostCertificatesView(model,options);assert.match(html,/data-action="lost-map" disabled/);assert.match(html,/Masuk ke akun untuk membaca lokasi/);
  model.pending.map=true;model.detail.map.stage='loading';html=lostCertificatesView(model,{...options,authenticated:true});assert.match(html,/Memuat lokasi peta bidang/);assert.match(html,/data-action="lost-map" disabled/);
  model.pending.map=false;model.detail.map={stage:'error',error:'<upstream failure>'};html=lostCertificatesView(model,{...options,authenticated:true});assert.match(html,/&lt;upstream failure&gt;/);assert.match(html,/Synthetic certificate/);assert.match(html,/Muat ulang lokasi peta bidang/);
  model.detail.map={stage:'ready',geometry:{type:'FeatureCollection',features:[]}};html=lostCertificatesView(model,{...options,authenticated:true,mapHTML:'<div data-root-map="synthetic"></div>'});assert.match(html,/<div data-root-map="synthetic"><\/div>/);assert.doesNotMatch(html,/PRIVATE-PARCEL-ID|navigator|geolocation|UploadGeotag/);
});
