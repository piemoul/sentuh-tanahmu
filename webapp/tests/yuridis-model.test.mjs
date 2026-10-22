import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeYuridisJson,decodeYuridisLastReviewJson,prepareYuridisLastReview} from '../private/yuridis-response.mjs';
import {yuridisRows,yuridisEntries} from '../assets/yuridis/model.js';
import {yuridisCard,yuridisDetail} from '../assets/yuridis/view.js';
import {createYuridis} from '../assets/yuridis/controller.js';
const json=JSON.stringify;
const row=(patch={})=>({persilId:'original-persil',nomorBerkas:'001/B',nomorPengumuman:'A',tanggalMulai:'2026-10-01',tanggalSelesai:'2026-11-01',nib:'N',wilayah:'Desa',pemohon:'Nama',permohonan:'not-a-visible-fact',kegiatan:'Rutin',luasPersil:100,...patch});
const wire=rows=>json({error:true,message:'ignored',data:rows});
const projection=rows=>decodeYuridisJson(wire(rows));
test('Yuridis model is separate, ordered and duplicate preserving; numeric area remains lossless',()=>{
 const expected=row();assert.deepEqual(projection([expected,expected]),{data:[expected,expected]});
 assert.deepEqual(yuridisRows(projection([expected])),[expected]);
 const wide=decodeYuridisJson('{"data":[{"luasPersil":9223372036854775807}]}');assert.equal(wide.data[0].luasPersil,'9223372036854775807');assert.equal(yuridisRows(wide)[0].luasPersil,'9223372036854775807');
 assert.equal(decodeYuridisJson('{"data":[{"luasPersil":-9223372036854775808}]}').data[0].luasPersil,'-9223372036854775808');
 assert.equal(projection([{}]).data[0].persilId,null);assert.equal(projection([{}]).data[0].luasPersil,null);
 for(const token of ['1.0','1e0','"100"','true','9223372036854775808','-9223372036854775809'])assert.throws(()=>decodeYuridisJson('{"data":[{"luasPersil":'+token+'}]}'));
 assert.throws(()=>yuridisRows({data:[row({luasPersil:Number.MAX_SAFE_INTEGER+1})]}));
});
test('nullable native Strings are validated including hidden nomorPengumuman and permohonan',()=>{
 for(const key of Object.keys(row()).filter(k=>k!=='luasPersil'))for(const value of [0,false,[],{}])assert.throws(()=>projection([row({[key]:value})]));
 for(const value of [null,[],{data:null},{data:{}},{message:[]}])assert.throws(()=>decodeYuridisJson(json(value)));
 assert.throws(()=>decodeYuridisJson(wire([row(),null,row()])));assert.throws(()=>yuridisRows({data:Array(1)}));
 const text=wire([row()]);assert.deepEqual(decodeYuridisJson(json(text),{jsonTransformed:true}),projection([row()]));assert.throws(()=>decodeYuridisJson(json(text)));assert.throws(()=>decodeYuridisJson(json(json(text)),{jsonTransformed:true}));
});
test('search uses original source index and only nomorBerkas, wilayah, pemohon with no trim',()=>{
 const rows=yuridisRows(projection([row({nomorBerkas:'a'}),row({nomorBerkas:'B',wilayah:'Rawa'}),row({pemohon:null})]));
 assert.deepEqual(yuridisEntries(rows,'RAWA').map(e=>e.index),[1]);assert.deepEqual(yuridisEntries(rows,' B ').map(e=>e.index),[]);assert.deepEqual(yuridisEntries(rows,'null').map(e=>e.index),[2]);assert.equal(yuridisEntries(rows,'not-a-visible-fact').length,0);assert.equal(yuridisEntries(rows,'original-persil').length,0);
});
test('card and six ordered detail facts escape markup without adding hidden facts, PDF or units',()=>{
 const item=row({pemohon:'<script>x</script>',kegiatan:'Rutin'}),formatDate=value=>'DATE:'+value;
 const html=yuridisCard({item,index:12},formatDate);assert.match(html,/data-index="12"/);assert.match(html,/&lt;script&gt;/);assert.match(html,/badge-warning/);assert.match(yuridisCard({item:row({kegiatan:'rutin'}),index:0},formatDate),/badge-info/);
 const detail=yuridisDetail({detail:{item,map:{stage:'idle'}},pending:{map:false}},{formatDate});
 const labels=Array.from(detail.matchAll(/<dt>(.*?)<\/dt>/g),m=>m[1]);assert.deepEqual(labels,['Nama Desa','NIB','No Berkas','Luas','Kegiatan','Selesai']);assert.doesNotMatch(detail,/not-a-visible-fact|Nomor Pengumuman|\.pdf|m²|<script>/);
});
test('last-user review uses exact sertipikatSaya and original String ID, without pagination or aliases',()=>{
 assert.deepEqual(prepareYuridisLastReview({contentId:' raw '}),{reviewType:'sertipikatSaya',contentId:' raw '});assert.deepEqual(prepareYuridisLastReview({contentId:'',reviewType:'sertipikatSaya'}),{reviewType:'sertipikatSaya',contentId:''});
 for(const value of [{contentId:'p',pageNumber:'1'},{contentId:'p',reviewType:'pengumumanSertipikatHilang'},{persilId:'p'},{contentId:1},null,[]])assert.throws(()=>prepareYuridisLastReview(value));
 let calls=0;assert.throws(()=>prepareYuridisLastReview({get contentId(){calls++;return 'p';}}));assert.equal(calls,0);
});
test('last-user review returns before metadata validation on missing/null data; otherwise singleton-wraps and validates',()=>{
 assert.deepEqual(decodeYuridisLastReviewJson('{"data":null,"error":"not-validated","totalRecords":{}}'),{data:[]});assert.deepEqual(decodeYuridisLastReviewJson('{}'),{data:[]});
 const result=decodeYuridisLastReviewJson('{"data":{"reviewId":"r","rating":9223372036854775807,"comment":"raw","reviewPhotos":[]},"error":true}');assert.equal(result.data.length,1);assert.equal(result.data[0].rating,'9223372036854775807');assert.equal(result.data[0].comment,'raw');
 for(const value of ['{"data":[]}','{"data":1}','{"data":true}','{"data":{"rating":1.0}}','{"data":{},"error":"wrong"}','{"data":{},"pageSize":1.0}'])assert.throws(()=>decodeYuridisLastReviewJson(value));
 assert.equal(decodeYuridisLastReviewJson('{"data":{"rawJSON":"unknown allowed","comment":"x"}}').data[0].comment,'x');
 assert.throws(()=>decodeYuridisLastReviewJson(json('{"data":null}')));
});
test('controller preserves chosen original and returned metadata IDs and invalidates stale map requests',async()=>{
 const calls=[];let release;const waiting=new Promise(resolve=>release=resolve);
 const controller=createYuridis({isAuthenticated:()=>true,getFavoriteOfficeId:()=> 'fav',read:async(kind,values)=>{calls.push({kind,values});if(kind==='offices')return [{KantorId:'first',Nama:'First'},{KantorId:'fav',Nama:'Favorite'}];if(kind==='feed')return projection([row(),row({persilId:'other'})]);if(kind==='location')return waiting;throw Error('no stale boundary allowed');}});
 assert.equal(await controller.start(),true);assert.equal(controller.snapshot().officeIndex,1);assert.deepEqual(calls.slice(0,2),[{kind:'offices',values:{nama:'',tipeKantor:''}},{kind:'feed',values:{kantorId:'fav'}}]);
 controller.openDetail(0);const work=controller.loadMap();assert.deepEqual(calls.at(-1),{kind:'location',values:{persilId:'original-persil'}});controller.openDetail(1);release({error:false,data:{persilId:'returned-persil'}});assert.equal(await work,false);assert.equal(calls.filter(c=>c.kind==='boundary').length,0);assert.equal(controller.snapshot().detail.item.persilId,'other');controller.dispose();assert.equal(controller.snapshot().stage,'disposed');
});
