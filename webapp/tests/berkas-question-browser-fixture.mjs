// Explicit localhost-only synthetic E2E fixture. Importing does not start it.
// Actual application/server/registry/session; every upstream transport injected.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {fileURLToPath}from'node:url';
import {createServer}from'../server.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const read=file=>fs.readFileSync(path.join(ROOT,file));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ORIGINAL='00000000-0000-4000-8000-000000000001';
export function createBerkasQuestionBrowserFixture({port=4234,suffix='initial',runtimeReceipt='analysis/webapp/berkas-question-node-final.json'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const proof=JSON.parse(read(runtimeReceipt));assert.equal(proof.passed,true);assert.equal(proof.runtimeCount,147);assert.equal(proof.fail,0);assert.equal(proof.testFiles.length,152);
 const origin='http://127.0.0.1:'+port,output='analysis/webapp/berkas-question-browser-transport-'+suffix+'.json';assert.equal(fs.existsSync(path.join(ROOT,output)),false);
 const inputs=new Map([...proof.runtime,...proof.testInputs].map(row=>[row.file,{...row}]));
 for(const file of ['webapp/tests/berkas-question-browser-fixture.mjs',runtimeReceipt])inputs.set(file,{file,sha256:sha(read(file))});
 const stable=()=>{for(const row of inputs.values())assert.equal(sha(read(row.file)),row.sha256,'Frozen source changed '+row.file);};stable();
 const calls=[],requests=[],controls=[],violations=[],held=new Map();let sequence=0,generation=0,postMode='accepted',readMode='normal',stopped=false,listenerClosed=false,server;
 let messages=[];
 const message=patch=>({berkasId:ORIGINAL,nik:'PRIVATE-SYNTHETIC-NIK',content:'Balasan sintetis',isTanya:'0',tanggal:'23 Oktober 2026',waktu:'09:00',namaKantor:'KANTOR SINTETIS',...patch});
 const normalRows=()=>[message({content:'Pertanyaan terdahulu sintetis',isTanya:'1'}),message(),message({tanggal:'24 Oktober 2026',content:'Balasan tanggal berikutnya'}),message({tanggal:'23 Oktober 2026',content:'<img src=x onerror="syntheticOnly()">\nTeks literal & aman'}),...messages];
 const report=()=>({schemaVersion:1,checkedAt:new Date().toISOString(),origin,scope:'Actual browser app with injected synthetic main transports only; no provider, location, camera or real account.',synthetic:true,runtimeReceipt,runtimeReceiptSha256:sha(read(runtimeReceipt)),runtimeCount:147,inputs:[...inputs.values()],calls,requests,controls,violations,held:[...held.keys()],stopped,listenerClosed,productionRequests:0,productionWrites:0,deviceRequests:0});
 const persist=()=>fs.writeFileSync(path.join(ROOT,output),JSON.stringify(report(),null,2)+'\n');
 const reject=message=>{violations.push(message);persist();throw Error('Synthetic fixture rejected unexpected request');};
 const wait=call=>new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);call.release='timeout';resolve();persist();},45000);timer.unref();held.set(call.sequence,()=>{clearTimeout(timer);held.delete(call.sequence);call.release='control';resolve();persist();});persist();});
 const done=(call,data,status=200,type='application/json')=>{Object.assign(call,{completed:true,responseSequence:++sequence,status});persist();return new Response(type==='application/json'?JSON.stringify(data):data,{status,headers:{'Content-Type':type}});};
 const detail=()=>({berkasId:ORIGINAL,nomor:7001,tahun:2026,statusBerkas:1,namaProsedur:'BERKAS UJI SINTETIS',namaPegawai:'PETUGAS SINTETIS',biaya:12000,tanggalDibuat:'2026-10-23',tanggalSelesai:null,parapihak:[],perjalananBerkas:[{taskNodeGroupId:'task-synthetic',namaGrup:'TAHAP SINTETIS',tanggalFlow:'2026-10-23T09:00:00',isCurrent:true}],kantor:{nama:'KANTOR SINTETIS',alamat:'ALAMAT SINTETIS',tipeKantorId:'2'}});
 const transport=async(input,init)=>{
  const url=new URL(input);if(url.origin!=='https://sentuh.atrbpn.go.id')return reject('Unexpected origin');
  const call={sequence:++sequence,path:url.pathname,method:init.method,query:[...url.searchParams],completed:false};calls.push(call);persist();
  const headers=new Headers(init.headers);
  if(url.pathname==='/auth/signin'){
   const form=new URLSearchParams(init.body);if(form.get('username')!=='question-fixture'||form.get('password')!=='synthetic-question-only')return done(call,{error:true},401);
   assert.equal(headers.get('Authorization'),'AtrBpn synthetic-question-app');generation++;call.generation=generation;
   return done(call,{data:{username:'question-fixture',email:'synthetic@example.invalid',nomorIndukKependudukan:'0000000000000000',roleUser:'PERORANGAN',userLevel:2,token:{tokenType:'Bearer',accessToken:'synthetic-question-access-'+generation,refreshToken:null,expiredAt:null}}});
  }
  if(['/Berita/GetBerita','/Pengumuman/GetPengumuman'].includes(url.pathname))return done(call,{message:[]});
  if(!/^Bearer synthetic-question-access-\d+$/.test(headers.get('Authorization')??''))return reject('Synthetic session bearer required');
  if(url.pathname==='/account/account_summary')return done(call,{error:false,data:{userId:'SYNTHETIC-USER',nama:'AKUN SINTETIS',nomorIdentitas:'0000000000000000',userLevel:2,isIkd:false,statusVerifikasi:1,roleUser:'PERORANGAN',nomorHp:'0000000000',email:'synthetic@example.invalid',readyToReview:false}});
  if(url.pathname==='/collection/GetUserCollection')return done(call,{error:false,data:[{id:'synthetic-collection',type:'BERKAS',contentId:ORIGINAL,title:'BERKAS UJI SINTETIS',subTitle:'7001/2026',createdAt:'2026-10-23',groupId:null,email:'synthetic@example.invalid'}]});
  if(url.pathname==='/collection/GetPersilCollectionGroup')return done(call,{error:false,data:[]});
  if(url.pathname==='/collection/GetCollectionId')return done(call,{error:false,data:'synthetic-collection'});
  if(url.pathname==='/Berkas/GetBerkas')return done(call,{error:false,data:[{berkasId:ORIGINAL,nomor:7001,tahun:2026,namaProsedur:'BERKAS UJI SINTETIS',readyToRating:true}]});
  if(url.pathname==='/berkas/CariBerkas')return done(call,{error:false,data:detail()});
  if(url.pathname==='/berkas/berkassop')return done(call,{error:false,data:{tipeProduk:'Rutin',lewatTenggat:false,tanggalTenggat:'2026-11-01'}});
  if(url.pathname==='/berkas/getStatusCetak')return done(call,{error:false,message:'-'});
  if(url.pathname==='/Dokumen/GetSpsDokumen')return done(call,{data:[]});
  if(url.pathname==='/legacy/Kantah')return done(call,[{KantorId:'synthetic-office',Nama:'KANTOR SINTETIS',TipeKantorId:2,Alamat:'ALAMAT SINTETIS'}]);
  if(url.pathname==='/TanyaJawab/GetTanyaJawabBerkas'){
   assert.equal(init.method,'GET');assert.equal(url.search,'?berkasid='+ORIGINAL);assert.equal(init.body,undefined);call.mode=readMode;
   if(call.mode==='hold'){readMode='normal';await wait(call);}
   if(call.mode==='invalid')return done(call,{data:[message({waktu:null})]});
   return done(call,{error:true,data:call.mode==='empty'?[]:normalRows()});
  }
  if(url.pathname==='/TanyaJawab/SubmitPertanyaan'){
   assert.equal(init.method,'POST');assert.equal(headers.get('Content-Type'),'application/x-www-form-urlencoded');assert.equal(typeof init.body,'string');assert.equal(url.search,'');
   const values=[...new URLSearchParams(init.body)];assert.deepEqual(values.map(row=>row[0]),['berkasid','content']);assert.equal(values[0][1],ORIGINAL);assert.ok(values[1][1].trim().length);
   call.mode=postMode;call.wireForm=init.body;call.fields=values;call.bodySha256=sha(Buffer.from(init.body));call.authorization='synthetic-session-bearer';persist();
   if(call.mode==='hold')await wait(call);
   if(call.mode==='drop'){Object.assign(call,{completed:true,responseSequence:++sequence,network:'synthetic-drop'});persist();throw Object.assign(Error('Synthetic lost reply'),{code:'ECONNRESET'});}
   if(call.mode==='unknown')return done(call,'{"error":false}',200,'text/plain');
   if(call.mode==='rejected')return done(call,{error:true});
   messages.push(message({content:values[1][1],isTanya:'1',waktu:'10:00'}));
   if(call.mode==='refresh-fail')readMode='invalid';
   return done(call,{error:false,message:{ignored:'No native result dialog'}});
  }
  return reject('Unexpected path '+url.pathname);
 };
 server=createServer({configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SYNTHETIC ONLY',applicationAuthorization:()=> 'AtrBpn synthetic-question-app'},transport,queueTransport:async()=>reject('Unexpected queue request'),bhumiTransport:async()=>reject('Unexpected Bhumi request'),log(){}});
 const handler=server.listeners('request')[0];server.removeAllListeners('request');
 const html=()=>`<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tanya Berkas — kontrol sintetis</title><style>body{font:15px system-ui;max-width:1000px;margin:30px auto;padding:16px}button,select{font:inherit;padding:10px;margin:6px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f6f8;padding:16px}label{display:block}a{margin-right:20px}</style><h1>UJI SINTETIS — Tanya Berkas</h1><p>Semua data dan transport hanya fixture. Tidak ada koneksi BPN, GPS, kamera atau unggahan produksi.</p><p>Login uji: <strong>question-fixture</strong> / <strong>synthetic-question-only</strong>.</p><p><a href="/#/account" target="_blank">Buka aplikasi uji</a><a href="/#/collections" target="_blank">Koleksi uji</a></p><form method="post" action="/__fixture/mode"><label>Mode pengiriman<select name="post">${['accepted','rejected','unknown','drop','hold','refresh-fail'].map(name=>`<option${name===postMode?' selected':''}>${name}</option>`).join('')}</select></label><label>Mode riwayat<select name="read">${['normal','empty','invalid','hold'].map(name=>`<option${name===readMode?' selected':''}>${name}</option>`).join('')}</select></label><button>Simpan mode</button></form><form method="post" action="/__fixture/release"><button>Lepas request tertahan</button></form><p>POST: <strong id="post-count">${calls.filter(row=>row.path.endsWith('/SubmitPertanyaan')).length}</strong>; GET percakapan: <strong id="read-count">${calls.filter(row=>row.path.endsWith('/GetTanyaJawabBerkas')).length}</strong>; tertahan: <strong>${held.size}</strong>; pelanggaran: <strong>${violations.length}</strong></p><h2>Request sintetis terbaru</h2><pre id="fixture-calls">${esc(JSON.stringify(calls.slice(-15),null,2))}</pre><form method="post" action="/__fixture/stop"><button>Hentikan fixture</button></form></html>`;
 const stop=()=>{if(stopped)return;stopped=true;for(const release of [...held.values()])release();persist();server.close(()=>{listenerClosed=true;persist();});server.closeIdleConnections();};
 server.on('request',async(req,res)=>{
  if(req.headers.host!=='127.0.0.1:'+port){res.writeHead(403);res.end();return;}
  const pathname=new URL(req.url,origin).pathname;
  if(pathname.startsWith('/__fixture')){
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; connect-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'");
   if(req.method==='GET'&&pathname==='/__fixture'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html());return;}
   if(req.method!=='POST'||req.headers.origin!==origin){res.writeHead(403);res.end();return;}
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const form=new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
   if(pathname==='/__fixture/mode'){assert.ok(['accepted','rejected','unknown','drop','hold','refresh-fail'].includes(form.get('post')));assert.ok(['normal','empty','invalid','hold'].includes(form.get('read')));postMode=form.get('post');readMode=form.get('read');controls.push({sequence:++sequence,action:'mode',postMode,readMode});}
   else if(pathname==='/__fixture/release'){controls.push({sequence:++sequence,action:'release'});for(const release of [...held.values()])release();}
   else if(pathname==='/__fixture/stop'){stable();res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>Fixture sintetis dihentikan</h1>');stop();return;}
   else{res.writeHead(404);res.end();return;}
   persist();res.writeHead(303,{Location:'/__fixture'});res.end();return;
  }
  const request={sequence:++sequence,method:req.method,path:pathname};requests.push(request);persist();
  res.once('finish',()=>{request.status=res.statusCode;persist();});
  const fixtureCsp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
  // Keep the fixture more restrictive than the production map-aware policy.
  // Only this response object is wrapped; no product policy is changed.
  const setHeader=res.setHeader.bind(res);res.setHeader=(name,value)=>setHeader(name,String(name).toLowerCase()==='content-security-policy'?fixtureCsp:value);
  res.setHeader('Content-Security-Policy',fixtureCsp);
  await handler(req,res);
 });
 server.on('close',()=>{listenerClosed=true;persist();});
 return {server,origin,output,start:async()=>{stable();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});persist();return origin;},stop,report};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const receipt=process.argv[2],suffix=process.argv[3]??'initial';assert.equal(typeof receipt,'string');const fixture=createBerkasQuestionBrowserFixture({runtimeReceipt:receipt,suffix});await fixture.start();console.log('Synthetic Tanya fixture '+fixture.origin+'/__fixture');process.once('SIGINT',fixture.stop);process.once('SIGTERM',fixture.stop);
}
