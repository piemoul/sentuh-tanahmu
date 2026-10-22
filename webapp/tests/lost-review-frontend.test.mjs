import test from 'node:test';
import assert from 'node:assert/strict';
import {lostReviewEnvelope,lostReviewRows} from '../assets/lost-review/model.js';
import {createLostReview} from '../assets/lost-review/controller.js';
import {lostReviewPhotoUrl,lostReviewsView} from '../assets/lost-review/view.js';
import {lostCertificateDetail} from '../assets/lost-certificate/view.js';

const row=(patch={})=>({reviewId:'synthetic-review',rating:4,comment:'Komentar SINTETIS',createdAt:'2026-10-20',reviewPhotos:[{mediaId:'synthetic-media',mediaUrl:'https://sentuh.atrbpn.go.id/synthetic-only.png',createdAt:null}],...patch});
const envelope=rows=>({totalRecords:20,resultsCount:rows.length,pageNumber:1,pageSize:10,error:true,message:'Unused native message',data:rows});
const blank={reviewId:null,rating:null,comment:null,createdAt:null,reviewPhotos:null};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function fixture(){let authenticated=true,current=true;const calls=[],changes=[],errors=[];const c=createLostReview({read:values=>{const d=deferred();calls.push({values,...d});return d.promise;},isCurrent:()=>current,isAuthenticated:()=>authenticated,changed:s=>changes.push(s),onSessionError:e=>errors.push(e.code)});return {c,calls,changes,errors,anonymous:()=>authenticated=false,authenticate:()=>authenticated=true,retire:()=>current=false};}

test('review envelope preserves native fields/nulls/order/duplicates and ignores no typed model field',()=>{
  const raw=envelope([row(),{},row()]),decoded=lostReviewEnvelope(raw);
  assert.deepEqual(decoded,{...raw,data:[row(),blank,row()]});assert.equal(decoded.error,true);
  assert.deepEqual(lostReviewRows(raw),[row(),blank,row()]);assert.deepEqual(lostReviewRows({data:[]}),[]);
  assert.deepEqual(lostReviewEnvelope({}),{totalRecords:null,resultsCount:null,pageSize:null,pageNumber:null,error:null,message:null,data:null});
  assert.deepEqual(lostReviewRows({data:[{...row(),unknown:'discard',reviewPhotos:[{unknown:'discard'}]}]}),[{...row(),reviewPhotos:[{mediaId:null,mediaUrl:null,createdAt:null}]}]);
  decoded.data[0].reviewPhotos[0].mediaUrl='modified';assert.equal(raw.data[0].reviewPhotos[0].mediaUrl,row().reviewPhotos[0].mediaUrl);
});
test('review parser rejects alternate envelope, non-list data and malformed nested typed fields',()=>{
  for(const value of [null,[],{},'{}',{message:[]},{data:null},{data:{}},{data:'[]'},{Data:[]},{data:[null]},{data:[[]]},{data:[1]}])assert.throws(()=>lostReviewRows(value),{code:'LOST_REVIEW_MODEL'});
  for(const [key,values] of Object.entries({reviewId:[1,true,{},[]],rating:['1',1.5,true,{},[]],comment:[0,false,{},[]],createdAt:[1,true,{},[]],reviewPhotos:[{},'[]',true,[null],[[]],[{mediaUrl:42}]]}))for(const value of values)assert.throws(()=>lostReviewRows({data:[row({[key]:value})]}),{code:'LOST_REVIEW_MODEL'},key);
  for(const patch of [{totalRecords:'1'},{resultsCount:1.5},{pageSize:true},{pageNumber:[]},{error:'false'},{message:[]}])assert.throws(()=>lostReviewRows({...envelope([]),...patch}),{code:'LOST_REVIEW_MODEL'});
  let calls=0;assert.throws(()=>lostReviewRows({get data(){calls++;return [];}}));assert.equal(calls,0);
});
test('browser bridge accepts only exact wide signed64 decimal Strings for native integer fields',()=>{
  for(const value of ['9007199254740992','9007199254740993','9223372036854775807','-9223372036854775808'])assert.equal(lostReviewRows({data:[{rating:value} ]})[0].rating,value);
  for(const value of ['1','01','-0','1.0','1e0','9223372036854775808',9007199254740992])assert.throws(()=>lostReviewRows({data:[{rating:value}]}),{code:'LOST_REVIEW_MODEL'});
});
test('detail read fixes native first-page values and preserves exact selected berkasId including empty/space',async()=>{
  for(const id of [' original-file +&/ ','','  ']){
    const h=fixture(),work=h.c.start(id);assert.deepEqual(h.calls[0].values,{reviewType:'pengumumanSertipikatHilang',contentId:id,pageNumber:'1',pageSize:'10'});
    const rows=Array.from({length:13},(_,index)=>row({reviewId:'review-'+index}));h.calls[0].resolve(envelope(rows));assert.equal(await work,true);
    assert.equal(h.c.snapshot().stage,'ready');assert.equal(h.c.snapshot().rows.length,13);assert.equal(h.c.snapshot().pending,false);assert.equal(h.calls.length,1);
  }
});
test('missing native contentId is reported without inventing another identifier; authentication is a browser guard',async()=>{
  for(const id of [null,undefined,42,{}]){const h=fixture();assert.equal(await h.c.start(id),false);assert.equal(h.calls.length,0);assert.equal(h.c.snapshot().stage,'error');}
  const h=fixture();h.anonymous();assert.equal(await h.c.start('synthetic-file'),false);assert.equal(h.calls.length,0);assert.equal(h.c.snapshot().stage,'signin');
});
test('pending read cannot duplicate; empty, malformed and failed responses stay distinct and permit explicit retry',async()=>{
  for(const kind of ['empty','invalid','network']){
    const h=fixture(),work=h.c.start('synthetic-file');assert.equal(await h.c.refresh(),false);assert.equal(h.calls.length,1);
    if(kind==='network')h.calls[0].reject(new Error('Synthetic network failure'));else h.calls[0].resolve(kind==='empty'?envelope([]):{data:null});
    assert.equal(await work,kind==='empty');assert.equal(h.c.snapshot().stage,kind==='empty'?'empty':'error');assert.equal(h.c.snapshot().pending,false);
    const retry=h.c.refresh();h.calls[1].resolve(envelope([row()]));assert.equal(await retry,true);assert.equal(h.c.snapshot().error,'');assert.equal(h.c.snapshot().rows.length,1);
  }
});
test('retired detail/session owner rejects late success and late authentication failure without clearing another session',async()=>{
  for(const change of ['dispose','retire'])for(const outcome of ['success','auth']){
    const h=fixture(),work=h.c.start('old-file');if(change==='dispose')h.c.dispose();else h.retire();const before=h.c.snapshot(),events=h.changes.length;
    if(outcome==='auth')h.calls[0].reject(Object.assign(new Error('Synthetic expiration'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve(envelope([row()]));
    assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,events);assert.deepEqual(h.errors,[]);
  }
});
test('authentication loss during owned read clears its private rows and releases retry lock',async()=>{
  for(const outcome of ['success','auth']){
    const h=fixture(),work=h.c.start('synthetic-file');h.anonymous();
    if(outcome==='auth')h.calls[0].reject(Object.assign(new Error('Old expiration'),{code:'SESSION_EXPIRED'}));else h.calls[0].resolve(envelope([row()]));
    assert.equal(await work,false);assert.equal(h.c.snapshot().pending,false);assert.equal(h.c.snapshot().stage,'signin');assert.deepEqual(h.c.snapshot().rows,[]);assert.deepEqual(h.errors,[]);
    h.authenticate();const retry=h.c.refresh();h.calls[1].resolve(envelope([]));assert.equal(await retry,true);
  }
});
test('current session failure is surfaced once; snapshot and upstream mutation cannot alter accepted reviews',async()=>{
  const h=fixture(),first=h.c.start('synthetic-file');h.calls[0].reject(Object.assign(new Error('Synthetic expiration'),{code:'SESSION_EXPIRED'}));await first;assert.deepEqual(h.errors,['SESSION_EXPIRED']);
  const raw=envelope([row()]),retry=h.c.refresh();h.calls[1].resolve(raw);await retry;raw.data[0].comment='outside';const snapshot=h.c.snapshot();snapshot.rows[0].reviewPhotos.length=0;
  assert.equal(h.c.snapshot().rows[0].comment,'Komentar SINTETIS');assert.equal(h.c.snapshot().rows[0].reviewPhotos.length,1);
  h.c.dispose();assert.equal(await h.c.refresh(),false);assert.deepEqual(h.c.snapshot().rows,[]);
});
test('read view displays native stars/comment/photos and literal id_ID; it never invents author or createdAt date',()=>{
  const rows=lostReviewRows(envelope([row({comment:'<script>never()</script>\nKomentar',createdAt:'DO-NOT-RENDER-DATE'}),row({rating:'9223372036854775807',reviewPhotos:null}),row({rating:-1,comment:null,reviewPhotos:[]})]));
  const html=lostReviewsView({stage:'ready',rows,pending:false,error:''},{authenticated:true});
  assert.equal((html.match(/data-lost-review-index=/g)||[]).length,3);assert.match(html,/&lt;script&gt;never\(\)&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>|DO-NOT-RENDER-DATE|synthetic-review|synthetic-media|author|pemohon|username/);
  assert.equal((html.match(/class="filled"/g)||[]).length,9);assert.equal((html.match(/class="lost-review-footer">id_ID/g)||[]).length,3);
  assert.match(html,/referrerpolicy="no-referrer"/);assert.match(html,/width="48" height="48"/);assert.match(html,/Foto ulasan 1/);
  assert.match(html,/<button[^>]* disabled>Beri Ulasan/);assert.match(html,/Penulisan ulasan belum tersedia/);assert.doesNotMatch(html,/<form|<textarea|<a |onclick|Lihat berikutnya|Halaman|data-action=".*(?:post|submit|write)/);
});
test('photo origin guard rejects external/script/credential/relative media and escapes signed query attributes',()=>{
  for(const value of [null,42,'javascript:alert(1)','data:image/svg+xml,test','https://untrusted.invalid/p.png','http://sentuh.atrbpn.go.id/p.png','https://sentuh.atrbpn.go.id.untrusted.invalid/p.png','https://user:pass@sentuh.atrbpn.go.id/p.png','/api/logout','//untrusted.invalid/p.png'])assert.equal(lostReviewPhotoUrl(value),null);
  const url='https://sentuh.atrbpn.go.id/p.png?x=1&y=2';assert.equal(lostReviewPhotoUrl(url),url);
  const html=lostReviewsView({stage:'ready',rows:[row({reviewPhotos:[{mediaUrl:url},{mediaUrl:'https://untrusted.invalid/p.png'}]})],pending:false},{authenticated:true});
  assert.match(html,/p\.png\?x=1&amp;y=2/);assert.doesNotMatch(html,/untrusted.invalid/);assert.match(html,/Foto ulasan 2 belum dapat ditampilkan/);
});
test('review list preserves all service-returned rows without adding pagination or arbitrary caps',()=>{
  const html=lostReviewsView({stage:'ready',rows:Array.from({length:13},(_,index)=>row({comment:'Komentar '+index})),pending:false},{authenticated:true});
  assert.equal((html.match(/data-lost-review-index=/g)||[]).length,13);assert.match(html,/Komentar 12/);assert.doesNotMatch(html,/data-page|pageNumber|totalRecords|Halaman/);
});
test('review loading/error/retry/empty/sign-in guards are separate and do not expose retained rows anonymously',()=>{
  const state={stage:'ready',rows:[row({comment:'PRIVATE COMMENT'})],pending:false,error:'<synthetic error>'};
  const anonymous=lostReviewsView(state);assert.match(anonymous,/Masuk ke akun/);assert.doesNotMatch(anonymous,/PRIVATE COMMENT|synthetic-only\.png/);
  assert.match(lostReviewsView({...state,stage:'loading',pending:true},{authenticated:true}),/role="status">Memuat ulasan/);
  const failed=lostReviewsView({...state,stage:'error'},{authenticated:true});assert.match(failed,/&lt;synthetic error&gt;/);assert.match(failed,/data-action="lost-review-retry"/);assert.doesNotMatch(failed,/PRIVATE COMMENT/);
  const empty=lostReviewsView({...state,stage:'empty',rows:[]},{authenticated:true});assert.match(empty,/assets\/lost-review\/empty.png/);assert.match(empty,/alt="Belum ada ulasan"/);assert.doesNotMatch(empty,/Coba lagi|data-lost-review-index/);
  assert.match(lostReviewsView(state,{authenticated:true,available:false}),/Periksa koneksi/);
});
test('trusted review panel is injected before the map, while source strings cannot become HTML',()=>{
  const item={pemohon:'<title>',tanggalMulai:null,tanggalSelesai:null,tanggalBerkas:null};
  const html=lostCertificateDetail({detail:{item,map:{stage:'idle'}},pending:{map:false}},{formatDate:()=>'-',reviewsHTML:'<section data-root-reviews>REVIEW PANEL</section>'});
  assert.match(html,/&lt;title&gt;/);assert.ok(html.indexOf('data-root-reviews')<html.indexOf('lost-certificate-map'));assert.doesNotMatch(html,/Ulasan pengumuman belum tersedia/);
});
