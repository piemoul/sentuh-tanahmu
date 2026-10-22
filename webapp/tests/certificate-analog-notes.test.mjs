import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {certificateDateDisplay} from './support/certificate-date-formatter.mjs';

// Exercise current production functions, not a copied implementation. Synthetic
// account/transport fixtures do not call an official service or create documents.
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const names=['flowData','certificateText','isAnalogCertificate','isElectronicCertificate','electronicCertificateNumber','electronicCertificatePrinted','electronicCertificateOptionalValue','electronicCertificateLocation','electronicCertificateNote','electronicCertificateDetailView','electronicCertificateDocumentTarget','electronicCertificateDocumentControls','certificateMapControls','certificateFacts','certificateRecords','certificateLocation','certificateOwner','certificateSurvey','certificateNote','certificateDetailView','certificateListItem','certificateRowOpen','certificateDetailTarget','loadCertificateDetail'];
function context(){
 const modal={innerHTML:'',open:false,showModal(){this.open=true;}};
 const state={authenticated:true,operations:[{id:'analog',endpoint:'legacy/GetInfoSertifikat'},{id:'electronic',endpoint:'Brankas/DetailSertipikatNew'}]};
 const current=vm.createContext({modal,state,certificateDateDisplay,sessionEpoch:0,detailSequence:0,$:()=>modal,ready:()=>true,write:()=>false,icon:()=>'',json:JSON.stringify,result:()=>'<p>Generic response</p>',empty:()=>'<p>Loading</p>',notice:value=>value,record(){},loadCertificateMaps:async()=>{},clearPrivate(){},render(){},toast(){},api:async()=>({result:{status:200,data:{}}})});
 const escapeDeclaration=source.split(/\r?\n/).find(line=>line.startsWith('const $='));
 assert.ok(escapeDeclaration,'current app escape declaration exists');
 vm.runInContext(`globalThis.esc=${escapeDeclaration.slice(escapeDeclaration.indexOf('esc=')+4)}`,current);
 for(const name of names){
  const declaration=source.split(/\r?\n/).filter(line=>new RegExp(`^(?:async )?function ${name}\\(`).test(line));
  assert.equal(declaration.length,1,`one actual ${name} declaration`);
  vm.runInContext(declaration[0],current);
 }
 return current;
}
const analog={Nomor:'ANALOG-FIXTURE',JenisHak:'Hak fixture',KodeBlanko:null,ValidSejak:'2020-08-17T00:00:00Z',ValidSampai:null,Persil:[],PemilikPertama:[],SuratUkur:[],CatatanPendaftaran:[]};
const electronic={sertipikatId:'electronic-fixture',nibel:'12345678901234',jenisHak:'Hak elektronik',kodeHat:'PRIVATE-FIXTURE-CODE',tanggalPenerbitan:'2026-01-02T00:00:00',berakhirHak:'9999-12-31T00:00:00.000',kodeBlanko:null,isPrinted:0,statusDI301A:false,persilId:null,listPemilik:[],catatan:[]};
const visible=html=>html.split('<details class="json-details')[0];

test('analog notes keep exactly four unlabeled blocks, null and missing columns contain only the native appended newline',()=>{
 const c=context();
 for(const item of [{},{Kolom1:null,Kolom2:null,Kolom3:null,Kolom4:null},{Kolom1:'',Kolom2:'',Kolom3:'',Kolom4:''}])assert.equal(c.certificateNote(item),'<div class="certificate-note"><p>\n</p><p>\n</p><p>\n</p><p>\n</p></div>');
 assert.doesNotMatch(c.certificateNote({Kolom1:'A'},99),/<h[1-6]|Catatan 100|<p>-<\/p>/);
});

test('analog columns retain exact order, whitespace, line splitting and trailing newline per native span',()=>{
 const c=context();
 assert.equal(c.certificateNote({Kolom1:' first ',Kolom2:'A\nB',Kolom3:'tail\n',Kolom4:'last'}),'<div class="certificate-note"><p> first \n</p><p>A\nB\n</p><p>tail\n\n</p><p>last\n</p></div>');
});

test('analog br conversion is case-sensitive and all other markup stays escaped text',()=>{
 const c=context();
 assert.equal(c.certificateNote({Kolom1:'A<br>B<br/>C<br />D<BR>E',Kolom2:'<script>alert("x")</script>&\'<>',Kolom3:'<img src=x onerror=alert(1)>',Kolom4:'<br\n/>Z'}),'<div class="certificate-note"><p>A\nB\nC\nD&lt;BR&gt;E\n</p><p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;&lt;&gt;\n</p><p>&lt;img src=x onerror=alert(1)&gt;\n</p><p>\nZ\n</p></div>');
});

test('analog detail retains every registration record regardless of Status and does not mutate its supplied model',()=>{
 const c=context(),notes=[{Kolom1:'FIRST',Kolom2:'SECOND',Kolom3:'THIRD',Kolom4:'FOURTH',Status:0},{Kolom1:'NEXT',Status:1},{Kolom1:'LAST',Status:null},{Kolom1:null,Kolom2:null,Kolom3:null,Kolom4:null}],model={...analog,CatatanPendaftaran:notes},before=JSON.stringify(model);
 const html=visible(c.certificateDetailView({data:model},'legacy/GetInfoSertifikat'));
 assert.equal((html.match(/class="certificate-note"/g)||[]).length,4);
 const values=['FIRST','SECOND','THIRD','FOURTH','NEXT','LAST'];
 for(let index=1;index<values.length;index++)assert.ok(html.indexOf(values[index-1])<html.indexOf(values[index]));
 assert.doesNotMatch(html,/<h4>Catatan \d|<p>-<\/p>/);
 assert.equal(JSON.stringify(model),before);
});

test('all four analog sections retain their titles and exact native message for null and empty input',()=>{
 const c=context();
 for(const empty of [null,[]]){
  const model={...analog,Persil:empty,PemilikPertama:empty,SuratUkur:empty,CatatanPendaftaran:empty},html=visible(c.certificateDetailView({data:{data:model}},'legacy/GetInfoSertifikat'));
  for(const title of ['Lokasi Bidang Tanah','Pemilik','Surat Ukur','Catatan Pendaftaran'])assert.match(html,new RegExp(`<h3>${title}</h3>[\\s\\S]*?<p class="certificate-empty">Tidak ada data!</p>`));
  assert.equal((html.match(/Tidak ada data!/g)||[]).length,4);
  assert.doesNotMatch(html,/Tidak ada rincian yang dikembalikan layanan/);
 }
});

test('nonempty analog all-null note retains four blank text blocks instead of section empty message',()=>{
 const c=context(),html=visible(c.certificateDetailView({data:{...analog,CatatanPendaftaran:[{Kolom1:null,Kolom2:null,Kolom3:null,Kolom4:null}]}},'legacy/GetInfoSertifikat'));
 const noteSection=html.slice(html.indexOf('<h3>Catatan Pendaftaran</h3>'));
 assert.match(noteSection,/<div class="certificate-note"><p>\n<\/p><p>\n<\/p><p>\n<\/p><p>\n<\/p><\/div>/);
 assert.doesNotMatch(noteSection,/Tidak ada data!/);
});

test('analog grouped display retains later records and four-column data beyond JSON preview limits',()=>{
 const c=context(),notes=Array.from({length:105},(_,index)=>({Kolom1:`FIRST-${index}`,Kolom2:`SECOND-${index}`,Kolom3:`THIRD-${index}`,Kolom4:`FOURTH-${index}`,Status:index%2}));
 const html=visible(c.certificateDetailView({data:{...analog,CatatanPendaftaran:notes}},'legacy/GetInfoSertifikat'));
 assert.equal((html.match(/class="certificate-note"/g)||[]).length,105);
 assert.match(html,/data-record-index="104"/);
 assert.match(html,/FIRST-104\n<\/p><p>SECOND-104\n<\/p><p>THIRD-104\n<\/p><p>FOURTH-104\n<\/p>/);
 assert.ok(html.indexOf('FOURTH-103')<html.indexOf('FIRST-104'));
});

test('shared certificate text and default generic empty message remain unchanged',()=>{
 const c=context();
 assert.equal(c.certificateText(null),'-');
 assert.equal(c.certificateText('A<BR>B',true),'A\nB');
 assert.match(c.certificateRecords('Generic',[],()=>''),/Tidak ada rincian yang dikembalikan layanan\./);
 assert.match(c.certificateFacts([['Date','2020-08-17T00:00:00+07:00']]),/>2020-08-17T00:00:00\+07:00<\/dd>/);
});

test('electronic notes still show only kolom1, keep existing br behavior and skip all-null records',()=>{
 const c=context(),model={...electronic,catatan:[{kolom1:'Visible<BR>line',kolom2:'HIDDEN-TWO'},{kolom1:null,kolom2:'HIDDEN-THREE'},{kolom1:null,kolom2:null,kolom3:null,kolom4:null}]},html=visible(c.certificateDetailView({data:model},'Brankas/DetailSertipikatNew'));
 assert.equal((html.match(/class="certificate-note"/g)||[]).length,2);
 assert.match(html,/<p>Visible\nline<\/p>/);
 assert.match(html,/<div class="certificate-note"><p><\/p><\/div>/);
 assert.doesNotMatch(html,/HIDDEN-TWO|HIDDEN-THREE|<p>\n<\/p>|Surat Ukur/);
});

test('electronic empty and all-null notes retain their distinct native-facing states',()=>{
 const c=context();
 for(const catatan of [null,[]]){
  const html=visible(c.certificateDetailView({data:{...electronic,catatan}},'Brankas/DetailSertipikatNew'));
  assert.match(html.slice(html.indexOf('<h3>Catatan Pendaftaran</h3>')),/Tidak ada data!/);
 }
 const html=visible(c.certificateDetailView({data:{...electronic,catatan:[{kolom1:null,kolom2:null,kolom3:null,kolom4:null}]}},'Brankas/DetailSertipikatNew'));
 assert.doesNotMatch(html.slice(html.indexOf('<h3>Catatan Pendaftaran</h3>')),/Tidak ada data!|certificate-note/);
});

test('analog modal title follows native while electronic title stays unchanged on loading and completion',async()=>{
 for(const [StatusEl,endpoint,title]of [[0,'legacy/GetInfoSertifikat','Informasi Sertipikat'],[1,'Brankas/DetailSertipikatNew','Detail sertipikat']]){
  const c=context();let finish,calls=0;
  c.api=async()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
  const task=c.loadCertificateDetail({SertifikatId:'selected-fixture-id',StatusEl});
  assert.equal(calls,1);assert.equal(c.modal.open,true);
  assert.ok(c.modal.innerHTML.includes(`<h2 id="modal-title">${title}</h2>`));
  finish({result:{status:200,data:endpoint==='legacy/GetInfoSertifikat'?analog:electronic}});
  await task;
  assert.ok(c.modal.innerHTML.includes(`<h2 id="modal-title">${title}</h2>`));
 }
});
