// Isolated component QA. Google is a DOM double; PNG tiles are generated here.
// This server has no outgoing HTTP client and no credentials or account data.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const receipt=new URL('../../analysis/webapp/official-map-browser-transport.json',import.meta.url);
const requests=[];let sequence=0,failedTiles=false;
const snapshot=()=>({checkedAt:new Date().toISOString(),requests,requestCount:requests.length,tileRequests:requests.filter(row=>row.kind==='fixture-tile').length,failedTiles:requests.filter(row=>row.kind==='fixture-tile'&&row.status!==200).length,productionRequests:0,providerRequests:0,localTilesOnly:true});
const persist=()=>fs.writeFileSync(receipt,JSON.stringify(snapshot(),null,2)+'\n');
const record=(method,pathname,status,kind)=>{requests.push({sequence:++sequence,method,path:pathname,status,kind});persist();};
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function pngChunk(name,bytes){const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([type,bytes])));return Buffer.concat([length,type,bytes,crc]);}
function fixturePng(){
  const header=Buffer.alloc(13);header.writeUInt32BE(256,0);header.writeUInt32BE(256,4);header[8]=8;header[9]=2;
  const pixels=Buffer.alloc(256*(1+256*3));
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const offset=y*(1+256*3)+1+x*3,line=x%64<2||y%64<2;
    pixels[offset]=line?60:218;pixels[offset+1]=line?104:231;pixels[offset+2]=line?115:234;
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',zlib.deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))]);
}
const png=fixturePng();
const geometry={type:'FeatureCollection',features:[{type:'Feature',properties:{NIB:'Bidang sintetis <b>tetap teks</b>',LUAS:100,secret:'DO-NOT-RENDER-UNKNOWN-METADATA'},geometry:{type:'Polygon',coordinates:[[[106,-6],[106.004,-6],[106.004,-5.997],[106,-5.997],[106,-6]],[[106.001,-5.999],[106.002,-5.999],[106.002,-5.998],[106.001,-5.998],[106.001,-5.999]]]}}]};
const browserScript=`
import {startOfficialMaps} from '/assets/maps/official-map.js';
const mode=new URL(location.href).searchParams.get('mode')||'ready';
const metrics={mode,configLoads:0,libraryLoads:0,mapsCreated:0,mapsReleased:0,overlays:0,zoom:null,center:null,lastPan:null,tileImagesLoaded:0,tileImagesFailed:0};
const output=document.querySelector('#fixture-metrics'),host=document.querySelector('#maps'),dialog=document.querySelector('#fixture-dialog'),dialogHost=document.querySelector('#dialog-map');
const publish=()=>{output.textContent=JSON.stringify(metrics,null,2);};
const config={provider:'google',mapType:'hybrid',apiKey:mode==='no-key'?null:'synthetic_browser_key_12345',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'};
class Collection{
  constructor(map){this.map=map;this.values=[];}
  getLength(){return this.values.length;}getAt(index){return this.values[index];}
  push(value){this.values.push(value);this.map.draw();}removeAt(index){const value=this.values.splice(index,1)[0];this.map.draw();return value;}
}
class FakeMap{
  constructor(canvas,options){this.canvas=canvas;this.options=options;this.center={...options.center};this.zoom=options.zoom;this.overlayMapTypes=new Collection(this);this.listeners=[];this.released=false;metrics.mapsCreated++;this.draw();}
  getZoom(){return this.zoom;}setZoom(value){this.zoom=value;this.draw();for(const listener of this.listeners)if(!listener.removed)listener.fn();}
  setCenter(value){this.center={...value};this.draw();}panBy(x,y){metrics.lastPan=[x,y];publish();}
  addListener(event,fn){const listener={event,fn,removed:false,remove(){this.removed=true;}};this.listeners.push(listener);return listener;}
  unbindAll(){if(this.released)return;this.released=true;metrics.mapsReleased++;publish();}
  draw(){
    if(this.released)return;this.canvas.replaceChildren();
    const label=document.createElement('p');label.className='fixture-map-label';label.textContent='API Google tiruan · '+this.options.mapTypeId+' · '+this.options.renderingType;this.canvas.append(label);
    const grid=document.createElement('div');grid.className='fixture-tile-grid';this.canvas.append(grid);
    const n=2**this.zoom,x=Math.floor((this.center.lng+180)/360*n),lat=this.center.lat*Math.PI/180,y=Math.floor((1-Math.log(Math.tan(lat)+1/Math.cos(lat))/Math.PI)/2*n);
    for(const overlay of this.overlayMapTypes.values)for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++){
      const url=overlay.options.getTileUrl({x:x+dx,y:y+dy},this.zoom);if(!url)continue;
      const image=document.createElement('img');image.alt='Tile Bhumi sintetis lokal';image.width=256;image.height=256;image.onload=()=>{metrics.tileImagesLoaded++;publish();};image.onerror=()=>{metrics.tileImagesFailed++;publish();};image.src=url;grid.append(image);
    }
    metrics.zoom=this.zoom;metrics.center=this.center;metrics.overlays=this.overlayMapTypes.values.length;publish();
  }
}
class ImageMapType{constructor(options){this.options=options;}unbindAll(){}}
class Size{constructor(width,height){this.width=width;this.height=height;}}
const google={maps:{Map:FakeMap,ImageMapType,Size,RenderingType:{RASTER:'RASTER'},event:{clearInstanceListeners(target){if(target.listeners)target.listeners.forEach(listener=>listener.removed=true);},trigger(){}}}};
window.google=google;
const manager=startOfficialMaps(document,{
  configLoader(){metrics.configLoads++;publish();if(mode==='config-error')throw Error('synthetic private failure must stay hidden');return config;},
  libraryLoader(){metrics.libraryLoads++;publish();if(mode==='sdk-error')throw Error('synthetic private SDK failure');return google;}
});
// Claim the manager with isolated loaders before parcel-map's automatic import.
const {parcelMapView,updateParcelMap}=await import('/parcel-map.js');
const card=parcelMapView(${JSON.stringify(geometry)});host.innerHTML=card;publish();
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.action==='parcel-map')updateParcelMap(button);
  if(button.id==='remove-map'){host.replaceChildren();document.querySelector('#fixture-status').textContent='Peta dilepas';}
  if(button.id==='restore-map'){host.innerHTML=card;document.querySelector('#fixture-status').textContent='Peta dipulihkan';}
  if(button.id==='open-dialog'){dialogHost.innerHTML=card;dialog.showModal();}
  if(button.id==='close-dialog')dialog.close();
  if(button.id==='auth-failure'){window.gm_authFailure?.();document.querySelector('#fixture-status').textContent='Kegagalan otorisasi Google disimulasikan';}
  if(button.id==='tile-failure'){await fetch('/_fixture/fail-tiles',{method:'POST'});host.innerHTML=card;document.querySelector('#fixture-status').textContent='HTTP503 tile lokal disimulasikan';}
  if(button.id==='logout'){host.replaceChildren();dialog.close();dialogHost.replaceChildren();document.querySelector('#fixture-status').textContent='DOM privat dikosongkan (sintetis)';}
  publish();
});
window.addEventListener('pagehide',()=>manager.destroy(),{once:true});
`;
const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture peta resmi sintetis</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/fixture.css"></head><body><main><h1>Peta resmi · fixture sintetis</h1><p>API Google ditiru untuk QA. PNG lokal; tidak ada koneksi Google, Bhumi, atau akun asli.</p><nav class="fixture-modes"><a href="/?mode=ready">Siap sintetis</a> · <a href="/?mode=no-key">Tanpa key</a> · <a href="/?mode=config-error">Konfigurasi gagal</a> · <a href="/?mode=sdk-error">SDK gagal</a></nav><div id="maps"></div><section class="panel fixture-actions"><button id="remove-map" class="button secondary">Lepas peta</button><button id="restore-map" class="button secondary">Pulihkan peta</button><button id="open-dialog" class="button secondary">Buka dialog peta</button><button id="auth-failure" class="button secondary">Simulasikan otorisasi gagal</button><button id="tile-failure" class="button secondary">Simulasikan tile gagal</button><button id="logout" class="button secondary">Simulasikan logout</button><p id="fixture-status" role="status"></p><pre id="fixture-metrics"></pre></section><dialog id="fixture-dialog"><button id="close-dialog" class="button secondary">Tutup dialog</button><div id="dialog-map"></div></dialog></main><script type="module" src="/fixture.mjs"></script></body></html>`;
const css='body{padding:20px;max-width:1040px;margin:auto}.fixture-modes{margin:16px 0}.fixture-actions{display:flex;gap:8px;flex-wrap:wrap}.fixture-actions p,.fixture-actions pre{flex-basis:100%}.fixture-actions pre{white-space:pre-wrap;overflow-wrap:anywhere}.fixture-map-label{margin:0;padding:12px;color:#fff;background:#203b46;font-size:13px}.fixture-tile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;height:calc(100% - 45px);overflow:hidden}.fixture-tile-grid img{width:100%;height:100%;min-height:0;object-fit:cover}dialog{max-width:min(90vw,900px);max-height:90vh;overflow:auto}';
const allowed=new Map([['/parcel-map.js','parcel-map.js'],['/assets/maps/official-map.js','assets/maps/official-map.js'],['/styles.css','styles.css']]);
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4177');
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'");
  const send=(status,type,body,kind='fixture-static')=>{record(req.method,url.pathname,status,kind);res.writeHead(status,{'Content-Type':type});res.end(body);};
  if(url.pathname==='/_fixture/fail-tiles'&&req.method==='POST'){failedTiles=true;send(204,'text/plain','','fixture-control');return;}
  if(url.pathname==='/_fixture/receipt'){send(200,'application/json',JSON.stringify(snapshot()),'fixture-receipt');return;}
  if(/^\/api\/maps\/bhumi\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){send(failedTiles?503:200,failedTiles?'text/plain':'image/png',failedTiles?'Synthetic tile failure':png,'fixture-tile');return;}
  if(url.pathname==='/'){send(200,'text/html; charset=utf-8',html);return;}
  if(url.pathname==='/fixture.mjs'){send(200,'text/javascript',browserScript);return;}
  if(url.pathname==='/fixture.css'){send(200,'text/css',css);return;}
  const relative=allowed.get(url.pathname);
  if(relative){send(200,relative.endsWith('.css')?'text/css':'text/javascript',fs.readFileSync(path.join(root,relative)));return;}
  if(url.pathname==='/favicon.ico'){send(204,'image/x-icon','');return;}
  send(404,'text/plain','Fixture route unavailable','fixture-rejected');
});
server.listen(4177,'127.0.0.1',()=>{persist();console.log('Synthetic official-map QA: http://127.0.0.1:4177/');});
const stop=()=>{persist();server.closeAllConnections();server.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
