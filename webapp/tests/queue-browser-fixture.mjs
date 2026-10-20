// Isolated numeric-host fixture. Every transport call is mocked in this process.
import fs from 'node:fs';
import {createServer,publicRoot} from '../server.mjs';
const calls=[];let listCount=0,notificationCount=0;
const receipt=new URL('../../analysis/webapp/queue-calls-browser-transport.json',import.meta.url);
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),syntheticCalls:calls,productionRequests:0,listResponses:listCount,notificationResponses:notificationCount},null,2)+'\n');
const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SYNTHETIC QUEUE FIXTURE ONLY',applicationAuthorization:()=> 'AtrBpn fixture-only',queueAuthorization:()=> 'Bearer queue-fixture-only'};
const row=(id,nomor)=>({id,nomor,lokasi:'Lokasi Uji Sintetis',loket:'Loket Uji',pemohon:'Pemohon Sintetis',tanggal_antrian:'2026-10-19',estimasi_message:'Estimasi dari fixture',kode_booking:[]});
const server=createServer(publicRoot,{configuration,publicOrigin:'',log:()=>{},queueSleep:async()=>{},transport:async(url,init)=>{
 calls.push({host:url.hostname,path:url.pathname.replace(/(api\/antrian\/)(?!saya\/?$).+$/,'$1:id'),method:init.method});
 persist();
 if(url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'penguji-sintetis',token:{tokenType:'Bearer',accessToken:'fixture-user-only',expiredAt:4e9}}});
 if(url.pathname==='/account/account_summary')return Response.json({error:false,data:{username:'penguji-sintetis',nama:'Penguji Sintetis',userLevel:2,isIkd:false,nomorIdentitas:'fixture-profile-only'}});
 if(url.pathname.endsWith('/api/antrian/saya')||url.pathname.endsWith('/api/notifikasi'))return new Response(null,{status:308,headers:{Location:url.pathname+'/'+url.search}});
 if(url.pathname.endsWith('/api/antrian/saya/')){
  listCount++;
  persist();
  if(listCount===2)return Response.json({error:true,data:[]});
  if(listCount===3)return Response.json({error:false,data:[]});
  return Response.json({error:false,data:[row('fixture:queue-1','A-17'),row('fixture:queue-2','B-08')]});
 }
 if(url.pathname.endsWith('/api/notifikasi/')){
  notificationCount++;persist();
  if(notificationCount===2)return Response.json({data:[{id:'invalid-fixture-row'}]});
  if(notificationCount===3)return Response.json({data:[]});
  const item=(id,pesan,tanggal_dikirim)=>({id,tipe:'fixture',pengirim:'Loket Sintetis',penerima:'Penerima Sintetis',pesan,tanggal_dikirim});
  return Response.json({error:true,message:{ignored:true},data:[item('old','Pesan lebih awal','2026-10-19T09:10:11.123455+07:00'),item('new','Pesan terbaru <b>tetap teks</b>','2026-10-19T09:10:11.123456+07:00'),item('local','Pesan waktu lokal','2000-01-02T03:04:05.000001')]});
 }
 if(url.pathname.includes('/api/antrian/'))return new Response('{"error":false,"data":{"id":"fixture:queue-1","nomor":"A-17","nama":"Kelompok Loket Sintetis","tanggal_antrian":"2026-10-19","jumlah_berkas":2,"booking":[{"kode":"BK-SINTETIS"},{"kode":9007199254740993}],"kantor":{"nama":"Kantor Pertanahan Sintetis"},"lokasi":{"nama":"Lokasi Uji Sintetis"},"pemohon":{"nama":"Pemohon Sintetis","token":"NEVER-PUBLISH-APPLICANT-TOKEN"}}}',{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/activity/GetUserActivity')return Response.json({data:[{activityType:'AntrianOnline',title:'Antrian Sintetis dari Aktivitas',subTitle:'Buka detail antrean',contentId:'fixture:activity-id',createdAt:'2026-10-19'}]});
 throw Error('Unexpected fixture route');
}});
server.listen(4175,'127.0.0.1',()=>console.log('Synthetic queue fixture: http://127.0.0.1:4175/#/queue'));
const stop=()=>{persist();server.closeAllConnections();server.close();};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
