// Actual-source Berita/Pengumuman regression. Every API response is synthetic.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const read = path => fs.readFileSync(new URL('../../' + path, import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const sourcePath = 'webapp/app.js', bytes = read(sourcePath), source = bytes.toString('utf8');
const lines = source.split(/\r?\n/), extractedFunctions = new Set();
const get = name => {
  const line = lines.find(value => new RegExp('^(async )?function ' + name + '\\(').test(value));
  assert.ok(line, 'Missing actual function ' + name);
  extractedFunctions.add(name);
  return line;
};
const definitions = source.match(/const flowDefinitions=(\{[\s\S]*?\n\});/)?.[0];
assert.ok(definitions, 'Actual flowDefinitions declaration');
const escLine = lines.find(line => line.startsWith('const $='));
const readyLine = lines.find(line => line.startsWith('const ready='));
assert.ok(escLine && readyLine);
const clickLines = lines.filter(line => line.startsWith("document.addEventListener('click'") && (line.includes('[data-action="news-reload"]') || line.includes("action==='flow-tab'")));
const imageLine = lines.find(line => line.startsWith("document.addEventListener('error'") && line.includes('data-news-banner'));
assert.equal(clickLines.length, 2, 'Actual reload and tab event handlers');
assert.ok(imageLine, 'Actual image error event handler');
const copy = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
const settle = async () => {for(let index=0;index<5;index++)await Promise.resolve();};
const row = (title='Synthetic article', extra={}) => ({id:'DUPLICATE-ID',title,category:'HIDDEN CATEGORY',banner:'https://www.atrbpn.go.id/banner.jpg',url:'https://www.atrbpn.go.id/article?q=fixture#section',...extra});
const response = (rows, extra={}) => ({status:200,data:{message:rows,...extra}});
let fixtureCalls = 0;
function harness(route='news', authenticated=true) {
  const requests=[],records=[],toasts=[],queued=[],listeners={click:[],error:[]};
  const state={authenticated,user:authenticated?{username:'synthetic-user'}:null,operations:OPERATIONS.filter(op=>['Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(op.endpoint)),results:new Map(),connection:{configured:true},loading:false,points:[],activity:[]};
  const modal={innerHTML:'',open:false,close(){this.open=false;}};
  class FixtureImage {constructor(news=true){this.news=news;this.hidden=false;}hasAttribute(name){return this.news&&name==='data-news-banner';}}
  const c=vm.createContext({
    state,URL,URLSearchParams,Map,Object,Array,JSON,String,Number,console,route,flowTab:'',flowResults:new Map(),sessionEpoch:0,
    flowDetail:null,htDetailData:null,flowQuery:'',flowPageIndex:0,detailSequence:0,comparison:null,comparisonSelection:{},pending:null,selected:null,search:'',group:'Semua',filter:'Semua',
    location:{hash:'#/'+route},routes:{dashboard:'Beranda',news:'Berita',announcements:'Pengumuman',account:'Profil'},window:{scrollTo(){}},
    document:{addEventListener:(name,fn,options)=>{(listeners[name]??=[]).push({fn,options});},body:{classList:{remove(){}}}},
    HTMLImageElement:FixtureImage,queueMicrotask:fn=>queued.push(fn),$:()=>modal,resetSearchFileNavigation(){},resetPartnerNavigation(){},
    renderCalls:0,render:()=>{c.renderCalls++;},record:(...args)=>records.push(args),toast:message=>toasts.push(message),
    icon:()=>'',badge:()=>'',head:(_eyebrow,title,description)=>'<h1>'+title+'</h1><p>'+description+'</p>',notice:value=>'<p class="notice">'+value+'</p>',
    menuTiles:()=>'',informationMenus:[],unavailablePage:()=>'',currentFlow:()=>null,
    api:(path,options)=>{fixtureCalls++;const pending=deferred();requests.push({path,options,...pending});return pending.promise;}
  });
  const names=['newsDefinition','newsItem','newsRows','newsUrl','getNewsState','newsViewActive','resetNewsNavigation','newsCardsView','newsFeedSection','newsFeedPage','loadNewsFeed','clearPrivate','resetCollectionNavigation','navigate','dashboard','flowPage'];
  vm.runInContext(definitions+'\n'+readyLine+'\nglobalThis.esc='+escLine.slice(escLine.indexOf('esc=')+4)+'\n'+names.map(get).join('\n')+'\n'+clickLines.join('\n')+'\n'+imageLine,c);
  return {
    c,state,requests,records,toasts,queued,listeners,FixtureImage,
    owner:kind=>c.getNewsState(kind),
    async flush(){while(queued.length){queued.shift()();await settle();}},
    async resolve(task,result,index=requests.length-1){requests[index].resolve({result});if(task)await task;await settle();},
    async reject(task,error,index=requests.length-1){requests[index].reject(error);if(task)await task;await settle();},
    async click(action,extra={}){const button={dataset:{action,...extra}};for(const {fn} of listeners.click)await fn({target:{closest:selector=>selector==='[data-action]'?button:selector==='[data-action="news-reload"]'&&action==='news-reload'?button:null}});await settle();},
    navigate(name){c.location.hash='#/'+name;c.navigate();}
  };
}
const checks=[];
async function check(label,basis,run,route='news',authenticated=true){
  const h=harness(route,authenticated);
  try{await run(h);checks.push({label,basis,passed:true});}
  catch(error){checks.push({label,basis,passed:false,error:error.message});}
}
await check('actual registry exposes two enabled optional-session read operations','existing operation registry',h=>{
  assert.equal(h.state.operations.length,2);
  for(const op of h.state.operations){assert.equal(op.enabled,true);assert.equal(op.effect,'read');assert.equal(op.auth,'optionalSession');assert.equal(op.method,'GET');}
  assert.equal(h.c.newsDefinition('news').endpoint,'Berita/GetBerita?limit=8');
  assert.equal(h.c.newsDefinition('announcements').endpoint,'Pengumuman/GetPengumuman?limit=5');
  assert.equal(h.c.newsDefinition('other'),null);
});
await check('native message list supports object and JSON String response bodies','NEWS-FLOW envelope',h=>{
  const rows=[row()];assert.equal(h.c.newsRows(response(rows)),rows);
  assert.deepEqual(copy(h.c.newsRows({status:200,data:JSON.stringify({message:rows})})),rows);
});
await check('only exact HTTP 200 succeeds','NEWS-FLOW status comparison',h=>{
  for(const status of [undefined,null,'200',201,204,400,500])assert.equal(h.c.newsRows({status,data:{message:[]}}),null);
});
await check('error field is ignored and data decoy is never selected','NEWS-FLOW exact message member',h=>{
  const rows=[row()];assert.equal(h.c.newsRows(response(rows,{error:true,data:[row('DECOY')]})),rows);
  for(const data of [{data:rows},{message:'none'},{message:null},{message:{}},rows,'bad JSON','null',null])assert.equal(h.c.newsRows({status:200,data}),null);
});
await check('empty message list is a valid successful result','NEWS-FLOW list mapping',h=>{
  assert.deepEqual(copy(h.c.newsRows(response([]))),[]);
});
await check('nullable and missing five native fields are accepted without invented defaults','NEWS-FLOW String nullable model',h=>{
  const nullable={id:null,title:null,category:null,banner:null,url:null};
  assert.equal(h.c.newsItem(nullable),true);assert.equal(h.c.newsItem({}),true);
  const rows=[nullable,{}];assert.equal(h.c.newsRows(response(rows)),rows);
});
for(const key of ['id','title','category','banner','url'])await check('wrong non-null '+key+' type rejects the entire list','NEWS-FLOW typed model',h=>{
  for(const value of [1,false,[],{}])assert.equal(h.c.newsRows(response([row('valid'),row('invalid',{[key]:value})])),null);
});
await check('non-record list elements fail; unrelated fields do not become article fields','NEWS-FLOW record mapping and bounded model',h=>{
  for(const item of [null,[],1,'text',true])assert.equal(h.c.newsItem(item),false);
  assert.equal(h.c.newsItem(row('valid',{unrelated:{any:true},html:'<script>bad</script>'})),true);
});
await check('cards preserve server order and every record beyond native request limits','NEWS-FLOW full list.length and index selection',h=>{
  const rows=Array.from({length:12},(_,i)=>row('ROW-'+String(i).padStart(2,'0'),{id:i%2?'SAME':null,url:'https://www.atrbpn.go.id/'+i}));
  const html=h.c.newsCardsView('news',{rows,loading:false,error:''});
  assert.equal((html.match(/class="news-card"/g)||[]).length,12);
  for(let i=1;i<12;i++)assert.ok(html.indexOf('ROW-'+String(i-1).padStart(2,'0'))<html.indexOf('ROW-'+String(i).padStart(2,'0')));
  for(let i=0;i<12;i++)assert.ok(html.includes('href="https://www.atrbpn.go.id/'+i+'"'));
  assert.doesNotMatch(html,/HIDDEN CATEGORY|data-action="flow-detail"|flow-pagination/);
  assert.equal(h.requests.length,0);
});
await check('null title/banner/url stays blank with a disabled unavailable-link card','native null fields; browser disabled-link adaptation',h=>{
  const html=h.c.newsCardsView('news',{rows:[{id:null,title:null,category:null,banner:null,url:null}],loading:false});
  assert.match(html,/<span class="news-title"><\/span>/);assert.match(html,/<button[^>]*disabled/);
  assert.doesNotMatch(html,/<img|href=|null|undefined/);
});
await check('titles and URL attributes are escaped with the actual helper','browser injection boundary',h=>{
  const title='<img src=x onerror="boom"> & \' quoted';
  const html=h.c.newsCardsView('news',{rows:[row(title,{url:'https://www.atrbpn.go.id/a?x=1&y=\'x\'',banner:'https://www.atrbpn.go.id/a?x=1&y=2'})],loading:false});
  assert.ok(html.includes(h.c.esc(title)));assert.doesNotMatch(html,/<img src=x|<script|onerror="boom"/);
  assert.match(html,/x=1&amp;y=/);assert.match(html,/target="_blank"/);assert.match(html,/rel="noopener noreferrer"/);
  assert.equal((html.match(/referrerpolicy="no-referrer"/g)||[]).length,2);
});
await check('scheme, userinfo, relative and malformed URL inputs are rejected','documented browser URL validation',h=>{
  for(const value of [null,undefined,1,{},'', '/api/state','//example.invalid/a','javascript:alert(1)','data:text/html,a','blob:https://example.invalid/a','file:///a','http://example.invalid/a','https://user:pass@example.invalid/a','https://user@example.invalid/a','not a URL','https://','https://[bad]','https://example.invalid/\nfoo','https://example.invalid/\u0000','https://example.invalid/\u007f'])assert.equal(h.c.newsUrl(value),null,String(value));
});
await check('HTTPS URL query and fragment survive browser normalization','browser link target without ID substitution',h=>{
  const raw='https://www.atrbpn.go.id/article?a=1&b=%2B#section';
  assert.equal(h.c.newsUrl(raw),raw);assert.equal(h.c.newsUrl('HTTPS://WWW.ATRBPN.GO.ID/article'),'https://www.atrbpn.go.id/article');
});
await check('invalid article URL does not suppress a valid banner; invalid banner does not suppress article','browser per-field URL guards',h=>{
  const html=h.c.newsCardsView('news',{rows:[row('A',{url:'javascript:bad'}),row('B',{banner:'javascript:bad'})]});
  assert.equal((html.match(/<button/g)||[]).length,1);assert.equal((html.match(/<a /g)||[]).length,1);
  assert.equal((html.match(/<img /g)||[]).length,1);assert.doesNotMatch(html,/javascript:/);
});
await check('four skeletons are reserved for initial loading; cached rows remain visible during refresh','native skeleton count; browser retained-cache adaptation',h=>{
  assert.equal((h.c.newsCardsView('news',{rows:null,loading:true}).match(/news-skeleton/g)||[]).length,4);
  const html=h.c.newsCardsView('news',{rows:[row('cached')],loading:true});
  assert.match(html,/cached/);assert.doesNotMatch(html,/news-skeleton/);
});
await check('actual image-error listener hides only news images without assigning a new src','browser CSP-compatible fallback',h=>{
  assert.equal(h.listeners.error.length,1);assert.equal(h.listeners.error[0].options,true);
  const good=new h.FixtureImage(),other=new h.FixtureImage(false),plain={hidden:false};
  for(const target of [good,other,plain])h.listeners.error[0].fn({target});
  assert.equal(good.hidden,true);assert.equal(other.hidden,false);assert.equal(plain.hidden,false);assert.equal(Object.hasOwn(good,'src'),false);
  h.listeners.error[0].fn({target:good});assert.equal(good.hidden,true);
});
await check('owner keys isolate feeds and replace stale generic response wrappers','browser shared feed cache ownership',h=>{
  h.c.flowResults.set('news:default',{response:response([row('generic')])});
  const news=h.owner('news'),announcement=h.owner('announcements');
  assert.notEqual(news,announcement);assert.equal(news.newsFeed,true);assert.equal(news.rows,null);
  assert.equal(h.owner('news'),news);assert.equal(h.c.getNewsState('invalid'),null);
});
await check('view activation includes dashboard and only general announcements tab','native home entries; scoped browser route adaptation',h=>{
  for(const kind of ['news','announcements']){h.c.route='dashboard';assert.equal(h.c.newsViewActive(kind),true);}
  h.c.route='announcements';for(const tab of ['', 'umum']){h.c.flowTab=tab;assert.equal(h.c.newsViewActive('announcements'),true);}
  for(const tab of ['yuridis','hilang']){h.c.flowTab=tab;assert.equal(h.c.newsViewActive('announcements'),false);}
  h.c.route='account';assert.equal(h.c.newsViewActive('news'),false);
});
await check('anonymous dashboard auto-schedules exactly one request per independent feed','native home init and optional session',async h=>{
  const html=h.c.dashboard();h.c.dashboard();assert.match(html,/Siaran Pers Kementerian/);assert.match(html,/data-news-feed="announcements"/);
  assert.equal(h.queued.length,2);await h.flush();assert.equal(h.requests.length,2);
  const ids=h.requests.map(r=>r.options.body.operationId);
  assert.equal(new Set(ids).size,2);
  for(const request of h.requests){assert.equal(request.path,'/api/execute');assert.equal(request.options.method,'POST');assert.deepEqual(copy(request.options.body.values),{});}
  await h.resolve(undefined,response([row('news')]),0);await h.resolve(undefined,response([row('announcements')]),1);
  assert.equal(h.owner('news').rows[0].title,'news');assert.equal(h.owner('announcements').rows[0].title,'announcements');assert.equal(h.state.authenticated,false);
},'dashboard',false);
await check('pending repeated renders and reload clicks cannot duplicate requests','browser request deduplication',async h=>{
  h.c.newsFeedSection('news');h.c.newsFeedSection('news');assert.equal(h.queued.length,1);await h.flush();
  h.c.newsFeedSection('news');await h.c.loadNewsFeed('news',true);assert.equal(h.requests.length,1);
  await h.resolve(undefined,response([row()]));assert.equal(h.owner('news').loading,false);
});
await check('nonempty cache is reused across home and standalone page without autoload','native nonempty cache; shared browser owner',async h=>{
  const pending=h.c.loadNewsFeed('news');await h.resolve(pending,response([row('cached')]));
  const owner=h.owner('news');h.navigate('dashboard');h.c.newsFeedSection('news');await h.flush();h.navigate('news');h.c.newsFeedPage('news');await h.flush();
  assert.equal(h.owner('news'),owner);assert.equal(h.requests.length,1);assert.equal(owner.rows[0].title,'cached');
});
await check('valid empty result does not loop on render and re-entry permits one retry','native empty may refetch on init; browser render guard',async h=>{
  h.c.newsFeedSection('news');await h.flush();await h.resolve(undefined,response([]));
  for(let i=0;i<3;i++)h.c.newsFeedSection('news');await h.flush();assert.equal(h.requests.length,1);
  assert.equal(h.owner('news').attempted,true);assert.equal(h.owner('news').error,'');
  h.navigate('account');h.navigate('news');h.c.newsFeedSection('news');await h.flush();assert.equal(h.requests.length,2);
  await h.resolve(undefined,response([row('after reentry')]));assert.equal(h.owner('news').rows[0].title,'after reentry');
});
await check('malformed first response stays an explicit error and manual retry can recover','browser strict schema and retry adaptation',async h=>{
  const pending=h.c.loadNewsFeed('news');await h.resolve(pending,{status:200,data:{data:[row('decoy')]}});
  const owner=h.owner('news');assert.equal(owner.rows,null);assert.match(owner.error,/format layanan/);assert.equal(owner.loading,false);
  h.c.newsFeedSection('news');await h.flush();assert.equal(h.requests.length,1);
  await h.click('news-reload',{kind:'news'});assert.equal(h.requests.length,2);
  await h.resolve(undefined,response([row('recovered')]));assert.equal(owner.rows[0].title,'recovered');assert.equal(owner.error,'');
});
await check('failed cached refresh retains valid rows with escaped error and explicit retry','browser cache-retention adaptation, not native failure replacement',async h=>{
  const first=h.c.loadNewsFeed('news');await h.resolve(first,response([row('retained')]));
  const owner=h.owner('news'),rows=owner.rows,cached=h.state.results.get(h.state.operations[0].id);
  const refresh=h.c.loadNewsFeed('news',true);assert.equal(owner.rows,rows);
  await h.reject(refresh,new Error('<img src=x> refresh failed'));
  assert.equal(owner.rows,rows);assert.equal(h.state.results.get(h.state.operations[0].id),cached);
  const html=h.c.newsFeedSection('news');assert.match(html,/retained/);assert.match(html,/&lt;img src=x&gt; refresh failed/);assert.doesNotMatch(html,/<img src=x>/);
});
await check('successful empty refresh replaces old rows without automatic request loop','native valid-empty replacement; browser attempt guard',async h=>{
  const first=h.c.loadNewsFeed('news');await h.resolve(first,response([row('old')]));
  const second=h.c.loadNewsFeed('news',true);await h.resolve(second,response([]));
  assert.deepEqual(copy(h.owner('news').rows),[]);h.c.newsFeedSection('news');await h.flush();assert.equal(h.requests.length,2);
});
await check('missing catalog/configuration and loading state do not consume an autoload attempt','browser init readiness',async h=>{
  const operations=h.state.operations;h.state.operations=[];h.c.newsFeedSection('news');assert.equal(h.queued.length,0);
  h.state.operations=operations;h.state.connection.configured=false;h.c.newsFeedSection('news');assert.equal(h.queued.length,0);
  h.state.connection.configured=true;h.state.loading=true;h.c.newsFeedSection('news');assert.equal(h.queued.length,0);
  assert.equal(h.owner('news').attempted,false);h.state.loading=false;h.c.newsFeedSection('news');await h.flush();assert.equal(h.requests.length,1);
  await h.resolve(undefined,response([]));
});
await check('disabled or mutating operations are never selected as feed loaders','browser registry execution boundary',async h=>{
  h.state.operations=h.state.operations.map(op=>({...op,enabled:false}));await h.c.loadNewsFeed('news');assert.equal(h.requests.length,0);
  h.state.operations=h.state.operations.map(op=>({...op,enabled:true,effect:'write'}));await h.c.loadNewsFeed('news');assert.equal(h.requests.length,0);
});
await check('queued autoload after leaving route issues no request','browser scheduled lifecycle guard',async h=>{
  h.c.newsFeedSection('news');h.navigate('account');await h.flush();assert.equal(h.requests.length,0);assert.equal(h.owner('news').loading,false);
});
for(const transition of ['owner','epoch'])await check('queued autoload rejects replaced '+transition,'browser scheduled owner/epoch guard',async h=>{
  h.c.newsFeedSection('news');
  if(transition==='owner'){h.c.flowResults.delete('news:default');h.owner('news');}else{h.c.sessionEpoch++;h.c.clearPrivate();}
  await h.flush();assert.equal(h.requests.length,0);
});
await check('navigation reset preserves successful rows while releasing pending and attempt flags','browser cached-state lifecycle',async h=>{
  const first=h.c.loadNewsFeed('news');await h.resolve(first,response([row('cached')]));
  const owner=h.owner('news'),pending=h.c.loadNewsFeed('news',true);
  h.navigate('account');assert.equal(owner.loading,false);assert.equal(owner.request,null);assert.equal(owner.scheduled,false);assert.equal(owner.attempted,false);assert.equal(owner.rows[0].title,'cached');
  await h.resolve(pending,response([row('stale')]));assert.equal(owner.rows[0].title,'cached');
});
for(const transition of ['route','owner','token','epoch'])for(const outcome of ['success','ordinary-error','auth-error'])await check('stale '+transition+' '+outcome+' cannot update cache or current session','browser route/owner/token/epoch request identity',async h=>{
  const owner=h.owner('news'),pending=h.c.loadNewsFeed('news');
  if(transition==='route')h.navigate('account');
  else if(transition==='owner'){h.c.flowResults.delete('news:default');h.owner('news');}
  else if(transition==='token')owner.request={newer:true};
  else h.c.sessionEpoch++;
  const renders=h.c.renderCalls,records=h.records.length,epoch=h.c.sessionEpoch;
  if(outcome==='success')await h.resolve(pending,response([row('stale')]));
  else await h.reject(pending,Object.assign(new Error('stale failure'),outcome==='auth-error'?{code:'SESSION_EXPIRED'}:{}));
  assert.equal(owner.rows,null);assert.equal(owner.error,'');assert.equal(h.state.results.size,0);assert.equal(h.records.length,records);assert.equal(h.toasts.length,0);
  assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.authenticated,true);assert.equal(h.c.renderCalls,renders);
});
for(const outcome of ['success','auth-error'])await check('older request '+outcome+' cannot overwrite newer successful re-entry request','browser token rotation on navigation',async h=>{
  const older=h.c.loadNewsFeed('news');h.navigate('account');h.navigate('news');const newer=h.c.loadNewsFeed('news');
  await h.resolve(newer,response([row('newest')]),1);
  if(outcome==='success')await h.resolve(older,response([row('old')]),0);
  else await h.reject(older,Object.assign(new Error('expired old'),{code:'SESSION_EXPIRED'}),0);
  assert.equal(h.owner('news').rows[0].title,'newest');assert.equal(h.owner('news').loading,false);assert.equal(h.state.authenticated,true);assert.equal(h.records.length,1);assert.equal(h.toasts.length,0);
});
await check('current auth failure clears caches and authenticated frontend state','browser current-session failure handling',async h=>{
  h.owner('announcements').rows=[row('other cache')];h.state.results.set('private',{});
  const pending=h.c.loadNewsFeed('news');await h.reject(pending,Object.assign(new Error('synthetic expired'),{code:'SESSION_EXPIRED'}));
  assert.equal(h.c.sessionEpoch,1);assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.c.flowResults.size,0);assert.equal(h.state.results.size,0);assert.equal(h.toasts.length,1);
});
await check('independent simultaneous feeds may complete in reverse order','native separate lists; browser separate pending state',async h=>{
  const news=h.c.loadNewsFeed('news'),announcement=h.c.loadNewsFeed('announcements');
  assert.equal(h.owner('news').loading,true);assert.equal(h.owner('announcements').loading,true);
  await h.resolve(announcement,response([row('announcement result')]),1);assert.equal(h.owner('news').loading,true);assert.equal(h.owner('announcements').loading,false);
  await h.resolve(news,response([row('news result')]),0);assert.equal(h.owner('news').rows[0].title,'news result');assert.equal(h.owner('announcements').rows[0].title,'announcement result');
},'dashboard');
await check('one feed non-auth error does not clear the other successful feed','browser independent failure ownership',async h=>{
  const news=h.c.loadNewsFeed('news'),announcement=h.c.loadNewsFeed('announcements');
  await h.resolve(announcement,response([row('kept')]),1);await h.reject(news,new Error('news unavailable'),0);
  assert.equal(h.owner('announcements').rows[0].title,'kept');assert.equal(h.owner('announcements').error,'');assert.match(h.owner('news').error,/unavailable/);
},'dashboard');
for(const outcome of ['success','auth-error'])await check('switching announcements tab invalidates old general-feed '+outcome,'actual flow-tab handler with request reset',async h=>{
  const pending=h.c.loadNewsFeed('announcements'),owner=h.owner('announcements');
  await h.click('flow-tab',{id:'yuridis'});assert.equal(h.c.flowTab,'yuridis');assert.equal(owner.loading,false);assert.equal(owner.request,null);
  if(outcome==='success')await h.resolve(pending,response([row('stale general')]));
  else await h.reject(pending,Object.assign(new Error('old tab auth'),{code:'SESSION_EXPIRED'}));
  assert.equal(owner.rows,null);assert.equal(h.state.authenticated,true);assert.equal(h.toasts.length,0);assert.equal(h.records.length,0);
  await h.click('flow-tab',{id:'umum'});h.c.newsFeedPage('announcements');await h.flush();assert.equal(h.requests.length,2);
  await h.resolve(undefined,response([row('current general')]));assert.equal(owner.rows[0].title,'current general');
},'announcements');
await check('switch-away-and-back before response cannot revive old announcements token','actual tab-event lifecycle race',async h=>{
  const old=h.c.loadNewsFeed('announcements');await h.click('flow-tab',{id:'hilang'});await h.click('flow-tab',{id:'umum'});
  const newer=h.c.loadNewsFeed('announcements');await h.resolve(newer,response([]),1);await h.resolve(old,response([row('stale')]),0);
  assert.deepEqual(copy(h.owner('announcements').rows),[]);assert.equal(h.records.length,1);
},'announcements');
await check('route dispatch uses news page only for news/general announcements','actual flowPage integration',h=>{
  assert.match(h.c.flowPage(),/data-news-feed="news"/);
  h.c.route='announcements';h.c.flowTab='umum';const html=h.c.flowPage();assert.match(html,/data-news-feed="announcements"/);assert.match(html,/data-id="yuridis"/);assert.match(html,/data-id="hilang"/);
  h.c.flowTab='yuridis';assert.equal(h.c.flowPage(),'');h.c.flowTab='hilang';assert.equal(h.c.flowPage(),'');
});
await check('standalone announces external navigation while home links to full feed','browser new-tab adaptation is disclosed',h=>{
  assert.match(h.c.newsFeedPage('news'),/Artikel dibuka di tab baru/);
  assert.match(h.c.newsFeedSection('news'),/href="#\/news"/);
  assert.doesNotMatch(h.c.newsFeedSection('news',true),/href="#\/news"/);
});
const evidencePaths=['analysis/NEWS-FLOW.md','analysis/recovered/news-flow/flow.json','analysis/recovered/news-flow/verification.json'];
const report={
  source:sourcePath,sha256:hash(bytes),sourceBytes:bytes.length,generatedAt:new Date().toISOString(),
  passed:checks.filter(item=>item.passed).length,failed:checks.filter(item=>!item.passed).length,checks,
  extractedFunctions:[...extractedFunctions].sort(),eventHandlers:{click:clickLines.length,imageError:1},
  network_calls:0,fixture_calls:fixtureCalls,
  nativeEvidence:evidencePaths.map(path=>({path,sha256:hash(read(path))})),
  operationRegistry:{path:'webapp/private/operations.mjs',sha256:hash(read('webapp/private/operations.mjs'))},
  harness:{path:'analysis/rea/review_news_flow.mjs',sha256:hash(fs.readFileSync(new URL(import.meta.url)))},
  scope:'Actual frontend feed parser, nullable model, cards, URL policy, cache, loader, route dispatch, navigation/reset and selected event handlers run in an isolated VM with synthetic API responses.',
  adaptations:['Separate per-feed loading instead of native shared busy.','Explicit empty/error/retry, retained cached rows on refresh failure, and per-entry attempt guard.','Absolute HTTPS URL validation, isolated external browser tab, disabled invalid links, and image-error fallback.','Navigation cancels pending feed ownership while preserving reusable nonempty lists.'],
  limits:['No production calls, login, credentials, document submissions or APK execution.','DOM, render sinks, timers/microtasks and transport are local mocks. Event handler callback logic is executed, not browser propagation or layout.','This VM suite does not test remote image availability, server CSP enforcement, browser redirects/cookies, keyboard/focus behavior, responsive CSS, or destination frame policies.','Native evidence reports are referenced by hash but native verifiers are not rerun by this suite.','Backend GET query construction and server acceptance require their separate evidence. The browser local adapter invocation is POST /api/execute.','A passing suite establishes bounded synthetic frontend behavior, not full native 1:1 parity.']
};
if(process.argv.includes('--write-report'))fs.writeFileSync(new URL('../webapp/news-flow-latest.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
