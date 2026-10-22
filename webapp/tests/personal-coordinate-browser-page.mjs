import {createSwaplottingHost} from '/assets/swaplotting/host.js';
import {createSwaplottingPhotoCapture} from '/assets/swaplotting/capture-dialog.js';
const main=document.getElementById('main'),box=document.getElementById('fixture-controls'),statusNode=document.getElementById('fixture-status');
const resizeButton=document.createElement('button');resizeButton.dataset.fixtureAction='resize';resizeButton.textContent='Ubah lebar peta uji';box.append(resizeButton);
const freshPoints=()=>[{id:'SYNTHETIC-GNSS',name:'GNSS SINTETIS <img src=x onerror=alert(1)>',latitude:-6.123456789,longitude:106.234567891,source:'external_gnss',accuracy:0.25,measuredAt:'2026-01-02T03:04:05Z',crs:'EPSG:4326',original:{latitude:'-6.123456789',longitude:'106.234567891'},warnings:[],note:'DATA UJI, bukan pengukuran nyata'},{id:'SYNTHETIC-SURVEY',name:'Patok hasil ukur SINTETIS',latitude:-0,longitude:180,source:'survey',accuracy:null,measuredAt:null,crs:'EPSG:4326',original:{latitude:'-0',longitude:'180'},warnings:[],note:'DATA SINTETIS'},{id:'SYNTHETIC-DEVICE',name:'Bukan kandidat ukur',latitude:-6,longitude:106,source:'browser',crs:'EPSG:4326',original:{latitude:'-6',longitude:'106'}}];
let points=freshPoints(),host=null,epoch=0,disclaimerMode='ready',pending=[],stopping=false,last='';
const streams=[],managers=[],reads=[];let cameraCalls=0;
const encoded=(_key,value)=>typeof value==='number'&&Object.is(value,-0)?'NEGATIVE_ZERO':value;
function snapshot(){const model=host?.controller.snapshot();return {epoch,form:model?.screen??'closed',cameraTarget:model?.cameraTarget??null,point:model?.point??null,targetProvenance:model?.targetProvenance??null,pointProvenance:model?.pointProvenance??null,coordinateDraft:model?.coordinateDraft??null,coordinateError:model?.coordinateError??null,photos:model?.photos?.length??0,pendingDisclaimer:pending.length,sourcePointCount:points.length,reads,cameraCalls,hardwareCameraCalls:0,liveVideoTracks:streams.flatMap(stream=>stream.getVideoTracks()).filter(track=>track.readyState==='live').length,captureOpen:managers.some(manager=>manager.snapshot().open),closed:host===null};}
async function status(){if(stopping)return;const value=snapshot(),text=JSON.stringify(value,encoded,2);statusNode.textContent=text;if(text===last)return;last=text;await fetch('/fixture/report',{method:'POST',headers:{'Content-Type':'application/json'},body:text}).catch(()=>{});}
const office={KantorId:'SYNTHETIC-OFFICE',Nama:'Kantor SINTETIS',Alamat:null,Email:null,Fax:null,Telp:null,Kota:null,TipeKantorId:3};
const disclaimer=()=>({message:disclaimerMode==='show'?'Informasi SINTETIS untuk uji fokus, bukan persetujuan layanan nyata.':null,message2:null,message3:null,url:null});
async function read(kind,values){reads.push({kind,values});status();if(kind==='disclaimer')return disclaimerMode==='deferred'?new Promise(resolve=>pending.push(()=>resolve(disclaimer()))):disclaimer();if(kind==='offices')return[office];if(kind==='regions')return[{Kode:'SYNTHETIC-CODE',Nama:'Desa SINTETIS',TipeWilayah:'Desa',WilayahId:'SYNTHETIC-REGION'}];throw Error('No other read allowed');}
const mediaDevices={async getUserMedia(constraints){cameraCalls++;if(constraints.audio!==false||constraints.video?.facingMode?.ideal!=='environment')throw Error('Unexpected synthetic constraints');const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#f1f5ed';ctx.fillRect(0,0,640,480);ctx.strokeStyle='#335f4a';ctx.lineWidth=4;ctx.strokeRect(30,30,580,420);ctx.fillStyle='#183e2c';ctx.font='bold 26px sans-serif';ctx.fillText('DOKUMEN SINTETIS',58,100);ctx.font='20px sans-serif';ctx.fillText('Bukan kamera atau dokumen asli',58,150);const stream=canvas.captureStream(5);streams.push(stream);status();return stream;}};
function close(){epoch++;host?.dispose();host=null;main.replaceChildren();status();}
function open(){close();const ownEpoch=epoch;host=createSwaplottingHost({document,read,profile:()=>({userLevel:2,isIkd:false,nama:'Pemohon SINTETIS',nomorHp:'0000000000',email:'synthetic@example.invalid'}),getCoordinatePoints:()=>points,isCurrent:()=>epoch===ownEpoch,photoCaptureFactory:options=>{const manager=createSwaplottingPhotoCapture({...options,mediaDevices});managers.push(manager);return manager;}});main.innerHTML=host.html();host.attach();status();}
box.addEventListener('click',async event=>{
 const action=event.target.closest('[data-fixture-action]')?.dataset.fixtureAction;
 if(action==='new')open();else if(action==='release-map')await fetch('/fixture/release-map',{method:'POST'});
 else if(action==='release-disclaimer'){for(const resolve of pending.splice(0))resolve();}
 else if(action==='mutate-point'&&points[0])points[0].longitude+=0.00001;
 else if(action==='remove-points')points=[];
 else if(action==='duplicate-point'&&points[0])points.push({...points[0]});
 else if(action==='reset-points')points=freshPoints();
 else if(action==='resize')main.style.maxWidth=main.style.maxWidth==='640px'?'1100px':'640px';
 else if(action==='close')close();
 else if(action==='stop'){close();for(const resolve of pending.splice(0))resolve();for(const stream of streams)stream.getTracks().forEach(track=>track.stop());await status();stopping=true;clearInterval(ticker);await fetch('/fixture/stop',{method:'POST'});statusNode.textContent=JSON.stringify({...snapshot(),stopped:true},encoded,2);return;}
 await status();
});
document.getElementById('fixture-map-mode').addEventListener('change',async event=>{await fetch('/fixture/map-mode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:event.target.value})});status();});
document.getElementById('fixture-disclaimer-mode').addEventListener('change',event=>{disclaimerMode=event.target.value;status();});
const ticker=setInterval(status,160);
addEventListener('pagehide',()=>{clearInterval(ticker);close();for(const resolve of pending.splice(0))resolve();for(const stream of streams)stream.getTracks().forEach(track=>track.stop());});
open();
