import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {certificateDateDisplay} from './support/certificate-date-formatter.mjs';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const before=fs.readFileSync(new URL('../../environment/certificate-date-runtime/app-before.js',import.meta.url),'utf8');
function renderer(){
 const c=vm.createContext({certificateDateDisplay,esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),json:JSON.stringify,icon:()=>'',result:()=>'',electronicCertificateDetailView:()=>'<p>electronic renderer</p>'});
 for(const name of ['flowData','certificateText','isAnalogCertificate','isElectronicCertificate','certificateFacts','certificateRecords','certificateLocation','certificateMapControls','certificateOwner','certificateSurvey','certificateNote','certificateDetailView']){
  const line=source.split(/\r?\n/).find(row=>row.startsWith('function '+name+'('));assert.ok(line,name);vm.runInContext(line,c);
 }
 return c;
}
const analog={Nomor:'SYNTHETIC',JenisHak:'Hak Milik',ValidSejak:'2026-10-20T13:24:35.123Z',ValidSampai:'9999-12-31T00:00:00',Persil:[],PemilikPertama:[],SuratUkur:[{Nomor:'SYNTHETIC-SURVEY',BerlakuSejak:'2020-08-01T13:24:35.1Z'}],CatatanPendaftaran:[]};
test('three analog fields render Indonesian dates and keep year9999 without electronic sentinel',()=>{
 const c=renderer(),input=structuredClone(analog),saved=JSON.stringify(input),html=c.certificateDetailView({data:input},'legacy/GetInfoSertifikat');
 assert.match(html,/<dt>Tanggal Penerbitan<\/dt><dd>20 Oktober 2026<\/dd>/);
 assert.match(html,/<dt>Berlaku Sampai<\/dt><dd>31 Desember 9999<\/dd>/);
 assert.match(html,/<dt>Berlaku Sejak<\/dt><dd>01 Agustus 2020<\/dd>/);
 assert.equal(JSON.stringify(input),saved);assert.ok(html.includes('2026-10-20T13:24:35.123Z'),'raw JSON preserved');
});
test('invalid, missing, null and offset date strings render a dash in analog date fields',()=>{
 const c=renderer();
 for(const value of [null,undefined,'','2023-02-29','2026-10-20T13:24:35+07:00','2026-10-20T13:24:35.123']){
  const html=c.certificateDetailView({data:{...analog,ValidSejak:value,ValidSampai:value,SuratUkur:[{BerlakuSejak:value}]}},'legacy/GetInfoSertifikat');
  for(const label of ['Tanggal Penerbitan','Berlaku Sampai','Berlaku Sejak'])assert.ok(html.includes(`<dt>${label}</dt><dd>-</dd>`),`${label}: ${value}`);
 }
});
test('loose parse is still strict about a valid calendar date and uses the recovered pattern order',()=>{
 assert.equal(certificateDateDisplay('2/29/2024 1:24:35 pm'),'29 Februari 2024');
 assert.equal(certificateDateDisplay('2/29/2023 1:24:35 pm'),'-');
 assert.equal(certificateDateDisplay('2020-8-1'),'01 Agustus 2020');
 assert.equal(certificateDateDisplay('2026-10-20T13 24 35'),'-');
});
test('no type coercion or HTML input reaches certificate display',()=>{
 let coerced=false;assert.equal(certificateDateDisplay({toString(){coerced=true;return'2020-08-01';}}),'-');assert.equal(coerced,false);
 assert.equal(certificateDateDisplay('<img src=x onerror=alert(1)>'),'-');
});
test('analog date callsites retain their formatter and unrelated date renderers stay unchanged',()=>{
 let expected="import {certificateDateDisplay} from './assets/certificate-date/formatter.js';\r\n"+before;
 for(const [a,b]of[["['Berlaku Sejak',item.BerlakuSejak]","['Berlaku Sejak',certificateDateDisplay(item.BerlakuSejak)]"],["['Tanggal Penerbitan',data.ValidSejak]","['Tanggal Penerbitan',certificateDateDisplay(data.ValidSejak)]"],["['Berlaku Sampai',data.ValidSampai]","['Berlaku Sampai',certificateDateDisplay(data.ValidSampai)]"]])expected=expected.replace(a,b);
 const declaration=(text,name)=>text.split(/\r?\n/).find(line=>line.startsWith('function '+name+'('));
 for(const name of ['certificateSurvey','certificateDetailView'])assert.equal(declaration(source,name),declaration(expected,name),name);
 for(const name of ['certificateText','certificateFacts','certificateNote','electronicCertificateDetailView','electronicCertificateNote','certificateListCard','berkasDetailView'])assert.equal(declaration(source,name),declaration(before,name),name);
 assert.equal(source.split("import {certificateDateDisplay} from './assets/certificate-date/formatter.js';").length,2);
 const c=renderer();assert.equal(c.certificateFacts([['Tanggal','2020-08-01']]),'<dl class="certificate-facts"><div><dt>Tanggal</dt><dd>2020-08-01</dd></div></dl>');
});
