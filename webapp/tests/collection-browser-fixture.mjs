// Full application UI with in-process synthetic transport. No provider/account traffic.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer,publicRoot} from '../server.mjs';

const receipt=new URL('../../analysis/webapp/collection-browser-transport.json',import.meta.url);
const calls=[];let collectionLoads=0;
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),calls,collectionLoads,productionRequests:0,providerRequests:0,syntheticOnly:true},null,2)+'\n');
const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'KOLEKSI: FIXTURE SINTETIS',applicationAuthorization:()=> 'AtrBpn fixture-only'};
const berkas=(index,extra={})=>({id:`fixture-collection-${index}`,type:'BERKAS',contentId:`fixture-berkas-${index}:fixture-office`,createdAt:'2026-10-19T08:09:00',email:'not-a-card@example.invalid',title:`Berkas Sintetis ${String(index).padStart(2,'0')}`,subTitle:`Subjudul berkas ${index}`,groupId:'fixture-group',...extra});
const rows=[
  {id:'fixture-collection-parcel',type:'PERSIL',contentId:'fixture-parcel-complete: A +% é',title:'Bidang Sintetis',subTitle:'Aksi peta tetap tersedia'},
  berkas(1,{title:null,subTitle:null}),
  berkas(2,{title:'Berkas <b>tetap teks</b>',subTitle:'Subjudul <img src=x onerror=alert(1)>',createdAt:'tanggal sumber sintetis'}),
  ...Array.from({length:21},(_,index)=>berkas(index+3)),
];
const server=createServer(publicRoot,{configuration,publicOrigin:'',log:()=>{},transport:async(url,init)=>{
  calls.push({method:init.method,path:url.pathname,fieldNames:init.body instanceof URLSearchParams?[...init.body.keys()]:typeof init.body==='string'?[...new URLSearchParams(init.body).keys()]:[]});persist();
  if(url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'penguji-koleksi-sintetis',token:{tokenType:'Bearer',accessToken:'fixture-user-only',expiredAt:4e9}}});
  if(url.pathname==='/account/account_summary')return Response.json({error:false,data:{username:'penguji-koleksi-sintetis',nama:'Penguji Koleksi Sintetis',userLevel:2,isIkd:false}});
  if(url.pathname==='/Berita/GetBerita')return Response.json({error:false,data:[]});
  if(url.pathname==='/collection/GetUserCollection'){
    assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);
    collectionLoads++;persist();
    if(collectionLoads===2)return Response.json({error:true,message:'Gangguan Koleksi sintetis'},{status:503});
    return Response.json({error:false,data:collectionLoads===3?[]:rows});
  }
  if(url.pathname==='/berkas/CariBerkas'){
    const values=new URLSearchParams(init.body);
    assert.equal(init.method,'POST');assert.equal(values.get('berkasId'),'fixture-berkas-2');
    return Response.json({error:false,data:{berkasId:'fixture-response-id-never-select',nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'Detail Berkas Sintetis',biaya:0,parapihak:[],perjalananBerkas:[],kantor:null}});
  }
  if(url.pathname==='/berkas/berkassop'){
    assert.equal(new URLSearchParams(init.body).get('berkasid'),'fixture-berkas-2');
    return Response.json({error:false,data:{lewatTenggat:false,tanggalTenggat:null,berkasDibuat:null,berkasSelesai:null,tipeProduk:'Rutin'}});
  }
  if(url.pathname==='/berkas/getStatusCetak'){
    assert.equal(new URLSearchParams(init.body).get('berkasid'),'fixture-berkas-2');
    return Response.json({error:false,message:'Status Cetak Sintetis'});
  }
  // Opening a map is deliberately outside this fixture. Map rendering already has
  // dedicated local-PNG browser coverage; reject unexpected map/provider reads.
  throw Error('Unexpected synthetic collection route');
}});
server.listen(4179,'127.0.0.1',()=>{persist();console.log('Synthetic collection fixture: http://127.0.0.1:4179/#/collections');});
const stop=()=>{persist();server.closeAllConnections();server.close();};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
