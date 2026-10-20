// UJI LOKAL only: exact current public sources, synthetic news/announcement data.
// No production transport or artifact-derived configuration is loaded.
// Importing this module does not construct or start a server.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer, publicRoot} from '../server.mjs';

const workspace=path.resolve(publicRoot,'..');
const reportPath=path.join(workspace,'analysis/webapp/news-fixture-transport.json');
const hash=value=>createHash('sha256').update(value).digest('hex');
const sourceFiles=['app.js','styles.css','index.html','server.mjs','domain.js','gnss.js','coordinate-comparison.js','parcel-map.js',
  'private/api-client.mjs','private/news-response.mjs','private/operations.mjs','private/operations-runtime.mjs',
  'private/http-api.mjs','private/session.mjs','private/https-transport.mjs','tests/news-browser-fixture.mjs'];
async function sourceHashes(){
  return Object.fromEntries(await Promise.all(sourceFiles.map(async name=>[name,hash(await readFile(path.join(publicRoot,name)))])));
}
const article=index=>`https://localhost:4175/#/uji-artikel-${index}`;
const baseRow=(prefix,index)=>({id:`fixture-${prefix}-${index+1}`,title:`UJI ${prefix.toUpperCase()} ${String(index+1).padStart(2,'0')}`,category:'KATEGORI UJI TIDAK DITAMPILKAN',banner:null,url:article(`${prefix}-${index+1}`)});
const news=Array.from({length:10},(_,index)=>baseRow('berita',index));
Object.assign(news[0],{title:'UJI BERITA 01 <img src=x onerror=alert("UJI")> & "teks"'});
Object.assign(news[1],{url:'javascript:alert("UJI")',banner:'javascript:alert("BANNER UJI")'});
Object.assign(news[2],{url:'data:text/html,<script>UJI</script>',banner:'data:image/svg+xml,<svg></svg>'});
Object.assign(news[3],{url:null,banner:null});
Object.assign(news[4],{url:'http://localhost:4175/#/uji-http',banner:'https://'});
Object.assign(news[5],{url:'https://fixture:fixture@localhost:4175/#/uji-credentials',banner:''});
Object.assign(news[6],{url:'https://localhost:4175/uji\nartikel'});
news[7]={id:null,title:null,category:null,banner:null,url:null};
news[8].title='UJI BERITA 09 — DI LUAR LIMIT DELAPAN';
news[9].title='UJI BERITA 10 — ITEM TERAKHIR';
const announcements=Array.from({length:7},(_,index)=>baseRow('pengumuman',index));
Object.assign(announcements[0],{title:'UJI PENGUMUMAN 01 <script>INERT UJI</script>',banner:'javascript:void(0)'});
Object.assign(announcements[1],{url:'data:text/html,UJI',banner:'https://'});
Object.assign(announcements[2],{url:'javascript:void(0)',banner:null});
announcements[3]={}; // Native missing String? fields become null in backend.
Object.assign(announcements[4],{title:null,url:null});
announcements[5].title='UJI PENGUMUMAN 06 — DI LUAR LIMIT LIMA';
announcements[6].title='UJI PENGUMUMAN 07 — ITEM TERAKHIR';

export async function verifyNewsFixtureSource(){
  const report=JSON.parse(await readFile(reportPath,'utf8'));
  const end=await sourceHashes();
  const changed=sourceFiles.filter(name=>report.sourceHashesAtStart?.[name]!==end[name]);
  report.sourceHashesAtEnd=end;
  report.sourceUnchanged=changed.length===0;
  report.changedSourceFiles=changed;
  report.sourceVerifiedAt=new Date().toISOString();
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  return {sourceUnchanged:report.sourceUnchanged,changedSourceFiles:changed};
}

export async function createNewsFixtureServer(){
  const start=await sourceHashes();
  const requests=[],assertions=[];
  const counts={news:0,announcements:0,rejectedRoute:0};
  let writes=Promise.resolve(),ending=null;
  const report=()=>({fixtureOnly:true,productionNetworkRequests:0,articleFetches:0,bannerFetches:0,
    publicSourceMode:'Current publicRoot served without injected files or edits',
    sourceHashesAtStart:start,sourceHashesAtEnd:ending?.hashes??null,sourceUnchanged:ending?.unchanged??null,
    changedSourceFiles:ending?.changed??[],requests:[...requests],callCounts:{...counts},assertions:[...assertions],
    fixtureCoverage:{newsRows:10,announcementRows:7,nativeLimits:{news:8,announcements:5},firstNews503:true,announcementErrorTrueWithList:true,
      titleEscaping:true,nullableFields:true,missingFields:true,unsupportedURLs:['javascript','data','http','credentials','control-character','null'],
      remoteImages:false,articleLinks:'HTTPS localhost stubs for attribute inspection only; no article contents or HTTPS server provided'},
    expectedBrowser:{newsCards:10,announcementCards:7,newsEnabledLinks:3,newsDisabledCards:7,announcementEnabledLinks:3,announcementDisabledCards:4,newsImages:0,announcementImages:0}});
  const persist=()=>{
    const snapshot=JSON.stringify(report(),null,2)+'\n';
    writes=writes.then(()=>writeFile(reportPath,snapshot));return writes;
  };
  const check=(id,pass)=>{assertions.push({id,pass:Boolean(pass)});if(!pass)throw new Error(`Synthetic news fixture assertion: ${id}`)};
  const configuration=Object.freeze({configured:true,reason:'UJI LOKAL — DATA SINTETIS — TANPA KONEKSI ATR/BPN.',
    applicationAuthorization:()=> 'AtrBpn synthetic-news-fixture-only'});
  const server=createServer(publicRoot,{configuration,publicOrigin:'',log:()=>{},transport:async(url,init)=>{
    const request={method:init.method,path:url.pathname,status:500};requests.push(request);
    try{
      check('fixed-main-origin',url.origin==='https://sentuh.atrbpn.go.id');
      check('get-with-no-body',init.method==='GET'&&init.body===undefined);
      check('anonymous-no-authorization',new Headers(init.headers).get('authorization')===null);
      check('native-main-get-content-type',new Headers(init.headers).get('content-type')==='application/x-www-form-urlencoded');
      check('json-accept',new Headers(init.headers).get('accept')==='application/json');
      let response;
      if(url.pathname==='/Berita/GetBerita'){
        counts.news++;
        check('news-limit-only',url.search==='?limit=8'&&url.hash==='');
        response=counts.news===1?Response.json({message:'UJI LOKAL sementara tidak tersedia'},{status:503}):Response.json({error:false,message:news});
      }else if(url.pathname==='/Pengumuman/GetPengumuman'){
        counts.announcements++;
        check('announcement-limit-only',url.search==='?limit=5'&&url.hash==='');
        response=Response.json({error:true,message:announcements,data:[{ignored:'UJI envelope extra'}]});
      }else{counts.rejectedRoute++;check('news-or-announcement-route-only',false)}
      request.status=response.status;return response;
    }finally{await persist()}
  }});
  server.prependListener('request',(_req,res)=>res.setHeader('X-Local-Fixture','synthetic-news-only-no-production'));
  const verify=async()=>{
    const hashes=await sourceHashes();const changed=sourceFiles.filter(name=>start[name]!==hashes[name]);
    ending={hashes,changed,unchanged:changed.length===0};await persist();return {sourceUnchanged:ending.unchanged,changedSourceFiles:changed};
  };
  await mkdir(path.dirname(reportPath),{recursive:true});await persist();
  return {server,report,persist,verify};
}

async function main(){
  if(process.argv.includes('--verify')){console.log(JSON.stringify(await verifyNewsFixtureSource()));return}
  const fixture=await createNewsFixtureServer();
  fixture.server.on('error',()=>{console.error('Synthetic news fixture could not start.');process.exitCode=1});
  fixture.server.listen(4175,'127.0.0.1',()=>console.log('UJI LOKAL http://localhost:4175/#/dashboard — synthetic news only, no production transport'));
  const stop=async()=>{fixture.server.closeAllConnections();await new Promise(resolve=>fixture.server.close(resolve));await fixture.verify()};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
