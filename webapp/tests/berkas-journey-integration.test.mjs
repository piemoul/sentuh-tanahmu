import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {harness} from './support/account-verification-ui-harness.mjs';
import {journeySnapshotFromBerkas} from '../assets/berkas-journey/model.js';
import {createBerkasJourneyHost} from '../assets/berkas-journey/host.js';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split('\n');
const actual=name=>{const line=lines.find(line=>line.startsWith('function '+name+'(')||line.startsWith('async function '+name+'('));assert.ok(line,name);return line;};
const domSource=fs.readFileSync(new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url),'utf8');
const dom=vm.runInNewContext('('+domSource.slice(domSource.indexOf('function dom(document){'),domSource.indexOf('function setup('))+')');
const sameNodes=(actual,expected)=>{assert.equal(actual.length,expected.length);expected.forEach((node,index)=>assert.equal(actual[index],node));};
const plain=value=>JSON.parse(JSON.stringify(value));
const primary=(rows=[{taskNodeGroupId:' original-group ',namaGrup:'Stage original',tanggalFlow:' raw-date ',isCurrent:true}],status=1)=>({status:200,data:{data:{berkasId:'original-primary-id',nomor:123,tahun:2026,statusBerkas:status,namaProsedur:'Original procedure',perjalananBerkas:rows}}});
function setup(kind='files',tab='berjalan'){
 const h=harness(),{c,document,state,modal}=h;dom(document);
 const prototype=Object.getPrototypeOf(document.body);if(!prototype.removeAttribute)prototype.removeAttribute=function(name){this.attributes.delete(name);};
 const app=document.body.appendChild(document.createElement('div'));app.setAttribute('id','app');
 let main=app.appendChild(document.createElement('main'));main.setAttribute('id','main');
 const item={berkasId:' original-id ',contentId:' original-id :2026',type:'BERKAS',activityType:'Berkas',subTitle:''},sourceRows=[item],response={status:200,data:{data:sourceRows}},reader={loading:false,response,rows:sourceRows},groups={selectedGroup:null,response:{status:200,data:[]}},apiCalls=h.calls;
 const route=kind==='collection'?'collections':kind==='search'?'searchfile':kind==='activity'?'activity':'files',key=kind==='collection'?'collections:koleksi':kind==='activity'?'activity:default':`files:${tab}`;
 c.flowResults.set(key,reader);if(kind==='collection')c.flowResults.set('collections:grup',groups);state.operations.push({id:'get-berkas-cariberkas-test',endpoint:'/berkas/CariBerkas',enabled:true,effect:'read'});
 Object.assign(c,{route,flowTab:kind==='collection'?'koleksi':kind==='files'?tab:'',flowDetail:item,flowQuery:' raw original query ',flowPageIndex:4,journeySnapshotFromBerkas,createBerkasJourneyHost,certificateDateDisplay:value=>'DATE '+value,journeyTimeDisplay:value=>'TIME '+value,currentFlow:()=>({key:`files:${c.flowTab||'berjalan'}`}),collectionTab:()=>c.flowTab==='grup'?'grup':'koleksi',certificateText:value=>String(value??'-'),certificateFacts:()=>'',berkasParties:()=>'',berkasOffice:()=>'',berkasStatus:value=>String(value),result:()=>'<p>unrecognized</p>',json:value=>JSON.stringify(value),empty:()=>'<p>Loading</p>',berkasBookmarkForDetail:()=>null,parcelMapView:()=>'<p>parcel</p>',persilMapActionView:()=>'',persilMapForDetail:()=>null,supplements:0,loadBerkasSections:async()=>{c.supplements++;},collectionDetailView:(res,type)=>type==='BERKAS'?c.berkasDetailView(res):'<p>parcel</p>',renders:0,shellCalls:0,render:()=>c.renders++});
 vm.runInContext(['flowData','dataItems','isBerkasDetail','berkasDetailTarget','collectionDetailTarget','activityItem','nativeResponseObject','activityRows','activityDetailTarget','berkasSection','berkasJourneyCurrent','berkasJourney','berkasReadSection','berkasDetailView','berkasJourneyOwnerCurrent','berkasJourneyMount','berkasJourneyPaint','openBerkasJourney','loadBerkasDetail','loadCollectionDetail','loadActivityDetail'].map(actual).join('\n'),c);
 const loader=kind==='collection'?'loadCollectionDetail':kind==='activity'?'loadActivityDetail':'loadBerkasDetail';
 const mount=(res=primary())=>{const html=c.berkasDetailView(res);if(kind==='search'){c.searchFileState={response:res,busy:false,nomor:'00123',tahun:'2026',captcha:'123456',captchaInput:' untouched ',officeQuery:' raw office ',officePage:2,selectedOffice:{KantorId:'original-office'}};main.innerHTML=`<h1>Parent search</h1><button data-action="searchfile-back">Search back</button>${html}`;c.berkasJourneyPaint();}else{modal.innerHTML=`<h2 id="parent-title">Parent detail</h2><input id="parent-input" value=" untouched ">${html}<button data-action="modal-close">Close</button>`;modal.showModal();c.berkasJourneyMount(res,{kind,epoch:c.sessionEpoch,sequence:c.detailSequence,current:()=>c.flowResults.get(key)===reader&&reader.response===response&&reader.rows===sourceRows&&sourceRows.includes(item)},modal);}return c.flowResults.get('berkas:journey');};
 const owner=()=>c.flowResults.get('berkas:journey'),button=()=>owner()?.button,root=()=>kind==='search'?main:modal;
 const realRender=()=>{Object.assign(c,{selected:null,dashboard:()=>'',serviceDirectory:()=>'',catalog:()=>'',coordinatePage:()=>'',testing:()=>'',account:()=>'',flowDefinitions:{searchfile:{}},flowPage:()=>c.berkasDetailView(c.searchFileState.response),externalPages:{},profileMenus:[],externalPage:()=>'',profileSection:()=>'',unavailablePage:()=>'',routes:{searchfile:'Cari Berkas'},berkasBookmarkPaint(){},persilMapPaint(){},scanPaint(){},homeMediaPaint(){},shell(){c.shellCalls++;main.remove();main=app.appendChild(document.createElement('main'));main.setAttribute('id','main');}});vm.runInContext(actual('render'),c);};
 return{...h,item,reader,response,sourceRows,groups,key,apiCalls,mount,owner,button,root,realRender,get main(){return main;},async load(res=primary()){const work=c[loader](item);assert.equal(apiCalls.length,1);apiCalls[0].resolve({result:res});await work;return owner();},clickBack(){const child=root().querySelector('[data-berkas-journey-child]'),target=child?.querySelector('[data-berkas-journey-back]');assert.ok(target);for(const fn of [...child.listeners.get('click')??[]])fn({target,preventDefault(){}});}};
}

test('actual Berkas berjalan/selesai and Koleksi/Aktivitas loaders bind only their primary ABb without another request',async()=>{
 for(const [kind,tab] of [['files','berjalan'],['files','selesai'],['collection','koleksi'],['activity','']]){const h=setup(kind,tab),res=primary(),owner=await h.load(res);assert.ok(owner,kind+' '+tab);assert.equal(owner.response,res);assert.equal(owner.data,res.data.data);assert.equal(owner.kind,kind);assert.equal(h.apiCalls.length,1);assert.deepEqual(plain(h.apiCalls[0].options.body.values),{berkasId:kind==='files'?' original-id ':' original-id '});assert.equal(h.c.supplements,1);assert.equal(h.root().querySelector('.berkas-history'),null);assert.equal(h.c.openBerkasJourney(owner.button),true);assert.equal(h.apiCalls.length,1);}
});

test('Cari Berkas binds the loaded primary response and keeps all search/CAPTCHA state unchanged',()=>{
 const h=setup('search'),owner=h.mount(),before=plain(h.c.searchFileState),query=h.c.flowQuery,page=h.c.flowPageIndex,sequence=h.c.detailSequence,nodes=Array.from(h.main.childNodes);assert.ok(owner);assert.equal(h.c.openBerkasJourney(h.button()),true);assert.deepEqual(plain(h.c.searchFileState),before);h.clickBack();sameNodes(h.main.childNodes,nodes);assert.equal(h.c.flowQuery,query);assert.equal(h.c.flowPageIndex,page);assert.equal(h.c.detailSequence,sequence);assert.deepEqual(plain(h.c.searchFileState),before);assert.equal(h.apiCalls.length,0);assert.equal(h.c.renders,0);
});

test('local Back restores exact parent DOM, input value, scroll and opener; reopened snapshot ignores later source mutation',()=>{
 const h=setup(),res=primary(),owner=h.mount(res),root=h.root(),nodes=Array.from(root.childNodes),input=root.querySelector('#parent-input');input.value='changed without repaint';root.scrollTop=92;h.button().focus();const snapshot=owner.snapshot;assert.equal(h.c.openBerkasJourney(h.button()),true);assert.equal(input.isConnected,true);assert.equal(input.closest('[hidden]').getAttribute('inert'),'');res.data.data.perjalananBerkas[0].namaGrup='MUTATED';h.clickBack();sameNodes(root.childNodes,nodes);assert.equal(input.value,'changed without repaint');assert.equal(root.scrollTop,92);assert.equal(h.document.activeElement,h.button());assert.equal(owner.snapshot,snapshot);assert.equal(h.c.openBerkasJourney(h.button()),true);assert.match(root.querySelector('[data-berkas-journey-child]').textContent,/Stage original/);assert.doesNotMatch(root.querySelector('[data-berkas-journey-child]').textContent,/MUTATED/);assert.equal(h.apiCalls.length,0);assert.equal(h.c.detailSequence,7);
});

test('empty list is a valid child, status zero inserts native placeholder, null/invalid lists are locally unavailable',()=>{
 for(const [rows,status,allowed,count] of [[[],1,true,0],[[],0,true,1],[null,1,false,0],[[{namaGrup:42}],1,false,0]]){const h=setup(),owner=h.mount(primary(rows,status));assert.ok(owner);assert.equal(h.button().disabled,!allowed);assert.equal(h.c.openBerkasJourney(h.button()),allowed);if(allowed)assert.equal(owner.snapshot.rows.length,count);else assert.match(h.root().textContent,/Data perjalanan berkas belum dapat ditampilkan/);assert.equal(h.apiCalls.length,0);}
});

test('only the exact connected owner button may open; detached copies, inert controls and changed primary identities are rejected',()=>{
 for(const mutate of [h=>h.button().remove(),h=>h.button().disabled=true,h=>h.root().setAttribute('inert',''),h=>h.c.state.authenticated=false,h=>h.c.logoutPending=true,h=>h.c.sessionEpoch++,h=>h.c.detailSequence++,h=>h.c.route='services',h=>h.reader.response={...h.response},h=>h.reader.rows=[...h.sourceRows],h=>h.sourceRows.splice(0),h=>h.owner().response.data.data={...h.owner().data},h=>h.owner().detail.remove()]){const h=setup();h.mount();const button=h.button();mutate(h);assert.equal(h.c.openBerkasJourney(button),false);assert.equal(h.apiCalls.length,0);}
 const h=setup();h.mount();const clone=h.document.createElement('button');clone.setAttribute('data-action','berkas-journey-open');h.owner().section.appendChild(clone);assert.equal(h.c.openBerkasJourney(clone),false);
});

test('loader source guards invalidate files tab/reader/array, collection group, and activity parent replacements',async()=>{
 for(const [kind,mutate] of [['files',h=>h.c.flowTab='selesai'],['files',h=>h.c.flowResults.set(h.key,{...h.reader})],['files',h=>h.response.data.data=[...h.sourceRows]],['collection',h=>h.c.flowResults.set('collections:grup',{...h.groups})],['collection',h=>h.groups.response={}],['collection',h=>h.groups.selectedGroup={groupId:'replacement'}],['activity',h=>h.response.data.data=[...h.sourceRows]],['activity',h=>h.reader.loading=true]]){const h=setup(kind),owner=await h.load();assert.ok(owner,kind);mutate(h);assert.equal(owner.current(),false,kind);assert.equal(h.c.openBerkasJourney(owner.button),false);}
});

test('late primary from a retired source cannot mount a journey owner, including changed Berkas tab',async()=>{
 for(const kind of ['files','collection','activity']){const h=setup(kind),work=h.c[kind==='files'?'loadBerkasDetail':kind==='collection'?'loadCollectionDetail':'loadActivityDetail'](h.item);h.c.flowResults.set(h.key,{...h.reader});h.modal.innerHTML='<p>Newer parent</p>';h.apiCalls[0].resolve({result:primary()});await work;assert.equal(h.owner(),undefined,kind);assert.equal(h.modal.innerHTML,'<p>Newer parent</p>',kind);assert.equal(h.records.length,0,kind);}
 const h=setup(),work=h.c.loadBerkasDetail(h.item);h.c.flowTab='selesai';h.apiCalls[0].resolve({result:primary()});await work;assert.equal(h.owner(),undefined);
});

test('a delayed primary authentication failure from a replaced Berkas source cannot expire the current account',async()=>{
 const h=setup(),epoch=h.c.sessionEpoch,work=h.c.loadBerkasDetail(h.item);h.c.flowResults.set(h.key,{...h.reader});h.modal.innerHTML='<p>Newer current account view</p>';h.apiCalls[0].reject(Object.assign(new Error('Old source expired'),{code:'SESSION_EXPIRED'}));await work;assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.authenticated,true);assert.equal(h.modal.innerHTML,'<p>Newer current account view</p>');assert.equal(h.toasts.length,0);assert.equal(h.records.length,0);
});

test('modal Escape is local Back first; a subsequent Escape closes and releases the source owner',()=>{
 const h=setup();const owner=h.mount();assert.equal(h.c.openBerkasJourney(h.button()),true);assert.equal(h.escape().defaultPrevented,true);assert.equal(h.root().open,true);assert.equal(owner.host.active,false);assert.equal(h.owner(),owner);assert.equal(h.escape().defaultPrevented,false);assert.equal(h.root().open,false);assert.equal(h.owner(),undefined);for(const key of ['context','response','data','root','detail','section','button','snapshot','host'])assert.equal(owner[key],null,key);assert.equal(h.apiCalls.length,0);
});

test('Cari Berkas render guard precedes shell, while Escape restores the retained result without repaint',()=>{
 const h=setup('search');h.mount();h.realRender();const main=h.main,nodes=Array.from(main.childNodes);assert.equal(h.c.openBerkasJourney(h.button()),true);h.c.render();assert.equal(h.c.shellCalls,0);assert.equal(h.main,main);vm.runInContext(lines.find(line=>line.startsWith("document.addEventListener('keydown',")),h.c);const event={key:'Escape',defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for(const fn of h.document.listeners.get('keydown')??[])fn(event);assert.equal(event.defaultPrevented,true);sameNodes(h.main.childNodes,nodes);assert.equal(h.c.shellCalls,0);assert.equal(h.apiCalls.length,0);
});

test('source/session invalidation during a search child allows fresh render and never restores stale private nodes',()=>{
 for(const mutate of [h=>h.c.sessionEpoch++,h=>h.c.searchFileState.response=primary([]),h=>h.c.route='account']){const h=setup('search');h.mount();h.realRender();const owner=h.owner(),oldMain=h.main;h.c.openBerkasJourney(h.button());mutate(h);h.c.render();assert.equal(h.c.shellCalls,1);assert.notEqual(h.main,oldMain);assert.equal(owner.alive,false);assert.equal(owner.host,null);assert.equal(owner.context,null);assert.equal(oldMain.querySelector('[data-berkas-journey-parent]'),null);assert.equal(oldMain.querySelector('[data-berkas-journey-child]'),null);}
});

test('clearPrivate/navigation/list reload dispose a child and erase all retained private source references',async()=>{
 for(const action of ['clearPrivate','navigate','runFlow']){const h=setup(),owner=h.mount();h.c.openBerkasJourney(h.button());if(action==='runFlow')h.c.currentFlow=()=>null;await h.c[action]();assert.equal(h.owner(),undefined,action);assert.equal(owner.alive,false,action);for(const key of ['context','response','data','root','detail','section','button','snapshot','host'])assert.equal(owner[key],null,action+' '+key);assert.equal(h.root().querySelector('[data-berkas-journey-parent]'),null);assert.equal(h.apiCalls.length,0);}
});

test('retiring a modal source closes its owned dialog, while a newer replacement dialog stays open',async()=>{
 for(const action of ['render','runFlow']){const h=setup(),owner=h.mount();h.c.openBerkasJourney(h.button());if(action==='render'){h.realRender();h.c.flowResults.set(h.key,{...h.reader});}else h.c.currentFlow=()=>null;await h.c[action]();assert.equal(h.modal.open,false,action);assert.equal(owner.alive,false);assert.equal(owner.host,null);assert.equal(h.owner(),undefined);}
 for(const action of ['render','runFlow']){const h=setup(),owner=h.mount();h.c.openBerkasJourney(h.button());h.modal.innerHTML='<h2>New unrelated dialog</h2>';if(action==='render')h.realRender();else h.c.currentFlow=()=>null;await h.c[action]();assert.equal(h.modal.open,true,action);assert.equal(h.modal.innerHTML,'<h2>New unrelated dialog</h2>');assert.equal(owner.alive,false);assert.equal(h.owner(),undefined);}
});

test('global entry handler opens the actual host without dispatching a transport or parent reload',async()=>{
 const h=setup();h.mount();vm.runInContext(lines.find(line=>line.startsWith("document.addEventListener('click',async event=>{")),h.c);await h.click(h.button());assert.equal(h.owner().host.active,true);assert.equal(h.apiCalls.length,0);assert.equal(h.c.renders,0);
});

test('legacy detail/collapsed renderers remain byte-identical to the preserved preimage',()=>{
 const bytes=fs.readFileSync(new URL('../../environment/berkas-journey-runtime/app-before.js',import.meta.url)),baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/berkas-journey-baseline.json',import.meta.url)));assert.equal(createHash('sha256').update(bytes).digest('hex'),baseline.runtime.find(row=>row.file==='webapp/app.js').sha256);const before=bytes.toString('utf8').split('\n');for(const name of ['berkasDetailView','berkasJourney','berkasJourneyCurrent'])assert.equal(actual(name),before.find(line=>line.startsWith('function '+name+'(')),name);assert.equal(source.includes('\r'),false);
});
