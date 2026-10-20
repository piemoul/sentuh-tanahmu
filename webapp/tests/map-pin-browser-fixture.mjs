// Actual packaged Leaflet and application controller; every tile is local PNG.
// The injected test wrapper rewrites only the fixed OSM template before Leaflet.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const receipt=new URL('../../analysis/webapp/map-pin-browser-transport.json',import.meta.url);
const requests=[];let sequence=0,mode='ready',failOsm=false,failBhumi=false;
const snapshot=()=>({checkedAt:new Date().toISOString(),requests,requestCount:requests.length,osmTiles:requests.filter(row=>row.kind==='fixture-osm').length,bhumiTiles:requests.filter(row=>row.kind==='fixture-bhumi').length,failedTiles:requests.filter(row=>row.kind.startsWith('fixture-')&&row.kind!=='fixture-control'&&row.status===503).length,productionRequests:0,providerRequests:0,localTilesOnly:true,leafletVersion:'1.9.4'});
const persist=()=>fs.writeFileSync(receipt,JSON.stringify(snapshot(),null,2)+'\n');
const record=(req,pathname,status,kind)=>{
  let referer=null;try{const parsed=new URL(req.headers.referer);referer={origin:parsed.origin,path:parsed.pathname,hasQuery:!!parsed.search,originOnly:req.headers.referer===parsed.origin+'/'};}catch{}
  requests.push({sequence:++sequence,method:req.method,path:pathname,status,kind,mode,referer});persist();
};
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function pngChunk(name,bytes){const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([type,bytes])));return Buffer.concat([length,type,bytes,crc]);}
function fixturePng(overlay){
  const header=Buffer.alloc(13);header.writeUInt32BE(256,0);header.writeUInt32BE(256,4);header[8]=8;header[9]=6;
  const pixels=Buffer.alloc(256*(1+256*4));
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const offset=y*(1+256*4)+1+x*4,line=x%64<2||y%64<2;
    pixels[offset]=overlay?160:line?232:214;pixels[offset+1]=overlay?50:line?235:225;pixels[offset+2]=overlay?85:line?237:212;pixels[offset+3]=overlay?(line?220:0):255;
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',zlib.deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))]);
}
const basePng=fixturePng(false),overlayPng=fixturePng(true);
const geometry={type:'FeatureCollection',features:[{type:'Feature',properties:{NIB:'Bidang sintetis <b>tetap teks</b>',LUAS:100,secret:'DO-NOT-RENDER-UNKNOWN-METADATA'},geometry:{type:'Polygon',coordinates:[[[106,-6],[106.00016,-6],[106.00016,-5.99984],[106,-5.99984],[106,-6]],[[106.00004,-5.99996],[106.00008,-5.99996],[106.00008,-5.99992],[106.00004,-5.99992],[106.00004,-5.99996]]]}}]};
const browserScript=`
import {startOfficialMaps} from '/assets/maps/official-map.js';
const mode=new URL(location.href).searchParams.get('mode')||'ready';
const metrics={mode,leafletVersion:window.L.version,configLoads:0,libraryLoads:0,mapsCreated:0,mapsReleased:0,osmLoads:0,bhumiLoads:0,osmErrors:0,bhumiErrors:0,zoom:null,center:null,activeLayers:0,markerCount:0,markerPosition:null,mapBounds:null};
const output=document.querySelector('#fixture-metrics'),host=document.querySelector('#maps'),dialog=document.querySelector('#fixture-dialog'),dialogHost=document.querySelector('#dialog-map');
const publish=()=>{output.textContent=JSON.stringify(metrics,null,2);};
const config={provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'};
const leaflet=window.L;
const wrapper={...leaflet,
  map(container,options){
    const map=leaflet.map(container,options);metrics.mapsCreated++;
    const update=()=>{if(Number.isFinite(map.getZoom())){metrics.zoom=map.getZoom();const center=map.getCenter();metrics.center={lat:center.lat,lng:center.lng};const bounds=map.getBounds();metrics.mapBounds=[[bounds.getSouth(),bounds.getWest()],[bounds.getNorth(),bounds.getEast()]];}let count=0,markers=0;map.eachLayer(layer=>{count++;if(layer instanceof leaflet.Marker){markers++;const point=layer.getLatLng();metrics.markerPosition={lat:point.lat,lng:point.lng};}});metrics.activeLayers=count;metrics.markerCount=markers;publish();};
    map.on('zoomend moveend layeradd layerremove',update);map.on('unload',()=>{metrics.mapsReleased++;publish();});publish();return map;
  },
  tileLayer(url,options){
    const base=url==='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    if(!base&&url!=='/api/maps/bhumi/{z}/{x}/{y}.png')throw Error('Fixture rejected unexpected tile audience');
    const layer=leaflet.tileLayer(base?'/fixture/osm/{z}/{x}/{y}.png':url,options);
    layer.on('tileload',()=>{metrics[base?'osmLoads':'bhumiLoads']++;publish();});
    layer.on('tileerror',()=>{metrics[base?'osmErrors':'bhumiErrors']++;publish();});return layer;
  }
};
const manager=startOfficialMaps(document,{
  configLoader(){metrics.configLoads++;publish();if(mode==='config-error')throw Error('Synthetic private configuration error');return config;},
  libraryLoader(){metrics.libraryLoads++;publish();if(mode==='sdk-error')throw Error('Synthetic private local-library error');return wrapper;}
});
// The injected manager owns the document before the renderer's autostart runs.
const {parcelMapView,updateParcelMap}=await import('/parcel-map.js');
const fixtureGeometry=${JSON.stringify(geometry)};if(mode==='large')fixtureGeometry.features[0].geometry.coordinates=[[[106,-6],[106.2,-6],[106.2,-5.8],[106,-5.8],[106,-6]]];const card=parcelMapView(fixtureGeometry);host.innerHTML=card;publish();
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.action==='parcel-map')updateParcelMap(button);
  if(button.id==='remove-map'){host.replaceChildren();document.querySelector('#fixture-status').textContent='Peta dilepas';}
  if(button.id==='restore-map'){host.innerHTML=card;document.querySelector('#fixture-status').textContent='Peta dipulihkan';}
  if(button.id==='open-dialog'){dialogHost.innerHTML=card;dialog.showModal();}
  if(button.id==='close-dialog')dialog.close();
  if(button.id==='fail-osm'||button.id==='fail-bhumi'){await fetch('/_fixture/'+button.id,{method:'POST'});host.innerHTML=card;document.querySelector('#fixture-status').textContent='Kegagalan tile lokal disimulasikan';}
  if(button.id==='logout'){host.replaceChildren();dialog.close();dialogHost.replaceChildren();document.querySelector('#fixture-status').textContent='DOM privat dikosongkan (sintetis)';}
  publish();
});
window.addEventListener('pagehide',()=>manager.destroy(),{once:true});
`;
const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture pin dan pusat bidang</title><link rel="stylesheet" href="/assets/vendor/leaflet/leaflet.css"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/fixture.css"></head><body><main><h1>Pin bidang · fixture sintetis</h1><p>Leaflet asli dengan PNG lokal. Tidak ada koneksi OSM, Google, BPN, atau akun asli.</p><nav><a href="/?mode=ready">Siap sintetis</a> · <a href="/?mode=large">Bidang luas</a> · <a href="/?mode=osm-error">OSM gagal</a> · <a href="/?mode=bhumi-error">Bhumi gagal</a> · <a href="/?mode=config-error">Konfigurasi gagal</a> · <a href="/?mode=sdk-error">Library gagal</a></nav><div id="maps"></div><section class="panel fixture-actions"><button id="remove-map" class="button secondary">Lepas peta</button><button id="restore-map" class="button secondary">Pulihkan peta</button><button id="open-dialog" class="button secondary">Buka dialog peta</button><button id="fail-osm" class="button secondary">Simulasikan OSM gagal</button><button id="fail-bhumi" class="button secondary">Simulasikan Bhumi gagal</button><button id="logout" class="button secondary">Simulasikan logout</button><p id="fixture-status" role="status"></p><pre id="fixture-metrics"></pre></section><dialog id="fixture-dialog"><button id="close-dialog" class="button secondary">Tutup dialog</button><div id="dialog-map"></div></dialog></main><script src="/assets/vendor/leaflet/leaflet.js"></script><script type="module" src="/fixture.mjs"></script></body></html>`;
const css='body{padding:20px;max-width:1040px;margin:auto}nav{margin:16px 0}.fixture-actions{display:flex;gap:8px;flex-wrap:wrap}.fixture-actions p,.fixture-actions pre{flex-basis:100%}.fixture-actions pre{white-space:pre-wrap;overflow-wrap:anywhere}dialog{max-width:min(90vw,900px);max-height:90vh;overflow:auto}';
const allowed=new Map([['/parcel-map.js','parcel-map.js'],['/assets/maps/official-map.js','assets/maps/official-map.js'],['/styles.css','styles.css'],['/assets/fonts/Roboto-Regular.ttf','assets/fonts/Roboto-Regular.ttf'],['/assets/fonts/Roboto-bold.ttf','assets/fonts/Roboto-bold.ttf']]);
for(const file of ['leaflet.js','leaflet.css','LICENSE','images/layers.png','images/layers-2x.png','images/marker-icon.png','images/marker-icon-2x.png','images/marker-shadow.png'])allowed.set('/assets/vendor/leaflet/'+file,'assets/vendor/leaflet/'+file);
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4178');
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'");res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  const send=(status,type,body,kind='fixture-static')=>{record(req,url.pathname,status,kind);res.writeHead(status,{'Content-Type':type});res.end(body);};
  if(url.pathname==='/_fixture/fail-osm'&&req.method==='POST'){failOsm=true;send(204,'text/plain','','fixture-control');return;}
  if(url.pathname==='/_fixture/fail-bhumi'&&req.method==='POST'){failBhumi=true;send(204,'text/plain','','fixture-control');return;}
  if(url.pathname==='/_fixture/receipt'){send(200,'application/json',JSON.stringify(snapshot()),'fixture-receipt');return;}
  if(/^\/fixture\/osm\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){send(failOsm?503:200,failOsm?'text/plain':'image/png',failOsm?'Synthetic tile failure':basePng,'fixture-osm');return;}
  if(/^\/api\/maps\/bhumi\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){send(failBhumi?503:200,failBhumi?'text/plain':'image/png',failBhumi?'Synthetic tile failure':overlayPng,'fixture-bhumi');return;}
  if(url.pathname==='/'){mode=url.searchParams.get('mode')||'ready';failOsm=mode==='osm-error';failBhumi=mode==='bhumi-error';send(200,'text/html; charset=utf-8',html);return;}
  if(url.pathname==='/fixture.mjs'){send(200,'text/javascript',browserScript);return;}
  if(url.pathname==='/fixture.css'){send(200,'text/css',css);return;}
  const relative=allowed.get(url.pathname);
  if(relative){const mime={'.css':'text/css','.js':'text/javascript','.png':'image/png','.ttf':'font/ttf'}[path.extname(relative)]||'text/plain';send(200,mime,fs.readFileSync(path.join(root,relative)));return;}
  if(url.pathname==='/favicon.ico'){send(204,'image/x-icon','');return;}
  send(404,'text/plain','Fixture route unavailable','fixture-rejected');
});
server.listen(4178,'127.0.0.1',()=>{persist();console.log('Synthetic OSM+Bhumi QA: http://127.0.0.1:4178/');});
const stop=()=>{persist();server.closeAllConnections();server.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
