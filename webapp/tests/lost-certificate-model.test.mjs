import test from 'node:test';
import assert from 'node:assert/strict';
import {lostCertificateOffices,lostCertificateRows,lostCertificateEntries,lostCertificateOfficeIndex,lostCertificateLocation,lostCertificateBoundary} from '../assets/lost-certificate/model.js';

const fields=['dI304Id','persilId','berkasId','nomor','tanggalMulai','tanggalSelesai','nib','wilayah','pemohon','nomorBerkas','tanggalBerkas','tipe'];
const blank={...Object.fromEntries(fields.map(key=>[key,null])),luas:null};
test('lost feed consumes only the typed data List, retains13 null fields and never coerces/aliases fields',()=>{
  const input={error:true,message:[{nomor:'not the source'}],data:[{}, {...blank,nomor:'  Original ',luas:12,unknown:'discard'}]};
  const rows=lostCertificateRows(input);assert.deepEqual(rows,[blank,{...blank,nomor:'  Original ',luas:12}]);assert.notEqual(rows[1],input.data[1]);
  assert.deepEqual(lostCertificateRows({data:[]}),[]);
  for(const value of [null,[],{message:[]},{data:null},{data:{}},{data:[null]},{data:[[]]},{data:[true]}])assert.throws(()=>lostCertificateRows(value),{code:'LOST_CERTIFICATE_FEED_MODEL'});
  for(const key of fields)assert.throws(()=>lostCertificateRows({data:[{[key]:1}]}),{code:'LOST_CERTIFICATE_FEED_MODEL'});
  let getter=0;assert.throws(()=>lostCertificateRows({data:[{get pemohon(){getter++;return 'not evaluated';}}]}));assert.equal(getter,0);
  assert.deepEqual(lostCertificateRows({data:[{Nomor:'wrong case',Luas:12}]}),[blank]);
});
test('luas keeps safe integers and the explicit backend wide-int adaptation without rounding or small numeric aliases',()=>{
  for(const luas of [0,-1,Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER,'9007199254740992','9007199254740993','9223372036854775807','-9223372036854775808'])assert.equal(lostCertificateRows({data:[{luas}]} )[0].luas,luas);
  for(const luas of [1.5,Number.MAX_SAFE_INTEGER+1,Infinity,NaN,true,'1','01','1e4','9223372036854775808','-9223372036854775809'])assert.throws(()=>lostCertificateRows({data:[{luas}]}),{code:'LOST_CERTIFICATE_FEED_MODEL'});
});
test('office list reuses strict native jyb validation and prefers first exact favorite match, else first source row',()=>{
  const source=[{KantorId:' A ',Nama:'First'},{KantorId:'B',Nama:'Second'},{KantorId:'B',Nama:'Duplicate'}],offices=lostCertificateOffices(source);
  assert.deepEqual(offices,source);assert.equal(lostCertificateOfficeIndex(offices,'B'),1);assert.equal(lostCertificateOfficeIndex(offices,'A'),0);assert.equal(lostCertificateOfficeIndex(offices,null),0);assert.equal(lostCertificateOfficeIndex([],null),null);
  for(const patch of [{KantorId:2},{Alamat:false},{Email:3},{Fax:[]},{Telp:{}},{Kota:1},{TipeKantorId:'3'},{TipeKantorId:1.5}])assert.throws(()=>lostCertificateOffices([{...source[0],...patch}]));
  assert.deepEqual(lostCertificateOffices([{id:'not KantorId',nama:'not Nama'}]),[{KantorId:null,Nama:null}]);
});
test('local search lowercases exactly three fields without trim, preserves duplicates, null-string matching and source indices',()=>{
  const rows=lostCertificateRows({data:[{nomorBerkas:'AbC',pemohon:'Owner',wilayah:'Desa'},{nomorBerkas:'Other',pemohon:'OWNER',wilayah:'Dusun'}, {},{nomorBerkas:'AbC',pemohon:'Owner',wilayah:'Desa'}]});
  assert.deepEqual(lostCertificateEntries(rows,'ABC').map(x=>x.index),[0,3]);assert.deepEqual(lostCertificateEntries(rows,'owner').map(x=>x.index),[0,1,3]);assert.deepEqual(lostCertificateEntries(rows,'dUSUn').map(x=>x.index),[1]);
  assert.deepEqual(lostCertificateEntries(rows,'null').map(x=>x.index),[2]);assert.deepEqual(lostCertificateEntries(rows,' owner '),[]);assert.equal(lostCertificateEntries(rows,'')[0].item,rows[0]);assert.equal(lostCertificateEntries(rows,'').length,4);
  for(const key of ['nomor','nib','tipe','dI304Id','persilId','berkasId','tanggalMulai'])assert.equal(lostCertificateEntries(lostCertificateRows({data:[{...blank,[key]:'EXCLUDED'}]}),'excluded').length,0,key);
});
test('location metadata is a distinct seven-String model with typed envelope and no geometry inference',()=>{
  const data={persilId:' Returned ID ',kantorId:'office',namaKantor:null,wilayahId:null,namaWilayah:null,jenisHak:null,nomorSertipikat:null};
  assert.deepEqual(lostCertificateLocation({error:false,message:' raw ',data:{...data,geometry:{fabricated:true}}}),{error:false,message:' raw ',data});
  assert.deepEqual(lostCertificateLocation({error:true,data:null}),{error:true,message:null,data:null});
  for(const value of [null,[],{error:1,data:{}},{error:false,message:2,data:{}},{error:false,data:[]},{error:false,data:{persilId:1}},{error:false,data:{namaKantor:false}}])assert.throws(()=>lostCertificateLocation(value),{code:'LOST_CERTIFICATE_LOCATION_MODEL'});
});
test('boundary accepts only the shared validated server FeatureCollection and never repairs geometry',()=>{
  const geometry={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.1,-6],[106.1,-5.9],[106,-6]]]},properties:{name:'Synthetic'}}]};
  const result=lostCertificateBoundary(geometry);assert.equal(result.data,geometry);assert.equal(result.status,'ready');assert.equal(lostCertificateBoundary({type:'FeatureCollection',features:[]}).status,'empty');
  for(const raw of [{data:geometry},null,{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[106,-6]}}]}])assert.throws(()=>lostCertificateBoundary(raw));
});
