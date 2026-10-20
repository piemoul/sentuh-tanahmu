// Full application and packaged Leaflet; synthetic API responses and local PNGs only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {createServer,publicRoot} from '../server.mjs';
const receipt=new URL('../../analysis/webapp/collection-groups-browser-transport.json',import.meta.url);
const calls=[],tiles=[];let mode='ready',rowLoads=0,groupLoads=0,caseGroupLoads=0;
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),mode,calls,tiles,rowLoads,groupLoads,productionRequests:0,providerRequests:0,allMapTilesLocal:true},null,2)+'\n');
const groups=[
  {collectionGroupId:'fixture-group-a',collectionGroupName:'Grup <b>tetap teks</b>'},
  {collectionGroupId:'fixture-group-b',collectionGroupName:null},
  {collectionGroupId:null,collectionGroupName:'Grup tanpa referensi'},
  {collectionGroupId:'',collectionGroupName:''},
  {collectionGroupId:'fixture-empty-group',collectionGroupName:'Grup kosong'},
];
const parcelId='fixture-parcel: A +% é';
const row=(type,id,title,groupId,extra={})=>({id:'fixture-collection-'+id,type,contentId:id,title,subTitle:'Subjudul sintetis',createdAt:'2026-10-19T08:09:00',email:'not-a-card@example.invalid',groupId,...extra});
const rows=[
  row('BERKAS','fixture-file:fixture-office','Berkas dalam grup','fixture-group-a'),
  row('PERSIL',parcelId,'Bidang utama','fixture-group-a'),
  row('PERSIL','fixture-parcel-second',null,'fixture-group-a',{subTitle:null,createdAt:'2026-10-19T08:09:00+07:00'}),
  row('PERSIL','fixture-null-parcel','Bidang tanpa grup',null),
  row('BERKAS','fixture-null-file:office','Berkas tanpa grup',null),
  row('PERSIL','fixture-empty-parcel','','',{subTitle:'',createdAt:''}),
  row('OTHER','fixture-unrecognized','Tipe lain dari sumber','fixture-group-a'),
  ...Array.from({length:21},(_,i)=>row('PERSIL','fixture-extra-'+i,'Bidang tambahan '+(i+1),'fixture-group-b')),
];
const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'KOLEKSI GRUP: SINTETIS',applicationAuthorization:()=> 'AtrBpn fixture-only'};
const server=createServer(publicRoot,{configuration,publicOrigin:'',log:()=>{},transport:async(url,init)=>{
  calls.push({method:init.method,path:url.pathname,mode});persist();
  if(url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'penguji-grup-sintetis',token:{tokenType:'Bearer',accessToken:'fixture-user-only',expiredAt:4e9}}});
  if(url.pathname==='/account/account_summary')return Response.json({error:false,data:{username:'penguji-grup-sintetis',nama:'Penguji Grup Sintetis',userLevel:2,isIkd:false}});
  if(url.pathname==='/Berita/GetBerita')return Response.json({error:false,data:[]});
  if(['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)){
    assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);
    if(url.pathname.endsWith('GetUserCollection')){rowLoads++;persist();return Response.json({error:true,message:'Valid native envelope',data:['empty','groups-only'].includes(mode)?[]:rows,unknownSecret:'DO-NOT-RETURN'});}
    groupLoads++;caseGroupLoads++;persist();
    if(mode==='http-error-once'&&caseGroupLoads===1)return Response.json({error:true,message:'Gangguan grup sintetis'},{status:503});
    if(mode==='malformed-once'&&caseGroupLoads===1)return Response.json({error:false,data:[{collectionGroupId:42,collectionGroupName:'MODEL-RUSAK-TIDAK-BOLEH-DITAMPILKAN'}]});
    return Response.json({error:true,data:['empty','no-groups'].includes(mode)?[]:groups});
  }
  if(url.pathname==='/legacy/GetParcelBoundaryById'){
    assert.equal(init.method,'GET');assert.equal(url.searchParams.get('persilid'),parcelId);
    return Response.json({type:'FeatureCollection',features:[{type:'Feature',properties:{NIB:'BIDANG SINTETIS',LUAS:100,TIPEHAK:'Hak Uji'},geometry:{type:'Polygon',coordinates:[[[106,-6],[106.00016,-6],[106.00016,-5.99984],[106,-5.99984],[106,-6]]]}}]});
  }
  if(url.pathname==='/berkas/CariBerkas'){
    assert.equal(new URLSearchParams(init.body).get('berkasId'),'fixture-file');
    return Response.json({error:false,data:{berkasId:'fixture-response-not-source',nomor:42,tahun:2026,statusBerkas:1,namaProsedur:'Detail Berkas Grup Sintetis',parapihak:[],perjalananBerkas:[],kantor:null}});
  }
  if(url.pathname==='/berkas/berkassop'){
    assert.equal(new URLSearchParams(init.body).get('berkasid'),'fixture-file');
    return Response.json({error:false,data:{lewatTenggat:false,tipeProduk:'Rutin'}});
  }
  if(url.pathname==='/berkas/getStatusCetak'){
    assert.equal(new URLSearchParams(init.body).get('berkasid'),'fixture-file');
    return Response.json({error:false,message:'Status Cetak Grup Sintetis'});
  }
  throw Error('Unexpected synthetic group route');
}});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(name,bytes){const type=Buffer.from(name),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([type,bytes])));return Buffer.concat([size,type,bytes,crc]);}
function png(overlay){const header=Buffer.alloc(13);header.writeUInt32BE(256,0);header.writeUInt32BE(256,4);header[8]=8;header[9]=6;const pixels=Buffer.alloc(256*(1+256*4));for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=y*(1+256*4)+1+x*4,line=x%64<2||y%64<2;pixels[i]=overlay?160:214;pixels[i+1]=overlay?50:225;pixels[i+2]=overlay?85:212;pixels[i+3]=overlay?(line?220:0):255;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);}
const basePng=png(false),overlayPng=png(true);
const original=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4180');
  if(req.headers.host!=='127.0.0.1:4180'){res.writeHead(403);res.end('Fixture host rejected');return;}
  const setHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>setHeader(name,name.toLowerCase()==='content-security-policy'?String(value).replace(' https://tile.openstreetmap.org',''):value);
  if(url.pathname==='/'){
    const next=url.searchParams.get('case')||'ready';
    if(!['ready','empty','groups-only','no-groups','http-error-once','malformed-once'].includes(next)){res.writeHead(400);res.end('Unknown fixture case');return;}
    mode=next;caseGroupLoads=0;persist();
  }
  if(url.pathname==='/assets/maps/official-map.js'){
    const source=fs.readFileSync(new URL('../assets/maps/official-map.js',import.meta.url),'utf8');
    assert.equal(source.split('https://tile.openstreetmap.org/{z}/{x}/{y}.png').length,2);
    res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
    res.end(source.replace('https://tile.openstreetmap.org/{z}/{x}/{y}.png','/fixture/osm/{z}/{x}/{y}.png'));return;
  }
  if(/^\/(?:fixture\/osm|api\/maps\/bhumi)\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){
    const overlay=url.pathname.startsWith('/api/');tiles.push({layer:overlay?'bhumi':'osm',mode});persist();
    res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(overlay?overlayPng:basePng);return;
  }
  original(req,res);
});
server.listen(4180,'127.0.0.1',()=>{persist();console.log('Synthetic group UI: http://127.0.0.1:4180/#/collections');});
const stop=()=>{persist();server.closeAllConnections();server.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
