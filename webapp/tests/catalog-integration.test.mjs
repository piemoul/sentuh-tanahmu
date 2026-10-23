import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';
import { OPERATIONS } from '../private/operations.mjs';

test('every catalog entry reaches its intended mock transport or fails locally at its explicit boundary', async t => {
  const calls = [];
  let quotaPreparation=false,swapPreparation=false,berkasRatingPreparation=false,questionPreparation=false;
  const configuration = { configured: true, applicationAuthorization: () => 'AtrBpn fixture-only', queueAuthorization: () => 'Bearer fixture-queue-only', calendarOfficeId: () => 'fixture-decoded-office', origin: 'https://sentuh.atrbpn.go.id/', reason: 'test fixture only' };
  const user = { username: 'fixture-user', email: 'fixture@example.invalid', nomorIndukKependudukan: '0000000000000000', roleUser: 'fixture-role' };
  const server = createServer({ configuration, log: () => {}, transport: async (url, init) => {
    calls.push({ url, init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { ...user, token: { accessToken: 'fixture-token', refreshToken: 'fixture-refresh', tokenType: 'Bearer', expiredAt: 4_000_000_000 } } });
    if (url.pathname === '/account/account_summary') return Response.json({error:false,data:{userLevel:2,isIkd:false,nomorIdentitas:'fixture-summary-nik',nama:'fixture-summary-scan-name',email:'fixture-summary-email',nomorHp:'fixture-summary-phone',endpoint:url.pathname}});
    if (url.pathname === '/account/CheckVerifStatusPerorangan') return Response.json({error:true,message:'1',data:''});
    if (url.pathname === '/PeruriLivenessSdk/ValidateKTPDataV2') return Response.json({error:true,message:'fixture identity Info',data:null,unknown:'discard'});
    if (swapPreparation&&url.pathname==='/legacy/Kantah')return Response.json([{KantorId:'fixture-swap-office',Nama:'Fixture Swap Office',TipeKantorId:null}]);
    if(['/apis/SwaplottingTerdaftar','/apis/SwaplottingBelumTerdaftar'].includes(url.pathname))return Response.json({error:true,body:'ignored'},{status:201});
    if(berkasRatingPreparation&&url.pathname==='/Berkas/GetBerkas')return Response.json({error:false,data:[{berkasId:' fixture raw Berkas ID +&/ ',readyToRating:true,nomor:42,tahun:2026,namaProsedur:'fixture-rating'}]});
    if(berkasRatingPreparation&&url.pathname==='/berkas/CariBerkas')return Response.json({error:false,data:{berkasId:' fixture raw Berkas ID +&/ ',nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'fixture-rating',parapihak:[],perjalananBerkas:[],kantor:{nama:'Fixture Rating Office'}}});
    if(url.pathname==='/berkas/postratingberkas')return Response.json({error:true,message:'fixture Rating Berkas result'},{status:201});
    if(questionPreparation&&url.pathname==='/berkas/CariBerkas')return Response.json({error:false,data:{berkasId:'fixture-question-id',nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'fixture-question',parapihak:[],perjalananBerkas:[]}});
    if(url.pathname==='/TanyaJawab/SubmitPertanyaan')return Response.json({error:true,message:'explicit synthetic rejection'});
    if(url.pathname==='/TanyaJawab/GetTanyaJawabBerkas')return Response.json({error:true,data:[]});
    if (url.pathname === '/legacy/Wilayah') return Response.json([{Kode:'fixture-code',Nama:'Fixture Region',TipeWilayah:null,WilayahId:'fixture-WilayahId'}]);
    if (['/legacy/GetPersilId','/legacy/GetPersilIdByNibel'].includes(url.pathname)) return Response.json({error:true,PersilId:'fixture-parcel-id',Luas:123,unknownFixture:'discard'});
    if (url.pathname === '/PlotBidang/DaftarPlot') return Response.json({error:false,data:[{plotId:'fixture-plot-id',nup:'fixture-NUP',wilayah:'Fixture Region',statusVerifikasi:2,statusTerdaftar:1,tanggal:'raw-date-string',unknownFixture:'discard'}]});
    if (url.pathname === '/PlotBidang/GetDetail') return Response.json({error:false,data:{nup:'fixture-NUP',luas:123.5,delineasi:{type:'Polygon',coordinates:[[[1,2]]]},unknownFixture:'discard'}});
    if (url.pathname === '/bukutamu'&&init.method==='POST') return Response.json({error:true,message:'ignored transformed business body',data:'not a registration receipt'});
    if (url.pathname === '/bukutamu') return Response.json({error:true,message:'fixture guestbook',data:{userId:'fixture-qr-user',unknownFixture:'discard'}});
    if (url.pathname === '/Map/GetDisclaimer') return Response.json({error:true,message:'fixture disclaimer',message2:null,message3:'',url:'raw-string-url',data:{unknownFixture:'discard'}});
    if (url.hostname === 'aplikasi.atrbpn.go.id') {
      if(url.pathname.endsWith('/items/kantor'))return Response.json({data:[{id:'fixture-office',nama:'Fixture Office',kantor_id:'fixture-canonical-office'}]});
      if(url.pathname.endsWith('/items/lokasi'))return Response.json({data:[{id:'fixture-location',kantor:'fixture-office',nama:'Fixture Location',alamat:''}]});
      if(url.pathname==='/konsol/antrian/directus/api/antrian')return Response.json({error:false,data:quotaPreparation?[{id:'fixture-loket',nama:'Fixture Loket',is_available:1}]:[]});
      if(url.pathname==='/konsol/antrian/directus/api/booking/limit/')return Response.json({error:false,message:'fixture quota',data:{is_available:true,jumlah_antrian:0}},{status:201});
      return url.pathname.endsWith('/notifikasi')?Response.json({data:[]}):Response.json({error:false,data:url.pathname.endsWith('/saya')?[{id:'fixture-queue-id'}]:{id:'fixture-queue-id'}});
    }
    if (url.pathname === '/dokumen/GetDokumen') return new Response('%PDF-fixture-only', { headers: { 'Content-Type': 'application/octet-stream' } });
    if (url.pathname === '/apis/GetDocument') return new Response('%PDF-fixture-only'.padEnd(256, ' '), { headers: { 'Content-Type': 'application/octet-stream' } });
    if (url.pathname === '/apis/scanDocument') return Response.json({error:true,message:'Other',data:'fixture-scan-code'});
    if (url.pathname === '/apis/GetDocumentType') return Response.json({error:true,data:{showRoute:1,type:'Generic'}});
    if (url.pathname === '/apis/GetPBTElDetail') return Response.json({error:false,data:{nomor:'fixture-pbt',kantor:'',daftarBidangTanah:null}});
    if (url.pathname === '/apis/GetKKPRDetail') return Response.json({error:false,data:{status:false,kkprId:'fixture-kkpr'}});
    if (['/Berita/GetBerita', '/Pengumuman/GetPengumuman'].includes(url.pathname)) return Response.json({ error: true, message: [{ id: url.pathname, title: 'fixture news', category: null, banner: null, url: null }] });
    if (url.pathname === '/announcement/yuridis_byKantor') return Response.json({error:true,data:[{persilId:'fixture-yuridis-id',luasPersil:42,unknownFixture:'discarded'}]});
    if (url.pathname === '/review/last_user_review') return Response.json({error:true,data:{reviewId:'fixture-yuridis-review',rating:4,comment:'fixture-yuridis-comment',createdAt:null,reviewPhotos:[],unknownFixture:'discarded'},unknownFixture:'discarded'});
    if (url.pathname === '/announcement/sertipikat_hilang_byKantor') return Response.json({error:true,data:[{dI304Id:'fixture-lost-id',luas:42,unknownFixture:'discarded'}]});
    if (url.pathname === '/RatingPPAT/GetRatingQuestions') return Response.json({error:true,data:[],message:'ignored'});
    if (url.pathname === '/RatingPPAT/PostRatingPPAT') return Response.json({error:false,message:'fixture Rating result',data:'ignored',unknownFixture:'discarded'},{status:201});
    if (url.pathname === '/review/all') return Response.json({error:true,data:[],unknownFixture:'discarded'});
    if (url.pathname === '/review/post') return Response.json({error:true,data:'ignored-body',unknownFixture:'discarded'});
    if(['/Mitra/GetPenilaiList','/Mitra/GetKantorPPAT','/Mitra/GetPPATList','/Mitra/GetWilayahSurveyor','/Mitra/GetSurveyorList'].includes(url.pathname))return Response.json({error:true,data:[],message:'ignored'});
    if (url.pathname === '/activity/GetUserActivity') return Response.json({error:true,data:[],message:'ignored'});
    if (url.pathname === '/activity/deleteUserActivity') return new Response('ignored malformed response body', {status:200});
    if (['/collection/GetCollectionId','/Collection/AddCollectionBerkas','/Collection/AddCollectionPersil'].includes(url.pathname)) return Response.json({error:true,message:null,data:'fixture-bookmark',unknownFixture:'discarded'});
    if (['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)) return Response.json({error:true,message:null,data:[],unknownFixture:'discarded'});
    if (['/Collection/AddPersilCollectionGroup','/Collection/AddPersilCollectionToGroup','/Collection/EditCollectionPersil'].includes(url.pathname) || /^\/Collection\/Delete(?:PersilCollection(?:From)?Group|Collection(?:Persil|Berkas))\//.test(url.pathname)) return Response.json({error:true,message:null,data:'fixture-group-action',unknownFixture:'discarded'});
    return Response.json({ data: { fixture: true, endpoint: url.pathname } });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let response = await fetch(base + '/api/state');
  let cookie = response.headers.get('set-cookie').split(';')[0]; let state = await response.json();
  const post = (route, data) => fetch(base + route, { method: 'POST', headers: { Cookie: cookie, Origin: base, 'X-CSRF-Token': state.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const stageSwaplotting=async kind=>{
    swapPreparation=true;const sourceContexts={};
    for(const [name,id,values]of [['profile','post-account-account-summary-d2939c',{}],['disclaimer','get-map-getdisclaimer-d29ef0',{}],['offices','get-legacy-kantah-d10364',{nama:'',tipeKantor:''}],['regions','get-legacy-wilayah-d752bc',{kantorid:'fixture-swap-office'}]]){const response=await post('/api/execute',{operationId:id,values});assert.equal(response.status,200);const read=await response.json();assert.equal(read.result.swaplottingSourceContext.kind,name);sourceContexts[name]=read.result.swaplottingSourceContext.id;}
    const fields=kind==='registered'?{name:'fixture-summary-scan-name',phone:'fixture-summary-phone',email:'fixture-summary-email',number:' 0007 ',review:' raw\nreview '}:{name:'fixture-summary-scan-name',phone:'fixture-summary-phone',email:'fixture-summary-email',address:' raw address ',basisNumber:' 001 ',basisDescription:' basis ',taxNumber:' 002 ',taxDescription:' tax ',review:' raw\nreview '};
    const form=new FormData();form.set('operationId','swaplotting-review');form.set('confirm','false');form.set('values',JSON.stringify({kind,sourceContexts,draft:{fields,officeIndex:0,regionIndex:0,right:kind==='registered'?'8':null,basisIndex:kind==='registered'?null:0,taxIndex:kind==='registered'?null:0,latitude:'-6.123456789',longitude:'106.123456789',disclaimerAcknowledged:true}}));form.append('file',new File([new Uint8Array([0,17,255])],'ignored-original.png',{type:'image/png'}));
    const response=await fetch(base+'/api/swaplotting/review',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken},body:form});assert.equal(response.status,200);const result=await response.json();assert.match(result.reviewId,/^sr_[A-Za-z0-9_-]{32}$/);swapPreparation=false;return result.reviewId;
  };
  const stageBerkasRating=async()=>{
    berkasRatingPreparation=true;
    try{
      const list=await post('/api/execute',{operationId:'post-berkas-getberkas-d15068',values:{selesai:false}});assert.equal(list.status,200);const owned=await list.json();assert.equal(owned.result.berkasRatingSources.length,1);assert.equal(owned.result.berkasRatingSources[0].index,0);assert.match(owned.result.berkasRatingSources[0].sourceId,/^brs_[A-Za-z0-9_-]{32}$/);
      const detail=await post('/api/execute',{operationId:'post-berkas-cariberkas-d88218',values:{berkasId:' fixture raw Berkas ID +&/ '},berkasRatingSourceId:owned.result.berkasRatingSources[0].sourceId});assert.equal(detail.status,200);const result=await detail.json();assert.match(result.result.berkasRatingContextId,/^brc_[A-Za-z0-9_-]{32}$/);return result.result.berkasRatingContextId;
    }finally{berkasRatingPreparation=false;}
  };
  const stageGuestbook=async()=>{
    const response=await post('/api/execute',{operationId:'get-bukutamu-d28bf4',values:{uid:' fixture guestbook kd +&/ ',unid:' fixture guestbook id +&/ '}});assert.equal(response.status,200);const result=await response.json();assert.match(result.result.guestbookContextId,/^gbc_[A-Za-z0-9_-]{32}$/);assert.deepEqual(result.result.data.data,{userId:'fixture-qr-user',kantorId:null,unitKerjaId:null,namaUnitKerja:null});return result.result.guestbookContextId;
  };
  const stageQuestion=async()=>{questionPreparation=true;try{const response=await post('/api/execute',{operationId:'post-berkas-cariberkas-d88218',values:{nomor:'42',tahun:'2026',kantorId:'fixture-question-office',berkasId:null}});assert.equal(response.status,200);const result=await response.json();assert.equal(result.result.berkasQuestionContext.berkasId,'fixture-question-id');assert.equal(result.result.berkasQuestionContext.entry,'search');assert.match(result.result.berkasQuestionContext.contextId,/^bqc_[A-Za-z0-9_-]{32}$/);return result.result.berkasQuestionContext.contextId;}finally{questionPreparation=false;}};
  response = await post('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  assert.equal(response.status, 200); cookie = response.headers.get('set-cookie').split(';')[0]; state = await response.json();
  response=await post('/api/execute',{operationId:'get-api-antrian-saya-d1eb1c',values:{}});
  assert.equal(response.status,200,'Prepare own server-returned queue ID before the catalog detail entry');
  let enabled = 0, blocked = 0;
  const prerequisiteIds=['get-items-kantor-d1fa00','get-items-lokasi-d8a0dc','get-api-antrian-d89cb4'];
  // These reads own the returned-ID chain; execute their catalog entries in
  // dependency order rather than introducing arbitrary fixture-only IDs.
  for (const operation of [...prerequisiteIds.map(id=>OPERATIONS.find(o=>o.id===id)),...OPERATIONS.filter(o=>!prerequisiteIds.includes(o.id))]) {
    const values = {};
    for (const field of operation.fields) {
      if (field.source !== 'input' || field.type === 'file' || Object.hasOwn(field, 'default')) continue;
      values[field.path] = field.arraySchema === 'rating-ppat-selected-answer-ids' ? ['fixture-answer-B','fixture-answer-A','fixture-answer-B',''] : field.arraySchema === 'information-simulation-type2' ? [{Jumlah:'02',Luas:'00100',Penggunaan:'pertanian'}] : field.type === 'boolean' ? false : ['integer', 'number'].includes(field.type) ? 1 : 'fixture input + & value';
    }
    if(operation.id==='post-api-booking-limit-d8bf80'){quotaPreparation=true;const preread=await post('/api/execute',{operationId:'get-api-antrian-d89cb4',values:{lokasi:'fixture-location',tanggal:'2026-10-20'}});assert.equal(preread.status,200);const owned=await preread.json();assert.match(owned.result.bookingContextId,/^qb_[A-Za-z0-9_-]{32}$/);Object.assign(values,{contextId:owned.result.bookingContextId,rowIndex:0,documentCount:1,timeZone:'Asia/Jakarta'});}
    if(['post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8'].includes(operation.id))values.reviewId=await stageSwaplotting(operation.id==='post-apis-swaplottingterdaftar-d9f850'?'registered':'unregistered');
    if(operation.id==='post-berkas-postratingberkas-d915c4')Object.assign(values,{contextId:await stageBerkasRating(),rating:3,userComment:' raw\n comment '});
    if(operation.id==='post-bukutamu-d99dd8')Object.assign(values,{contextId:await stageGuestbook(),name:' raw name ',nik:'abcdefghijklmnop',phone:' raw phone ',birthDate:' raw date ',birthPlace:' raw place ',address:' raw\naddress ',email:' @ ',institution:' raw institution ',purpose:' raw purpose '});
    if(operation.id==='post-tanyajawab-submitpertanyaan-d994f4')Object.assign(values,{contextId:await stageQuestion(),content:' raw\n question ~!* '});
    if(operation.id==='get-tanyajawab-gettanyajawabberkas-d2826c')values.berkasid='fixture-question-id';
    const before = calls.length;
    if(operation.endpoint==='api/antrian/{path_argument_1}')values.path_argument_1='fixture-queue-id';
    if(operation.id==='get-items-lokasi-d8a0dc')values['filter[kantor]']='fixture-office';
    if(operation.id==='get-api-antrian-d89cb4')Object.assign(values,{lokasi:'fixture-location',tanggal:'2026-10-20'});
    if(operation.id==='get-legacy-getpersilid-d74e4c')values.jenishak='1';
    response = await post('/api/execute', { operationId: operation.id, values, confirm: true });
    const result = await response.json();
    if (!operation.enabled) {
      blocked++; assert.equal(response.status, 422, operation.id); assert.equal(calls.length, before, operation.id); continue;
    }
    enabled++; assert.equal(response.status, 200, `${operation.id}: ${JSON.stringify(result)}`); assert.equal(calls.length, before + (operation.id === 'post-apis-scandocument-d42440' || ['queue-booking','swaplotting-post'].includes(operation.clientProfile) ? 2 : 1), operation.id);
    if(operation.clientProfile==='berkas-question-post'){
      assert.deepEqual(calls.slice(before).map(row=>row.url.pathname),['/TanyaJawab/SubmitPertanyaan']);const {url,init}=calls.at(-1);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer fixture-token');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(init.body,'berkasid=fixture-question-id&content=+raw%0A+question+~%21%2A+');assert.equal(operation.effect,'write');assert.equal(operation.requiresConfirmation,true);assert.equal(result.result.delivery,'received');assert.deepEqual(result.result.data,{success:false});assert.equal(result.result.refresh,null);continue;
    }
    if(operation.clientProfile==='guestbook-post'){
      assert.deepEqual(calls.slice(before).map(row=>row.url.pathname),['/bukutamu']);const {url,init}=calls.at(-1);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.redirect,'manual');assert.equal(init.headers.Authorization,'AtrBpn fixture-only');assert.equal(operation.auth,'session');assert.equal(operation.upstreamAuthentication,'application');assert.equal(operation.requiresConfirmation,true);const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();assert.deepEqual([...form],[['kantorId',''],['unitKerjaId',''],['userId','fixture-qr-user'],['nik','abcdefghijklmnop'],['alamat',' raw\naddress '],['namaLengkap',' raw name '],['tempatLahir',' raw place '],['tanggalLahir',' raw date '],['noTelp',' raw phone '],['email',' @ '],['instansi',' raw institution '],['keperluan',' raw purpose ']]);assert.equal(result.result.status,200);assert.equal(result.result.delivery,'received');assert.deepEqual(result.result.data,{error:false});continue;
    }
    if(operation.clientProfile==='guestbook-read'){
      const {url,init}=calls.at(-1);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/bukutamu');assert.equal(init.method,'GET');assert.equal(new Headers(init.headers).get('Authorization'),'AtrBpn fixture-only');assert.equal(new Headers(init.headers).get('Content-Type'),null);assert.equal(init.body,undefined);assert.deepEqual([...url.searchParams],[['uid',values.uid],['unid',values.unid]]);assert.deepEqual(result.result.data,{error:true,message:'fixture guestbook',data:{userId:'fixture-qr-user',kantorId:null,unitKerjaId:null,namaUnitKerja:null}});continue;
    }
    if(operation.clientProfile==='swaplotting-post'){
      assert.deepEqual(calls.slice(before).map(value=>value.url.pathname),['/account/account_summary',operation.path]);const {url,init}=calls.at(-1);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer fixture-token');const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();assert.deepEqual([...form.keys()],operation.nativeFields.map(value=>value.path));assert.equal(form.get('id'),'id');assert.equal(form.get('kluster'),'K4');assert.equal(form.get('namapemilik'),'fixture-summary-scan-name');assert.equal(form.get('kontaktelp'),'fixture-summary-phone');assert.equal(form.get('kantorid'),'fixture-swap-office');assert.equal(form.get('wilayahid'),'fixture-WilayahId');assert.equal(form.get('reviu'),'raw\nreview');assert.equal(form.get('file').type,'application/octet-stream');assert.match(form.get('file').name,/^[0-9a-f]{32}$/);assert.deepEqual([...new Uint8Array(await form.get('file').arrayBuffer())],[0,17,255]);assert.equal(result.result.status,201);assert.equal(result.result.data,false);assert.equal(calls.some(value=>value.url.pathname==='/activity/AddUserActivity'&&!(value.init.body instanceof FormData)),false);continue;
    }
    if(operation.clientProfile==='berkas-rating-post'){
      assert.deepEqual(calls.slice(before).map(value=>value.url.pathname),['/berkas/postratingberkas']);const {url,init}=calls.at(-1);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer fixture-token');assert.equal(operation.requiresConfirmation,true);const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();assert.deepEqual([...form],[['Berkasid',' fixture raw Berkas ID +&/ '],['rating','3'],['userComment','raw\n comment']]);assert.equal(result.result.status,201);assert.equal(result.result.delivery,'received');assert.deepEqual(result.result.data,{error:true,message:'fixture Rating Berkas result'});continue;
    }
    if(operation.clientProfile==='queue-booking'){
      assert.deepEqual(calls.slice(before).map(call=>call.url.pathname),['/account/account_summary','/konsol/antrian/directus/api/booking/limit/']);const {url,init}=calls.at(-1);assert.equal(url.origin,'https://aplikasi.atrbpn.go.id');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.deepEqual(init.headers,{Authorization:'Bearer fixture-queue-only','User-Agent':'Dart/Flutter','Content-Type':'application/json'});assert.equal(init.body,JSON.stringify({nik:'fixture-summary-nik',kantorid:'fixture-office',tanggal_booking:'2026-10-20'}));assert.equal(result.result.status,201);assert.equal(result.result.data.quotaAvailable,true);assert.equal(result.result.data.createAvailable,false);assert.equal(result.result.data.review.bookingCreated,false);assert.match(result.result.data.reviewId,/^qr_[A-Za-z0-9_-]{32}$/);continue;
    }
    if(operation.clientProfile==='queue-read'){
      const {url,init}=calls.at(-1);assert.equal(url.origin,'https://aplikasi.atrbpn.go.id');
      assert.equal(init.method,'GET');assert.equal(init.headers.Authorization,'Bearer fixture-queue-only');assert.equal(init.body,undefined);
      if(operation.id==='get-items-kantor-d1fa00'){assert.equal(url.pathname,'/konsol/antrian/directus/items/kantor');assert.equal(url.search,'?limit=1000&sort=nama');assert.deepEqual(result.result.data,{error:false,data:[{id:'fixture-office',nama:'Fixture Office',kantor_id:'fixture-canonical-office'}]});}
      else if(operation.id==='get-items-lokasi-d8a0dc'){assert.equal(url.pathname,'/konsol/antrian/directus/items/lokasi');assert.deepEqual([...url.searchParams],[['filter[kantor]','fixture-office']]);assert.equal(result.result.data.data[0].id,'fixture-location');}
      else if(operation.id==='get-api-antrian-d89cb4'){assert.equal(url.pathname,'/konsol/antrian/directus/api/antrian');assert.deepEqual([...url.searchParams],[['lokasi','fixture-location'],['tanggal','2026-10-20']]);assert.deepEqual(result.result.data,{error:false,data:[]});}
      else if(operation.endpoint==='api/notifikasi'){assert.equal(url.pathname,'/konsol/antrian/directus/api/notifikasi');assert.equal(url.searchParams.get('nik'),'fixture-summary-nik');assert.deepEqual(result.result.data,{data:[]});}
      else if(operation.endpoint==='api/antrian/saya'){assert.equal(result.result.data.error,false);assert.equal(url.pathname,'/konsol/antrian/directus/api/antrian/saya');assert.equal(url.searchParams.get('nik'),'fixture-summary-nik');assert.equal(result.result.data.data[0].id,'fixture-queue-id');}
      else {assert.equal(url.pathname,'/konsol/antrian/directus/api/antrian/fixture-queue-id');assert.equal(url.search,'');assert.equal(result.result.data.data.id,'fixture-queue-id');}
      continue;
    }
    if (operation.id === 'post-apis-scandocument-d42440') {
      assert.equal(Object.hasOwn(values,'name'),false);
      assert.deepEqual(calls.slice(before).map(call=>call.url.pathname),['/account/account_summary','/apis/scanDocument']);
      assert.deepEqual([...calls.at(-1).init.body],[['q',values.q],['name','fixture-summary-scan-name']]);
      assert.deepEqual(result.result.data,{message:'Other',data:'fixture-scan-code'});
      assert.match(result.result.scanContextId,/^[A-Za-z0-9_-]{32}$/);
    }
    else if (operation.path === 'account/CheckVerifStatusPerorangan') assert.deepEqual(result.result.data,{error:true,message:'1',data:''});
    else if(operation.path==='TanyaJawab/GetTanyaJawabBerkas'){assert.deepEqual(result.result.data,[]);assert.equal(calls.at(-1).url.search,'?berkasid=fixture-question-id');assert.equal(calls.at(-1).init.body,undefined);}
    else if (operation.path === 'Map/GetDisclaimer') assert.deepEqual(result.result.data,{message:'fixture disclaimer',message2:null,message3:'',url:'raw-string-url'});
    else if (operation.path === 'PeruriLivenessSdk/ValidateKTPDataV2') {
      assert.deepEqual(result.result.data,{error:true,message:'fixture identity Info'});
      assert.deepEqual([...calls.at(-1).init.body],operation.fields.map(field=>[field.path,'']),'The five nullable form-model fields default to present empty Strings; no stored-user NIK is substituted');
    }
    else if (operation.path === 'legacy/Wilayah') assert.deepEqual(result.result.data,[{Kode:'fixture-code',Nama:'Fixture Region',TipeWilayah:null,WilayahId:'fixture-WilayahId'}]);
    else if (['legacy/GetPersilId','legacy/GetPersilIdByNibel'].includes(operation.path)) assert.deepEqual(result.result.data,{Alamat:null,BatasPersil:null,BatasPersilLegal:null,Luas:123,NamaWilayah:null,NomorIndukBidang:null,PersilId:'fixture-parcel-id',TipeWilayah:null});
    else if (operation.path === 'PlotBidang/DaftarPlot') assert.deepEqual(result.result.data,{error:false,data:[{plotId:'fixture-plot-id',nup:'fixture-NUP',wilayah:'Fixture Region',statusVerifikasi:2,statusTerdaftar:1,tanggal:'raw-date-string'}]});
    else if (operation.path === 'PlotBidang/GetDetail') assert.deepEqual(result.result.data,{error:false,data:{nup:'fixture-NUP',jenisInstansi:null,wilayahId:null,wilayah:null,kantorId:null,kantor:null,alamat:null,jenisHakId:null,jenisHak:null,nomorHak:null,statusVerifikasi:null,keterangan:null,nib:null,nibel:null,penguasaan:null,pemilikan:null,pemanfaatan:null,penggunaan:null,permasalahan:null,luas:123.5,luasDelineasi:null,reviu:null,rutr:null,batasUtara:null,batasTimur:null,batasSelatan:null,batasBarat:null}});
    else if (operation.path === 'apis/GetDocumentType') assert.deepEqual(result.result.data,{error:true,data:{showRoute:1,type:'Generic'}});
    else if (operation.path === 'apis/GetPBTElDetail') assert.deepEqual(result.result.data,{error:false,data:{nomor:'fixture-pbt',kantor:'',daftarBidangTanah:null}});
    else if (operation.path === 'apis/GetKKPRDetail') assert.deepEqual(result.result.data,{error:false,data:{status:false,pesan:null,kkprId:'fixture-kkpr',berkasId:null,kantorId:null,encryptedId:null,textualData:null,geometryData:null}});
    else if (operation.clientProfile === 'sps-document-viewer' || operation.path === 'apis/GetDocument') { assert.equal(result.result.contentType, 'application/pdf'); assert.match(result.result.previewUrl, /^\/api\/preview\//); }
    else if (['Berita/GetBerita', 'Pengumuman/GetPengumuman'].includes(operation.path)) assert.deepEqual(result.result.data, { message: [{ id: `/${operation.path}`, title: 'fixture news', category: null, banner: null, url: null }] });
    else if (operation.path === 'announcement/yuridis_byKantor') assert.deepEqual(result.result.data,{data:[{persilId:'fixture-yuridis-id',nomorBerkas:null,nomorPengumuman:null,tanggalMulai:null,tanggalSelesai:null,nib:null,wilayah:null,pemohon:null,permohonan:null,kegiatan:null,luasPersil:42}]});
    else if (operation.id === 'post-review-last-user-review-dad1dc') {assert.deepEqual(result.result.data,{data:[{reviewId:'fixture-yuridis-review',rating:4,comment:'fixture-yuridis-comment',createdAt:null,reviewPhotos:[]}]});assert.deepEqual([...new URLSearchParams(calls.at(-1).init.body)],[['reviewType','sertipikatSaya'],['contentId',values.contentId]]);assert.equal(operation.effect,'read');assert.equal(operation.requiresConfirmation,false);}
    else if (operation.path === 'announcement/sertipikat_hilang_byKantor') assert.deepEqual(result.result.data,{data:[{dI304Id:'fixture-lost-id',persilId:null,berkasId:null,nomor:null,tanggalMulai:null,tanggalSelesai:null,nib:null,wilayah:null,pemohon:null,nomorBerkas:null,tanggalBerkas:null,tipe:null,luas:42}]});
    else if (operation.path === 'review/all') {assert.deepEqual(result.result.data,{totalRecords:null,resultsCount:null,pageSize:null,pageNumber:null,error:true,message:null,data:[]});assert.deepEqual([...new URLSearchParams(calls.at(-1).init.body)],[['reviewType','pengumumanSertipikatHilang'],['contentId',values.contentId],['pageNumber','1'],['pageSize','10']]);assert.equal(operation.effect,'read');assert.equal(operation.requiresConfirmation,false);}
    else if(operation.path==='RatingPPAT/GetRatingQuestions')assert.deepEqual(result.result.data,{data:[]});
    else if(operation.path==='RatingPPAT/PostRatingPPAT'){assert.deepEqual(result.result.data,{success:true,message:'fixture Rating result'});assert.equal(result.result.status,201);assert.equal(operation.requiresConfirmation,true);assert.equal(calls.at(-1).init.headers.Accept,'text/plain');assert.equal(calls.at(-1).init.headers['Content-Type'],'application/json');assert.equal(calls.at(-1).init.body,JSON.stringify({aktaId:values.aktaId,PertanyaanRatingPPATId:values.PertanyaanRatingPPATId}));}
    else if(operation.path.startsWith('Mitra/'))assert.deepEqual(result.result.data,{data:[]});
    else if(operation.path==='review/post'){
      assert.equal(result.result.data,false);assert.equal(operation.effect,'write');assert.equal(operation.requiresConfirmation,true);
      const {url,init}=calls.at(-1);assert.equal(url.pathname,'/review/post');assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer fixture-token');
      const form=await new Request('http://localhost/',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:init.body}).formData();
      assert.deepEqual([...form],[['contentId',values.contentId],['reviewType','pengumumanSertipikatHilang'],['comment',values.comment],['rating','1']]);continue;
    }
    else if (operation.path === 'activity/GetUserActivity') assert.deepEqual(result.result.data,{data:[]});
    else if (operation.path === 'activity/deleteUserActivity') assert.equal(result.result.data,true);
    else if (['collection/GetCollectionId','Collection/AddCollectionBerkas','Collection/AddCollectionPersil'].includes(operation.path)) assert.deepEqual(result.result.data,{error:true,message:null,data:'fixture-bookmark'});
    else if (['collection/GetUserCollection','collection/GetPersilCollectionGroup'].includes(operation.path)) assert.deepEqual(result.result.data,{error:true,message:null,data:[]});
    else if (['Collection/AddPersilCollectionGroup','Collection/AddPersilCollectionToGroup','Collection/EditCollectionPersil'].includes(operation.path) || operation.method === 'DELETE' && operation.group === 'Koleksi') assert.deepEqual(result.result.data,{error:true,message:null,data:'fixture-group-action'});
    else assert.equal(result.result.data.data.endpoint, `/${operation.path.replace(/^\/+/, '')}`, operation.id);
    const { url, init } = calls.at(-1);
    assert.equal(init.method, operation.method, operation.id);
    const expectedQuery = operation.fields.filter(f => f.location === 'query').map(f => f.path).sort();
    assert.deepEqual([...url.searchParams.keys()].sort(), expectedQuery, operation.id);
    if (operation.method === 'DELETE' && operation.group === 'Koleksi') assert.equal(url.pathname, '/' + operation.path.replace('{path_argument_1}', encodeURIComponent(values.path_argument_1)));
    const expectedBody = operation.fields.filter(f => f.location !== 'query' && f.location !== 'path' && f.type !== 'file').map(f => f.path).sort();
    const actualBody = init.body instanceof FormData || init.body instanceof URLSearchParams ? [...init.body.keys()] : typeof init.body === 'string' && init.headers['Content-Type'] === 'application/x-www-form-urlencoded' ? [...new URLSearchParams(init.body).keys()] : init.body ? Object.keys(JSON.parse(init.body)) : [];
    assert.deepEqual(actualBody.sort(), expectedBody, operation.id);
    if (operation.auth === 'application') assert.equal(init.headers.Authorization, 'AtrBpn fixture-only');
    else if (['session', 'optionalSession'].includes(operation.auth)) assert.equal(init.headers.Authorization, 'Bearer fixture-token');
  }
  assert.equal(enabled, 95); assert.equal(blocked, 81);
  assert.equal(calls.length, 117, 'Previous115 mock calls plus one native search-detail context preparation and one Tanya POST; explicit rejection does not refresh; no provider network');
});
