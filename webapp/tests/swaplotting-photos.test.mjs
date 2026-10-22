import test from 'node:test';
import assert from 'node:assert/strict';
import {swaplottingPhotoPath,swaplottingValidate,swaplottingEmptyFields} from '../assets/swaplotting/model.js';
import {createSwaplotting} from '../assets/swaplotting/controller.js';
import {swaplottingPhotosView,swaplottingView} from '../assets/swaplotting/view.js';

const origin='https://sentuh.example.test';
const path=index=>`blob:${origin}/00000000-0000-4000-8000-${String(index).padStart(12,'0')}`;
const profile={userLevel:2,isIkd:false,nama:' raw ',nomorHp:' phone ',email:' email '};
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve};};
function harness(options={}){
 const calls=[],changes=[];let active=true;
 const read=options.read??(async kind=>kind==='disclaimer'?{}:kind==='offices'?[{KantorId:'A',Nama:'A'},{KantorId:'B',Nama:'B'}]:[{WilayahId:'r1',Nama:'R1'},{WilayahId:'r2',Nama:'R2'}]);
 const c=createSwaplotting({photoOrigin:origin,profile,...options,read:(kind,values)=>{calls.push({kind,values:structuredClone(values)});return read(kind,values);},changed:state=>changes.push(state),isCurrent:()=>active});
 return {c,calls,changes,retire:()=>{active=false;}};
}
async function form(kind='registered',options={}){const h=harness(options);await h.c.loadDisclaimer();await h.c.openForm(kind);return h;}

test('browser photo paths preserve exact same-origin object URL strings on public/local IPv4 and IPv6 origins',()=>{
 for(const site of [origin,'http://localhost:4173','http://127.0.0.1:4173','https://sentuh.davay.space','http://[::1]:4173']){
  const value=`blob:${site}/d5365879-3cb3-4fea-8a7b-154775216e58`;
  assert.equal(swaplottingPhotoPath(value,site),value);
 }
});

test('remote/data/script/file URLs and malformed, escaped, cross-origin or noncanonical blob paths are refused',()=>{
 for(const value of [null,undefined,3,new String(path(1)),`https://${origin}/a.jpg`,'javascript:alert(1)','data:image/png;base64,AA==','file:///image.jpg','blob:nodedata:00000000-0000-4000-8000-000000000001',`blob:null/00000000-0000-4000-8000-000000000001`,path(1).replace(origin,'https://evil.example'),path(1).replace(origin,origin+':443'),path(1)+'?x=1',path(1)+'#x',' '+path(1),path(1)+'\n',path(1)+'" onerror="alert(1)',path(1).replace('/00000000','/%300000000'),`blob:${origin}/not-a-browser-object-url`])assert.equal(swaplottingPhotoPath(value,origin),null,String(value));
 for(const site of [undefined,null,'null','https://user:secret@sentuh.example.test',origin+'/',origin+'/path',origin+'?q=1','ftp://example.test',origin+'#x'])assert.equal(swaplottingPhotoPath(path(1),site),null,String(site));
});

test('native aggregate predicates retain exactly nine/fourteen raw checks, independently of browser photo URL policy',()=>{
 for(const [kind,count]of [['registered',9],['unregistered',14]]){
  const input={fields:swaplottingEmptyFields(),photos:null};assert.equal(swaplottingValidate(kind,input).missing.length,count);
  input.photos=['native-local-path-not-a-browser-URL'];const result=swaplottingValidate(kind,input);assert.equal(result.flags.photos,false);assert.equal(result.missing.length,count-1);
 }
});

test('photo-list methods require current active form, perform no device/network work, and expose no upload operation',async()=>{
 const h=harness();assert.equal(h.c.applyPhoto(path(1)),false);assert.equal(h.c.removePhoto(path(1)),false);assert.deepEqual(h.calls,[]);
 await h.c.loadDisclaimer();await h.c.openForm('registered');const calls=structuredClone(h.calls);assert.equal(h.c.applyPhoto(path(1)),true);assert.equal(h.c.removePhoto(path(1)),true);assert.deepEqual(h.calls,calls);
 for(const name of ['upload','submit','camera','sendOtp','gallery','save'])assert.equal(h.c[name],undefined);
 h.c.backToMap();assert.equal(h.c.applyPhoto(path(2)),false);
});

test('add cap applies at five while existing-path retake remains enabled at capacity',async()=>{
 const {c}=await form();for(let i=1;i<=5;i++)assert.equal(c.applyPhoto(path(i)),true);
 const before=c.snapshot();assert.equal(c.applyPhoto(path(6)),false);assert.deepEqual(c.snapshot(),before);
 assert.equal(c.applyPhoto(path(6),path(3)),true);assert.deepEqual(c.snapshot().photos,[path(1),path(2),path(6),path(4),path(5)]);
 assert.equal(c.snapshot().photos.length,5);
});

test('retake maps every exact old String path rather than substituting a numeric or array index',async()=>{
 const {c}=await form();for(const value of [path(1),path(2),path(1)])assert.equal(c.applyPhoto(value),true);
 assert.equal(c.applyPhoto(path(3),path(1)),true);assert.deepEqual(c.snapshot().photos,[path(3),path(2),path(3)]);
 for(const old of [0,1,'0','1',false,{},path(99)]){const before=c.snapshot();assert.equal(c.applyPhoto(path(4),old),false);assert.deepEqual(c.snapshot(),before);}
});

test('removal filters all equal paths, leaves other ordering and rejects missing values without an emission',async()=>{
 const h=await form();for(const value of [path(1),path(2),path(1),path(3)])h.c.applyPhoto(value);
 assert.equal(h.c.removePhoto(path(1)),true);assert.deepEqual(h.c.snapshot().photos,[path(2),path(3)]);
 const before=h.c.snapshot(),emits=h.changes.length;assert.equal(h.c.removePhoto(path(1)),false);assert.equal(h.c.removePhoto(0),false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,emits);
 assert.equal(h.c.removePhoto(path(2)),true);assert.equal(h.c.removePhoto(path(3)),true);assert.deepEqual(h.c.snapshot().photos,[]);
});

test('invalid new photo URL does not mutate prior paths, validation, revision or generation',async()=>{
 const h=await form();h.c.applyPhoto(path(1));h.c.validate();const before=h.c.snapshot(),emits=h.changes.length;
 for(const value of ['https://evil.example/image.jpg','data:image/jpeg;base64,x',path(2).replace(origin,'https://other.example'),'',null,{},0])assert.equal(h.c.applyPhoto(value,path(1)),false);
 assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,emits);
});

test('snapshot and changed callback photo arrays cannot alter live controller state or its origin policy',async()=>{
 const h=await form();h.c.applyPhoto(path(1));const snapshot=h.c.snapshot();snapshot.photos.push(path(2));snapshot.photoOrigin='https://evil.example';snapshot.photoGeneration=-1;h.changes.at(-1).photos[0]=path(3);
 assert.deepEqual(h.c.snapshot().photos,[path(1)]);assert.equal(h.c.snapshot().photoOrigin,origin);assert.ok(h.c.snapshot().photoGeneration>0);assert.equal(h.c.applyPhoto(path(4).replace(origin,'https://evil.example')),false);
});

test('photo mutation reevaluates existing nine/fourteen validation but never implicitly validates untouched form',async()=>{
 for(const [kind,count]of [['registered',9],['unregistered',14]]){
  const {c}=await form(kind,{profile:null});assert.equal(c.snapshot().validation,null);c.applyPhoto(path(1));assert.equal(c.snapshot().validation,null);c.validate();assert.equal(c.snapshot().validation.missing.length,count-1);assert.equal(c.snapshot().validation.flags.photos,false);
  c.applyPhoto(path(2),path(1));assert.equal(c.snapshot().validation.flags.photos,false);c.removePhoto(path(2));assert.equal(c.snapshot().validation.missing.length,count);assert.equal(c.snapshot().validation.flags.photos,true);
 }
});

test('raw land-field edits and validation retain committed paths and pending-photo generation',async()=>{
 const {c}=await form();c.applyPhoto(path(1));const generation=c.snapshot().photoGeneration;
 assert.equal(c.setField('number','  00<&>  '),true);c.setField('review',' ');c.validate();assert.equal(c.snapshot().photoGeneration,generation);assert.deepEqual(c.snapshot().photos,[path(1)]);assert.equal(c.snapshot().fields.number,'  00<&>  ');
});

test('registered office/desa/right and profile changes retire pending-photo generation without erasing existing paths',async()=>{
 const h=await form();h.c.applyPhoto(path(1));let generation=h.c.snapshot().photoGeneration;
 for(const action of [()=>h.c.selectOffice(0),()=>h.c.selectRegion(0),()=>h.c.selectRight('1'),()=>h.c.setProfile({...profile,nama:' changed '})]){
  await action();assert.ok(h.c.snapshot().photoGeneration>generation);generation=h.c.snapshot().photoGeneration;assert.deepEqual(h.c.snapshot().photos,[path(1)]);
 }
 const before=h.c.snapshot().photoGeneration;h.c.selectRight('1');h.c.selectRegion(0);h.c.setProfile({...profile,nama:' changed '});assert.equal(h.c.snapshot().photoGeneration,before);
 await h.c.loadOffices();assert.ok(h.c.snapshot().photoGeneration>before);assert.deepEqual(h.c.snapshot().photos,[path(1)]);
});

test('unregistered proof changes invalidate pending actions and retain photos, including owner revocation',async()=>{
 const {c}=await form('unregistered');c.applyPhoto(path(1));let generation=c.snapshot().photoGeneration;
 for(const action of [()=>c.selectBasis(0),()=>c.selectTax(0),()=>c.setProfile(null)]){action();assert.ok(c.snapshot().photoGeneration>generation);generation=c.snapshot().photoGeneration;assert.deepEqual(c.snapshot().photos,[path(1)]);}
 c.selectBasis(0);c.selectTax(0);c.setProfile(null);assert.equal(c.snapshot().photoGeneration,generation);assert.equal(c.snapshot().owner.status,'unresolved');
});

test('form/map transitions clear photos and advance generation; subsequent form is a fresh draft',async()=>{
 const {c}=await form();c.applyPhoto(path(1));let generation=c.snapshot().photoGeneration;c.backToMap();assert.equal(c.snapshot().photos,null);assert.ok(c.snapshot().photoGeneration>generation);generation=c.snapshot().photoGeneration;
 c.setCameraTarget({lat:-6,lng:106});assert.ok(c.snapshot().photoGeneration>generation);await c.openForm('unregistered');assert.equal(c.snapshot().photos,null);c.applyPhoto(path(2));generation=c.snapshot().photoGeneration;await c.openForm('registered');assert.equal(c.snapshot().photos,null);assert.ok(c.snapshot().photoGeneration>generation);
});

test('session retirement/disposal refuse late commits; disposal clears private photos and later reads cannot restore them',async()=>{
 for(const dispose of [false,true]){
  const pending=deferred();let officeCount=0;const h=await form('registered',{read:async kind=>kind==='disclaimer'?{}:++officeCount===1?[]:pending.promise});h.c.applyPhoto(path(1));const reloading=h.c.loadOffices(),before=h.c.snapshot(),emits=h.changes.length;
  if(dispose)h.c.dispose();else h.retire();assert.equal(h.c.applyPhoto(path(2)),false);assert.equal(h.c.removePhoto(path(1)),false);pending.resolve([{KantorId:'late'}]);await reloading;assert.equal(h.changes.length,emits);
  if(dispose){assert.equal(h.c.snapshot().photos,null);assert.equal(h.c.snapshot().screen,'disposed');assert.ok(h.c.snapshot().photoGeneration>before.photoGeneration);assert.deepEqual(h.c.snapshot().offices,[]);}else assert.deepEqual(h.c.snapshot().photos,[path(1)]);
 }
});

test('empty photo view offers explicit add only, native limit and honest temporary draft copy',async()=>{
 const {c}=await form();const model=c.snapshot(),before=structuredClone(model),html=swaplottingPhotosView(model);
 assert.match(html,/data-swaplotting-photos/);assert.match(html,/id="swaplotting-photos"[^>]*data-action="swaplotting-photo-add"/);assert.doesNotMatch(html,/<button[^>]*disabled|<img|type="file"|capture=|fetch\(|<form/);assert.match(html,/Maksimal 5 foto/);assert.match(html,/hingga Anda meninggalkan formulir atau sesi berakhir/);assert.match(html,/Belum diunggah atau diverifikasi/);assert.deepEqual(model,before);
});

test('full list disables only add and exposes exact numerical snapshot indices for host-resolved old String paths',async()=>{
 const {c}=await form();for(let i=1;i<=5;i++)c.applyPhoto(path(i));const html=swaplottingPhotosView(c.snapshot());
 assert.equal((html.match(/<img /g)??[]).length,5);assert.match(html,/<button[^>]*data-action="swaplotting-photo-add"[^>]*disabled/);
 for(let i=0;i<5;i++){assert.match(html,new RegExp(`data-action="swaplotting-photo-retake" data-photo-index="${i}"`));assert.match(html,new RegExp(`data-action="swaplotting-photo-remove" data-photo-index="${i}"`));}
 assert.doesNotMatch(html,/<button[^>]*data-action="swaplotting-photo-(?:retake|remove)"[^>]*disabled/);assert.equal((html.match(/src="blob:https:\/\/sentuh\.example\.test\//g)??[]).length,5);
 const formHtml=swaplottingView(c.snapshot());assert.match(formHtml,/<button[^>]*disabled[^>]*>Kirim<\/button>/);assert.doesNotMatch(formHtml,/type="file"|multipart\/form-data|name="photos"/);
});

test('forged snapshot paths never become remote/HTML image sources and valid thumbnails retain original list indices',()=>{
 const model={photos:[path(1),'https://evil.example/image.jpg','" onerror="alert(1)',path(4),'data:image/svg+xml,<svg onload=alert(1)>'],photoOrigin:origin};const before=structuredClone(model),html=swaplottingPhotosView(model);
 assert.equal((html.match(/<img /g)??[]).length,2);assert.match(html,/data-photo-index="0"/);assert.match(html,/data-photo-index="3"/);assert.doesNotMatch(html,/data-photo-index="[124]"|evil\.example|onerror=|onload=|<svg|data:image/);assert.deepEqual(model,before);
});

test('photo controls live in a labelled group, so thumbnails/captions have no label-to-Add activation',async()=>{
 const {c}=await form();c.applyPhoto(path(1));const html=swaplottingView(c.snapshot());
 assert.match(html,/<div class="parameter-field" role="group" aria-labelledby="swaplotting-photo-label"><span id="swaplotting-photo-label">Foto Dokumen<\/span><div class="swaplotting-photo-boundary" data-swaplotting-photos>/);
 assert.doesNotMatch(html,/<label[^>]*for="swaplotting-photos"/);
 for(const marker of ['id="swaplotting-photos"','id="swaplotting-error-photos"','data-action="swaplotting-photo-add"','data-action="swaplotting-photo-retake"','data-action="swaplotting-photo-remove"'])assert.ok(html.includes(marker));
});
